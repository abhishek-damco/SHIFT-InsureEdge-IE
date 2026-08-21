// Extract text from Skia-printed PDFs by decoding CID hex strings via ToUnicode CMaps.
const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2];
const data = fs.readFileSync(file);

// Inflate every stream, keep both raw inflated buffers and their offsets.
const streams = [];
let idx = 0;
while ((idx = data.indexOf('stream', idx)) !== -1) {
  let s = idx + 6; if (data[s] === 13) s++; if (data[s] === 10) s++;
  const end = data.indexOf('endstream', s);
  if (end === -1) break;
  try { streams.push(zlib.inflateSync(data.subarray(s, end)).toString('latin1')); } catch (e) {}
  idx = end + 9;
}

// Build a single glyph map from all ToUnicode CMaps (bfchar + bfrange).
const map = new Map();
for (const st of streams) {
  if (!st.includes('beginbfchar') && !st.includes('beginbfrange')) continue;
  let m;
  const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
  while ((m = bfchar.exec(st))) {
    const pairs = m[1].match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g) || [];
    for (const p of pairs) {
      const [, src, dst] = p.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
      let out = '';
      for (let i = 0; i < dst.length; i += 4) out += String.fromCharCode(parseInt(dst.slice(i, i + 4), 16));
      map.set(parseInt(src, 16), out);
    }
  }
  const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((m = bfrange.exec(st))) {
    const rows = m[1].match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g) || [];
    for (const r of rows) {
      const [, lo, hi, dst] = r.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
      const start = parseInt(lo, 16), stop = parseInt(hi, 16), base = parseInt(dst, 16);
      for (let c = start; c <= stop && c - start < 65536; c++) map.set(c, String.fromCharCode(base + (c - start)));
    }
  }
}
console.error('glyph map size:', map.size);

// Decode text-showing operators in content streams.
let out = [];
for (const st of streams) {
  if (!st.includes('Tj') && !st.includes('TJ')) continue;
  const re = /<([0-9a-fA-F]+)>\s*Tj|\[((?:<[0-9a-fA-F]+>|[^\]])*)\]\s*TJ|T\*|Td|TD/g;
  let m, line = '';
  const flush = () => { if (line.trim()) out.push(line.trim()); line = ''; };
  while ((m = re.exec(st))) {
    if (m[0] === 'T*' || m[0] === 'Td' || m[0] === 'TD') { flush(); continue; }
    const hexes = m[1] ? [m[1]] : (m[2].match(/<([0-9a-fA-F]+)>/g) || []).map(h => h.slice(1, -1));
    for (const hex of hexes)
      for (let i = 0; i < hex.length; i += 4)
        line += map.get(parseInt(hex.slice(i, i + 4), 16)) ?? '';
  }
  flush();
}
fs.writeFileSync(process.argv[3] || 'out.txt', out.join('\n'));
console.error('lines:', out.length);
