/* ===========================================================================
   ADV MEDIA — SHARED APPEARANCE
   ===========================================================================

   THE PROBLEM THIS SOLVES

   Every page had its own copy of the colour variables. Pick Light in the crew
   app and the checklist, the time clock and the guides all stayed dark. Worse,
   the copies had already drifted — the same grey was three slightly different
   greys across the repo.

   This file is now the single source. Include it and a page inherits every
   theme, the accent, the font and the text size, and a choice made anywhere
   applies everywhere.

   HOW TO ADD IT TO A PAGE

   One line, in <head>, BEFORE the page's own <style> block:

       <script src="adv-theme.js"></script>

   Before matters: this defines the variables, and the page's own CSS should be
   able to override them if it needs to. It also applies the saved theme before
   the first paint, so the page never flashes dark and then snaps to light.

   Then delete that page's own :root { --bg: ... } block. Anything left behind
   wins over this file and the page will stay stuck on its old colours.

   THE Aa BUTTON

   Optional. Add data-adv-appearance to any element and it opens the picker:

       <button data-adv-appearance>Aa</button>

   Or call ADVTheme.open() yourself. Pages that don't want the button still
   follow whatever was chosen elsewhere.

   WHAT DELIBERATELY DOES NOT CHANGE

   Semantic colours — green, amber, red — and the camera band colours stay
   fixed in every theme, monochrome included. Red means a dead cable and the
   bands mean which camera. Greying those out would break the gear system to
   make the interface prettier.
   =========================================================================== */

