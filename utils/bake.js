var fs = require('fs');
var path = require('path');

var yargs = require('yargs/yargs');
var { hideBin } = require('yargs/helpers');
var args = yargs(hideBin(process.argv)).argv;

var AudioContext = require('web-audio-engine').RenderingAudioContext;
var Equalizer = require('../build/equalizer.umd').default;

var FRAME_RATE = typeof args.framerate === 'number' ? args.framerate : 30;
var RESOLUTION = typeof args.resolution === 'number' ? args.resolution : 16;
var OUTPUT_PATH = typeof args.outfile === 'string' ? args.outfile
  : `../assets/data-${Date.now()}.json`;

if (typeof args.src === 'string') {
  start(path.resolve(__dirname, args.src));
} else {
  console.log('Bake: No audio file provided through src argument.');
  process.exit();
}

function start(src) {

  var result = {
    frameRate: FRAME_RATE,
    resolution: RESOLUTION,
    samples: [],
  };

  var ctx = new AudioContext({
    sampleRate: 16000
  });

  var analyser = ctx.createAnalyser();
  analyser.connect(ctx.destination);
  analyser.fftSize = RESOLUTION;
  analyser.data = new Uint8Array(analyser.frequencyBinCount);

  try {
    fs.readFile(src, analyze);
  } catch (e) {
    console.log('Bake:', e);
  }

  function analyze(err, resp) {

    if (err) {
      console.log(err);
      return;
    }

    var sound = new Equalizer.Sound(resp, render, ctx);
    var sampleSize = Math.floor(sound.duration / FRAME_RATE);

    function render() {

      for (var i = 0; i < sampleSize; i++) {

        var startTime = ctx.currentTime;
        var duration = 1 / FRAME_RATE;
        var sample = [];

        sound.pause().play({
          offset: startTime,
          duration: duration,
        });

        context.processTo(startTime + duration);

        analyser.getByteFrequencyData(analyser.data);

        result.samples.push(Array.from(analyser.data));

      }

      save();

    }

  }

  function save() {

    var uri = path.resolve(__dirname, OUTPUT_PATH);
    var data = JSON.stringify(data);

    fs.writeFile(uri, data, function(err) {

      if (err) {
        console.log('Bake: Failed to save analyzed data.');
        return;
      }

      console.log(`Bake: Finished analyzing and saved data to ${OUTPUT_PATH}`);

    });

  }

}
