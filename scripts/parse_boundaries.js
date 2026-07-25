const fs = require('fs');
const file = process.argv[2] || 'scripts/matrix_fails_out.json';
const t = fs.readFileSync(file, 'utf8');
const parts = [];
let idx = 0;
while (true) {
  const i = t.indexOf('{"boundary"', idx);
  if (i < 0) break;
  let d = 0;
  let end = -1;
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
if (!parts.length) {
  console.log(t.slice(0, 2500));
  process.exit(1);
}
for (const p of parts) {
  console.log('--- rows', (p.rows || []).length);
  for (const r of p.rows || []) console.log(JSON.stringify(r));
}
