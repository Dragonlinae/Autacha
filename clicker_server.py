from helpers.game_capture import GameCapture
from helpers.game_interaction import mouse_action
from helpers.state_tracker import StateTracker
from helpers.mask_class import Mask
import time
import cv2
import numpy as np
from ahk import AHK
from flask import Flask, Response, render_template, request
from flask_socketio import SocketIO
import json
import base64

offset = (0, 0)

stream_max_dimension = 1280
thumbnail_max_dimension = 256

stateTracker = StateTracker()


target = "%A_AppData%\\Microsoft\\Windows\\Start Menu\\Programs\\Google Play Games\\Arknights.lnk"
title = "Arknights"

ahk = AHK()
ahk.run_script(
    f"Run, {target},,hide")
win = ahk.win_wait(title=title, timeout=5)
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
  img_encoded = cv2.imencode(".jpg", frame.frame_buffer)[1]
  # img = cv2.imdecode(img_encoded, cv2.IMREAD_COLOR)
  # h, w = img.shape[:2]
  # if h > w:
  #   img = cv2.resize(
  #       img, (int(w * thumbnail_max_dimension / h), thumbnail_max_dimension))
  # else:
  #   img = cv2.resize(img, (thumbnail_max_dimension,
  #                    int(h * thumbnail_max_dimension / w)))
  # img_encoded = cv2.imencode(".jpg", img)[1]
  stringData = base64.b64encode(img_encoded).decode('utf-8')
  return stringData


def stream_frames():
  frame_number = -1
  while True:
    if (frame_number == camera.frame_number):
      time.sleep(0.01)
      continue
    frame_number = camera.frame_number
    # img = frame.frame_buffer
    # h, w = img.shape[:2]
    # if h > w:
    #   img = cv2.resize(
    #       img, (int(w * stream_max_dimension / h), stream_max_dimension))
    # else:
    #   img = cv2.resize(
    #       img, (stream_max_dimension, int(h * stream_max_dimension / w)))
    # img = cv2.imencode(".png", img)[1]

    img = camera.get_last_frame().frame_buffer
    mask = stateTracker.get_testing_mask()
    if mask:
      with mask.read:
        if mask.valid():
          match mask.detection_type:
            case "similarity":
              similarity_score = mask.similarity(img)
              if similarity_score > mask.similarity_threshold:
                img = mask.overlay(img, 5, (0, 255, 0))
              else:
                img = mask.overlay(img, 5, (0, 0, 255))
            case "ocr":
              ocr_text = mask.ocr(img)
              if mask.ocr_check_condition(ocr_text):
                img = mask.overlay(img, 5, (0, 255, 0), ocr_text)
              else:
                img = mask.overlay(img, 5, (0, 0, 255), ocr_text)

    img = cv2.imencode(".jpg", img)[1]

    stringData = img.tobytes()
    yield (b'--frame\r\n'
           b'Content-Type: text/plain\r\n\r\n'+stringData+b'\r\n')
    # time.sleep(0.1)


@app.route("/", methods=["GET"])
def index():
  return render_template("index.html")


@app.route("/vid", methods=["GET"])
def vid():
  return Response(stream_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route("/all_states", methods=["GET"])
def all_states():
  return json.dumps(stateTracker.get_all_states())


@app.route("/elementimg", methods=["GET"])
def elementimg():
  id = int(request.args.get("id"))
  overlay = request.args.get("overlay", "false")
  state = stateTracker.get_state(id)
  if state is not None and state.frame is not None:
    img = state.frame.frame_buffer
    mask = state.mask
    if mask.valid() and overlay == "true":
      img = mask.overlay(img, 5, (0, 255, 0))
    img = cv2.imencode(".jpg", img)[1]
    return Response(img.tobytes(), mimetype='image/jpeg')
  return ""


@socket.on('mouse_event')
def handle_action_event(data):
  return mouse_action(win, data, offset)


@socket.on('state_event')
def handle_state_event(data):
  res = stateTracker.update(data)
  if res is not None:
    if isinstance(res, dict):
      socket.emit('state_update', res)
    else:
      socket.emit('state_update', res.get_data())


@socket.on('mask_event')
def handle_mask_event(data):
  print(data)
  state = stateTracker.get_state(data["id"])
  if state is not None:
    match data["action"]:
      case "set":
        if data["width"] != 0 and data["height"] != 0:
          stateTracker.setImage(state.id, camera.get_last_frame())
          state.mask.update_mask(Mask.crop_from_frame(
              state.frame.frame_buffer, {"x": data["x"], "y": data["y"], "width": data["width"], "height": data["height"]}), (int(data["x"]), int(data["y"])))
          stateTracker.set_testing_id(data["id"])
      case "clear":
        state.mask.clear_mask()
      case "update_frame":
        stateTracker.setImage(data["id"], camera.get_last_frame())
        if state.mask.valid():
          state.mask.update_mask(Mask.crop_from_frame(
              state.frame.frame_buffer, {"x": state.mask.offset[0], "y": state.mask.offset[1],
                                         "width": state.mask.dimensions[1], "height": state.mask.dimensions[0]}), state.mask.offset)
      case "set_similarity":
        state.mask.detection_type = "similarity"
        state.mask.similarity_threshold = float(data["threshold"])
      case "set_ocr":
        state.mask.detection_type = "ocr"
        state.mask.ocr_threshold = float(data["threshold"])
        state.mask.ocr_type = data["type"]
        state.mask.ocr_condition = data["condition"]
        state.mask.ocr_target = data["target"]

    socket.emit('state_update', state.get_data())


@socket.on('setTestMaskId')
def handle_test_mask_event(data):
  stateTracker.set_testing_id(data["id"])


if __name__ == "__main__":
  socket.run(app, debug=False)
