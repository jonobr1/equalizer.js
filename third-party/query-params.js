function get() {
  var search = window.location.search.substring(1);
  if (search) {
    return JSON.parse([
      '{"',
      decodeURI(search)
        .replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"'),
      '"}'
    ].join(''));
  }
  return {};
}

export { get };
