import { selectedElement } from "../managers/selectedelementManager.js";
import { StateVisualElement, EdgeVisualElement } from "../classes/editorelementsClass.js";

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
})();