/* Launcher grid.
   Cards are built from window.NTV_TEMPLATES (assets/js/templates.js) so the menu
   order is the same order the Previous/Next controls walk inside each
   screensaver. Each card = a live preview iframe + label + "Show Source Code". */
(function () {
  var grid = document.getElementById("menu-grid");
  var templates = window.NTV_TEMPLATES || [];
  if (!grid) return;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  templates.forEach(function (tpl, i) {
    var previewHref = "reviews/" + tpl.slug + "/index.html";
    var href = "viewer.html?design=" + encodeURIComponent(tpl.slug);

    var wrap = document.createElement("div");
    wrap.className = "menu__card-wrap";

    var card = document.createElement("a");
    card.className = "menu__card";
    card.href = href;
    card.innerHTML =
      '<span class="menu__card-preview">' +
      '<span class="menu__card-index">' + pad(i + 1) + "</span>" +
      '<iframe tabindex="-1" loading="lazy"></iframe>' +
      "</span>" +
      '<span class="menu__card-label"></span>' +
      '<span class="menu__card-desc"></span>';

    var frame = card.querySelector("iframe");
    frame.setAttribute("src", previewHref);
    frame.setAttribute("title", tpl.title + " preview");
    card.querySelector(".menu__card-label").textContent = tpl.title;
    card.querySelector(".menu__card-desc").textContent = tpl.desc;

    // Source trigger sits outside the card link so it never covers the preview.
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu__card-source";
    btn.innerHTML = '<span class="menu__card-source-icon">&lt;/&gt;</span>Show Source Code';
    btn.addEventListener("click", function () {
      if (typeof NTVShowSource === "function") NTVShowSource(previewHref);
    });

    wrap.append(card, btn);
    grid.appendChild(wrap);
  });

  // The iframes render each screensaver at its native 1920x1080, then get
  // scaled down to whatever width the card ended up at.
  function scalePreviews() {
    document.querySelectorAll(".menu__card-preview").forEach(function (container) {
      var iframe = container.querySelector("iframe");
      if (iframe) iframe.style.transform = "scale(" + container.clientWidth / 1920 + ")";
    });
  }

  window.addEventListener("resize", scalePreviews);
  window.addEventListener("load", scalePreviews);
  scalePreviews();
})();
