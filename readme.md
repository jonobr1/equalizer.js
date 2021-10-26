# equalizer.js

:ear: An audio analysis tool for real-time and choreographed visualizations.

1. [x] Accepts all valid Web Audio nodes
2. [x] Accepts multiple nodes at once for complex scenes
3. [x] Configurable resolution and frame rate
4. [x] Dependency free
5. [x] Export/import analyzed data for precise playback
6. [x] Added classes for easy loading of audio files

Visit the hosted [project page](https://jonobr1.com/equalizer.js/) to try it out and to export or import JSON data for use with Equalizer.

## Usage

```
npm install --save equalizer.js
```

### Import in ES6 environment

```javascript
import { Equalizer } from 'equalizer.js';
```

### Load Script in HTML file:

This example creates an audio oscillator and visualizes it with an instance of `Equalizer`.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/equalizer.js/build/equalizer.js"></script>
    <script>

    var playing = false;
    var context = new AudioContext(); // From Web Audio API
    var equalizer = new Equalizer(context).appendTo(document.body);

    // Create audible sound with the Web Audio API
    var osc = context.createOscillator();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, context.currentTime);
    osc.connect(context.destination);
    osc.start();

    // Add the oscillator to the equalizer
    equalizer.add(osc);

    equalizer.domElement.addEventListener('click', resume, false);
    update();

    function resume() {
      if (!(/running/.test(context.state))) {
        context.resume();
      }
    }

    function update() {
      equalizer.update();
      requestAnimationFrame(update);
    }

    </script>
  </body>
</html>
```

:warning: Due to the reliance on the Web Audio API, this project is not built for node.js use.

A free and open source tool by [Jono Brandel](http://jono.fyi/)
