class Renderer {

  domElement;
  ctx;

  constructor(width, height) {

    this.domElement = document.createElement('canvas');
    this.domElement.width = width;
    this.domElement.height = height;

    this.ctx = this.domElement.getContext('2d');
    this.children = [];

  }

  get width() {
    return this.domElement.width;
  }
  get height() {
    return this.domElement.height;
  }

  add() {
    for (var i = 0; i < arguments.length; i++) {
      var child = arguments[i];
      var index = this.children.indexOf(child);
      if (index < 0) {
        this.children.push(child);
      } else {
        this.children.splice(index, 1);
        this.children.push(child);
      }
    }
    return this;
  }

  remove() {
    for (var i = 0; i < arguments.length; i++) {
      var child = arguments[i];
      var index = this.children.indexOf(child);
      if (index >= 0) {
        this.children.splice(index, 1);
      }
    }
    return this;
  }

  appendTo(elem) {
    elem.appendChild(this.domElement);
    return this;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.domElement.width, this.domElement.height);
    return this;
  }

  render() {

    for (var i = 0; i < this.children.length; i++) {
      this.children[i].render(this.ctx);
    }

    return this;

  }

}

class Point {

  x = 0;
  y = 0;
  value = 0;
  sum = 0;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

}

class Shape {

  fill = '#fff';
  linewidth = 1;
  stroke = '#000';
  opacity = 1;
  updated = false;
  position;
  scale = 1;

  constructor() {
    this.position = new Point();
  }

  noStroke() {
    this.stroke = 'transparent';
    return this;
  }

  noFill() {
    this.fill = 'transparent';
    return this;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = this.fill;
    ctx.lineWidth = this.linewidth;
    ctx.strokeStyle = this.stroke;
    ctx.globalAlpha = this.opacity;
  }

}

class Line extends Shape {

  x1 = 0;
  y1 = 0;
  x2 = 0;
  y2 = 0;
  value = 0;

  constructor(x1, y1, x2, y2) {
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  render(ctx) {
    super.render(ctx);
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return this;
  }

}

class Circle extends Shape {

  x = 0;
  y = 0;
  r = 0;

  constructor(x, y, r) {
    super();
    this.x = x;
    this.y = y;
    this.r = r;
  }

  render(ctx) {
    super.render(ctx);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * this.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return this;
  }

}

class Polyline extends Shape {

  vertices;
  index = 0;

  constructor(vertices) {
    super();
    this.vertices = vertices;
  }

  render(ctx) {
    super.render(ctx);
    ctx.beginPath();
    for (var i = 0; i < this.vertices.length; i++) {
      var v = this.vertices[i];
      if (i === 0) {
        ctx.moveTo(v.x, v.y);
      } else {
        ctx.lineTo(v.x, v.y);
      }
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

}


export {
  Point,
  Renderer,
  Shape,
  Line,
  Circle,
  Polyline
};
