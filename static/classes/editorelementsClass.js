class VisualElement {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.selected = false;
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
  unselect() {
    this.selected = false;
  }
}

class StateVisualElement extends VisualElement {
  constructor(id, x, y, text, image) {
    super(id, x, y);
    this.text = text;
    this.image = image;
    this.width = 100;
    this.height = 50;
    this.borderThickness = 10;
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
    ctx.fillText(this.text, this.x + 10, this.y + 25);
    if (this.image) {
      ctx.drawImage(this.image, this.x + 10, this.y + 30, this.width - 20, this.image.height * (this.width - 20) / this.image.width);
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
  constructor(id, from, to) {
    super(id, from.x, from.y);
    this.from = from;
    this.to = to;
  }
  draw(ctx) {
    var fromX = this.from.x + this.from.width / 2;
    var fromY = this.from.y + this.from.height / 2;
    var toX = this.to.x;
    var toY = this.to.y;
    if (this.to instanceof StateVisualElement) {
      toX = this.to.x + this.to.width / 2;
      toY = this.to.y + this.to.height / 2;
    }

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const centerX = (fromX + toX) / 2;
    const centerY = (fromY + toY) / 2;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 10 * Math.cos(angle - Math.PI / 6), centerY - 10 * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 10 * Math.cos(angle + Math.PI / 6), centerY - 10 * Math.sin(angle + Math.PI / 6));

    ctx.strokeStyle = "#000000";
    if (this.selected) {
      ctx.strokeStyle = "#0FF0F0";
    }
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  overlapsMove(x, y) {
    var fromX = this.from.x + this.from.width / 2;
    var fromY = this.from.y + this.from.height / 2;
    var toX = this.to.x;
    var toY = this.to.y;
    if (this.to instanceof StateVisualElement) {
      toX = this.to.x + this.to.width / 2;
      toY = this.to.y + this.to.height / 2;
    }
    var dx = toX - fromX;
    var dy = toY - fromY;
    var length = Math.sqrt(dx * dx + dy * dy);
    var distance = Math.abs(dy * x - dx * y + toX * fromY - toY * fromX) / length;
    return distance <= 5;
  }
  overlapsInteract(x, y) {
    return false;
  }
}

export { VisualElement, StateVisualElement, EdgeVisualElement };