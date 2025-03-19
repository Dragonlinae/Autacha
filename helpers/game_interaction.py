import helpers.mouse_inputs as mouse_inputs
import helpers.keyboard_inputs as keyboard_inputs
import time


def input_action(win, data, offset=(0, 0)):
  action = data["type"]
  match action:
    case "click":
      xpos = int(data["xpos"])
      ypos = int(data["ypos"])
      pos = (xpos, ypos)
      press_type = data.get("presstype", "press")
      match press_type:
        case "press":
          mouse_inputs.click_mouse(win, pos, offset)
        case "down":
          mouse_inputs.mouse_down(win, pos, offset)
        case "up":
          mouse_inputs.mouse_up(win, pos, offset)
        case _:
          return {"status": "error", "message": "Invalid press type"}
      return {"status": "success"}

    case "drag":
      startx = int(data["startx"])
      starty = int(data["starty"])
      endx = int(data["endx"])
      endy = int(data["endy"])
      start = (startx, starty)
      end = (endx, endy)
      velocity = int(data["velocity"])
      mouse_inputs.drag_mouse(win, start, end, velocity, offset)
      return {"status": "success"}

    case "dragVertices":
      vertices = data["vertices"]
      vertices = [[int(elem) for elem in point] for point in vertices]
      mouse_inputs.drag_mouse_vec(win, vertices, offset)

    case "dragStart":
      xpos = int(data["xpos"])
      ypos = int(data["ypos"])
      pos = (xpos, ypos)
      mouse_inputs.mouse_down(win, pos, offset)
      return {"status": "success"}

    case "dragMove":
      xpos = int(data["xpos"])
      ypos = int(data["ypos"])
      pos = (xpos, ypos)
      mouse_inputs.drag_move(win, pos, offset)
      return {"status": "success"}

    case "dragEnd":
      xpos = int(data["xpos"])
      ypos = int(data["ypos"])
      pos = (xpos, ypos)
      mouse_inputs.mouse_up(win, pos, offset)
      return {"status": "success"}

    case "key":
      key = data["keycode"]
      keyboard_inputs.key(win, key)
      return {"status": "success"}

    case "wait":
      waittime = data["time"]
      time.sleep(int(waittime)/1000.0)
      return {"status": "success"}

    case _:
      return {"status": "error", "message": "Invalid action"}
