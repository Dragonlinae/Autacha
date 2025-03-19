import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";

(function () {
  var insState = document.getElementById("inspector-state");
  var insEdge = document.getElementById("inspector-edge");
  var insActionList = document.getElementById("inspector-action-list")

  insState.hidden = true;
  insEdge.hidden = true;

  function updateInspector() {
    if (selectedElement.getSelectedElement()) {
      if (selectedElement.getSelectedElement() instanceof StateVisualElement) {
        insState.hidden = false;
        insState.update();
        insEdge.hidden = true;
        insActionList.hidden = false;
        insActionList.update();
      } else if (selectedElement.getSelectedElement() instanceof EdgeVisualElement) {
        insState.hidden = true;
        insEdge.hidden = false;
        insActionList.hidden = false;
        insActionList.update();
      }
    } else {
      insState.hidden = true;
      insEdge.hidden = true;
      insActionList.hidden = true;
    }
  }
  selectedElement.onSelect(updateInspector);
})();