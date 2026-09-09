// sounds.js - kurze Feedback-Töne, synthetisch per Web Audio API erzeugt.
// Keine Audio-Dateien nötig, funktioniert offline und ist winzig klein.
//
// Die Töne laufen über einen Tiefpassfilter und nutzen vor allem
// sine/triangle-Wellen statt roher square/sawtooth-Töne, damit es weniger
// nach 8-Bit-Retro und mehr nach modernen UI-Sounds klingt.

let audioCtx = null;
let noiseBuffer = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getNoiseBuffer() {
  const ctx = getAudioCtx();
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    const length = ctx.sampleRate; // 1 Sekunde reicht für alle Ausschnitte
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// Ton mit optionalem Tiefpassfilter für einen weicheren, moderneren Klang.
function tone(freq, start, duration, opts = {}) {
  const { type = 'sine', peak = 0.22, filterFreq = null, attack = 0.015 } = opts;
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  let outNode = osc;
  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t0);
    osc.connect(filter);
    outNode = filter;
  }

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  outNode.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// Wie tone(), aber die Frequenz gleitet von startFreq zu endFreq.
function sweep(startFreq, endFreq, start, duration, opts = {}) {
  const { type = 'sine', peak = 0.22, filterFreq = null, attack = 0.015 } = opts;
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + duration);

  let outNode = osc;
  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t0);
    osc.connect(filter);
    outNode = filter;
  }

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  outNode.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// Kurzer gefilterter Rauschimpuls - für "Klick"/"Pop"-artige, moderne UI-Texturen.
function noiseBurst(start, duration, opts = {}) {
  const { filterFreq = 2000, filterType = 'bandpass', peak = 0.2, Q = 1 } = opts;
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime + start;
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer();

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, t0);
  filter.Q.value = Q;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(t0);
  source.stop(t0 + duration + 0.05);
}

const WRONG_SOUNDS = {
  soft: () => tone(196, 0, 0.28, { type: 'triangle', peak: 0.22, filterFreq: 800 }),
  double: () => {
    tone(220, 0, 0.12, { type: 'sine', peak: 0.22, filterFreq: 900 });
    tone(196, 0.14, 0.18, { type: 'sine', peak: 0.22, filterFreq: 900 });
  },
  descend: () => sweep(420, 180, 0, 0.3, { type: 'triangle', peak: 0.2, filterFreq: 1200 }),
  click: () => {
    noiseBurst(0, 0.08, { filterFreq: 1400, filterType: 'bandpass', peak: 0.3, Q: 2 });
    tone(180, 0.02, 0.2, { type: 'sine', peak: 0.18, filterFreq: 700 });
  },
  denied: () => {
    tone(300, 0, 0.1, { type: 'square', peak: 0.1, filterFreq: 1000 });
    tone(300, 0.13, 0.16, { type: 'square', peak: 0.1, filterFreq: 1000 });
  },
  thud: () => {
    sweep(160, 45, 0, 0.32, { type: 'sine', peak: 0.28, filterFreq: 500 });
    noiseBurst(0, 0.1, { filterFreq: 300, filterType: 'lowpass', peak: 0.15 });
  },
};

const CORRECT_SOUNDS = {
  chime: () => {
    tone(659.25, 0, 0.18, { type: 'sine', peak: 0.2, filterFreq: 4000 });
    tone(783.99, 0.08, 0.18, { type: 'sine', peak: 0.2, filterFreq: 4000 });
    tone(987.77, 0.16, 0.32, { type: 'sine', peak: 0.2, filterFreq: 4000 });
  },
  pop: () => {
    noiseBurst(0, 0.05, { filterFreq: 3000, filterType: 'bandpass', peak: 0.25, Q: 1.5 });
    tone(880, 0.01, 0.2, { type: 'sine', peak: 0.2, filterFreq: 5000 });
  },
  bell: () => {
    tone(1046.5, 0, 0.4, { type: 'sine', peak: 0.18, filterFreq: 6000 });
    tone(1050, 0, 0.4, { type: 'sine', peak: 0.12, filterFreq: 6000 }); // leichte Verstimmung = Schimmer
  },
  rise: () => sweep(400, 1100, 0, 0.35, { type: 'sine', peak: 0.2, filterFreq: 5000 }),
  confirm: () => {
    tone(587.33, 0, 0.16, { type: 'triangle', peak: 0.2, filterFreq: 4500 });
    tone(880, 0.1, 0.3, { type: 'triangle', peak: 0.22, filterFreq: 4500 });
  },
  sparkle: () => {
    tone(1318.5, 0, 0.12, { type: 'sine', peak: 0.16, filterFreq: 7000 });
    tone(1567.98, 0.06, 0.12, { type: 'sine', peak: 0.16, filterFreq: 7000 });
    tone(2093, 0.12, 0.25, { type: 'sine', peak: 0.18, filterFreq: 7000 });
  },
};

function playWrongSound(name) {
  (WRONG_SOUNDS[name] || WRONG_SOUNDS.soft)();
}

function playCorrectSound(name) {
  (CORRECT_SOUNDS[name] || CORRECT_SOUNDS.chime)();
}
