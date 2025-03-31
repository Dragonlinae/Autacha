import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";
import socket from "../managers/socketManager.js";

(function () {
  var insMask = document.getElementById("inspector-mask");
  var insState = document.getElementById("inspector-state");
  var insEdge = document.getElementById("inspector-edge");
  var insActionList = document.getElementById("inspector-action-list")

  insState.hidden = true;
  insEdge.hidden = true;

  function updateInspector() {
    if (selectedElement.getSelectedElement()) {
      if (selectedElement.getSelectedElement() instanceof StateVisualElement) {
        insMask.hidden = false;
        insMask.update();
        insState.hidden = false;
        insState.update();
        insEdge.hidden = true;
        insActionList.hidden = false;
        insActionList.update();
      } else if (selectedElement.getSelectedElement() instanceof EdgeVisualElement) {
        insMask.hidden = false;
        insMask.update();
        insState.hidden = true;
        insEdge.hidden = false;
        insEdge.update();
        insActionList.hidden = false;
        insActionList.update();
      }
    } else {
      insMask.hidden = true;
      insState.hidden = true;
      insEdge.hidden = true;
      insActionList.hidden = true;
    }
  }
  selectedElement.onChange(updateInspector);


  var saveFileButton = document.getElementById("save-file");
  var loadFileButton = document.getElementById("load-file");
  var fileInput = document.getElementById("file-input");

  saveFileButton.addEventListener("click", function () {
    fetch("/exportSave", {
      method: "GET",
    })
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "savefile.autacha";
        link.click();
      })
      .catch(error => console.error("Error saving file:", error));
  });

  loadFileButton.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function (event) {
    var file = event.target.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var fileContent = e.target.result;
        fetch("/importSave", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: fileContent,
        })
          .then(response => response.text())
          .then(responseText => {
            console.log("Save imported successfully:", responseText);
          })
          .catch(error => console.error("Error importing file:", error));
      };
      reader.readAsArrayBuffer(file);
    }
  });



  socket.on('refresh_page', data => {
    location.reload()
  });

})();