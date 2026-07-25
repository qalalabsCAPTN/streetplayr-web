const fs = require('fs');
const t = fs.readFileSync('scripts/_cols2_out.json', 'utf8');
const parts = [];
let idx = 0;
while (true) {
  const i = t.indexOf('{"boundary"', idx);
  if (i < 0) break;
  let d = 0,
    end = -1;
  for (let k = i; k < t.length; k++) {
    if (t[k] === '{') d++;
    else if (t[k] === '}') {
      d--;
      if (d === 0) {
        end = k + 1;
        break;
      }
    }
  }
  if (end < 0) break;
  try {
    parts.push(JSON.parse(t.slice(i, end)));
  } catch (_) {}
  idx = end;
}
for (const p of parts) {
  for (const r of p.rows || []) {
    console.log(r.col || r.pol || JSON.stringify(r));
  }
  console.log('---');
}
