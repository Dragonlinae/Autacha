from helpers.game_capture import GameCapture
from time import time, sleep
from threading import Thread
import cv2


def log_mouse(event, x, y, flags, param):
  if (event == cv2.EVENT_LBUTTONDOWN):
    print(f"Mouse Left Button Down: {x}, {y}")
  elif (event == cv2.EVENT_LBUTTONUP):
    print(f"Mouse Left Button Up: {x}, {y}")


camera = GameCapture(None)
camera.start()
while camera.get_last_frame() is None:
  sleep(0.1)

print("Capture Started")

cv2.namedWindow("Emulated", cv2.WINDOW_NORMAL)
cv2.setMouseCallback("Emulated", log_mouse)

while True:
  frame = camera.get_last_frame()
  # print(frame.width, frame.height, len(frame.frame_buffer))
  frame_buffer = frame.frame_buffer
  # cv2.imwrite("frame.png", frame_buffer)
  cv2.imshow("Emulated", frame_buffer)
  k = cv2.waitKey(1)
  if k == 27:
    break

cv2.destroyAllWindows()
