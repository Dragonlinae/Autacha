import { StateVisualElement, EdgeVisualElement } from "./editorelementsClass.js";
import { selectedElement } from "./selectedelementManager.js";

(function () {
  var c = document.getElementById("editor-canvas");
  var ctx = c.getContext("2d");
  var isDrawingEdge = false;
  var isPanning = false;
  var isDragging = false;
  var visualStates = [];
  var visualEdges = [];
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
        var { x, y } = transformCoordinates(e.offsetX, e.offsetY);
        for (let i = visualStates.length - 1; i >= 0; i--) {
          if (visualStates[i].overlapsMove(x, y)) {
            selectedElement.selectElement(visualStates[i]);
            isDragging = true;
            break;
          } else if (visualStates[i].overlapsInteract(x, y)) {
            isDrawingEdge = true;
            visualEdges.push(new EdgeVisualElement(visualEdges.length, visualStates[i], { x, y }));
            selectedElement.selectElement(visualEdges[visualEdges.length - 1]);
            break;
          }
        }
        if (isDragging || isDrawingEdge) {
          break;
        }
        visualStates.push(new StateVisualElement(visualStates.length, x, y, "State " + visualStates.length));
        break;
      case 1:
        break;
      case 2:
        isPanning = true;
        break;
    }
  });

  c.addEventListener('pointermove', e => {
    if (isPanning) {
      canvasTransform.x += e.movementX;
      canvasTransform.y += e.movementY;
    }
    if (isDragging) {
      selectedElement.getSelectedElement().moveBy(e.movementX / canvasTransform.scale, e.movementY / canvasTransform.scale);
    }
    if (isDrawingEdge) {
      selectedElement.getSelectedElement().to = transformCoordinates(e.offsetX, e.offsetY);
    }
  });

  c.addEventListener('pointerup', e => {
    switch (e.button) {
      case 0:
        if (isDragging) {
          isDragging = false;
        }
        if (isDrawingEdge) {
          var { x, y } = transformCoordinates(e.offsetX, e.offsetY);
          for (let i = visualStates.length - 1; i >= 0; i--) {
            if (visualStates[i].overlaps(x, y)) {
              selectedElement.getSelectedElement().to = visualStates[i];
              for (const edge of visualEdges) {
                if (edge.from === selectedElement.getSelectedElement().from && edge.to === selectedElement.getSelectedElement().to && edge !== selectedElement.getSelectedElement()) {
                  visualEdges.splice(visualEdges.indexOf(selectedElement.getSelectedElement()), 1);
                  selectedElement.deselectElement();
                  break;
                }
              }
              selectedElement.deselectElement();
              break;
            }
          }
          if (selectedElement.getSelectedElement() !== null) {
            visualEdges.splice(visualEdges.indexOf(selectedElement.getSelectedElement()), 1);
            selectedElement.deselectElement();
          }
          isDrawingEdge = false;
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

    for (const element of visualEdges) {
      element.draw(ctx);
    }
    for (const element of visualStates) {
      element.draw(ctx);
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