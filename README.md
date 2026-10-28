# Sauti: a voice-first, offline Computer Science tutor

Sauti (Swahili for "voice") is a Chrome extension that teaches Computer Science to students who don't have reliable internet. It's designed from the start to be fully usable by blind and low-vision students.

All of it runs on the student's own device. It makes no network calls and needs no account or API key, and it has no running cost.

## What it does today

| Feature | How it works |
|---|---|
| **Ask a question** (typed or spoken) | Google's Universal Sentence Encoder QnA model runs in the browser through TensorFlow.js. Sauti compares the student's question with verified questions using two signals: the model's meaning vectors (after removing the component every question shares) and IDF-weighted overlap of syllabus terms. If no match is confident enough, Sauti asks the student to rephrase rather than guessing. |
| **Calibrated matching** | `test/match-test.js` runs 40 real student-style questions and 20 off-topic ones through the extension. Current result: 38/40 answered correctly, 1 asked to rephrase, 1 close answer, and 20/20 off-topic questions rejected. The stored questions' vectors are precomputed (`test/build-embeddings.js`), so Sauti is ready in under a second. |
| **Scan a question paper** | Tesseract (WebAssembly, language data bundled) reads photos. PDFs use pdf.js to pull the embedded text first and fall back to OCR only for scanned pages. Every recognised question goes through the same matcher. |
| **Offline speech input** | Vosk speech-to-text runs as WebAssembly in a sandboxed extension page (`vosk-sandbox.html`), because its build needs `new Function`, which normal extension pages block. Chrome's built-in speech recognition was rejected because it sends audio to the cloud. Microphone audio never leaves the device. |
| **Read aloud and screen readers** | ARIA live regions announce every change to NVDA, JAWS, VoiceOver and TalkBack. There's also a built-in read-aloud mode that uses the operating system's local voices. |
| **Check my answer** | Shows the student which key terms from the correct answer are missing from theirs, so the feedback is transparent. |
| **Classroom mode** | `classroom/server.js` is a Node.js server with no dependencies. It runs on a teacher's laptop and serves a whole class over a local hotspot, with no internet uplink. |

**Content:** algorithm design, programming fundamentals and data structures, from first concepts to advanced topics. Each topic has an explanation, a hands-on practical activity and practice questions.

## Current limitations

- Sauti can retrieve verified answers, but it can't reason. It can't re-explain a concept in a new way or follow a student's working.
- Answer checking uses keyword overlap, not understanding.
- Voice input is English only.

## Roadmap: Meta Global AI Developer Hackathon (Oct 26 to Nov 4, 2026)

These are planned features, not built yet:

1. **Feedback on handwritten work:** the student photographs a flowchart or trace table, SAM 3.1 separates out its shapes and arrows, and Muse Spark finds the exact step that's wrong. Sauti then explains it aloud.
2. **Grounded tutoring:** Muse Spark re-explains concepts and generates practice questions, always anchored to the verified syllabus content.
3. **No-internet classroom AI:** a Meta open-weights model runs on the teacher's laptop and serves the whole class over the local network.

## Tests

With Playwright installed: `node test/match-test.js` checks question matching. Re-run `node test/build-embeddings.js` after editing the syllabus content in `panel.js`.

## Run it

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Click the Sauti toolbar icon. It opens as a full tab and works with Wi-Fi turned off.

Classroom mode: run `node classroom/server.js` (set `PORT` to change from 3000), open `http://localhost:3000/teacher`, and have students open the LAN address the server prints.

## Third-party components

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Author

Built by Comfort Kamanombe, Software Engineering, Bindura University of Science Education, Zimbabwe.
