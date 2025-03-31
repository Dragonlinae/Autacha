import { selectedElement } from "../managers/selectedelementManager.js";
import { EdgeVisualElement } from "../classes/editorelementsClass.js";
import socket from "../managers/socketManager.js";

(function () {
  var inspectorEdgeDiv = document.getElementById("inspector-edge");

  var edgePriorityDiv = document.getElementById("edge-priority");

  edgePriorityDiv.addEventListener("change", function (event) {
    socket.emit("edge_priority_event", { id: selectedElement.getSelectedElement().getId(), action: "set", priority: event.target.value });
  });

  inspectorEdgeDiv.update = function () {
    console.log("Updating");
    if (selectedElement.getSelectedElement() instanceof EdgeVisualElement) {
      edgePriorityDiv.value = selectedElement.getSelectedElement().priority;
    }
  };
})();