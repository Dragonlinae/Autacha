from game_capture import GameCapture
import time
import cv2
import numpy as np
from ahk import AHK
import mouse_inputs
from flask import Flask, request, jsonify
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
win = ahk.win_wait(title=title, timeout=10)
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

app = Flask(__name__)


@app.route("/", methods=["GET"])
def index():
  with open("index.html", "r") as f:
    return f.read()


@app.route("/newest_frame", methods=["GET"])
def get_newest_frame():
  frame = camera.get_last_frame()
  img = cv2.imencode(".png", frame.frame_buffer)
  return jsonify({"frame": base64.b64encode(img[1]).decode("utf-8")})


@app.route("/click", methods=["POST"])
def click():
  print(request.json)
  xpos = int(request.json["xpos"])
  ypos = int(request.json["ypos"])
  pos = (xpos, ypos)
  mouse_inputs.click_mouse(win, pos, offset)
  return jsonify({"status": "success"})


@app.route("/drag", methods=["POST"])
def drag():
  print(request.json)
  startx = int(request.json["startx"])
  starty = int(request.json["starty"])
  endx = int(request.json["endx"])
  endy = int(request.json["endy"])
  start = (startx, starty)
  end = (endx, endy)
  velocity = int(request.json["velocity"])
  mouse_inputs.drag_mouse(win, start, end, velocity, offset)
  return jsonify({"status": "success"})


if __name__ == "__main__":
  app.run()
