import time
import numpy as np
from ahk import AHK


class MouseInputTypes:
  CLICK = 0
  DRAG = 1


def drag_mouse(win, start, end, velocity, offset):
  start = (start[0] + offset[0], start[1] + offset[1])
  end = (end[0] + offset[0], end[1] + offset[1])
  win.click(start[0], start[1], options="D NA")
  steps = int(np.sqrt((end[0] - start[0])**2 +
              (end[1] - start[1])**2) / velocity)
  for i in range(steps):
    win.click(start[0] + (end[0] - start[0]) * i / steps,
              start[1] + (end[1] - start[1]) * i / steps, options="D NA")
    time.sleep(0.01)
  time.sleep(0.3)
  win.click(end[0], end[1], options="U NA")


def click_mouse(win, pos, offset):
  pos = (pos[0] + offset[0], pos[1] + offset[1])
  win.click(pos[0], pos[1])


def exec_mouse(win, mouse_event):
  print(win)
  if mouse_event["repeat"] == 0:
    return
  mouse_event["repeat"] -= 1
  if mouse_event["type"] == MouseInputTypes.CLICK:
    click_mouse(win, mouse_event["pos"], mouse_event["offset"])
  elif mouse_event["type"] == MouseInputTypes.DRAG:
    drag_mouse(win, mouse_event["start"], mouse_event["end"],
               mouse_event["velocity"], mouse_event["offset"])
