/* ============================================================
   별자리 데이터 (실제 천문 좌표 기반)
   - 모든 좌표는 실제 적도좌표 RA(deg), Dec(deg). (J2000 근사값)
   - stars: 별자리를 이루는 실제 밝은 별들 (이름 + RA/Dec)
   - lines: stars 인덱스 쌍 → 별자리 연결선(아스테리즘)
   - boundary: IAU 별자리 영역을 근사한 다각형 [ [ra,dec], ... ]
       (직사각형 외접 근사이며, 정밀 IAU 경계 데이터로 손쉽게 교체 가능)
   - center: 영역의 대표 중심(별빛 반응 게이지 기준점)
   - requiredLevel: 발견(관측 확정)에 필요한 망원경 레벨
   MVP 대표 별자리 5개: 오리온 · 큰곰 · 카시오페이아 · 백조 · 사자
   ============================================================ */

export const RARITY_INFO = {
  common:    { label: "일반 별자리",     cls: "rarity-common",    color: "#cfd8e6" },
  rare:      { label: "희귀 별자리",     cls: "rarity-rare",      color: "#7ec8ff" },
  ancient:   { label: "고대 별자리",     cls: "rarity-ancient",   color: "#c9a86a" },
  forgotten: { label: "잊힌 별자리",     cls: "rarity-forgotten", color: "#c08bff" },
  myth:      { label: "신화 별자리",     cls: "rarity-myth",      color: "#ff9ed8" },
  end:       { label: "우주의 끝 별자리", cls: "rarity-end",       color: "#ffe27a" },
};

export const CONSTELLATIONS = [
  {
    id: "ori", name: "오리온자리", abbr: "Ori",
    description: "겨울 하늘의 사냥꾼. 삼태성(허리띠)과 베텔게우스·리겔로 유명하다.",
    story: "“가장 먼저 너에게 보여주고 싶었어. 사냥꾼의 별, 오리온이야.”",
    rarity: "rare", requiredLevel: 1, energyReward: 120,
    center: { ra: 83.98, dec: -1.07 },
    hints: ["겨울 하늘의 남쪽 근처에서 빛나는 사냥꾼", "시간축은 5와 6 사이", "하늘높이는 0보다 조금 아래"],
    boundary: [[70.8, -11], [96.5, -11], [96.5, 23], [70.8, 23]],
    stars: [
      { name: "베텔게우스", ra: 88.793, dec: 7.407 },
      { name: "벨라트릭스", ra: 81.283, dec: 6.350 },
      { name: "민타카", ra: 83.002, dec: -0.299 },
      { name: "알닐람", ra: 84.053, dec: -1.202 },
      { name: "알니탁", ra: 85.190, dec: -1.943 },
      { name: "사이프", ra: 86.939, dec: -9.670 },
      { name: "리겔", ra: 78.634, dec: -8.202 },
    ],
    lines: [[0, 1], [0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6]],
  },
  {
    id: "uma", name: "큰곰자리", abbr: "UMa",
    description: "북두칠성을 품은 큰 별자리. 국자 모양의 일곱 별이 길잡이가 된다.",
    story: "“북두칠성을 따라가면 길을 잃지 않아. 오래된 여행자의 약속이지.”",
    rarity: "common", requiredLevel: 1, energyReward: 90,
    center: { ra: 185.0, dec: 55.6 },
    hints: ["북쪽 하늘의 국자 모양 일곱 별", "시간축은 12 근처", "하늘높이는 매우 높다"],
    boundary: [[122, 29], [217, 29], [217, 73], [122, 73]],
    stars: [
      { name: "두베", ra: 165.932, dec: 61.751 },
      { name: "메라크", ra: 165.460, dec: 56.382 },
      { name: "페크다", ra: 178.458, dec: 53.695 },
      { name: "메그레즈", ra: 183.857, dec: 57.033 },
      { name: "알리오스", ra: 193.507, dec: 55.960 },
      { name: "미자르", ra: 200.981, dec: 54.925 },
      { name: "알카이드", ra: 206.885, dec: 49.313 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    id: "cas", name: "카시오페이아자리", abbr: "Cas",
    description: "북쪽 하늘의 W. 적경 0h를 가로지르는 왕비의 별자리.",
    story: "“하늘에 새겨진 W. 어떤 밤에도 북쪽을 알려주는 표식이야.”",
    rarity: "rare", requiredLevel: 2, energyReward: 150,
    center: { ra: 15.33, dec: 60.06 },
    hints: ["북쪽 하늘에 새겨진 W 모양", "시간축은 0과 1 사이", "하늘높이는 아주 높다"],
    // 적경 0h를 가로지름 (deltaRA 기반 판정으로 안전 처리)
    boundary: [[344.5, 46], [51.3, 46], [51.3, 77], [344.5, 77]],
    stars: [
      { name: "카프", ra: 2.295, dec: 59.150 },
      { name: "쉐다르", ra: 10.127, dec: 56.537 },
      { name: "감마", ra: 14.177, dec: 60.717 },
      { name: "루크바", ra: 21.454, dec: 60.235 },
      { name: "세긴", ra: 28.599, dec: 63.670 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: "cyg", name: "백조자리", abbr: "Cyg",
    description: "여름 은하수를 가로지르는 백조. 북쪽 십자가라고도 불린다.",
    story: "“은하수 위를 나는 백조. 가장 깊은 밤에 가장 빛나지.”",
    rarity: "ancient", requiredLevel: 3, energyReward: 200,
    center: { ra: 303.28, dec: 38.52 },
    hints: ["여름 은하수를 가로지르는 북쪽 십자가", "시간축은 20 근처", "하늘높이는 중간보다 높다"],
    boundary: [[287, 27], [330.7, 27], [330.7, 61], [287, 61]],
    stars: [
      { name: "데네브", ra: 310.358, dec: 45.280 },
      { name: "사드르", ra: 305.557, dec: 40.257 },
      { name: "알비레오", ra: 292.680, dec: 27.960 },
      { name: "기에나", ra: 311.553, dec: 33.970 },
      { name: "델타", ra: 296.243, dec: 45.131 },
    ],
    lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  {
    id: "leo", name: "사자자리", abbr: "Leo",
    description: "봄을 알리는 사자. 낫 모양(물음표)과 데네볼라가 특징이다.",
    story: "“봄을 데려오는 사자. 갈기를 닮은 낫이 보이니?”",
    rarity: "ancient", requiredLevel: 3, energyReward: 220,
    center: { ra: 157.79, dec: 19.14 },
    hints: ["봄을 알리는 사자의 낫 모양", "시간축은 10과 11 사이", "하늘높이는 조금 높다"],
    boundary: [[140.5, -6], [179.5, -6], [179.5, 33], [140.5, 33]],
    stars: [
      { name: "레굴루스", ra: 152.093, dec: 11.967 },
      { name: "에타", ra: 151.833, dec: 16.763 },
      { name: "알기에바", ra: 154.993, dec: 19.842 },
      { name: "제타", ra: 154.173, dec: 23.417 },
      { name: "뮤", ra: 148.193, dec: 26.007 },
      { name: "엡실론", ra: 146.463, dec: 23.774 },
      { name: "데네볼라", ra: 177.265, dec: 14.572 },
      { name: "델타", ra: 168.527, dec: 20.524 },
      { name: "세타", ra: 168.560, dec: 15.430 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 7], [7, 6], [6, 8], [8, 0]],
  },
];

export function getConstellation(id) {
  return CONSTELLATIONS.find((c) => c.id === id);
}
