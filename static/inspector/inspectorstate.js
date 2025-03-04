import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";
import socket from "../managers/socketManager.js";

(function () {
  var frameButton = document.getElementById("inspector-update-frame");
  frameButton.addEventListener("click", function () {
    socket.emit("mask_event", {
      id: selectedElement.getSelectedElement().getId(), action: "update_frame"
    });
  });

  var clearMaskButton = document.getElementById("inspector-clear-mask");
  clearMaskButton.addEventListener("click", function () {
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "clear" });
  });

  var testMaskButton = document.getElementById("inspector-test-mask");
  testMaskButton.addEventListener("click", function () {
    socket.emit("setTestMaskId", { id: selectedElement.getSelectedElement().getId() });
  });

  var maskTypeSelector = document.getElementById("inspector-mask-type");
  var maskTypeSimilarity = document.getElementById("inspector-mask-similarity");
  var maskTypeOCR = document.getElementById("inspector-mask-ocr");
  maskTypeSelector.addEventListener("change", function () {
    if (maskTypeSelector.value === "similarity") {
      maskTypeSimilarity.hidden = false;
      maskTypeOCR.hidden = true;
    } else if (maskTypeSelector.value === "ocr") {
      maskTypeSimilarity.hidden = true;
      maskTypeOCR.hidden = false;
    }
  });

  var maskSlider = document.getElementById("inspector-mask-similarity-slider");
  var maskSliderValue = document.getElementById("inspector-mask-similarity-value");
  maskSlider.addEventListener("input", function () {
    maskSliderValue.textContent = maskSlider.value;
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_similarity", value: maskSlider.value });
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