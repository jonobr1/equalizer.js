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
      background: 'white',
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
  }

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

    threshold: 0.25

  });

  extend(Equalizer.prototype, {

    appendTo: function(elem) {
      elem.appendChild(this.domElement);
      return this;
    },

    analyze: function(sound, json) {

      if (!this.timeline) {

        var container = document.createElement('div');
        container.style.position = 'relative';
        elem.appendChild(container);

        var two = this.two;
        this.timeline = new Timeline(this, two.width, two.width * 2)
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

      for (var i = 0, y; i < this.bands.length; i++) {

        var pct = i / this.bands.length;
        var band = this.bands[i];
        var index = Math.floor(pct * this.analyzer.data.length);

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

  var Timeline = Equalizer.Timeline = function(equalizer, width, height) {

    var scope = this;

    this.equalizer = equalizer;
    this.tracks = [];

    var two = this.two = new Two({
      type: Two.Types.canvas,
      width: width || 200,
      height: height || 400
    });

    extend(two.renderer.domElement.style, styles.classic, {
      paddingTop: 0
    });

    this.layers = {
      backdrop: two.makeGroup(),
      rulers: two.makeGroup(),
      stage: two.makeGroup(),
      labels: two.makeGroup()
    };

    var i, line, x, y, text;

    for (i = 0; i < Equalizer.Resolution; i++) {

      var pct = (i + 0.5) / Equalizer.Resolution;

      x = pct * two.width - two.width / 2;
      y = two.height / 2;
      line = new Two.Line(x, - y, x, y);

      line.noFill().stroke = '#eee';
      this.layers.backdrop.add(line);

      this.tracks.push(new Timeline.Track(this, i));

    }

    x = two.width / 2;
    y = 20 - two.height / 2;

    line = this.needle = new Two.Line(- x, y, x, y);
    line.noFill().stroke = '#888';
    this.layers.labels.add(line);

    this.time = new Two.Text(formatSeconds(0), - x, y - styles.font.leading / 2, styles.font);
    this.time.alignment = 'left';
    this.layers.labels.add(this.time);

    this.duration = new Two.Text(formatSeconds(0), x, y - styles.font.leading / 2, styles.font);
    this.duration.alignment = 'right';
    this.duration.fill = '#bbb';
    this.layers.labels.add(this.duration);

    this.recording = document.createElement('div');
    this.recording.classList.add('recording');

    Object.defineProperty(this.recording, 'enabled', {
      get: function() {
        return this._enabled;
      },
      set: function(v) {
        this._enabled = !!v;
        this.style.background = this._enabled ? 'rgb(255, 50, 50)' : '#888';
      }
    });
    extend(this.recording.style, styles.recording);
    this.recording.enabled = true;

    for (i = 0; i < Timeline.Resolution; i++) {
      var shape = new Two.Ellipse(0, 0, 2, 2);
      shape.fill = 'rgb(50, 150, 255)';
      shape.noStroke();
      shape.visible = false;
      this.layers.stage.add(shape);
    }

    two.scene.translation.set(two.width / 2, two.height / 2);

    Timeline.addInteraction.call(this);

  };

  extend(Timeline, {

    Resolution: 512,

    Atomic: 0.33,

    addInteraction: function() {

      var scope = this;
      var two = this.two;
      var stage = this.two.renderer.domElement;

      stage.addEventListener('mousewheel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var dy = e.deltaY / two.height;
        scope.range = Math.max(Math.min(scope.range + dy, scope.sound.duration), Timeline.Atomic);
      }, false);

      var mouse = new Two.Vector();

      var mousedown = function(e) {

        var rect = stage.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        mouse.playing = scope.sound.playing;
        mouse.set(x, y);
        scope.sound.pause();

        window.addEventListener('mousemove', mousemove, false);
        window.addEventListener('mouseup', mouseup, false);

      };
      var mousemove = function(e) {

        e.preventDefault();

        var rect = stage.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        scope.sound.currentTime -= scope.range * (y - mouse.y) / two.height;
        mouse.set(x, y);

      };
      var mouseup = function(e) {

        window.removeEventListener('mousemove', mousemove, false);
        window.removeEventListener('mouseup', mouseup, false);

        if (mouse.playing) {
          scope.sound.play();
        }

      };

      var keydown = function(e) {

        var triggered = false;

        switch (String.fromCharCode(e.which)) {

          case ' ':
            triggered = true;
            scope.sound[scope.sound.playing ? 'pause' : 'play']();
            break;

        }

        if (triggered) {
          e.preventDefault();
        }

      };

      this.recording.addEventListener('click', function() {
        scope.recording.enabled = !scope.recording.enabled;
      }, false);
      stage.addEventListener('mousedown', mousedown, false);
      window.addEventListener('keydown', keydown, false);

    }

  });

  extend(Timeline.prototype, {

    sound: null,
    range: 5, // in seconds

    appendTo: function(elem) {
      this.two.appendTo(elem);
      elem.appendChild(this.recording);
      return this;
    },

    analyze: function(sound, json) {
      this.sound = sound;
      this.duration.value = formatSeconds(this.sound.duration);
      if (json) {
        this.fromJSON(json);
      }
      return this;
    },

    update: function(silent) {

      var currentTime = parseFloat(this.sound.currentTime.toFixed(3));

      if (this.sound) {
        this.time.value = formatSeconds(currentTime);
      }

      var two = this.two;
      var i, id = 0; // index of shape to be drawn.
      var bands = this.equalizer.bands;

      for (i = this.tracks.length - 1; i >= 0; i--) {

        var pct = (i + 0.5) / this.tracks.length;
        var band = bands[i];
        var track = this.tracks[i];

        if (this.recording.enabled && band.beat.updated) {
          track.add(new Timeline.Unit(currentTime, true));
        }

        track.update(currentTime);

        var uid = track.elements.index;
        var unit = track.elements[uid];

        if (unit) {

          while (id < Timeline.Resolution && unit
            && unit.time < (currentTime + this.range)) {

            var shape = this.layers.stage.children[id];
            var ypct = (unit.time - currentTime) / this.range;

            shape.visible = true;
            shape.translation.x = two.width * pct - two.width / 2;
            shape.translation.y = two.height * ypct + this.needle.translation.y;

            uid++;
            unit = track.elements[uid];
            id++;

          }

        }

      }

      for (i = id; i < Timeline.Resolution; i++) {
        var shape = this.layers.stage.children[i];
        shape.visible = false;
      }

      if (!silent) {
        this.two.update();
      }

      return this;

    },

    toJSON: function() {

      var resp = {
        url: this.sound.url || '',
        duration: this.sound.duration,
        elements: []
      };

      for (var i = 0; i < this.tracks.length; i++) {
        var json = this.tracks[i].toJSON();
        resp.elements.push(json);
      }

      return resp;

    },

    fromJSON: function(obj) {

      for (var i = 0; i < this.tracks.length; i++) {
        this.tracks[i].fromJSON(obj.elements[i]);
      }

      return this;

    }

  });

  Timeline.Track = function(timeline, i) {

    this.timeline = timeline;
    this.index = i;
    this.elements = [];
    this.elements.index = 0;

  };

  extend(Timeline.Track.prototype, {

    add: function(unit) {

      if (this.elements.length <= 0) {
        this.elements.push(unit);
        return this;
      }

      var length = this.elements.length;
      var index = Math.min(this.elements.index, length - 1);
      var ref = this.elements[index];
      var i;

      if (unit.time > ref.time) {
        for (i = index; i < length; i++) {
          ref = this.elements[i];
          if (unit.time < ref.time) {
            this.elements.splice(i, 0, unit);
            this.elements.index = i;
            return this;
          }
        }
        this.elements.push(unit);
        this.elements.index = this.elements.length - 1;
        return this;
      }

      for (i = index; i >= 0; i--) {
        ref = this.elements[i];
        if (unit.time > ref.time) {
          this.elements.splice(i + 1, 0, unit);
          this.elements.index = i + 1;
          return this;
        }
      }
      this.elements.unshift(unit);
      this.elements.index = 0;
      return this;

    },

    update: function(time) {

      if (this.elements.length <= 0) {
        return this;
      }

      var ref = this.elements[this.elements.index];

      if (!ref) {
        this.elements.index = 0;
        ref = this.elements[0];
      }

      if (ref.time > time) {
        while (this.elements.index > 0 && this.elements[this.elements.index].time > time) {
          this.elements.index--;
        }
        return this;
      }

      while (this.elements.index < this.elements.length && this.elements[this.elements.index].time < time) {
        this.elements.index++;
      }
      return this;

    },

    toJSON: function() {
      var resp = [];
      for (var i = 0; i < this.elements.length; i++) {
        var el = this.elements[i];
        resp.push({ t: el.time, v: el.value ? 1 : 0 });
      }
      return resp;
    },

    fromJSON: function(list) {
      this.elements.length = 0;
      this.elements.index = 0;
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        this.elements.push(new Timeline.Unit(el.t, !!el.v));
      }
      return this;
    }

  });

  Timeline.Unit = function(time, value) {

    this.time = time || 0;
    this.value = value || true;

  };

  extend(Timeline.Unit, {

    Types: {
      beat: 'beat'
    }

  });

  extend(Timeline.Unit.prototype, {

    type: Timeline.Unit.Types.beat,
    time: 0,
    value: false

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
