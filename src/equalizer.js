import Sound from './sound.js';
import { Renderer, Line, Circle, Point, Polyline } from './renderer.js';
import { clamp, extend, mod } from './underscore.js';
import { styles, colors } from './styles.js';

export default class Equalizer {

  static Precision = 0; // [0, 255]
  static Resolution = 16;
  static Drag = 0.005;
  static Drift = 0.33;
  static Amplitude = 255;
  static Threshold = 0.25;
  static Sound = Sound;

  analysed;
  analyser;
  domElement;
  nodes;
  renderer;
  bands;
  average;

  constructor(context, width, height, fftSize) {

    this.ctx = context || Sound.ctx;
    this.nodes = [];

    this.analyser = this.ctx.createAnalyser();
    this.analyser.connect(this.ctx.destination);
    this.analyser.fftSize = fftSize || this.analyser.frequencyBinCount;
    this.analyser.data = new Uint8Array(this.analyser.frequencyBinCount);

    this.domElement = document.createElement('div');
    this.domElement.classList.add('equalizer');

    this.renderer = new Renderer(width || 200, height || 100)
      .appendTo(this.domElement);

    extend(this.renderer.domElement.style, styles.classic);

    var vertices = [];
    this.bands = [];
    for (var i = 0; i < Equalizer.Resolution; i++) {

      var pct = (i + 0.5) / Equalizer.Resolution;
      var x = pct * this.renderer.width;

      var band = new Line(x, 0, x, 0);

      band.value = 0;
      band.linewidth = (this.renderer.width / Equalizer.Resolution) * 0.85;

      band.stroke = colors['bbb'];
      band.noFill();
      band.opacity = 0.5;

      band.peak = new Line(x - band.linewidth / 2, 0,
        x + band.linewidth / 2, 0);

      band.peak.value = 0;
      band.peak.updated = false;
      band.peak.stroke = colors['888'];
      band.peak.noFill();
      band.peak.linewidth = 2;

      band.beat = new Circle(x, this.renderer.height * 0.125, 2);
      band.beat.noStroke();
      band.beat.fill = colors.blue;

      band.direction = new Line(x - band.linewidth / 2, 0,
        x + band.linewidth / 2, 0);

      band.direction.value = 0;
      band.direction.stroke = colors.red;
      band.direction.noFill();
      band.direction.linewidth = 2;

      var anchor = new Point(x, 0);
      anchor.sum = 0;
      vertices.push(anchor);

      anchor.outlier = new Circle(0, 0, 1);
      anchor.outlier.noStroke();
      anchor.outlier.fill = colors.purple;

      // this.renderer.add(band, band.peak, band.beat, band.direction);
      this.bands.push(band);

    }

    this.average = new Polyline(vertices);
    this.average.stroke = colors.gold;
    this.average.opacity = 0.85;
    this.average.linewidth = 1;
    this.average.noFill();
    this.average.index = 1;

    // this.renderer.add(this.average);

  }

  appendTo(elem) {
    elem.appendChild(this.domElement);
    return this;
  }

  load(path, callback) {

    return new Promise(function(resolve, reject) {

      var scope = this;

      var r = new XMLHttpRequest();
      r.open('GET', path, true);

      r.onerror = reject;
      r.onload = function() {

        var data = JSON.parse(r.response);
        scope.analysed = data;

        if (callback) {
          callback();
        }

        resolve(scope.analysed);

      };

      r.send();

    });

  }

  add(node) {

    if (this.nodes.indexOf(node) < 0) {
      this.nodes.push(node);
      node.connect(this.analyser);
    }

    return this;

  }

  remove(node) {

    var index = this.nodes.indexOf(node);
    if (index >= 0) {
      return this.nodes.splice(index, 1);
    }

    return null;

  }

  update(currentTime, silent) {

    if (this.analysed) {
      var sid = Math.floor(currentTime * this.analysed.frameRate);
      var sample = this.analysed.samples[sid];
      if (sample) {
        this.analyser.data = Uint8Array.from(sample);
      } else {
        this.analyser.data = new Uint8Array(this.analysed.resolution);
      }
    } else {
      this.analyser.getByteFrequencyData(this.analyser.data);
    }

    var height = this.renderer.height * 0.75;
    var step = this.analyser.data.length / this.bands.length;

    var sum = 0;
    var bin = Math.floor(step);

    this.renderer.clear();

    for (var j = 0, i = 0; j < this.analyser.data.length; j++) {

      var k = mod(Math.floor(j - bin / 2), bin);
      sum += clamp(this.analyser.data[j], 0, 255);

      if (k !== 0) {
        continue;
      }

      var pct = i / this.bands.length;
      var band = this.bands[i];

      var value = band.value;
      var peak = band.peak.value;

      var direction, changedDirection, y, anchor;

      band.value = sum / bin;

      if (band.value > band.peak.value) {
        band.peak.value = band.value;
        band.peak.updated = true;
      } else {
        band.peak.value -= band.peak.value * Equalizer.Drag;
        band.peak.updated = false;
      }

      direction = band.direction.value;
      band.direction.value = (band.peak.value - peak < - Equalizer.Precision
        ? - 1 : (band.peak.value - peak <= Equalizer.Precision ? 0 : 1));
      changedDirection = direction !== band.direction.value;

      if (changedDirection && band.direction.value > 0) {
        band.beat.scale = 3;
        band.beat.updated = true;
      } else {
        band.beat.scale += (1 - band.beat.scale) * Equalizer.Drift;
        band.beat.updated = false;
      }

      band.direction.stroke = band.direction.value <= 0 ? colors.pink
        : colors.green;

      y = this.renderer.height - height * (band.value / Equalizer.Amplitude);
      band.y1 = this.renderer.height;
      band.y2 = Math.min(y, this.renderer.height - 2);

      y = this.renderer.height - height * (band.peak.value / Equalizer.Amplitude);
      band.peak.y1 = band.peak.y2 = y;

      anchor = this.average.vertices[i];
      anchor.sum += band.value;
      anchor.value = anchor.sum / this.average.index;
      anchor.y = this.renderer.height - height * anchor.value / Equalizer.Amplitude;

      if (Math.abs(band.value - anchor.value)
        > Equalizer.Amplitude * Equalizer.Threshold) {
        anchor.outlier.scale = 2;
        anchor.outlier.updated = true;
      } else {
        anchor.outlier.scale += (1 - anchor.outlier.scale) * Equalizer.Drift;
        anchor.outlier.updated = false;
      }

      band.render(this.renderer.ctx);
      band.peak.render(this.renderer.ctx);
      band.beat.render(this.renderer.ctx);
      band.direction.render(this.renderer.ctx);

      sum = 0;
      i++;

    }

    this.average.render(this.renderer.ctx);

    if (this.analysed) {
      // TODO: Extrapolate the data to this.analyser.data
      // from this.analysed
    } else {
      this.analyser.getByteTimeDomainData(this.analyser.data);
    }

    this.average.index++;

    return this;

  }

  reset() {

    for (var i = 0; i < this.average.vertices.length; i++) {
      var anchor = this.average.vertices[i];
      anchor.sum = 0;
      anchor.value = 0;
      anchor.y = this.renderer.height;
    }

    this.average.index = 1;

    return this;

  }

  //

  get analyzer() {
    return this.analyser;
  }

  set analyzer(v) {
    this.analyser = v;
  }

  get analyzed() {
    return this.analysed;
  }

  set analyzed(v) {
    this.analysed = v;
  }

}
