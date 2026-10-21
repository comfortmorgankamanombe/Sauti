// Sauti: check my answer.
//
// Lets a student type their own attempt at a question Sauti has just
// answered, and get a real verdict against it, instead of only being
// shown the correct answer to copy. Deliberately NOT built on the
// on-device embedding model: that model is a dual encoder trained to
// match a QUESTION against a stored response, not to compare two answers
// against each other, so repurposing it for answer-vs-answer scoring
// would be an uncalibrated, unverified use of it. Keyword overlap against
// the real correct answer's own key terms is simpler, transparent to the
// student ("you were missing: X, Y"), and is the same approach already
// tested and working in the Sauti Study Partner (classroom/server.js).

(function () {
  const STOP = new Set([
    "the","a","an","to","of","and","or","is","are","in","on","for","that","this",
    "with","from","by","each","its","as","be","at","it","how","what","produce",
    "draw","write","give","state","using","showing","shown","below","above","was",
    "were","has","have","had","not","but","so","if","then","else","will","would",
    "can","could","into","your","you","their","there","which","who","when","where",
  ]);

  function significantWords(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w));
  }

  function mark(studentAnswer, correctAnswer) {
    const need = Array.from(new Set(significantWords(correctAnswer)));
    const got = new Set(significantWords(studentAnswer));
    const present = need.filter((w) => got.has(w));
    const missing = need.filter((w) => !got.has(w));
    const ratio = need.length ? present.length / need.length : 0;
    // Thresholds checked against real cases, not guessed: a short correct
    // answer (as few as 3 key terms) can lose a whole concept and still
    // clear a 0.6 bar by accident, e.g. "a base case" alone scoring 0.67
    // against "a base case and a recursive case". 0.8 requires covering
    // all but at most one key term before calling it Correct.
    let verdict = "Needs review";
    if (ratio >= 0.8) verdict = "Correct";
    else if (ratio >= 0.4) verdict = "Partial";
    return { verdict, ratio, missing: missing.slice(0, 6) };
  }

  window.__sautiRenderCheckAnswer = function (container, correctAnswerText) {
    const wrap = document.createElement("div");
    wrap.style.marginTop = "10px";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "zv-btn zv-btn-small";
    toggle.textContent = "Check my own answer";
    const body = document.createElement("div");
    body.hidden = true;
    body.style.marginTop = "8px";
    const textarea = document.createElement("textarea");
    textarea.rows = 3;
    textarea.placeholder = "Type your own answer to this question…";
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.padding = "8px";
    textarea.style.borderRadius = "8px";
    textarea.style.border = "1.5px solid #c9d6f5";
    textarea.style.font = "15px system-ui, sans-serif";
    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "zv-btn zv-btn-small";
    checkBtn.style.marginTop = "6px";
    checkBtn.textContent = "Check";
    const verdictEl = document.createElement("div");
    verdictEl.style.marginTop = "6px";
    verdictEl.setAttribute("aria-live", "polite");

    toggle.addEventListener("click", () => {
      body.hidden = !body.hidden;
      toggle.textContent = body.hidden ? "Check my own answer" : "Hide";
    });
    checkBtn.addEventListener("click", () => {
      const studentAnswer = textarea.value.trim();
      if (!studentAnswer) return;
      const { verdict, missing } = mark(studentAnswer, correctAnswerText);
      verdictEl.textContent =
        verdict === "Correct"
          ? "Correct. You covered the key points."
          : verdict === "Partial"
          ? `Partial. You're missing: ${missing.join(", ") || "a few key points"}.`
          : `Needs review. The real answer covers: ${missing.join(", ") || "different key points"}.`;
      verdictEl.style.color = verdict === "Correct" ? "#0e6b52" : verdict === "Partial" ? "#8a6d00" : "#b3261e";
    });

    body.appendChild(textarea);
    body.appendChild(checkBtn);
    body.appendChild(verdictEl);
    wrap.appendChild(toggle);
    wrap.appendChild(body);
    container.appendChild(wrap);
  };
})();
