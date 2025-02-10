import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";
import socket from "../managers/socketManager.js";

(function () {
  var thumbnailButton = document.getElementById("inspector-update-frame-thumbnail");
  thumbnailButton.addEventListener("click", function () {
    socket.emit("getFrameThumbnail", { id: selectedElement.getSelectedElement().getId() });
  });
  socket.on("frameThumbnail", function (data) {
    console.log("frameThumbnail", data);
    console.log(selectedElement.getSelectedElement().getId());
    console.log(data.id);
    if (selectedElement.getSelectedElement() instanceof StateVisualElement && selectedElement.getSelectedElement().getId() === data.id) {
      var base64Image = String.fromCharCode(...new Uint8Array(data.image));
      var img = new Image();
      img.src = "data:image/png;base64," + base64Image;
      selectedElement.getSelectedElement().image = img;
    }
  });
})();