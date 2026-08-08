import { chromium } from 'playwright';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const browser = await chromium.launch({ headless: true });

for (const vp of [{ w: 1440, h: 900, tag: 'desktop' }, { w: 390, h: 844, tag: 'mobile' }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto('http://localhost:3000/collections', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const geo = await page.evaluate(() => {
    const s = document.querySelector('.collections-hero');
    const b = s.getBoundingClientRect();
    return { top: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width), ar: getComputedStyle(s).aspectRatio };
  });
  await page.screenshot({ path: '_an.png' });
  const { data, info } = await sharp('_an.png').extract({ left: 0, top: 0, width: geo.w, height: geo.h }).raw().toBuffer({ resolveWithObject: true });
  // per-row average brightness to spot letterbox bars / blank bands
  const rows = [];
  for (let y = 0; y < geo.h; y += 4) {
    let sum = 0, n = 0;
    for (let x = 0; x < geo.w; x++) {
      const i = (y * info.width + x) * info.channels;
      sum += (data[i] + data[i+1] + data[i+2]) / 3; n++;
    }
    rows.push(Math.round(sum / n));
  }
  // condense into ~14 bands
  const band = Math.ceil(rows.length / 14);
  const bands = [];
  for (let i = 0; i < rows.length; i += band) {
    const slice = rows.slice(i, i + band);
    bands.push('y' + (i * 4) + ':' + Math.round(slice.reduce((a, b) => a + b, 0) / slice.length));
  }
  console.log(vp.tag, JSON.stringify(geo), 'bands:', bands.join(' '));
  await page.close();
}
await browser.close();
