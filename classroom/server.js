// Sauti Classroom: a local, offline, whole-class mode.
//
// Runs on the teacher's laptop with plain Node.js, zero npm installs (pure
// core modules only), so there is nothing to download in the classroom. Works
// over the teacher's own Wi-Fi hotspot or any local network with no
// internet uplink at all: students never leave the local network, there
// is no cloud service anywhere in this file.
//
// Marking reuses the same idea as ask.js's fuzzy fallback (keyword/text
// matching, not a hidden network call to an AI service) kept deliberately
// simple and explainable: each demo question has a short list of expected
// keywords, and a submitted answer is scored by how many of them appear.
// This is honest about what it is: a demo-ready text match, not a claim
// that this ports Sauti's on-device ML model into Node.
//
// Run with: node server.js
// Teacher opens:  http://localhost:3000/teacher
// Students open:  http://<this computer's LAN IP>:3000   (printed below)

const http = require("http");
const os = require("os");

const PORT = Number(process.env.PORT) || 3000;

// A small demo set, lifted straight from the real Form 3 syllabus content
// already in panel.js, so the classroom demo and the solo tutor never
// contradict each other.
const QUESTIONS = [
  {
    text: "Name the four basic flowchart symbols and what each represents.",
    keywords: ["oval", "start", "end", "rectangle", "process", "diamond", "decision", "parallelogram", "input", "output"],
  },
  {
    text: "What is the purpose of a trace table?",
    keywords: ["track", "variable", "value", "step", "algorithm", "run"],
  },
  {
    text: "Name the three types of data an algorithm should be tested with.",
    keywords: ["normal", "boundary", "extreme", "invalid", "abnormal"],
  },
  {
    text: "Name the three basic control structures used in algorithm design.",
    keywords: ["sequence", "selection", "iteration", "repetition", "loop"],
  },
];

const room = {
  currentIndex: -1,
  submissions: {}, // { [questionIndex]: { [studentName]: { answer, score, verdict, at } } }
};

const sseClients = new Set();

function score(answer, keywords) {
  const text = answer.toLowerCase();
  const hits = keywords.filter((k) => text.includes(k));
  const ratio = hits.length / keywords.length;
  let verdict = "Needs review";
  if (ratio >= 0.6) verdict = "Correct";
  else if (ratio >= 0.3) verdict = "Partial";
  return { ratio, verdict, hits };
}

