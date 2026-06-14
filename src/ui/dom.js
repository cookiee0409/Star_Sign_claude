/* ============================================================
   DOM 유틸리티 — 오버레이 UI를 간결하게 구성하기 위한 헬퍼
   ============================================================ */

/** 엘리먼트 생성: el("div.class#id", { attrs }, [children|text]) */
export function el(selector, props = {}, children = []) {
  // 선두 태그명(선택) + .class / #id 토큰들 분리
  const tagMatch = selector.match(/^[a-zA-Z][\w-]*/);
  const tag = tagMatch ? tagMatch[0] : "div";
  const modsStr = tagMatch ? selector.slice(tagMatch[0].length) : selector;
  const node = document.createElement(tag);
  for (const token of modsStr.match(/[.#][\w-]+/g) || []) {
    if (token[0] === ".") node.classList.add(token.slice(1));
    else if (token[0] === "#") node.id = token.slice(1);
  }
  for (const [k, v] of Object.entries(props)) {
    if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "onclick") node.addEventListener("click", v);
    else if (k === "oninput") node.addEventListener("input", v);
    else if (k === "onkeydown") node.addEventListener("keydown", v);
    else if (k === "style") Object.assign(node.style, v);
    else if (v != null) node.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function clearUI() {
  document.getElementById("ui-root").innerHTML = "";
}

export function mount(node) {
  document.getElementById("ui-root").appendChild(node);
  return node;
}

/** 모달 띄우기. content 노드를 받아 backdrop에 감싸 표시. 닫기 핸들 반환 */
export function openModal(content, { closeOnBackdrop = true } = {}) {
  const backdrop = el(".modal-backdrop");
  backdrop.appendChild(content);
  if (closeOnBackdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.remove();
    });
  }
  mount(backdrop);
  return () => backdrop.remove();
}

let toastTimer = null;
export function toast(msg, dur = 1800) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), dur);
}

/** 페이드 전환: 검게 → 콜백 실행 → 다시 밝게 */
export function fadeTransition(midFn) {
  const fade = document.getElementById("fade");
  fade.classList.add("active");
  return new Promise((resolve) => {
    setTimeout(async () => {
      if (midFn) await midFn();
      fade.classList.remove("active");
      setTimeout(resolve, 450);
    }, 460);
  });
}

export function showHUD(show) {
  document.getElementById("hud").classList.toggle("hidden", !show);
}

export function updateHUD({ energy, night, telescopeLevel }) {
  if (energy != null) document.getElementById("hud-energy-value").textContent = Math.round(energy);
  if (night != null) document.getElementById("hud-night-value").textContent = night;
  if (telescopeLevel != null) document.getElementById("hud-tel-value").textContent = telescopeLevel;
}
