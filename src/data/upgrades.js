/* ============================================================
   망원경 업그레이드 — 실제 관측 파라미터를 확장한다.
   관측 범위(레벨 게이팅) · 시야(최대 FOV) · 배율(최소 FOV) ·
   초점(확정 반경) · 감응(감지 반경) · 파장(survey 해금).
   computeStats() 가 업그레이드 레벨로부터 실제 스탯을 계산한다.
   ============================================================ */

export const UPGRADES = [
  {
    id: "range", name: "관측 범위", icon: "🚀",
    desc: "더 높은 레벨의 별자리를 관측할 수 있다. 시야도 함께 넓어진다.",
    maxLevel: 5, baseCost: 90, costGrowth: 1.55,
  },
  {
    id: "zoom", name: "배율 강화", icon: "🔬",
    desc: "더 깊게 확대해 어두운 별까지 또렷하게 본다. (최소 FOV 감소)",
    maxLevel: 5, baseCost: 80, costGrowth: 1.5,
  },
  {
    id: "lens", name: "렌즈 강화", icon: "🔭",
    desc: "어두운 별을 감지한다. 별빛 반응이 더 멀리서 시작된다.",
    maxLevel: 5, baseCost: 80, costGrowth: 1.5,
  },
  {
    id: "focus", name: "초점 안정화", icon: "🎯",
    desc: "좌표 오차를 보정해 관측 확정이 쉬워진다. (확정 반경 증가)",
    maxLevel: 5, baseCost: 75, costGrowth: 1.5,
  },
  {
    id: "resonance", name: "별자리 감응력", icon: "✨",
    desc: "별자리 영역에 들어서면 힌트가 더 또렷하게 반응한다.",
    maxLevel: 4, baseCost: 85, costGrowth: 1.5,
  },
  {
    id: "wavelength", name: "다파장 관측", icon: "🌈",
    desc: "적외선 · X선 · 전파 등 다른 파장대의 하늘을 해금한다.",
    maxLevel: 3, baseCost: 140, costGrowth: 1.7,
  },
];

/** 다파장 survey 정의 (wavelength 레벨이 오를수록 순서대로 해금) */
export const SURVEYS = [
  { id: "P/DSS2/color",        label: "가시광 (DSS)",    band: "optical" },
  { id: "P/2MASS/color",       label: "근적외선 (2MASS)", band: "infrared" },
  { id: "P/allWISE/color",     label: "적외선 (WISE)",   band: "infrared" },
  { id: "P/RASS",              label: "X선 (ROSAT)",     band: "xray" },
];

export function upgradeCost(upgrade, currentLevel) {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, currentLevel));
}

/**
 * 업그레이드 레벨 → 실제 관측 스탯.
 * @param {Object} levels { range, zoom, lens, focus, resonance, wavelength }
 */
export function computeStats(levels) {
  const range = levels.range || 0;
  const zoom = levels.zoom || 0;
  const lens = levels.lens || 0;
  const focus = levels.focus || 0;
  const res = levels.resonance || 0;
  const wave = levels.wavelength || 0;
  const total = range + zoom + lens + focus + res + wave;

  return {
    // 시야를 얼마나 넓게 볼 수 있는가 (도). 최대 FOV
    maxFov: 50 + range * 14,
    // 얼마나 깊게 확대할 수 있는가 (도). 최소 FOV
    minFov: Math.max(0.3, 7 - zoom * 1.3),
    // 별자리 영역 안에서 별빛 반응이 시작되는 중심까지 각거리 (도)
    detectRadiusDeg: 6 + lens * 2.4 + res * 3,
    // 관측(확정) 가능한 각거리 (도)
    lockRadiusDeg: 1.6 + focus * 1.1,
    // 해금된 survey 개수 (가시광 1 + wavelength)
    surveyCount: Math.min(SURVEYS.length, 1 + wave),
    telescopeLevel: 1 + total,
    totalUpgrades: total,
  };
}

/** 망원경 외형 단계 (0~5) */
export function telescopeAppearanceStage(telescopeLevel) {
  if (telescopeLevel >= 12) return 5;
  if (telescopeLevel >= 9) return 4;
  if (telescopeLevel >= 6) return 3;
  if (telescopeLevel >= 4) return 2;
  if (telescopeLevel >= 2) return 1;
  return 0;
}

export const APPEARANCE_NAMES = [
  "작은 나무 망원경",
  "은빛 렌즈 망원경",
  "황금 장식 망원경",
  "별빛이 흐르는 망원경",
  "마법 문양 망원경",
  "떠다니는 렌즈의 망원경",
];
