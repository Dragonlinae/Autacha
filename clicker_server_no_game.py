from game_capture import GameCapture
import time
import cv2
import numpy as np
from ahk import AHK
import mouse_inputs
from flask import Flask, request, jsonify, Response, render_template
from flask_socketio import SocketIO
import json

mouse_right_down_pos = None
mouse_down_pos = None
rect_mask = None
saved_mask = None

rect_masks = []
saved_masks = []
action_events = []
offset = (0, 0)


app = Flask(__name__, static_url_path="",
            static_folder="static", template_folder="templates")
socket = SocketIO(app)


@app.route("/", methods=["GET"])
def index():
  return render_template("index.html")


@app.route("/vid", methods=["GET"])
def vid():
  return "vid.html"


if __name__ == "__main__":
  socket.run(app, debug=True)
