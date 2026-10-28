// Sauti: scan a question paper.
//
// Reads a photographed/scanned question paper, or a PDF, fully on-device.
// Images go straight to Tesseract.js (Apache-2.0 OCR, WebAssembly, trained
// data bundled locally, no cloud calls). PDFs are handled by pdf-support.mjs,
// which tries real embedded text first (most official past papers have
// one) and only falls back to rendering + this same OCR engine per page
// for a genuinely scanned, image-only PDF.
//
// Either way, every line recognised is run back through the exact same
// on-device matching engine ask.js already uses (window.__sautiAnswerQuestion),
// so a scanned paper is answered honestly: a real match from the syllabus
// content Sauti actually has, or a plain "no confident match" rather than
// an invented answer, for anything outside what has been loaded.

(function () {
  const input = document.querySelector("#zv-ocr-input");
  const status = document.querySelector("#zv-ocr-status");
  const result = document.querySelector("#zv-ocr-result");
  if (!input || typeof Tesseract === "undefined") return;

  const defaultStatusText = status.textContent;
  let workerPromise = null;

  function getWorker() {
    if (workerPromise) return workerPromise;
    status.textContent = "Loading offline OCR engine (one-time, about 7MB, no internet used)…";
    workerPromise = Tesseract.createWorker("eng", 1, {
      workerPath: chrome.runtime.getURL("lib/tesseract/worker.min.js"),
      corePath: chrome.runtime.getURL("lib/tesseract/tesseract-core-simd-lstm.wasm.js"),
      langPath: chrome.runtime.getURL("models/tesseract-eng"),
      gzip: true,
      // Load the worker file directly: a blob worker (the default) cannot
      // importScripts() a chrome-extension:// URL.
      workerBlobURL: false,
    });
    return workerPromise;
  }

  async function ocrImage(source) {
    const worker = await getWorker();
    const { data } = await worker.recognize(source);
    return data.text;
  }

  // Splits recognised text into candidate questions: a new chunk starts at
  // a numbered/lettered marker ("1.", "(a)", "(i)", "Q3") or a blank line,
  // since real question papers are laid out this way. Short fragments
  // (page numbers, headers) are dropped.
  function splitIntoQuestions(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    const chunks = [];
    let current = "";
    const startsNew = /^(\(?\d{1,2}\)?[.)]|\(?[a-z]\)|\(?[ivx]{1,4}\)|Q\d{1,2}\b)/i;
    lines.forEach((line) => {
      if (!line) return;
      if (startsNew.test(line) && current) {
        chunks.push(current.trim());
        current = line;
      } else {
        current += (current ? " " : "") + line;
      }
    });
    if (current) chunks.push(current.trim());
    return chunks.filter((c) => c.length >= 12);
  }

  async function renderMatches(questions) {
    if (!questions.length) {
      status.textContent = "Could not find any readable question text in that file. Try a clearer photo or a different PDF.";
      return;
    }
    status.textContent = `Found ${questions.length} question${questions.length === 1 ? "" : "s"}. Checking each against what Sauti knows…`;

    // Headings and instructions ("Answer ALL questions") are not questions:
    // skip them when they don't match, instead of listing them as unanswered.
    const looksLikeQuestion = (t) => /^(\(?\d{1,2}\)?[.)]|\(?[a-z]\)|Q\d)/i.test(t) || t.includes("?");
    for (const q of questions) {
      const outcome = await window.__sautiAnswerQuestion(q);
      if (!outcome.matched && !looksLikeQuestion(q)) continue;
      const box = document.createElement("div");
      box.className = "zv-qa";
      const qEl = document.createElement("div");
      qEl.className = "zv-q";
      qEl.textContent = q;
      box.appendChild(qEl);
      const aEl = document.createElement("div");
      aEl.className = "zv-a";
      if (outcome.matched) {
        aEl.textContent = `${outcome.item.a} (${outcome.item.level} · ${outcome.item.topic})`;
      } else {
        aEl.textContent = "No confident match, this looks like it is outside what Sauti currently teaches.";
        aEl.style.color = "#8a6d00";
      }
      box.appendChild(aEl);
      if (outcome.matched && window.__sautiRenderCheckAnswer) window.__sautiRenderCheckAnswer(box, outcome.item.a);
      result.appendChild(box);
    }
    status.textContent = defaultStatusText;
  }

  window.__sautiOcrImage = ocrImage;
  window.__sautiSplitQuestions = splitIntoQuestions;
  window.__sautiRenderMatches = renderMatches;

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    result.innerHTML = "";
    try {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      let text;
      if (isPdf) {
        if (!window.__sautiExtractPdfText) throw new Error("PDF support not loaded");
        status.textContent = "Reading the PDF…";
        text = await window.__sautiExtractPdfText(file, (msg) => (status.textContent = msg));
      } else {
        status.textContent = "Reading the photo…";
        text = await ocrImage(file);
      }
      await renderMatches(splitIntoQuestions(text));
    } catch (err) {
      console.error("Sauti scan failed", err);
      status.textContent = "Could not read that file. Try again with a clearer photo, or a different PDF.";
    } finally {
      input.value = "";
    }
  });
})();
