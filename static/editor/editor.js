import { StateVisualElement, EdgeVisualElement, TempEdgeVisualElement } from "../classes/editorelementsClass.js";
import { selectedElement } from "../managers/selectedelementManager.js";
import { ElementManager } from "../managers/elementManager.js";
import socket from "../managers/socketManager.js";

(function () {
  var c = document.getElementById("editor-canvas");
  var ctx = c.getContext("2d");
  var isDrawingEdge = false;
  var isPanning = false;
  var isDragging = false;
  var dragOffset = { x: 0, y: 0 };
  var elementManager = new ElementManager();
  var canvasTransform = { x: 0, y: 0, scale: 1 };


  function transformCoordinates(x, y) {
    return {
      x: (x - canvasTransform.x) / canvasTransform.scale,
      y: (y - canvasTransform.y) / canvasTransform.scale
    };
  }

  c.addEventListener('pointerdown', e => {
    switch (e.button) {
      case 0:
        selectedElement.deselectElement();
        var { x, y } = transformCoordinates(e.offsetX, e.offsetY);

        var overlap = elementManager.findOverlap(x, y);
        if (overlap !== null) {
          const { element, type } = overlap;
          selectedElement.selectElement(element);
          dragOffset = { x: x - element.x, y: y - element.y };
          switch (type) {
            case "State":
              isDragging = true;
              break;
            case "StateInteract":
              isDrawingEdge = true;
              elementManager.startTempEdge(element, x, y);
              break;
            case "Edge":
              isDragging = true;
              break;
          }
        } else {
          requestAddState(x, y);
        }
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
      selectedElement.getSelectedElement().moveTo(transformCoordinates(e.offsetX, e.offsetY).x - dragOffset.x, transformCoordinates(e.offsetX, e.offsetY).y - dragOffset.y);
    }
    if (isDrawingEdge) {
      elementManager.updateTempEdge(transformCoordinates(e.offsetX, e.offsetY));
    }
  });

  c.addEventListener('pointerup', e => {
    switch (e.button) {
      case 0:
        if (isDragging) {
          isDragging = false;
          requestUpdateElement(selectedElement.getSelectedElement());
        }
        if (isDrawingEdge) {
          isDrawingEdge = false;
          selectedElement.deselectElement();
          var { x, y } = transformCoordinates(e.offsetX, e.offsetY);
          var result = elementManager.endTempEdge(x, y);
          if (result !== null) {
            requestAddEdge(result.sourceStateID, result.targetStateID);
          }
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
  }, { passive: true });

  c.addEventListener('contextmenu', e => e.preventDefault());

  c.addEventListener('keydown', e => {
    if (e.key === "Delete") {
      requestDeleteElement(selectedElement.getSelectedElement().getId());
    }
  });

  function updateCanvasSize() {
    c.width = c.parentElement.clientWidth;
    c.height = c.parentElement.clientHeight;
  }

  function drawCanvas() {
    ctx.setTransform(canvasTransform.scale, 0, 0, canvasTransform.scale, canvasTransform.x, canvasTransform.y);
    ctx.clearRect(0, 0, c.width, c.height);

    elementManager.drawElements(ctx);
  }

  function updateCanvas() {
    updateCanvasSize();
    drawCanvas();
    requestAnimationFrame(updateCanvas);
  }

  c.width = document.documentElement.clientWidth;
  c.height = document.documentElement.clientHeight;
  updateCanvas();

  function requestAddState(x, y) {
    socket.emit('state_event', { type: 'State', x, y });
  }

  function requestAddEdge(sourceState, targetState) {
    socket.emit('state_event', { type: 'Edge', sourceState, targetState });
  }

  function requestUpdateElement(element) {
    socket.emit('state_event', { ...element });
  }

  function requestDeleteElement(id) {
    socket.emit('state_event', { type: 'Delete', id });
  }

  socket.on('state_update', data => {
    console.log(data);
    elementManager.updateElement(data);
  });

  function initializeData() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/all_states', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        for (const state of data.states) {
          elementManager.updateElement(state);
          if (state.selected) {
            selectedElement.selectedElement = elementManager.findElement(state.id);
          }
        }
        for (const edge of data.edges) {
          elementManager.updateElement(edge);
          if (edge.selected) {
            selectedElement.selectedElement = elementManager.findElement(edge.id);
          }
        }
      }
    };
    xhr.send();
  }

  initializeData();


})();