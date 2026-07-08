import * as Speech from 'expo-speech';

let spanishVoiceId: string | undefined;

export function warmUp() {
  Speech.getAvailableVoicesAsync()
    .then((voices) => {
      const match =
        voices.find((v) => v.language.toLowerCase() === 'es-es') ??
        voices.find((v) => v.language.toLowerCase().startsWith('es'));
      spanishVoiceId = match?.identifier;
    })
    .catch(() => {});
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
    // Pin an actual Spanish voice when the device has one installed — setting
    // `language` alone can still fall back to the system's default-language
    // voice (foreign accent) if the OS UI language isn't Spanish.
    voice: spanishVoiceId,
    onError: (err) => console.warn('[TTS] speak error', err),
  });
}
