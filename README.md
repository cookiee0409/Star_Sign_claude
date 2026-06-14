# 별빛 망원경 · 별자리 탐험 🔭✨

우주와 별자리를 좋아하는 작은 소녀가 아버지에게 선물 받은 **마법의 망원경**으로
**실제 밤하늘**을 탐험하는 웹 게임입니다.

망원경에 **별빛 좌표(실제 적경·적위로 환산)** 를 입력해 실제 하늘 이미지를 불러오고,
**IAU 별자리 영역**에 들어가 대표 별에 다가가면 별자리가 발견됩니다.
발견한 별자리에서 흘러나오는 **별에너지**로 망원경을 성장시켜 더 깊은 우주를 봅니다.

> 좌표계는 게임 전용 가짜 좌표가 아니라 **실제 천문 좌표계(RA/Dec/FOV)** 와 연결됩니다.
> 내부적으로 RA·Dec·FOV를 사용하고, 사용자에게는 “별빛 좌표”라는 게임식 UI로 보여줍니다.

### 🎨 주인공 & 분위기
- 주인공 **Lyra: The Stardust Gatherer** — 은빛 머리·별 머리핀·별자리 망토(후드)·작은 별가루 날개·마법 망원경.
  표정(미소/호기심/생각/잠)은 대사 흐름에 따라 바뀝니다.
- 배경은 레퍼런스 컨셉(언덕·은하수·텐트·랜턴)을 픽셀 아트로 재현했습니다. *(아빠 캐릭터는 사용하지 않음)*
- **직접 그린 PNG로 교체**하려면 `assets/bg-hill.png`(배경)·`assets/lyra.png`(인물)를 넣으세요. 없으면 절차적 렌더링을 사용합니다. → [assets/README.md](assets/README.md)
- **사운드**: WebAudio로 합성한 오르골풍 자장가 BGM + 효과음(클릭/좌표 입력/반짝임/발견/별에너지 흡수/업그레이드). 오디오 파일 불필요. 설정에서 on/off·음량 조절.

---

## 🌌 실제 천문 데이터 연동

- **Aladin Lite v3** 로 실제 천문 survey(HiPS) 이미지를 망원경 화면에 표시합니다.
  좌표를 입력하면 해당 **RA/Dec** 위치의 실제 하늘 이미지를 불러옵니다.
- **별자리 판정**은 단순히 좌표가 박스 안에 드는 것이 아니라,
  1) 입력 좌표가 **IAU 별자리 영역(경계 다각형)** 안에 있는지 판정하고,
  2) 이후 별자리 **대표 별/중심 좌표**에 가까워질수록 **별빛 반응 게이지**가 차오릅니다.
  3) 일정 각거리 이내로 접근하면 실제 하늘 이미지 위에 **연결선과 이름을 오버레이**하고 발견 연출을 실행합니다.
- **다파장 관측**: 업그레이드로 가시광(DSS) → 근적외선(2MASS) → 적외선(WISE) → X선(ROSAT)
  survey를 해금해, “망원경이 성장할수록 우주를 다르게 본다”를 구현했습니다.

> ⚠️ **인터넷 연결이 필요합니다.** 실제 하늘 이미지는 CDS(alasky.cds.unistra.fr) 서버의
> HiPS 타일을 실시간으로 불러옵니다. (향후 NASA SkyView / IRSA Cutouts로 정적 이미지
> 생성·캐싱하도록 확장 가능 — 아래 *확장 방법* 참고)

---

## 🎮 실행 방법

별도 설치(npm install)가 필요 없습니다. **Node.js 18 이상**만 있으면 됩니다.

```bash
node server.mjs      # 또는 npm start
```

브라우저에서 **http://localhost:5173** 접속. (포트 변경: `PORT=8080 node server.mjs`)

> ES 모듈을 사용하므로 `index.html`을 더블클릭(`file://`)하면 동작하지 않습니다. 반드시 위 서버로 실행하세요.

---

## ☁️ 배포 (GitHub + Vercel)

빌드 단계가 없는 **순수 정적 사이트**라 Vercel 무설정 배포로 충분합니다. (`vercel.json`에 `outputDirectory: "."`)

