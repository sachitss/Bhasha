import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (e) => { throw e; });
});

async function noHorizontalScroll(page) {
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
}

test("home shows plan and word of the day", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Start today's session/ })).toBeVisible();
  await expect(page.locator(".wotd .word")).not.toBeEmpty();
  await noHorizontalScroll(page);
});

test("complete a daily session", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start today's session/ }).click();
  for (let i = 0; i < 40; i++) {
    if (await page.locator('[data-a="finish"]').count()) break;
    for (const sel of ['[data-a="pick"]:not([disabled])', '[data-a="reveal"]', '[data-a="grade"][data-g="3"]', '[data-a="dontKnow"]', '[data-a="nextTask"]']) {
      const el = page.locator(sel).first();
      if (await el.count()) { await el.click(); break; }
    }
  }
  await expect(page.locator('[data-a="finish"]')).toBeVisible();
  await page.locator('[data-a="finish"]').click();
  await page.getByRole("button", { name: "Progress" }).click();
  await expect(page.locator(".stat b").first()).not.toHaveText("0");
});

test("session can be paused and resumed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start today's session/ }).click();
  await page.locator('[data-a="grade"][data-g="3"], [data-a="pick"]').first().click();
  if (await page.locator('[data-a="nextTask"]').count()) await page.locator('[data-a="nextTask"]').click();
  await page.locator('[data-a="pauseSession"]').click();
  await page.reload();
  await expect(page.getByRole("button", { name: /Resume session/ })).toBeVisible();
});

test("interface switches to Nepali and German independently of the learning language", async ({ page }) => {
  await page.goto("/");
  await page.locator("#pairBtn").click();
  await page.locator('[data-a="setp"][data-k="ui"][data-v="ne"]').click();
  await page.locator('[data-a="closeSheet"].btn').click();
  await expect(page.getByRole("button", { name: "गृहपृष्ठ" })).toBeVisible();
  await page.locator("#pairBtn").click();
  await page.locator('[data-a="setp"][data-k="ui"][data-v="de"]').click();
  await page.locator('[data-a="setp"][data-k="target"][data-v="ne"]').click();
  await page.locator('[data-a="closeSheet"].btn').click();
  await expect(page.getByRole("button", { name: /Heutige Einheit starten/ })).toBeVisible();
  await expect(page.locator(".wotd .rom")).toBeVisible();
});

test("native audio file is used for the selected gender", async ({ page }) => {
  await page.route("**/audio/index.json", (r) => r.fulfill({ json: { voices: { "de-f": "de-DE-KatjaNeural", "de-m": "de-DE-ConradNeural" }, labels: { "de-f": "Katja", "de-m": "Conrad" }, files: { "de-f": ["g1", "f1", "d1"], "de-m": ["g1", "f1", "d1"] } } }));
  const requested = [];
  page.on("request", (r) => { if (r.url().endsWith(".mp3")) requested.push(new URL(r.url()).pathname); });
  await page.route("**/*.mp3", (r) => r.fulfill({ status: 404, body: "" }));
  await page.goto("/");
  await page.locator("#pairBtn").click();
  await page.locator('[data-a="setp"][data-k="gender"][data-v="m"]').click();
  await expect(page.getByText(/Built-in voice: Conrad/)).toBeVisible();
  await page.locator('[data-a="closeSheet"].btn').click();
  await page.evaluate(() => window.__bhasha.TTS.speak("Hallo", "de", 1, "g1"));
  await expect.poll(() => requested).toContain("/audio/de-m/g1.mp3");
});

test("every tab renders without overflow", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Learn", "Words", "Speak", "Travel", "Progress"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await noHorizontalScroll(page);
  }
  await page.getByRole("button", { name: "Travel", exact: true }).click();
  await page.locator('[data-a="trip"]').click();
  await expect(page.locator(".task")).toBeVisible();
});

test("recording falls back to file upload and analyses it", async ({ page, browserName }) => {
  await page.addInitScript(() => { navigator.mediaDevices && (navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error("denied"))); });
  await page.goto("/");
  await page.getByRole("button", { name: "Speak", exact: true }).click();
  await page.locator(".recbtn").click();
  const input = page.locator('input[type="file"][data-up]');
  await expect(input).toBeAttached();
  // 1.6 s WAV with 0.8 s of tone
  const wav = await page.evaluate(() => {
    const sr = 16000, n = sr * 1.6, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) { const t = i / sr; const s = t > 0.3 && t < 1.1 ? 0.4 * Math.sin(2 * Math.PI * 180 * t) : 0; v.setInt16(44 + i * 2, s * 32767, true); }
    return Array.from(new Uint8Array(buf));
  });
  await input.setInputFiles({ name: "take.wav", mimeType: "audio/wav", buffer: Buffer.from(wav) });
  await expect(page.locator(".score")).toBeVisible();
  await expect(page.getByText(/Practice estimate/)).toBeVisible();
});
