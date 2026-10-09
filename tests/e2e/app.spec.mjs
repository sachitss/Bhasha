import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  page.on("pageerror", (e) => { throw e; });
  // Skip the first-run questions except in the onboarding test.
  if (!/onboarding/.test(info.title)) {
    await page.addInitScript(() => {
      if (!localStorage.getItem("bhasha.v1")) localStorage.setItem("bhasha.v1", JSON.stringify({ profile: { onboarded: true, ui: "en", known: "en", target: "de" } }));
    });
  }
});

/** Answers whatever exercise is on screen (correctly where the page makes that easy). Returns false when the session is over. */
async function answerTask(page) {
  if (await page.locator('[data-a="finish"]').count()) return false;
  if (await page.locator('[data-a="nextTask"]').count()) { await page.locator('[data-a="nextTask"]').click(); return true; }
  if (await page.locator('[data-a="mleft"]:not([disabled])').count()) {
    const id = await page.locator('[data-a="mleft"]:not([disabled])').first().getAttribute("data-id");
    await page.locator(`[data-a="mleft"][data-id="${id}"]`).click();
    await page.locator(`[data-a="mright"][data-id="${id}"]`).click();
    return true;
  }
  if (await page.locator('[data-a="rpick"]:not([disabled])').count()) { await page.locator('[data-a="rpick"]:not([disabled])').first().click(); return true; }
  if (await page.locator('[data-a="otok"]').count()) {
    while (await page.locator('[data-a="otok"]').count()) await page.locator('[data-a="otok"]').first().click();
    await page.locator('[data-a="ocheck"]').click(); return true;
  }
  if (await page.locator('#writeIn:not([disabled])').count()) { await page.fill("#writeIn", "Test"); await page.locator('[data-a="writeDone"]').click(); return true; }
  if (await page.locator('#trIn:not([disabled])').count()) { await page.fill("#trIn", "Test"); await page.locator('[data-a="trDone"]').first().click(); return true; }
  for (const sel of ['[data-a="pick"]:not([disabled])', '[data-a="reveal"]', '[data-a="grade"][data-g="3"]', '[data-a="dontKnow"]']) {
    const el = page.locator(sel).first();
    if (await el.count()) { await el.click(); return true; }
  }
  return true;
}
async function finishSession(page) {
  for (let i = 0; i < 80; i++) if (!(await answerTask(page))) break;
  await expect(page.locator('[data-a="finish"]')).toBeVisible();
}

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
  await finishSession(page);
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

test("built-in audio files play in every language and voice", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const out = {};
    const idx = await fetch("audio/index.json").then((r) => r.json());
    for (const slot of Object.keys(idx.files).filter((k) => idx.files[k].includes("g1"))) {
      out[slot] = await new Promise((res) => {
        const a = new Audio(`audio/${slot}/g1.mp3`);
        a.onloadedmetadata = () => res(a.duration);
        a.onerror = () => res(-1);
      });
    }
    return out;
  });
  for (const [slot, d] of Object.entries(result)) expect(d, slot).toBeGreaterThan(0.3);
  await page.locator("#pairBtn").click();
  await expect(page.getByText(/Built-in voice: Katja/)).toBeVisible();
  await page.locator('[data-a="setp"][data-k="gender"][data-v="m"]').click();
  await expect(page.getByText(/Built-in voice: Conrad/)).toBeVisible();
});

test("powered-by branding: logo undistorted, lower right, on every page", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Home", "Learn", "Words", "Speak", "Travel", "Progress"]) {
    await page.getByRole("button", { name, exact: true }).click();
    const footer = page.locator("footer.powered");
    await expect(footer).toContainText("© Ing.-Büro Sachit Shrestha");
    await expect(footer.locator('a[href="mailto:support@medtec24.com"]')).toBeVisible();
    const img = footer.locator("img");
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
    const r = await img.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const m = document.querySelector("main").getBoundingClientRect(); const pad = parseFloat(getComputedStyle(document.querySelector("main")).paddingRight);
      return { rendered: b.width / b.height, natural: el.naturalWidth / el.naturalHeight, right: b.right, vw: m.right - pad };
    });
    expect(Math.abs(r.rendered - r.natural) / r.natural).toBeLessThan(0.02);
    expect(r.vw - r.right).toBeLessThan(14); // right-aligned to the content column (logo card padding)
  }
});

test("Korean: interface and learning language with Hangul and romanisation", async ({ page }) => {
  await page.goto("/");
  await page.locator("#pairBtn").click();
  await page.locator('[data-a="setp"][data-k="ui"][data-v="ko"]').click();
  await page.locator('[data-a="setp"][data-k="target"][data-v="ko"]').click();
  await page.locator('[data-a="closeSheet"].btn').click();
  await expect(page.getByRole("button", { name: "오늘 학습 시작" })).toBeVisible();
  await expect(page.locator(".wotd .word")).toHaveText(/[\uAC00-\uD7A3]/);
  await expect(page.locator(".wotd .rom")).toBeVisible();
  await page.getByRole("button", { name: "여행", exact: true }).click();
  await expect(page.getByText("화장실이 어디예요?")).toBeVisible();
  await page.getByRole("button", { name: "홈", exact: true }).click();
  await page.getByRole("button", { name: "오늘 학습 시작" }).click();
  await finishSession(page);
});

