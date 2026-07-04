// Web Speech API helpers with feature detection

/**
 * Speak text using SpeechSynthesis
 * @param {string} text - Text to speak
 * @returns {Promise<void>}
 */
export const speak = (text) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported in this browser');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      resolve(); // Don't reject — just continue
    };

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Stop speaking
 */
export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Check if SpeechRecognition is available
 */
export const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

/**
 * Create a SpeechRecognition instance
 * @returns {SpeechRecognition|null}
 */
export const createRecognition = () => {
  if (!isSpeechRecognitionSupported()) {
    console.warn('SpeechRecognition not supported in this browser');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  return recognition;
};
