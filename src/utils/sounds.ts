// Sound effects using Web Audio API - no external files needed

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Play a beep sound with specified frequency and duration
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not supported or blocked
    console.warn('Audio playback failed:', e);
  }
};

// Countdown tick - plays during last 5 seconds
export const playTick = () => {
  playTone(800, 0.1, 'square', 0.2);
};

// Final countdown tick - more urgent
export const playUrgentTick = () => {
  playTone(1000, 0.15, 'square', 0.3);
};

// Correct answer - happy ascending tone
export const playCorrect = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.2);
  });
};

// Wrong answer - descending buzz
export const playWrong = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  [300, 250].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.2);
  });
};

// Game start - fanfare
export const playGameStart = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  [392, 523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.3);
  });
};

// Round complete - celebration
export const playRoundComplete = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Triumphant chord
  [523, 659, 784, 1047].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);
  });
};

// Time's up - buzzer
export const playTimeUp = () => {
  playTone(200, 0.5, 'sawtooth', 0.3);
};

// Answer selected - click feedback
export const playSelect = () => {
  playTone(600, 0.05, 'sine', 0.15);
};

// Initialize audio context on first user interaction
export const initAudio = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (e) {
    // Ignore
  }
};
