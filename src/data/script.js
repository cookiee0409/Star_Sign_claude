/* ============================================================
   최소 대화 대본
   - who: 화자 (Lyra / 아버지 / 망원경)
   - expr: Lyra의 표정 (대화 초상화). smiling|normal|serious|frowning|sad|surprised
           (expr가 없으면 초상화 없이 텍스트만 — 예: 아버지/망원경 대사)
   ============================================================ */

export const SCRIPT = {
  intro: [
    { who: "아버지", text: "Lyra, 오늘은 너에게 줄 특별한 선물이 있단다." },
    { who: "Lyra", expr: "surprised", text: "우와…! 이건 망원경이에요?" },
    { who: "아버지", text: "별가루를 모으는 마법 망원경이지. 네가 별자리를 찾을 때마다 빛을 되찾을 거야." },
    { who: "Lyra", expr: "smiling", text: "고마워요 아빠! 제가 우주의 끝까지 별을 찾아볼게요." },
    { who: "Lyra", expr: "normal", text: "언덕에 올라 밤하늘을 들여다보자. (아래 ‘망원경 보기’를 눌러요)" },
  ],

  firstDiscovery: [
    { who: "망원경", text: "…드디어 깨어났어. 네가 찾아준 첫 별자리 덕분이야." },
    { who: "Lyra", expr: "surprised", text: "마, 망원경이 말을 했어!" },
    { who: "망원경", text: "별자리를 더 찾아줘. 모은 별에너지로 나를 키우면, 더 먼 우주를 보여줄게." },
    { who: "Lyra", expr: "smiling", text: "좋아. 우주의 끝까지, 함께 가보자!" },
  ],
};
