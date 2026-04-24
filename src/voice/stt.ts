type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal?: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const scope = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isSTTSupported(): boolean {
  return typeof window !== "undefined" && getSpeechRecognition() !== null;
}

export function startListening(
  onResult: (text: string) => void,
  onEnd: () => void,
  lang = "en-US"
): () => void {
  const Ctor = getSpeechRecognition();
  if (!Ctor) {
    onEnd();
    return () => undefined;
  }

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const result = Array.from(event.results)
      .map((entry) => entry[0]?.transcript ?? "")
      .join(" ")
      .trim();
    if (result) onResult(result);
  };
  recognition.onend = () => onEnd();
  recognition.start();

  return () => {
    recognition.onend = null;
    recognition.stop();
  };
}
