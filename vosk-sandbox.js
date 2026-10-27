// Sauti: the speech-recognition side of voice input, inside the sandbox.
// Messages in:  {type:"load", buffer}  the model .tar.gz as an ArrayBuffer
//               {type:"start", sampleRate}  create a fresh recogniser
//               {type:"audio", data, sampleRate}  one chunk of microphone audio
//               {type:"stop"}
// Messages out: {type:"loaded"} | {type:"error", message}
//               {type:"partial", text} | {type:"result", text}

(function () {
  let model = null;
  let recognizer = null;

  function reply(msg) {
    window.parent.postMessage(Object.assign({ source: "sauti-vosk" }, msg), "*");
  }

  window.addEventListener("message", async (event) => {
    if (event.source !== window.parent) return;
    const msg = event.data || {};
    try {
      if (msg.type === "load") {
        if (!model) {
          const url = URL.createObjectURL(new Blob([msg.buffer], { type: "application/gzip" }));
          model = await Vosk.createModel(url);
        }
        reply({ type: "loaded" });
      } else if (msg.type === "start" && model) {
        if (recognizer) recognizer.remove();
        recognizer = new model.KaldiRecognizer(msg.sampleRate || 16000);
        recognizer.setWords(false);
        recognizer.on("partialresult", (m) => reply({ type: "partial", text: m.result.partial || "" }));
        recognizer.on("result", (m) => reply({ type: "result", text: (m.result.text || "").trim() }));
      } else if (msg.type === "audio" && recognizer) {
        recognizer.acceptWaveformFloat(msg.data, msg.sampleRate);
      } else if (msg.type === "stop" && recognizer) {
        recognizer.remove();
        recognizer = null;
      }
    } catch (err) {
      reply({ type: "error", message: String((err && err.message) || err) });
    }
  });
})();
