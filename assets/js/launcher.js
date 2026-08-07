function scalePreviews() {
  document.querySelectorAll(".menu__card-preview").forEach((container) => {
    const iframe = container.querySelector("iframe");
    const scale = container.clientWidth / 1920;
    iframe.style.transform = `scale(${scale})`;
  });
}

window.addEventListener("resize", scalePreviews);
window.addEventListener("load", scalePreviews);
scalePreviews();

// Adds a "Show Source Code" button below each card's description — kept
// outside the preview iframe so it never sits on top of the design (the
// button inside the iframe itself is suppressed via NTV_SOURCE_NO_AUTO
// when the screensaver is embedded as a preview).
function addCardSourceButtons() {
  document.querySelectorAll(".menu__card").forEach((card) => {
    const href = card.getAttribute("href");
    if (!href || card.parentElement.classList.contains("menu__card-wrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "menu__card-wrap";
    card.parentNode.insertBefore(wrap, card);
    wrap.appendChild(card);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu__card-source";
    btn.innerHTML = '<span class="menu__card-source-icon">&lt;/&gt;</span>Show Source Code';
    btn.addEventListener("click", () => {
      if (typeof NTVShowSource === "function") NTVShowSource(href);
    });
    wrap.appendChild(btn);
  });
}

addCardSourceButtons();
