class VisualElement {
  constructor(data) {
    const defaultData = {
      id: -1,
      type: "Element",
      x: 0,
      y: 0,
      selected: false,
      playing: false,
      name: "Element"
    };
    Object.assign(this, defaultData, data);
  }
  update(data) {
    Object.assign(this, data);
  }
  draw() {
    throw "draw() not implemented";
  }
  overlapsMove(x, y) {
    throw "overlapsMove() not implemented";
  }
  overlapsInteract(x, y) {
    throw "overlapsInteract() not implemented";
  }
  overlaps(x, y) {
    return this.overlapsMove(x, y) || this.overlapsInteract(x, y);
  }
  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }
  moveBy(x, y) {
    this.x += x;
    this.y += y;
  }
  getId() {
    return this.id;
  }
  getCoords() {
    return { x: this.x, y: this.y };
  }
  select() {
    this.selected = true;
  }
  deselect() {
    this.selected = false;
  }
}

class StateVisualElement extends VisualElement {
  constructor(data) {
    const defaultData = {
      type: "State",
      width: 100,
      height: 50,
      borderThickness: 10,
      name: "State",
      image: null,
      imageElement: null,
      outgoingEdges: [],
      incomingEdges: []
    };
    super(Object.assign({}, defaultData, data));
  }
  update(data) {
    super.update(data);
    if (data.image) {
      var base64Image = String.fromCharCode(...new Uint8Array(data.image));
      var img = new Image();
      img.src = "data:image/png;base64," + base64Image;
      this.imageElement = img;
    }
  }
  draw(ctx) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "#707070";
    if (this.selected) {
      ctx.strokeStyle = "#0FF0F0";
    }
    ctx.lineWidth = this.borderThickness + 1;
    ctx.strokeRect(this.x - this.borderThickness / 2, this.y - this.borderThickness / 2, this.width + this.borderThickness, this.height + this.borderThickness);
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    ctx.fillText(this.name, this.x + 10, this.y + 25);
    if (this.imageElement) {
      ctx.drawImage(this.imageElement, this.x + 10, this.y + 30, this.width - 20, this.imageElement.height * (this.width - 20) / this.imageElement.width);
    }
  }
  overlapsMove(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }
  overlapsInteract(x, y) {
    return (!this.overlapsMove(x, y) && x >= this.x - this.borderThickness && x <= this.x + this.width + this.borderThickness && y >= this.y - this.borderThickness && y <= this.y + this.height + this.borderThickness);
  }
}

class EdgeVisualElement extends VisualElement {
  constructor(data) {
    const defaultData = {
      type: "Edge",
      sourceStateId: -1,
      targetStateId: -1,
      sourceState: null,
      targetState: null,
      lineThickness: 2,
      name: "Edge"
    };
    super(Object.assign({}, defaultData, data));
  }
  draw(ctx) {
    var sourceX = this.sourceState.x + this.sourceState.width / 2;
    var sourceY = this.sourceState.y + this.sourceState.height / 2;
    var targetX = this.targetState.x;
    var targetY = this.targetState.y;
    if (this.targetState instanceof StateVisualElement) {
      targetX = this.targetState.x + this.targetState.width / 2;
      targetY = this.targetState.y + this.targetState.height / 2;
    }

    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, targetY);

    const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 10 * Math.cos(angle - Math.PI / 6), centerY - 10 * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 10 * Math.cos(angle + Math.PI / 6), centerY - 10 * Math.sin(angle + Math.PI / 6));

    ctx.strokeStyle = "#000000";
    if (this.selected) {
      ctx.strokeStyle = "#0FF0F0";
    }
    ctx.lineWidth = this.lineThickness;
    ctx.stroke();
  }
  overlapsMove(x, y) {
    var sourceX = this.sourceState.x + this.sourceState.width / 2;
    var sourceY = this.sourceState.y + this.sourceState.height / 2;
    var targetX = this.targetState.x;
    var targetY = this.targetState.y;
    if (this.targetState instanceof StateVisualElement) {
      targetX = this.targetState.x + this.targetState.width / 2;
      targetY = this.targetState.y + this.targetState.height / 2;
    }
    var dx = targetX - sourceX;
    var dy = targetY - sourceY;
    var length = Math.sqrt(dx * dx + dy * dy);
    var distance = Math.abs(dy * x - dx * y + targetX * sourceY - targetY * sourceX) / length;
    return distance <= 5;
  }
  overlapsInteract(x, y) {
    return false;
  }
}

class TempEdgeVisualElement extends EdgeVisualElement {
  constructor(data) {
    super(data);
  }
  update(data) {
    super.update(data);
  }
  updateEnd(targetCoords) {
    this.targetState = { x: targetCoords.x, y: targetCoords.y };
  }
}

export { VisualElement, StateVisualElement, EdgeVisualElement, TempEdgeVisualElement };