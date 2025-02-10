import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";
import { selectedElement } from "../managers/selectedelementManager.js";
import socket from "../managers/socketManager.js";

(function () {
  var c = document.getElementById("editor-canvas");
  var ctx = c.getContext("2d");
  var isDrawingEdge = false;
  var isPanning = false;
  var isDragging = false;
  var visualStates = [];
  var visualEdges = [];
  var canvasTransform = { x: 0, y: 0, scale: 1 };
  var idCounter = 0;


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
        selectedElement.deselectElement();
        var { x, y } = transformCoordinates(e.offsetX, e.offsetY);
        for (const state of visualStates) {
          if (state.overlapsMove(x, y)) {
            selectedElement.selectElement(state);
            isDragging = true;
            break;
          } else if (state.overlapsInteract(x, y)) {
            isDrawingEdge = true;
            visualEdges.push(new EdgeVisualElement(idCounter++, state, { x, y }));
            selectedElement.selectElement(visualEdges[visualEdges.length - 1]);
            break;
          }
        }
        if (selectedElement.getSelectedElement() !== null) {
          break;
        }

        for (const edge of visualEdges) {
          if (edge.overlapsMove(x, y)) {
            selectedElement.selectElement(edge);
            break;
          }
        }
        if (selectedElement.getSelectedElement() !== null) {
          break;
        }

        visualStates.push(new StateVisualElement(idCounter++, x, y, "State " + (idCounter - 1)));
        selectedElement.selectElement(visualStates[visualStates.length - 1]);
        socket.emit("saveFrameThumbnail", { targetElement: selectedElement.getSelectedElement().getId() });
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
          var completedEdge = false
          for (let i = visualStates.length - 1; i >= 0; i--) {
            if (visualStates[i].overlaps(x, y)) {
              selectedElement.getSelectedElement().to = visualStates[i];
              if (selectedElement.getSelectedElement().from === selectedElement.getSelectedElement().to) {
                visualEdges.splice(visualEdges.indexOf(selectedElement.getSelectedElement()), 1);
                selectedElement.deselectElement();
                completedEdge = true;
                break;
              }
              for (const edge of visualEdges) {
                if (((edge.from === selectedElement.getSelectedElement().from && edge.to === selectedElement.getSelectedElement().to) || (edge.from === selectedElement.getSelectedElement().to && edge.to === selectedElement.getSelectedElement().from)) && edge !== selectedElement.getSelectedElement()) {
                  visualEdges.splice(visualEdges.indexOf(selectedElement.getSelectedElement()), 1);
                  selectedElement.deselectElement();
                  break;
                }
              }
              completedEdge = true;
              break;
            }
          }
          if (!completedEdge) {
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

  c.addEventListener('contextmenu', e => e.preventDefault());

  c.addEventListener('keydown', e => {
    console.log(e);
    if (e.key === "Delete") {
      if (selectedElement.getSelectedElement() !== null) {
        if (selectedElement.getSelectedElement() instanceof StateVisualElement) {
          visualStates.splice(visualStates.indexOf(selectedElement.getSelectedElement()), 1);
          visualEdges = visualEdges.filter(edge => edge.from !== selectedElement.getSelectedElement() && edge.to !== selectedElement.getSelectedElement());
        } else if (selectedElement.getSelectedElement() instanceof EdgeVisualElement) {
          visualEdges.splice(visualEdges.indexOf(selectedElement.getSelectedElement()), 1);
        }
        selectedElement.deselectElement();
      }
    }
  });

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