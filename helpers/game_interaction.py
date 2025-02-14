import helpers.mouse_inputs as mouse_inputs


def mouse_action(win, data, offset):
  action = data.get("action")
  match action:
    case "click":
      xpos = int(data["xpos"])
      ypos = int(data["ypos"])
      pos = (xpos, ypos)
      mouse_inputs.click_mouse(win, pos, offset)
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

    case "dragStart":
      xpos = int(data["xpos"])
      ypos = int(data["ypos"])
      pos = (xpos, ypos)
      mouse_inputs.drag_start(win, pos, offset)
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
      mouse_inputs.drag_end(win, pos, offset)
      return {"status": "success"}

    case _:
      return {"status": "error", "message": "Invalid action"}
