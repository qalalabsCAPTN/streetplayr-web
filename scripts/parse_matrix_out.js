const fs = require('fs');
const t = fs.readFileSync('scripts/matrix_pentest_out.json', 'utf8');
if (t.includes('LegacyDbQuery') || t.includes('"_tag":"Error"')) {
  console.log('ERROR RAW:\n', t.slice(0, 2000));
  process.exit(1);
}
const parts = [];
let idx = 0;
while (true) {
  const i = t.indexOf('{"boundary"', idx);
  if (i < 0) break;
  let depth = 0;
  let end = -1;
  for (let k = i; k < t.length; k++) {
    if (t[k] === '{') depth++;
    else if (t[k] === '}') {
      depth--;
      if (depth === 0) {
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
const rows = parts.flatMap((p) => p.rows || []);
const detail = rows.filter((r) => r.verdict);
const summary = rows.filter((r) => r.total != null);
console.log('checks', detail.length);
for (const r of detail) {
  console.log(
    String(r.verdict || '').padEnd(4),
    String(r.section || '').padEnd(7),
    r.check_name,
    '|',
    String(r.actual || '').slice(0, 90)
  );
}
if (summary[0]) console.log('\nSUMMARY', summary[0]);
console.log(
  'FAILS',
  detail.filter((r) => r.verdict === 'FAIL').length
);
