/* Deck navigation for the screensavers.
   Adds a floating Previous / Next bar to each screensaver page so a design can
   be reviewed one after another without going back to the menu. Order comes
   from the shared manifest (templates.js), which is also what builds the menu
   grid, so the counter here matches the number on the menu card.

   - Arrow keys move through the deck, Esc returns to the menu.
   - The bar fades out while the screen is idle so it never sits on the design.
   - Nothing is drawn when the page is embedded as a launcher preview.

   Include after the design markup:
     <script src="../../assets/js/deck-nav.js"></script>              */
(function () {
  var script = document.currentScript;
  var embedded = window.self !== window.top;
  var viewerFrame = document.getElementById("deck-frame");

  // Launcher previews render each screensaver in an iframe — no chrome there.
  if (embedded) {
    onReady(function () {
      var legacy = document.querySelector(".back-link");
      if (legacy) legacy.style.display = "none";
    });
    return;
  }

  // Always review top-level designs through the stable viewer shell. The
  // review itself still loads normally when embedded by that shell or by a
  // launcher thumbnail.
  if (!viewerFrame && location.pathname.split("/").indexOf("reviews") !== -1) {
    location.replace(new URL(
      "../../viewer.html?design=" + encodeURIComponent(currentSlug()),
      location.href
    ).href);
    return;
  }

  if (window.NTV_TEMPLATES) {
    onReady(build);
  } else if (script) {
    var loader = document.createElement("script");
    loader.src = new URL("templates.js", script.src).href;
    loader.onload = function () { onReady(build); };
    document.head.appendChild(loader);
  }

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function build() {
    var deck = window.NTV_TEMPLATES || [];
    var slug = currentSlug();
    var index = deck.findIndex(function (t) { return t.slug === slug; });
    if (index === -1 && viewerFrame && deck.length) index = 0;
    if (index === -1) return;

    var current = deck[index];
    var prev = deck[(index - 1 + deck.length) % deck.length];
    var next = deck[(index + 1) % deck.length];

    injectStyle();

    // The no-JS fallback link is replaced by the Menu button in the bar.
    var legacy = document.querySelector(".back-link");
    if (legacy) legacy.remove();

    var bar = document.createElement("nav");
    bar.className = "ntv-deck";
    bar.setAttribute("aria-label", "Screensaver deck");
    bar.innerHTML =
      '<a class="ntv-deck__btn ntv-deck__menu" href="' + (viewerFrame ? "index.html" : "../../index.html") + '">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>' +
        "<span>All designs</span>" +
      "</a>" +
      '<button type="button" class="ntv-deck__btn ntv-deck__source">' +
        '<span class="ntv-deck__code">&lt;/&gt;</span><span>Source</span>' +
      "</button>" +
      '<button type="button" class="ntv-deck__btn ntv-deck__full" title="Fullscreen (F)">' +
        '<svg class="ntv-deck__full-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1H1v5M10 1h5v5M6 15H1v-5M10 15h5v-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "<span>Fullscreen</span>" +
      "</button>" +
      '<span class="ntv-deck__rule"></span>' +
      '<a class="ntv-deck__btn ntv-deck__arrow" data-dir="prev" rel="prev" aria-label="Previous design">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</a>" +
      '<span class="ntv-deck__meta">' +
        '<span class="ntv-deck__count"><b>' + pad(index + 1) + "</b> / " + pad(deck.length) + "</span>" +
        '<span class="ntv-deck__title"></span>' +
      "</span>" +
      '<a class="ntv-deck__btn ntv-deck__arrow" data-dir="next" rel="next" aria-label="Next design">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 2 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</a>" +
      '<span class="ntv-deck__hint" aria-hidden="true">&#8592; &#8594;</span>';

    var count = bar.querySelector(".ntv-deck__count");
    var title = bar.querySelector(".ntv-deck__title");
    var prevLink = bar.querySelector('[data-dir="prev"]');
    var nextLink = bar.querySelector('[data-dir="next"]');

    syncDesign(false);

    if (viewerFrame) {
      prevLink.addEventListener("click", function (e) {
        e.preventDefault();
        move(-1);
      });
      nextLink.addEventListener("click", function (e) {
        e.preventDefault();
        move(1);
      });
      window.addEventListener("popstate", function () {
        var poppedIndex = deck.findIndex(function (t) { return t.slug === currentSlug(); });
        if (poppedIndex !== -1 && poppedIndex !== index) {
          index = poppedIndex;
          syncDesign(false);
        }
      });
    }

    // Same source viewer the launcher cards use, pointed at this page.
    var source = bar.querySelector(".ntv-deck__source");
    if (typeof window.NTVShowSource === "function") {
      source.addEventListener("click", function () {
        window.NTVShowSource(viewerFrame ? reviewHref(current.slug) : location.href);
      });
    } else {
      source.remove();
    }

    // Fullscreen is how these get shown on a screen, so keep it one click away.
    var fullBtn = bar.querySelector(".ntv-deck__full");
    var fsSupported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    if (fsSupported) {
      fullBtn.addEventListener("click", toggleFullscreen);
      document.addEventListener("fullscreenchange", syncFullscreen);
      document.addEventListener("webkitfullscreenchange", syncFullscreen);
      syncFullscreen();
    } else {
      fullBtn.remove();
    }

    function isFullscreen() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function toggleFullscreen() {
      if (!fsSupported) return;
      var root = document.documentElement;
      if (isFullscreen()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      }
    }

    function syncFullscreen() {
      var on = isFullscreen();
      var iconPath = fullBtn.querySelector(".ntv-deck__full-icon path");
      iconPath.setAttribute("d", on
        ? "M1.5 1.5 6 6M6 2.5V6H2.5M14.5 14.5 10 10M10 13.5V10h3.5"
        : "M6 1H1v5M10 1h5v5M6 15H1v-5M10 15h5v-5");
      fullBtn.querySelector("span").textContent = on ? "Exit" : "Fullscreen";
      fullBtn.title = on ? "Exit fullscreen (F)" : "Fullscreen (F)";
    }

    document.body.appendChild(bar);

    function move(delta) {
      if (!viewerFrame) {
        location.href = delta > 0 ? nextLink.href : prevLink.href;
        return;
      }
      index = (index + delta + deck.length) % deck.length;
      syncDesign(true);
    }

    function syncDesign(pushHistory) {
      current = deck[index];
      prev = deck[(index - 1 + deck.length) % deck.length];
      next = deck[(index + 1) % deck.length];

      count.innerHTML = "<b>" + pad(index + 1) + "</b> / " + pad(deck.length);
      title.textContent = current.title;
      prevLink.href = href(prev.slug);
      prevLink.title = "Previous: " + prev.title;
      nextLink.href = href(next.slug);
      nextLink.title = "Next: " + next.title;

      if (!viewerFrame) return;
      viewerFrame.src = reviewHref(current.slug);
      viewerFrame.title = current.title + " preview";
      document.title = current.title + " — NTV 360 Screensaver Viewer";

      var viewerUrl = href(current.slug);
      try {
        if (pushHistory) history.pushState({ design: current.slug }, "", viewerUrl);
        else if (new URLSearchParams(location.search).get("design") !== current.slug) {
          history.replaceState({ design: current.slug }, "", viewerUrl);
        }
      } catch (e) {
        // Some browsers restrict History API updates on file:// previews.
      }
    }

    // Idle fade — the bar is chrome, the design is the point.
    var idleTimer;
    var held = false;

    function wake() {
      bar.classList.remove("is-idle");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (!held) bar.classList.add("is-idle");
      }, 2600);
    }

    bar.addEventListener("mouseenter", function () { held = true; wake(); });
    bar.addEventListener("mouseleave", function () { held = false; wake(); });
    bar.addEventListener("focusin", function () { held = true; wake(); });
    bar.addEventListener("focusout", function () { held = false; wake(); });
    ["mousemove", "touchstart", "keydown"].forEach(function (evt) {
      window.addEventListener(evt, wake, { passive: true });
    });
    wake();

    function handleKeydown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFullscreen(); }
      // Esc leaves fullscreen on its own; only then does it fall back to the menu.
      else if (e.key === "Escape" && !isFullscreen()) {
        e.preventDefault();
        location.href = viewerFrame ? "index.html" : "../../index.html";
      }
    }

    document.addEventListener("keydown", handleKeydown);

    // Pointer and keyboard events inside an iframe do not bubble to its parent.
    // Forward the useful ones so an idle viewer bar wakes and its shortcuts keep
    // working even after someone clicks inside the current screensaver.
    if (viewerFrame) {
      viewerFrame.addEventListener("load", function () {
        try {
          ["mousemove", "touchstart"].forEach(function (evt) {
            viewerFrame.contentWindow.addEventListener(evt, wake, { passive: true });
          });
          viewerFrame.contentDocument.addEventListener("keydown", handleKeydown);
        } catch (e) {
          // The reviews are same-origin here; ignore access errors on odd hosts.
        }
      });
    }
  }

  function currentSlug() {
    if (viewerFrame) return new URLSearchParams(location.search).get("design") || "";
    var parts = location.pathname.split("/").filter(Boolean);
    // .../reviews/<slug>/index.html — the slug is the last directory.
    return parts[parts.length - 1].indexOf(".") > -1 ? parts[parts.length - 2] : parts[parts.length - 1];
  }

  function href(slug) {
    return viewerFrame
      ? "viewer.html?design=" + encodeURIComponent(slug)
      : "../" + slug + "/index.html";
  }

  function reviewHref(slug) {
    return "reviews/" + slug + "/index.html";
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent = [
      ".ntv-deck{position:fixed;z-index:9990;left:50%;bottom:24px;transform:translateX(-50%);",
      "display:flex;align-items:center;gap:6px;padding:7px 10px 7px 8px;border-radius:999px;",
      "background:rgba(12,16,22,.74);border:1px solid rgba(255,255,255,.14);",
      "backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);",
      "box-shadow:0 12px 34px rgba(0,0,0,.42);color:#F2F5F8;",
      "font:600 14px/1 'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;",
      "transition:opacity .28s ease,transform .28s ease}",
      ".ntv-deck.is-idle{opacity:0;transform:translateX(-50%) translateY(10px);pointer-events:none}",
      ".ntv-deck__btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:38px;",
      "min-width:38px;padding:0 12px;border-radius:999px;color:inherit;text-decoration:none;",
      "background:rgba(255,255,255,.06);border:1px solid transparent;cursor:pointer;",
      "transition:background .18s ease,border-color .18s ease,color .18s ease}",
      ".ntv-deck__btn:hover{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.2)}",
      ".ntv-deck__btn:focus-visible{outline:2px solid #f18029;outline-offset:2px}",
      ".ntv-deck__menu svg{width:14px;height:14px;fill:currentColor;flex:none}",
      ".ntv-deck__menu span,.ntv-deck__source span,.ntv-deck__full span{font-size:13px;letter-spacing:.01em}",
      ".ntv-deck__source,.ntv-deck__full{appearance:none;-webkit-appearance:none;font:inherit;gap:7px}",
      ".ntv-deck__full svg{width:15px;height:15px;flex:none}",
      ".ntv-deck__code{font-family:'Space Mono','JetBrains Mono',ui-monospace,monospace;font-size:12px;",
      "color:#f18029;flex:none}",
      ".ntv-deck__arrow{padding:0}",
      ".ntv-deck__arrow svg{width:16px;height:16px}",
      ".ntv-deck__rule{width:1px;height:22px;margin:0 4px;background:rgba(255,255,255,.16);flex:none}",
      ".ntv-deck__meta{display:flex;align-items:center;gap:10px;padding:0 6px;min-width:0}",
      ".ntv-deck__count{font-family:'Space Mono','JetBrains Mono',ui-monospace,monospace;font-size:12px;",
      "letter-spacing:.08em;color:rgba(242,245,248,.6);white-space:nowrap}",
      ".ntv-deck__count b{color:#f18029;font-weight:700}",
      ".ntv-deck__title{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}",
      ".ntv-deck__hint{font-family:'Space Mono','JetBrains Mono',ui-monospace,monospace;font-size:12px;",
      "letter-spacing:.1em;color:rgba(242,245,248,.34);padding:0 6px 0 2px;white-space:nowrap}",
      "@media (max-width:640px){.ntv-deck__menu span,.ntv-deck__source span,",
      ".ntv-deck__full span,.ntv-deck__hint{display:none}",
      ".ntv-deck__title{max-width:150px}}",
      "@media (prefers-reduced-motion:reduce){.ntv-deck{transition:none}",
      ".ntv-deck.is-idle{transform:translateX(-50%)}}",
    ].join("");
    document.head.appendChild(style);
  }
})();
