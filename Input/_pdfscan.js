const fs = require('fs'), zlib = require('zlib');
const f = process.argv[2];
const query = new RegExp(process.argv[3] || '(?:Download|Share|Preview)', 'gi');
const data = fs.readFileSync(f);
let text = '', streams = 0, idx = 0;
while ((idx = data.indexOf('stream', idx)) !== -1) {
  let s = idx + 6; if (data[s] === 0x0d) s++; if (data[s] === 0x0a) s++;
  const end = data.indexOf('endstream', s);
  if (end === -1) break;
  try { text += zlib.inflateSync(data.subarray(s, end)).toString('latin1'); streams++; } catch (e) {}
  idx = end + 9;
}
const strs = [];
const re = /\(((?:[^()\\]|\\.)*)\)\s*Tj|\[((?:[^\[\]\\]|\\.)*)\]\s*TJ/g;
let m;
while ((m = re.exec(text))) {
  if (m[1] !== undefined) strs.push(m[1]);
  else strs.push(m[2].replace(/\((?:[^()\\]|\\.)*\)/g, x => x.slice(1, -1)).replace(/-?\d+(\.\d+)?/g, ''));
}
const joined = strs.join('').replace(/\\([()\\])/g, '$1');
console.error('streams:', streams, 'text chars:', joined.length);
const ctx = new Set();
let q;
while ((q = query.exec(joined)) && ctx.size < 60) {
  ctx.add(joined.slice(Math.max(0, q.index - 60), q.index + 80).replace(/\s+/g, ' '));
}
for (const c of ctx) console.log('>>', c);
