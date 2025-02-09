(function () {
  var c = document.getElementById("editor-canvas");
  var ctx = c.getContext("2d");
  var isDrawing = false;
  var isPanning = false;
  var paths = []
  var canvasTransform = { x: 0, y: 0, scale: 1 };


  function transformCoordinates(x, y) {
    return {
      x: (x - canvasTransform.x) / canvasTransform.scale,
      y: (y - canvasTransform.y) / canvasTransform.scale
    };
  }

  c.addEventListener('pointerdown', e => {
    console.log(e);
    switch (e.button) {
      case 0:
        isDrawing = true;
        paths.push([transformCoordinates(e.offsetX, e.offsetY)]);
        break;
      case 1:
        break;
      case 2:
        isPanning = true;
        break;
    }
  });

  c.addEventListener('pointermove', e => {
    if (isDrawing) {
      paths[paths.length - 1].push(transformCoordinates(e.offsetX, e.offsetY));
    }
    if (isPanning) {
      canvasTransform.x += e.movementX;
      canvasTransform.y += e.movementY;
    }
  });

  c.addEventListener('pointerup', e => {
    switch (e.button) {
      case 0:
        if (isDrawing) {
          isDrawing = false;
          paths[paths.length - 1].push(transformCoordinates(e.offsetX, e.offsetY));
        }
        break;
      case 1:
        break;
      case 2:
        isPanning = false;
        break;
    }
  });

  c.addEventListener('wheel', e => {
    var { x: mouseX, y: mouseY } = transformCoordinates(e.offsetX, e.offsetY);
    canvasTransform.x -= mouseX * (e.deltaY * -0.001) * canvasTransform.scale;
    canvasTransform.y -= mouseY * (e.deltaY * -0.001) * canvasTransform.scale;
    canvasTransform.scale *= (1 + e.deltaY * -0.001);
  });

  c.addEventListener('contextmenu', e => e.preventDefault()); // Prevent context menu on right-click

  function updateCanvasSize() {
    c.width = c.parentElement.clientWidth;
    c.height = c.parentElement.clientHeight;
  }

  function drawCanvas() {
    ctx.setTransform(canvasTransform.scale, 0, 0, canvasTransform.scale, canvasTransform.x, canvasTransform.y);
    ctx.clearRect(0, 0, c.width, c.height);

    for (const path of paths) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (const point of path) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }

  function updateCanvas() {
    updateCanvasSize();
    drawCanvas();
    requestAnimationFrame(updateCanvas);
  }

  c.width = document.documentElement.clientWidth;
  c.height = document.documentElement.clientHeight;
  updateCanvas();
})();