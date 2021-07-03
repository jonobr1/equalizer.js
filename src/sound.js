import { defaults, extend } from './underscore.js';

var identity = function(v) { return v; };

var Context, has;

try {
  Context = AudioContext || webkitAudioContext;
  has = !!(Context);
} catch (e) {
  Context = null;
  has = false;
}

function load(uri, callback) {

  return new Promise(function(resolve, reject) {

    var r = new XMLHttpRequest();
    r.open('GET', uri, true);
    r.responseType = 'arraybuffer';

    r.onerror = reject;
    r.onload = function() {
      resolve({
        data: r.response,
        callback
      });
    };

    r.send();

  });

}

function decode({ data, callback }) {

  return new Promise(function(resolve, reject) {

    var success = function(buffer) {
      resolve(buffer);
      if (callback) {
        callback(buffer);
      }
    };

    Sound.ctx.decodeAudioData(data, success, reject);

  });

}


export default class Sound {

  #loop = false;
  #volume = 1.0;
  #speed = 1.0;
  #startTime = 0;
  #offset = 0;

  playing = false;
  filter = null;
  gain = null;
  src = null;

  static has = has;
  static ctx = null;

  constructor(url, callback, context) {

    var scope = this;

    if (context) {
      Sound.ctx = context;
    } else {
      Sound.ctx = new Context();
    }

    switch (typeof url) {

      case 'string':
        this.src = url;
        load(url, assignBuffer).then(decode);
        break;

      case 'object':
        decode({
          data: url,
          callback: assignBuffer
        });
        break;

    }

    function assignBuffer(buffer) {

      scope.buffer = buffer;

      scope.gain = scope.filter = Sound.ctx.createGain();
      scope.gain.connect(Sound.ctx.destination);
      scope.gain.gain.value = Math.max(Math.min(scope.#volume, 1.0), 0.0);

      if (callback) {
        callback(this);
      }

    }

  }

  #ended() {
    this.playing = false;
  }

  applyFilter(node) {

    if (this.filter && this.filter !== this.gain) {
      this.filter.disconnect(this.gain);
    }

    this.filter = node;
    this.gain.connect(this.filter);

    return this;

  }

  play(options) {

    var params = defaults(options || {}, {
      time: Sound.ctx.currentTime,
      loop: this._loop,
      offset: this._offset,
      duration: this.buffer.duration - this._offset
    });

    if (Sound.ctx && /suspended/i.test(Sound.ctx.state)) {
      Sound.ctx.resume();
    }

    if (this.source) {
      this.stop();
    }

    this.#startTime = params.time;
    this.#loop = params.loop;
    this.playing = true;

    this.source = Sound.ctx.createBufferSource();
    this.source.onended = this.#ended;
    this.source.buffer = this.buffer;
    this.source.loop = params.loop;
    this.source.playbackRate.value = this.#speed;

    this.source.connect(this.filter);

    if (this.source.start) {
      this.source.start(params.time, params.offset);
    } else if (this.source.noteOn) {
      this.source.noteOn(params.time, params.offset);
    }

    return this;

  }

  pause(options) {

    if (!this.source || !this.playing) {
      return this;
    }

    var params = defaults(options || {}, {
      time: Sound.ctx.currentTime
    });

    this.source.onended = identity;

    if (this.source.stop) {
      this.source.stop(params.time);
    } else if (this.source.noteOff) {
      this.source.noteOff(params.time);
    }

    this.playing = false;

    var currentTime = Sound.ctx.currentTime;
    if (params.time != 'undefined') {
      currentTime = params.time;
    }

    this.#offset = currentTime - this.#startTime + (this.#offset || 0);

    if (this.#loop) {
      this.#offset = Math.max(this.#offset, 0.0) % this.buffer.duration;
    } else {
      this.#offset = Math.min(Math.max(this.#offset, 0.0), this.buffer.duration);
    }

    return this;

  }

  stop(options) {

    if (!this.source || !this.playing) {
      return this;
    }

    var params = defaults(options || {}, {
      time: Sound.ctx.currentTime
    });

    this.source.onended = identity;

    if (this.source.stop) {
      this.source.stop(params.time);
    } else if (this.source.noteOff) {
      this.source.noteOff(params.time);
    }

    this.playing = false;
    this.#offset = 0;

    return this;

  }

  get volume() {
    return this.#volume;
  }

  set volume(v) {
    this.#volume = v;
    if (this.gain) {
      this.gain.gain.value = Math.max(Math.min(this.#volume, 1.0), 0.0);
    }
  }

  get speed() {
    return this.#speed;
  }

  set speed(s) {
    this.#speed = s;
    if (this.playing) {
      this.play();
    }
  }

  get currentTime() {
    return this.playing
      ? (Sound.ctx.currentTime - this.#startTime + this.#offset) * this.#speed
      : this.#offset;
  }

  set currentTime(t) {

    var time;

    if (!this.buffer) {
      return this;
    }

    if (this.#loop) {
      time = Math.max(t, 0.0) % this.buffer.duration;
    } else {
      time = Math.min(Math.max(t, 0.0), this.buffer.duration);
    }

    this.#offset = time;

    if (this.playing) {
      this.play();
    }

  }

  get millis() {
    return Math.floor(this.currentTime * 1000);
  }

  get duration() {
    if (!this.buffer) {
      return 0;
    }
    return this.buffer.duration;
  }

}
