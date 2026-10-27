// Calibration test for Sauti's question matcher.
// Loads the real extension in Chromium and runs in-syllabus questions (with
// the stored question each should match) and off-topic questions (which
// should get "please rephrase").
//
// Run: NODE_PATH=<folder with playwright> node test/match-test.js

const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const EXT = path.resolve(__dirname, "..");

// [student question, text the matched stored question must contain]
const IN = [
  ["why do we use a trace table", "trace table"],
  ["what's the point of a trace table", "trace table"],
  ["how does binary search work", "binary search work"],
  ["explain binary search", "binary search"],
  ["what does a list need before binary search", "before you can binary search"],
  ["how does linear search work", "linear search"],
  ["explain bubble sort", "bubble sort work"],
  ["why is bubble sort slower than quick sort", "less efficient than quick sort"],
  ["how does quicksort work", "quick sort work"],
  ["what is recursion", "What is recursion"],
  ["what is a base case", "base case"],
  ["what happens if there is no base case", "missing its base case"],
  ["what parts does a recursive function need", "two parts"],
  ["what is a flowchart", "What is a flowchart"],
  ["what are the flowchart symbols", "flowchart symbols"],
  ["what does the diamond mean in a flow chart", "diamond"],
  ["what is pseudocode", "pseudocode"],
  ["what is an algorithm", "What is an algorithm"],
  ["how do you test an algorithm", "tested with"],
  ["what is boundary data", "boundary"],
  ["what are the three control structures", "control structures"],
  ["what is iteration", "iteration"],
  ["what is a loop", "loop"],
  ["what is selection", "selection"],
  ["what is a variable", "variable"],
  ["what is an array", "What is an array"],
  ["what happens when you insert into an array", "insert a new item"],
  ["what is a binary tree", "What is a binary tree"],
  ["where do I put a new value in a binary search tree", "binary search tree"],
  ["what is a stack", "stack"],
  ["what is a queue", "queue"],
  ["what is a linked list", "linked list"],
  ["what is a data structure", "data structure"],
  ["what are the primitive data types", "data type"],
  ["what data type stores true or false", "True or False"],
  ["which data type for 74.5", "74.5"],
  ["what is a boolean", "Boolean"],
  ["why design an algorithm before coding", "before writing the program"],
  ["does sauti need internet", "internet"],
  ["write a program to check a leap year", "leap year"],
];

const OUT = [
  "who won the football world cup",
  "what is the capital of france",
  "how do I cook sadza",
  "what is photosynthesis",
  "explain the causes of world war one",
  "how do I fix my phone",
  "tell me a joke",
  "what is the price of bread",
  "how do volcanoes form",
  "who is the president of zimbabwe",
  "solve 2x plus 3 equals 7",
  "what is a noun",
  "how do I plant maize",
  "what is the weather today",
  "explain newton's laws of motion",
  "how many legs does a spider have",
  "what is love",
  "translate hello into shona",
  "what is the meaning of life",
  "how do I get a girlfriend",
];

(async () => {
  const ctx = await chromium.launchPersistentContext(path.join(os.tmpdir(), "sauti-match-test"), {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text()); });
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(`chrome-extension://${sw.url().split("/")[2]}/panel.html`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(() => /Ready|Could not/.test(document.querySelector("#zv-ask-status").textContent), null, { timeout: 180000 });

  const run = (q) => page.evaluate(async (q) => {
    const r = await window.__sautiAnswerQuestion(q);
    return { matched: r.matched, fuzzy: !!r.viaFuzzy, score: r.score, sem: r.semantic, kw: r.keyword, q: r.item ? r.item.q : r.best ? r.best.q : "" };
  }, q);

  let right = 0, wrong = 0, missed = 0, falsePos = 0;
  const fmt = (r) => `score ${r.score.toFixed(2)} (kw ${(r.kw || 0).toFixed(2)}, sem ${(r.sem || 0).toFixed(2)})${r.fuzzy ? " fuzzy" : ""}`;
  for (const [q, want] of IN) {
    const r = await run(q);
    const hit = r.matched && r.q.toLowerCase().includes(want.toLowerCase());
    if (hit) right++; else if (r.matched) wrong++; else missed++;
    console.log(`${hit ? "ok  " : r.matched ? "WRONG" : "MISS "} ${q} -> ${r.q.slice(0, 60)} | ${fmt(r)}`);
  }
  for (const q of OUT) {
    const r = await run(q);
    if (r.matched) falsePos++;
    console.log(`${r.matched ? "FALSE" : "ok  "} ${q} -> ${r.matched ? r.q.slice(0, 60) : "(rephrase)"} | ${fmt(r)}`);
  }
  console.log(`\nIn-syllabus: ${right}/${IN.length} correct, ${wrong} wrong answer, ${missed} asked to rephrase`);
  console.log(`Off-topic:   ${OUT.length - falsePos}/${OUT.length} correctly rejected`);
  await ctx.close();
  process.exit(wrong + falsePos > 0 ? 1 : 0);
})();
