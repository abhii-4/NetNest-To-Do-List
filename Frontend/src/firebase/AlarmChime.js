// Audio generator using Web Audio API to synthesize a luxury cinematic arpeggio chime.
// No assets are needed, preventing loading failures.

let audioCtx = null;
let chimeInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSingleChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Premium arpeggiated chord: A4 (440Hz), C#5 (554.37Hz), E5 (659.25Hz)
    const frequencies = [440, 554.37, 659.25];

    frequencies.forEach((freq, index) => {
      const delay = index * 0.12; // 120ms arpeggio stagger
      const noteStart = now + delay;

      // Primary sine wave for pure tone
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteStart);

      // Warm triangle wave for organic, instrument-like depth
      const warmOsc = ctx.createOscillator();
      const warmGain = ctx.createGain();
      warmOsc.type = "triangle";
      warmOsc.frequency.setValueAtTime(freq, noteStart);
      warmOsc.detune.setValueAtTime(6, noteStart); // Subtle chorusing effect

      // Envelope configurations
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(0.12, noteStart + 0.04); // Fast attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.5); // Cinematic long ring decay

      warmGain.gain.setValueAtTime(0, noteStart);
      warmGain.gain.linearRampToValueAtTime(0.04, noteStart + 0.04);
      warmGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.9);

      // Connect nodes
      osc.connect(gainNode);
      warmOsc.connect(warmGain);
      gainNode.connect(ctx.destination);
      warmGain.connect(ctx.destination);

      // Play
      osc.start(noteStart);
      warmOsc.start(noteStart);

      // Stop & Cleanup
      osc.stop(noteStart + 1.6);
      warmOsc.stop(noteStart + 1.0);
    });
  } catch (err) {
    console.error("Failed to play alarm chime:", err);
  }
}

export const startAlarmChime = () => {
  if (chimeInterval) return;
  
  // Try to resume context and play arpeggio
  playSingleChime();
  chimeInterval = setInterval(() => {
    playSingleChime();
  }, 2500);
};

export const stopAlarmChime = () => {
  if (chimeInterval) {
    clearInterval(chimeInterval);
    chimeInterval = null;
  }
};
