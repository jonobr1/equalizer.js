function clamp(v, a, b) {
  return Math.min(Math.max(v, a), b);
}

function defaults(base) {

  if (arguments.length < 2) {
    return base;
  }

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    for (var k in obj) {
      if (typeof base[k] == 'undefined') {
        base[k] = obj[k];
      }
    }
  }

  return base;

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

function mod(v, l) {
  while (v < 0) {
    v += l;
  }
  return v % l;
}

export {
  clamp,
  defaults,
  extend,
  mod
};
