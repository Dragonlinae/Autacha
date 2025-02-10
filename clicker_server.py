from game_capture import GameCapture
import time
import cv2
import numpy as np
from ahk import AHK
import mouse_inputs
from flask import Flask, request, jsonify, Response, render_template
from flask_socketio import SocketIO
import json
import base64

mouse_right_down_pos = None
mouse_down_pos = None
rect_mask = None
saved_mask = None

rect_masks = []
saved_masks = []
action_events = []
offset = (0, 0)


def get_similarity(frame1, frame2):
  if frame1.width != frame2.width or frame1.height != frame2.height:
    return -1
  mse = np.sum((np.array(frame1.frame_buffer, dtype=np.float32) -
                np.array(frame2.frame_buffer, dtype=np.float32))**2)
  mse /= float(frame1.width * frame1.height * 3)
  return 1 - np.sqrt(mse) / 255.0


target = "%A_AppData%\\Microsoft\\Windows\\Start Menu\\Programs\\Google Play Games\\Arknights.lnk"
title = "Arknights"

ahk = AHK()
ahk.run_script(
    f"Run, {target},,hide")
win = ahk.win_wait(title=title, timeout=30)
time.sleep(1)
win.to_bottom()
print(win)
print(win.get_position())

camera = GameCapture(title)
camera.start()
while camera.get_last_frame() is None:
  time.sleep(0.1)

print("Capture Started")

frame = camera.get_last_frame()
print(frame.width, frame.height)
for control in win.list_controls():
  print(control)
  print(control.get_position())
  if abs(control.get_position().width - frame.width) < 10 and abs(control.get_position().height - frame.height) < 10:
    offset = (control.get_position().x, control.get_position().y)
    print("Offset applied", offset)

app = Flask(__name__, static_url_path="",
            static_folder="static", template_folder="templates")
socket = SocketIO(app)


def get_thumbnail():
  frame = camera.get_last_frame()
  img_encoded = cv2.imencode(".png", frame.frame_buffer)[1]
  img = cv2.imdecode(img_encoded, cv2.IMREAD_COLOR)
  # Resize whichever dimension is larger to 512 px
  h, w = img.shape[:2]
  if h > w:
    img = cv2.resize(img, (int(w * 256 / h), 256))
  else:
    img = cv2.resize(img, (256, int(h * 256 / w)))
  img_encoded = cv2.imencode(".png", img)[1]
  stringData = base64.b64encode(img_encoded)
  return stringData


def stream_frames():
  lastframe = None
  while True:
    frame = camera.get_last_frame()
    if frame == lastframe:
      time.sleep(0.01)
      continue
    lastframe = frame
    img = cv2.imencode(".png", frame.frame_buffer)[1]
    stringData = img.tostring()
    yield (b'--frame\r\n'
           b'Content-Type: text/plain\r\n\r\n'+stringData+b'\r\n')


@app.route("/", methods=["GET"])
def index():
  return render_template("index.html")


@app.route("/vid", methods=["GET"])
def vid():
  return Response(stream_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@socket.on('mouse_event')
def handle_action_event(data):
  action = data.get("action")

  if action == "click":
    xpos = int(data["xpos"])
    ypos = int(data["ypos"])
    pos = (xpos, ypos)
    mouse_inputs.click_mouse(win, pos, offset)
    response = {"status": "success"}

  elif action == "drag":
    startx = int(data["startx"])
    starty = int(data["starty"])
    endx = int(data["endx"])
    endy = int(data["endy"])
    start = (startx, starty)
    end = (endx, endy)
    velocity = int(data["velocity"])
    mouse_inputs.drag_mouse(win, start, end, velocity, offset)
    response = {"status": "success"}

  elif action == "dragStart":
    xpos = int(data["xpos"])
    ypos = int(data["ypos"])
    pos = (xpos, ypos)
    mouse_inputs.drag_start(win, pos, offset)
    response = {"status": "success"}

  elif action == "dragMove":
    xpos = int(data["xpos"])
    ypos = int(data["ypos"])
    pos = (xpos, ypos)
    mouse_inputs.drag_move(win, pos, offset)
    response = {"status": "success"}

  elif action == "dragEnd":
    xpos = int(data["xpos"])
    ypos = int(data["ypos"])
    pos = (xpos, ypos)
    mouse_inputs.drag_end(win, pos, offset)
    response = {"status": "success"}

  else:
    response = {"status": "error", "message": "Invalid action"}

  socket.emit('action_response', response)


@socket.on('mask_event')
def handle_mask_event(data):
  action = data.get("action")

  if action == "rect":
    xpos = int(data["xpos"])
    ypos = int(data["ypos"])
    width = int(data["width"])
    height = int(data["height"])
    rect_masks.append((xpos, ypos, width, height))
    response = {"status": "success"}

  elif action == "save":
    saved_masks.extend(rect_masks)
    rect_masks.clear()
    response = {"status": "success"}

  elif action == "clear":
    rect_masks.clear()
    response = {"status": "success"}

  elif action == "apply":
    saved_mask = np.zeros((frame.height, frame.width), np.uint8)
    for mask in saved_masks:
      xpos, ypos, width, height = mask
      saved_mask[ypos:ypos+height, xpos:xpos+width] = 1
    response = {"status": "success"}

  else:
    response = {"status": "error", "message": "Invalid action"}

  socket.emit('mask_response', response)


@socket.on('saveFrameThumbnail')
def handle_save_thumbnail(data):
  socket.emit('frameThumbnail', {"image": get_thumbnail()})


if __name__ == "__main__":
  socket.run(app, debug=True)
