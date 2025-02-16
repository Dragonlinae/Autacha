import socket from "../managers/socketManager.js";
import { selectedElement } from "../managers/selectedelementManager.js";

(function () {
  var regions = [];

  function click(xpos, ypos) {
    socket.emit('mouse_event', { "action": "click", "xpos": xpos, "ypos": ypos });
  }

  function drag(startx, starty, endx, endy, velocity) {
    socket.emit('mouse_event', { "action": "drag", "startx": startx, "starty": starty, "endx": endx, "endy": endy, "velocity": velocity });
  }

  function dragStart(xpos, ypos) {
    socket.emit('mouse_event', { "action": "dragStart", "xpos": xpos, "ypos": ypos });
  }

  function dragMove(xpos, ypos) {
    socket.volatile.emit('mouse_event', { "action": "dragMove", "xpos": xpos, "ypos": ypos });
  }

  function dragEnd(xpos, ypos) {
    socket.emit('mouse_event', { "action": "dragEnd", "xpos": xpos, "ypos": ypos });
  }

  var c = document.getElementById("video-canvas");
  var ctx = c.getContext("2d");
  var initialPos = { x: 0, y: 0 };
  var currPos = { x: 0, y: 0 };
  var isLeft = false;
  var isRight = false;
  c.addEventListener('pointerdown', e => {
    initialPos = { x: e.offsetX, y: e.offsetY };
    switch (e.button) {
      case 0:
        isLeft = true;
        dragStart(e.offsetX, e.offsetY);
        break;
      case 1:
        break;
      case 2:
        isRight = true;
        break;
    }
  });

  c.addEventListener('pointermove', e => {
    currPos = { x: e.offsetX, y: e.offsetY };
    if (isLeft) {
      dragMove(e.offsetX, e.offsetY);
    }
  });

  c.addEventListener('pointerup', e => {
    switch (e.button) {
      case 0:
        if (isLeft) {
          dragEnd(e.offsetX, e.offsetY);
          isLeft = false;
        }
        break;
      case 1:
        break;
      case 2:
        isRight = false;
        if (selectedElement.getSelectedElement()) {
          socket.emit('mask_event', { "id": selectedElement.getSelectedElement().getId(), "x": Math.min(e.offsetX, initialPos.x), "y": Math.min(e.offsetY, initialPos.y), "width": Math.abs(e.offsetX - initialPos.x), "height": Math.abs(e.offsetY - initialPos.y) });
        }

        break;
    }
  });

  c.addEventListener('contextmenu', e => e.preventDefault()); // Prevent context menu on right-click

  var vid = document.getElementById('vid');

  function updateCanvasSize() {
    c.width = vid.width;
    c.height = vid.height;
    c.style.scale = Math.min(c.parentElement.clientWidth / c.width, c.parentElement.clientHeight / c.height);
    // document.documentElement.style.setProperty('--canvas-scale', Math.min(c.parentElement.clientWidth / c.width, c.parentElement.clientHeight / c.height));
  }

  function saveImage() {
    var image = c.toDataURL("image/png").replace("image/png", "image/octet-stream");
    window.location.assign(image);
  }

  function drawVideo() {
    ctx.drawImage(vid, 0, 0, c.width, c.height);
    if (isRight) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 5;
      ctx.strokeRect(Math.min(initialPos.x, currPos.x), Math.min(initialPos.y, currPos.y), Math.abs(initialPos.x - currPos.x), Math.abs(initialPos.y - currPos.y));
    }


  }

  function updateCanvas() {
    updateCanvasSize();
    drawVideo();
    requestAnimationFrame(updateCanvas);
  }

  vid.onload = () => {
    console.log(c);
    c.width = vid.width;
    c.height = vid.height;
    requestAnimationFrame(updateCanvas);
  };
  vid.src = "/vid";
})();