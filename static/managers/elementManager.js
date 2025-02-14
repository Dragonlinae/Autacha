import { StateVisualElement, EdgeVisualElement, TempEdgeVisualElement } from "../classes/editorelementsClass.js";

class ElementManager {
  constructor() {
    this.visualStates = [];
    this.visualEdges = [];
    this.tempEdge = null;
  }

  addState(data) {
    this.visualStates.push(new StateVisualElement(data));
  }

  addEdge(data) {
    this.visualEdges.push(new EdgeVisualElement(data));
  }

  startTempEdge(sourceState, x, y) {
    this.tempEdge = new TempEdgeVisualElement({ sourceState, targetState: { x, y } });
  }

  updateTempEdge(x, y) {
    if (this.tempEdge !== null) {
      this.tempEdge.updateEnd(x, y);
    }
  }

  endTempEdge(x, y) {
    if (this.tempEdge !== null) {
      var sourceStateID = this.tempEdge.sourceState.id;
      var targetState = this.findOverlapState(x, y) || this.findOverlapStateInteract(x, y);
      this.tempEdge = null;
      if (targetState !== null) {
        var targetStateID = targetState.id;
        return { sourceStateID, targetStateID };
      }
    }
    return null;
  }

  findOverlapState(x, y) {
    for (let i = this.visualStates.length - 1; i >= 0; i--) {
      const element = this.visualStates[i];
      if (element.overlapsMove(x, y)) {
        return element;
      }
    }
    return null;
  }

  findOverlapStateInteract(x, y) {
    for (let i = this.visualStates.length - 1; i >= 0; i--) {
      const element = this.visualStates[i];
      if (element.overlapsInteract(x, y)) {
        return element;
      }
    }
    return null;
  }

  findOverlapEdge(x, y) {
    for (let i = this.visualEdges.length - 1; i >= 0; i--) {
      const element = this.visualEdges[i];
      if (element.overlapsMove(x, y)) {
        return element;
      }
    }
    return null;
  }

  findOverlap(x, y) {
    var element = this.findOverlapState(x, y);
    if (element !== null) {
      return { element, type: "State" };
    }
    element = this.findOverlapStateInteract(x, y);
    if (element !== null) {
      return { element, type: "StateInteract" };
    }
    element = this.findOverlapEdge(x, y);
    if (element !== null) {
      return { element, type: "Edge" };
    }
    return null;
  }

  findElement(id) {
    for (const element of this.visualStates) {
      if (element.id === id) {
        return element;
      }
    }
    for (const element of this.visualEdges) {
      if (element.id === id) {
        return element;
      }
    }
    return null;
  }

  edgeTransformer(edge) {
    edge.sourceState = this.findElement(edge.sourceStateId);
    edge.targetState = this.findElement(edge.targetStateId);
  }

  drawElements(ctx) {
    for (const element of this.visualEdges) {
      element.draw(ctx);
    }
    if (this.tempEdge !== null) {
      this.tempEdge.draw(ctx);
    }
    for (const element of this.visualStates) {
      element.draw(ctx);
    }
  }

  deleteElement(id) {
    for (let i = 0; i < this.visualStates.length; i++) {
      if (this.visualStates[i].id === id) {
        this.visualStates.splice(i, 1);
        return;
      }
    }
    for (let i = 0; i < this.visualEdges.length; i++) {
      if (this.visualEdges[i].id === id) {
        this.visualEdges.splice(i, 1);
        return;
      }
    }
  }

  updateElement(data) {
    if (data.type == "Edge") {
      this.edgeTransformer(data);
    }

    const element = this.findElement(data.id);
    if (element !== null) {
      element.update(data);
    } else {
      if (data.type === "State") {
        this.addState(data);
      } else if (data.type === "Edge") {
        this.addEdge(data);
      } else if (data.type === "Delete") {
        this.deleteElement(data.id);
      }
    }
  }
}

export { ElementManager };