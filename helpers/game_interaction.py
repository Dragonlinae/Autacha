from helpers.game_capture import GameCapture
import helpers.mouse_inputs as mouse_inputs
import helpers.keyboard_inputs as keyboard_inputs
import time
import helpers.execenv as execenv
from ahk import AHK
from difflib import SequenceMatcher as SM


class GameInteraction:
  def __init__(self):
    self.ahk = AHK(version='v2')
    self.win = None
    self.camera = None
    self.offset = (0, 0)
    self.window_position = None

  def input_action(self, data, element=None, flag=[True], callback=None):
    action = data["type"]
    match action:
      case "click":
        xpos = int(data["xpos"])
        ypos = int(data["ypos"])
        pos = (xpos, ypos)
        press_type = data.get("presstype", "press")
        match press_type:
          case "press":
            mouse_inputs.click_mouse(self.win, pos, self.offset)
          case "down":
            mouse_inputs.mouse_down(self.win, pos, self.offset)
          case "up":
            mouse_inputs.mouse_up(self.win, pos, self.offset)
          case _:
            return {"status": "error", "message": "Invalid press type"}
        if callback is not None:
          callback({"type": "click", "x": xpos, "y": ypos})
        return {"status": "success"}

      case "drag":
        startx = int(data["startx"])
        starty = int(data["starty"])
        endx = int(data["endx"])
        endy = int(data["endy"])
        start = (startx, starty)
        end = (endx, endy)
        velocity = int(data["velocity"])
        mouse_inputs.drag_mouse(self.win, start, end, velocity, self.offset)

        if callback is not None:
          callback({"type": "drag", "startx": startx, "starty": starty,
                   "endx": endx, "endy": endy})
        return {"status": "success"}

      case "dragVertices":
        vertices = data["vertices"]
        vertices = [[int(elem) for elem in point] for point in vertices]
        mouse_inputs.drag_mouse_vec(
            self.win, vertices, self.offset, flag, callback)
        return {"status": "success"}

      case "dragStart":
        xpos = int(data["xpos"])
        ypos = int(data["ypos"])
        pos = (xpos, ypos)
        mouse_inputs.mouse_down(self.win, pos, self.offset)
        if callback is not None:
          callback({"type": "dragStart", "x": xpos, "y": ypos})
        return {"status": "success"}

      case "dragMove":
        xpos = int(data["xpos"])
        ypos = int(data["ypos"])
        pos = (xpos, ypos)
        mouse_inputs.drag_move(self.win, pos, self.offset)
        if callback is not None:
          callback({"type": "dragMove", "x": xpos, "y": ypos})
        return {"status": "success"}

      case "dragEnd":
        xpos = int(data["xpos"])
        ypos = int(data["ypos"])
        pos = (xpos, ypos)
        mouse_inputs.mouse_up(self.win, pos, self.offset)
        if callback is not None:
          callback({"type": "dragEnd", "x": xpos, "y": ypos})
        return {"status": "success"}

      case "key":
        key = data["keycode"]
        keyboard_inputs.key(self.win, key)
        return {"status": "success"}

      case "clickDetect":
        if element:
          xoffset = int(data["xoffset"])
          yoffset = int(data["yoffset"])
          mouse_inputs.click_mouse(
              self.win, element.mask.get_detect_loc(), (self.offset[0] + xoffset, self.offset[1] + yoffset))
          if callback is not None:
            callback({"type": "clickDetect", "x": element.mask.get_detect_loc()[0] + xoffset,
                     "y": element.mask.get_detect_loc()[1] + yoffset})
        return {"status": "success"}

      case "wait":
        waittime = data["time"]
        time.sleep(int(waittime)/1000.0)
        return {"status": "success"}

      case "exec":
        execenv.execute(data["cmd"], mouse_inputs=mouse_inputs,
                        keyboard_inputs=keyboard_inputs, win=self.win, element=element, offset=self.offset)
        return {"status": "success"}

      case "launch":
        self.ahk.run_script(f'Run {data["path"]}')
        return {"status": "success"}

      case "close":
        if self.win is not None:
          self.win.close()
          self.win = None
        return {"status": "success"}

      case "hookInputs":
        best_match = float(data["confidence"])
        title = None
        if data["title"] != "":
          while title is None:
            time.sleep(1)
            if not flag[0]:
              return {"status": "aborted"}
            for test_window in self.ahk.list_windows():
              match_score = SM(None, data["title"], test_window.title).ratio()
              print(match_score, test_window.title)
              if match_score >= best_match:
                best_match = match_score
                title = test_window.title
          # print(title, best_match)
          self.win = self.ahk.win_wait(
              title=title, timeout=int(data["timeout"]))
          print("INPUT HOOKED")
          print(self.win.title)
          self.window_position = self.win.get_position()._asdict()
          self.win.to_bottom()
        else:
          self.win = self.ahk
        return {"status": "success"}

      case "hookVideo":
        best_match = float(data["confidence"])
        title = None
        if data["title"] != "":
          while title is None:
            time.sleep(1)
            if not flag[0]:
              return {"status": "aborted"}
            for test_window in self.ahk.list_windows():
              match_score = SM(None, data["title"], test_window.title).ratio()
              if match_score >= best_match:
                best_match = match_score
                title = test_window.title
              print(match_score, test_window.title)

        self.camera = GameCapture(title)
        self.camera.start()

        while self.camera.get_last_frame() is None:
          time.sleep(0.1)

        frame = self.camera.get_last_frame()
        # print(frame.width, frame.height)
        if self.win is self.ahk.windows:
          for control in self.win.list_controls():
            # print(control)
            # print(control.get_position())
            if abs(control.get_position().width - frame.width) < 10 and abs(control.get_position().height - frame.height) < 10:
              self.offset = (control.get_position().x,
                             control.get_position().y)
          print("Offset applied", self.offset)

        return {"status": "success"}

      case "setWindowDim":
        if self.win is not None:
          self.win.move(x=int(data["xpos"]), y=int(data["ypos"]), width=int(
              data["width"]), height=int(data["height"]))
        return {"status": "success"}

      case _:
        return {"status": "error", "message": "Invalid action"}

  def get_last_frame(self):
    if self.camera is None:
      return None
    return self.camera.get_last_frame()

  def get_frame_number(self):
    if self.camera is None:
      return -1
    return self.camera.frame_number
