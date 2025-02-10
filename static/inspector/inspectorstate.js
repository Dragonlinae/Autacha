import { selectedElement } from "../managers/selectedelementManager.js";
import socket from "../managers/socketManager.js";

(function () {
  var thumbnailButton = document.getElementById("inspector-save-frame-thumbnail");
  thumbnailButton.addEventListener("click", function () {
    socket.emit("saveFrameThumbnail", { targetElement: selectedElement.getSelectedElement().getId() });
  });
  socket.on("frameThumbnail", function (data) {
    console.log("frameThumbnail", data);
    // data.image is an arrayBuffer of the image
    var base64Image = String.fromCharCode(...new Uint8Array(data.image));
    var img = new Image();
    img.src = "data:image/png;base64," + base64Image;
    selectedElement.getSelectedElement().image = img;
  });
})();