```bash
# 1) GitHub에 올리기
git init && git add -A && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<USER>/star-explorer.git
git push -u origin main

# 2) Vercel 배포 (둘 중 하나)
#  A. 대시보드: vercel.com → Add New → Project → 위 GitHub 저장소 Import → Deploy
#  B. CLI:  npm i -g vercel && vercel --prod
```

> `server.mjs`는 **로컬 개발용**입니다. Vercel은 루트의 정적 파일을 그대로 서빙하므로 별도 빌드/서버 설정이 필요 없습니다.
> 우주 화면은 런타임에 CDS HiPS 타일을 불러오므로, 배포 후에도 **인터넷 연결**이 필요합니다.

---

## 🕹️ 플레이 방법

1. **새 게임** → 소녀의 방/마당 장면에서 도입 대사가 흐릅니다.
2. **🔭 망원경 보기** → 실제 하늘(Aladin) 화면으로 전환됩니다.
3. 좌측 패널에 **별빛 X / Y(0~1000)** 를 입력하고 **좌표로 이동**(또는 화면 **드래그/휠**)으로 탐색.
   - 입력값은 실제 **RA(적경)·Dec(적위)** 로 환산되어 패널에 함께 표시됩니다.
4. 별자리 **영역**에 들어가면 별 마커와 희미한 연결선 힌트가 뜨고, **별빛 반응 게이지**가 차오릅니다.
5. 대표 별 **중심에 가까워져** 게이지가 충분히 차면 **관측 시작** 버튼이 활성화됩니다.
6. 관측하면 연결선과 이름이 밝게 오버레이되고, **별에너지가 망원경으로 흡수**된 뒤 컬렉션에 등록됩니다.
7. 모은 별에너지로 **⚙ 업그레이드** → 관측 범위·배율·감지·다파장을 확장합니다.
8. 진행 상황은 **자동 저장**됩니다(localStorage). 언제든 **이어하기** 가능.

### 첫 별자리 힌트
시작 위치가 **오리온자리** 중심(별빛 X≈233, Y≈494 / RA 05h36m, Dec −01°)입니다. 바로 **관측 시작**을 눌러 보세요.

### MVP 대표 별자리 5개 (실제 좌표)
| 별자리 | 필요 레벨 | 대표 별 |
|--------|:---:|--------|
| 오리온자리 (Ori) | 1 | 베텔게우스 · 삼태성 · 리겔 |
| 큰곰자리 (UMa) | 1 | 북두칠성(두베~알카이드) |
| 카시오페이아자리 (Cas) | 2 | W (카프~세긴, 적경 0h 가로지름) |
| 백조자리 (Cyg) | 3 | 데네브 · 사드르 · 알비레오 |
| 사자자리 (Leo) | 3 | 레굴루스 · 데네볼라 · 낫 모양 |

---

## 📁 파일 구조

```
Star-explorer/
├── index.html              # 진입점 (Aladin 로드 + 캔버스 + UI 레이어)
├── server.mjs              # 의존성 없는 초경량 정적 서버
├── package.json
├── styles/main.css         # 전역 스타일 / UI / 모달 / 우주화면 레이어
└── src/
    ├── main.js             # ★ 오케스트레이터: 화면 전환·루프·좌표/판정/발견 로직
    ├── data/
    │   ├── constellations.js   # 별자리 5개: 실제 RA/Dec 별·연결선·IAU 경계·중심
    │   └── upgrades.js         # 업그레이드 + 스탯(FOV/감지/확정/survey) + 외형 단계
    ├── state/
    │   └── gameState.js        # 상태 + localStorage 저장/불러오기
    ├── sky/
    │   ├── coords.js           # RA/Dec ↔ 별빛좌표, 구면 각거리, IAU 영역 판정, 투영
    │   └── aladin.js           # Aladin Lite 래퍼(이동·FOV·survey·오버레이·world2pix)
    ├── render/
    │   ├── pixelArt.js         # 픽셀 어드벤처 화면(소녀·성장 망원경·밤풍경·파티클)
    │   └── effects.js          # 렌즈 테두리·별에너지 흡수 파티클·유성
    ├── audio/sound.js          # WebAudio 합성 배경음 + 효과음(오디오 파일 불필요)
    └── ui/
        ├── dom.js              # DOM 헬퍼(el/모달/토스트/페이드/HUD)
        └── modals.js           # 발견결과·업그레이드·컬렉션·설정 모달
```

