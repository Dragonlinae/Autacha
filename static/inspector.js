import { selectedElement } from "./selectedelementManager.js";

(function () {
  var infoDiv = document.getElementById("inspector-info");

  function updateInspector() {
    if (selectedElement.getSelectedElement()) {
      infoDiv.innerHTML = "You selected " + selectedElement.getSelectedElement().getId();
    } else {
      infoDiv.innerHTML = "";
    }
  }
  selectedElement.onSelect(updateInspector);
})();