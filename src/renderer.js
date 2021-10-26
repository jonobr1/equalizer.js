class Renderer {

  domElement;
  ctx;

  constructor(width, height) {

    this.domElement = document.createElement('canvas');
    this.domElement.width = width * window.devicePixelRatio;
    this.domElement.height = height * window.devicePixelRatio;
    this.domElement.style.width = width + 'px';
    this.domElement.style.height = height + 'px';

    this.ctx = this.domElement.getContext('2d');
    this.children = [];

  }

  get width() {
    return this.domElement.width / window.devicePixelRatio;
  }
  get height() {
    return this.domElement.height / window.devicePixelRatio;
  }

  appendTo(elem) {
    elem.appendChild(this.domElement);
    return this;
  }

  save() {
    this.ctx.save();
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  restore() {
    this.ctx.restore();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.domElement.width, this.domElement.height);
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
  scale = 1;

  constructor() {}

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

class Band extends Line {

  value = 0;
  peak = new Peak(0, 0, 0, 0);
  beat = new Circle(0, 0, 0);
  direction = new Direction(0, 0, 0, 0);

}

class Peak extends Line {

  value = 0;
  updated = false;

}

class Direction extends Line {

  value = 0;

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

class Anchor extends Circle {

  sum = 0;
  value = 0;
  updated = false;

  constructor(x, y, r) {
    super(x, y, r);
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
    var i, v;
    for (i = 0; i < this.vertices.length; i++) {
      v = this.vertices[i];
      if (i === 0) {
        ctx.moveTo(v.x, v.y);
      } else {
        ctx.lineTo(v.x, v.y);
      }
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    for (i = 0; i < this.vertices.length; i++) {
      v = this.vertices[i];
      if (v.render) {
        v.render(ctx);
      }
    }
  }

}


export {
  Point,
  Renderer,
  Shape,
  Band,
  Line,
  Circle,
  Anchor,
  Polyline
};
