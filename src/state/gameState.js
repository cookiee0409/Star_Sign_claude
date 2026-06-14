/* ============================================================
   게임 상태 관리 + 로컬 저장
   - 단일 state 객체를 보관하고 localStorage에 직렬화한다.
   - computeStats()로 파생 스탯을 얻는다.
   ============================================================ */

import { computeStats } from "../data/upgrades.js";

const SAVE_KEY = "star-explorer-save-v1";

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
    settings: { sound: true, volume: 0.6 },
    survey: "P/DSS2/color",         // 마지막 선택한 파장(survey)
    lastView: { ra: 83.98, dec: -1.07, fov: 50 }, // 우주 화면 마지막 RA/Dec/FOV
  };
}

let state = defaultState();

/* ---------- 접근자 ---------- */
export function getState() { return state; }
export function getStats() { return computeStats(state.upgradeLevels); }

export function isDiscovered(id) { return !!state.discovered[id]; }
export function discoveredCount() { return Object.keys(state.discovered).length; }

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

export function applyUpgrade(upgradeId) {
  state.upgradeLevels[upgradeId] = (state.upgradeLevels[upgradeId] || 0) + 1;
  save();
}

export function setFlag(key, value = true) { state.flags[key] = value; save(); }
export function advanceNight() { state.night += 1; save(); }
export function setLastView(ra, dec, fov) { state.lastView = { ra, dec, fov }; /* 잦은 호출이므로 즉시 저장 안 함 */ }
export function setSurvey(id) { state.survey = id; save(); }
export function setSetting(key, value) { state.settings[key] = value; save(); }

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
    };
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
