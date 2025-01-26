from game_capture import GameCapture
import time
import cv2
import numpy as np
from ahk import AHK
import mouse_inputs

app = None

mouse_right_down_pos = None
mouse_down_pos = None
rect_mask = None
saved_mask = None

rect_masks = []
saved_masks = []
action_events = []
offset = (0, 0)

rect_masks = np.load("rect_masks.npy", allow_pickle=True)
saved_masks = np.load("saved_masks.npy", allow_pickle=True)
action_events = np.load("click_pos.npy", allow_pickle=True)


def get_similarity(frame1, frame2):
  if frame1.width != frame2.width or frame1.height != frame2.height:
    raise ValueError("Frame sizes do not match")
  mse = np.sum((np.array(frame1.frame_buffer, dtype=np.float32) -
                np.array(frame2.frame_buffer, dtype=np.float32))**2)
  mse /= float(frame1.width * frame1.height * 3)
  return 1 - np.sqrt(mse) / 255.0


target = "C:\\Users\\joshu\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Google Play Games\\Arknights.lnk"
title = "Arknights"

ahk = AHK()
ahk.run_script(
    f"Run, {target},,hide")
win = ahk.win_wait(title=title, timeout=10)
win.to_bottom()
print(win)
print(win.get_position())


camera = GameCapture(title)
camera.start()
while camera.get_last_frame() is None:
  time.sleep(0.1)

print("Capture Started")

cv2.namedWindow("Emulated", cv2.WINDOW_NORMAL)
frame = camera.get_last_frame()
print(frame.width, frame.height)
for control in win.list_controls():
  print(control)
  print(control.get_position())
  if abs(control.get_position().width - frame.width) < 10 and abs(control.get_position().height - frame.height) < 10:
    offset = (control.get_position().x, control.get_position().y)
    print("Offset applied", offset)

while True:
  frame = camera.get_last_frame()
  # print(frame.width, frame.height, len(frame.frame_buffer))
  frame_buffer = frame.frame_buffer
  # cv2.imwrite("frame.png", frame_buffer)
  for i, rect_mask, saved_mask in zip(range(len(rect_masks)), rect_masks, saved_masks):
    area = frame.crop(min(rect_mask[0][0], rect_mask[1][0]), min(
        rect_mask[0][1], rect_mask[1][1]), max(rect_mask[0][0], rect_mask[1][0]), max(rect_mask[0][1], rect_mask[1][1]))
    similarity = get_similarity(saved_mask, area)
    print(similarity)
    frame_buffer[min(rect_mask[0][1], rect_mask[1][1]):max(rect_mask[0][1], rect_mask[1][1]),
                 min(rect_mask[0][0], rect_mask[1][0]):max(rect_mask[0][0], rect_mask[1][0])] = cv2.addWeighted(
                     frame_buffer[min(rect_mask[0][1], rect_mask[1][1]):max(rect_mask[0][1], rect_mask[1][1]),
                                  min(rect_mask[0][0], rect_mask[1][0]):max(rect_mask[0][0], rect_mask[1][0])],
                     0.5, saved_mask.frame_buffer, 0.5, 0)
    if similarity < 0.9:
      frame_buffer = cv2.rectangle(
          frame_buffer, rect_mask[0], rect_mask[1], (255, 0, 0), 2)
    else:
      frame_buffer = cv2.rectangle(
          frame_buffer, rect_mask[0], rect_mask[1], (0, 255, 0), 2)
      mouse_inputs.exec_mouse(win, action_events[i])
      time.sleep(1)
  cv2.imshow("Emulated", frame_buffer)
  k = cv2.waitKey(1)
  if k == 27:
    break
