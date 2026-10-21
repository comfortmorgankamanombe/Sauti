// Sauti: "Ask a question" feature.
//
// Uses Google's Universal Sentence Encoder QnA (on-device), a real
// pretrained machine learning model, running entirely inside this browser
// tab via TensorFlow.js. The model files are bundled in models/use-qna/
// and the TensorFlow.js runtime is bundled in lib/, so nothing here ever
// makes a network request, before or during the demo.
//
// The model turns the typed question and every stored syllabus question
// into vectors (embeddings). The stored question whose vector is closest
// to the typed question's vector is treated as the best match, and its
// answer is shown. If nothing is close enough, the student is asked to
// rephrase, rather than guessing.
//
// Adapted from the Apache-2.0 licensed tokenizer/embedding logic in
// @tensorflow-models/universal-sentence-encoder (tensorflow/tfjs-models),
// pointed at local bundled model files instead of a remote URL.

(function () {
  const MODEL_URL = chrome.runtime.getURL("models/use-qna/model.json");
  const VOCAB_URL = chrome.runtime.getURL("models/use-qna/vocab.json");

  const INPUT_LIMIT = 192;
  const SKIP_VALUES = [0, 1, 2];
  const OFFSET = 3;
  const TOKEN_PADDING = 2;
  const TOKEN_START_VALUE = 1;
  const RESERVED_SYMBOLS_COUNT = 3;
  const QUERY_NODE = "input_inp_text";
  const RESPONSE_NODE = "input_res_text";
  const RESPONSE_CONTEXT_NODE = "input_res_context";
  const QUERY_RESULT_NODE = "Final/EncodeQuery/mul";
  const RESPONSE_RESULT_NODE = "Final/EncodeResult/mul";
  // Recalibrated against a real ZIMSEC 6023/2 (Nov 2024) past paper, run
  // through this exact model/tokenizer in a Node harness: 0.115 was too
  // permissive once tested against genuinely out-of-thread questions
  // (logic circuits, architecture, OOP, databases), several of which
  // scored as high as 0.158 against totally unrelated corpus topics (e.g.
  // an SQL question "matching" Binary Trees). The one clean, correct,
  // unambiguous match in that same real-paper test scored 0.167. 0.16
  // sits in the gap: it costs one true positive that scored 0.127 (a
  // trace-table question), but a confident wrong-topic answer is worse
  // than an honest "please rephrase" here. Re-run this calibration if the
  // corpus grows past its current single syllabus thread.
  const MATCH_THRESHOLD = 0.16;

  // ---------- Tokenizer (wordpiece-style, longest-match trie) ----------
  const SEPARATOR = "▁";

  function stringToChars(str) {
    return Array.from(str);
  }

  function processInput(text) {
    const normalized = text.normalize("NFKC");
    return normalized.length > 0 ? SEPARATOR + normalized.replace(/ /g, SEPARATOR) : normalized;
  }

  class TrieNode {
    constructor() {
      this.parent = null;
      this.children = {};
      this.end = false;
      this.word = [[], 0, 0];
    }
  }

  class Trie {
    constructor() {
      this.root = new TrieNode();
    }
    insert(word, score, index) {
      let node = this.root;
      const chars = stringToChars(word);
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (!node.children[c]) {
          node.children[c] = new TrieNode();
          node.children[c].parent = node;
          node.children[c].word[0] = node.word[0].concat(c);
        }
        node = node.children[c];
        if (i === chars.length - 1) {
          node.end = true;
          node.word[1] = score;
          node.word[2] = index;
        }
      }
    }
    commonPrefixSearch(chars) {
      const collected = [];
      let node = this.root.children[chars[0]];
      let i = 0;
      for (; i < chars.length && node; i++) {
        if (node.end) collected.push(node.word);
        node = node.children[chars[i + 1]];
      }
      if (!collected.length) collected.push([[chars[0]], 0, 0]);
      return collected;
    }
  }

  class Tokenizer {
    constructor(vocabulary, reservedSymbolsCount) {
      this.vocabulary = vocabulary;
      this.reservedSymbolsCount = reservedSymbolsCount == null ? 6 : reservedSymbolsCount;
      this.trie = new Trie();
      for (let i = this.reservedSymbolsCount; i < this.vocabulary.length; i++) {
        this.trie.insert(this.vocabulary[i][0], this.vocabulary[i][1], i);
      }
    }
    encode(text) {
      const nodes = [];
      const indices = [];
      const scores = [];
      const input = processInput(text);
      const chars = stringToChars(input);
      for (let i = 0; i <= chars.length; i++) {
        nodes.push({});
        indices.push(0);
        scores.push(0);
      }
      for (let i = 0; i < chars.length; i++) {
        const matches = this.trie.commonPrefixSearch(chars.slice(i));
        for (let m = 0; m < matches.length; m++) {
          const match = matches[m];
          const entry = { key: match[0], score: match[1], index: match[2] };
          const end = i + match[0].length;
          if (nodes[end][i] == null) nodes[end][i] = [];
          nodes[end][i].push(entry);
        }
      }
      for (let end = 0; end <= chars.length; end++) {
        for (const startKey in nodes[end]) {
          const start = Number(startKey);
          const entries = nodes[end][start];
          for (let e = 0; e < entries.length; e++) {
            const entry = entries[e];
            const candidate = entry.score + scores[start];
            if (scores[end] === 0 || candidate >= scores[end]) {
              scores[end] = candidate;
              indices[end] = entry.index;
            }
          }
        }
      }
      const reversed = [];
      for (let pos = indices.length - 1; pos > 0; ) {
        reversed.push(indices[pos]);
        pos -= this.vocabulary[indices[pos]][0].length;
      }
      const out = [];
      let prevWasUnknown = false;
      for (let i = 0; i < reversed.length; i++) {
        const idx = reversed[i];
        if (prevWasUnknown && idx === 0) {
          // collapse repeated unknown-token markers
        } else {
          out.push(idx);
        }
        prevWasUnknown = idx === 0;
      }
      return out.reverse();
    }
  }

  // ---------- Model loading ----------
  let statePromise = null;

  function loadState() {
    if (statePromise) return statePromise;
    statePromise = (async () => {
      await tf.setBackend("cpu");
      await tf.ready();
      const [model, vocabResp] = await Promise.all([
        tf.loadGraphModel(MODEL_URL),
        fetch(VOCAB_URL),
      ]);
      const vocab = await vocabResp.json();
      const tokenizer = new Tokenizer(vocab, RESERVED_SYMBOLS_COUNT);
      return { model, tokenizer };
    })();
    return statePromise;
  }

  function shiftTokens(tokens) {
    tokens = tokens.slice();
    tokens.unshift(TOKEN_START_VALUE);
    for (let t = 0; t < INPUT_LIMIT; t++) {
      if (t >= tokens.length) {
        tokens[t] = TOKEN_PADDING;
      } else if (!SKIP_VALUES.includes(tokens[t])) {
        tokens[t] += OFFSET;
      }
    }
    return tokens.slice(0, INPUT_LIMIT);
  }

  function tokenizeStrings(tokenizer, strings) {
    const rows = strings.map((s) => shiftTokens(tokenizer.encode(s)));
    return tf.tensor2d(rows, [strings.length, INPUT_LIMIT], "int32");
  }

  // Runs the QnA dual encoder: one branch embeds the query, the other
  // embeds each candidate response (plus optional context), in the same
  // vector space so they can be compared directly.
  function embed(state, queries, responses, contexts) {
    const { model, tokenizer } = state;
    return tf.tidy(() => {
      const q = tokenizeStrings(tokenizer, queries);
      const r = tokenizeStrings(tokenizer, responses);
      const c = tokenizeStrings(tokenizer, contexts || responses.map(() => ""));
      const inputs = {};
      inputs[QUERY_NODE] = q;
      inputs[RESPONSE_NODE] = r;
      inputs[RESPONSE_CONTEXT_NODE] = c;
      const result = model.execute(inputs, [QUERY_RESULT_NODE, RESPONSE_RESULT_NODE]);
      return { queryEmbedding: result[0], responseEmbedding: result[1] };
    });
  }

  function cosineSim(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  // ---------- Spelling-tolerant fallback ----------
  // The embedding model has no built-in typo tolerance: a single misspelled
  // word can tokenize completely differently and tank the similarity score
  // for an otherwise-correct question. This only runs when the AI match
  // already failed, so it can only rescue a rejection, never override a
  // real embedding match. Verified: real typo'd questions land around a
  // 0.04-0.11 edit ratio, genuine off-topic/gibberish lands around 0.6-0.8,
  // a much cleaner separation than the embedding scores give.
  const FUZZY_RATIO_THRESHOLD = 0.25;

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function normalizeForFuzzy(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  }

  function fuzzyFallback(text, corpus) {
    const q = normalizeForFuzzy(text);
    let best = null;
    let bestRatio = Infinity;
    corpus.forEach((item) => {
      const c = normalizeForFuzzy(item.q);
      const dist = levenshtein(q, c);
      const ratio = dist / Math.max(q.length, c.length, 1);
      if (ratio < bestRatio) {
        bestRatio = ratio;
        best = item;
      }
    });
    if (best && bestRatio <= FUZZY_RATIO_THRESHOLD) return { item: best, ratio: bestRatio };
    return null;
  }

  // ---------- Corpus embedding cache ----------
  let corpusCache = null;

  async function getCorpusEmbeddings(state) {
    if (corpusCache) return corpusCache;
    const corpus = window.__zvCorpus || [];
    const questions = corpus.map((item) => item.q);
    const { responseEmbedding } = embed(state, [questions[0] || ""], questions, questions.map(() => ""));
    const data = await responseEmbedding.array();
    responseEmbedding.dispose();
    corpusCache = { corpus, vectors: data };
    return corpusCache;
  }

  // ---------- Public: answer a typed question ----------
  async function answerQuestion(text) {
    const state = await loadState();
    const { corpus, vectors } = await getCorpusEmbeddings(state);
    const { queryEmbedding } = embed(state, [text], [text], [""]);
    const queryVec = (await queryEmbedding.array())[0];
    queryEmbedding.dispose();

    let bestIndex = -1;
    let bestScore = -Infinity;
    vectors.forEach((vec, i) => {
      const score = cosineSim(queryVec, vec);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    if (bestIndex === -1 || bestScore < MATCH_THRESHOLD) {
      const fuzzy = fuzzyFallback(text, corpus);
      if (fuzzy) {
        return { matched: true, score: bestScore, item: fuzzy.item, viaFuzzy: true };
      }
      return { matched: false, score: bestScore };
    }
    return { matched: true, score: bestScore, item: corpus[bestIndex] };
  }

  // ---------- UI wiring ----------
  const input = document.querySelector("#zv-ask-input");
  const askBtn = document.querySelector("#zv-ask-btn");
  const status = document.querySelector("#zv-ask-status");
  const result = document.querySelector("#zv-ask-result");

  if (input && askBtn) {
    // Warm the model up in the background as soon as the page opens, so the
    // first real question doesn't have to wait for the load.
    status.textContent = "Loading the on-device model…";
    loadState()
      .then((state) => getCorpusEmbeddings(state))
      .then(() => { status.textContent = "Ready. Ask anything from Form 3 to Form 6."; })
      .catch((err) => {
        console.error(err);
        status.textContent = "Could not load the on-device model.";
      });

    async function ask() {
      const text = input.value.trim();
      if (!text) return;
      askBtn.disabled = true;
      status.textContent = "Thinking…";
      result.innerHTML = "";
      try {
        const outcome = await answerQuestion(text);
        if (!outcome.matched) {
          status.textContent = "";
          result.innerHTML = "";
          const msg = document.createElement("div");
          msg.className = "zv-hint";
          msg.textContent = "Please rephrase your question, that doesn't closely match anything in the syllabus content yet.";
          result.appendChild(msg);
        } else {
          status.textContent = "";
          const box = document.createElement("div");
          box.className = "zv-qa";
          const tag = document.createElement("div");
          tag.className = "zv-ref";
          tag.textContent = `${outcome.item.level} · ${outcome.item.topic}`;
          const q = document.createElement("div");
          q.className = "zv-q";
          q.textContent = outcome.item.q;
          const a = document.createElement("div");
          a.className = "zv-a";
          a.textContent = outcome.item.a;
          box.appendChild(tag);
          box.appendChild(q);
          box.appendChild(a);
          if (window.__sautiRenderCheckAnswer) window.__sautiRenderCheckAnswer(box, outcome.item.a);
          result.appendChild(box);
        }
      } catch (err) {
        console.error(err);
        status.textContent = "Something went wrong answering that.";
      } finally {
        askBtn.disabled = false;
      }
    }

    askBtn.addEventListener("click", ask);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ask();
    });
  }

  // Exposed so ocr.js can run the same on-device matching against text it
  // pulls off a scanned question paper, without duplicating this logic.
  window.__sautiAnswerQuestion = answerQuestion;
})();
