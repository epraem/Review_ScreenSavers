// Source-code viewer: a slide-up panel with HTML / CSS / JS tabs that can
// show the source of any page on this site. Exposes window.NTVShowSource(url),
// called by the launcher's per-card "Show Source Code" buttons.
(function () {
  let overlay, panel, htmlPane, cssPane, jsPane, tabs;
  let built = false;
  let loadedUrl = null;

  function ensureBuilt() {
    if (built) return;
    built = true;

    if (!document.getElementById('vs-font-link')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'vs-font-link';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&display=swap';
      document.head.appendChild(fontLink);
    }

    overlay = document.createElement('div');
    overlay.id = 'view-source-overlay';

    panel = document.createElement('div');
    panel.id = 'view-source-panel';
    panel.innerHTML = `
      <div id="view-source-header">
        <div id="view-source-dots"><span></span><span></span><span></span></div>
        <div id="view-source-tabs">
          <button class="vs-tab is-active" data-tab="html" type="button">HTML</button>
          <button class="vs-tab" data-tab="css" type="button">CSS</button>
          <button class="vs-tab" data-tab="js" type="button">JS</button>
        </div>
        <button id="view-source-close" aria-label="Close">&times;</button>
      </div>
      <div id="view-source-body">
        <div id="view-source-code" data-pane="html">Loading&hellip;</div>
        <div id="view-source-code-css" data-pane="css" hidden>Loading&hellip;</div>
        <div id="view-source-code-js" data-pane="js" hidden>Loading&hellip;</div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #view-source-btn {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9998;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px 22px 15px 18px;
        border-radius: 10px;
        border: 1px solid rgba(253, 253, 253, 0.35);
        background: rgba(17, 24, 39, 0.65);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: #fff;
        font: 700 14px/1 'Plus Jakarta Sans', system-ui, sans-serif;
        letter-spacing: 0.02em;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
      }
      #view-source-btn:hover {
        background: rgba(17, 24, 39, 0.85);
        border-color: rgba(253, 253, 253, 0.55);
        transform: translateY(-1px);
      }
      #view-source-btn .vs-icon {
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        color: #f18029;
        font-size: 15px;
      }
      #view-source-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 9999;
        display: none;
      }
      #view-source-panel {
        position: fixed;
        top: 40px;
        bottom: 40px;
        left: 50%;
        width: min(1200px, calc(100vw - 160px));
        max-width: 1200px;
        background: #1e1e1e;
        color: #d4d4d4;
        z-index: 10000;
        display: none;
        flex-direction: column;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.55);
        border: 1px solid rgba(255,255,255,0.08);
        transform: translate(-50%, 8px);
        opacity: 0;
        transition: transform 0.25s ease-out, opacity 0.25s ease-out;
      }
      #view-source-panel.open { display: flex; transform: translate(-50%, 0); opacity: 1; }
      #view-source-overlay.open { display: block; }
      #view-source-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        background: #2d2d2d;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        flex-shrink: 0;
      }
      #view-source-dots { display: flex; gap: 6px; }
      #view-source-dots span {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #4a4a4a;
      }
      #view-source-tabs {
        flex: 1;
        display: flex;
        justify-content: center;
        gap: 6px;
      }
      .vs-tab {
        appearance: none;
        border: 1px solid transparent;
        background: transparent;
        color: #9aa0a6;
        font: 600 12px/1 'Plus Jakarta Sans', system-ui, sans-serif;
        letter-spacing: 0.03em;
        padding: 7px 16px;
        border-radius: 999px;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .vs-tab:hover { color: #fff; }
      .vs-tab.is-active {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.14);
        color: #fff;
      }
      #view-source-close {
        background: none;
        border: none;
        color: #9aa0a6;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        padding: 0 2px;
      }
      #view-source-close:hover { color: #fff; }
      #view-source-body {
        flex: 1;
        overflow: auto;
        background: #1e1e1e;
      }
      #view-source-code,
      #view-source-code-css,
      #view-source-code-js {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100%;
        font: 13px/1.6 'Space Mono', Consolas, monospace;
        tab-size: 2;
        -moz-tab-size: 2;
      }
      #view-source-code[hidden],
      #view-source-code-css[hidden],
      #view-source-code-js[hidden] {
        display: none;
      }
      .vs-line-num {
        background: #1e1e1e;
        color: #6e7681;
        text-align: right;
        padding: 0 14px;
        user-select: none;
      }
      .vs-line-code {
        padding: 0 20px 0 16px;
        white-space: pre-wrap;
        word-break: break-word;
        color: #d4d4d4;
      }
    `;

    document.head.appendChild(style);
    document.body.append(overlay, panel);

    htmlPane = panel.querySelector('#view-source-code');
    cssPane = panel.querySelector('#view-source-code-css');
    jsPane = panel.querySelector('#view-source-code-js');
    tabs = Array.from(panel.querySelectorAll('.vs-tab'));

    overlay.addEventListener('click', close);
    panel.querySelector('#view-source-close').addEventListener('click', close);
    tabs.forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderCode(el, text) {
    const lines = text.split('\n');
    el.innerHTML = lines
      .map((line, i) => `<div class="vs-line-num">${i + 1}</div><div class="vs-line-code">${escapeHtml(line) || ' '}</div>`)
      .join('');
  }

  function switchTab(name) {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    htmlPane.hidden = name !== 'html';
    cssPane.hidden = name !== 'css';
    jsPane.hidden = name !== 'js';
  }

  // Finds this page's own stylesheet link (its "style.css"), as opposed to
  // the shared brand.css or Google Fonts links.
  function findOwnStylesheetHref(html) {
    const linkRegex = /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html))) {
      const href = match[1];
      if (/(^|\/)style\.css(\?.*)?$/i.test(href)) return href;
    }
    return null;
  }

  function extractInlineStyle(html) {
    const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return match ? match[1].trim() : null;
  }

  // Finds this page's own external script (its "script.js"), as opposed to
  // the shared view-source.js loader.
  function findOwnScriptSrc(html) {
    const scriptRegex = /<script[^>]+src=["']([^"']+\.js)["'][^>]*>/gi;
    let match;
    while ((match = scriptRegex.exec(html))) {
      const src = match[1];
      if (/(^|\/)script\.js(\?.*)?$/i.test(src)) return src;
    }
    return null;
  }

  // Concatenates any inline <script> blocks (skips src-based ones, which is
  // how the shared view-source.js loader is always included).
  function extractInlineScripts(html) {
    const blocks = [];
    const scriptRegex = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html))) {
      const content = match[1].trim();
      if (content) blocks.push(content);
    }
    return blocks.length ? blocks.join('\n\n') : null;
  }

  function openFor(rawUrl) {
    const absUrl = new URL(rawUrl, location.href).href;

    ensureBuilt();
    overlay.classList.add('open');
    panel.classList.add('open');
    switchTab('html');

    if (loadedUrl === absUrl) return;
    loadedUrl = absUrl;

    renderCode(htmlPane, 'Loading…');
    renderCode(cssPane, 'Loading…');
    renderCode(jsPane, 'Loading…');

    fetch(absUrl)
      .then((res) => res.text())
      .then((html) => {
        renderCode(htmlPane, html);

        const cssHref = findOwnStylesheetHref(html);
        if (cssHref) {
          fetch(new URL(cssHref, absUrl))
            .then((res) => res.text())
            .then((css) => renderCode(cssPane, css))
            .catch(() => { cssPane.textContent = 'Unable to load stylesheet.'; });
        } else {
          const inlineCss = extractInlineStyle(html);
          renderCode(cssPane, inlineCss || '/* No separate CSS — styles are inlined in the HTML tab. */');
        }

        const jsSrc = findOwnScriptSrc(html);
        if (jsSrc) {
          fetch(new URL(jsSrc, absUrl))
            .then((res) => res.text())
            .then((js) => renderCode(jsPane, js))
            .catch(() => { jsPane.textContent = 'Unable to load script.'; });
        } else {
          const inlineJs = extractInlineScripts(html);
          renderCode(jsPane, inlineJs || '// This screensaver has no JavaScript of its own.');
        }
      })
      .catch(() => {
        renderCode(htmlPane, 'Unable to load source (view may need to be served over http).');
      });
  }

  function close() {
    if (!panel) return;
    overlay.classList.remove('open');
    panel.classList.remove('open');
  }

  // Source viewing now happens exclusively from the launcher's per-card
  // "Show Source Code" buttons — this just exposes the opener so those
  // buttons (running on the launcher page, not this one) can call it.
  window.NTVShowSource = openFor;
})();
