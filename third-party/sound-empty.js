/**
 * @jonobr1 / http://jonobr1.com/
 */

(function() {

  var Empty = Sound.Empty = function(data) {

    var scope = this;

    this.duration = data.duration || 0;
    this.url = data.url || '';

    this._tick = function() {

      if (scope.playing) {
        requestAnimationFrame(scope._tick);
      }

      var now = Date.now();
      scope._currentTime += (now - scope._tick.then) / 1000;
      scope._tick.then = now;

      if (scope._currentTime < scope.duration) {
        return;
      }

      scope.currentTime = scope._currentTime;

      if (!scope.loop) {
        scope.playing = false;
      }

    };
    this._tick.then = 0;

  };

  Sound.Utils.extend(Empty.prototype, {

    _currentTime: 0,

    duration: 0,

    playing: false,

    loop: false,

    play: function(options) {

      var params = Sound.Utils.defaults(options || {}, {
        offset: this._currentTime,
        loop: this.loop
      });

      this._currentTime = params.offset;
      this.loop = !!params.loop;

      this.playing = true;
      this._tick.then = Date.now();

      this._tick();

      return this;

    },

    pause: function() {

      this.playing = false;
      return this;

    },

    stop: function() {

      this.playing = false;
      this.currentTime = 0;
      return this;

    }

  });

  Object.defineProperty(Empty.prototype, 'currentTime', {

    enumerable: true,

    get: function() {
      return this._currentTime;
    },

    set: function(v) {

      if (this.loop) {
        this._currentTime = Math.max(v, 0.0) % this.duration;
      } else {
        this._currentTime = Math.min(Math.max(v, 0.0), this.duration);
      }

    }

  });

})();
