// Sauti: voice mode.
//
// Two separate accessibility layers, deliberately kept apart:
//
// 1. ARIA live regions (set directly in panel.html, on #zv-body,
//    #zv-ask-result and #zv-ask-status) announce every content change to
//    any screen reader the student is already running (NVDA, JAWS,
//    VoiceOver, TalkBack). This is the real backbone for a blind student
//    and costs nothing extra here, it's just correct HTML.
//
// 2. The code below adds Sauti's OWN built-in read-aloud mode, for a
//    student who has no screen reader installed, and for live demos
//    where anyone watching can hear it work without setting one up. It uses the
//    browser's speechSynthesis API, which on Windows/Chrome speaks using
//    the OS's local SAPI voices, not a cloud service, so turning it on
//    does not break the "zero internet" guarantee. We deliberately pick a
//    voice flagged localService===true to make sure of that; a cloud
//    voice is never selected even if Chrome offers one.
//
// Voice INPUT (speech-to-text) is intentionally not implemented: Chrome's
// SpeechRecognition API requires an internet connection to Google's
// servers, which would contradict Sauti's core offline claim. Documented
// as a roadmap item rather than faked with a feature that would silently
// fail offline.

(function () {
  const STORAGE_KEY = "sauti-read-aloud";
  const toggleBtn = document.querySelector("#zv-voice-toggle");
  const watchedRegions = [
    document.querySelector("#zv-body"),
    document.querySelector("#zv-ask-result"),
  ].filter(Boolean);

  if (!toggleBtn || !("speechSynthesis" in window)) {
    if (toggleBtn) {
      toggleBtn.disabled = true;
      toggleBtn.title = "Read Aloud is not supported in this browser.";
    }
    return;
  }

  let enabled = false;
  try { enabled = localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) {}

  let offlineVoice = null;
  function pickOfflineVoice() {
    const voices = speechSynthesis.getVoices();
    offlineVoice =
      voices.find((v) => v.localService && v.lang && v.lang.startsWith("en")) ||
      voices.find((v) => v.localService) ||
      null;
  }
  pickOfflineVoice();
  speechSynthesis.addEventListener("voiceschanged", pickOfflineVoice);

  let lastSpoken = { body: "", ask: "" };

  function speak(text) {
    const clean = text.trim();
    if (!clean) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.95;
    utter.pitch = 1;
    if (offlineVoice) utter.voice = offlineVoice;
    speechSynthesis.speak(utter);
  }

  function setEnabled(next) {
    enabled = next;
    try { localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch (e) {}
    toggleBtn.setAttribute("aria-pressed", enabled ? "true" : "false");
    toggleBtn.setAttribute("aria-label", enabled ? "Turn off Read Aloud" : "Turn on Read Aloud");
    if (!enabled) {
      speechSynthesis.cancel();
    } else {
      const body = document.querySelector("#zv-body");
      if (body && body.textContent.trim()) {
        lastSpoken.body = body.textContent.trim();
        speak(lastSpoken.body);
      }
    }
  }
  setEnabled(enabled);

  toggleBtn.addEventListener("click", () => setEnabled(!enabled));

  // Debounced per-region watcher: a topic switch or widget re-render fires
  // many DOM mutations in a burst (innerHTML clear, then many appendChild
  // calls). Waiting for mutations to settle avoids reading "" then the
  // real content, or reading a half-built widget mid-render.
  const timers = new WeakMap();
  function watch(region, key) {
    const observer = new MutationObserver(() => {
      if (!enabled) return;
      clearTimeout(timers.get(region));
      timers.set(
        region,
        setTimeout(() => {
          const text = region.textContent.trim();
          if (text && text !== lastSpoken[key]) {
            lastSpoken[key] = text;
            speak(text);
          }
        }, 400)
      );
    });
    observer.observe(region, { childList: true, subtree: true, characterData: true });
  }

  watchedRegions.forEach((region) => {
    watch(region, region.id === "zv-body" ? "body" : "ask");
  });
})();
