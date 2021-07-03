var path = require('path');
var es = require('esbuild')
var entryPoints = [path.resolve(__dirname, '../src/equalizer.js')];

es.build({
  entryPoints,
  bundle: true,
  platform: 'node',
  outfile: path.resolve(__dirname, '../build/equalizer.umd.js')
});

es.build({
  entryPoints,
  bundle: true,
  outfile: path.resolve(__dirname, '../build/equalizer.js'),
}).catch(() => process.exit(1));

es.build({
  entryPoints,
  bundle: true,
  minify: true,
  outfile: path.resolve(__dirname, '../build/equalizer.min.js'),
}).catch(() => process.exit(1));
