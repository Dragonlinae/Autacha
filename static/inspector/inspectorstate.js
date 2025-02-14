import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";
import socket from "../managers/socketManager.js";

(function () {
  var thumbnailButton = document.getElementById("inspector-update-frame-thumbnail");
  thumbnailButton.addEventListener("click", function () {
    console.log("Requesting frame thumbnail");
    socket.emit("getFrameThumbnail", { id: selectedElement.getSelectedElement().getId() });
  });
})();