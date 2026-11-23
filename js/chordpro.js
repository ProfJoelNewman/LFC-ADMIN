/**
 * LFC Worship Stage Engine — Real-Time 12-Key ChordPro Parser & Transposer
 * Supports slash chords (G/B, D/F#), flats/sharps (Db, Eb, F#, Ab, Bb), and lyrics-only mode.
 */
window.LFCChordPro = (function () {
  const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const DISPLAY_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const FLAT_PREFERRED_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']);

  const NOTE_INDEX = {
    C: 0, 'B#': 0,
    'C#': 1, Db: 1,
    D: 2,
    'D#': 3, Eb: 3,
    E: 4, Fb: 4,
    F: 5, 'E#': 5,
    'F#': 6, Gb: 6,
    G: 7,
    'G#': 8, Ab: 8,
    A: 9,
    'A#': 10, Bb: 10,
    B: 11, Cb: 11
  };

  function noteToSemitone(note) {
    if (!note) return -1;
    const clean = String(note).trim();
    return Object.prototype.hasOwnProperty.call(NOTE_INDEX, clean) ? NOTE_INDEX[clean] : -1;
  }

  function transposeSingleRoot(token, semitones, useFlats) {
    const m = /^([A-G][#b]?)(.*)$/.exec(token);
    if (!m) return token;
    const baseIdx = noteToSemitone(m[1]);
    if (baseIdx < 0) return token;
    const nextIdx = ((baseIdx + semitones) % 12 + 12) % 12;
    const scale = useFlats ? FLAT_SCALE : SHARP_SCALE;
    return scale[nextIdx] + m[2];
  }

  function transposeChordToken(chord, fromKey, toKey) {
    const fromIdx = noteToSemitone(fromKey);
    const toIdx = noteToSemitone(toKey);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return chord;
    const delta = toIdx - fromIdx;
    const useFlats = FLAT_PREFERRED_KEYS.has(toKey);
    return String(chord)
      .split('/')
      .map(part => transposeSingleRoot(part, delta, useFlats))
      .join('/');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderChartHtml(rawChordPro, fromKey, toKey, showChords) {
    const lines = String(rawChordPro || '').split(/\r?\n/);
    const htmlLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const secMatch = /^\{\s*(?:c|comment|soc|section)\s*:\s*([^}]+)\}/i.exec(line.trim());
      if (secMatch) {
        htmlLines.push('<div class="cp-section">' + escapeHtml(secMatch[1].trim()) + '</div>');
        continue;
      }
      if (!line.trim()) {
        htmlLines.push('<div class="cp-spacer"></div>');
        continue;
      }

      if (line.indexOf('[') === -1) {
        htmlLines.push('<div class="cp-lyric-only">' + escapeHtml(line) + '</div>');
        continue;
      }

      if (!showChords) {
        const stripped = line.replace(/\[[^\]]+\]/g, '');
        htmlLines.push('<div class="cp-lyric-only">' + escapeHtml(stripped) + '</div>');
        continue;
      }

      // Build aligned chord-over-lyric segments
      const regex = /\[([^\]]+)\]([^\[]*)/g;
      let prefix = line.slice(0, line.indexOf('['));
      let rowHtml = '<div class="cp-pair-line">';
      if (prefix) {
        rowHtml += '<span class="cp-pair"><span class="cp-chord">&nbsp;</span><span class="cp-lyric">' + escapeHtml(prefix) + '</span></span>';
      }
      let match;
      while ((match = regex.exec(line)) !== null) {
        const transposed = transposeChordToken(match[1].trim(), fromKey, toKey);
        const lyricChunk = match[2] || ' ';
        rowHtml +=
          '<span class="cp-pair">' +
          '<span class="cp-chord">' + escapeHtml(transposed) + '</span>' +
          '<span class="cp-lyric">' + escapeHtml(lyricChunk).replace(/ /g, '&nbsp;') + '</span>' +
          '</span>';
      }
      rowHtml += '</div>';
      htmlLines.push(rowHtml);
    }
    return htmlLines.join('');
  }

  return {
    DISPLAY_KEYS: DISPLAY_KEYS,
    transposeChordToken: transposeChordToken,
    renderChartHtml: renderChartHtml
  };
})();
