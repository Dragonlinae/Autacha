from helpers.mouse_inputs import exec_mouse
from helpers.keyboard_inputs import exec_keyboard
import time


class Action:
  def __init__(self, devtype, action):
    self.type = devtype
    self.action = action

  def trigger(self, win, offset=(0, 0)):
    if self.type == "mouse":
      exec_mouse(win, self.action, offset)
    elif self.type == "keyboard":
      exec_keyboard(win, self.action)
    elif self.type == "wait":
      time.sleep(self.action["duration"])
