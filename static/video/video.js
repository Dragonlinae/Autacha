import socket from "../managers/socketManager.js";

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
  var lastX = 0;
  var lastY = 0;
  var isLeft = false;
  var isRight = false;
  c.addEventListener('pointerdown', e => {
    lastX = e.offsetX;
    lastY = e.offsetY;
    switch (e.button) {
      case 0:
        isLeft = true;
        dragStart(lastX, lastY);
        break;
      case 1:
        break;
      case 2:
        break;
    }
  });

  c.addEventListener('pointermove', e => {
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
    // invert the color

    ctx.drawImage(vid, 0, 0, c.width, c.height);
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