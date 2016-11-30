/**
 * @jonobr1 / http://jonobr1.com/
 */
(function() {

  var root = this;
  var previousEqualizer = root.Equalizer || {};
  var styles = {
    font: {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      size: 11,
      fill: '#888',
      leading: 20,
      weight: 500
    },
    classic: {
      display: 'block',
      position: 'relative',
      background: 'transparent',
      padding: 20 + 'px'
    },
    recording: {
      position: 'absolute',
      borderRadius: '50%',
      top: 10 + 'px',
      left: '50%',
      width: 8 + 'px',
      height: 8 + 'px',
      marginLeft: - 4 + 'px',
      marginTop: - 4 + 'px',
      cursor: 'pointer',
      background: '#ccc',
      content: ''
    }
  };

  var Equalizer = root.Equalizer = function(width, height) {

    this.analyzer = Sound.analysis;
    this.domElement = document.createElement('div');
    this.domElement.classList.add('equalizer');

    var two = this.two = new Two({
      width: width || 200,
      height: height || 100
    }).appendTo(this.domElement);

    extend(two.renderer.domElement.style, styles.classic);

    var vertices = [];
    this.bands = [];
    for (var i = 0; i < Equalizer.Resolution; i++) {

      var pct = (i + 0.5) / Equalizer.Resolution;
      var x = pct * two.width;

      var band = new Two.Line(x, 0, x, 0);

      band.value = 0;
      band.linewidth = (two.width / Equalizer.Resolution) * 0.85;

      band.stroke = '#bbb';
      band.noFill();
      band.opacity = 0.5;

      band.peak = new Two.Line(x - band.linewidth / 2, 0,
        x + band.linewidth / 2, 0);

      band.peak.value = 0;
      band.peak.updated = false;
      band.peak.stroke = '#888';
      band.peak.noFill();
      band.peak.linewidth = 2;

      band.beat = new Two.Ellipse(x, two.height * 0.125, 2, 2);
      band.beat.noStroke();
      band.beat.fill = 'rgb(50, 150, 255)';

      band.direction = new Two.Line(x - band.linewidth / 2, 0,
        x + band.linewidth / 2, 0);

      band.direction.value = 0;
      band.direction.stroke = 'rgb(255, 50, 50)';
      band.direction.noFill();
      band.direction.linewidth = 2;

      var anchor = new Two.Anchor(x, 0);
      anchor.sum = 0;
      vertices.push(anchor);

      anchor.outlier = new Two.Ellipse(0, 0, 1, 1);
      anchor.outlier.noStroke();
      anchor.outlier.fill = 'rgb(150, 50, 255)';

      two.add(band, band.peak, band.beat, band.direction);
      this.bands.push(band);

    }

    this.average = new Two.Path(vertices, false, true);
    this.average.stroke = 'rgba(255, 150, 50, 0.85)';
    this.average.cap = 'round';
    this.average.linewidth = 1;
    this.average.noFill();
    this.average.index = 1;

    two.add(this.average);

    var enslave = function(anchor, i) {
      anchor.outlier.translation.unbind();
      anchor.outlier.translation = anchor;
      anchor.bind(Two.Events.change, function() {
        Two.Shape.FlagMatrix.call(anchor.outlier);
      });
    };

    for (var i = 0; i < vertices.length; i++) {
      var anchor = vertices[i];
      enslave(anchor, i);
      two.add(anchor.outlier);
    }


  };

  extend(Equalizer, {

    Resolution: 16,

    drag: 0.005,

    drift: 0.33,

    amplitude: 255,

    threshold: 0.25,

    Utils: {

      clamp: clamp,
      extend: extend,

      formatSeconds: formatSeconds,
      defaultStyles: styles

    }

  });

  extend(Equalizer.prototype, {

    appendTo: function(elem) {
      elem.appendChild(this.domElement);
      return this;
    },

    analyze: function(sound, json) {

      // TODO: Break this out to its own function..?
      if (!this.timeline) {

        var container = document.createElement('div');
        container.style.position = 'relative';
        elem.appendChild(container);

        var two = this.two;
        this.timeline = new Equalizer.Timeline(this, two.width, two.width * 1.5)
          .appendTo(container);

        this.timeline.analyze(sound, json);

      }

      this.sound = sound;

      return this;

    },

    update: function(silent) {

      var two = this.two;

      this.analyzer.getByteFrequencyData(this.analyzer.data);

      var height = two.height * 0.75;
      var step = this.analyzer.data.length / this.bands.length;

      for (var i = 0, y; i < this.bands.length; i++) {

        var pct = i / this.bands.length;
        var band = this.bands[i];
        var index = Math.floor(step * (i + 0.5));

        var value = band.value;
        var peak = band.peak.value;

        band.value = clamp(this.analyzer.data[index], 0, 255);

        if (band.value > band.peak.value) {
          band.peak.value = band.value;
          band.peak.updated = true;
        } else {
          band.peak.value -= band.peak.value * Equalizer.drag;
          band.peak.updated = false;
        }

        var direction = band.direction.value;
        band.direction.value = (band.peak.value - peak < 0 ? - 1 :
          (band.peak.value - peak === 0 ? 0 : 1));
        var changedDirection = direction !== band.direction.value;

        if (changedDirection && band.direction.value > 0) {
          band.beat.scale = 3;
          band.beat.updated = true;
        } else {
          band.beat.scale += (1 - band.beat.scale) * Equalizer.drift;
          band.beat.updated = false;
        }

        band.direction.stroke = band.direction.value <= 0 ? 'rgb(255, 100, 100)'
          : 'rgb(100, 255, 100)';

        y = two.height - height * (band.value / Equalizer.amplitude);
        band.vertices[0].y = two.height;
        band.vertices[1].y = Math.min(y, two.height - 2);

        y = two.height - height * (band.peak.value / Equalizer.amplitude);
        band.peak.vertices[0].y = band.peak.vertices[1].y = y;

        var anchor = this.average.vertices[i];
        anchor.sum += band.value;
        anchor.value = anchor.sum / this.average.index;
        anchor.y = two.height - height * anchor.value / Equalizer.amplitude;

        if (Math.abs(band.value - anchor.value) > Equalizer.amplitude * Equalizer.threshold) {
          anchor.outlier.scale = 2;
          anchor.outlier.updated = true;
        } else {
          anchor.outlier.scale += (1 - anchor.outlier.scale) * Equalizer.drift;
          anchor.outlier.updated = false;
        }

      }

      this.average.index++;

      if (this.timeline) {
        this.timeline.update(silent);
      }

      if (!silent) {
        two.update();
      }

      return this;

    },

    reset: function() {

      for (var i = 0; i < this.average.vertices.length; i++) {
        var anchor = this.average.vertices[i];
        anchor.sum = 0;
        anchor.value = 0;
        anchor.y = this.two.height;
      }

      this.average.index = 1;

      return this;

    }

  });

  function clamp(v, a, b) {
    return Math.min(Math.max(v, a), b);
  }

  function extend(base) {

    if (arguments.length < 2) {
      return base;
    }

    for (var i = 1; i < arguments.length; i++) {
      var obj = arguments[i];
      for (var k in obj) {
        base[k] = obj[k];
      }
    }

    return base;

  }

  function formatSeconds(time) {

    var min = Math.floor(time / 60);
    var sec = Math.floor(time % 60);
    var mil = Math.floor((time - Math.floor(time)) * 100);

    return [
      min < 10 ? '0' + min : min,
      sec < 10 ? '0' + sec : sec,
      mil < 10 ? '0' + mil : mil
    ].join(':');

  }

})();
