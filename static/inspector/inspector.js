import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";

(function () {
  var insState = document.getElementById("inspector-state");
  var insEdge = document.getElementById("inspector-edge");

  insState.style.display = "none";
  insEdge.style.display = "none";

  function updateInspector() {
    if (selectedElement.getSelectedElement()) {
      // infoDiv.innerHTML = "You selected " + selectedElement.getSelectedElement().getId() + " which is a " + selectedElement.getSelectedElement().constructor.name;
      if (selectedElement.getSelectedElement() instanceof StateVisualElement) {
        insState.style.display = "block";
        insEdge.style.display = "none";
      } else if (selectedElement.getSelectedElement() instanceof EdgeVisualElement) {
        insState.style.display = "none";
        insEdge.style.display = "block";
      }
    } else {
      insState.style.display = "none";
      insEdge.style.display = "none";
    }
  }
  selectedElement.onSelect(updateInspector);
})();