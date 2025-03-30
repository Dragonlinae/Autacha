import numpy as np
import cv2
from tesserocr import PyTessBaseAPI
from PIL import Image
import re
from numpy import ndarray
from threading import Thread, Lock
from helpers.rwlock import RWLock


class Mask:

  passable_data = ["detection_type", "similarity_threshold", "findsimilarity_threshold",
                   "ocr_threshold", "ocr_type", "ocr_condition", "ocr_target"]

  def __init__(self):
    self.mask = ndarray((0, 0, 4))
    self.dimensions = (0, 0)
    self.offset = (0, 0)
    self.detection_type = "similarity"
    self.similarity_threshold = 0.9
    self.findsimilarity_threshold = 0.9
    self.findsimilarity_lock = Lock()
    self.findsimilarity_score = 0
    self.findsimilarity_loc = (0, 0)
    self.ocr_threshold = 0.0
    self.ocr_type = "string"
    self.ocr_condition = "equals"
    self.ocr_target = ""
    self.ocr_last_read = ""
    self.ocr_lock = Lock()
    self.lock = RWLock()

  @classmethod
  def crop_from_frame(cls, frame, mask_region):
    mask_region["x"] = int(mask_region["x"])
    mask_region["y"] = int(mask_region["y"])
    mask_region["width"] = int(mask_region["width"])
    mask_region["height"] = int(mask_region["height"])
    if mask_region["width"] == 0 or mask_region["height"] == 0:
      return None
    mask = frame[mask_region["y"]:mask_region["y"] + mask_region["height"],
                 mask_region["x"]:mask_region["x"] + mask_region["width"]]
    return mask

  def clear_mask(self):
    with self.write:
      self.mask = ndarray((0, 0, 4))
      self.dimensions = (0, 0)
      self.offset = (0, 0)

  def update_mask(self, mask, offset):
    with self.write:
      self.mask = mask
      self.dimensions = mask.shape[:2]
      self.offset = offset

  def valid(self):
    return self.dimensions[0] > 0 and self.dimensions[1] > 0

  def similarity(self, frame):
    comp_area = frame[self.offset[1]:self.offset[1] + self.dimensions[0],
                      self.offset[0]:self.offset[0] + self.dimensions[1]]
    mse = np.sum((np.array(self.mask, dtype=np.float32) -
                  np.array(comp_area, dtype=np.float32))**2)
    mse /= float(self.dimensions[0] * self.dimensions[1] * 3)
    return 1 - np.sqrt(mse) / 255.0

  def findsimilarity_thread(self, frame):
    with self.read:
      try:
        res = cv2.matchTemplate(frame, self.mask, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
        self.findsimilarity_score = max_val
        self.findsimilarity_loc = max_loc
      finally:
        self.findsimilarity_lock.release()
        return self.findsimilarity_score, self.findsimilarity_loc

  def findsimilarity(self, frame):
    if self.findsimilarity_lock.acquire(blocking=False):
      Thread(target=self.findsimilarity_thread, args=[frame]).start()

    return self.findsimilarity_score, self.findsimilarity_loc

  def ocr_thread(self, frame):
    with self.read:
      try:
        with PyTessBaseAPI(path='./tessdata') as api:
          comp_area = frame[self.offset[1]:self.offset[1] + self.dimensions[0],
                            self.offset[0]:self.offset[0] + self.dimensions[1]]
          api.SetImage(Image.fromarray(comp_area))
          res = []
          for word, conf in zip(api.GetUTF8Text().split(), api.AllWordConfidences()):
            if conf >= self.ocr_threshold:
              res.append(word)
          self.ocr_last_read = ' '.join(res)
      finally:
        self.ocr_lock.release()
        return self.ocr_last_read

  def ocr(self, frame):
    if self.ocr_lock.acquire(blocking=False):
      Thread(target=self.ocr_thread, args=[frame]).start()

    return self.ocr_last_read

  def ocr_check_condition(self, text=None):
    try:
      if text is None:
        text = self.ocr_last_read

      ltext = text
      rtext = self.ocr_target

      match self.ocr_type:
        case "string":
          ltext = str(ltext)
          rtext = str(rtext)
        case "number":
          try:
            ltext = float(re.search(r"[0-9]+(\.[0-9]*)?", ltext).group())
          except (ValueError, TypeError, AttributeError):
            ltext = float('nan')

          try:
            rtext = float(re.search(r"[0-9]+(\.[0-9]*)?", rtext).group())
          except (ValueError, TypeError, AttributeError):
            rtext = float('nan')

      match self.ocr_condition:
        case "equals":
          return ltext == rtext
        case "contains":
          return rtext in ltext
        case "greater":
          return ltext > rtext
        case "greaterequal":
          return ltext >= rtext
        case "less":
          return ltext < rtext
        case "lessequal":
          return ltext <= rtext
        case "regex":
          return re.search(rtext, ltext) is not None
    except:
      return False

  def overlay(self, frame, borderThickness=0, borderColor=(0, 0, 0), text="", offset=None):
    overlay = frame.copy()
    if self.detection_type == "similarity":
      overlay[self.offset[1]:self.offset[1] + self.dimensions[0],
              self.offset[0]:self.offset[0] + self.dimensions[1]] = cv2.addWeighted(
                  self.mask, 0.5, overlay[self.offset[1]:self.offset[1] + self.dimensions[0],
                                          self.offset[0]:self.offset[0] + self.dimensions[1]], 0.5, 0)

    if self.detection_type == "findsimilarity":
      overlay[offset[1]:offset[1] + self.dimensions[0],
              offset[0]:offset[0] + self.dimensions[1]] = cv2.addWeighted(
                  self.mask, 0.5, overlay[offset[1]:offset[1] + self.dimensions[0],
                                          offset[0]:offset[0] + self.dimensions[1]], 0.5, 0)

    if borderThickness > 0:
      if self.detection_type == "findsimilarity":
        cv2.rectangle(overlay, (offset[0], offset[1]), (offset[0] + self.dimensions[1], offset[1] + self.dimensions[0]),
                      borderColor, borderThickness)
      else:
        cv2.rectangle(overlay, (self.offset[0], self.offset[1]), (self.offset[0] + self.dimensions[1], self.offset[1] + self.dimensions[0]),
                      borderColor, borderThickness)

    if text != "":
      cv2.putText(overlay, text, (30, 30),
                  cv2.FONT_HERSHEY_COMPLEX, 1, borderColor, 2)

    return overlay

  def check_condition(self, img):
    with self.read:
      if self.valid():
        match self.detection_type:
          case "similarity":
            similarity_score = self.similarity(img)
            return similarity_score > self.similarity_threshold
          case "ocr":
            ocr_text = self.ocr_thread(img)
            return self.ocr_check_condition(ocr_text)
          case "findsimilarity":
            similarity_score, position = self.findsimilarity_thread(img)
            return similarity_score > self.findsimilarity_threshold

  def get_detect_loc(self):
    with self.read:
      match self.detection_type:
        case "findsimilarity":
          return (self.findsimilarity_loc[0] + self.dimensions[1]/2, self.findsimilarity_loc[1] + self.dimensions[0]/2)
        case _:
          return (self.offset[0] + self.dimensions[1]/2, self.offset[1] + self.dimensions[0]/2)

  def get_data(self):
    with self.read:
      data = {key: getattr(self, key)
              for key in Mask.passable_data if hasattr(self, key)}
      return data

  class ReadContext:
    def __init__(self, rwlock):
      self.rwlock = rwlock

    def __enter__(self):
      self.rwlock.acquire_read()
      return self

    def __exit__(self, exc_type, exc_val, exc_tb):
      self.rwlock.release_read()

  class WriteContext:
    def __init__(self, rwlock):
      self.rwlock = rwlock

    def __enter__(self):
      self.rwlock.acquire_write()
      return self

    def __exit__(self, exc_type, exc_val, exc_tb):
      self.rwlock.release_write()

  @property
  def read(self):
    return self.ReadContext(self.lock)

  @property
  def write(self):
    return self.WriteContext(self.lock)

  def __getstate__(self):
    state = self.__dict__.copy()
    del state["lock"]
    del state["ocr_lock"]
    del state["findsimilarity_lock"]
    return state

  def __setstate__(self, state):
    self.__dict__.update(state)
    self.findsimilarity_lock = Lock()
    self.ocr_lock = Lock()
    self.lock = RWLock()
