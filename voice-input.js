// Sauti: offline voice input.
//
// Closes the gap deliberately left open in voice.js: that file reads
// content aloud but has no way to ask a question back except typing.
// This file adds the other direction, using Vosk (Apache-2.0), a real
// speech-to-text engine compiled to WebAssembly, running entirely inside
// this tab via a Web Worker. The acoustic model (models/vosk-small-en/)
// is bundled with the extension, same as the USE-QnA model ask.js uses,
// so recognition never calls out to a server, unlike Chrome's built-in
// SpeechRecognition API, which is cloud-only and was rejected for exactly
// that reason. Microphone audio never leaves the device.
//
// Flow: click the mic, speak, click it again (or pause) to stop. The
// transcript fills the question box and the existing Ask button is
// triggered, reusing ask.js's on-device QnA matching unchanged.

(function () {
  const micBtn = document.querySelector("#zv-mic-btn");
  const input = document.querySelector("#zv-ask-input");
  const askBtn = document.querySelector("#zv-ask-btn");
  const status = document.querySelector("#zv-ask-status");
  if (!micBtn || !input || !askBtn) return;

  if (typeof Vosk === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micBtn.disabled = true;
    micBtn.title = "Offline voice input is not supported in this browser.";
    return;
  }

  let model = null;
  let recognizer = null;
  let audioContext = null;
  let mediaStream = null;
  let sourceNode = null;
  let processorNode = null;
  let listening = false;
  let defaultStatusText = "";

  function setStatus(text) {
    status.textContent = text;
  }

  async function ensureModel() {
    if (model) return model;
    setStatus("Loading offline voice model (one-time, about 40MB, no internet used)…");
    micBtn.disabled = true;
    model = await Vosk.createModel(chrome.runtime.getURL("models/vosk-small-en/model.tar.gz"));
    micBtn.disabled = false;
    return model;
  }

  async function startListening() {
    defaultStatusText = status.textContent;
    await ensureModel();

    recognizer = new model.KaldiRecognizer(16000);
    recognizer.setWords(false);

    recognizer.on("partialresult", (message) => {
      const partial = message.result.partial;
      if (partial) setStatus(`Listening… "${partial}"`);
    });
    recognizer.on("result", (message) => {
      const text = (message.result.text || "").trim();
      if (text) {
        input.value = text;
        stopListening();
        askBtn.click();
      }
    });

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
    });

    audioContext = new AudioContext();
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    processorNode.onaudioprocess = (event) => {
      if (!listening) return;
      try {
        recognizer.acceptWaveform(event.inputBuffer);
      } catch (err) {
        console.error("Sauti voice input: acceptWaveform failed", err);
      }
    };
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    sourceNode.connect(processorNode);
    processorNode.connect(audioContext.destination);

    listening = true;
    micBtn.setAttribute("aria-pressed", "true");
    micBtn.setAttribute("aria-label", "Stop listening");
    setStatus("Listening… speak your question.");
  }

  function stopListening() {
    listening = false;
    micBtn.setAttribute("aria-pressed", "false");
    micBtn.setAttribute("aria-label", "Ask by voice, offline");

    if (processorNode) { processorNode.disconnect(); processorNode.onaudioprocess = null; processorNode = null; }
    if (sourceNode) { sourceNode.disconnect(); sourceNode = null; }
    if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
    if (audioContext) { audioContext.close(); audioContext = null; }
    if (recognizer) { recognizer.remove(); recognizer = null; }
  }

  micBtn.addEventListener("click", async () => {
    if (listening) {
      setStatus(defaultStatusText || "");
      stopListening();
      return;
    }
    try {
      await startListening();
    } catch (err) {
      console.error("Sauti voice input failed", err);
      setStatus("Could not access the microphone. Check the browser's mic permission and try again.");
      micBtn.disabled = false;
    }
  });
})();
