
def key(win, key):
  win.send(key)


def exec_keyboard(win, keyboard_event):
  print(win)
  if keyboard_event["repeat"] == 0:
    return
  keyboard_event["repeat"] -= 1
  key(win, keyboard_event["key"])
