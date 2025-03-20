import { TempEdgeVisualElement } from "../classes/editorelementsClass.js";

class ElementSelector {
  constructor() {
    this.selectedElement = null;
    this.changeCallback = null;
  }

  selectElement(element) {
    if (this.selectedElement === element) {
      return;
    }
    this.deselectElement();
    this.selectedElement = element;
    this.selectedElement.select();
    if (this.changeCallback) {
      this.changeCallback(this.selectedElement);
    }
  }

  deselectElement() {
    if (this.selectedElement) {
      this.selectedElement.deselect();
      this.selectedElement = null;
    }
    if (this.changeCallback) {
      this.changeCallback(this.selectedElement);
    }
  }

  getSelectedElement() {
    return this.selectedElement;
  }

  onChange(callback) {
    this.changeCallback = callback;
  }
}

export const selectedElement = new ElementSelector();