// Web speech synthesis has two well-known Chrome/Edge footguns that silently
// kill speech with no error event at all:
//  1. Calling speak() synchronously right after cancel() drops the new
//     utterance (crbug.com/679437) — fixed by deferring speak() a tick.
//  2. SpeechSynthesisUtterance is garbage-collected if nothing keeps a strong
//     reference to it, cutting speech off mid-flight (crbug.com/509488) —
//     fixed by holding it in a module-level variable until it finishes.
let currentUtterance: SpeechSynthesisUtterance | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

export function warmUp() {
  window.speechSynthesis?.getVoices();
}

export function unlockSpeech() {
  // iOS Safari only allows speak() when it's called synchronously inside a
  // direct user gesture — every later call (like our async posture
  // corrections) is silently dropped otherwise. Speak a near-silent utterance
  // from the "Comenzar" tap to unlock the engine for the rest of the session.
  const unlock = new SpeechSynthesisUtterance(' ');
  unlock.volume = 0;
  window.speechSynthesis?.speak(unlock);
}

export function stopSpeaking() {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  window.speechSynthesis?.cancel();
  currentUtterance = null;
}

export function speakCorrection(text: string) {
  stopSpeaking();
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.onerror = (event) => console.warn('[TTS] speak error', event);
    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
    };
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }, 150);
}
