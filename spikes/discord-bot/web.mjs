// Discord bot spike: the country page. `/oh join` answers a player with a link
// of their own; the page lists the game's countries (the taken ones with who
// plays them), and the one they pick is taken for their Discord id, as
// `/oh join country` would.
//
// The link carries the channel, the Discord id and name and an expiry, signed
// with the bot's secret (kept in the data folder, so links outlive a restart):
// it cannot be changed to pick for someone else, and it stops working after an
// hour.
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { basemapFile, basemapImage, geometry } from "./map.mjs";
import { listScenarios } from "./core.mjs";
import { worldPage } from "./view.mjs";
import { formatGameDateReadable } from "../../src/runtime/gameDates.js";
import { THEME_CSS } from "./theme.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// The game's own panels, built by panel/build.mjs.
const PANEL_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "panel", "dist");
// The library's scenarios (their covers, for the start page).
const SCENARIOS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../server/data/scenarios");
const list = (value) => (Array.isArray(value) ? value : []);
const PANEL_TYPES = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
// What the panels may read from a table's game server: the scenario's own
// files, the same for every player, read-only. Never a player's documents
// (world, game, events, chat, actions, intercepts, colors, flags: the page
// answers those from the player's view) nor the host's (advisor, prompts,
// snapshots): a page that asked the game server for those would be shown the
// host's whole game.
const SHARED_JSON = new Set(["tags", "stats", "regionsGeojson", "citiesGeojson", "backgroundData", "ownBasemapsData"]);
const sharedPath = (pathname) => {
  const json = pathname.match(/^\/api\/runtime\/json\/([A-Za-z]+)$/);
  if (json) return SHARED_JSON.has(json[1]);
  return /^\/api\/runtime\/pmtiles\/[\w-]+$/.test(pathname);
};
// A player's view, a key at a time, by a hash of each: the page is sent only
// what changed since what it holds.
const hashOf = (value) => crypto.createHash("sha1").update(JSON.stringify(value ?? null)).digest("base64url");

const LINK_MINUTES = 60;
const b64 = (text) => Buffer.from(text).toString("base64url");
const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

const secretIn = (dataRoot) => {
  const file = path.join(dataRoot, ".link-secret");
  try { return fs.readFileSync(file, "utf8").trim(); } catch { /* new */ }
  const secret = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
};

// The scenario's map as one SVG for the country page: its map image, and
// every region of every type (land, coast, mountain, ocean) as a path with its
// id and name. The page tints each by who holds it now.
const baseMaps = new Map();
export const baseMap = (scenario, basemap = "") => {
  const key = `${scenario}|${basemap}`;
  if (baseMaps.has(key)) return baseMaps.get(key);
  const geo = geometry(scenario);
  const paths = geo.regions.map((r) => `<path class="region" data-id="${escape(r.id)}" data-name="${escape(r.name)}" d="${r.d}"/>`).join("");
  const svg = paths ? `<svg id="world" viewBox="0 0 1000 1000" hidden aria-hidden="true">${basemapImage(basemap)}${paths}</svg>` : "";
  baseMaps.set(key, svg);
  return svg;
};

