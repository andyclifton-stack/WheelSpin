let audioCtx = null;

export const initAudio = () => {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

export const playTickSound = () => {
    if (!audioCtx) return;

    // Trigger phone vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); // 10ms short tap
    }

    try {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
        console.error(e);
    }
};

export const playTadaSound = () => {
    if (!audioCtx) return;
    try {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const osc3 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';
        osc3.type = 'square';

        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);

        gainNode.connect(audioCtx.destination);

        osc1.start(audioCtx.currentTime);
        osc2.start(audioCtx.currentTime + 0.1);
        osc3.start(audioCtx.currentTime + 0.2);

        osc1.stop(audioCtx.currentTime + 1.5);
        osc2.stop(audioCtx.currentTime + 1.5);
        osc3.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
        console.error(e);
    }
};
