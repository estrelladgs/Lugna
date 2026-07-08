import * as Speech from 'expo-speech';

export function warmUp() {
  Speech.getAvailableVoicesAsync().catch(() => {});
}

export function unlockSpeech() {
  // No-op on native — the platform TTS engine doesn't need a gesture unlock.
}

export function stopSpeaking() {
  Speech.stop();
}

export function speakCorrection(text: string) {
  Speech.stop();
  Speech.speak(text, {
    language: 'es-ES',
    onError: (err) => console.warn('[TTS] speak error', err),
  });
}
