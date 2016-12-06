
var path = require('path');
var compressor = require('node-minify');

var files = [
  path.resolve(__dirname, '../third-party/two.js'),
  path.resolve(__dirname, '../third-party/sound.js'),
  path.resolve(__dirname, '../third-party/sound-empty.js'),
  path.resolve(__dirname, '../src/equalizer.js'),
  path.resolve(__dirname, '../src/timeline.js')
];

// Clean
compressor.minify({
  compressor: 'no-compress',
  input: files.slice(1),
  output: path.resolve(__dirname, '../build/equalizer.clean.js'),
  callback: function(e) {
    if (!e) {
      console.log('clean complete');
    } else {
      console.log('unable to clean', e);
    }
  }
});

// Concatenated
compressor.minify({
  compressor: 'no-compress',
  input: files,
  output: path.resolve(__dirname, '../build/equalizer.js'),
  callback: function(e) {
    if (!e) {
      console.log('concatenation complete');
    } else {
      console.log('unable to concatenate', e);
    }
  }
});

// Minified
compressor.minify({
  compressor: 'gcc',
  input: files,
  output: path.resolve(__dirname, '../build/equalizer.min.js'),
  callback: function(e){
    if (!e) {
      console.log('minified complete');
    } else {
      console.log('unable to minify', e);
    }
  }
});
