from game_capture import GameCapture
import time
import cv2
import numpy as np
from ahk import AHK


app = None

mouse_right_down_pos = None
mouse_down_pos = None
rect_mask = None
saved_mask = None

rect_masks = []
saved_masks = []
click_pos = []
offset = (0, 0)


def drag_mouse(win, start, end, velocity):
  global offset
  start = (start[0] + offset[0], start[1] + offset[1])
  end = (end[0] + offset[0], end[1] + offset[1])
  win.click(start[0], start[1], options="D NA")
  steps = int(np.sqrt((end[0] - start[0])**2 +
              (end[1] - start[1])**2) / velocity)
  for i in range(steps):
    win.click(start[0] + (end[0] - start[0]) * i / steps,
              start[1] + (end[1] - start[1]) * i / steps, options="D NA")
    time.sleep(0.01)
  win.click(end[0], end[1], options="U NA")


def click_mouse(win, pos):
  global offset
  pos = (pos[0] + offset[0], pos[1] + offset[1])
  win.click(pos[0], pos[1])


def log_mouse(event, x, y, flags, param, camera, win):
  global mouse_right_down_pos
  global mouse_down_pos
  global rect_mask
  global saved_mask
  if (event == cv2.EVENT_LBUTTONDOWN):
    print(f"Mouse Left Button Down: {x}, {y}")
    mouse_down_pos = (x, y)
  elif (event == cv2.EVENT_LBUTTONUP):
    print(f"Mouse Left Button Up: {x}, {y}")
    if mouse_down_pos and (x, y) == mouse_down_pos:
      click_mouse(win, (x, y))
    elif mouse_down_pos:
      drag_mouse(win, mouse_down_pos, (x, y), 10)
  elif (event == cv2.EVENT_RBUTTONDOWN):
    print(f"Mouse Right Button Down: {x}, {y}")
    mouse_right_down_pos = (x, y)
  elif (event == cv2.EVENT_RBUTTONUP):
    print(f"Mouse Right Button Up: {x}, {y}")
    if mouse_right_down_pos:
      rect_mask = (mouse_right_down_pos, (x, y))
      frame = camera.get_last_frame()
      saved_mask = frame.crop(min(rect_mask[0][0], rect_mask[1][0]), min(
          rect_mask[0][1], rect_mask[1][1]), max(rect_mask[0][0], rect_mask[1][0]), max(rect_mask[0][1], rect_mask[1][1]))
      print(saved_mask.frame_buffer)


def get_similarity(frame1, frame2):
  if frame1.width != frame2.width or frame1.height != frame2.height:
    raise ValueError("Frame sizes do not match")
  mse = np.sum((np.array(frame1.frame_buffer, dtype=np.float32) -
                np.array(frame2.frame_buffer, dtype=np.float32))**2)
  mse /= float(frame1.width * frame1.height * 3)
  return 1 - np.sqrt(mse) / 255.0


target = "C:\\Users\\joshu\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Google Play Games\\Arknights.lnk"
title = "Excalidraw - Google Chrome"
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
cv2.setMouseCallback(
    "Emulated", lambda *args: log_mouse(*args, camera=camera, win=win))
frame = camera.get_frame_ref()
print(frame.width, frame.height)
for control in win.list_controls():
  print(control)
  print(control.get_position())
  if abs(control.get_position().width - frame.width) < 10 and abs(control.get_position().height - frame.height) < 10:
    offset = (control.get_position().x, control.get_position().y)
    print("Offset applied", offset)

while True:
  # print(frame.width, frame.height, len(frame.frame_buffer))
  frame_buffer = frame.frame_buffer
  # cv2.imwrite("frame.png", frame_buffer)
  if rect_mask:
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
  cv2.imshow("Emulated", frame_buffer)
  k = cv2.waitKey(1)
  if k == 27:
    break
