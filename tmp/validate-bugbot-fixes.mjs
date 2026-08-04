import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  const log = (m) => console.log(m);

  // --- 1. Mobile collections: no desktop chips visible ---
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    page.on("console", (m) => {
      if (m.type() === "error") errs.push("collections: " + m.text());
    });
    page.on("pageerror", (e) => errs.push("collections: " + e.message));
    await page.goto(`${BASE}/collections`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    const chips = await page.evaluate(() => {
      const cats = document.querySelector(".chips--collections-categories");
      const viewAll = document.querySelector(".chip--view-all");
      const cs = cats ? getComputedStyle(cats).display : null;
      const vs = viewAll ? getComputedStyle(viewAll).display : null;
      const catsText = cats?.innerText?.slice(0, 80) || "";
      return { cs, vs, catsText };
    });
    log("COLLECTIONS_MOBILE " + JSON.stringify(chips));
    const ok =
      (chips.cs === "flex" || chips.cs === "block") &&
      chips.vs === "inline-flex" &&
      /Short Sleeve/i.test(chips.catsText);
    log(ok ? "PASS collections mobile chips" : "FAIL collections mobile chips");
    await page.close();
  }

  // --- 2. HomeHero modifier clicks ---
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    page.on("console", (m) => {
      if (m.type() === "error") errs.push("home: " + m.text());
    });
    await page.addInitScript(() => {
      localStorage.setItem("sp-entry-seen", "1");
      document.cookie =
        "sp-entry-seen=1; path=/; max-age=31536000; SameSite=Lax";
    });
    await page.goto(`${BASE}/home`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      document.body.style.overflow = "";
      document
        .querySelectorAll('[aria-label="Street PlayR intro"]')
        .forEach((e) => e.remove());
    });
    const shop = page.locator("a.hero__shop").first();
    await shop.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    const href = await shop.getAttribute("href");
    // Simulate handler logic via evaluate
    const handlerOk = await page.evaluate(() => {
      const a = document.querySelector("a.hero__shop");
      if (!a) return { ok: false, reason: "no shop link" };
      // Probe: dispatch click with ctrlKey — should NOT call preventDefault path
      let prevented = false;
      const orig = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function () {
        prevented = true;
        return orig.call(this);
      };
      const ev = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        ctrlKey: true,
      });
      a.dispatchEvent(ev);
      Event.prototype.preventDefault = orig;
      // With our fix, ctrl click returns early — preventDefault not called by handler
      // (browser may still not navigate in jsdom-like dispatch)
      return { ok: !prevented, prevented, href: a.getAttribute("href") };
    });
    log("HERO_CTRL " + JSON.stringify(handlerOk));
    log(handlerOk.ok ? "PASS hero ctrl click" : "FAIL hero ctrl click");

    const middleOk = await page.evaluate(() => {
      const a = document.querySelector("a.hero__shop");
      if (!a) return false;
      let prevented = false;
      const orig = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function () {
        prevented = true;
        return orig.call(this);
      };
      a.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          button: 1,
        })
      );
      Event.prototype.preventDefault = orig;
      return !prevented;
    });
    log(middleOk ? "PASS hero middle click" : "FAIL hero middle click");

    const normalNav = await page.evaluate(() => {
      const a = document.querySelector("a.hero__shop");
      if (!a) return false;
      let prevented = false;
      const orig = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function () {
        prevented = true;
        return orig.call(this);
      };
      a.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          button: 0,
        })
      );
      Event.prototype.preventDefault = orig;
      return prevented; // normal left click SHOULD preventDefault for SPA
    });
    log(normalNav ? "PASS hero left click intercept" : "FAIL hero left click intercept");
    log("hero href=" + href);
    await page.close();
  }

  // --- 3. Stories Escape ---
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    page.on("console", (m) => {
      if (m.type() === "error") errs.push("stories: " + m.text());
    });
    await page.addInitScript(() => {
      localStorage.setItem("sp-entry-seen", "1");
      document.cookie =
        "sp-entry-seen=1; path=/; max-age=31536000; SameSite=Lax";
    });
    await page.goto(`${BASE}/home`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      document.body.style.overflow = "";
      document
        .querySelectorAll('[aria-label="Street PlayR intro"]')
        .forEach((e) => e.remove());
    });
    const storyBtn = page.locator(".stories-bar .story").first();
    const barVisible = await page.locator(".stories-bar").isVisible().catch(() => false);
    log("stories-bar visible=" + barVisible);
    if (barVisible) {
      await storyBtn.click({ timeout: 5000 });
      await page.waitForTimeout(300);
      const open = await page.locator('.storyviewer[role="dialog"]').isVisible();
      log("dialog open=" + open);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      const closed = !(await page.locator('.storyviewer[role="dialog"]').isVisible().catch(() => false));
      log(closed ? "PASS stories escape" : "FAIL stories escape");
    } else {
      log("SKIP stories (bar not visible — check CSS)");
    }
    await page.close();
  }

  // Hydration check via next data
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const hydra = [];
    page.on("console", (m) => {
      const t = m.text();
      if (/hydrat/i.test(t)) hydra.push(t);
      if (m.type() === "error") errs.push(t);
    });
    await page.addInitScript(() => {
      localStorage.setItem("sp-entry-seen", "1");
      document.cookie =
        "sp-entry-seen=1; path=/; max-age=31536000; SameSite=Lax";
    });
    await page.goto(`${BASE}/collections`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(500);
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(500);
    log("HYDRATION_WARNINGS " + hydra.length);
    log(hydra.length === 0 ? "PASS no hydration warnings" : "FAIL " + hydra.join(" | "));
    await page.close();
  }

  log("CONSOLE_ERRORS " + errs.length);
  if (errs.length) log(errs.slice(0, 8).join("\n"));
  else log("PASS no console errors");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
