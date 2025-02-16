import numpy as np
import cv2


class Mask:
  def __init__(self, mask, offset):
    self.offset = offset
    self.mask = mask
    self.dimensions = mask.shape[:2]

  def similarity(self, frame):
    comp_area = frame[self.offset[1]:self.offset[1] + self.dimensions[0],
                      self.offset[0]:self.offset[0] + self.dimensions[1]]
    mse = np.sum((np.array(self.mask, dtype=np.float32) -
                 np.array(comp_area, dtype=np.float32))**2)
    mse /= float(self.dimensions[0] * self.dimensions[1] * 3)
    return 1 - np.sqrt(mse) / 255.0

  def overlay(self, frame, borderThickness=0, borderColor=(0, 0, 0)):
    overlay = frame.copy()
    overlay[self.offset[1]:self.offset[1] + self.dimensions[0],
            self.offset[0]:self.offset[0] + self.dimensions[1]] = cv2.addWeighted(
                self.mask, 0.5, overlay[self.offset[1]:self.offset[1] + self.dimensions[0],
                                        self.offset[0]:self.offset[0] + self.dimensions[1]], 0.5, 0)
    if borderThickness > 0:
      cv2.rectangle(overlay, (self.offset[0], self.offset[1]), (self.offset[0] + self.dimensions[1], self.offset[1] + self.dimensions[0]),
                    borderColor, borderThickness)

    return overlay
