// Playwright snippet: renders frames of the prototype into frames-<TAG>/ (edit TAG/TIMES)
async (page) => {
  const TAG = globalThis.__TAG || "v9", TIMES = globalThis.__TIMES || [1.0, 1.4, 1.7, 2.1, 2.5, 3.0, 3.5, 4.0, 4.4, 4.8, 5.2, 5.5];
  await page.setViewportSize({ width: 1280, height: 620 });
  await page.goto("http://127.0.0.1:5199/portfolio/intro-prototype/?nohud&r=" + Date.now());
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const out = [];
  for (const t of TIMES) {
    await page.evaluate((x) => window.__setT(x), t);
    await page.waitForTimeout(250);
    const f = `/Users/rexellk/Documents/Coding Projects/Netherwing-Website/portfolio/intro-prototype/frames-${TAG}/t${t.toFixed(2)}.png`;
    await page.screenshot({ path: f });
    out.push(f);
  }
  return out.length + " frames";
}