---

## 🧩 주요 컴포넌트

| 모듈 | 역할 |
|------|------|
| **main.js / `Game`** | 화면 상태기(`menu`/`adventure`/`space`), 게임 루프. 우주 화면에서 매 프레임 Aladin 중심 좌표를 읽어 **IAU 영역 판정 → 중심 거리 게이지 → 레벨 게이팅 → 발견 시퀀스**(연결 → 에너지 흡수 → 보상)를 처리 |
| **sky/coords.js** | `starToRaDec`/`raDecToStar`(별빛↔실좌표), `angularDistance`(구면 각거리), `pointInPolygon`(적경 0h 가로지름 안전 처리), `formatRA/Dec`, `projectStars`(썸네일 투영) |
| **sky/aladin.js** | Aladin Lite 초기화·`gotoRaDec`·`setFoV`·`setSurvey`·`world2pix` + 별자리 연결선/별 마커 오버레이(힌트·발견·복원) 관리 |
| **data/constellations.js** | 5개 별자리의 **실제 밝은 별 RA/Dec**, 아스테리즘 `lines`, IAU **경계 다각형**, 중심, 희귀도, 필요 레벨, 이야기 |
| **data/upgrades.js** | 6종 업그레이드(범위·배율·렌즈·초점·감응·다파장). `computeStats()`가 `maxFov/minFov/detectRadiusDeg/lockRadiusDeg/surveyCount/telescopeLevel` 산출. `SURVEYS`에 파장별 HiPS 정의 |
| **render/pixelArt.js** | 밀도 높은 도트 밤풍경 + **단계별로 변하는 망원경**(나무→은빛→황금→별빛→문양→떠다니는 렌즈) |
| **render/effects.js** | 렌즈 테두리(접안부), `EnergyAbsorb`(나선 흡수 파티클), `Meteor` |
| **ui/modals.js** | 발견 결과, 업그레이드(외형 미리보기), 컬렉션(미발견 실루엣), 설정 |

---

## 🚀 확장 방법

데이터/천문/렌더/상태/UI가 분리되어 있어 확장이 쉽습니다.

- **별자리 추가**: `src/data/constellations.js`에 객체 하나 추가 — 실제 별 RA/Dec, `lines`, `boundary`(IAU 경계), `center`만 채우면 탐험·판정·컬렉션·오버레이에 자동 반영됩니다.
  - 정밀 IAU 경계가 필요하면 `boundary`를 직사각형 근사 대신 실제 경계 다각형(예: Davenport의 constellation boundaries 데이터)으로 교체하면 됩니다.
- **정적 이미지/캐싱**: 현재는 Aladin이 HiPS 타일을 실시간으로 불러옵니다.
  특정 RA/Dec의 정적 관측 이미지가 필요하면 **NASA SkyView** 또는 **IRSA Cutouts** API로
  cutout 이미지를 생성·캐싱해 표시하는 레이어를 `src/sky/`에 추가하면 됩니다.
  (`aladin.js`와 동일한 인터페이스로 교체 가능하도록 설계)
- **파장 추가**: `data/upgrades.js`의 `SURVEYS` 배열에 HiPS ID를 추가하면 전파(NVSS) 등으로 확장됩니다.
- **새 지역/스토리/업적**: `render/pixelArt.js` 장면 함수, `Game._showDialogue`, `state.flags`로 확장.

---

## ✅ 검증 (실제 동작 확인됨)

- 실제 DSS 하늘 타일 로딩(CDS), 메뉴 → 도입 → 망원경 전환
- 별빛 좌표 ↔ RA/Dec 환산 (오리온 중심 = RA 05h36m / Dec −01°)
- IAU 영역 판정(카시오페이아 0h 가로지름 포함), 중심 접근 게이지, 레벨 게이팅
- 발견 시퀀스(연결선 오버레이 + 이름 라벨 + 별에너지 흡수) → 컬렉션 등록 → 첫 발견 보너스
- 다파장 해금(DSS→2MASS→WISE→ROSAT) 및 survey 전환
- localStorage 자동 저장/복원

즐거운 별빛 탐험 되세요. 🌙
