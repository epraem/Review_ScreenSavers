// Source-code viewer: a slide-up panel with HTML / CSS / JS tabs that can
// show the source of any page on this site. Exposes window.NTVShowSource(url),
// called by the launcher's per-card "Show Source Code" buttons.
(function () {
  let overlay, panel, codePane, copyBtn;
  let built = false;
  let loadedUrl = null;

  // The deployable source, kept as plain text because the pane itself carries
  // line numbers in the DOM.
  let code = '';

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
        <div id="view-source-actions">
          <button id="view-source-copy" class="vs-action" type="button" title="Copy the whole file">
            <span class="vs-action-icon">&#9114;</span><span class="vs-action-label">Copy code</span>
          </button>
        </div>
        <div id="view-source-title">Screensaver source</div>
        <button id="view-source-close" aria-label="Close">&times;</button>
      </div>
      <div id="view-source-note">
        <b>One file, ready to deploy.</b> Markup, styles and script together, with
        everything that only works on this preview site stripped out: the Back to
        menu link, the launcher scripts, and any live-reload code the dev server
        injects. Save it as an .html file and it runs on its own.
      </div>
      <div id="view-source-body">
        <div id="view-source-code">Loading&hellip;</div>
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
      #view-source-actions { display: flex; gap: 6px; flex-shrink: 0; }
      .vs-action {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        appearance: none;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.06);
        color: #d4d4d4;
        font: 600 12px/1 'Plus Jakarta Sans', system-ui, sans-serif;
        letter-spacing: 0.02em;
        padding: 8px 14px;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .vs-action:hover { background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.24); }
      .vs-action-icon { color: #f18029; font-size: 13px; line-height: 1; }
      .vs-action.is-done { color: #7ee787; border-color: rgba(126,231,135,0.4); }
      .vs-action.is-done .vs-action-icon { color: #7ee787; }
      #view-source-title {
        flex: 1;
        text-align: right;
        color: #9aa0a6;
        font: 600 12px/1 'Plus Jakarta Sans', system-ui, sans-serif;
        letter-spacing: 0.03em;
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
      /* Explains what the Standalone tab is showing, above the code. */
      #view-source-note {
        padding: 10px 18px;
        background: #252526;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        color: #9aa0a6;
        font: 500 12px/1.5 'Plus Jakarta Sans', system-ui, sans-serif;
        flex-shrink: 0;
      }
      #view-source-note b { color: #7ee787; font-weight: 700; }
      #view-source-code {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100%;
        font: 13px/1.6 'Space Mono', Consolas, monospace;
        tab-size: 2;
        -moz-tab-size: 2;
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

    codePane = panel.querySelector('#view-source-code');

    copyBtn = panel.querySelector('#view-source-copy');
    copyBtn.addEventListener('click', () => copyText(code, copyBtn, 'Copy code'));

    overlay.addEventListener('click', close);
    panel.querySelector('#view-source-close').addEventListener('click', close);
  }

  // "Copy standalone" gives the complete screensaver as one deployable HTML
  // file: any external stylesheet and script folded inline, and the launcher
  // chrome (the Back link and the shared launcher scripts) dropped, since those
  // only resolve inside this preview site. "Copy" gives the tab verbatim.
  function buildStandalone(html, cssHref, css, jsSrc, js) {
    let out = html;

    if (cssHref && css != null) {
      out = out.replace(tagPattern('link', 'href', cssHref), '<style>\n' + css.trim() + '\n</style>');
    }
    if (jsSrc && js != null) {
      out = out.replace(tagPattern('script', 'src', jsSrc), '<script>\n' + js.trim() + '\n<\/script>');
    }

    return out
      .replace(/[ \t]*<a class="back-link"[\s\S]*?<\/a>[ \t]*\r?\n?/i, '')
      .replace(/[ \t]*<script[^>]+src="[^"]*(?:view-source|deck-nav|templates)\.js"[^>]*><\/script>[ \t]*\r?\n?/gi, '')
      .replace(/^[ \t]*\.back-link(?::hover)?\s*\{[^}]*\}[ \t]*\r?\n?/gm, '')
      // Live Server (and friends) append a live-reload script to every response.
      .replace(/[ \t]*<!--\s*Code injected by live-server\s*-->[\s\S]*?<\/script>[ \t]*\r?\n?/gi, '')
      .replace(/\n{3,}/g, '\n\n');
  }

  function tagPattern(tag, attr, value) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const close = tag === 'script' ? '\\s*<\\/script>' : '';
    return new RegExp('<' + tag + '[^>]*' + attr + '=["\']' + escaped + '["\'][^>]*>' + close, 'i');
  }

  function copyText(text, btn, restoreLabel) {
    if (!text) return;
    const label = btn.querySelector('.vs-action-label');

    const done = () => {
      btn.classList.add('is-done');
      label.textContent = 'Copied';
      clearTimeout(btn.copyTimer);
      btn.copyTimer = setTimeout(() => {
        btn.classList.remove('is-done');
        label.textContent = restoreLabel;
      }, 1800);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => legacyCopy(text, done));
    } else {
      legacyCopy(text, done);
    }
  }

  // file:// and plain-http previews don't get the async clipboard API.
  function legacyCopy(text, done) {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(field);
    field.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* clipboard unavailable */ }
    field.remove();
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

  function setCode(text) {
    code = text;
    renderCode(codePane, text);
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

  function openFor(rawUrl) {
    const absUrl = new URL(rawUrl, location.href).href;

    ensureBuilt();
    overlay.classList.add('open');
    panel.classList.add('open');

    if (loadedUrl === absUrl) return;
    loadedUrl = absUrl;

    setCode('Loading…');

    fetch(absUrl)
      .then((res) => res.text())
      .then((html) => {
        const cssHref = findOwnStylesheetHref(html);
        const jsSrc = findOwnScriptSrc(html);
        const cssJob = cssHref
          ? fetch(new URL(cssHref, absUrl)).then((res) => res.text()).catch(() => null)
          : Promise.resolve(null);
        const jsJob = jsSrc
          ? fetch(new URL(jsSrc, absUrl)).then((res) => res.text()).catch(() => null)
          : Promise.resolve(null);

        // These only fetch if a screensaver ever splits its CSS or JS out into
        // separate files; buildStandalone folds them back in.
        return Promise.all([cssJob, jsJob]).then(([css, js]) => {
          setCode(buildStandalone(html, cssHref, css, jsSrc, js));
        });
      })
      .catch(() => {
        setCode('Unable to load source (view may need to be served over http).');
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
