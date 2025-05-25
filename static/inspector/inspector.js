import { selectedElement } from "../managers/selectedelementManager.js";
import { elementManager } from "../managers/elementManager.js";
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


  socket.on('select_element', data => {
    const element = elementManager.findElement(data.id);
    if (element) {
      selectedElement.selectElement(element);
    } else {
      selectedElement.deselectElement();
    }
  });

  var play_autacha_button = document.getElementById("play-autacha");
  var stop_autacha_button = document.getElementById("stop-autacha");
  var clear_env_button = document.getElementById("clear-env-vars");

  play_autacha_button.addEventListener("click", function () {
    if (!selectedElement.getSelectedElement()) {
      alert("Please select a state to play the automation.");
      return;
    }
    play_autacha_button.classList.add("active");
    play_autacha_button.disabled = true;
    socket.emit('play_automation', {
      id: selectedElement.getSelectedElement().getId()
    },
      function (response) {
        console.log("Automation start:", response);
        play_autacha_button.classList.remove("active");
        play_autacha_button.disabled = false;
      });
  });

  stop_autacha_button.addEventListener("click", function () {
    socket.emit('stop_automation', function (response) {
      console.log("Automation stopped:", response);
    });
  });

  clear_env_button.addEventListener("click", function () {
    socket.emit('reset_automation_environment', function (response) {
      console.log("Automation environment cleared:", response);
    });
  });

})();