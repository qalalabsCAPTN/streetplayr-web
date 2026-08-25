/**
 * Partial browser smoke — storefront journey without TEST-E2E product.
 * Does NOT fake payment. Stops before checkout payment.
 */
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  const report: Record<string, string> = {};

  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  report.homepage = page.url().includes('/home') ? 'PASS' : `FAIL url=${page.url()}`;

  // Dismiss enter/splash if redirected
  if (page.url().includes('entering')) {
    const enter = page.getByRole('button', { name: /enter|click/i }).first();
    if (await enter.count()) await enter.click({ timeout: 5000 }).catch(() => {});
    await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
  }

  await page.goto(`${BASE}/collections`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  report.collections = page.status?.() ? 'PASS' : (await page.title()) ? 'PASS' : 'FAIL';

  await page.goto(`${BASE}/product/PS-TEE-WAR-BLK`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const body = await page.locator('body').innerText();
  report.pdp_loads = /WARRIOR|Warrior|Add to Cart|Sold Out/i.test(body) ? 'PASS' : 'FAIL';
  report.pdp_price_is_5 = /₹\s*5(\.00)?\b/.test(body) ? 'PASS' : 'FAIL (expected TEST-E2E ₹5 product missing)';

  // Try size + add to cart on real product (cart regression smoke only)
  const sizeBtn = page.locator('button, [role="button"]').filter({ hasText: /^M$/ }).first();
  if (await sizeBtn.count()) {
    await sizeBtn.click().catch(() => {});
  }
  const add = page.getByRole('button', { name: /add to cart/i }).first();
  if (await add.count()) {
    await add.click().catch(() => {});
    await page.waitForTimeout(800);
    report.add_to_cart_click = 'ATTEMPTED';
  } else {
    report.add_to_cart_click = 'FAIL — no Add to Cart button';
  }

  // Side cart / cart count heuristics
  const cartBadge = await page.locator('[data-cart-count], .cart-count, a[href*="cart"]').first().textContent().catch(() => '');
  report.cart_ui_visible = cartBadge != null ? 'PASS' : 'FAIL';

  await page.goto(`${BASE}/cart`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  report.cart_page = (await page.title()) ? 'PASS' : 'FAIL';

  await page.goto(`${BASE}/checkout`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const checkoutText = await page.locator('body').innerText();
  report.checkout_page = /checkout|shipping|payment|easebuzz|card \/ upi/i.test(checkoutText)
    ? 'PASS'
    : 'FAIL';
  report.easebuzz_option = /Easebuzz|Card \/ UPI|NetBanking/i.test(checkoutText) ? 'PASS' : 'FAIL';
  report.demo_payment_visible = /Demo Payment/i.test(checkoutText) ? 'VISIBLE (dev only expected)' : 'HIDDEN';

  report.console_errors = consoleErrors.length
    ? `ERRORS (${consoleErrors.length}): ${consoleErrors.slice(0, 5).join(' | ')}`
    : 'CLEAN';

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error('PLAYWRIGHT FAIL', e);
  process.exitCode = 1;
});
