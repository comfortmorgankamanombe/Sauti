// Precomputes the query embeddings of every stored question and writes
// models/corpus-embeddings.json, so Sauti starts in seconds instead of
// embedding the whole corpus on every launch. Re-run after editing the
// syllabus content in panel.js.
//
// Run: NODE_PATH=<folder with playwright> node test/build-embeddings.js

const path = require("path");
const os = require("os");
const fs = require("fs");
const { chromium } = require("playwright");

const EXT = path.resolve(__dirname, "..");
const OUT = path.join(EXT, "models", "corpus-embeddings.json");

(async () => {
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
  const ctx = await chromium.launchPersistentContext(path.join(os.tmpdir(), "sauti-build-embeddings"), {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${sw.url().split("/")[2]}/panel.html`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(() => /Ready|Could not/.test(document.querySelector("#zv-ask-status").textContent), null, { timeout: 400000, polling: 2000 });
  const vectors = await page.evaluate(async () => {
    const questions = [...new Set(window.__zvCorpus.map((c) => c.q))];
    const out = {};
    for (let i = 0; i < questions.length; i += 8) {
      const batch = questions.slice(i, i + 8);
      const vecs = await window.__sautiEmbedQueries(batch);
      batch.forEach((q, j) => { out[q] = vecs[j].map((x) => Math.round(x * 1e5) / 1e5); });
    }
    return out;
  });
  fs.writeFileSync(OUT, JSON.stringify(vectors));
  console.log(`Wrote ${Object.keys(vectors).length} embeddings to ${OUT}`);
  await ctx.close();
})();
