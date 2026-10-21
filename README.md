# Sauti: a voice-first, offline Computer Science tutor

Sauti (Swahili for "voice") is a Chrome extension that teaches Computer Science to students who don't have reliable internet. It's designed from the start to be fully usable by blind and low-vision students.

All of it runs on the student's own device. It makes no network calls and needs no account or API key, and it has no running cost.

## What it does today

| Feature | How it works |
|---|---|
| **Ask a question** (typed or spoken) | Google's Universal Sentence Encoder QnA model runs in the browser through TensorFlow.js and matches the question against verified syllabus Q&As. If no match is confident enough, Sauti asks the student to rephrase rather than guessing. |
| **Calibrated matching** | The match threshold (0.16) was tuned by running a real past exam paper through the same model and tokenizer in a Node harness. The tuning favours an honest "please rephrase" over a confident answer on the wrong topic. |
| **Scan a question paper** | Tesseract (WebAssembly, language data bundled) reads photos. PDFs use pdf.js to pull the embedded text first and fall back to OCR only for scanned pages. Every recognised question goes through the same matcher. |
| **Offline speech input** | Vosk speech-to-text runs as WebAssembly inside a Web Worker. Chrome's built-in speech recognition was rejected because it sends audio to the cloud. Microphone audio never leaves the device. |
| **Read aloud and screen readers** | ARIA live regions announce every change to NVDA, JAWS, VoiceOver and TalkBack. There's also a built-in read-aloud mode that uses the operating system's local voices. |
| **Check my answer** | Shows the student which key terms from the correct answer are missing from theirs, so the feedback is transparent. |
| **Classroom mode** | `classroom/server.js` is a Node.js server with no dependencies. It runs on a teacher's laptop and serves a whole class over a local hotspot, with no internet uplink. |

**Content:** the Algorithm Design and Data Structures thread of Zimbabwe's national Computer Science syllabus, Forms 3 to 6. Each topic has an explanation, a hands-on practical activity and practice questions.

## Current limitations

- Sauti can retrieve verified answers, but it can't reason. It can't re-explain a concept in a new way or follow a student's working.
- Answer checking uses keyword overlap, not understanding.
- Voice input is English only.

## Roadmap: Meta Global AI Developer Hackathon (Oct 26 to Nov 4, 2026)

These are planned features, not built yet:

1. **Feedback on handwritten work:** the student photographs a flowchart or trace table, SAM 3.1 separates out its shapes and arrows, and Muse Spark finds the exact step that's wrong. Sauti then explains it aloud.
2. **Grounded tutoring:** Muse Spark re-explains concepts and generates practice questions, always anchored to the verified syllabus content.
3. **No-internet classroom AI:** a Meta open-weights model runs on the teacher's laptop and serves the whole class over the local network.

## Run it

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Click the Sauti toolbar icon. It opens as a full tab and works with Wi-Fi turned off.

Classroom mode: run `node classroom/server.js`, open `http://localhost:3000/teacher`, and have students open the LAN address the server prints.

## Third-party components

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Author

Built by Comfort Kamanombe, Software Engineering, Bindura University of Science and Technology, Zimbabwe.
