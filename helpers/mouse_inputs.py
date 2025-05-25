import time
import numpy as np
from threading import Timer


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


def mouse_down(win, pos, offset):
  pos = (pos[0] + offset[0], pos[1] + offset[1])
  win.click(pos[0], pos[1], options="D NA")


def drag_move(win, pos, offset):
  pos = (pos[0] + offset[0], pos[1] + offset[1])
  win.click(pos[0], pos[1], options="D NA")


def mouse_up(win, pos, offset):
  pos = (pos[0] + offset[0], pos[1] + offset[1])
  win.click(pos[0], pos[1], options="U NA")


def drag_mouse_vec(win, vertices, offset, flag=[True]):
  currtime = time.time()
  for i in range(len(vertices)):
    delay = vertices[i][2]/1000.0 + currtime - time.time()
    if (delay > 0):
      time.sleep(delay)
    if not flag[0]:
      break
    match vertices[i][3]:
      case 0:
        mouse_down(win, vertices[i][:2], offset)
      case 1:
        mouse_up(win, vertices[i][:2], offset)
    # Timer(vertices[i][2]/1000.0 + currtime - time.time(), mouse_down,
    #       [win, vertices[i][:2], offset]).start()
  # Timer(vertices[-1][2]/1000.0 + currtime - time.time(), mouse_up,
  #       [win, vertices[-1][:2], offset]).start()


def click_mouse(win, pos, offset):
  pos = (pos[0] + offset[0], pos[1] + offset[1])
  win.click(pos[0], pos[1])


def exec_mouse(win, mouse_event, offset):
  if mouse_event["repeat"] == 0:
    return
  mouse_event["repeat"] -= 1
  if mouse_event["type"] == "click":
    click_mouse(win, mouse_event["pos"], offset)
  elif mouse_event["type"] == "drag":
    drag_mouse(win, mouse_event["start"], mouse_event["end"],
               mouse_event["velocity"], offset)
  elif mouse_event["type"] == "down":
    mouse_down(win, mouse_event["pos"], offset)
  elif mouse_event["type"] == "up":
    mouse_up(win, mouse_event["pos"], offset)
