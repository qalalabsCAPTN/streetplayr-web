import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('CONSOLE_ERR', m.text());
  });

  await page.goto('http://localhost:3000/product/PS-TEE-WAR-BLK', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForTimeout(2500);
  const buttons = await page.locator('button').allTextContents();
  console.log('BUTTONS', JSON.stringify(buttons.slice(0, 50), null, 2));
  console.log('BODY_SNIP', (await page.locator('body').innerText()).slice(0, 2000));

  // Try size M + Add to Bag
  const size = page.getByRole('button', { name: /^M$/i }).first();
  if (await size.count()) {
    await size.click();
    console.log('clicked size M');
  }
  const add = page.getByRole('button', { name: /add to bag/i }).first();
  console.log('add count', await add.count());
  if (await add.count()) {
    await add.click();
    await page.waitForTimeout(1000);
    console.log('clicked add to bag');
  }

  await page.goto('http://localhost:3000/checkout', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  console.log('CHECKOUT_URL', page.url());
  console.log('CHECKOUT_SNIP', (await page.locator('body').innerText()).slice(0, 1500));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
