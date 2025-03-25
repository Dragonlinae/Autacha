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

  var elementName = document.getElementById("element-name");

  elementName.addEventListener("change", function (event) {
    socket.emit("name_event", { id: selectedElement.getSelectedElement().getId(), name: event.target.value });
  });

  maskTypeSelector.addEventListener("change", function () {
    if (maskTypeSelector.value === "similarity") {
      maskTypeSimilarity.hidden = false;
      maskTypeOCR.hidden = true;
      socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_similarity", threshold: similaritySlider.value });
    } else if (maskTypeSelector.value === "ocr") {
      maskTypeSimilarity.hidden = true;
      maskTypeOCR.hidden = false;
      socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_ocr", threshold: ocrSlider.value, type: ocrType.value, condition: ocrCondition.value, target: ocrConditionValue.value });
    }
  });

  var similarityValue = document.getElementById("inspector-mask-similarity-value");
  similaritySlider.addEventListener("input", function () {
    similarityValue.textContent = similaritySlider.value;
  });
  similaritySlider.addEventListener("change", function () {
    similarityValue.textContent = similaritySlider.value;
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_similarity", threshold: similaritySlider.value });
  });

  var ocrValue = document.getElementById("inspector-mask-ocr-value");
  ocrSlider.addEventListener("input", function () {
    ocrValue.textContent = ocrSlider.value;
  });
  ocrSlider.addEventListener("change", function () {
    ocrValue.textContent = ocrSlider.value;
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_ocr", threshold: ocrSlider.value, type: ocrType.value, condition: ocrCondition.value, target: ocrConditionValue.value });
  });

  ocrType.addEventListener("change", function () {
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_ocr", threshold: ocrSlider.value, type: ocrType.value, condition: ocrCondition.value, target: ocrConditionValue.value });
  });

  ocrCondition.addEventListener("change", function () {
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_ocr", threshold: ocrSlider.value, type: ocrType.value, condition: ocrCondition.value, target: ocrConditionValue.value });
  });

  ocrConditionValue.addEventListener("change", function () {
    socket.emit("mask_event", { id: selectedElement.getSelectedElement().getId(), action: "set_ocr", threshold: ocrSlider.value, type: ocrType.value, condition: ocrCondition.value, target: ocrConditionValue.value });
  });

  var additionalCondition = document.getElementById("custom-condition");
  additionalCondition.addEventListener("change", function (event) {
    socket.emit("additional_cond_event", { id: selectedElement.getSelectedElement().getId(), action: "set", cond: event.target.value });
  });

  var inspectorMaskDiv = document.getElementById("inspector-mask");
  var frameImg = document.getElementById("inspector-frame");
  inspectorMaskDiv.update = function () {
    elementName.value = selectedElement.getSelectedElement().name;

    if (selectedElement.getSelectedElement().image) {
      frameImg.hidden = false;
      frameImg.src = selectedElement.getSelectedElement().image + "&overlay=true&" + new Date().getTime();
    } else {
      frameImg.hidden = true;
      frameImg.src = "";
    }

    if (selectedElement.getSelectedElement().mask) {
      maskTypeSelector.value = selectedElement.getSelectedElement().mask.detection_type;
      similaritySlider.value = selectedElement.getSelectedElement().mask.similarity_threshold;
      ocrSlider.value = selectedElement.getSelectedElement().mask.ocr_threshold;
      ocrType.value = selectedElement.getSelectedElement().mask.ocr_type;
      ocrCondition.value = selectedElement.getSelectedElement().mask.ocr_condition;
      ocrConditionValue.value = selectedElement.getSelectedElement().mask.ocr_target;
      additionalCondition.value = selectedElement.getSelectedElement().additionalcond;

      if (maskTypeSelector.value === "similarity") {
        maskTypeSimilarity.hidden = false;
        maskTypeOCR.hidden = true;
      } else if (maskTypeSelector.value === "ocr") {
        maskTypeSimilarity.hidden = true;
        maskTypeOCR.hidden = false;
      }

      similarityValue.textContent = similaritySlider.value;
      ocrValue.textContent = ocrSlider.value;

    }
  };
})();