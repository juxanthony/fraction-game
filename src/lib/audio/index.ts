/**
 * Audio helpers: text-to-speech for question reading (accessibility) and
 * lightweight WebAudio sound effects — no audio assets needed.
 */

export function speak(text: string, lang: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function tone(freq: number, startDelay: number, duration: number, type: OscillatorType = "sine", volume = 0.15): void {
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + startDelay);
  osc.stop(c.currentTime + startDelay + duration);
}

export function playCorrect(): void {
  tone(523, 0, 0.15);
  tone(659, 0.12, 0.15);
  tone(784, 0.24, 0.25);
}

export function playWrong(): void {
  tone(220, 0, 0.2, "sawtooth", 0.08);
  tone(180, 0.18, 0.3, "sawtooth", 0.08);
}

export function playWin(): void {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.15, 0.3));
}

export function playTick(): void {
  tone(880, 0, 0.05, "square", 0.04);
}
