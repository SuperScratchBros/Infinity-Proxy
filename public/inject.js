(function(){
  const R = u => '/proxy?url=' + encodeURIComponent(u);

  // Patch meta refresh URLs
  document.querySelectorAll('meta[http-equiv="refresh"]').forEach(m => {
    let match = m.content.match(/url=(.*)$/i);
    if (match) m.content = m.content.replace(match[1], R(match[1]));
  });

  // Patch WebSocket constructor (supports protocols)
  const OW = window.WebSocket;
  window.WebSocket = function(u, p) {
    return new OW(R(u), p);
  };
  Object.assign(window.WebSocket, OW);
  WebSocket.prototype = OW.prototype;

  // Patch fetch URLs
  const origFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('http')) {
      input = R(input);
    } else if (input instanceof Request && input.url.startsWith('http')) {
      input = new Request(R(input.url), input);
    }
    return origFetch(input, init);
  };

  // Patch XMLHttpRequest open method
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && url.startsWith('http')) {
      url = R(url);
    }
    return origOpen.apply(this, [method, url]);
  };
})();
