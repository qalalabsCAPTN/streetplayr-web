import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('http://localhost:3000/product/PS-TEE-WAR-BLK', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^M$/i }).first().click();
  await page.getByRole('button', { name: /add to bag/i }).first().click();
  await page.waitForTimeout(1200);

  // Open side cart if drawer appears, else go /cart
  const drawer = page.locator('[class*="cart"], [data-testid*="cart"], aside').filter({ hasText: /bag|cart|warrior/i }).first();
  const drawerVisible = await drawer.isVisible().catch(() => false);
  console.log('side_cart_visible', drawerVisible);

  await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const cartText1 = await page.locator('body').innerText();
  console.log('cart_has_product', /WARRIOR|Warrior/i.test(cartText1));
  console.log('cart_qty_1', /×\s*1|\bx1\b|qty.*1|quantity.*1/i.test(cartText1) || /1/.test(cartText1));

  // Try increment
  const plus = page.getByRole('button', { name: /^\+$|^increase|^\+$/i }).first();
  const plusAlt = page.locator('button').filter({ hasText: '+' }).first();
  if (await plus.count()) await plus.click().catch(() => {});
  else if (await plusAlt.count()) await plusAlt.click().catch(() => {});
  await page.waitForTimeout(800);
  const cartText2 = await page.locator('body').innerText();
  console.log('after_inc_snip', cartText2.slice(0, 800).replace(/\s+/g, ' '));

  await page.goto('http://localhost:3000/checkout');
  await page.waitForTimeout(1000);
  console.log('checkout_redirect', page.url());
  console.log('console_errors', errors.length ? errors.slice(0, 5) : 'CLEAN');
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
