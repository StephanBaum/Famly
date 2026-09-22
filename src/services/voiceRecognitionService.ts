/**
 * Robust, cross-platform Voice Recognition Service
 * Specifically optimized for Android Chrome, Google Pixel, and PWA WebAPKs.
 */

export interface VoiceSessionCallbacks {
  onStart?: () => void;
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string, isPermissionError: boolean) => void;
  onEnd?: () => void;
}

export interface VoiceSession {
  stop: () => void;
  abort: () => void;
  isListening: boolean;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Pre-flight permission request using getUserMedia.
 * On Android Chrome and PWA WebAPKs, calling getUserMedia inside a click/touch handler
 * prompts the Android OS permission dialog ("Bei Verwendung der App zulassen").
 * Once granted, SpeechRecognition succeeds reliably.
 */
export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      error: 'Dein Browser unterstützt keinen Mikrofonzugriff.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop tracks to release hardware for the SpeechRecognition engine
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
    return {
      granted: false,
      error: isDenied
        ? 'Mikrofon-Zugriff verweigert. Bitte tippe in Chrome auf das Website-Icon/Schloss neben der Adresse (oder halte das App-Icon gedrückt → App-Info) und erlaube „Mikrofon“.'
        : `Mikrofon konnte nicht aktiviert werden: ${err.message || 'Gerät blockiert'}.`,
    };
  }
}

/**
 * Starts an Android-safe speech recognition session.
 * Must be triggered by a direct user gesture (e.g. onClick).
 */
export async function startVoiceRecognition(
  callbacks: VoiceSessionCallbacks,
  options?: { lang?: string; continuous?: boolean }
): Promise<VoiceSession | null> {
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    callbacks.onError('Spracherkennung wird in diesem Browser leider nicht unterstützt.', false);
    return null;
  }

  // Pre-flight permission check on Android/mobile
  const perm = await requestMicrophonePermission();
  if (!perm.granted) {
    callbacks.onError(perm.error || 'Mikrofonzugriff nicht gestattet.', true);
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    const isMobile = isMobileDevice();

    recognition.lang = options?.lang || 'de-DE';
    // On Android Chrome, continuous = true causes sudden cuts with network/no-speech errors.
    // Setting continuous = false on mobile ensures reliable single-turn or auto-chained speech.
    recognition.continuous = options?.continuous !== undefined ? options.continuous : !isMobile;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let stoppedManually = false;
    let accumulatedText = '';

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          accumulatedText += (accumulatedText ? ' ' : '') + item[0].transcript.trim();
        } else {
          interim += item[0].transcript;
        }
      }

      const fullText = (accumulatedText + (interim ? ' ' + interim : '')).trim();
      callbacks.onTranscriptChange(fullText, event.results[event.results.length - 1]?.isFinal || false);
    };

    recognition.onerror = (event: any) => {
      console.warn('VoiceRecognition error:', event.error);
      const err = event.error;

      if (err === 'not-allowed' || err === 'service-not-allowed') {
        callbacks.onError(
          'Mikrofonzugriff verweigert oder von Google Speech Services blockiert. Bitte in den Chrome-Einstellungen unter „Berechtigungen → Mikrofon“ freigeben.',
          true
        );
      } else if (err === 'network') {
        callbacks.onError(
          'Sprachdienst konnte nicht kontaktiert werden. Bitte prüfe deine Internetverbindung oder aktiviere Google Spracheingabe.',
          false
        );
      } else if (err === 'no-speech') {
        // Just silent timeout, no hard error
        if (stoppedManually) return;
      } else if (err === 'audio-capture') {
        callbacks.onError('Kein Mikrofon gefunden oder Mikrofon durch eine andere App belegt.', false);
      } else {
        callbacks.onError(`Spracherkennungs-Fehler (${err}).`, false);
      }
    };

    recognition.onend = () => {
      callbacks.onEnd?.();
    };

    recognition.start();

    return {
      stop: () => {
        stoppedManually = true;
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      },
      abort: () => {
        stoppedManually = true;
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      },
      isListening: true,
    };
  } catch (err: any) {
    console.error('Failed to create SpeechRecognition session:', err);
    callbacks.onError(`Fehler beim Starten der Spracheingabe: ${err.message || String(err)}`, false);
    return null;
  }
}
