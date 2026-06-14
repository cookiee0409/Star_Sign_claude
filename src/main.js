/* ============================================================
   별빛 망원경 · 별자리 탐험 — 메인 오케스트레이터
   - 메뉴 / 픽셀 어드벤처 / 실제 하늘(우주) 화면 전환
   - 우주 화면은 Aladin Lite로 실제 천문 survey 이미지를 표시하고,
     RA/Dec(별빛 좌표) 입력 → IAU 별자리 영역 판정 → 중심 접근 게이지
     → 연결선/이름 오버레이 → 별에너지 흡수 연출 → 컬렉션 등록.
   ============================================================ */

import {
  getState, getStats, load, hasSave, newGame, isDiscovered,
  addEnergy, markDiscovered, setFlag, setLastView, advanceNight, setSurvey,
} from "./state/gameState.js";
import { CONSTELLATIONS } from "./data/constellations.js";
import { SURVEYS, telescopeAppearanceStage } from "./data/upgrades.js";
import { initScene, drawAdventure } from "./render/pixelArt.js";
import { preloadAssets } from "./assets/loader.js";
import { CharacterView } from "./ui/character.js";
import { runDialogue } from "./ui/dialogue.js";
import { SCRIPT } from "./data/script.js";
import { EnergyAbsorb, Meteor, drawLensFrame } from "./render/effects.js";
import {
  starToRaDec, raDecToStar, angularDistance, pointInPolygon,
  formatRA, formatDec, clamp,
} from "./sky/coords.js";
import * as Sky from "./sky/aladin.js";
import {
  el, clearUI, mount, toast, fadeTransition, showHUD, updateHUD,
} from "./ui/dom.js";
import { openUpgrade, openCollection, openSettings, openDiscovery } from "./ui/modals.js";
import { Sfx, unlockAudio, syncAmbient, stopAmbient } from "./audio/sound.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("scene-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.fx = document.getElementById("fx-canvas");
    this.fxCtx = this.fx.getContext("2d");
    this.aladinDiv = document.getElementById("aladin-lite-div");
    this.labelLayer = document.getElementById("label-layer");

    this.screen = "menu";
    this.time = 0;
    this.lastT = performance.now();

    this.skyReady = false;
    this.detection = { targetId: null, gauge: 0, locked: false };
    this.currentHintId = null;
    this.sequence = null;
    this.energy = new EnergyAbsorb();
    this.meteors = [];
    this.meteorTimer = 0;
    this.dim = 0;
    this.labels = new Map();
    this.saveViewTimer = 0;

    this.spaceRefs = {};

    preloadAssets();
    this.character = new CharacterView();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    const unlock = () => { unlockAudio(); window.removeEventListener("pointerdown", unlock); };
    window.addEventListener("pointerdown", unlock);
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    for (const c of [this.canvas, this.fx]) {
      c.width = this.w * dpr;
      c.height = this.h * dpr;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initScene(this.w, this.h);
  }

  _showLayers() {
    const space = this.screen === "space";
    this.canvas.classList.toggle("hidden", space);
    this.aladinDiv.classList.toggle("hidden", !space);
    this.fx.classList.toggle("hidden", !space);
    this.labelLayer.classList.toggle("hidden", !space);
    // 캐릭터는 어드벤처 화면에서만 표시
    if (this.character) {
      if (this.screen === "adventure") this.character.show();
      else this.character.hide();
    }
  }

  /* ============================================================ 루프 */
  loop(t) {
    const dt = Math.min(0.05, (t - this.lastT) / 1000);
    this.lastT = t;
    this.time = t;

    if (this.screen === "space") {
      this.fxCtx.clearRect(0, 0, this.w, this.h);
      if (this.skyReady) this._updateSpace(dt);
      drawLensFrame(this.fxCtx, this.w, this.h, t);
      this._drawMeteors(dt);
      this.energy.update(dt);
      this.energy.draw(this.fxCtx);
      if (this.dim > 0) {
        this.fxCtx.fillStyle = `rgba(2,2,10,${(this.dim * 0.5).toFixed(2)})`;
        this.fxCtx.fillRect(0, 0, this.w, this.h);
      }
      if (this.skyReady) this._updateLabels();
    } else {
      const stage = telescopeAppearanceStage(getStats().telescopeLevel);
      drawAdventure(this.ctx, this.w, this.h, t, stage);
    }
    requestAnimationFrame((tt) => this.loop(tt));
  }

  /* ============================================================ 메뉴 */
  showMenu() {
    this.screen = "menu";
    this._showLayers();
    showHUD(false);
    clearUI();
    const canContinue = hasSave();
    mount(el(".menu", {}, [
      el(".menu-title", { text: "별빛 망원경" }),
      el(".menu-sub", { text: "Lyra : The Stardust Gatherer" }),
      el(".menu-buttons", {}, [
        el(".btn.btn-primary", { text: "새 게임", onclick: () => { Sfx.click(); this._startNew(); } }),
        canContinue ? el(".btn", { text: "이어하기", onclick: () => { Sfx.click(); this._continue(); } }) : null,
        el(".btn", { text: "컬렉션", onclick: () => { Sfx.click(); openCollection(); } }),
        el(".btn", { text: "설정", onclick: () => { Sfx.click(); openSettings(() => this.showMenu()); } }),
      ]),
      el(".menu-footer", { text: "실제 하늘에서 별자리를 찾아 떠나는 탐험" }),
    ]));
  }

  _startNew() {
    if (hasSave() && !confirm("새 게임을 시작하면 기존 진행이 사라집니다. 계속할까요?")) return;
    newGame();
    this._enterAdventure(true);
  }
  _continue() { load(); this._enterAdventure(false); }

  async _enterAdventure(isNew) {
    await fadeTransition(() => { this.screen = "adventure"; this._showLayers(); this._buildAdventureUI(); });
    showHUD(true);
    this._refreshHUD();
    this.character.setState("idle");
    syncAmbient();
    if (isNew && !getState().flags.seenIntro) this._playIntro();
  }

  _refreshHUD() {
    const st = getState(), stats = getStats();
    updateHUD({ energy: st.starEnergy, night: st.night, telescopeLevel: stats.telescopeLevel });
  }

  /* ============================================================ 어드벤처 */
  _buildAdventureUI() {
    clearUI();
    mount(el(".action-bar", {}, [
      el(".btn.btn-primary", { text: "🔭 망원경 보기", onclick: () => { Sfx.click(); this.character.setState("observe"); this._enterSpace(); } }),
      el(".btn", { text: "⚙ 업그레이드", onclick: () => { Sfx.click(); openUpgrade(() => this._refreshHUD()); } }),
      el(".btn", { text: "✦ 컬렉션", onclick: () => { Sfx.click(); openCollection(); } }),
      el(".btn.btn-ghost", { text: "메뉴", onclick: () => { Sfx.click(); this._toMenu(); } }),
    ]));
  }

  async _toMenu() {
    await fadeTransition(() => { stopAmbient(); this.showMenu(); });
  }

  _playIntro() { this._runScript(SCRIPT.intro, () => setFlag("seenIntro", true)); }

  _runScript(lines, onDone) {
    runDialogue(lines, {
      onLine: (line) => {
        // 대사 표정에 맞춰 캐릭터 상태 전환(놀람만 별도 포즈)
        this.character.setState(line.expr === "surprised" ? "surprise" : "idle");
      },
      onDone: () => { this.character.setState("idle"); onDone && onDone(); },
    });
  }

  /** happy 포즈를 잠깐 보여준 뒤 idle로 복귀 */
  _lyraHappy(ms = 2600) {
    this.character.setState("happy");
    clearTimeout(this._happyT);
    this._happyT = setTimeout(() => {
      if (this.screen === "adventure") this.character.setState("idle");
    }, ms);
  }

  /* ============================================================ 우주(실제 하늘) */
  async _enterSpace() {
    await fadeTransition(() => { this.screen = "space"; this._showLayers(); this._buildSpaceUI(); });
    showHUD(true);
    this._ensureSky();
  }

  async _ensureSky() {
    const st = getState();
    const lv = st.lastView || { ra: 83.98, dec: -1.07, fov: 50 };
    const loading = el(".sky-loading", {}, [el(".spin"), el("div", { text: "실제 하늘을 불러오는 중…" })]);
    mount(loading);

    if (!window.A) {
      loading.querySelector("div").innerHTML =
        "하늘 데이터를 불러올 수 없습니다.<br>인터넷 연결을 확인하고 다시 시도하세요.";
      loading.querySelector(".spin")?.remove();
      return;
    }
    try {
      await Sky.initAladin({ ra: lv.ra, dec: lv.dec }, clamp(lv.fov || 50, getStats().minFov, getStats().maxFov));
      this.skyReady = true;
      Sky.setSurvey(st.survey || "P/DSS2/color");
      Sky.gotoRaDec(lv.ra, lv.dec);
      Sky.setFoV(clamp(lv.fov || 50, getStats().minFov, getStats().maxFov));
      Sky.restoreDiscovered(CONSTELLATIONS, st.discovered);
      this._buildLabels();
      loading.remove();
    } catch (e) {
      console.warn(e);
      loading.querySelector("div").textContent = "하늘 데이터를 불러오지 못했습니다: " + e.message;
      loading.querySelector(".spin")?.remove();
    }
  }

  _buildSpaceUI() {
    clearUI();
    const stats = getStats();

    const inX = el("input", { type: "number", min: "0", max: "1000" });
    const inY = el("input", { type: "number", min: "0", max: "1000" });
    [inX, inY].forEach((i) => i.addEventListener("input", () => Sfx.coordType()));
    const go = () => {
      const sx = clamp(parseFloat(inX.value) || 0, 0, 1000);
      const sy = clamp(parseFloat(inY.value) || 0, 0, 1000);
      const { ra, dec } = starToRaDec(sx, sy);
      Sky.gotoRaDec(ra, dec);
      Sfx.move();
    };
    const onEnter = (e) => { if (e.key === "Enter") go(); };
    inX.addEventListener("keydown", onEnter);
    inY.addEventListener("keydown", onEnter);

    const realReadout = el(".coord-real");
    const detectFill = el(".detect-fill");
    const detectPct = el("span", { text: "0%" });
    const detectMsg = el(".detect-msg.dim", { text: "별자리 영역을 탐색하세요" });
    const observeBtn = el(".btn.btn-primary", { text: "관측 시작", disabled: "true", onclick: () => this._tryObserve() });

    const coordPanel = el(".coord-panel", {}, [
      el("h3", { text: "◈ 별빛 좌표 입력" }),
      el(".coord-row", {}, [el("label", { text: "별빛 X" }), inX]),
      el(".coord-row", {}, [el("label", { text: "별빛 Y" }), inY]),
      el(".coord-note", { html: "X·Y(0~1000)는 실제 적경·적위로 환산됩니다.<br>화면을 드래그/휠로 탐색할 수도 있어요." }),
      el(".btn.btn-small", { text: "▶ 좌표로 이동", onclick: go, style: { width: "100%" } }),
      realReadout,
      el(".detect-wrap", {}, [
        el(".detect-label", {}, [el("span", { text: "별빛 반응" }), detectPct]),
        el(".detect-bar", {}, [detectFill]),
        detectMsg,
      ]),
    ]);

    const topRight = el(".space-topright", {}, [
      el(".zoom-controls", {}, [
        el(".btn.zoom-btn", { text: "+", onclick: () => this._zoom(1 / 1.6) }),
        el(".btn.zoom-btn", { text: "−", onclick: () => this._zoom(1.6) }),
      ]),
      el(".pos-readout", {}, [document.createTextNode("FOV "), el("b", { id: "fov-readout", text: "—" }), document.createTextNode("°")]),
    ]);

    // 파장(survey) 선택
    const surveyPanel = el(".survey-panel", {}, [el("h4", { text: "🌈 관측 파장" })]);
    this.surveyOpts = [];
    SURVEYS.forEach((s, i) => {
      const unlocked = i < stats.surveyCount;
      const opt = el(`.survey-opt${unlocked ? "" : ".locked"}`, {
        onclick: () => { if (unlocked) { Sky.setSurvey(s.id); setSurvey(s.id); this._markSurvey(s.id); Sfx.click(); } },
      }, [el(".dot"), el("span", { text: unlocked ? s.label : `${s.label} 🔒` })]);
      surveyPanel.appendChild(opt);
      this.surveyOpts.push({ id: s.id, el: opt, unlocked });
    });

    const bottom = el(".space-bottom", {}, [
      observeBtn,
      el(".btn.btn-ghost", { text: "◂ 망원경에서 눈 떼기", onclick: () => { Sfx.click(); this._exitSpace(); } }),
    ]);

    mount(el(".space-ui", {}, [coordPanel, topRight, surveyPanel, bottom]));
    this.spaceRefs = { inX, inY, realReadout, detectFill, detectPct, detectMsg, observeBtn };
    this._markSurvey(getState().survey || "P/DSS2/color");
  }

  _markSurvey(id) {
    for (const o of this.surveyOpts || []) o.el.classList.toggle("active", o.id === id && o.unlocked);
  }

  _zoom(factor) {
    if (!this.skyReady) return;
    const stats = getStats();
    const fov = clamp(Sky.getFov() * factor, stats.minFov, stats.maxFov);
    Sky.setFoV(fov);
    Sfx.click();
  }

  async _exitSpace() {
    if (this.skyReady) {
      const [ra, dec] = Sky.getRaDec();
      setLastView(ra, dec, Sky.getFov());
    }
    Sky.clearHint();
    this.currentHintId = null;
    await fadeTransition(() => { this.screen = "adventure"; this._showLayers(); this._buildAdventureUI(); });
    this._refreshHUD();
    if (this.pendingHappy) { this.pendingHappy = false; this._lyraHappy(); }
    else this.character.setState("idle");
    if (this.pendingDialogue) { const d = this.pendingDialogue; this.pendingDialogue = null; this._runScript(d); }
  }

  /* ---------- 우주 업데이트(감지/판정) ---------- */
  _updateSpace(dt) {
    // 신비 현상(유성)
    this.meteorTimer -= dt;
    if (this.meteorTimer <= 0) {
      this.meteorTimer = 6 + Math.random() * 8;
      if (Math.random() < 0.4) this.meteors.push(new Meteor(this.w, this.h));
    }

    // 좌표 readout + 입력칸 동기화
    const [ra, dec] = Sky.getRaDec();
    const fov = Sky.getFov();
    const { sx, sy } = raDecToStar(ra, dec);
    const r = this.spaceRefs;
    if (r.realReadout) {
      r.realReadout.innerHTML =
        `별빛 좌표  X <b>${sx}</b>  Y <b>${sy}</b><br>RA <b>${formatRA(ra)}</b>  Dec <b>${formatDec(dec)}</b>`;
    }
    if (document.activeElement !== r.inX) r.inX.value = sx;
    if (document.activeElement !== r.inY) r.inY.value = sy;
    const fovEl = document.getElementById("fov-readout");
    if (fovEl) fovEl.textContent = fov >= 1 ? fov.toFixed(1) : fov.toFixed(2);

    // 주기적 저장
    this.saveViewTimer -= dt;
    if (this.saveViewTimer <= 0) { this.saveViewTimer = 2; setLastView(ra, dec, fov); }

    if (this.sequence) { this._updateSequence(dt); return; }

    const stats = getStats();
    // 1) IAU 별자리 영역 판정 — 현재 중심이 어느 별자리 경계 안인가
    let inside = null, insideDist = Infinity;
    for (const con of CONSTELLATIONS) {
      if (pointInPolygon(ra, dec, con.boundary)) {
        const d = angularDistance(ra, dec, con.center.ra, con.center.dec);
        if (d < insideDist) { insideDist = d; inside = con; }
      }
    }

    if (!inside || isDiscovered(inside.id)) {
      this._clearHint();
      this.detection = { targetId: null, gauge: 0, locked: false };
      this._setGauge(0, inside && isDiscovered(inside.id)
        ? `이미 발견한 별자리: ${inside.name}` : "별자리 영역을 탐색하세요", "dim");
      return;
    }

    // 2) 레벨 게이팅
    if (inside.requiredLevel > stats.telescopeLevel) {
      this._clearHint();
      this.detection = { targetId: null, gauge: 0, locked: false };
      this._setGauge(0, `『${inside.name}』 영역 — 망원경 레벨 ${inside.requiredLevel} 필요`, "warn");
      return;
    }

    // 3) 힌트 표시 + 중심 접근 게이지
    if (this.currentHintId !== inside.id) {
      Sky.showHint(inside);
      this.currentHintId = inside.id;
      this._ensureHintLabel(inside);
      Sfx.detect();
    }
    const gauge = clamp(1 - insideDist / stats.detectRadiusDeg, 0, 1);
    const locked = insideDist < stats.lockRadiusDeg;
    this.detection = { targetId: inside.id, gauge, locked };
    if (locked) this._setGauge(gauge, `『${inside.name}』 관측 준비 완료 — 관측 시작!`, "ok");
    else this._setGauge(gauge, `『${inside.name}』 영역 — 중심으로 더 가까이 (${insideDist.toFixed(1)}°)`, "ok");
    if (Math.random() < 0.04 && gauge > 0.4) Sfx.twinkle();
  }

  _setGauge(g, msg, cls) {
    const r = this.spaceRefs;
    if (!r.detectFill) return;
    r.detectFill.style.width = `${Math.round(g * 100)}%`;
    r.detectPct.textContent = `${Math.round(g * 100)}%`;
    r.detectMsg.textContent = msg;
    r.detectMsg.className = `detect-msg ${cls}`;
    r.observeBtn.disabled = !this.detection.locked;
  }

  _clearHint() {
    if (this.currentHintId) {
      Sky.clearHint();
      const lbl = this.labels.get("__hint__");
      if (lbl) { lbl.el.remove(); this.labels.delete("__hint__"); }
      this.currentHintId = null;
    }
  }

  /* ---------- 관측(발견) 시퀀스 ---------- */
  _tryObserve() {
    if (this.sequence || !this.detection.locked) return;
    const con = CONSTELLATIONS.find((c) => c.id === this.detection.targetId);
    if (!con) return;
    Sfx.discover();
    this.spaceRefs.observeBtn.disabled = true;
    this.sequence = { phase: "connect", timer: 0, con };
  }

  _updateSequence(dt) {
    const seq = this.sequence;
    seq.timer += dt;
    if (seq.phase === "connect") {
      this.dim = Math.min(0.6, seq.timer / 1.2);
      if (seq.timer >= 1.2) {
        Sky.addDiscovered(seq.con);     // 밝은 연결선 상시 표시
        const p = Sky.world2pix(seq.con.center.ra, seq.con.center.dec);
        const start = p ? { x: p[0], y: p[1] } : { x: this.w / 2, y: this.h / 2 };
        this.energy.start(start.x, start.y, this.w / 2, this.h / 2, 120);
        Sfx.absorb();
        seq.phase = "absorb";
        seq.timer = 0;
      }
    } else if (seq.phase === "absorb") {
      this.dim = Math.max(0, 0.6 - seq.timer / 1.8);
      if (this.energy.done && seq.timer > 0.6) {
        this._finishDiscovery(seq.con);
        this.dim = 0;
        this.sequence = null;
      }
    }
  }

  _finishDiscovery(con) {
    const firstEver = !getState().flags.firstDiscovery;
    const firstThis = !isDiscovered(con.id);
    const [ra, dec] = Sky.getRaDec();
    const gained = con.energyReward + (firstThis ? Math.round(con.energyReward * 0.2) : 0);

    markDiscovered(con.id, ra, dec);
    addEnergy(gained);
    this._clearHint();
    this._buildLabels();
    this.detection = { targetId: null, gauge: 0, locked: false };
    this._refreshHUD();

    openDiscovery(con, gained, { firstBonus: firstThis });

    this.pendingHappy = true;
    if (firstEver) {
      setFlag("firstDiscovery", true);
      this.pendingDialogue = SCRIPT.firstDiscovery;
    }
    advanceNight();
    this._refreshHUD();
  }

  /* ---------- 별자리 이름 라벨(하늘 위) ---------- */
  _buildLabels() {
    // 발견한 별자리 라벨 재구성 (힌트 라벨은 유지)
    for (const [id, l] of this.labels) {
      if (id === "__hint__") continue;
      l.el.remove(); this.labels.delete(id);
    }
    for (const con of CONSTELLATIONS) {
      if (!isDiscovered(con.id)) continue;
      const elL = el(".sky-label.show", { text: con.name });
      this.labelLayer.appendChild(elL);
      this.labels.set(con.id, { el: elL, con });
    }
  }

  _ensureHintLabel(con) {
    const prev = this.labels.get("__hint__");
    if (prev) prev.el.remove();
    const elL = el(".sky-label.hint.show", { text: con.name });
    this.labelLayer.appendChild(elL);
    this.labels.set("__hint__", { el: elL, con });
  }

  _updateLabels() {
    for (const [, l] of this.labels) {
      const p = Sky.world2pix(l.con.center.ra, l.con.center.dec);
      if (p && p[0] >= 0 && p[0] <= this.w && p[1] >= 0 && p[1] <= this.h) {
        l.el.style.left = p[0] + "px";
        l.el.style.top = (p[1] - 44) + "px";
        l.el.style.display = "block";
      } else {
        l.el.style.display = "none";
      }
    }
  }

  _drawMeteors(dt) {
    for (const m of this.meteors) { m.update(dt); m.draw(this.fxCtx); }
    this.meteors = this.meteors.filter((m) => !m.dead && m.y < this.h + 40);
  }
}

/* ---------- 부팅 ---------- */
window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  game.showMenu();
  window.__game = game;
});
