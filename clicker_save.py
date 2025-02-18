from game_capture import GameCapture
import time
import cv2
import numpy as np
from threading import Thread
from ahk import AHK
import mouse_inputs

mouse_right_down_pos = None
mouse_down_pos = None
rect_mask = None
saved_mask = None

rect_masks = []
saved_masks = []
action_events = []
offset = (0, 0)


def log_mouse_threaded(event, x, y, flags, param, camera, win):
  Thread(target=log_mouse, args=(event, x, y, flags, param, camera, win)).start()


def log_mouse(event, x, y, flags, param, camera, win):
  global mouse_right_down_pos
  global mouse_down_pos
  global rect_mask
  global saved_mask
  global offset

  if (event == cv2.EVENT_LBUTTONDOWN):
    print(f"Mouse Left Button Down: {x}, {y}")
    mouse_down_pos = (x, y)

  elif (event == cv2.EVENT_LBUTTONUP):
    print(f"Mouse Left Button Up: {x}, {y}")
    if not mouse_down_pos:
      return

    action = "click" if (
        x, y) == mouse_down_pos else "drag"

    if action == "click":
      mouse_inputs.exec_mouse(win, {"type": "click", "pos": (
          x, y), "offset": offset, "repeat": 1})
    elif action == "drag":
      mouse_inputs.exec_mouse(win, {"type": "drag", "start": mouse_down_pos, "end": (
          x, y), "velocity": 10, "offset": offset, "repeat": 1})

    if rect_mask:
      if action == "click":
        action_events.append(
            {"type": "click", "pos": (x, y), "offset": offset, "repeat": 1})
      elif action == "drag":
        action_events.append({"type": "drag", "start": mouse_down_pos, "end": (
            x, y), "velocity": 10, "offset": offset, "repeat": 1})
      rect_masks.append(rect_mask)
      saved_masks.append(saved_mask)
      rect_mask = None
      saved_mask = None

    mouse_down_pos = None

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
    return -1
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
cv2.setMouseCallback(
    "Emulated", lambda *args: log_mouse(*args, camera=camera, win=win))
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
  if rect_mask is not None and saved_mask is not None:
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

# Save the click positions and masks
np.save("click_pos.npy", action_events, allow_pickle=True)
np.save("rect_masks.npy", rect_masks, allow_pickle=True)
np.save("saved_masks.npy", saved_masks, allow_pickle=True)
