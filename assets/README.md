# assets — Lyra 정지 PNG + 이펙트

캐릭터는 **프레임 애니메이션(GIF/스프라이트 시트)을 쓰지 않고**, 상태별 **정지 PNG**를
교체하며 움직임·반짝임은 코드(CSS/Canvas)로 구현합니다.
모든 이미지는 **선택**입니다. 없으면 절차적 렌더링으로 폴백하므로 게임은 지금도 동작합니다.
**파일을 넣은 뒤 새로고침**하면 적용됩니다.

## 1) 캐릭터 상태 PNG — `assets/characters/lyra/`
배경 투명 PNG, 인물 전신, 발끝이 아래 중앙 권장.

| 파일 | 상태 | 첨부 이미지 |
|------|------|-------------|
| `lyra_idle.png`     | 기본 대기 | 정면 기본 자세 |
| `lyra_observe.png`  | 망원경 관측 | 망원경 들여다보는 자세 |
| `lyra_happy.png`    | 발견 후 기쁨 | 손가락으로 가리키며 웃는 자세 |
| `lyra_surprise.png` | 놀람(선택) | 두 손 모으고 놀란 자세 |

> 코드에서 상태에 따라 PNG를 교체합니다. idle은 CSS로 위아래 둥실(2~6px),
> 가슴 별 glow, 별가루 파티클이 적용되고, observe는 렌즈 pulse glow,
> happy는 pop 모션 + 별에너지 흡수 파티클이 표시됩니다. 좌우 반전은 `scaleX(-1)`.

## 2) 이펙트 PNG(선택) — `assets/effects/`
없으면 CSS 그라데이션으로 폴백합니다.

| 파일 | 용도 |
|------|------|
| `stardust_particle.png` | 별가루 파티클 |
| `chest_star_glow.png`   | 가슴 별 glow |
| `telescope_lens_glow.png` | 관측 렌즈 glow |
| `energy_orb.png`        | 별에너지 흡수 입자 |
| `energy_trail.png`      | 에너지 꼬리(확장용) |

## 3) 배경(선택) — `assets/bg-hill.png`
어드벤처/메뉴 배경. 없으면 절차적 밤 언덕 장면 사용.

## 4) 대화 초상화(선택) — `assets/portraits/`
`smiling/normal/serious/frowning/sad/surprised.png`. 없으면 절차적 초상화.

> 경로/파일명은 `src/assets/loader.js`의 `IMAGES`에서 바꿀 수 있습니다.
> 캐릭터 상태 로직은 `src/ui/character.js`, 상태 전환은 `src/main.js`.
