/* ============================================================
   모달 UI: 발견 결과 / 업그레이드 / 컬렉션 / 설정
   ============================================================ */

import { el, openModal, toast, updateHUD } from "./dom.js";
import {
  getState, getStats, isDiscovered, discoveredCount,
  spendEnergy, applyUpgrade, setSetting, resetSave,
} from "../state/gameState.js";
import { CONSTELLATIONS, RARITY_INFO } from "../data/constellations.js";
import { UPGRADES, upgradeCost, telescopeAppearanceStage, APPEARANCE_NAMES } from "../data/upgrades.js";
import { drawTelescopePreview } from "../render/pixelArt.js";
import { Sfx, setVolume, syncAmbient } from "../audio/sound.js";
import { projectStars, formatRA, formatDec } from "../sky/coords.js";

/* ---------- 별자리 썸네일 그리기 (실제 별 배치를 평면 투영) ---------- */
export function drawConstellationThumb(canvas, con, { discovered = true, glow = false } = {}) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const pts2d = projectStars(con); // [-48,48] 정규화
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const s of pts2d) {
    minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
    minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y);
  }
  const pad = 20;
  const bw = (maxX - minX) || 1, bh = (maxY - minY) || 1;
  const scale = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
  const cx = w / 2 - ((minX + maxX) / 2) * scale;
  const cy = h / 2 - ((minY + maxY) / 2) * scale;
  const pt = (s) => ({ x: cx + s.x * scale, y: cy + s.y * scale });

  if (discovered) {
    // 아스테리즘 연결선
    ctx.strokeStyle = glow ? "rgba(143,211,255,0.95)" : "rgba(143,211,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#8fd3ff"; ctx.shadowBlur = glow ? 10 : 4;
    ctx.beginPath();
    for (const [i, j] of con.lines) {
      const a = pt(pts2d[i]), b = pt(pts2d[j]);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    // 별
    for (const s of pts2d) {
      const p = pt(s);
      ctx.fillStyle = "rgba(253,246,227,0.35)";
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      ctx.fillStyle = "#fff7e0";
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
  } else {
    for (const s of pts2d) {
      const p = pt(s);
      ctx.fillStyle = "rgba(120,120,150,0.4)";
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    ctx.fillStyle = "rgba(150,150,180,0.5)";
    ctx.font = "28px monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("?", w / 2, h / 2);
  }
}

/* ---------- 발견 결과 모달 ---------- */
export function openDiscovery(con, energyGained, { firstBonus = false } = {}) {
  const canvas = el("canvas");
  canvas.width = 220; canvas.height = 180;
  const rarity = RARITY_INFO[con.rarity];

  const content = el(".modal.discovery-modal", {}, [
    el(".discovery-name", { text: con.name }),
    el(`.discovery-rarity.${rarity.cls}`, { text: rarity.label }),
    el(".discovery-canvas-wrap", {}, [canvas]),
    el(".discovery-desc", { text: con.description }),
    el(".discovery-story", { text: con.story }),
    el(".discovery-energy", {
      html: `✦ +${energyGained} 별에너지${firstBonus ? " <small style='color:var(--gold)'>(첫 발견 보너스!)</small>" : ""}`,
    }),
    el(".btn.btn-primary", { text: "컬렉션에 등록", onclick: () => { Sfx.click(); close(); } }),
  ]);
  const close = openModal(content, { closeOnBackdrop: false });

  // 썸네일 점등 애니메이션
  let p = 0;
  const anim = () => {
    if (!document.body.contains(canvas)) return;
    p = Math.min(1, p + 0.04);
    drawConstellationThumb(canvas, con, { discovered: p > 0.3, glow: true });
    if (p < 1) requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);
}

/* ---------- 업그레이드 모달 ---------- */
export function openUpgrade(onChange) {
  const preview = el("canvas");
  preview.width = 260; preview.height = 180;
  preview.style.width = "100%";
  preview.style.borderRadius = "10px";

  const energyLabel = el(".upgrade-energy");
  const list = el(".upgrade-list");
  const stageName = el("div", { style: { textAlign: "center", fontSize: "13px", color: "var(--gold-soft)", marginTop: "6px" } });

  function refresh() {
    const st = getState();
    const stats = getStats();
    energyLabel.innerHTML = `보유 별에너지 <b style="color:var(--energy)">✦ ${Math.round(st.starEnergy)}</b>`;
    stageName.textContent = `현재 외형: ${APPEARANCE_NAMES[telescopeAppearanceStage(stats.telescopeLevel)]} (Lv.${stats.telescopeLevel})`;

    list.innerHTML = "";
    for (const up of UPGRADES) {
      const lvl = st.upgradeLevels[up.id] || 0;
      const maxed = lvl >= up.maxLevel;
      const cost = maxed ? 0 : upgradeCost(up, lvl);
      const canBuy = !maxed && st.starEnergy >= cost;

      const buyArea = maxed
        ? el(".upgrade-maxed", { text: "MAX" })
        : el(".btn.btn-small.btn-primary.upgrade-buy", {
            text: `강화`,
            disabled: canBuy ? null : "true",
            onclick: () => {
              if (spendEnergy(cost)) {
                applyUpgrade(up.id);
                Sfx.upgrade();
                toast(`${up.name} 강화! (Lv.${lvl + 1})`);
                refresh();
                drawPreview();
                onChange && onChange();
              }
            },
          });

      list.appendChild(el(".upgrade-item", {}, [
        el(".upgrade-icon", { text: up.icon }),
        el(".upgrade-info", {}, [
          el("div", {}, [
            el("span.name", { text: up.name }),
            el("span.lv", { text: `Lv.${lvl}/${up.maxLevel}` }),
          ]),
          el(".desc", { text: up.desc }),
        ]),
        el("div", {}, [
          maxed ? null : el("span.upgrade-cost", { text: `✦ ${cost}` }),
          buyArea,
        ]),
      ]));
    }
  }

  let raf = null;
  function drawPreview() {
    const stats = getStats();
    const stage = telescopeAppearanceStage(stats.telescopeLevel);
    cancelAnimationFrame(raf);
    const loop = (t) => {
      if (!document.body.contains(preview)) return;
      drawTelescopePreview(preview.getContext("2d"), preview.width, preview.height, t, stage);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  const content = el(".modal", { style: { maxWidth: "640px" } }, [
    el(".modal-header", {}, [
      el("h2", { text: "🔭 망원경 업그레이드" }),
      el(".btn.btn-small.btn-ghost.modal-close", { text: "닫기", onclick: () => { Sfx.click(); close(); } }),
    ]),
    el("div", { style: { display: "flex", gap: "16px", flexWrap: "wrap" } }, [
      el("div", { style: { flex: "1 1 220px", minWidth: "200px" } }, [preview, stageName]),
      el("div", { style: { flex: "2 1 300px" } }, [energyLabel, list]),
    ]),
  ]);
  const close = openModal(content);
  refresh();
  drawPreview();
}

/* ---------- 컬렉션 모달 ---------- */
export function openCollection() {
  const grid = el(".collection-grid");
  const total = CONSTELLATIONS.length;
  const found = discoveredCount();
  const progress = el(".collection-progress", {
    html: `발견한 별자리 <b>${found}</b> / ${total} &nbsp;·&nbsp; 진행률 <b>${Math.round((found / total) * 100)}%</b>`,
  });

  for (const con of CONSTELLATIONS) {
    const found = isDiscovered(con.id);
    const rarity = RARITY_INFO[con.rarity];
    const thumb = el("canvas.collection-thumb");
    thumb.width = 160; thumb.height = 96;

    const card = el(`.collection-card${found ? "" : ".locked"}`, {
      onclick: () => { if (found) { Sfx.click(); openConstellationDetail(con); } },
    }, [
      thumb,
      el(".cname", { text: found ? con.name : "???" }),
      el(`.crarity.${rarity.cls}`, { text: found ? rarity.label : "미발견" }),
    ]);
    grid.appendChild(card);
    drawConstellationThumb(thumb, con, { discovered: found });
  }

  const content = el(".modal", {}, [
    el(".modal-header", {}, [
      el("h2", { text: "✦ 별자리 컬렉션" }),
      el(".btn.btn-small.btn-ghost.modal-close", { text: "닫기", onclick: () => { Sfx.click(); close(); } }),
    ]),
    progress,
    grid,
  ]);
  const close = openModal(content);
}

function openConstellationDetail(con) {
  const rec = getState().discovered[con.id] || {};
  const rarity = RARITY_INFO[con.rarity];
  const canvas = el("canvas");
  canvas.width = 240; canvas.height = 180;

  const content = el(".modal.discovery-modal", {}, [
    el(".discovery-name", { text: con.name }),
    el(`.discovery-rarity.${rarity.cls}`, { text: rarity.label }),
    el(".discovery-canvas-wrap", {}, [canvas]),
    el(".discovery-desc", { text: con.description }),
    el(".discovery-story", { text: con.story }),
    el("div", { style: { fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "14px" } }, [
      el("div", { html: `실제 좌표: RA <b style="color:var(--gold-soft)">${formatRA(con.center.ra)}</b> · Dec <b style="color:var(--gold-soft)">${formatDec(con.center.dec)}</b>` }),
      el("div", { text: `발견 위치: RA ${(rec.ra ?? con.center.ra).toFixed(1)}°, Dec ${(rec.dec ?? con.center.dec).toFixed(1)}°` }),
      el("div", { text: `발견: ${rec.night ? `밤 ${rec.night}` : "-"}` }),
      el("div", { html: `획득 별에너지: <span style="color:var(--energy)">✦ ${con.energyReward}</span>` }),
    ]),
    el(".btn.btn-ghost", { text: "닫기", onclick: () => { Sfx.click(); close(); } }),
  ]);
  const close = openModal(content);
  drawConstellationThumb(canvas, con, { discovered: true, glow: true });
}

/* ---------- 설정 모달 ---------- */
export function openSettings(onReset) {
  const st = getState();
  const soundChk = el("input", { type: "checkbox", ...(st.settings.sound ? { checked: "true" } : {}) });
  soundChk.addEventListener("change", () => {
    setSetting("sound", soundChk.checked);
    syncAmbient();
  });
  const volRange = el("input", { type: "range", min: "0", max: "1", step: "0.05", value: String(st.settings.volume) });
  volRange.addEventListener("input", () => {
    const v = parseFloat(volRange.value);
    setSetting("volume", v);
    setVolume(v);
  });

  const content = el(".modal", { style: { maxWidth: "440px" } }, [
    el(".modal-header", {}, [
      el("h2", { text: "⚙ 설정" }),
      el(".btn.btn-small.btn-ghost.modal-close", { text: "닫기", onclick: () => { Sfx.click(); close(); } }),
    ]),
    el(".settings-row", {}, [el("label", { text: "사운드" }), soundChk]),
    el(".settings-row", {}, [el("label", { text: "음량" }), volRange]),
    el(".settings-danger", {}, [
      el(".btn.btn-small.btn-ghost", {
        text: "저장 데이터 초기화",
        style: { borderColor: "rgba(220,120,120,0.5)", color: "#e89090" },
        onclick: () => {
          if (confirm("정말 모든 진행 상황을 초기화할까요?")) {
            resetSave();
            close();
            onReset && onReset();
          }
        },
      }),
    ]),
  ]);
  const close = openModal(content);
}
