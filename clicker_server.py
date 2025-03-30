from helpers.game_interaction import GameInteraction
from helpers.state_tracker import StateTracker
from helpers.mask_class import Mask
from helpers.element_class import Element
import time
import cv2
import numpy as np
from ahk import AHK
from flask import Flask, Response, render_template, request
from flask_socketio import SocketIO
import json
import base64
import ctypes
import pickle


def is_admin():
  try:
    return ctypes.windll.shell32.IsUserAnAdmin()
  except:
    return False


if not is_admin():
  print("Currently running without elevated privileges. Run as administrator for best results.")

# stream_max_dimension = 1280
# thumbnail_max_dimension = 256

stateTracker = StateTracker()
gameInteraction = GameInteraction()


# target = 'A_AppData "/Microsoft/Windows/Start Menu/Programs/Google Play Games/Arknights.lnk"'
# target_title = "Arknights"


app = Flask(__name__, static_url_path="",
            static_folder="static", template_folder="templates")
socket = SocketIO(app)


def get_thumbnail():
  if gameInteraction.camera is None:
    return None
  frame = gameInteraction.get_last_frame()
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

  img = cv2.imread("image.png")
  img = cv2.imencode(".jpg", img)[1]
  stringData = img.tobytes()
  yield (b'--frame\r\n'
         b'Content-Type: text/plain\r\n\r\n'+stringData+b'\r\n'
         # Send frame twice to get an ending boundary
         b'--frame\r\n'
         b'Content-Type: text/plain\r\n\r\n'+stringData+b'\r\n')

  frame_number = -1
  while True:
    if (frame_number == gameInteraction.get_frame_number()):
      time.sleep(0.01)
      # yield (b'--frame\r\n'
      #        b'Content-Type: text/plain\r\n\r\n'+stringData+b'\r\n')
      continue
    frame_number = gameInteraction.get_frame_number()
    frame = gameInteraction.get_last_frame()
    if (frame is None):
      continue
    # img = frame.frame_buffer
    # h, w = img.shape[:2]
    # if h > w:
    #   img = cv2.resize(
    #       img, (int(w * stream_max_dimension / h), stream_max_dimension))
    # else:
    #   img = cv2.resize(
    #       img, (stream_max_dimension, int(h * stream_max_dimension / w)))
    # img = cv2.imencode(".png", img)[1]

    img = frame.frame_buffer
    mask = stateTracker.get_testing_mask()
    if mask:
      with mask.read:
        if mask.valid():
          match mask.detection_type:
            case "similarity":
              similarity_score = mask.similarity(img)
              if similarity_score > mask.similarity_threshold:
                img = mask.overlay(img, 5, (0, 255, 0), str(similarity_score))
              else:
                img = mask.overlay(img, 5, (0, 0, 255), str(similarity_score))
            case "ocr":
              ocr_text = mask.ocr(img)
              if mask.ocr_check_condition(ocr_text):
                img = mask.overlay(img, 5, (0, 255, 0), ocr_text)
              else:
                img = mask.overlay(img, 5, (0, 0, 255), ocr_text)
            case "findsimilarity":
              similarity_score, position = mask.findsimilarity(img)
              if similarity_score > mask.findsimilarity_threshold:
                img = mask.overlay(img, 5, (0, 255, 0),
                                   str(similarity_score), position)
              else:
                img = mask.overlay(img, 5, (0, 0, 255),
                                   str(similarity_score), position)

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
  element = stateTracker.get_element(id)
  if element is not None and element.frame is not None:
    img = element.frame.frame_buffer
    mask = element.mask
    if mask.valid() and overlay == "true":
      img = mask.overlay(img, 5, (0, 255, 0), offset=mask.offset)
    img = cv2.imencode(".jpg", img)[1]
    return Response(img.tobytes(), mimetype='image/jpeg')
  return ""


@app.route("/exportSave", methods=["GET"])
def export_save():
  savefile = pickle.dumps([Element.id_counter, stateTracker])
  return savefile


@app.route("/importSave", methods=["POST"])
def import_save():
  global stateTracker
  Element.id_counter, stateTracker = pickle.loads(request.data)
  return "Save imported successfully!"


@socket.on('input_event')
def handle_action_event(data):
  element = stateTracker.get_element(data["id"]) if "id" in data else None
  return gameInteraction.input_action(data, element)


@socket.on('simulate_event')
def handle_action_event(data):
  element = stateTracker.get_element(data["id"])
  if element is not None:
    return element.simulate()


@socket.on('state_event')
def handle_state_event(data):
  res = stateTracker.update(data)
  if res is not None:
    if isinstance(res, dict):
      socket.emit('state_update', res)
    else:
      socket.emit('state_update', res.get_data())


@socket.on('name_event')
def handle_name_event(data):
  element = stateTracker.get_element(data["id"])
  element.name = data["name"]
  socket.emit('state_update', element.get_data())


@socket.on('mask_event')
def handle_mask_event(data):
  if gameInteraction.camera is None:
    return None
  element = stateTracker.get_element(data["id"])
  if element is not None:
    match data["action"]:
      case "set":
        if data["width"] != 0 and data["height"] != 0:
          stateTracker.setImage(element.id, gameInteraction.get_last_frame())
          element.mask.update_mask(Mask.crop_from_frame(
              element.frame.frame_buffer, {"x": data["x"], "y": data["y"], "width": data["width"], "height": data["height"]}), (int(data["x"]), int(data["y"])))
          stateTracker.set_testing_id(data["id"])
      case "clear":
        element.mask.clear_mask()
      case "update_frame":
        stateTracker.setImage(data["id"], gameInteraction.get_last_frame())
        if element.mask.valid():
          element.mask.update_mask(Mask.crop_from_frame(
              element.frame.frame_buffer, {"x": element.mask.offset[0], "y": element.mask.offset[1],
                                           "width": element.mask.dimensions[1], "height": element.mask.dimensions[0]}), element.mask.offset)
      case "set_similarity":
        element.mask.detection_type = "similarity"
        element.mask.similarity_threshold = float(data["threshold"])
      case "set_findsimilarity":
        element.mask.detection_type = "findsimilarity"
        element.mask.findsimilarity_threshold = float(data["threshold"])
      case "set_ocr":
        element.mask.detection_type = "ocr"
        element.mask.ocr_threshold = float(data["threshold"])
        element.mask.ocr_type = data["type"]
        element.mask.ocr_condition = data["condition"]
        element.mask.ocr_target = data["target"]

    socket.emit('state_update', element.get_data())


@socket.on('additional_cond_event')
def handle_additional_cond_event(data):
  element = stateTracker.get_element(data["id"])
  if element is not None:
    match data["action"]:
      case "set":
        element.additionalcond = data["cond"]
        socket.emit('state_update', element.get_data())
        return {"status": "success"}


@socket.on('action_list_event')
def handle_action_list_event(data):
  element = stateTracker.get_element(data["id"])
  if element is not None:
    match data["action"]:
      case "set":
        element.actions = data["actionlist"]
        socket.emit('state_update', element.get_data())
        return {"status": "success"}


@socket.on('setTestMaskId')
def handle_test_mask_event(data):
  stateTracker.set_testing_id(data["id"])


if __name__ == "__main__":
  socket.run(app, debug=True)
