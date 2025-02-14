import { TempEdgeVisualElement } from "../classes/editorelementsClass.js";

class ElementSelector {
  constructor() {
    this.selectedElement = null;
    this.selectCallback = null;
  }

  selectElement(element) {
    if (this.selectedElement === element) {
      return;
    }
    this.deselectElement();
    this.selectedElement = element;
    this.selectedElement.select();
    if (this.selectCallback) {
      this.selectCallback(this.selectedElement);
    }
  }

  deselectElement() {
    if (this.selectedElement) {
      this.selectedElement.deselect();
      this.selectedElement = null;
    }
  }

  getSelectedElement() {
    return this.selectedElement;
  }

  onSelect(callback) {
    this.selectCallback = callback;
  }
}

export const selectedElement = new ElementSelector();