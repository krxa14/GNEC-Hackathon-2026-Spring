function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase())) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.split("-")[0]?.toLowerCase() ?? "")) ??
    null
  );
}

export function speak(text: string, lang: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const content = text.trim();
  if (!content) return;
  cancel();
  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = lang;
  utterance.voice = pickVoice(lang);
  window.speechSynthesis.speak(utterance);
}

export function cancel(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
