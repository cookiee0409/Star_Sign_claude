# assets (선택) — Lyra 디지털 에셋

이 폴더에 PNG를 넣으면 게임이 **자동으로 그림/애니메이션을 교체**합니다.
파일이 없으면 절차적 픽셀 렌더링으로 폴백하므로, 게임은 지금도 그대로 동작합니다.
**파일을 넣은 뒤 브라우저를 새로고침**하면 적용됩니다.

> 첨부해주신 에셋 시트(정/후/좌/우, 애니메이션, 표정)는 라벨·그리드가 포함된 “합본”입니다.
> 게임에 쓰려면 아래 규격대로 **개별 파일로 잘라서** 저장해 주세요.

## 1) 배경 (선택)
| 파일 | 용도 |
|------|------|
| `assets/bg-hill.png` | 어드벤처/메뉴 배경. 가로로 긴 이미지, **아빠 캐릭터 없는 버전** 권장 |

## 2) 캐릭터 애니메이션 — `assets/lyra/`
각 파일은 **가로 스트립**입니다. 프레임이 가로로 같은 너비로 N등분되어 있어야 합니다.
배경은 투명(알파), 인물은 프레임마다 같은 위치/크기, **발끝이 프레임 하단 중앙**.

| 파일 | 프레임 수 | 용도 |
|------|:---:|------|
| `assets/lyra/idle.png`      | 4 | 대기 |
| `assets/lyra/walk.png`      | 5 | 걷기 (오른쪽 기준 — 왼쪽은 자동 반전) |
| `assets/lyra/observe.png`   | 5 | 관찰(망원경) |
| `assets/lyra/absorb.png`    | 4 | 별에너지 흡수 |
| `assets/lyra/surprise.png`  | 4 | 놀람 |
| `assets/lyra/discovery.png` | 4 | 발견 |

예: `walk.png`가 5프레임이면 가로 폭 = 한 프레임 폭 × 5.

### 정지 포즈 (선택)
`assets/lyra/front.png` · `back.png` · `left.png` · `right.png` — 현재 로직에선 필수 아님(확장용).

## 3) 대화 초상화 — `assets/portraits/`
대화창 왼쪽에 표시됩니다. 정사각형 권장(예: 256×256).

| 파일 | 표정 |
|------|------|
| `assets/portraits/smiling.png`   | 웃는 표정 |
| `assets/portraits/normal.png`    | 평범한 표정 |
| `assets/portraits/serious.png`   | 진지한 표정 |
| `assets/portraits/frowning.png`  | 찡그린 표정 |
| `assets/portraits/sad.png`       | 슬픈 표정 |
| `assets/portraits/surprised.png` | 놀란 표정 |

> 파일명/프레임 수를 바꾸려면 `src/assets/loader.js`의 `IMAGES`·`SPRITES`,
> 그리고 `src/render/sprites.js`의 `CLIPS`를 함께 수정하면 됩니다.
