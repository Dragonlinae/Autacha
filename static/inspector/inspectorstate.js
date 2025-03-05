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

  var similaritySlider = document.getElementById("inspector-mask-similarity-slider");

  var ocrSlider = document.getElementById("inspector-mask-ocr-slider");
  var ocrType = document.getElementById("inspector-mask-ocr-typecast");
  var ocrCondition = document.getElementById("inspector-mask-ocr-condition");
  var ocrConditionValue = document.getElementById("inspector-mask-ocr-condition-value");

  maskTypeSelector.addEventListener("change", function () {
    if (maskTypeSelector.value === "similarity") {
      maskTypeSimilarity.hidden = false;
      maskTypeOCR.hidden = true;
      socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_similarity", threshold: similaritySlider.value });
    } else if (maskTypeSelector.value === "ocr") {
      maskTypeSimilarity.hidden = true;
      maskTypeOCR.hidden = false;
      socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_ocr", threshold: ocrSlider.value, type: ocrType, condition: ocrCondition, target: ocrConditionValue });
    }
  });

  var similarityValue = document.getElementById("inspector-mask-similarity-value");
  similaritySlider.addEventListener("input", function () {
    similarityValue.textContent = similaritySlider.value;
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_similarity", threshold: similaritySlider.value });
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