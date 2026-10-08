// Regression checks for rejected overflow and editable, bounded table rows.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('assert');
const JSZip = require('jszip');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.build', 'layout-regression');
fs.mkdirSync(output, { recursive: true });
const results = [];
function run(name, fixture, expected) {
  const out = path.join(output, `${name}.pptx`);
  if (fs.existsSync(out)) fs.unlinkSync(out);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/build_deck.js'), fixture, out], {encoding:'utf8'});
  assert.strictEqual(result.status, expected, result.stdout + result.stderr);
  if (expected !== 0) assert(!fs.existsSync(out), 'rejected overflow must not emit a new PPTX');
  results.push({name, exitCode:result.status, outputExists:fs.existsSync(out), log:result.stdout+result.stderr});
  return out;
}
(async () => {
  run('wrapped-six-rejected', path.join(root,'examples/table-six-wrapped.json'), 2);
  const short = run('short-six-accepted', path.join(root,'examples/table-six-short.json'), 0);
  const zip = await JSZip.loadAsync(fs.readFileSync(short));
  const xml = await zip.file('ppt/slides/slide1.xml').async('string');
  const heights = [...xml.matchAll(/<a:tr h="(\d+)"/g)].map(m=>Number(m[1])/9525);
  assert.strictEqual(heights.length,7);
  assert(heights.every(h=>h>=60), '21pt table rows need readable spacing');
  assert(152 + heights.reduce((a,b)=>a+b,0) <= 648, 'table must remain inside the body');
  assert(xml.includes('相談6'), 'last row must remain editable');
  run('four-cards-callout-note',path.join(root,'examples/cards-four-callout-note.json'),0);
  const overflow = JSON.parse(fs.readFileSync(path.join(root,'examples/cards-four-callout-note.json')));
  overflow.slides[0].items[0].body = '折返しを含む本文'.repeat(15);
  const overPath=path.join(output,'long-card.json');fs.writeFileSync(overPath,JSON.stringify(overflow));
  run('long-card-rejected',overPath,2);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2)+'\n');
  console.log('PASS: wrapped table rejected, short six-row native table bounded, four-card combination accepted, card overflow rejected');
})().catch(e=>{console.error(e);process.exit(1)});