export const createPickPage = ({ tables, dataRoot, port = 8787, publicUrl = "", log = () => {} }) => {
  const secret = secretIn(dataRoot);
  // Each scenario's map image, made once and served to every page that draws
  // it (/basemap?s=<scenario>); "" for a scenario with none.
  const basemapPaths = new Map();
  const basemapPathOf = (id) => {
    if (!basemapPaths.has(id)) basemapPaths.set(id, listScenarios().some((entry) => entry.id === id) ? basemapFile(id, dataRoot) : "");
    return basemapPaths.get(id);
  };
  const basemapUrlOf = (id) => (basemapPathOf(id) ? `/basemap?s=${encodeURIComponent(id)}` : "");
  const base = (publicUrl || `http://localhost:${port}`).replace(/\/+$/, "");
  const sign = (body) => crypto.createHmac("sha256", secret).update(body).digest("base64url");

  // A link of one kind for one player: "pick" (the country page, an hour) or
  // "view" (the world page, a week: it is sent again every round). A link is
  // read only by the route of its own kind.
  const LINK_MINUTES_OF = { pick: LINK_MINUTES, view: 8 * 24 * 60 };
  const mint = (kind, channelId, user) => {
    const body = b64(JSON.stringify({ k: kind, c: channelId, u: user.id, n: user.name, e: Date.now() + LINK_MINUTES_OF[kind] * 60000 }));
    return `${base}/${kind === "view" ? "world" : "pick"}?t=${body}.${sign(body)}`;
  };
  const link = (channelId, user) => mint("pick", channelId, user);
  const viewLink = (channelId, user) => mint("view", channelId, user);
  const read = (token, kind = "pick") => {
    const [body, mac] = String(token ?? "").split(".");
    if (!body || !mac) return null;
    const expected = sign(body);
    if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
    const claim = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if ((claim.k ?? "pick") !== kind) return null;
    return claim.e > Date.now() ? claim : null;
  };

  const page = (title, inner) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><style>
${THEME_CSS}
body{font-size:15px;line-height:1.5}
main{max-width:1200px;margin:0 auto;padding:22px 16px 48px}
h1{font-size:1.3rem;font-weight:800;letter-spacing:-.01em;margin:.2rem 0 .3rem}
.lead{color:rgba(255,255,255,.6);font-size:.82rem;line-height:1.45;margin:0 0 14px;max-width:760px}
input[type=search]{width:100%;max-width:380px;margin-bottom:16px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;font-size:.85rem;outline:none;padding:.55rem .7rem}
input[type=search]:focus{border-color:rgba(75,145,255,.6)}
.grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,15rem),1fr));gap:.55rem}
.card{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:.3rem;width:100%;height:100%;padding:.75rem .85rem .8rem 1rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-left:4px solid var(--c,rgba(255,255,255,.3));border-radius:12px;cursor:pointer;transition:background .18s ease,border-color .18s ease}
.card:hover,.card:focus-visible{background:rgba(255,255,255,.075);border-color:rgba(255,255,255,.16);border-left-color:var(--c,rgba(255,255,255,.5))}
.card:focus-visible{outline:2px solid var(--oh-hud-blue);outline-offset:2px}
.card h2{font-size:.98rem;font-weight:800;margin:0;line-height:1.25;color:#fff}
.meta{font-size:.72rem;color:rgba(255,255,255,.5);font-weight:600}
.card p{margin:0;font-size:.78rem;line-height:1.5;color:rgba(255,255,255,.62);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.taken{opacity:.5}
.badge{align-self:flex-start;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.6);background:rgba(255,255,255,.08);padding:.12rem .4rem;border-radius:4px}
h2.section{font-size:.78rem;font-weight:700;color:rgba(255,255,255,.7);margin:1.4rem 0 .5rem}h2.section+.lead{margin-top:-.2rem}
.card.new{border-style:dashed;border-left-style:dashed;--c:rgba(245,189,79,.7);background:rgba(245,189,79,.04)}
.card.new .badge{color:#1a1405;background:var(--oh-hud-amber)}
dialog{width:min(640px,calc(100vw - 24px));max-height:calc(100vh - 24px);padding:0;background:var(--oh-surface);border:1px solid rgba(255,255,255,.09);border-radius:16px;box-shadow:0 14px 32px rgba(0,0,0,.45);color:#fff}
dialog::backdrop{background:rgba(0,0,0,.6);backdrop-filter:blur(3px)}
.sheet{padding:1.1rem 1.1rem .9rem;border-top:4px solid var(--c,var(--oh-hud-amber));border-radius:16px 16px 0 0}
.sheet h2{margin:0 0 .15rem;font-size:1.15rem;font-weight:800;letter-spacing:-.01em}
.sheet h3{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);margin:1rem 0 .3rem}
.sheet p{margin:0 0 .4rem;font-size:.84rem;line-height:1.55;color:rgba(255,255,255,.82)}
.sheet ul{margin:0;padding-left:1.1rem;font-size:.82rem;line-height:1.55;color:rgba(255,255,255,.78)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.4rem;margin-top:.8rem;font-size:.8rem}
.facts div{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:.45rem .6rem}
.facts b{display:block;font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);font-weight:700;margin-bottom:.1rem}
.actions{display:flex;gap:.5rem;justify-content:flex-end;padding:.8rem 1.1rem;border-top:1px solid rgba(255,255,255,.08);flex-wrap:wrap}
.actions button{display:inline-flex;align-items:center;min-height:2.2rem;padding:0 1rem;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:rgba(246,246,248,.92);font-size:.82rem;font-weight:600;cursor:pointer}
.actions button:hover:not(:disabled){background:rgba(255,255,255,.1)}
.actions .play{background:var(--oh-hud-amber);border-color:var(--oh-hud-amber);color:#1a1405;font-weight:700}.actions .play:hover:not(:disabled){background:var(--oh-hud-amber-hover)}
.actions .play:disabled{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.5);cursor:default}
.done{border-left:4px solid var(--oh-hud-amber);padding:1rem 1.1rem;background:var(--oh-surface);border-radius:14px;max-width:640px;box-shadow:0 14px 32px rgba(0,0,0,.45)}
.done h1{margin-top:0}.done p{color:rgba(255,255,255,.6);margin:0}.done code,.lead code{background:rgba(255,255,255,.08);padding:.05rem .3rem;border-radius:4px}
.map{margin:.9rem 0 .2rem;border-radius:10px;overflow:hidden;background:#0b1a2b;border:1px solid rgba(255,255,255,.1);aspect-ratio:16/9}
.map svg{display:block;width:100%;height:100%}
.map .region{fill:transparent;stroke:rgba(0,0,0,.55);stroke-width:var(--sw,.4);stroke-linejoin:round}
.map .own{fill:var(--c,var(--oh-hud-amber))!important;fill-opacity:.75!important;stroke:#fff;stroke-width:calc(var(--sw,.4) * 2.5)}
.create label{display:block;font-size:.78rem;font-weight:700;color:rgba(255,255,255,.7);margin:.8rem 0 0}
.create input,.create textarea{display:block;width:100%;margin-top:.3rem;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;font-size:.85rem;outline:none;padding:.55rem .7rem}
.create input:focus,.create textarea:focus{border-color:rgba(75,145,255,.6)}
.create input[type=color]{height:40px;padding:3px;max-width:110px}
.create .actions{padding:1rem 0 0;border:0}
.pick-label{font-size:.78rem;font-weight:700;color:rgba(255,255,255,.7);margin:.8rem 0 0;line-height:1.45}.pick-label .picked{font-weight:500;color:#fff}
.map.picker{aspect-ratio:1/1;max-height:420px;margin-top:.4rem}.map.picker .region{cursor:pointer}.map.picker .region:hover{fill:#fff!important;fill-opacity:.25!important;stroke:#fff}
.map.picker .grouped{stroke-dasharray:calc(var(--sw,.4) * 4) calc(var(--sw,.4) * 2.5);stroke-width:calc(var(--sw,.4) * 2)}
.map.picker .busy,.map.picker .busy:hover{fill:#000!important;fill-opacity:.55!important;cursor:not-allowed}.map.picker .chosen,.map.picker .chosen:hover{fill:var(--c,var(--oh-hud-amber))!important;fill-opacity:.8!important;stroke:#fff}
.card .flag{width:3.2rem;height:2.4rem;object-fit:contain;align-self:flex-start;border-radius:4px;background:rgba(0,0,0,.25);box-shadow:0 0 0 1px rgba(255,255,255,.12)}
.sheet .flag.big{float:right;width:5.5rem;height:4rem;object-fit:contain;margin:0 0 .5rem .8rem;border-radius:6px;background:rgba(0,0,0,.25);box-shadow:0 0 0 1px rgba(255,255,255,.15)}
.scenarios{grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))}.scenarios form{margin:0;height:100%}
.card.scenario{padding:0 0 .8rem;overflow:hidden;border-left-width:1px}.card.scenario img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:.5rem}
.card.scenario .meta,.card.scenario h2,.card.scenario p{padding:0 .9rem}
.difficulty{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,10.5rem),1fr));gap:.45rem;margin-bottom:1rem}
.level{display:block;cursor:pointer}.level input{position:absolute;opacity:0;pointer-events:none}
.level span{display:block;height:100%;padding:.55rem .7rem;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);font-size:.82rem}
.level small{display:block;color:rgba(255,255,255,.55);font-size:.72rem;margin-top:.15rem;line-height:1.35}
.level input:checked+span{background:rgba(245,189,79,.12);border-color:var(--oh-hud-amber)}.level input:focus-visible+span{outline:2px solid var(--oh-hud-blue);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.card{transition:none}}
</style></head><body><main>${inner}</main></body></html>`;

  // A number of people in words: 60000000 -> "60 million".
  const people = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)} million` : n >= 1e3 ? `${Math.round(n / 1e3)} thousand` : n ? String(n) : "");
  const colorOf = (value) => (/^#[0-9a-f]{3,8}$/i.test(value) ? value : "");

  // The start page of a game whose lead has not chosen its scenario: the
  // library's scenarios as cards, each with its cover; the one chosen is the
  // game's, and the lead goes on to their country and the difficulty.
  const scenarioPage = (claim, token) => {
    const cards = listScenarios().map((entry) => `<li><form method="post"><input type="hidden" name="t" value="${escape(token)}"><input type="hidden" name="action" value="scenario"><input type="hidden" name="scenario" value="${escape(entry.id)}">
<button class="card scenario">${entry.cover ? `<img src="/cover?s=${encodeURIComponent(entry.id)}" alt="" loading="lazy">` : ""}<span class="meta">${entry.polities} polities</span><h2>${escape(entry.name)}</h2>${entry.subtitle ? `<p>${escape(entry.subtitle)}</p>` : ""}</button></form></li>`).join("");
    return page("Choose the scenario", `<span class="oh-badge">Open Historia</span><h1>Choose the scenario</h1>
<p class="lead">${escape(claim.n)}, you are opening a game. First the world it is played in; then your country and the difficulty.</p>
<ul class="grid scenarios">${cards}</ul>`);
  };

  // The grid, and one panel filled from the card picked (the data rides in the page as JSON).
  const pickPage = (claim, token, seats) => {
    // The game's flag of a polity that has one (/flag).
    const flagUrl = (name) => `/flag?c=${encodeURIComponent(claim.c)}&n=${encodeURIComponent(name)}`;
    const card = (c, i) => {
      const p = c.profile ?? {};
      const meta = p.kind === "group"
        ? [`Group · ${p.regions ? `${p.regions} region${p.regions === 1 ? "" : "s"}` : "no area yet"}`, p.peoples?.join(", ")].filter(Boolean).join(" · ")
        : [p.kind === "faction" ? "Faction" : p.peoples?.join(", "), p.tier].filter(Boolean).join(" · ");
      return `<li><button class="card${c.player ? " taken" : ""}" data-i="${i}" style="${colorOf(p.color) ? `--c:${colorOf(p.color)}` : ""}">
${c.player ? `<span class="badge">Played by ${escape(c.player)}</span>` : ""}${c.flag ? `<img class="flag" src="${escape(flagUrl(c.name))}" alt="">` : ""}<h2>${escape(c.name)}</h2>${meta ? `<span class="meta">${escape(meta)}</span>` : ""}${p.about ? `<p>${escape(p.about)}</p>` : ""}</button></li>`;
    };
    const indexed = seats.countries.map((c, i) => [c, i]);
    // Countries only: players lead polities, not groups.
    const cards = indexed.filter(([c]) => c.profile?.kind !== "group").map(([c, i]) => card(c, i)).join("");
    // Your own country, while the game has not started.
    const create = seats.started ? "" : `<li><button class="card new" id="new-faction"><span class="badge">Your own</span><h2>Create a faction</h2><p>A government in exile, a new house, a rebel kingdom: name it and describe it. It starts with no land, or with up to five regions no country holds.</p></button></li>`;
    // The lead still choosing sets the difficulty with their country.
    const levels = seats.leadChoosing ? list(seats.difficulties?.levels) : [];
    // A table here is played for its story: the lead starts on Easy (sound
    // orders succeed, doubtful ones mostly come off), unless the game was set otherwise.
    const current = seats.difficulties?.current && seats.difficulties.current !== "medium" ? seats.difficulties.current : "easy";
    const difficulty = levels.length ? `<h2 class="section">Difficulty</h2><p class="lead">How kindly the world treats the players' orders. Easier: orders succeed more often and the world bends to the players' plans; harder: it pushes back. The lead can change it later with <code>/oh difficulty</code>.</p>
<div class="difficulty" role="radiogroup" aria-label="Difficulty">${levels.map((l) => `<label class="level"><input type="radio" name="level" value="${escape(l.id)}"${l.id === current ? " checked" : ""}><span>${escape(l.emoji)} <b>${escape(l.label)}</b><small>${escape(l.blurb)}</small></span></label>`).join("")}</div>` : "";
    const difficultyInput = levels.length ? `<input type="hidden" name="difficulty" value="${escape(current)}">` : "";
    const data = JSON.stringify(seats.countries.map((c) => ({ ...c, profile: { ...c.profile, population: people(c.profile?.population), color: colorOf(c.profile?.color) } }))).replace(/</g, "\\u003c");
    return page("Pick your country", `<span class="oh-badge">Open Historia</span><h1>Pick your side</h1>
<p class="lead">${escape(claim.n)}, the game stands at ${escape(formatGameDateReadable(seats.gameDate) || seats.gameDate)}. Click a country to read about it, or create your own; your choice is bound to your Discord account.</p>
${difficulty}
<input type="search" placeholder="Search countries, peoples..." aria-label="Search countries">
<h2 class="section">Countries</h2>
<ul class="grid">${cards}${create}</ul>
<dialog id="create-faction"><form method="post" class="sheet create"><input type="hidden" name="t" value="${escape(token)}"><input type="hidden" name="action" value="create">${difficultyInput}
<h2>Create a faction</h2><p class="lead">A country of your own. It is yours as soon as you create it.</p>
<label>Name<input name="name" required minlength="2" maxlength="40" autocomplete="off"></label>
<label>Colour<input name="color" type="color" value="#7a4e9c"></label>
<label>Description<textarea name="lore" rows="5" maxlength="1500" placeholder="Who are they, what do they believe, what do they want? The game's storyteller reads this."></textarea></label>
<input type="hidden" name="regionIds">
<p class="pick-label">Its land: none, or click up to 5 regions no country holds (the shaded ones are held). <span class="picked">None: it starts with no land.</span></p>
<div class="map picker" role="group" aria-label="Pick the faction's regions"></div>
<div class="actions"><button type="button" class="close">Back</button><button class="play">Create and play</button></div></form></dialog>
<dialog id="about"><div class="sheet"></div><form method="post" class="actions"><input type="hidden" name="t" value="${escape(token)}"><input type="hidden" name="country">${difficultyInput}
<button type="button" class="close">Back</button><button class="play">Play</button></form></dialog>
${baseMap(seats.scenario, basemapUrlOf(seats.scenario))}
<script type="application/json" id="countries">${data}</script>
<script type="application/json" id="owners">${JSON.stringify(seats.owners ?? {}).replace(/</g, "\\u003c")}</script>
<script type="application/json" id="areas">${JSON.stringify(seats.areas ?? {}).replace(/</g, "\\u003c")}</script>
<script>
const countries = JSON.parse(document.getElementById("countries").textContent);
const CHANNEL = ${JSON.stringify(String(claim.c))};
const dialog = document.getElementById("about"), sheet = dialog.querySelector(".sheet"), play = dialog.querySelector(".play");
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const items = (title, list) => list && list.length ? "<h3>" + title + "</h3><ul>" + list.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "";
const owners = JSON.parse(document.getElementById("owners").textContent);
const areas = JSON.parse(document.getElementById("areas").textContent);
const world = document.getElementById("world");
// Each holder's land in its own colour, see-through over the map image.
const tints = Object.fromEntries(countries.map((c) => [c.name, (c.profile || {}).color]).filter(([, color]) => color));
const tint = (path) => { const color = tints[owners[path.dataset.id]]; if (color) { path.style.fill = color; path.style.fillOpacity = ".35"; } };
// The map, zoomed to the country's regions (once the panel is open, so they can be measured).
const drawMap = (country, group) => {
  const holder = sheet.querySelector(".map");
  if (!holder || !world) return;
  const svg = world.cloneNode(true);
  svg.removeAttribute("id"); svg.removeAttribute("hidden");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  const own = [];
  svg.querySelectorAll(".region").forEach((path) => {
    tint(path);
    // A group holds its area within others' countries; a country owns what it holds.
    const mine = group ? areas[path.dataset.id] === country : owners[path.dataset.id] === country;
    if (mine) { path.classList.add("own"); own.push(path); }
  });
  holder.appendChild(svg);
  if (!own.length) { holder.remove(); return; }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const path of own) { const b = path.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
  const w = Math.max(x1 - x0, 40), h = Math.max(y1 - y0, 40), pad = Math.max(w, h) * 0.6;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, vw = w + pad * 2, vh = h + pad * 2;
  svg.setAttribute("viewBox", [cx - vw / 2, cy - vh / 2, vw, vh].map((n) => n.toFixed(1)).join(" "));
  svg.style.setProperty("--sw", (Math.max(vw, vh) / 600).toFixed(2));
};
const fact = (label, value) => value ? "<div><b>" + label + "</b>" + esc(value) + "</div>" : "";
document.querySelectorAll(".card[data-i]").forEach((card) => card.addEventListener("click", () => {
  const c = countries[card.dataset.i], p = c.profile || {};
  sheet.style.setProperty("--c", p.color || "");
  sheet.innerHTML = (c.flag ? '<img class="flag big" src="/flag?c=' + encodeURIComponent(CHANNEL) + "&n=" + encodeURIComponent(c.name) + '" alt="">' : "") + "<h2>" + esc(c.name) + "</h2>" + '<div class="map" role="img" aria-label="' + esc(c.name) + ' on the map"></div>'
    + (p.about ? "<h3>History</h3><p>" + esc(p.about) + "</p>" : "")
    + (p.character ? "<h3>Character</h3><p>" + esc(p.character) + "</p>" : "")
    + '<div class="facts">' + fact("Ruler", p.leader) + fact("Government", p.government) + fact("Creed", p.ideology)
    + fact("Peoples", (p.peoples || []).join(", ")) + fact("Population", p.population) + fact("Regions", p.regions ? String(p.regions) : "") + fact("Standing", p.tier) + "</div>"
    + items("Goals", p.goals) + items("Ambitions", p.ambitions) + items("Fears", p.fears);
  dialog.querySelector("[name=country]").value = c.name;
  play.disabled = Boolean(c.player);
  play.textContent = c.player ? "Played by " + c.player : "Play as " + c.name;
  dialog.showModal();
  drawMap(c.name, p.kind === "group");
}));
const creator = document.getElementById("create-faction");
// Its land: up to five regions no country holds.
const chosen = new Map();
const showChosen = () => {
  creator.querySelector("[name=regionIds]").value = [...chosen.keys()].join(",");
  creator.querySelector(".picked").textContent = chosen.size ? [...chosen.values()].join(", ") : "None: it starts with no land.";
};
const picker = creator.querySelector(".map.picker");
if (picker && world) {
  const svg = world.cloneNode(true);
  svg.removeAttribute("id"); svg.removeAttribute("hidden");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.querySelectorAll(".region").forEach((path) => {
    tint(path);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    // A region a country holds is not to be had.
    const holder = owners[path.dataset.id];
    title.textContent = path.dataset.name + (holder ? " (" + holder + ")" : ": no country holds it");
    path.appendChild(title);
    if (holder) { path.classList.add("busy"); return; }
    path.addEventListener("click", () => {
      const id = path.dataset.id;
      if (chosen.has(id)) { chosen.delete(id); path.classList.remove("chosen"); }
      else if (chosen.size < 5) { chosen.set(id, path.dataset.name); path.classList.add("chosen"); }
      showChosen();
    });
  });
  picker.appendChild(svg);
}
creator.querySelector("[name=color]").addEventListener("input", (e) => picker.style.setProperty("--c", e.target.value));
picker.style.setProperty("--c", creator.querySelector("[name=color]").value);
// The difficulty chosen goes with whichever form sends the lead's choice.
document.querySelectorAll(".difficulty input").forEach((radio) => radio.addEventListener("change", () => {
  document.querySelectorAll("input[name=difficulty]").forEach((input) => { input.value = radio.value; });
}));
document.getElementById("new-faction")?.addEventListener("click", () => creator.showModal());
creator.querySelector(".close").addEventListener("click", () => creator.close());
dialog.querySelector(".close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
document.querySelector("input[type=search]").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll(".grid li").forEach((li) => { li.hidden = !li.textContent.toLowerCase().includes(q); });
});
</script>`);
  };

  const cookieOf = (req, name) => String(req.headers.cookie ?? "").split(/;\s*/).map((part) => part.split("=")).find(([key]) => key === name)?.slice(1).join("=") ?? "";
  // A page, gzipped for a browser that takes it: a large scenario's map makes
  // a page of megabytes, which compresses to a fraction.
  const send = (res, status, html) => {
    const zipped = html.length > 32768 && /\bgzip\b/.test(String(res.req?.headers?.["accept-encoding"] ?? ""));
    res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...(zipped ? { "content-encoding": "gzip", vary: "accept-encoding" } : {}) });
    res.end(zipped ? zlib.gzipSync(html) : html);
  };
  const expired = (res) => send(res, 403, page("Link expired", `<h1>This link has expired</h1><p>Ask for a new one with <code>/oh join</code> in Discord.</p>`));

  // What a player types in the world page's chat window: a command, as in
  // Discord, or else an order for this round.
  const HELP = [
    "Anything you write is an order for this round. Send as many as you like.",
    "/ready, /unready: you are done (or not) for this round",
    "/orders: your orders this round, numbered",
    "/cancel 2: take back order 2",
    "/status: the date, the round and who is ready",
    "/model name: the lead's choice of the AI the weeks are played on (also offered on Ready)",
    "/gm text: the lead as Game Master: something the coming week must make happen, above every rule, for any country (only you see it); /gm alone lists yours",
    "/write Country: message: a letter to another player (they get it at once) or to a government (it answers when the week is played); Answer under Diplomacy replies in a conversation",
    "/help: this list",
  ].join("\n");
  const forThePage = (text) => String(text ?? "").replace(/\*\*/g, "").replace(/`/g, "").replace(/<@!?\d+>/g, "a player");
  const sayToTable = async (claim, text) => {
    if (!text) throw new Error("Write an order, or /help.");
    const user = { id: claim.u, name: claim.n };
    // The answers are written for Discord: on the page, without its marks.
    const run = async (name, options = {}) => forThePage((await tables.handle(name, { channelId: claim.c, user, options })).content);
    const [, command = "", rest = ""] = text.match(/^\/(?:oh\s+)?(\w+)\s*([\s\S]*)$/) ?? [];
    if (!command) return run("order", { text });
    switch (command.toLowerCase()) {
      case "ready": return run("ready", { value: true });
      case "unready": case "notready": return run("ready", { value: false });
      case "orders": return run("orders");
      case "cancel": case "unorder": return run("unorder", { order: rest.trim() });
      case "status": {
        // The round as the page's own status line has it, with names for the players.
        const round = await tables.roundState(claim.c, claim.u);
        return [
          `${formatGameDateReadable(round.gameDate) || round.gameDate}, round ${round.round}: ${round.phase}${round.paused ? " (paused)" : ""}${round.phase === "planning" ? `, ${Math.round(round.remainingMs / 60000) >= 120 ? `${Math.round(round.remainingMs / 3600000)} hours` : `${Math.round(round.remainingMs / 60000)} min`} left` : ""}.`,
          ...round.ready.map((p) => `${p.country}: ${p.name || "a player"}${p.you ? " (you)" : ""}${p.ready ? ", ready" : ""}`),
        ].join("\n");
      }
      case "order": return run("order", { text: rest.trim() });
      case "model": return run("model", { model: rest.trim() });
      case "gm": return run("gm", { text: rest.trim() });
      case "write": case "say": {
        const [, to = "", message = ""] = rest.match(/^([^:]+):\s*([\s\S]*)$/) ?? [];
        return run("write", { to: to.trim(), text: message.trim() });
      }
      case "help": return HELP;
      default: throw new Error(`/${command} is not a command here. /help lists them.`);
    }
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, base);
      // The scenario's map image (its art, the same for everyone).
      if (url.pathname === "/basemap" && basemapPathOf(url.searchParams.get("s") ?? "")) {
        const file = basemapPathOf(url.searchParams.get("s"));
        res.writeHead(200, { "content-type": file.endsWith(".png") ? "image/png" : "image/jpeg", "cache-control": "public, max-age=86400" });
        return fs.createReadStream(file).pipe(res);
      }
      // A polity's flag as its game shows it (public: every map shows it).
      if (url.pathname === "/flag") {
        const flag = await tables.flagOf(url.searchParams.get("c") ?? "", url.searchParams.get("n") ?? "");
        if (!flag) return send(res, 404, page("Not found", "<h1>Not found</h1>"));
        res.writeHead(200, { "content-type": flag.type, "cache-control": "public, max-age=3600" });
        return res.end(flag.bytes);
      }
      // A scenario's cover, for the start page (its art, the same for everyone).
      if (url.pathname === "/cover") {
        const entry = listScenarios().find((e) => e.id === url.searchParams.get("s") && e.cover);
        if (!entry) return send(res, 404, page("Not found", "<h1>Not found</h1>"));
        const bytes = fs.readFileSync(path.join(SCENARIOS_DIR, entry.id, "cover-image.bin"));
        const type = bytes.subarray(0, 4).toString("hex") === "89504e47" ? "image/png" : bytes.subarray(8, 12).toString() === "WEBP" ? "image/webp" : "image/jpeg";
        res.writeHead(200, { "content-type": type, "cache-control": "public, max-age=86400" });
        return res.end(bytes);
      }
      // The world page's chat window: its round state, and what the player types
      // there (an order, or a command as in Discord), with the same link.
      if (url.pathname === "/world/state" || url.pathname === "/world/say" || url.pathname === "/world/models") {
        const claim = read(url.searchParams.get("t"), "view");
        const reply = (status, body) => { res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
        if (!claim) return reply(403, { ok: false, text: "This link has expired. Ask for a new one with My map in Discord." });
        try {
          if (url.pathname === "/world/state") return reply(200, { ok: true, state: await tables.roundState(claim.c, claim.u) });
          // The lead's model picker: every model the bot's keys reach (core.mjs modelCatalog checks the lead).
          if (url.pathname === "/world/models") return reply(200, { ok: true, catalog: await tables.modelCatalog(claim.c, claim.u) });
          if (req.method !== "POST") return reply(405, { ok: false, text: "Not allowed." });
          let body = "";
          for await (const chunk of req) {
            body += chunk;
            if (body.length > 8192) throw new Error("That is too long.");
          }
          const sent = JSON.parse(body || "{}");
          const text = String(sent.text ?? "").trim();
          // An answer in a diplomacy thread goes into that thread; anything
          // else is an order or a command.
          const thread = String(sent.thread ?? "").trim();
          if (thread && !text) throw new Error("Write your answer first.");
          const said = thread
            ? (await tables.handle("reply", { channelId: claim.c, user: { id: claim.u, name: claim.n }, options: { thread, text } })).content
            : await sayToTable(claim, text);
          return reply(200, { ok: true, text: said });
        } catch (error) {
          return reply(200, { ok: false, text: String(error?.message || error) });
        }
      }
      // The game's own panels: their files, and what they read and ask.
      if (url.pathname.startsWith("/panel/")) {
        const file = path.resolve(PANEL_DIR, "." + decodeURIComponent(url.pathname.slice("/panel".length)));
        if (!file.startsWith(PANEL_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { "content-type": PANEL_TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "public, max-age=300" });
        return fs.createReadStream(file).pipe(res);
      }
      if (url.pathname === "/world/view" || url.pathname === "/world/request") {
        const claim = read(url.searchParams.get("t"), "view");
        const reply = (status, body) => { res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
        if (!claim) return reply(403, { ok: false, error: "This link has expired. Ask for a new one with My map in Discord." });
        if (req.method !== "POST") return reply(405, { ok: false, error: "Not allowed." });
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 65536) return reply(413, { ok: false, error: "That is too long." });
        }
        const sent = JSON.parse(body || "{}");
        if (url.pathname === "/world/request") return reply(200, await tables.panelRequest(claim.c, claim.u, { t: sent.t, fields: sent.fields }));
        try {
          const { view } = await tables.worldView(claim.c, claim.u);
          const held = sent.hashes && typeof sent.hashes === "object" ? sent.hashes : {};
          const docs = {}, hashes = {};
          for (const [key, value] of Object.entries(view)) {
            const hash = hashOf(value);
            if (held[key] !== hash) { docs[key] = value; hashes[key] = hash; }
          }
          return reply(200, { ok: true, docs, hashes });
        } catch (error) {
          return reply(200, { ok: false, error: String(error?.message || error) });
        }
      }
      // The scenario's own files, for the panels, from the game server of the
      // table this browser's world page is for (its cookie); nothing else.
      if (url.pathname.startsWith("/api/")) {
        const claim = read(cookieOf(req, "oh_world"), "view");
        if (!claim || req.method !== "GET" || !sharedPath(url.pathname)) {
          res.writeHead(req.method === "GET" ? 404 : 204, { "content-type": "application/json", "cache-control": "no-store" });
          return res.end(req.method === "GET" ? JSON.stringify({ error: "Not here." }) : "");
        }
        try {
          const origin = await tables.originOf(claim.c);
          const upstream = await fetch(origin + url.pathname + url.search, { headers: req.headers.range ? { range: req.headers.range } : {} });
          const headers = { "cache-control": "no-store" };
          for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) if (upstream.headers.get(name)) headers[name] = upstream.headers.get(name);
          res.writeHead(upstream.status, headers);
          return res.end(Buffer.from(await upstream.arrayBuffer()));
        } catch {
          res.writeHead(502); return res.end();
        }
      }
      // The world page: the game as this player's government knows it.
      if (url.pathname === "/world" && req.method === "GET") {
        const claim = read(url.searchParams.get("t"), "view");
        if (!claim) return send(res, 403, page("Link expired", `<h1>This link has expired</h1><p>Ask for a new one with <code>/oh view</code> in Discord.</p>`));
        let world;
        try {
          world = await tables.worldView(claim.c, claim.u);
        } catch (error) {
          return send(res, 403, page("Not in the game", `<h1>Not in the game</h1><p>${escape(error?.message || error)}</p>`));
        }
        // The panels' reads of the scenario's files carry no link: this says which table they are for.
        res.setHeader("set-cookie", `oh_world=${url.searchParams.get("t")}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=604800`);
        // The panels' build, by when it was made: their address changes with
        // each build, so a browser never keeps running an old one.
        const panels = fs.existsSync(path.join(PANEL_DIR, "panel.js")) ? String(Math.round(fs.statSync(path.join(PANEL_DIR, "panel.js")).mtimeMs)) : "";
        return send(res, 200, worldPage({ ...world, geo: geometry(world.scenario), basemap: basemapUrlOf(world.scenario), panels, hashes: Object.fromEntries(Object.entries(world.view).map(([key, value]) => [key, hashOf(value)])) }));
      }
      if (url.pathname !== "/pick") return send(res, 404, page("Not found", "<h1>Not found</h1>"));
      if (req.method === "GET") {
        const claim = read(url.searchParams.get("t"));
        if (!claim) return expired(res);
        const opening = tables.opening(claim.c);
        if (opening) {
          if (opening.id !== claim.u) return send(res, 409, page("Not open yet", `<h1>Not open yet</h1><p>The game's lead is still choosing its scenario. Ask for a new link with <code>/oh join</code> once they have.</p>`));
          return send(res, 200, scenarioPage(claim, url.searchParams.get("t")));
        }
        const seats = await tables.seats(claim.c);
        const mine = seats.playerOf(claim.u);
        if (mine) return send(res, 200, page("Your country", `<div class="done"><h1>You play ${escape(mine)}</h1><p>Back to Discord: send orders with <code>/oh order</code>.</p></div>`));
        return send(res, 200, pickPage(claim, url.searchParams.get("t"), seats));
      }
      if (req.method === "POST") {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 8192) throw new Error("too long");
        }
        const form = new URLSearchParams(body);
        const claim = read(form.get("t"));
        if (!claim) return expired(res);
        const user = { id: claim.u, name: claim.n };
        let side = form.get("country");
        const difficulty = form.get("difficulty") ?? "";
        try {
          if (form.get("action") === "scenario") {
            await tables.handle("scenario", { channelId: claim.c, user, options: { scenario: form.get("scenario") } });
            res.writeHead(303, { location: `/pick?t=${encodeURIComponent(form.get("t"))}` });
            return res.end();
          }
          if (form.get("action") === "create") {
            await tables.handle("create", { channelId: claim.c, user, options: { name: form.get("name"), color: form.get("color"), lore: form.get("lore"), regionIds: String(form.get("regionIds") ?? "").split(",").filter(Boolean).slice(0, 5), difficulty } });
            side = (await tables.seats(claim.c)).playerOf(claim.u) || form.get("name");
          } else {
            await tables.handle("join", { channelId: claim.c, user, options: { country: side, difficulty } });
          }
        } catch (error) {
          return send(res, 409, page("Not taken", `<h1>Not taken</h1><p>${escape(error?.message || error)}</p><p><a href="/pick?t=${escape(form.get("t"))}">Back to the list</a></p>`));
        }
        return send(res, 200, page("Your country", `<div class="done"><h1>You play ${escape(side)}</h1><p>Back to Discord: send orders with <code>/oh order</code>, then <code>/oh ready</code>.</p></div>`));
      }
      send(res, 405, page("Not allowed", "<h1>Not allowed</h1>"));
    } catch (error) {
      log(`country page: ${error?.message || error}`);
      send(res, 400, page("Something went wrong", `<h1>Something went wrong</h1><p>${escape(error?.message || error)}</p>`));
    }
  });

  return {
    link,
    viewLink,
    listen: () => new Promise((resolve) => server.listen(port, () => { log(`country page on port ${port}, links to ${base}`); resolve(); })),
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
};
