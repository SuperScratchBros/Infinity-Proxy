(function(){
  const R = u => '/proxy?url=' + encodeURIComponent(u);
  document.querySelectorAll('meta[http-equiv="refresh"]').forEach(m => {
    let match = m.content.match(/url=(.*)$/i);
    if (match) m.content = m.content.replace(match[1], R(match[1]));
  });
  const OW = window.WebSocket;
  window.WebSocket = function(u, p) {
    return new OW('/ws?url=' + encodeURIComponent(u), p);
  };
  Object.assign(window.WebSocket, OW);
  WebSocket.prototype = OW.prototype;
})();
