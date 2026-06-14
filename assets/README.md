# assets — Lyra 디지털 에셋

게임은 이 폴더의 에셋을 **데이터 주도(manifest-driven)** 방식으로 불러옵니다.
파일이 없으면 절차적 픽셀 렌더링으로 폴백하므로, 일부만 넣어도 동작합니다.
**파일을 넣거나 바꾼 뒤 브라우저를 새로고침**하면 적용됩니다.

## 1) Lyra 애니메이션 (포함됨) — `assets/lyra/`
`lyra_asset_pack`에서 가져온 정식 에셋입니다.

```
assets/lyra/
├── lyra_basic_animations_160x160.json   # ★ 매니페스트(프레임/FPS/loop/anchor/strip 경로)
└── spritesheets/
    ├── lyra_idle_strip_160x160.png      # 4프레임
    ├── lyra_walk_strip_160x160.png      # 5프레임
    ├── lyra_observe_strip_160x160.png   # 5프레임
    ├── lyra_absorb_strip_160x160.png    # 4프레임
    ├── lyra_surprise_strip_160x160.png  # 4프레임
    └── lyra_discover_strip_160x160.png  # 4프레임
```

- 프레임 크기 **160×160**, anchor **x=0.5, y=0.8875**(발끝 기준).
- 로더(`src/assets/loader.js`)가 JSON을 읽어 각 애니메이션의 strip·프레임 수·FPS·loop·anchor를 자동 구성합니다.
- 애니메이션 이름: `idle / walk / observe / absorb / surprise / discover`.
- **다른 에셋으로 교체**: 같은 폴더 구조와 JSON 형식만 맞추면 코드 수정 없이 교체됩니다.
  (프레임 수/FPS만 바꿀 땐 JSON만 수정)

## 2) 대화 초상화 (선택) — `assets/portraits/`
없으면 절차적 초상화로 폴백합니다. 정사각형 권장(예: 256×256).

| 파일 | 표정 |
|------|------|
| `smiling.png` / `normal.png` / `serious.png` / `frowning.png` / `sad.png` / `surprised.png` | 대화창 표정 |

## 3) 배경 (선택) — `assets/bg-hill.png`
어드벤처/메뉴 배경. 가로로 긴 이미지, 아빠 캐릭터 없는 버전 권장. 없으면 절차적 밤 언덕 장면 사용.

> 경로/이름을 바꾸려면 `src/assets/loader.js`의 `LYRA_MANIFEST`·`IMAGES`를 수정하세요.
