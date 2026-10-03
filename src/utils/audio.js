let audioCtx;
export function initAudio() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioCtx ||= new Context();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  } catch {}
}
export function playTickSound() {
  if (!audioCtx || audioCtx.state !== "running") return;
  try {
    const osc = audioCtx.createOscillator(),
      gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(460, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      160,
      audioCtx.currentTime + 0.035,
    );
    gain.gain.setValueAtTime(0.065, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {}
}
export function playTadaSound() {
  if (!audioCtx || audioCtx.state !== "running") return;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    try {
      const osc = audioCtx.createOscillator(),
        gain = audioCtx.createGain(),
        start = audioCtx.currentTime + index * 0.09;
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {}
  });
}
