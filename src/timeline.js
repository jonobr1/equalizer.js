(function() {

  var root = this;
  var Equalizer = root.Equalizer || {};

  var Timeline = Equalizer.Timeline = function(equalizer, width, height) {

    var scope = this;

    this.equalizer = equalizer;
    this.tracks = [];

    var two = this.two = new Two({
      width: width || 200,
      height: height || 300
    });

    Equalizer.Utils.extend(two.renderer.domElement.style, Equalizer.Utils.defaultStyles.classic, {
      paddingTop: 0,
      cursor: 'ns-resize'
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

      line.noFill().stroke = Timeline.Colors.lightGray;
      this.layers.backdrop.add(line);

      this.tracks.push(new Timeline.Track(this, i));

    }

    x = two.width / 2;
    y = Timeline.Padding - two.height / 2;

    this.needle = new Two.Line(- x, y, x, y);
    this.needle.noFill().stroke = Timeline.Colors.gray;
    this.layers.labels.add(this.needle);

    this.time = new Two.Text(Equalizer.Utils.formatSeconds(0), - x, y - Equalizer.Utils.defaultStyles.font.leading / 2, Equalizer.Utils.defaultStyles.font);
    this.time.alignment = 'left';
    this.layers.labels.add(this.time);

    this.duration = new Two.Text(Equalizer.Utils.formatSeconds(0), x, y - Equalizer.Utils.defaultStyles.font.leading / 2, Equalizer.Utils.defaultStyles.font);
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
        this.style.top = (this._enabled ? two.height - 10 : 10) + 'px';
        scope.needle.translation.y = this._enabled ? two.height / 2 : Timeline.Padding - two.height / 2;
        scope.time.translation.y = scope.needle.translation.y - Equalizer.Utils.defaultStyles.font.leading / 2;
        scope.duration.translation.y = scope.time.translation.y;
      }
    });

    Equalizer.Utils.extend(this.recording.style, Equalizer.Utils.defaultStyles.recording);
    this.recording.enabled = false;

    for (i = 0; i < Timeline.Resolution; i++) {
      var shape = new Two.Line(0, 0, 0, 0);
      shape.stroke = Timeline.Colors.blue;
      shape.linewidth = 4;
      shape.cap = 'round';
      shape.visible = false;
      this.layers.stage.add(shape);
    }

    two.scene.translation.set(two.width / 2, two.height / 2);

    Timeline.addInteraction.call(this);

  };

  Equalizer.Utils.extend(Timeline, {

    Colors: {
      lightGray: '#eee',
      gray: '#888',
      blue: 'rgb(50, 150, 255)',
      purple: 'rgb(150, 50, 255)',
      orange: 'orange'
    },

    Resolution: 512,

    Atomic: 0.33,

    Padding: 20,

    Viscosity: 0.125,  // Seconds

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

  Equalizer.Utils.extend(Timeline.prototype, {

    sound: null,
    range: 3, // in seconds

    appendTo: function(elem) {
      this.two.appendTo(elem);
      elem.appendChild(this.recording);
      return this;
    },

    analyze: function(sound, json) {
      this.sound = sound;
      this.duration.value = Equalizer.Utils.formatSeconds(this.sound.duration);
      if (json) {
        this.fromJSON(json);
      }
      return this;
    },

    update: function(silent) {

      if (!this.sound) {
        return this;
      }

      var currentTime = parseFloat(this.sound.currentTime.toFixed(3));
      var two = this.two;
      var i, id = 0; // index of shape to be drawn.
      var bands = this.equalizer.bands;

      this.time.value = Equalizer.Utils.formatSeconds(currentTime);

      for (i = this.tracks.length - 1; i >= 0; i--) {

        var pct = (i + 0.5) / this.tracks.length;
        var band = bands[i];
        var track = this.tracks[i];

        if (this.recording.enabled && band.beat.updated) {
          track.add(currentTime);
        }

        track.update(currentTime);

        var uid = track.elements.index;
        var unit = track.elements[uid];

        if (this.recording.enabled) {

          if (!unit) {
            uid = track.elements.length - 1;
            unit = track.elements[uid];
          }

          while (id < Timeline.Resolution && unit
            && (unit.time > (currentTime - this.range) || unit.value > (currentTime - this.range))) {

            var shape = this.layers.stage.children[id];
            var ypct = (unit.time - currentTime) / this.range;

            if (unit.time < currentTime) {
              shape.visible = true;
              shape.translation.x = two.width * pct - two.width / 2;
              shape.translation.y = two.height * ypct + this.needle.translation.y;
              switch (unit.type) {
                case Timeline.Unit.Types.hold:
                  shape.vertices[1].y = two.height * (unit.value - unit.time)
                    / this.range;
                  break;
                default:
                  shape.vertices[1].y = 0;
                  shape.stroke = Timeline.Colors.blue;
              }
              id++;
            }

            uid--;
            unit = track.elements[uid];

          }

        } else {

          if (!unit) {
            uid = 0;
            unit = track.elements[uid];
          }

          while (id < Timeline.Resolution && unit
            && (unit.time < (currentTime + this.range) || unit.value < (currentTime + this.range))) {

            var shape = this.layers.stage.children[id];
            var ypct = (unit.time - currentTime) / this.range;

            if (unit.time > currentTime || unit.value > currentTime) {
              shape.visible = true;
              shape.translation.x = two.width * pct - two.width / 2;
              shape.translation.y = two.height * ypct + this.needle.translation.y;
              switch (unit.type) {
                case Timeline.Unit.Types.hold:
                  shape.vertices[1].y = two.height * (unit.value - unit.time)
                    / this.range;
                  break;
                default:
                  shape.vertices[1].y = 0;
              }
              id++;
            }

            uid++;
            unit = track.elements[uid];

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

        // Maps the objects elements to the tracks
        // so that you can try to accommodate different
        // bandwidth resolutions.
        var pct = i / this.tracks.length;
        var index = Math.floor(obj.elements.length * pct);
        this.tracks[i].fromJSON(obj.elements[index]);

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

  Equalizer.Utils.extend(Timeline.Track.prototype, {

    add: function(time) {

      if (this.elements.length <= 0) {
        this.elements.push(new Timeline.Unit(time, true));
        return this;
      }

      var length = this.elements.length;
      var index = Math.min(this.elements.index, length - 1);
      var ref = this.elements[index];
      var i;

      if (Math.abs(time - ref.time) < Timeline.Viscosity
        || (ref.type === Timeline.Unit.Types.hold && Math.abs(time - ref.value) < Timeline.Viscosity)) {
        ref.type = Timeline.Unit.Types.hold;
        ref.value = time;
        return this;
      }

      var unit = new Timeline.Unit(time, true);

      if (time > ref.time) {
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

      var a = ref, b = ref, index;

      if (ref.time > time) {
        // TODO: Need to do a diff of time values so that the index
        // jumps in a `snap` like way and doesn't flip-flop between
        // two indices.
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

  Equalizer.Utils.extend(Timeline.Unit, {

    Types: {
      beat: 'beat',
      hold: 'hold'
    }

  });

  Equalizer.Utils.extend(Timeline.Unit.prototype, {

    type: Timeline.Unit.Types.beat,
    time: 0,
    value: false

  });

})();
