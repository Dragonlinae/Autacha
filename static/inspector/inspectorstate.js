import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";
import socket from "../managers/socketManager.js";

(function () {
  var frameButton = document.getElementById("inspector-update-frame");
  frameButton.addEventListener("click", function () {
    socket.emit("updateFrame", { id: selectedElement.getSelectedElement().getId() });
  });

  var clearMaskButton = document.getElementById("inspector-clear-mask");
  clearMaskButton.addEventListener("click", function () {
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "clear" });
  });

  var testMaskButton = document.getElementById("inspector-test-mask");
  testMaskButton.addEventListener("click", function () {
    socket.emit("setTestMaskId", { id: selectedElement.getSelectedElement().getId() });
  });

  var inspectorStateDiv = document.getElementById("inspector-state");
  var frameImg = document.getElementById("inspector-frame");
  inspectorStateDiv.update = function () {
    if (selectedElement.getSelectedElement() instanceof StateVisualElement) {
      if (selectedElement.getSelectedElement().imageElement) {
        frameImg.hidden = false;
        frameImg.src = selectedElement.getSelectedElement().imageElement.src + "&overlay=true";
      } else {
        frameImg.hidden = true;
        frameImg.src = "";
      }
    }
  };
})();