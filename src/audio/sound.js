/* ============================================================
   사운드 엔진 (WebAudio 합성 — 외부 오디오 파일 없음)
   - 조용한 밤 배경음(앰비언트 패드) + 각종 효과음
   - 사용자 제스처 이후에만 오디오 컨텍스트가 시작된다(브라우저 정책).
   ============================================================ */

import { getState } from "../state/gameState.js";

let ctx = null;
let masterGain = null;
let ambientNodes = null;
let started = false;

function ensureCtx() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = getState().settings.volume ?? 0.6;
  masterGain.connect(ctx.destination);
  return ctx;
}

export function setVolume(v) {
  if (masterGain) masterGain.gain.value = v;
}

function enabled() {
  return getState().settings.sound;
}

/** 사용자 첫 제스처에서 호출 — 오디오 재개 + 배경음 시작 */
export function unlockAudio() {
  ensureCtx();
  if (ctx.state === "suspended") ctx.resume();
  if (!started && enabled()) startAmbient();
  started = true;
}

/* ---------- 배경 앰비언트 ---------- */
export function startAmbient() {
  ensureCtx();
  if (ambientNodes || !enabled()) return;
  const now = ctx.currentTime;

  const pad = ctx.createGain();
  pad.gain.value = 0.0;
  pad.gain.linearRampToValueAtTime(0.12, now + 4);
  pad.connect(masterGain);

  // 두 개의 느리게 디튠된 오실레이터로 따뜻한 패드
  const freqs = [110, 164.81, 220];
  const oscs = freqs.map((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.5 : 0.28;
    // 아주 느린 비브라토
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06 + i * 0.02;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 1.5;
    lfo.connect(lfoGain);
    lfoGain.connect(o.frequency);
    o.connect(g); g.connect(pad);
    o.start(); lfo.start();
    return { o, lfo };
  });

  ambientNodes = { pad, oscs };
  startMusic();
}

export function stopAmbient() {
  stopMusic();
  if (!ambientNodes) return;
  const now = ctx.currentTime;
  ambientNodes.pad.gain.linearRampToValueAtTime(0, now + 1.5);
  const nodes = ambientNodes;
  setTimeout(() => {
    nodes.oscs.forEach(({ o, lfo }) => { try { o.stop(); lfo.stop(); } catch (e) {} });
  }, 1600);
  ambientNodes = null;
}

/** 설정 변경 시 배경음 on/off 동기화 */
export function syncAmbient() {
  if (enabled()) { if (!ambientNodes) startAmbient(); startMusic(); }
  else stopAmbient();
}

/* ---------- 멜로디 배경음악 (오르골 느낌, 펜타토닉 자장가) ---------- */
let musicTimer = null, musicStep = 0;
// f: 주파수(0=쉼표), d: 박자, g: 음량
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5, G4: 392.0, A4: 440.0 };
const MELODY = [
  { f: N.E5, d: 1, g: 0.11 }, { f: N.G5, d: 1, g: 0.1 }, { f: N.A5, d: 2, g: 0.11 }, { f: N.G5, d: 1, g: 0.09 },
  { f: N.E5, d: 1, g: 0.1 }, { f: N.D5, d: 1, g: 0.09 }, { f: N.C5, d: 2, g: 0.11 }, { f: 0, d: 1, g: 0 },
  { f: N.G4, d: 1, g: 0.09 }, { f: N.C5, d: 1, g: 0.1 }, { f: N.E5, d: 1, g: 0.1 }, { f: N.G5, d: 2, g: 0.11 },
  { f: N.A5, d: 1, g: 0.1 }, { f: N.G5, d: 1, g: 0.09 }, { f: N.E5, d: 2, g: 0.1 }, { f: 0, d: 2, g: 0 },
];

function bell(freq, dur, gain) {
  if (!enabled() || !freq) return;
  ensureCtx();
  const t0 = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(masterGain);
  // 기음 + 옥타브 배음으로 오르골 같은 맑은 음색
  [[freq, 1], [freq * 2, 0.35]].forEach(([f, amp]) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const og = ctx.createGain();
    og.gain.value = amp;
    o.connect(og); og.connect(g);
    o.start(t0); o.stop(t0 + dur + 0.05);
  });
}

export function startMusic() {
  if (musicTimer || !enabled()) return;
  ensureCtx();
  musicStep = 0;
  const beat = 560; // ms
  musicTimer = setInterval(() => {
    if (!enabled()) return;
    const n = MELODY[musicStep % MELODY.length];
    if (n.f) bell(n.f, (n.d * beat) / 1000 + 0.5, n.g);
    musicStep++;
  }, beat);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}

/* ---------- 효과음 헬퍼 ---------- */
function blip({ freq = 440, type = "sine", dur = 0.12, gain = 0.2, slideTo = null, delay = 0 }) {
  if (!enabled()) return;
  ensureCtx();
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(masterGain);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

/* ---------- 공개 효과음 ---------- */
export const Sfx = {
  click()      { blip({ freq: 520, type: "square", dur: 0.06, gain: 0.12 }); },
  coordType()  { blip({ freq: 700 + Math.random() * 120, type: "square", dur: 0.04, gain: 0.07 }); },
  move()       { blip({ freq: 300, type: "sine", dur: 0.18, gain: 0.12, slideTo: 480 }); },
  twinkle()    { blip({ freq: 1400 + Math.random() * 600, type: "sine", dur: 0.16, gain: 0.06 }); },
  detect()     { blip({ freq: 880, type: "sine", dur: 0.1, gain: 0.08, slideTo: 1320 }); },
  upgrade()    {
    [523, 659, 784, 1046].forEach((f, i) => blip({ freq: f, type: "triangle", dur: 0.18, gain: 0.14, delay: i * 0.07 }));
  },
  mystery()    { blip({ freq: 200, type: "sawtooth", dur: 0.5, gain: 0.1, slideTo: 900 }); },
  // 별자리 발견: 부드러운 코드
  discover() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) =>
      blip({ freq: f, type: "sine", dur: 0.9, gain: 0.16, delay: i * 0.12 }));
  },
  // 별에너지 흡수: 상승 스윕
  absorb() {
    if (!enabled()) return;
    ensureCtx();
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(300, t0);
    o.frequency.exponentialRampToValueAtTime(1600, t0 + 1.4);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    o.connect(g); g.connect(masterGain);
    o.start(t0); o.stop(t0 + 1.7);
  },
};
