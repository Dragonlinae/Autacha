from windows_capture import WindowsCapture, Frame, InternalCaptureControl
from time import time
import win32gui
import copy


class GameCapture:
  def __init__(self, window_name: str):
    self.frame = None
    self.frame_number = -1
    self.capture = WindowsCapture(
        cursor_capture=False,
        draw_border=None,
        monitor_index=None,
        window_name=window_name,
    )
    self.window_name = window_name
    self.stop_flag = False
    self.capture_control = None
    self.title_bar_height = self.get_title_bar_dimensions(window_name)[0]

    @self.capture.event
    def on_frame_arrived(frame: Frame, capture_control: InternalCaptureControl):
      # print("New Frame Arrived")
      self.frame = frame
      self.frame = self.frame.crop(
          0, self.title_bar_height, frame.width, frame.height)
      self.frame_number += 1
      self.capture_control = capture_control
      if self.stop_flag:
        capture_control.stop()

    @self.capture.event
    def on_closed(self):
      print("Capture Session Closed")

  def get_title_bar_dimensions(self, win_title):
    hwnd = win32gui.FindWindow(None, win_title)
    x1, y1, x2, y2 = win32gui.GetClientRect(hwnd)
    width = x2-x1
    height = y2-y1
    wx1, wy1, wx2, wy2 = win32gui.GetWindowRect(hwnd)
    wx1, wx2 = wx1-wx1, wx2-wx1
    wy1, wy2 = wy1-wy1, wy2-wy1
    bw = int((wx2-x2)/2.)
    th = wy2-y2-bw
    return th, bw

  def start(self):
    self.capture.start_free_threaded()

  def get_last_frame(self):
    if self.frame is None:
      return None
    return copy.deepcopy(self.frame)

  def get_frame_ref(self):
    return self.frame