(function () {
  "use strict";

  var KEY = "advAppearance";

  var CSS = `
  :root {
    --bg: #0A0D12;
    --panel: #12181F;
    --panel2: #1A222B;
    --border: #26313D;
    --text: #EDEFF3;
    --text-muted: #8A96A3;
    --text-faint: #5C6774;

    --green: #33A870;
    --amber: #E0A63C;
    --red: #D65A4E;
    --blue: #4A8FC0;

    --warn-bg: #1F1810;  --warn-ink: #FFD699;  --warn-strong: #FFE9C2;
    --bad-bg:  #2A1512;  --bad-ink:  #F2B8B1;
    --good-bg: #10201A;  --good-ink: #A8E0C4;
    --info-bg: #1B2A38;  --info-ink: #8FC6F0;

    --accent: var(--blue);
    --accent-ink: #FFFFFF;
    --shadow: 0 2px 0 rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.35);
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --fs: 1;
  }

  /* Off-white rather than pure white. A phone at a night game is the worst
     case for glare. */
  html[data-theme="light"] {
    --bg: #F4F6F8;
    --panel: #FFFFFF;
    --panel2: #EDF1F5;
    --border: #D2DAE2;
    --text: #131A21;
    --text-muted: #55616D;
    --text-faint: #7C8894;
    --green: #1F7D4D;
    --amber: #9A6B12;
    --red: #B23B30;
    --blue: #2C6E9E;
    --warn-bg: #FFF6E3;  --warn-ink: #6B4A05;  --warn-strong: #4A3303;
    --bad-bg:  #FDECEA;  --bad-ink:  #8C2C22;
    --good-bg: #E8F6EE;  --good-ink: #14603A;
    --info-bg: #E9F2F9;  --info-ink: #1D5580;
    --shadow: 0 1px 0 rgba(16,24,32,0.06), 0 4px 12px rgba(16,24,32,0.10);
  }

  html[data-theme="mono"] {
    --bg: #0B0B0C;
    --panel: #151517;
    --panel2: #1E1E21;
    --border: #33333A;
    --text: #F2F2F3;
    --text-muted: #9A9AA2;
    --text-faint: #6B6B73;
    --blue: #C9C9D2;
    --accent-ink: #101012;
  }

  html[data-theme="mono-light"] {
    --bg: #F5F5F6;
    --panel: #FFFFFF;
    --panel2: #EBEBED;
    --border: #D6D6DA;
    --text: #16161A;
    --text-muted: #5A5A63;
    --text-faint: #85858E;
    --blue: #3A3A42;
    --accent-ink: #FFFFFF;
    --warn-bg: #FFF6E3;  --warn-ink: #6B4A05;  --warn-strong: #4A3303;
    --bad-bg:  #FDECEA;  --bad-ink:  #8C2C22;
    --good-bg: #E8F6EE;  --good-ink: #14603A;
    --info-bg: #EDEDEF;  --info-ink: #3A3A42;
    --shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.10);
  }

  html[data-accent="teal"]   { --accent: #2FA39B; }
  html[data-accent="violet"] { --accent: #8B72D9; }
  html[data-accent="amber"]  { --accent: #D2892B; --accent-ink: #1A1205; }
  html[data-accent="green"]  { --accent: #2E9E63; }
  html[data-accent="slate"]  { --accent: #6B7A89; }

  html[data-font="serif"]   { --font: Georgia, "Times New Roman", serif; }
  html[data-font="mono"]    { --font: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  html[data-font="rounded"] { --font: ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif; }

  body { font-family: var(--font); }

  /* Sizes across the repo are in px, so a font-size change alone does nothing.
     Zoom scales the layout, which is what people mean by "bigger" on a utility
     app — bigger buttons too, not just text. Applied to the page wrapper so
     overlays keep a constant size. */
  html[data-fs="s"]  { --fs: 0.92; }
  html[data-fs="l"]  { --fs: 1.10; }
  html[data-fs="xl"] { --fs: 1.22; }
  #app, .wrap, .adv-scale { zoom: var(--fs); }
  .adv-ap-overlay, .adv-ap-overlay * { zoom: 1; }

  /* The logo is white artwork and vanishes on a light background. */
  html[data-theme="light"] .brand-logo,
  html[data-theme="mono-light"] .brand-logo { filter: invert(1) brightness(0.75); }

  button:focus-visible, a:focus-visible,
  select:focus-visible, input:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--accent); outline-offset: 2px;
  }

  /* ---- picker ---- */
  .adv-ap-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.72);
    z-index: 2147482000; padding: 14px; overflow: auto;
    font-family: var(--font);
  }
  .adv-ap-card {
    background: var(--panel); border: 1px solid var(--border); color: var(--text);
    border-radius: 16px; padding: 18px; max-width: 380px; margin: auto;
  }
  .adv-ap-title { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
  .adv-ap-sub { font-size: 11px; color: var(--text-faint); margin-bottom: 14px; font-family: monospace; }
  .adv-ap-label {
    font-size: 11px; font-weight: 800; color: var(--text-faint);
    text-transform: uppercase; letter-spacing: 0.7px; margin: 16px 0 8px;
  }
  .adv-ap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .adv-ap-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .adv-ap-theme {
    display: flex; align-items: center; gap: 9px; text-align: left;
    background: var(--panel2); border: 1px solid var(--border); color: var(--text);
    border-radius: 11px; padding: 9px 10px; font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer;
  }
  .adv-ap-theme.on { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .adv-ap-sw {
    width: 30px; height: 30px; border-radius: 8px; flex: 0 0 auto;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; border: 1px solid var(--border);
  }
  .adv-ap-dot {
    width: 34px; height: 34px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; padding: 0; box-shadow: 0 0 0 1px rgba(128,128,128,0.35);
  }
  .adv-ap-dot.on { border-color: var(--text); }
  .adv-ap-chip {
    flex: 1; min-width: 62px; background: var(--panel2); border: 1px solid var(--border);
    color: var(--text); border-radius: 10px; padding: 11px 8px;
    font-size: 13.5px; font-weight: 700; cursor: pointer;
  }
  .adv-ap-chip.on { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .adv-ap-btn {
    display: block; width: 100%; margin-top: 10px; padding: 13px 0;
    border-radius: 11px; border: none; cursor: pointer; font-family: inherit;
    font-size: 15px; font-weight: 800;
    background: var(--accent); color: var(--accent-ink);
  }
  .adv-ap-btn.ghost {
    background: var(--panel2); color: var(--text); border: 1px solid var(--border);
  }
  `;

  var THEMES = [
    { id: "",           label: "Dark",       sw: "#0A0D12", ink: "#EDEFF3" },
    { id: "light",      label: "Light",      sw: "#F4F6F8", ink: "#131A21" },
    { id: "mono",       label: "Mono dark",  sw: "#0B0B0C", ink: "#F2F2F3" },
    { id: "mono-light", label: "Mono light", sw: "#F5F5F6", ink: "#16161A" }
  ];
  var ACCENTS = [
    { id: "",       hex: "#4A8FC0", label: "Blue" },
    { id: "teal",   hex: "#2FA39B", label: "Teal" },
    { id: "violet", hex: "#8B72D9", label: "Violet" },
    { id: "green",  hex: "#2E9E63", label: "Green" },
    { id: "amber",  hex: "#D2892B", label: "Amber" },
    { id: "slate",  hex: "#6B7A89", label: "Slate" }
  ];
  var FONTS = [
    { id: "",        label: "System" },
    { id: "rounded", label: "Rounded" },
    { id: "serif",   label: "Serif" },
    { id: "mono",    label: "Mono" }
  ];
  var SIZES = [
    { id: "s", label: "S" }, { id: "", label: "M" },
    { id: "l", label: "L" }, { id: "xl", label: "XL" }
  ];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function apply(a, save) {
    var r = document.documentElement;
    [["data-theme", a.theme], ["data-accent", a.accent],
     ["data-font", a.font], ["data-fs", a.fs]].forEach(function (p) {
      if (p[1]) r.setAttribute(p[0], p[1]); else r.removeAttribute(p[0]);
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var bg = getComputedStyle(r).getPropertyValue("--bg").trim();
      if (bg) meta.setAttribute("content", bg);
    }
    if (save !== false) {
      try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
    }
  }

  // Styles and the saved theme go in before first paint. Waiting for
  // DOMContentLoaded would paint the default first and then snap.
  var style = document.createElement("style");
  style.setAttribute("data-adv-theme", "");
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
  apply(load(), false);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function open() {
    var a = load();
    var ov = document.createElement("div");
    ov.className = "adv-ap-overlay";

    function draw() {
      ov.innerHTML =
        '<div class="adv-ap-card">' +
          '<div class="adv-ap-title">Appearance</div>' +
          '<div class="adv-ap-sub">Applies to every ADV page on this device.</div>' +
          '<div class="adv-ap-label">Theme</div><div class="adv-ap-grid">' +
            THEMES.map(function (t) {
              return '<button class="adv-ap-theme' + ((a.theme || "") === t.id ? " on" : "") +
                '" data-k="theme" data-v="' + t.id + '">' +
                '<span class="adv-ap-sw" style="background:' + t.sw + ';color:' + t.ink + '">Aa</span>' +
                esc(t.label) + '</button>';
            }).join("") +
          '</div>' +
          '<div class="adv-ap-label">Accent</div><div class="adv-ap-row">' +
            ACCENTS.map(function (c) {
              return '<button class="adv-ap-dot' + ((a.accent || "") === c.id ? " on" : "") +
                '" data-k="accent" data-v="' + c.id + '" title="' + esc(c.label) +
                '" style="background:' + c.hex + '"></button>';
            }).join("") +
          '</div>' +
          '<div class="adv-ap-label">Font</div><div class="adv-ap-row">' +
            FONTS.map(function (f) {
              return '<button class="adv-ap-chip' + ((a.font || "") === f.id ? " on" : "") +
                '" data-k="font" data-v="' + f.id + '">' + esc(f.label) + '</button>';
            }).join("") +
          '</div>' +
          '<div class="adv-ap-label">Text size</div><div class="adv-ap-row">' +
            SIZES.map(function (z) {
              return '<button class="adv-ap-chip' + ((a.fs || "") === z.id ? " on" : "") +
                '" data-k="fs" data-v="' + z.id + '">' + esc(z.label) + '</button>';
            }).join("") +
          '</div>' +
          '<button class="adv-ap-btn ghost" data-act="reset">Reset to default</button>' +
          '<button class="adv-ap-btn" data-act="done">Done</button>' +
        '</div>';

      ov.querySelectorAll("[data-k]").forEach(function (el) {
        el.onclick = function () { a[el.dataset.k] = el.dataset.v; apply(a); draw(); };
      });
      ov.querySelector('[data-act="reset"]').onclick = function () { a = {}; apply(a); draw(); };
      ov.querySelector('[data-act="done"]').onclick = close;
    }

    function close() { ov.remove(); document.body.style.overflow = ""; }
    ov.onclick = function (e) { if (e.target === ov) close(); };

    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    draw();
  }

  function wire() {
    document.querySelectorAll("[data-adv-appearance]").forEach(function (el) {
      if (el.__advWired) return;
      el.__advWired = true;
      el.addEventListener("click", function (e) { e.preventDefault(); open(); });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  // A page that renders its header late can call ADVTheme.wire() again.
  window.ADVTheme = { open: open, apply: apply, load: load, wire: wire };
})();
