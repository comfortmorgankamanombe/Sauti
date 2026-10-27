// Sauti: PDF support for Scan a Question Paper.
//
// Most real past papers (like the official ZIMSEC ones already used to
// test Sauti) are genuine digital PDFs with real embedded text, not
// scanned images. For those, pulling the actual text out with pdf.js
// (Mozilla, Apache-2.0, runs fully offline here, no network fetch) is
// both faster and far more accurate than OCR. Only a page with no real
// text layer, i.e. an actual scanned photo saved as a PDF, falls back to
// rendering that page to a canvas and running it through the exact same
// offline OCR engine (window.__sautiOcrImage) that handles photos.

import * as pdfjsLib from "./lib/pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdfjs/pdf.worker.min.mjs");

async function extractPdfText(file, onProgress) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    if (onProgress) onProgress(`Reading page ${i} of ${pdf.numPages}…`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Rebuild line breaks from each text item's vertical position, so the
    // questions stay on separate lines for splitIntoQuestions() in ocr.js.
    let pageText = "";
    let lastY = null;
    for (const item of textContent.items) {
      const y = item.transform[5];
      if (lastY !== null) pageText += Math.abs(y - lastY) > 2 ? "\n" : " ";
      pageText += item.str;
      lastY = y;
    }
    pageText = pageText.replace(/ +/g, " ").trim();

    if (pageText.length >= 20) {
      fullText += "\n" + pageText;
    } else {
      // No usable text layer on this page, probably a scanned image.
      if (onProgress) onProgress(`Page ${i} has no text layer, scanning it instead…`);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
      const ocrText = await window.__sautiOcrImage(canvas);
      fullText += "\n" + ocrText;
    }
  }
  return fullText;
}

window.__sautiExtractPdfText = extractPdfText;
