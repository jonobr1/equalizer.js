var fs = require('fs');
var path = require('path');
var es = require('esbuild');
var entryPoints = [path.resolve(__dirname, '../src/equalizer.js')];

es.buildSync({
  entryPoints,
  bundle: true,
  platform: 'node',
  outfile: path.resolve(__dirname, '../build/equalizer.umd.js')
});

es.buildSync({
  entryPoints,
  bundle: true,
  platform: 'neutral',
  outfile: path.resolve(__dirname, '../build/equalizer.module.js')
});

es.buildSync({
  entryPoints,
  bundle: true,
  outfile: path.resolve(__dirname, '../build/equalizer.js')
});

var contents = fs.readFileSync(path.resolve(__dirname, '../build/equalizer.js'), 'utf-8');
contents = contents.replace(
  /(var Equalizer = _Equalizer;)/i,
  '$1  window.Equalizer = Equalizer;'
);
fs.writeFileSync(
  path.resolve(__dirname, '../build/equalizer.js'),
  contents
);
