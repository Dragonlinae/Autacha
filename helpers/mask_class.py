import numpy as np
import cv2
from tesserocr import PyTessBaseAPI
from PIL import Image


class Mask:
  def __init__(self, mask, offset):
    self.offset = offset
    self.mask = mask
    self.image = Image.fromarray(mask)
    self.dimensions = mask.shape[:2]
    self.detection_type = "similarity"
    self.similarity_threshold = 0.9
    self.ocr_threshold = 0.0
    self.ocr_type = "string"
    self.ocr_condition = "equals"
    self.ocr_target = "target"

  @classmethod
  def crop_from_frame(cls, frame, mask_region):
    print(mask_region)
    mask_region["x"] = int(mask_region["x"])
    mask_region["y"] = int(mask_region["y"])
    mask_region["width"] = int(mask_region["width"])
    mask_region["height"] = int(mask_region["height"])
    if mask_region["width"] == 0 or mask_region["height"] == 0:
      return None
    mask = frame[mask_region["y"]:mask_region["y"] + mask_region["height"],
                 mask_region["x"]:mask_region["x"] + mask_region["width"]]
    return cls(mask, (mask_region["x"], mask_region["y"]))

  def similarity(self, frame):
    comp_area = frame[self.offset[1]:self.offset[1] + self.dimensions[0],
                      self.offset[0]:self.offset[0] + self.dimensions[1]]
    mse = np.sum((np.array(self.mask, dtype=np.float32) -
                 np.array(comp_area, dtype=np.float32))**2)
    mse /= float(self.dimensions[0] * self.dimensions[1] * 3)
    return 1 - np.sqrt(mse) / 255.0

  def ocr(self):
    with PyTessBaseAPI(path='./tessdata') as api:
      api.SetImage(self.image)
      for word, conf in zip(api.GetUTF8Text().split(), api.AllWordConfidences()):
        print(f"word: {word}, conf: {conf}")

      print(api.GetUTF8Text())

  def overlay(self, frame, borderThickness=0, borderColor=(0, 0, 0, 0)):
    overlay = frame.copy()
    overlay[self.offset[1]:self.offset[1] + self.dimensions[0],
            self.offset[0]:self.offset[0] + self.dimensions[1]] = cv2.addWeighted(
                self.mask, 0.5, overlay[self.offset[1]:self.offset[1] + self.dimensions[0],
                                        self.offset[0]:self.offset[0] + self.dimensions[1]], 0.5, 0)
    if borderThickness > 0:
      cv2.rectangle(overlay, (self.offset[0], self.offset[1]), (self.offset[0] + self.dimensions[1], self.offset[1] + self.dimensions[0]),
                    borderColor, borderThickness)

    return overlay
