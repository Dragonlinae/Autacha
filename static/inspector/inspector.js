import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";

(function () {
  var insState = document.getElementById("inspector-state");
  var insEdge = document.getElementById("inspector-edge");

  insState.hidden = true;
  insEdge.hidden = true;

  function updateInspector() {
    if (selectedElement.getSelectedElement()) {
      if (selectedElement.getSelectedElement() instanceof StateVisualElement) {
        insState.hidden = false;
        insState.update();
        insEdge.hidden = true;
      } else if (selectedElement.getSelectedElement() instanceof EdgeVisualElement) {
        insState.hidden = true;
        insEdge.hidden = false;
      }
    } else {
      insState.hidden = true;
      insEdge.hidden = true;
    }
  }
  selectedElement.onSelect(updateInspector);
})();