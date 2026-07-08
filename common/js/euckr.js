(function(global) {
  var map = {};
  var i, lead, trail, bytes, ch;

  for (i = 0; i < 0x80; i++) {
    map[String.fromCharCode(i)] = [i];
  }

  var dec = new TextDecoder('euc-kr');
  for (lead = 0x81; lead <= 0xFE; lead++) {
    for (trail = 0x41; trail <= 0xFE; trail++) {
      bytes = new Uint8Array([lead, trail]);
      ch = dec.decode(bytes);
      if (ch.length === 1 && ch.charCodeAt(0) !== 0xFFFD && !(ch in map)) {
        map[ch] = [lead, trail];
      }
    }
  }

  function euckrHex(str) {
    var result = '', j, b, h;
    for (i = 0; i < str.length; i++) {
      var entry = map[str[i]];
      if (!entry) {
        result += '3F';
      } else {
        for (j = 0; j < entry.length; j++) {
          b = entry[j];
          h = b.toString(16).toUpperCase();
          result += h.length === 1 ? '0' + h : h;
        }
      }
    }
    return result;
  }

  global.euckrHex = euckrHex;
})(window);
