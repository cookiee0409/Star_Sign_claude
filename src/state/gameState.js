/* ============================================================
   게임 상태 관리 + 로컬 저장
   - 단일 state 객체를 보관하고 localStorage에 직렬화한다.
   - computeStats()로 파생 스탯을 얻는다.
   ============================================================ */

import { computeStats } from "../data/upgrades.js";

const SAVE_KEY = "star-explorer-save-v1";

export const BADGES = [
  { id: "first_light", name: "첫 별빛", desc: "첫 별자리를 관측했다." },
  { id: "precise_5deg", name: "정밀 좌표", desc: "실제 좌표 오차 5도 이내로 관측했다." },
  { id: "telescope_lv3", name: "망원경 Lv.3", desc: "망원경 레벨 3을 달성했다." },
  { id: "cloud_breaker", name: "구름 사이의 별", desc: "구름 많은 밤에 관측에 성공했다." },
  { id: "orion_complete", name: "오리온 완전 관측", desc: "오리온자리를 관측 로그에 남겼다." },
  { id: "five_logs", name: "작은 관측가", desc: "관측 로그 5개를 작성했다." },
];

const CLOUDS = {
  low: { label: "적음", resonance: 1.08, reward: 1.08 },
  medium: { label: "보통", resonance: 1, reward: 1 },
  high: { label: "많음", resonance: 0.78, reward: 1.18 },
};
const MOONLIGHT = {
  weak: { label: "약함", resonance: 1.06, reward: 1.08 },
  medium: { label: "보통", resonance: 1, reward: 1 },
  strong: { label: "강함", resonance: 0.82, reward: 1.12 },
};
const LIGHT_POLLUTION = {
  low: { label: "낮음", resonance: 1.1, reward: 1.16 },
  medium: { label: "보통", resonance: 1, reward: 1 },
  high: { label: "높음", resonance: 0.86, reward: 1.1 },
};
const SEEING = {
  poor: { label: "불안정", focus: -4, reward: 1.08 },
  average: { label: "보통", focus: 0, reward: 1 },
  good: { label: "좋음", focus: 5, reward: 1.12 },
};

function pickWeighted(seed, items) {
  const total = items.reduce((n, [, w]) => n + w, 0);
  let r = (Math.sin(seed * 9301.17) * 10000) % total;
  if (r < 0) r += total;
  for (const [value, weight] of items) {
    if (r < weight) return value;
    r -= weight;
  }
  return items[0][0];
}

export function createSkyCondition(night) {
  const cloud = pickWeighted(night + 11, [["low", 4], ["medium", 4], ["high", 2]]);
  const moonlight = pickWeighted(night + 23, [["weak", 4], ["medium", 4], ["strong", 2]]);
  const lightPollution = pickWeighted(night + 37, [["low", 3], ["medium", 5], ["high", 2]]);
  const seeing = pickWeighted(night + 51, [["poor", 2], ["average", 5], ["good", 3]]);
  const resonanceMultiplier =
    CLOUDS[cloud].resonance * MOONLIGHT[moonlight].resonance * LIGHT_POLLUTION[lightPollution].resonance;
  const rewardMultiplier =
    CLOUDS[cloud].reward * MOONLIGHT[moonlight].reward * LIGHT_POLLUTION[lightPollution].reward * SEEING[seeing].reward;
  const observationBonus = Math.round((rewardMultiplier - 1) * 100);
  return {
    cloud,
    moonlight,
    lightPollution,
    seeing,
    resonanceMultiplier: Number(resonanceMultiplier.toFixed(2)),
    rewardMultiplier: Number(rewardMultiplier.toFixed(2)),
    focusBonus: SEEING[seeing].focus,
    observationBonus,
  };
}

export function conditionSummary(c) {
  return `구름 ${CLOUDS[c.cloud]?.label || "-"}, 달빛 ${MOONLIGHT[c.moonlight]?.label || "-"}, 빛공해 ${LIGHT_POLLUTION[c.lightPollution]?.label || "-"}, 시상 ${SEEING[c.seeing]?.label || "-"}`;
}

export function conditionDetails(c) {
  return [
    ["구름", CLOUDS[c.cloud]?.label || "-"],
    ["달빛", MOONLIGHT[c.moonlight]?.label || "-"],
    ["빛공해", LIGHT_POLLUTION[c.lightPollution]?.label || "-"],
    ["시상", SEEING[c.seeing]?.label || "-"],
    ["관측 보너스", `${c.observationBonus >= 0 ? "+" : ""}${c.observationBonus}%`],
  ];
}

