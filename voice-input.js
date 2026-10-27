// Sauti: offline voice input.
//
// Closes the gap deliberately left open in voice.js: that file reads
// content aloud but has no way to ask a question back except typing.
// This file adds the other direction, using Vosk (Apache-2.0), a real
// speech-to-text engine compiled to WebAssembly, running entirely on
// this device in a sandboxed extension page (vosk-sandbox.html). The acoustic model (models/vosk-small-en/)
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

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micBtn.disabled = true;
    micBtn.title = "Offline voice input is not supported in this browser.";
    return;
  }

  // Vosk runs in a sandboxed page (vosk-sandbox.html), because its
  // WebAssembly build needs new Function(), which extension pages block.
  // This page keeps the microphone and streams the audio in.
  const frame = document.createElement("iframe");
  frame.src = chrome.runtime.getURL("vosk-sandbox.html");
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  document.body.appendChild(frame);
  const frameReady = new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
  const handlers = {};
  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow || !event.data || event.data.source !== "sauti-vosk") return;
    const h = handlers[event.data.type];
    if (h) h(event.data);
  });
  function send(msg, transfer) {
    frame.contentWindow.postMessage(msg, "*", transfer || []);
  }

  let modelReady = null;
  let audioContext = null;
  let mediaStream = null;
  let sourceNode = null;
  let processorNode = null;
  let listening = false;
  let defaultStatusText = "";

  function setStatus(text) {
    status.textContent = text;
  }

  function ensureModel() {
    if (modelReady) return modelReady;
    setStatus("Loading offline voice model (one-time, about 40MB, no internet used)…");
    micBtn.disabled = true;
    modelReady = (async () => {
      await frameReady;
      const buffer = await (await fetch(chrome.runtime.getURL("models/vosk-small-en/model.tar.gz"))).arrayBuffer();
      await new Promise((resolve, reject) => {
        handlers.loaded = resolve;
        handlers.error = (m) => reject(new Error(m.message));
        send({ type: "load", buffer }, [buffer]);
      });
      micBtn.disabled = false;
    })();
    modelReady.catch(() => { modelReady = null; micBtn.disabled = false; });
    return modelReady;
  }

  async function startListening() {
    defaultStatusText = status.textContent;
    await ensureModel();

    handlers.partial = (m) => { if (m.text) setStatus(`Listening… "${m.text}"`); };
    handlers.result = (m) => {
      if (m.text) {
        input.value = m.text;
        stopListening();
        askBtn.click();
      }
    };
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
    });

    audioContext = new AudioContext();
    send({ type: "start", sampleRate: audioContext.sampleRate });
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    processorNode.onaudioprocess = (event) => {
      if (!listening) return;
      const data = new Float32Array(event.inputBuffer.getChannelData(0));
      send({ type: "audio", data, sampleRate: event.inputBuffer.sampleRate }, [data.buffer]);
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
    send({ type: "stop" });
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