function broadcast() {
  const payload = JSON.stringify({
    currentIndex: room.currentIndex,
    question: room.currentIndex >= 0 ? QUESTIONS[room.currentIndex].text : null,
    submissions: room.submissions[room.currentIndex] || {},
    totalQuestions: QUESTIONS.length,
  });
  sseClients.forEach((res) => res.write(`data: ${payload}\n\n`));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

function sendHtml(res, html) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const STUDENT_PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sauti Classroom</title>
<style>
body{font:16px system-ui,sans-serif;background:#eef2ff;margin:0;padding:20px;color:#16213a}
h1{color:#1a3c8f;font-size:20px}
#q{background:#fff;border:1px solid #c9d6f5;border-radius:12px;padding:16px;margin:16px 0;font-size:18px;min-height:24px}
textarea{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1.5px solid #c9d6f5;font-size:16px}
button{margin-top:10px;padding:12px 18px;background:#1a3c8f;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer}
#status{margin-top:10px;font-weight:600}
input{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1.5px solid #c9d6f5;font-size:16px;margin-bottom:10px}
</style></head>
<body>
<h1>Sauti Classroom</h1>
<div id="name-step">
  <input id="name" placeholder="Type your name" autocomplete="off">
  <button onclick="setName()">Join</button>
</div>
<div id="quiz-step" style="display:none">
  <div id="q">Waiting for the teacher to start a question…</div>
  <textarea id="answer" rows="3" placeholder="Type your answer…"></textarea>
  <button onclick="submitAnswer()">Submit</button>
  <div id="status"></div>
</div>
<script>
let name = localStorage.getItem("sauti-name") || "";
let currentIndex = -1;
if (name) { document.getElementById("name-step").style.display="none"; document.getElementById("quiz-step").style.display="block"; }
document.getElementById("name").value = name;

function setName() {
  name = document.getElementById("name").value.trim();
  if (!name) return;
  localStorage.setItem("sauti-name", name);
  document.getElementById("name-step").style.display="none";
  document.getElementById("quiz-step").style.display="block";
}

function submitAnswer() {
  const answer = document.getElementById("answer").value.trim();
  if (!answer || !name) return;
  fetch("/api/submit", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ name, answer, questionIndex: currentIndex }) });
  document.getElementById("status").textContent = "Submitted. Waiting for feedback…";
}

const es = new EventSource("/events");
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  currentIndex = data.currentIndex;
  document.getElementById("q").textContent = data.question || "Waiting for the teacher to start a question…";
  document.getElementById("answer").value = "";
  const mine = data.submissions[name];
  document.getElementById("status").textContent = mine ? ("Your result: " + mine.verdict) : "";
};
</script>
</body></html>`;

function teacherPage() {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sauti Classroom — Teacher</title>
<style>
body{font:15px system-ui,sans-serif;background:#f4f6fb;margin:0;padding:20px;color:#16213a}
h1{color:#1a3c8f}
#q{background:#fff;border:1px solid #c9d6f5;border-radius:12px;padding:16px;margin:16px 0;font-size:18px}
button{padding:10px 16px;background:#1a3c8f;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;margin-right:8px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}
td,th{padding:10px;border-bottom:1px solid #e3e8f5;text-align:left}
.Correct{color:#0e6b52;font-weight:700}
.Partial{color:#8a6d00;font-weight:700}
.Needs.review, .verdict-review{color:#b3261e;font-weight:700}
#addr{color:#5c6788;font-size:13px}
</style></head>
<body>
<h1>Sauti Classroom — Teacher</h1>
<p id="addr"></p>
<div id="q">No question started yet.</div>
<button onclick="next()">Next question ▶</button>
<table><thead><tr><th>Student</th><th>Answer</th><th>Result</th></tr></thead><tbody id="rows"></tbody></table>
<script>
document.getElementById("addr").textContent = "Students join at: http://" + location.host + "/";
function next() { fetch("/api/next", { method: "POST" }); }
const es = new EventSource("/events");
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  document.getElementById("q").textContent = data.question
    ? ("Question " + (data.currentIndex + 1) + " of " + data.totalQuestions + ": " + data.question)
    : "No question started yet.";
  const rows = Object.entries(data.submissions).map(([name, s]) =>
    "<tr><td>" + name + "</td><td>" + s.answer + "</td><td class='" + s.verdict.replace(" ", "-") + "'>" + s.verdict + "</td></tr>"
  ).join("");
  document.getElementById("rows").innerHTML = rows || "<tr><td colspan=3>No submissions yet.</td></tr>";
};
</script>
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    sseClients.add(res);
    broadcast();
    req.on("close", () => sseClients.delete(res));
    return;
  }

  if (url.pathname === "/api/next" && req.method === "POST") {
    room.currentIndex = (room.currentIndex + 1) % QUESTIONS.length;
    room.submissions[room.currentIndex] = room.submissions[room.currentIndex] || {};
    broadcast();
    res.writeHead(204); res.end();
    return;
  }

  if (url.pathname === "/api/submit" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const { name, answer, questionIndex } = body;
    if (name && answer && questionIndex === room.currentIndex && room.currentIndex >= 0) {
      const { verdict } = score(answer, QUESTIONS[room.currentIndex].keywords);
      room.submissions[room.currentIndex] = room.submissions[room.currentIndex] || {};
      room.submissions[room.currentIndex][escapeHtml(name)] = { answer: escapeHtml(answer), verdict, at: Date.now() };
      broadcast();
    }
    res.writeHead(204); res.end();
    return;
  }

  if (url.pathname === "/teacher") { sendHtml(res, teacherPage()); return; }
  if (url.pathname === "/") { sendHtml(res, STUDENT_PAGE); return; }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, () => {
  const nets = os.networkInterfaces();
  const lanIps = [];
  Object.values(nets).forEach((ifaces) => (ifaces || []).forEach((i) => {
    if (i.family === "IPv4" && !i.internal) lanIps.push(i.address);
  }));
  console.log(`Sauti Classroom running.`);
  console.log(`Teacher dashboard: http://localhost:${PORT}/teacher`);
  if (lanIps.length) {
    console.log(`Students on the same Wi-Fi/hotspot join at:`);
    lanIps.forEach((ip) => console.log(`  http://${ip}:${PORT}`));
  } else {
    console.log(`No LAN IP detected yet — connect to Wi-Fi/hotspot first, then restart this.`);
  }
});