test("onboarding asks for languages, level, skill focus and time", async ({ page }) => {
  await page.goto("/");
  const dlg = page.locator("[data-ob]");
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-a="obSet"][data-k="known"][data-v="en"]').click();
  await dlg.locator('[data-a="obNext"]').click();
  await dlg.locator('[data-a="obSet"][data-k="target"][data-v="es"]').click();
  await dlg.locator('[data-a="obSet"][data-k="level"][data-v="b"]').click();
  await dlg.locator('[data-a="obNext"]').click();
  await dlg.locator('[data-a="obSet"][data-k="focus"][data-v="read"]').click();
  await dlg.locator('[data-a="obSet"][data-k="minutes"][data-v="20"]').click();
  await dlg.locator('[data-a="obDone"]').click();
  await expect(dlg).toHaveCount(0);
  const p = await page.evaluate(() => window.__bhasha.P());
  expect(p.target).toBe("es"); expect(p.onboarded).toBe(true); expect(p.prio.read).toBe(40);
  await page.reload();
  await expect(page.locator("[data-ob]")).toHaveCount(0);
});

test("Spanish: interface and learning language, session with all exercise types", async ({ page }) => {
  await page.goto("/");
  await page.locator("#pairBtn").click();
  await page.locator('[data-a="setp"][data-k="ui"][data-v="es"]').click();
  await page.locator('[data-a="setp"][data-k="target"][data-v="es"]').click();
  await page.locator('[data-a="closeSheet"].btn').click();
  await expect(page.locator(".wotd .word")).not.toBeEmpty();
  await page.locator('[data-a="startSession"]').click();
  await finishSession(page);
});

test("reviews use the new exercise types: match, order, write, translate, reading", async ({ page }) => {
  await page.goto("/");
  // Seed progress so words are due and reading is part of the focus.
  await page.evaluate(() => {
    const B = window.__bhasha; const now = Date.now();
    const ids = ["d1", "d2", "d3", "d4", "f1", "f2", "f3", "f4", "g1", "g2", "g3", "g4"];
    const pr = B.D.prog.de = {};
    for (const id of ids) pr[id] = { ease: 2.5, ivl: 3, reps: 2, lapses: 0, due: now - 1000, seen: now - 5 * 864e5, last: now - 3 * 864e5, ok: 2, bad: 0 };
    B.D.profile.prio = { vocab: 10, listen: 10, speak: 10, read: 40, write: 40 };
    localStorage.setItem("bhasha.v1", JSON.stringify(B.D));
  });
  await page.reload();
  await page.locator('[data-a="startSession"]').click();
  const types = await page.evaluate(() => window.__bhasha.D.session.tasks.map((t) => t.type));
  expect(types).toContain("match");
  expect(types).toContain("read");
  expect(types.some((t) => ["order", "write", "translate", "fill"].includes(t))).toBe(true);
  await finishSession(page);
  await page.locator('[data-a="finish"]').click();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.locator(".skills")).toContainText("Reading");
  await expect(page.locator(".skills .meter")).toHaveCount(5);
});

test("reading text with tap-to-translate and questions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Learn", exact: true }).click();
  await page.locator('[data-a="readOpen"]').first().click();
  await page.locator('[data-a="rsent"]').first().click();
  await expect(page.locator(".rtr").first()).toBeVisible();
  await finishSession(page);
  await noHorizontalScroll(page);
});

test("active notebook: notes on a word, own word, export", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Words", exact: true }).click();
  await page.locator('[data-a="detail"]').first().click();
  await page.locator("details.nbbox summary").click();
  await page.fill("#nb-s", "Mein eigener Satz.");
  await page.fill("#nb-y", "Synonym");
  await page.locator('form[data-form="nb"] button[type="submit"]').click();
  await expect(page.locator('a[href*="duden"]')).toBeVisible();
  await page.locator('[data-a="closeSheet"].btn').click();
  await page.locator('[data-a="filter"][data-f="nb"]').click();
  await page.locator('[data-a="nbForm"]').click();
  await page.fill("#nbw", "die Eisenbahn");
  await page.fill("#nbm", "railway");
  await page.locator('form[data-form="nbNew"] button[type="submit"]').click();
  await expect(page.locator(".list .li")).toHaveCount(2);
  await expect(page.getByText("die Eisenbahn")).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.locator('[data-a="nbExport"]').click();
  expect((await dl).suggestedFilename()).toMatch(/notebook.*\.csv$/);
});

test("Glance mode shows words and exits on tap", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-a="glance"]').first().click();
  await expect(page.locator("#glance .gl-word")).not.toBeEmpty();
  await page.locator("#glance").click();
  await expect(page.locator("#glance")).toHaveCount(0);
});
