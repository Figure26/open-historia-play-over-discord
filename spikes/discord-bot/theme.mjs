// Discord bot spike: the pages dressed as the game is (src/styles.css and the
// game's panels): dark only, Segoe UI, the HUD's glass for what floats over the
// map and the library's flat dark grey for a page of its own, pill buttons,
// the segmented tab control, small uppercase badges, blue and amber accents.
export const THEME_CSS = `
:root{
  --oh-hud-bg:rgba(18,18,20,.52);--oh-hud-bg-strong:rgba(17,17,19,.66);--oh-hud-bg-soft:rgba(34,34,38,.46);
  --oh-hud-border:rgba(236,236,238,.17);--oh-hud-border-strong:rgba(240,240,242,.29);
  --oh-hud-text:#f8f8f9;--oh-hud-muted:rgba(233,233,236,.64);--oh-hud-faint:rgba(233,233,236,.38);
  --oh-hud-blue:#4b91ff;--oh-hud-blue-soft:rgba(75,145,255,.16);--oh-hud-amber:#f5bd4f;--oh-hud-amber-hover:#ffd06d;--oh-hud-red:#ef4444;
  --oh-grey-bg:#131315;--oh-grey-surface:#1b1b1e;--oh-grey-raised:#232327;--oh-grey-selected:#0e0e10;
  --oh-grey-border:rgba(255,255,255,.1);--oh-grey-border-strong:rgba(255,255,255,.22);
  --oh-grey-text:#e7e7ea;--oh-grey-muted:rgba(231,231,234,.6);--oh-grey-faint:rgba(231,231,234,.38);
  --oh-surface:#12141a;--oh-green:#4ade80;
  --oh-hud-shadow:0 20px 56px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.12),inset 0 -1px 0 rgba(255,255,255,.03);
  --oh-hud-shadow-soft:0 10px 28px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.1);
  --oh-hud-blur:blur(14px) saturate(1.18);
  color-scheme:dark;scrollbar-color:rgba(255,255,255,.16) transparent;
}
*{box-sizing:border-box;scrollbar-width:thin}*:hover{scrollbar-color:rgba(255,255,255,.28) transparent}
html,body{margin:0}
body{background:var(--oh-grey-bg);color:#f6f6f7;font-family:"Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
button,input,textarea,select{font-family:inherit}
:focus-visible{outline:2px solid var(--oh-hud-blue);outline-offset:2px}
.oh-glass{background:var(--oh-hud-bg-strong);backdrop-filter:var(--oh-hud-blur);-webkit-backdrop-filter:var(--oh-hud-blur);border:1px solid var(--oh-hud-border);border-radius:18px;box-shadow:var(--oh-hud-shadow);color:#fff}
.oh-surface{background:var(--oh-surface);border:1px solid rgba(255,255,255,.09);border-radius:16px;box-shadow:0 14px 32px rgba(0,0,0,.45)}
.oh-badge{display:inline-block;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.55);background:rgba(255,255,255,.08);padding:.15rem .45rem;border-radius:4px}
.oh-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;min-height:2.2rem;padding:0 1rem;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:rgba(246,246,248,.92);font-size:.82rem;font-weight:600;cursor:pointer;transition:background .18s ease,border-color .18s ease}
.oh-btn:hover:not(:disabled){background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2)}
.oh-btn:disabled{opacity:.45;cursor:default}
.oh-btn.primary{background:var(--oh-hud-amber);border-color:var(--oh-hud-amber);color:#1a1405}.oh-btn.primary:hover:not(:disabled){background:var(--oh-hud-amber-hover);border-color:var(--oh-hud-amber-hover)}
.oh-btn.go{background:rgba(74,222,128,.16);border-color:rgba(74,222,128,.5);color:#d8ffe5}
.oh-tabs{display:flex;flex-wrap:wrap;background:rgba(0,0,0,.35);padding:3px;border-radius:10px;border:1px solid rgba(255,255,255,.1);gap:2px}
.oh-tabs button{border:0;border-radius:7px;background:transparent;color:rgba(255,255,255,.6);font-size:.8rem;font-weight:700;padding:.4rem .85rem;cursor:pointer}
.oh-tabs button:hover{color:#fff}.oh-tabs button[aria-selected=true]{background:rgba(255,255,255,.14);color:#fff}
.oh-input{background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;font-size:.85rem;outline:none;padding:.55rem .7rem}
.oh-input:focus{border-color:rgba(75,145,255,.6)}
.oh-input::placeholder{color:rgba(255,255,255,.38)}
`;
