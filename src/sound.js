export function createSoundEffects() {
  let audioContext = null;
  let masterGain = null;
  let compressor = null;
  let supported = true;
  let noiseBuffer = null;

  function getAudioContextCtor() {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.AudioContext || window.webkitAudioContext || null;
  }

  function createNoiseBuffer(context) {
    const length = Math.max(1, Math.floor(context.sampleRate * 0.2));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function getContext() {
    if (!supported) {
      return null;
    }

    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) {
      supported = false;
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioContextCtor();
      masterGain = audioContext.createGain();
      compressor = audioContext.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(-18, audioContext.currentTime);
      compressor.knee.setValueAtTime(12, audioContext.currentTime);
      compressor.ratio.setValueAtTime(10, audioContext.currentTime);
      compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
      compressor.release.setValueAtTime(0.14, audioContext.currentTime);

      masterGain.gain.setValueAtTime(0.22, audioContext.currentTime);
      masterGain.connect(compressor);
      compressor.connect(audioContext.destination);
      noiseBuffer = createNoiseBuffer(audioContext);
    }

    return audioContext;
  }

  function getOutputNode() {
    const context = getContext();
    if (!context || !masterGain) {
      return null;
    }

    return masterGain;
  }

  function scheduleOscillator({
    now,
    duration,
    type,
    startFrequency,
    endFrequency,
    gainValue,
    detune = 0,
    q = 0,
    filterType = 'lowpass',
    filterFrequency = 4000,
  }) {
    const context = getContext();
    const output = getOutputNode();
    if (!context || !output) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 30), now + duration);
    oscillator.detune.setValueAtTime(detune, now);

    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFrequency, now);
    filter.Q.setValueAtTime(q, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  }

  function scheduleNoiseBurst({ now, duration, gainValue, filterFrequency, q = 1.2 }) {
    const context = getContext();
    const output = getOutputNode();
    if (!context || !output || !noiseBuffer) {
      return;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFrequency, now);
    filter.Q.setValueAtTime(q, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.start(now);
    source.stop(now + duration + 0.03);
  }

  async function unlock() {
    const context = getContext();
    if (!context) {
      return false;
    }

    if (context.state === 'running') {
      return true;
    }

    try {
      await context.resume();
      return context.state === 'running';
    } catch {
      return false;
    }
  }

  function playNormalLaser(now) {
    scheduleOscillator({
      now,
      duration: 0.14,
      type: 'sawtooth',
      startFrequency: 1880,
      endFrequency: 240,
      gainValue: 0.16,
      filterType: 'lowpass',
      filterFrequency: 3600,
      q: 0.8,
    });

    scheduleOscillator({
      now: now + 0.008,
      duration: 0.12,
      type: 'square',
      startFrequency: 920,
      endFrequency: 150,
      gainValue: 0.08,
      detune: -7,
      filterType: 'bandpass',
      filterFrequency: 1900,
      q: 1.3,
    });

    scheduleNoiseBurst({
      now,
      duration: 0.05,
      gainValue: 0.04,
      filterFrequency: 2500,
      q: 1.8,
    });
  }

  function playPursuitLaser(now) {
    scheduleOscillator({
      now,
      duration: 0.18,
      type: 'square',
      startFrequency: 1240,
      endFrequency: 200,
      gainValue: 0.17,
      filterType: 'bandpass',
      filterFrequency: 2200,
      q: 1.4,
    });

    scheduleOscillator({
      now: now + 0.012,
      duration: 0.16,
      type: 'triangle',
      startFrequency: 1810,
      endFrequency: 260,
      gainValue: 0.08,
      detune: 12,
      filterType: 'lowpass',
      filterFrequency: 3000,
      q: 0.6,
    });

    scheduleNoiseBurst({
      now,
      duration: 0.06,
      gainValue: 0.03,
      filterFrequency: 3200,
      q: 2.1,
    });
  }

  function playSweepLaser(now) {
    scheduleOscillator({
      now,
      duration: 0.34,
      type: 'sawtooth',
      startFrequency: 640,
      endFrequency: 70,
      gainValue: 0.22,
      filterType: 'lowpass',
      filterFrequency: 1800,
      q: 1.1,
    });

    scheduleOscillator({
      now: now + 0.02,
      duration: 0.3,
      type: 'triangle',
      startFrequency: 420,
      endFrequency: 95,
      gainValue: 0.11,
      detune: -5,
      filterType: 'bandpass',
      filterFrequency: 1200,
      q: 1.5,
    });

    scheduleNoiseBurst({
      now,
      duration: 0.1,
      gainValue: 0.06,
      filterFrequency: 900,
      q: 0.9,
    });
  }

  function playLaser(kind = 'NORMAL') {
    const context = getContext();
    if (!context) {
      return;
    }

    if (context.state !== 'running') {
      void unlock().then((didUnlock) => {
        if (didUnlock) {
          playLaser(kind);
        }
      });
      return;
    }

    const now = context.currentTime;

    if (kind === 'SWEEP') {
      playSweepLaser(now);
      return;
    }

    if (kind === 'PURSUIT') {
      playPursuitLaser(now);
      return;
    }

    playNormalLaser(now);
  }

  return {
    unlock,
    playLaser,
  };
}