/** 기본(새 게임) 상태 */
function defaultState() {
  return {
    version: 1,
    starEnergy: 0,
    night: 1,
    discovered: {},            // { constellationId: { night, x, y } }
    upgradeLevels: {           // 업그레이드별 현재 레벨
      distance: 0, lens: 0, view: 0, focus: 0, resonance: 0, mystery: 0,
    },
    flags: {
      seenIntro: false,        // 도입 대사 본 적 있는지
      firstDiscovery: false,   // 첫 별자리 발견 연출 완료
    },
    observationLogs: [],
    badges: {},
    skyCondition: createSkyCondition(1),
    settings: { sound: true, volume: 0.6 },
    survey: "P/DSS2/color",         // 마지막 선택한 파장(survey)
    lastView: { ra: 83.98, dec: -1.07, fov: 50 }, // 우주 화면 마지막 RA/Dec/FOV
  };
}

let state = defaultState();

/* ---------- 접근자 ---------- */
export function getState() { return state; }
export function getStats() { return computeStats(state.upgradeLevels); }
export function getSkyCondition() { return state.skyCondition || createSkyCondition(state.night); }

export function isDiscovered(id) { return !!state.discovered[id]; }
export function discoveredCount() { return Object.keys(state.discovered).length; }
export function observationLogCount() { return state.observationLogs.length; }

/* ---------- 변경 ---------- */
export function addEnergy(amount) {
  state.starEnergy = Math.max(0, Math.round(state.starEnergy + amount));
  save();
}

export function spendEnergy(amount) {
  if (state.starEnergy < amount) return false;
  state.starEnergy -= amount;
  save();
  return true;
}

export function markDiscovered(id, ra, dec) {
  if (state.discovered[id]) return false;
  state.discovered[id] = { night: state.night, ra, dec };
  save();
  return true;
}

export function addObservationLog(log) {
  const item = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...log,
  };
  state.observationLogs.unshift(item);
  const earned = refreshBadges();
  save();
  return { item, earned };
}

export function applyUpgrade(upgradeId) {
  state.upgradeLevels[upgradeId] = (state.upgradeLevels[upgradeId] || 0) + 1;
  refreshBadges();
  save();
}

export function setFlag(key, value = true) { state.flags[key] = value; save(); }
export function advanceNight() {
  state.night += 1;
  state.skyCondition = createSkyCondition(state.night);
  save();
}
export function setLastView(ra, dec, fov) { state.lastView = { ra, dec, fov }; /* 잦은 호출이므로 즉시 저장 안 함 */ }
export function setSurvey(id) { state.survey = id; save(); }
export function setSetting(key, value) { state.settings[key] = value; save(); }

function refreshBadges() {
  const before = { ...state.badges };
  const logs = state.observationLogs || [];
  const stats = getStats();
  const award = (id) => { state.badges[id] = state.badges[id] || { earnedAtNight: state.night }; };

  if (discoveredCount() >= 1) award("first_light");
  if (logs.some((l) => (l.errorDeg ?? Infinity) <= 5)) award("precise_5deg");
  if (stats.telescopeLevel >= 3) award("telescope_lv3");
  if (logs.some((l) => l.condition?.cloud === "high")) award("cloud_breaker");
  if (logs.some((l) => l.targetId === "ori")) award("orion_complete");
  if (logs.length >= 5) award("five_logs");

  return Object.keys(state.badges).filter((id) => !before[id]);
}

/* ---------- 저장 / 불러오기 ---------- */
export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("저장 실패:", e);
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    // 기본값과 병합(새 필드 호환)
    state = { ...defaultState(), ...parsed,
      upgradeLevels: { ...defaultState().upgradeLevels, ...(parsed.upgradeLevels || {}) },
      flags: { ...defaultState().flags, ...(parsed.flags || {}) },
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
      observationLogs: parsed.observationLogs || [],
      badges: parsed.badges || {},
      skyCondition: parsed.skyCondition || createSkyCondition(parsed.night || 1),
    };
    refreshBadges();
    return true;
  } catch (e) {
    console.warn("불러오기 실패:", e);
    return false;
  }
}

export function newGame() {
  state = defaultState();
  save();
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
}
