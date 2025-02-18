
def keyclick(win, key):
  win.key_press(key)


def keydown(win, key):
  win.key_down(key)


def keyup(win, key):
  win.key_up(key)


def exec_keyboard(win, keyboard_event):
  print(win)
  if keyboard_event["repeat"] == 0:
    return
  keyboard_event["repeat"] -= 1
  if keyboard_event["type"] == "key":
    keyclick(win, keyboard_event["key"])
  elif keyboard_event["type"] == "down":
    keydown(win, keyboard_event["key"])
  elif keyboard_event["type"] == "up":
    keyup(win, keyboard_event["key"])
