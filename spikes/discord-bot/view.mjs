// Discord bot spike: the world page. A player's own link shows the game as it
// stands for them: the map (who holds what, the groups' areas, the cities, the
// units they can see), and everything else of their projection of the game
// (projection.js projectForViewer) - their country, the news with its event
// cards, every polity, their threads and orders, the wars, agreements,
// institutions and intelligence. Read-only: nothing on it changes the game.
//
// Only `view` (that player's projection) feeds it, so it never shows more than
// they would see in the game.
import { THEME_CSS } from "./theme.mjs";
import { formatGameDateReadable } from "../../src/runtime/gameDates.js";
import { PALETTE, basemapImage, colorOf, disputes, escape, eventFocus, focusOverlay, paintedPaths, project, unitMarks, warMarks } from "./map.mjs";
import { battlefieldsFor, eventForces } from "./fronts.mjs";
// The game's own map rules, plain modules: a marker's look, a unit's short name.
import { getMarkerPresentation } from "../../src/Game/Map/vnext/presentationPolicy.js";
import { markerStatusOpacity } from "../../src/Game/Map/markerFeatures.js";
import { shortUnitLabel } from "../../src/Game/Map/unitLabels.js";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = (value) => (Array.isArray(value) ? value : []);
const json = (value) => JSON.stringify(value ?? null).replace(/</g, "\\u003c");

const fold = (value) => clean(value).toLowerCase();

// The cities as this game has them: renamed and re-peopled where it says so
// (world.cityRenames is keyed by the old name in lower case, as the game's map
// reads it, Game/Map/cityLayerExpressions.js), and a capital wherever a
// polity's figures name it its capital now, besides the scenario's own.
const citiesOf = (geo, world) => {
  const renames = new Map(Object.entries(world?.cityRenames ?? {}).map(([from, to]) => [fold(from), clean(to)]));
  const people = world?.cityPopulations ?? {};
  const dissolved = (name) => fold(world?.polityOverrides?.[name]?.status) === "dissolved";
  const capitals = new Set(Object.entries(world?.countryStats ?? {}).filter(([name]) => !dissolved(name)).map(([, stats]) => fold(stats?.capital)).filter(Boolean));
  return geo.cities.map((c) => {
    const name = renames.get(fold(c.name)) || c.name;
    return { name, population: Number(people[name] ?? people[c.name]) || c.population, capital: c.capital || capitals.has(fold(name)), tier: c.tier, x: +c.x.toFixed(1), y: +c.y.toFixed(1) };
  });
};

// The game's markers (a city it founded, a fort, a training ground), as its
// map draws them (Game/Map/MarkersLayer.jsx): the kind's glyph in the owner's
// colour, faded by its state, shown from the zoom its importance allows.
const markersOf = (view) => list(view?.world?.markers).filter((m) => m?.name && Number.isFinite(m.lng) && Number.isFinite(m.lat)).map((m) => {
  const [x, y] = project(m.lng, m.lat);
  const look = getMarkerPresentation(m);
  return { name: clean(m.name), kind: clean(m.kind) || "landmark", owner: clean(m.ownerCode), note: clean(m.note), status: clean(m.status),
    glyph: look.glyph, tier: look.visibilityTier, opacity: markerStatusOpacity(m.status), color: m.ownerCode ? colorOf(view, m.ownerCode) : "#d4d4d8", x: +x.toFixed(1), y: +y.toFixed(1) };
});

// The units as the game's map draws them (Game/Map/Units.jsx): a disc in the
// owner's colour with the type's letter, a ring for what it is doing, its
// name, and the line to where it is ordered or the ring of its patrol. A
// formation committed to an open battlefield is drawn there with its troops,
// not here (isAtTheFront).
const TYPE_GLYPH = { infantry: "I", armor: "A", air: "F", naval: "N", artillery: "G", garrison: "C" };
const unitsOf = (view, openFronts) => {
  const atFront = new Set(openFronts.map((b) => fold(b?.name)).filter(Boolean));
  return list(view?.world?.units).filter((u) => Number.isFinite(u?.lng) && Number.isFinite(u?.lat) && !atFront.has(fold(u.committedTo)))
    .map((u) => { const [x, y] = project(u.lng, u.lat); return { ...u, x: +x.toFixed(1), y: +y.toFixed(1), color: colorOf(view, u.ownerCode), glyph: TYPE_GLYPH[u.type] ?? "I", label: shortUnitLabel(u.name) }; });
};
// A unit's standing order: the dashed line to its objective, or its patrol's ring.
const ordersOf = (view, units) => {
  const byId = new Map(units.map((u) => [clean(u.id), u]));
  return list(view?.world?.pendingUnitOrders).flatMap((o) => {
    const u = byId.get(clean(o?.unitId));
    if (!u || !Number.isFinite(o?.toLng) || !Number.isFinite(o?.toLat)) return [];
    if (o.kind === "patrol" && o.radiusKm > 0) {
      const ring = Array.from({ length: 49 }, (_, i) => {
        const a = (i / 48) * 2 * Math.PI, dLat = (o.radiusKm / 6371) * (180 / Math.PI);
        return project(o.toLng + (dLat * Math.sin(a)) / Math.max(0.05, Math.cos((o.toLat * Math.PI) / 180)), o.toLat + dLat * Math.cos(a)).map((n) => n.toFixed(1)).join(" ");
      });
      return [{ kind: "station", color: u.color, d: "M" + ring.join("L") + "Z" }];
    }
    const [x, y] = project(o.toLng, o.toLat);
    return [{ kind: "heading", color: u.color, d: `M${u.x} ${u.y}L${x.toFixed(1)} ${y.toFixed(1)}` }];
  });
};

// `basemap` is the address of the scenario's map image ("" for none).
// `war` is the war as this seat's map shows it (spikes/headless/war.mjs): the
// battlefields' ground, troops and advances, the sea battles, the blockades.
// `fronts` are the fronts' reports (fronts.mjs), every week's: the news has
// them with the events.
// `panels`: the build of the game's own panels (panel/build.mjs), "" for none, and
// `hashes` what the page's copy of each view document is, so they are sent
// only what changes.
export const worldPage = ({ view, seat, geo, basemap = "", war = null, fronts: reports = [], panels = false, hashes = {}, days = 0, title = "Open Historia" }) => {
  const world = view.world ?? {};
  // Each event's card: where it frames the map and what it marks there (drawn
  // for a card about 420 pixels wide), with the battlefields of its war; and
  // the formations it is about.
  const cards = {};
  const forces = {};
  for (const event of [...list(view.events), ...list(reports)]) {
    const fields = battlefieldsFor(event, list(war?.battlefields));
    const focus = eventFocus(geo, view, event, { fields });
    if (focus) {
      const scale = focus.viewBox[2] / 420;
      const marks = warMarks(fields, scale);
      cards[event.id] = { viewBox: focus.viewBox.map((n) => +n.toFixed(1)), overlay: marks.under + focusOverlay(geo, focus, scale) + unitMarks(view, event, focus.viewBox, scale, { fields }) + marks.over };
    }
    const troops = eventForces(view, event);
    if (troops.length) forces[event.id] = troops;
  }
  const units = unitsOf(view, list(war?.battlefields));
  const unitOrders = ordersOf(view, units);
  const colors = Object.fromEntries(Object.values(world.polityOverrides ?? {}).map((p) => [clean(p?.name), colorOf(view, p?.name)]));
  for (const name of Object.keys(world.groups ?? {})) colors[name] ??= colorOf(view, name);
  // Group areas drawn over the land, hatched in the group's colour.
  const groupPaths = Object.entries(world.groupAreas ?? {}).filter(([id]) => geo.byId.has(id))
    .map(([id, group]) => `<path class="area" data-id="${escape(id)}" data-group="${escape(group)}" fill="url(#hatch-${escape(Object.keys(world.groups ?? {}).indexOf(group))})" stroke="${colors[group] ?? PALETTE.ink}" d="${geo.byId.get(id).d}"/>`).join("");
  const hatches = Object.keys(world.groups ?? {}).map((name, i) => `<pattern id="hatch-${i}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="none"/><line x1="0" y1="0" x2="0" y2="6" stroke="${colors[name]}" stroke-width="2.4"/></pattern>`).join("");
  const disputed = disputes(geo, view);
  // The seat's own flag, as the game shows it (view.flags: polity -> image).
  const flagOfSeat = Object.entries(view.flags ?? {}).find(([key]) => clean(key).toLocaleLowerCase() === clean(seat).toLocaleLowerCase())?.[1] ?? "";
  // The war: drawn as the game's map draws it, in map units.
  const xy = ([lng, lat]) => project(lng, lat).map((n) => +n.toFixed(2));
  const ring = (points) => `M${points.map((p) => xy(p).join(" ")).join("L")}Z`;
  const line = (points) => `M${points.map((p) => xy(p).join(" ")).join("L")}`;
  const fronts = list(war?.battlefields);
  const warSvg = [
    // Each battlefield's ground, as its holders' colours over the land.
    ...fronts.filter((b) => b.ground).map((b) => {
      const [x0, y0] = xy([b.corners[0], b.corners[1]]), [x1, y1] = xy([b.corners[2], b.corners[3]]);
      return `<image class="ground" href="data:image/png;base64,${b.ground}" x="${x0}" y="${y0}" width="${(x1 - x0).toFixed(2)}" height="${(y1 - y0).toFixed(2)}" preserveAspectRatio="none"/>`;
    }),
    // The advances: the way walked, then the arrow of the last days.
    ...fronts.flatMap((b) => list(b.arrows).map((f) => (f.geometry.type === "Polygon"
      ? `<path class="arrow" d="${ring(f.geometry.coordinates[0])}" fill="${escape(f.properties.rgb)}" stroke="${escape(f.properties.dark)}" fill-opacity="${(0.9 * (f.properties.alpha ?? 1)).toFixed(2)}"/>`
      : `<path class="way" d="${line(f.geometry.coordinates)}" fill="none" stroke="${escape(f.properties.rgb)}" stroke-opacity="${(0.55 * (f.properties.alpha ?? 1)).toFixed(2)}"/>`))),
    // The blockades: the water each blockading fleet closes.
    ...list(war?.blockades?.rings).map((f) => `<path class="blockade" d="${ring(f.geometry.coordinates[0])}" fill="none"/>`),
  ].join("");
  const troops = fronts.flatMap((b) => list(b.troops).map((f) => {
    const [x, y] = xy(f.geometry.coordinates);
    return { x, y, battlefield: b.name, owner: f.properties.owner, color: f.properties.rgb, kind: f.properties.kind, glyph: f.properties.glyph, strength: f.properties.strength, state: f.properties.state, label: f.properties.label };
  }));
  const generals = fronts.flatMap((b) => list(b.generals).map((f) => {
    const [x, y] = xy(f.geometry.coordinates);
    return { x, y, battlefield: b.name, owner: f.properties.owner, color: f.properties.rgb, count: f.properties.count, strength: f.properties.strength, name: f.properties.general, at: f.properties.at, doing: f.properties.doing };
  }));
  const seaBattles = list(war?.seaBattles).map((f) => { const [x, y] = xy(f.geometry.coordinates); return { x, y, tone: f.properties.tone, label: f.properties.label, fresh: f.properties.fresh }; });
  const data = {
    panels, hashes, days,
    seat, view, cards, forces, fronts: list(reports), units, unitOrders, generals, markers: markersOf(view), colors, troops, seaBattles, fields: fronts.map((b) => ({ name: b.name, sides: b.sides, status: b.status, troops: list(b.troops).length })),
    cities: citiesOf(geo, world),
    regions: Object.fromEntries(geo.regions.map((r) => [r.id, { name: r.name, type: r.typeName, box: r.box.map((n) => +n.toFixed(1)) }])),
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}: ${escape(seat)}</title><style>
${THEME_CSS}
:root{--sea:${PALETTE.sea}}
html,body{height:100%;overflow:hidden}
nav .unread{display:inline-flex;align-items:center;justify-content:center;min-width:1.15rem;height:1.15rem;padding:0 .3rem;margin-left:.35rem;border-radius:999px;background:#3b82f6;color:#fff;font-size:.66rem;font-weight:800;line-height:1;vertical-align:1px}nav .unread[hidden]{display:none}
:root{--oh-right-drawer-safe-offset:448px}.statspane{margin:-.2rem -.2rem 0}body{font-size:14px;line-height:1.5}
#mapbox{position:fixed;inset:0;background:#000;overflow:hidden;touch-action:none}
#map{width:100%;height:100%;display:block;cursor:default}#map.drag,#map.drag *{cursor:grabbing!important}
#map .city,#map .unit{cursor:pointer}
#map .region,#map .dispute{stroke-linejoin:round}#map #base .region{pointer-events:all}
#map #areas,#map #disputes,#map .ground,#map .arrow,#map .way,#map .blockade{pointer-events:none}
#map #hover{fill:none;stroke:#fff;stroke-linejoin:round;pointer-events:none}
#map .sel{stroke:#fff;stroke-width:calc(2.5px * var(--k));fill-opacity:.85}
#map .city circle{fill:rgba(232,236,238,.96);stroke:rgba(7,10,14,.96)}#map .city.t1 circle{fill:rgba(186,198,207,.8)}#map .city.capital circle{fill:rgba(228,185,61,.99)}
#map text{font-family:"Open Sans","Segoe UI",system-ui,sans-serif;font-weight:600;fill:rgba(247,246,240,.96);stroke:rgba(8,12,18,.9);paint-order:stroke;stroke-linejoin:round;pointer-events:none}
#map .city text{display:none}#map.z1 .city.t1 text,#map.z2 .city.t2 text,#map.z3 .city text,#map .city.capital text{display:inline}
#map .unit circle{fill-opacity:.92}#map .unit.pending circle{fill-opacity:.32}#map .unit.covert{opacity:.6}
#map .unit .glyph{fill:#fff;stroke:rgba(0,0,0,.65);paint-order:stroke;font-weight:700}
#map .unit .name{display:none;fill:#fff;stroke:rgba(0,0,0,.85);paint-order:stroke;font-weight:700}#map.z2 .unit .name{display:inline}
#map #unitorders path{fill:none;pointer-events:none}#map #unitorders .heading{stroke-dasharray:calc(4px * var(--k)) calc(3px * var(--k))}
#map .marker{cursor:pointer}#map .marker .glyph{stroke:rgba(5,8,12,.92);paint-order:stroke;font-weight:700;pointer-events:auto}
#map .marker .glyph,#map .marker .name{display:none}#map .marker.strategic .glyph,#map.z1 .marker.regional .glyph,#map.z2 .marker.local .glyph{display:inline}
#map.z1 .marker.strategic .name,#map.z2 .marker.regional .name,#map.z3 .marker.local .name{display:inline}
.hud{position:fixed;z-index:5}
header.hud{left:12px;top:12px;display:flex;align-items:center;gap:.6rem;padding:.55rem .9rem .55rem .7rem;max-width:calc(100vw - 470px)}
header .chip{width:1.1rem;height:1.1rem;border-radius:4px;margin:0;box-shadow:0 0 0 1px rgba(255,255,255,.15)}
header .flag{width:2rem;height:1.5rem;object-fit:contain;border-radius:3px;background:rgba(0,0,0,.25);box-shadow:0 0 0 1px rgba(255,255,255,.15)}
.flagchip{display:inline-block;width:1.25em;height:.95em;object-fit:contain;margin-right:6px;vertical-align:-.12em;border-radius:2px;background:rgba(0,0,0,.25)}
#panel .flag.big{float:right;width:5rem;height:3.75rem;object-fit:contain;margin:0 0 .5rem .7rem;border-radius:6px;background:rgba(0,0,0,.25);box-shadow:0 0 0 1px rgba(255,255,255,.15)}
header h1{font-size:1rem;font-weight:800;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
header span{color:var(--oh-hud-muted);font-size:.74rem;white-space:nowrap}
.zoom{right:448px;top:12px;display:flex;flex-direction:column;gap:6px}
.zoom button{width:2.4rem;height:2.4rem;border-radius:12px;font-size:1.05rem;cursor:pointer;color:#fff;background:var(--oh-hud-bg-strong);backdrop-filter:var(--oh-hud-blur);-webkit-backdrop-filter:var(--oh-hud-blur);border:1px solid var(--oh-hud-border);box-shadow:var(--oh-hud-shadow-soft)}
.zoom button:hover{background:rgba(40,40,44,.75)}
#map #base .region.held{fill-opacity:var(--fill,.55)}
#map.no-countries #base .region.held{fill-opacity:0}#map.no-war #war{display:none}
#map .ground{opacity:.7;image-rendering:pixelated}#map .way{stroke-dasharray:calc(3px * var(--k)) calc(2px * var(--k));stroke-width:calc(1.4px * var(--k))}
#map .arrow{stroke-width:calc(.8px * var(--k));stroke-linejoin:round}#map .blockade{stroke:#f5bd4f;stroke-dasharray:calc(6px * var(--k)) calc(4px * var(--k));stroke-width:calc(1.6px * var(--k))}
#map .troop{cursor:pointer;display:none}#map.z2 .troop{display:inline}#map.z3 .general{display:none}
#map .general{cursor:pointer}#map .general circle{stroke:#fff;fill-opacity:.95}#map .general text{fill:#fff;stroke:rgba(0,0,0,.7);paint-order:stroke;font-weight:700}
#map .general .gname{display:none}#map.z1 .general .gname{display:inline}
#map .troop{cursor:pointer}#map .troop rect{stroke:rgba(7,10,14,.96)}#map .troop.advancing rect{stroke:#fff}
#map .seabattle{cursor:pointer}#map .seabattle circle{stroke:rgba(7,10,14,.96)}#map .seabattle.own circle{fill:#4ade80}#map .seabattle.enemy circle{fill:#ef4444}#map .seabattle.other circle{fill:#f5bd4f}#map .seabattle.old{opacity:.55}
#map .seabattle text{fill:#111;stroke:none;font-weight:700}#map.no-groups #areas,#map.no-disputes #disputes,#map.no-cities #cities,#map.no-cities #markers,#map.no-units #units,#map.no-units #unitorders{display:none}
.filters{left:12px;top:64px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:calc(100vw - 470px)}
.filters .oh-tabs{background:var(--oh-hud-bg-strong);backdrop-filter:var(--oh-hud-blur);-webkit-backdrop-filter:var(--oh-hud-blur);border-color:var(--oh-hud-border);box-shadow:var(--oh-hud-shadow-soft);border-radius:12px}
.filters .oh-tabs button{font-size:.74rem;padding:.35rem .7rem}
.filters button[aria-pressed=true],.filters button[aria-expanded=true]{background:rgba(255,255,255,.14);color:#fff}
.filters button[aria-pressed=false]{color:rgba(255,255,255,.4);text-decoration:line-through;text-decoration-color:rgba(255,255,255,.3)}
#opacity{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;padding:.5rem .8rem;border-radius:12px;font-size:.76rem;color:var(--oh-hud-muted)}
#opacity[hidden]{display:none}#opacity input{width:180px;accent-color:var(--oh-hud-amber)}#opacity output{min-width:2.6rem;color:#fff;font-weight:700;text-align:right}
.legend{left:12px;bottom:12px;display:flex;gap:.8rem;flex-wrap:wrap;padding:.4rem .7rem;font-size:.72rem;color:var(--oh-hud-muted);border-radius:12px}
.legend i{display:inline-block;width:14px;height:10px;margin-right:5px;vertical-align:-1px;border:1px solid rgba(255,255,255,.35);border-radius:2px}
.legend .front{background:linear-gradient(90deg,#ef4444 0 50%,#4b91ff 50%)}.legend .swords{background:#f5bd4f;border-radius:50%}
.legend .hatch{background:repeating-linear-gradient(45deg,rgba(255,255,255,.7) 0 2px,transparent 2px 5px)}.legend .stripe{background:repeating-linear-gradient(45deg,#ef4444 0 3px,#4b91ff 3px 6px)}
aside.hud{right:12px;top:12px;bottom:12px;width:424px;display:flex;flex-direction:column;overflow:hidden}
nav{margin:.6rem .6rem 0}
#panel{flex:1;overflow:auto;padding:.9rem 1rem 1.2rem}
#panel h2{font-size:1.15rem;font-weight:800;letter-spacing:-.01em;margin:0 0 .15rem}
#panel h3{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);margin:1rem 0 .35rem}
#panel p{margin:0 0 .45rem;color:rgba(255,255,255,.85)}#panel ul{margin:0;padding-left:1.1rem;color:rgba(255,255,255,.8)}
.muted{color:rgba(255,255,255,.5);font-size:.78rem}
.chip{display:inline-block;width:.8em;height:.8em;border-radius:3px;margin-right:6px;vertical-align:-.05em;box-shadow:0 0 0 1px rgba(255,255,255,.2)}
a.link{color:#9cc2ff;cursor:pointer;text-decoration:none;font-weight:600}a.link:hover{color:#fff;text-decoration:underline;text-underline-offset:2px}
.item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.55rem .7rem;margin:0 0 .45rem;font-size:.82rem;color:rgba(255,255,255,.75)}
.item b{display:block;color:#fff;font-size:.84rem}
dl{display:grid;grid-template-columns:auto 1fr;gap:.1rem .7rem;margin:.35rem 0 0;font-size:.76rem}dt{color:rgba(255,255,255,.45)}dd{margin:0;overflow-wrap:anywhere;color:rgba(255,255,255,.82)}
.event{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;margin:0 0 .6rem;overflow:hidden}
.event .body{padding:.6rem .75rem .7rem}.event b{display:block;font-size:.86rem;color:#fff;margin:.1rem 0 .2rem}
.event .body p{font-size:.78rem;line-height:1.55;color:rgba(255,255,255,.66)!important}
.event svg{display:block;width:100%;aspect-ratio:16/9;background:#0b1a2b}.event .meta{font-size:.68rem;color:rgba(255,255,255,.42);font-weight:600}
.event.major{border-left:3px solid var(--oh-hud-amber)}
.event.found{outline:2px solid var(--oh-hud-amber);outline-offset:-2px;animation:oh-found 1.6s ease-out}
@keyframes oh-found{from{background:rgba(245,189,79,.22)}to{background:rgba(255,255,255,.04)}}
@media (prefers-reduced-motion:reduce){.event.found{animation:none}}.secret{font-size:.62rem;font-weight:700;text-transform:uppercase;color:var(--oh-hud-amber)}
.bar{height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;margin:.3rem 0}.bar i{display:block;height:100%;background:var(--oh-hud-blue)}
.reader-top{display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin:0 0 .5rem;font-size:.8rem}.reader-top .step{min-width:2.4rem;min-height:2.2rem;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:1.1rem;font-weight:800;cursor:pointer}.reader-top .step[disabled]{opacity:.35;cursor:default}.reader-back{margin:-.2rem 0 .5rem;text-align:center;font-size:.8rem}.reader-count{margin:0 0 .5rem;font-size:.8rem}
.linkbtn{background:none;border:0;padding:0;color:var(--oh-hud-blue);font:inherit;cursor:pointer;text-decoration:underline}
.reader-nav{display:flex;gap:.5rem;margin:.7rem 0 .2rem}.reader-nav button{flex:1;min-height:2.6rem;border-radius:9px;border:1px solid var(--oh-hud-amber);background:var(--oh-hud-amber);color:#1a1405;font-size:.88rem;font-weight:800;cursor:pointer}
.reader-nav button.quiet{flex:0 0 auto;padding:0 1rem;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff}.reader-nav button[disabled]{opacity:.4;cursor:default}
#week footer{flex-wrap:wrap}#week footer .grow{flex:1}#week footer button[hidden]{display:none}
.sheet h4{margin:.9rem 0 .3rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7}.meter{display:grid;grid-template-columns:1fr auto;column-gap:.5rem;margin:.25rem 0}.meter span{font-size:.9rem}.meter b{font-variant-numeric:tabular-nums}.meter em{font-style:normal;font-weight:400}.meter .bar{grid-column:1/-1;margin:.15rem 0 0}
.msg{margin:0 0 .35rem}.msg b{display:inline}
#console{border-top:1px solid var(--oh-hud-border);padding:.7rem .8rem .8rem;display:flex;flex-direction:column;gap:.5rem;max-height:46%;min-height:190px;background:rgba(0,0,0,.18)}
.cstatus{font-size:.74rem;color:var(--oh-hud-muted);line-height:1.45}.cstatus b{color:#fff;font-size:.8rem}
.cready{display:flex;flex-wrap:wrap;gap:.3rem;font-size:.68rem}.cready span{padding:.12rem .45rem;border-radius:999px;border:1px solid rgba(255,255,255,.14);color:var(--oh-hud-muted)}
.cready b{font-weight:700;color:rgba(255,255,255,.45);align-self:center;margin-right:.1rem}.cready span.on{border-color:rgba(74,222,128,.5);background:rgba(74,222,128,.12);color:#d8ffe5}
.cheading{font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-top:.15rem}.ccount{color:var(--oh-hud-amber)}
.corders{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.3rem;max-height:34%;overflow:auto;counter-reset:order}
.corders li{counter-increment:order;display:flex;align-items:flex-start;gap:.5rem;padding:.4rem .5rem;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:.8rem;line-height:1.4;color:rgba(255,255,255,.9)}
.corders li::before{content:counter(order);flex:none;min-width:1.25rem;height:1.25rem;border-radius:6px;background:rgba(245,189,79,.16);color:var(--oh-hud-amber);font-size:.68rem;font-weight:800;display:flex;align-items:center;justify-content:center}
.corders li span{flex:1;min-width:0;overflow-wrap:anywhere}
.corders li.new{border-color:rgba(245,189,79,.6);animation:oh-order-in .9s ease-out}
@keyframes oh-order-in{from{background:rgba(245,189,79,.22)}to{background:rgba(255,255,255,.05)}}
@media (prefers-reduced-motion:reduce){.corders li.new{animation:none}}
.corders button{flex:none;border:0;background:none;color:rgba(255,255,255,.35);cursor:pointer;font-size:.8rem;padding:0 .2rem;line-height:1.4}.corders button:hover{color:var(--oh-hud-red)}
.corders:empty{display:none}.cempty{margin:0;font-size:.74rem;color:rgba(255,255,255,.38)}.cempty[hidden]{display:none}
.clog{flex:1;overflow:auto;font-size:.76rem;line-height:1.45;min-height:0}.clog:empty{display:none}.clog p{margin:0 0 .35rem;white-space:pre-wrap}
.clog .you{color:#fff}.clog .you::before{content:"› ";color:var(--oh-hud-amber)}.clog .bot{color:var(--oh-hud-muted)}.clog .err{color:#fca5a5}
.cinput{display:flex;gap:.5rem;align-items:flex-end}
.cinput textarea{flex:1;resize:vertical;min-height:2.6rem;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;font-size:.85rem;outline:none;padding:.55rem .7rem}
.cinput textarea:focus{border-color:rgba(75,145,255,.6)}.cinput textarea::placeholder{color:rgba(255,255,255,.38)}
.cbuttons{display:flex;flex-direction:column;gap:.35rem}
.cbuttons button{min-height:2.1rem;padding:0 .9rem;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:rgba(246,246,248,.92);font-size:.8rem;font-weight:700;cursor:pointer}
.cbuttons button:hover{background:rgba(255,255,255,.1)}
.cbuttons .send{background:var(--oh-hud-amber);border-color:var(--oh-hud-amber);color:#1a1405}.cbuttons .send:hover{background:var(--oh-hud-amber-hover)}
.cbuttons .ready.is{background:rgba(74,222,128,.16);border-color:rgba(74,222,128,.55);color:#d8ffe5}
.cmodel{display:flex;align-items:center;gap:.4rem;font-size:.72rem;color:var(--oh-hud-muted)}.cmodel[hidden]{display:none}.cmodel b{color:#fff;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cmodel button{flex:none;margin-left:auto;min-height:1.7rem;padding:0 .65rem;border-radius:7px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:.72rem;font-weight:700;cursor:pointer}.cmodel button:hover{background:rgba(255,255,255,.12)}
#models{position:fixed;inset:0;z-index:1001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6)}#models[hidden]{display:none}
#models .sheet{background:#12161d;box-shadow:0 18px 60px rgba(0,0,0,.6);width:min(760px,100%);height:min(88vh,860px);display:flex;flex-direction:column;border-radius:16px;overflow:hidden;animation:oh-week-in .3s ease-out}
@media (prefers-reduced-motion:reduce){#models .sheet{animation:none}}
#models header{position:static;display:block;max-width:none;padding:1rem 1.1rem .8rem;border-bottom:1px solid var(--oh-hud-border)}
#models .kicker{font-size:.66rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--oh-hud-amber)}
#models h2{margin:.1rem 0 .15rem;font-size:1.3rem;font-weight:800;color:#fff;white-space:normal}#models header p{margin:0 0 .7rem;font-size:.78rem;color:var(--oh-hud-muted);white-space:normal}
#models input[type=search]{width:100%;box-sizing:border-box;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.16);border-radius:10px;color:#fff;font-size:.9rem;padding:.6rem .8rem;outline:none}#models input[type=search]:focus{border-color:rgba(245,189,79,.7)}
#models .chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.6rem}
#models .chips button{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:var(--oh-hud-muted);border-radius:999px;padding:.25rem .65rem;font-size:.72rem;font-weight:700;cursor:pointer}
#models .chips button[aria-pressed=true]{border-color:rgba(245,189,79,.7);background:rgba(245,189,79,.14);color:#fff}#models .chips span{opacity:.6;font-weight:600;margin-left:.25rem}
#models .list{flex:1;overflow:auto;padding:.4rem 1rem 1rem}
#models h3{margin:.9rem 0 .4rem;font-size:.66rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5)}
#models .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.4rem}
#models label{display:flex;align-items:flex-start;gap:.55rem;padding:.5rem .6rem;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);cursor:pointer;font-size:.74rem;line-height:1.4;color:rgba(255,255,255,.75)}
#models label:hover{background:rgba(255,255,255,.08)}#models label:has(input:checked){border-color:rgba(245,189,79,.75);background:rgba(245,189,79,.11)}
#models label .txt{display:grid;gap:.1rem;min-width:0}
#models label input{appearance:none;-webkit-appearance:none;flex:none;width:14px;height:14px;margin:.15rem 0 0;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:transparent;cursor:pointer}#models label input:checked{border-color:var(--oh-hud-amber);background:var(--oh-hud-amber);box-shadow:inset 0 0 0 2px #12161d}#models label input:focus-visible{outline:2px solid rgba(245,189,79,.7);outline-offset:2px}#models label b{color:#fff;font-size:.82rem;overflow-wrap:anywhere}
#models .id{font-family:ui-monospace,monospace;font-size:.66rem;color:rgba(255,255,255,.45);overflow-wrap:anywhere}#models .when{color:rgba(255,255,255,.55)}
#models .plus::before{content:"+ ";color:#4ade80;font-weight:700}#models .minus::before{content:"− ";color:#fca5a5;font-weight:700}
#models .tag{justify-self:start;font-size:.6rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:.05rem .4rem;border-radius:999px;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.55)}#models .tag.tried{border-color:rgba(74,222,128,.45);color:#86efac}#models .tag.now{border-color:rgba(245,189,79,.6);color:var(--oh-hud-amber)}#models .tag.no{border-color:rgba(248,113,113,.5);color:#fca5a5}
#models .note{font-size:.76rem;color:var(--oh-hud-muted);margin:.4rem 0}#models .note.err{color:#fca5a5}
#models .loading{display:inline-block;width:.8em;height:.8em;margin-right:.4rem;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:var(--oh-hud-amber);vertical-align:-.1em;animation:oh-spin .9s linear infinite}@keyframes oh-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#models .loading{animation:none}}
#models footer{display:flex;align-items:center;gap:.5rem;padding:.7rem 1rem;border-top:1px solid var(--oh-hud-border)}#models footer .chosen{flex:1;min-width:0;font-size:.74rem;color:var(--oh-hud-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#models footer .chosen b{color:#fff}
#models footer button{flex:none;min-height:2.3rem;padding:0 1.1rem;border-radius:9px;border:1px solid var(--oh-hud-amber);background:var(--oh-hud-amber);color:#1a1405;font-size:.84rem;font-weight:800;cursor:pointer}#models footer button.quiet{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff}
@media (max-width:760px){#models{padding:8px}#models .sheet{height:92vh}#models .grid{grid-template-columns:1fr}#models footer{flex-wrap:wrap}#models footer .chosen{flex-basis:100%}}
#week{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.55)}
#week[hidden]{display:none}
#week .sheet{background:#12161d;box-shadow:0 18px 60px rgba(0,0,0,.6);width:min(580px,100%);max-height:min(86vh,900px);display:flex;flex-direction:column;border-radius:16px;overflow:hidden;animation:oh-week-in .35s ease-out}
@keyframes oh-week-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){#week .sheet{animation:none}}
#week header{position:static;padding:1rem 1.1rem .7rem;border-bottom:1px solid var(--oh-hud-border)}
#week .kicker{font-size:.66rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--oh-hud-amber)}
#week h2{margin:.1rem 0 .1rem;font-size:1.35rem;font-weight:800;color:#fff}#week header p{margin:0;font-size:.78rem;color:var(--oh-hud-muted)}
#week .list{flex:1;overflow:auto;padding:.8rem 1rem}#week footer{display:flex;justify-content:flex-end;gap:.5rem;padding:.7rem 1rem;border-top:1px solid var(--oh-hud-border)}
#week footer button{min-height:2.3rem;padding:0 1.1rem;border-radius:9px;border:1px solid var(--oh-hud-amber);background:var(--oh-hud-amber);color:#1a1405;font-size:.84rem;font-weight:800;cursor:pointer}
#week footer button.quiet{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff}
.event .forces{font-size:.74rem!important}.event strong{color:#fff;font-weight:700}
.event.front{border-left:3px solid #d35400}.event.fresh .meta::after{content:" · new";color:var(--oh-hud-amber)}
@media (max-width:760px){
  #week{padding:8px}#week .sheet{max-height:92vh}
  header.hud{max-width:calc(100vw - 24px);right:auto}header span{display:none}
  .filters{max-width:calc(100vw - 70px)}
  .zoom{right:12px;top:64px}
  aside.hud{left:8px;right:8px;top:auto;bottom:8px;width:auto;height:56vh}
  .legend{bottom:calc(56vh + 16px)}
}
</style>${panels ? `<link rel="stylesheet" href="/panel/panel.css?v=${escape(panels)}">` : ""}</head><body>
<div id="mapbox">
<svg id="map" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><defs>${hatches}${disputed.defs}</defs>
<rect x="-1000" y="-1000" width="3000" height="3000" fill="#000"/>
<g id="world"><rect width="1000" height="1000" fill="${PALETTE.sea}"/>${basemapImage(basemap)}<g id="base">${paintedPaths(geo, view)}</g><g id="disputes">${disputed.paths}</g></g><g id="areas">${groupPaths}</g><g id="war">${warSvg}<g id="troops"></g><g id="generals"></g><g id="seabattles"></g></g><path id="hover" d=""/><g id="cities"></g><g id="markers"></g><g id="unitorders"></g><g id="units"></g></svg>
<div class="legend oh-glass hud"><span><i class="hatch"></i>a group's area</span>${disputed.paths ? '<span><i class="stripe"></i>disputed</span>' : ""}${fronts.length ? '<span><i class="front"></i>battlefield</span>' : ""}${seaBattles.length ? '<span><i class="swords"></i>sea battle</span>' : ""}</div>
<div class="zoom hud"><button id="zin" aria-label="Zoom in">+</button><button id="zout" aria-label="Zoom out">−</button><button id="zall" aria-label="Whole map">⤢</button></div>
</div>
<header class="oh-glass hud">${flagOfSeat ? `<img class="flag" src="${escape(flagOfSeat)}" alt="">` : `<span class="chip" style="background:${escape(colorOf(view, seat))}"></span>`}<h1>${escape(seat)}</h1><span>${escape(formatGameDateReadable(view.game?.gameDate) || (view.game?.gameDate ?? ""))} · round ${escape(view.game?.round ?? "")}</span></header>
<div class="filters hud">
<div class="oh-tabs" role="toolbar" aria-label="What the map shows">
<button type="button" data-layer="countries" aria-pressed="true">Countries</button><button type="button" data-layer="groups" aria-pressed="true">Groups</button><button type="button" data-layer="disputes" aria-pressed="true">Disputes</button><button type="button" data-layer="cities" aria-pressed="true">Cities</button><button type="button" data-layer="units" aria-pressed="true">Units</button><button type="button" data-layer="war" aria-pressed="true">War</button><button type="button" class="opacity-toggle" aria-expanded="false" aria-controls="opacity">Opacity</button>
</div>
<div id="opacity" class="oh-glass" hidden><label for="fill">Country colour</label><input id="fill" type="range" min="0" max="100" step="5" value="55"><output for="fill">55%</output><label for="borders">Borders</label><input id="borders" type="range" min="0" max="100" step="5" value="100"><output for="borders">100%</output></div>
</div>
<aside class="oh-glass hud"><nav class="oh-tabs" role="tablist"></nav><div id="panel"></div>
<section id="console" aria-label="Orders and commands">
<div class="cstatus" aria-live="polite"></div>
<div class="cready"></div>
<div class="cmodel" hidden>Played on <b></b><button type="button">Choose the AI</button></div>
<div class="cheading">Your orders this week <span class="ccount"></span></div>
<ol class="corders" aria-live="polite"></ol>
<p class="cempty">No orders yet. Write one below: each is carried out when the week is played. /help lists the commands.</p>
<div class="clog" aria-live="polite"></div>
<form class="cinput"><textarea rows="2" maxlength="1500" placeholder="Write an order for this week. Enter sends, Shift+Enter for a new line." aria-label="Order or command"></textarea>
<div class="cbuttons"><button type="submit" class="send">Send</button><button type="button" class="ready">Ready</button></div></form>
</section></aside>
<div id="models" role="dialog" aria-modal="true" aria-labelledby="models-title" hidden><div class="sheet oh-glass"><header><div class="kicker">You lead this game</div><h2 id="models-title">Which AI plays the weeks</h2><p>Every model your keys reach. Those tried in this game show what one week cost and took; the others have not been tried here.</p><input type="search" placeholder="Search models: a name, a maker, an id" aria-label="Search models"><div class="chips" role="toolbar" aria-label="Which models"></div></header><div class="list" role="radiogroup" aria-labelledby="models-title"></div><footer><span class="chosen"></span><button type="button" class="quiet" data-models-cancel>Cancel</button><button type="button" data-models-go>Use this model</button></footer></div></div>
<div id="week" role="dialog" aria-modal="true" aria-labelledby="week-title" hidden><div class="sheet oh-glass"><header><div class="kicker">Next week</div><h2 id="week-title"></h2><p></p></header><div class="list"></div><footer><button type="button" class="quiet" data-week-news>All the news</button><span class="grow"></span><button type="button" class="quiet" data-week-prev>Previous</button><button type="button" data-week-next>Next event</button><button type="button" data-week-close>To the map</button></footer></div></div>
<script type="application/json" id="data">${json(data)}</script>
<script>${CLIENT}</script></body></html>`;
};

// The page's own script: pan and zoom, what a click shows, and the tabs.
const CLIENT = String.raw`
// The game's own panels (panel/entry.jsx), once they have loaded.
let ohPanels = null;
const D = JSON.parse(document.getElementById("data").textContent);
const V = D.view, W = V.world || {}, seat = D.seat;
const svg = document.getElementById("map"), hoverPath = document.getElementById("hover"), panel = document.getElementById("panel"), nav = document.querySelector("nav");
const NS = "http://www.w3.org/2000/svg";
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const arr = (v) => Array.isArray(v) ? v : [];
const same = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase() && String(a ?? "").trim() !== "";
const num = (n) => Number(n || 0).toLocaleString("en");
// A game date as the game writes it for players (runtime/gameDates.js
// formatGameDateReadable): "19 February 354", never the stored 0354-02-19. In
// a longer text, every such date in it.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const GAME_DATE = /(^|[^\d-])(-?)(\d{1,6})-(\d{2})-(\d{2})(?![\d])/g;
const day = (v) => String(v ?? "").replace(GAME_DATE, (all, lead, minus, y, m, d) => (+m >= 1 && +m <= 12
  ? lead + (+d) + " " + MONTHS[+m - 1] + " " + (minus ? (+y) + " BC" : +y)
  : all));
// A polity's flag as the game shows it (view.flags), else its colour.
const FLAGS = Object.fromEntries(Object.entries(V.flags || {}).map(([key, url]) => [String(key).trim().toLowerCase(), url]));
const flagOf = (name) => FLAGS[String(name ?? "").trim().toLowerCase()] || "";
const chip = (name) => flagOf(name) ? '<img class="flagchip" src="' + esc(flagOf(name)) + '" alt="">' : '<span class="chip" style="background:' + esc(D.colors[name] || "#999") + '"></span>';
const polity = (name) => name ? chip(name) + '<a class="link" data-polity="' + esc(name) + '">' + esc(name) + "</a>" : '<span class="muted">no one</span>';
const owners = W.regionOwnershipOverrides || {}, areas = W.groupAreas || {};

// ---- generic records: every field, for what has no view of its own ----
const SKIP = new Set(["createdAt", "updatedAt", "sourceEventIds", "createdRound", "updatedRound", "generationProvenance"]);
const short = (v) => {
  if (v == null || v === "") return "";
  if (Array.isArray(v)) return day(v.map((x) => typeof x === "object" ? (x.name || x.title || x.id || JSON.stringify(x)) : x).join(", "));
  if (typeof v === "object") return day(Object.entries(v).filter(([, x]) => x !== "" && x != null && typeof x !== "object").map(([k, x]) => k + ": " + x).join(" · ") || "");
  return day(String(v));
};
const record = (o, titleKeys = ["title", "name", "id"]) => {
  const title = titleKeys.map((k) => o?.[k]).find(Boolean) || "";
  const rows = Object.entries(o || {}).filter(([k, v]) => !SKIP.has(k) && !titleKeys.includes(k) && short(v) !== "")
    .map(([k, v]) => "<dt>" + esc(k.replace(/([A-Z])/g, " $1").toLowerCase()) + "</dt><dd>" + esc(short(v)).slice(0, 1200) + "</dd>").join("");
  return '<div class="item"><b>' + esc(title) + "</b>" + (rows ? "<dl>" + rows + "</dl>" : "") + "</div>";
};
const section = (title, items, fn = (o) => record(o)) => items.length ? "<h3>" + esc(title) + "</h3>" + items.map(fn).join("") : "";

// ---- a country's stat sheet, for a player to read (not every field of it) ----
// A large figure in words: 300,750,000 is "300.8 million".
const big = (n) => { const v = Number(n); if (!Number.isFinite(v)) return ""; const a = Math.abs(v);
  return a >= 1e9 ? (v / 1e9).toFixed(1) + " billion" : a >= 1e6 ? (v / 1e6).toFixed(1) + " million" : num(Math.round(v)); };
const signed = (n) => (Number(n) > 0 ? "+" : "") + n + "%";
const meter = (label, value, note = "") => Number.isFinite(Number(value)) ? '<div class="meter"><span>' + esc(label) + "</span><b>" + esc(Math.round(Number(value))) + (note ? '<em class="muted">' + esc(note) + "</em>" : "") + '</b><div class="bar"><i style="width:' + Math.max(0, Math.min(100, Number(value))) + '%"></i></div></div>' : "";
const facts = (rows) => { const kept = rows.filter(([, v]) => v !== undefined && v !== null && v !== ""); return kept.length ? "<dl>" + kept.map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("") + "</dl>" : ""; };
const statsCard = (s, name) => {
  const e = s.economy || {}, p = s.population || {}, g = s.gdpBreakdown || {}, ix = s.indices || {}, m = s.military || {};
  const held = Object.values(owners).filter((o) => same(o, name)).length;
  const debt = Number(e.publicDebt), budget = Number(e.budgetBalance);
  return '<div class="item sheet">'
    + facts([["Ruler", s.leader], ["Government", s.government], ["Capital", s.capital], ["Where", s.continent],
      ["People", p.total ? num(p.total) + (held ? " in " + held + " regions" : "") : ""]])
    + meter("Stability", s.stability)
    + "<h4>Wealth</h4>"
    + facts([["Output a year", e.gdp ? big(e.gdp) + (e.gdpPerCapita ? " (" + num(e.gdpPerCapita) + " a head)" : "") : ""],
      ["Coin", e.currency], ["Growth", Number.isFinite(Number(e.gdpGrowth)) ? signed(e.gdpGrowth) + " a year" : ""],
      ["Prices", Number.isFinite(Number(e.inflation)) ? signed(e.inflation) + " a year" : ""],
      ["Treasury", Number.isFinite(budget) ? (budget >= 0 ? "a surplus of " + budget + "%" : "a deficit of " + Math.abs(budget) + "%") + " of output" : ""],
      ["Debt", Number.isFinite(debt) ? debt + "% of a year's output" + (debt >= 50 ? ", heavy" : debt >= 25 ? ", notable" : debt === 0 ? ", none" : "") : ""],
      ["Out of work", Number.isFinite(Number(e.unemployment)) ? e.unemployment + "%" : ""]])
    + (g.agriculture !== undefined ? "<h4>What it lives on</h4>" + meter("Farming", g.agriculture, "%") + meter("Crafts and mining", g.industry, "%") + meter("Trade and services", g.services, "%") : "")
    + (Object.keys(ix).length ? "<h4>Standing</h4>" + meter("Independence", ix.sovereignty) + meter("Order at home", ix.internalSecurity) + meter("Reputation abroad", ix.internationalReputation)
      + meter("Feeds itself", ix.foodAutonomy) + meter("Fuel of its own", ix.energyAutonomy) + meter("Economic independence", ix.economicIndependence) : "")
    + (Object.keys(m).length ? "<h4>Arms</h4>" + meter("Troop quality", m.quality) + meter("Arms and craft", m.technology) + meter("Army", m.land) + meter("Navy", m.sea) + meter("Air", m.air) + meter("War chest", m.spending)
      + (Number.isFinite(Number(m.manpowerShare)) ? '<p class="muted">' + esc(m.manpowerShare) + "% of its people can be put under arms.</p>" : "") : "")
    + '<p class="muted">Each figure out of 100 is measured against the rest of the world.</p></div>';
};
const valuesOf = (v) => Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v.byId || v.byPolity || v) : [];

// ---- the map: pan, zoom, cities, units ----
let vb = [0, 0, 1000, 1000];
const fit = () => { // every region, not the empty edge
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of Object.values(D.regions)) { x0 = Math.min(x0, r.box[0]); y0 = Math.min(y0, r.box[1]); x1 = Math.max(x1, r.box[2]); y1 = Math.max(y1, r.box[3]); }
  frame([x0, y0, x1, y1], 20);
};
// The part of the window the floating panel leaves the map (beside it on a wide
// screen, above it on a phone), in pixels.
const open_area = () => {
  const W = svg.clientWidth || 1000, H = svg.clientHeight || 700, aside = document.querySelector("aside");
  const r = aside ? aside.getBoundingClientRect() : { left: W, top: H, width: 0, height: 0 };
  return W > 760 ? { x: 0, y: 0, w: Math.max(200, r.left - 12), h: H } : { x: 0, y: 0, w: W, h: Math.max(160, r.top - 8) };
};
// Show a box of the map (map units) whole in that part, "pad" units around it.
const frame = (box, pad = 0) => {
  const W = svg.clientWidth || 1000, H = svg.clientHeight || 700, a = open_area();
  const bw = box[2] - box[0] + pad * 2, bh = box[3] - box[1] + pad * 2;
  const s = Math.max(bw / a.w, bh / a.h);
  const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
  vb = [cx - (a.x + a.w / 2) * s, cy - (a.y + a.h / 2) * s, W * s, H * s]; apply();
};
const apply = () => {
  svg.setAttribute("viewBox", vb.map((n) => n.toFixed(2)).join(" "));
  const px = svg.clientWidth || 800, k = Math.max(vb[2] / px, vb[3] / (svg.clientHeight || 600));
  svg.style.setProperty("--k", k);
  svg.classList.toggle("z1", k < 0.9); svg.classList.toggle("z2", k < 0.5); svg.classList.toggle("z3", k < 0.28);
  for (const g of svg.querySelectorAll(".city")) {
    const c = g.firstChild, t = g.lastChild, cap = g.classList.contains("capital");
    c.setAttribute("r", (cap ? 4.5 : 3) * k); c.setAttribute("stroke-width", k);
    t.setAttribute("font-size", (cap ? 13 : 11) * k); t.setAttribute("stroke-width", 3 * k); t.setAttribute("y", +c.getAttribute("cy") - 6 * k);
  }
  for (const g of svg.querySelectorAll(".unit")) {
    const [c, glyph, name] = g.children, y = +g.dataset.y, small = g.classList.contains("covert") || g.classList.contains("pending");
    c.setAttribute("r", (small ? 4.5 : 6) * k); c.setAttribute("stroke-width", 1.6 * k);
    glyph.setAttribute("font-size", 7 * k); glyph.setAttribute("stroke-width", k); glyph.setAttribute("y", y + 2.5 * k);
    name.setAttribute("font-size", 9 * k); name.setAttribute("stroke-width", 2.4 * k); name.setAttribute("y", y + 15 * k);
  }
  for (const p of svg.querySelectorAll("#unitorders path")) p.setAttribute("stroke-width", 1.4 * k);
  for (const g of svg.querySelectorAll(".marker")) {
    const [glyph, name] = g.children, y = +g.dataset.y;
    glyph.setAttribute("font-size", 13 * k); glyph.setAttribute("stroke-width", 2.4 * k); glyph.setAttribute("y", y + 4.5 * k);
    name.setAttribute("font-size", 10 * k); name.setAttribute("stroke-width", 2.6 * k); name.setAttribute("y", y + 16 * k);
  }
  for (const p of svg.querySelectorAll("#base .region, #areas .area, #disputes .dispute")) p.setAttribute("stroke-width", 0.8 * k);
  hoverPath.setAttribute("stroke-width", 1.6 * k);
  for (const g of svg.querySelectorAll(".troop")) {
    const r = g.firstChild, x = +g.dataset.x, y = +g.dataset.y;
    r.setAttribute("x", x - 3 * k); r.setAttribute("y", y - 3 * k); r.setAttribute("width", 6 * k); r.setAttribute("height", 6 * k); r.setAttribute("stroke-width", 0.8 * k);
  }
  for (const g of svg.querySelectorAll(".general")) {
    const [c, count, name] = g.children, y = +g.dataset.y;
    c.setAttribute("r", 7.5 * k); c.setAttribute("stroke-width", 1.6 * k);
    count.setAttribute("font-size", 8 * k); count.setAttribute("stroke-width", k); count.setAttribute("y", y + 2.8 * k);
    name.setAttribute("font-size", 9.5 * k); name.setAttribute("stroke-width", 2.6 * k); name.setAttribute("y", y + 18 * k);
  }
  for (const g of svg.querySelectorAll(".seabattle")) {
    const c = g.firstChild, t = g.lastChild, y = +g.dataset.y;
    c.setAttribute("r", 9 * k); c.setAttribute("stroke-width", 1.4 * k); t.setAttribute("font-size", 11 * k); t.setAttribute("y", y + 4 * k);
  }
};
const citiesG = document.getElementById("cities"), unitsG = document.getElementById("units");
D.cities.forEach((c, i) => {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "city t" + c.tier + (c.capital ? " capital" : "")); g.dataset.i = i;
  const dot = document.createElementNS(NS, "circle"); dot.setAttribute("cx", c.x); dot.setAttribute("cy", c.y);
  const label = document.createElementNS(NS, "text"); label.setAttribute("x", c.x); label.setAttribute("text-anchor", "middle"); label.textContent = c.name;
  g.append(dot, label); citiesG.append(g);
});
// A unit's ring says what it is doing (Units.jsx): moving, engaged, waiting
// for the week to resolve it, or a contact nobody has confirmed.
const RING = { pending: "#93c5fd", moving: "#ffd24a", engaged: "#ff6b6b" };
const text = (cls, x, value) => { const t = document.createElementNS(NS, "text"); t.setAttribute("class", cls); t.setAttribute("x", x); t.setAttribute("text-anchor", "middle"); t.textContent = value; return t; };
D.units.forEach((u, i) => {
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "unit" + (u.status === "pending" ? " pending" : "") + (u.covert ? " covert" : "")); g.dataset.u = i; g.dataset.x = u.x; g.dataset.y = u.y;
  const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", u.x); c.setAttribute("cy", u.y); c.setAttribute("fill", u.color);
  c.setAttribute("stroke", u.covert ? "#e4e4e7" : RING[u.status] || "#ffffff");
  g.append(c, text("glyph", u.x, u.glyph), text("name", u.x, u.label)); unitsG.append(g);
});
const ordersG = document.getElementById("unitorders"), markersG = document.getElementById("markers");
D.unitOrders.forEach((o) => {
  const p = document.createElementNS(NS, "path"); p.setAttribute("class", o.kind); p.setAttribute("d", o.d); p.setAttribute("stroke", o.color); p.setAttribute("stroke-opacity", o.kind === "station" ? 0.7 : 0.85); ordersG.append(p);
});
D.markers.forEach((m, i) => {
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "marker " + m.tier); g.dataset.m = i; g.dataset.x = m.x; g.dataset.y = m.y; g.style.opacity = m.opacity;
  const glyph = text("glyph", m.x, m.glyph); glyph.style.fill = m.color;
  g.append(glyph, text("name", m.x, m.name)); markersG.append(g);
});
const troopsG = document.getElementById("troops"), seaG = document.getElementById("seabattles");
D.troops.forEach((t, i) => {
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "troop" + (t.state === "advancing" ? " advancing" : "")); g.dataset.t = i; g.dataset.x = t.x; g.dataset.y = t.y;
  const r = document.createElementNS(NS, "rect"); r.setAttribute("fill", t.color); g.append(r); troopsG.append(g);
});
// The generals: each leads a side's body of troops on a battlefield.
const generalsG = document.getElementById("generals");
D.generals.forEach((gl, i) => {
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "general"); g.dataset.g = i; g.dataset.x = gl.x; g.dataset.y = gl.y;
  const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", gl.x); c.setAttribute("cy", gl.y); c.setAttribute("fill", gl.color);
  const count = document.createElementNS(NS, "text"); count.setAttribute("x", gl.x); count.setAttribute("text-anchor", "middle"); count.textContent = gl.count;
  const name = document.createElementNS(NS, "text"); name.setAttribute("class", "gname"); name.setAttribute("x", gl.x); name.setAttribute("text-anchor", "middle"); name.textContent = gl.name || "";
  g.append(c, count, name); generalsG.append(g);
});
D.seaBattles.forEach((b, i) => {
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "seabattle " + b.tone + (b.fresh ? "" : " old")); g.dataset.s = i; g.dataset.x = b.x; g.dataset.y = b.y;
  const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", b.x); c.setAttribute("cy", b.y);
  const t = document.createElementNS(NS, "text"); t.setAttribute("x", b.x); t.setAttribute("text-anchor", "middle"); t.textContent = "⚔";
  g.append(c, t); seaG.append(g);
});
const zoomAt = (f, cx, cy) => {
  const w = Math.min(1200, Math.max(20, vb[2] * f)), h = vb[3] * (w / vb[2]);
  vb = [cx - (cx - vb[0]) * (w / vb[2]), cy - (cy - vb[1]) * (h / vb[3]), w, h]; apply();
};
const toMap = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
svg.addEventListener("wheel", (e) => { e.preventDefault(); const p = toMap(e); zoomAt(e.deltaY > 0 ? 1.2 : 1 / 1.2, p.x, p.y); }, { passive: false });
let drag = null, moved = false;
// The region under the pointer is outlined in white over everything else, held
// or not: the group areas, the disputes and the war's ground above it let the
// pointer through to it.
svg.addEventListener("pointerover", (e) => {
  const region = e.target?.closest?.("#base .region");
  hoverPath.setAttribute("d", region && !drag ? region.getAttribute("d") : "");
});
svg.addEventListener("pointerleave", () => hoverPath.setAttribute("d", ""));
svg.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, vb: [...vb] }; moved = false; svg.setPointerCapture(e.pointerId); });
svg.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; svg.classList.add("drag"); }
  const s = drag.vb[2] / svg.clientWidth; vb = [drag.vb[0] - dx * s, drag.vb[1] - dy * s, drag.vb[2], drag.vb[3]]; apply();
});
svg.addEventListener("pointerup", (e) => {
  svg.classList.remove("drag"); const was = drag; drag = null;
  if (!was || moved) return;
  const target = document.elementFromPoint(e.clientX, e.clientY);
  const city = target?.closest?.(".city"), unit = target?.closest?.(".unit"), path = target?.closest?.("path[data-id]"), marker = target?.closest?.(".marker");
  const troop = target?.closest?.(".troop"), sea = target?.closest?.(".seabattle"), general = target?.closest?.(".general");
  if (sea) showSeaBattle(D.seaBattles[sea.dataset.s]); else if (general) showGeneral(D.generals[general.dataset.g]); else if (troop) showTroop(D.troops[troop.dataset.t]);
  else if (marker) showMarker(D.markers[marker.dataset.m]);
  else if (city) showCity(D.cities[city.dataset.i]); else if (unit) showUnit(D.units[unit.dataset.u]); else if (path) showRegion(path.dataset.id);
});
const center = (box) => { const w = Math.max(box[2] - box[0], 60), h = Math.max(box[3] - box[1], 60), cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2; frame([cx - w * 0.8, cy - h * 0.8, cx + w * 0.8, cy + h * 0.8]); };
document.getElementById("zin").onclick = () => zoomAt(1 / 1.5, vb[0] + vb[2] / 2, vb[1] + vb[3] / 2);
document.getElementById("zout").onclick = () => zoomAt(1.5, vb[0] + vb[2] / 2, vb[1] + vb[3] / 2);
document.getElementById("zall").onclick = fit;
let selected = [];
const select = (ids) => {
  selected.forEach((p) => p.classList.remove("sel"));
  selected = ids.map((id) => svg.querySelector('#base path[data-id="' + CSS.escape(id) + '"]')).filter(Boolean);
  selected.forEach((p) => p.classList.add("sel"));
};
// A point of the map, as every browser's isPointInFill takes it (older ones
// refuse a DOMPoint).
const mapPoint = (x, y) => Object.assign(svg.createSVGPoint(), { x, y });
const regionOf = (x, y) => { const pt = mapPoint(x, y); for (const p of svg.querySelectorAll("#base .region")) if (p.isPointInFill(pt)) return p.dataset.id; return ""; };

// ---- what a click shows ----
const show = (html) => { openTab = ""; panel.innerHTML = html; panel.scrollTop = 0; nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", "false")); };
const showRegion = (id) => {
  const r = D.regions[id]; if (!r) return;
  select([id]);
  const owner = owners[id] || "", group = areas[id] || "";
  const pts = new Set(); const inside = D.cities.filter((c) => { const p = svg.querySelector('#base path[data-id="' + CSS.escape(id) + '"]'); return p && p.isPointInFill(mapPoint(c.x, c.y)); });
  const units = D.units.filter((u) => u.regionId === id);
  const claims = arr((W.regionClaimants || {})[id]).map((c) => typeof c === "object" ? c.name || c.polity : c).filter(Boolean);
  show("<h2>" + esc(r.name) + '</h2><p class="muted">' + esc(r.type) + "</p>"
    + "<h3>Held by</h3><p>" + polity(owner) + "</p>"
    + (group ? "<h3>Group at work here</h3><p>" + polity(group) + "</p>" : "")
    + (claims.length ? "<h3>" + (claims.length > 1 ? "Disputed between" : "Claimed by") + "</h3><p>" + claims.map(polity).join(", ") + "</p>" : "")
    + (inside.length ? "<h3>Cities</h3>" + inside.sort((a, b) => b.population - a.population).map((c) => "<p>" + (c.capital ? "★ " : "") + esc(c.name) + ' <span class="muted">' + num(c.population) + "</span></p>").join("") : "")
    + section("Units here", units, (u) => record(u, ["name"]))
    + newsAbout((e) => arr(e.places).some((p) => p.regionId === id), "News here"));
};
const showCity = (c) => {
  const id = regionOf(c.x, c.y);
  select(id ? [id] : []);
  show("<h2>" + (c.capital ? "★ " : "") + esc(c.name) + '</h2><p class="muted">' + (c.capital ? "Capital · " : "") + num(c.population) + " people</p>"
    + (id ? "<h3>Region</h3><p><a class=\"link\" data-region=\"" + esc(id) + "\">" + esc(D.regions[id].name) + "</a> · held by " + polity(owners[id]) + "</p>" : "")
    + newsAbout((e) => arr(e.places).some((p) => p.kind === "city" && same(p.name, c.name)), "News here"));
};
const showTroop = (t) => {
  const front = D.fields.find((f) => f.name === t.battlefield);
  show("<h2>" + esc(t.label || (t.kind[0].toUpperCase() + t.kind.slice(1))) + '</h2><p class="muted">' + esc(t.kind) + " of " + polity(t.owner) + " · strength " + esc(t.strength) + " · " + esc(t.state) + "</p>"
    + "<h3>Battlefield</h3><p>" + esc(t.battlefield) + "</p>"
    + (front ? "<p>" + front.sides.map((side) => side.map(polity).join(", ")).join(' <span class="muted">against</span> ') + '</p><p class="muted">' + front.troops + " troops on the field</p>" : ""));
};
const showGeneral = (gl) => {
  const front = D.fields.find((f) => f.name === gl.battlefield);
  show("<h2>" + esc(gl.name || "A command") + '</h2><p class="muted">General of ' + polity(gl.owner) + " · leads " + esc(gl.count) + " troops · strength " + esc(gl.strength) + "</p>"
    + (gl.doing || gl.at ? "<p>" + esc([gl.doing, gl.at].filter(Boolean).join(" · ")) + "</p>" : "")
    + "<h3>Battlefield</h3><p>" + esc(gl.battlefield) + "</p>"
    + (front ? "<p>" + front.sides.map((side) => side.map(polity).join(", ")).join(' <span class="muted">against</span> ') + "</p>" : ""));
};
const showSeaBattle = (b) => show("<h2>Sea battle</h2><p>" + esc(b.label).replace(/\n/g, "<br>") + '</p><p class="muted">' + (b.tone === "own" ? "Your side had the better of it." : b.tone === "enemy" ? "Your enemy had the better of it." : "Neither side had the better of it, or you were no part of it.") + (b.fresh ? "" : " An earlier turn's.") + "</p>");
const showUnit = (u) => show("<h2>" + esc(u.name) + '</h2><p class="muted">' + esc(u.type) + " of " + polity(u.ownerCode) + (u.status ? " · " + esc(u.status) : "") + (Number.isFinite(u.strength) ? " · strength " + esc(u.strength) : "") + "</p>" + record(u, ["name", "x", "y", "color", "glyph", "label"]));
const showMarker = (m) => show("<h2>" + esc(m.name) + '</h2><p class="muted">' + esc(m.kind) + (m.owner ? " of " + polity(m.owner) : "") + (m.status && m.status !== "active" ? " · " + esc(m.status) : "") + "</p>" + (m.note ? "<p>" + esc(m.note) + "</p>" : ""));
const relationWith = (name) => arr(W.relations).find((r) => (same(r.a, seat) && same(r.b, name)) || (same(r.b, seat) && same(r.a, name)));
const actorOf = (name) => Object.values((W.politicalActors || {}).byPolity || {}).find((a) => same(a.name || a.polityKey, name));
const powerOf = (name) => Object.values((W.powerStatus || {}).byPolity || {}).find((a) => same(a.polityKey, name));
const overrideOf = (name) => Object.values(W.polityOverrides || {}).find((p) => same(p.name, name)) || {};
const items = (title, xs) => arr(xs).length ? "<h3>" + esc(title) + "</h3><ul>" + arr(xs).map((x) => "<li>" + esc(typeof x === "object" ? short(x) : x) + "</li>").join("") + "</ul>" : "";
const showPolity = (name) => {
  const held = Object.entries(owners).filter(([, o]) => same(o, name)).map(([id]) => id);
  const area = Object.entries(areas).filter(([, g]) => same(g, name)).map(([id]) => id);
  const ids = held.length ? held : area;
  select(ids);
  if (ids.length) { let b = [1e9, 1e9, -1e9, -1e9]; for (const id of ids) { const x = D.regions[id]?.box; if (x) b = [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.max(b[2], x[2]), Math.max(b[3], x[3])]; } center(b); }
  // The game's own Stats pane for it (Game/GameUI/stats.jsx): politics,
  // diplomacy, economy and its standing, as the game shows them.
  if (ohPanels) {
    show('<div class="statspane"></div>');
    ohPanels.country(panel.querySelector(".statspane"), name);
    return;
  }
  const o = overrideOf(name), a = actorOf(name) || {}, p = powerOf(name) || {}, group = (W.groups || {})[name];
  const [about, character] = String(o.note || group?.description || "").split(/\n?Character:\s*/);
  const rel = relationWith(name);
  const gov = a.government || {};
  show((flagOf(name) ? '<img class="flag big" src="' + esc(flagOf(name)) + '" alt="">' : "") + "<h2>" + (flagOf(name) ? "" : chip(name)) + esc(name) + "</h2>"
    + '<p class="muted">' + [group ? "Group" : "", p.tier ? String(p.tier).replace(/-/g, " ") : "", held.length ? held.length + " regions" : area.length ? "at work in " + area.length + " regions" : "", o.population ? num(o.population) + " people" : ""].filter(Boolean).join(" · ") + "</p>"
    + (rel && !same(name, seat) ? "<h3>Relations with you</h3><p><b>" + esc(rel.status) + "</b> (" + esc(rel.score) + ")</p><p>" + esc(rel.summary || "") + "</p>" : "")
    + (about ? "<h3>About</h3><p>" + esc(about) + "</p>" : "") + (character ? "<h3>Character</h3><p>" + esc(character) + "</p>" : "")
    + (a.leader?.name || gov.form ? "<h3>Government</h3><dl>" + [["Ruler", a.leader ? (a.leader.title || "") + " " + a.leader.name : ""], ["Form", gov.form], ["Creed", gov.ideology], ["Head of government", gov.headOfGovernment ? gov.headOfGovernment.title + " " + gov.headOfGovernment.name : ""], ["Approval", gov.approval], ["Stability", gov.stability], ["Status", gov.status], ["System", a.politicalSystem?.label]].filter(([, v]) => v !== undefined && v !== "" && v !== null).map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("") + "</dl>" : "")
    + items("Goals", a.goals) + items("Ambitions", a.ambitions) + items("Fears", a.fears) + items("Domestic pressures", a.domesticPressures)
    + section("Power blocs", arr(a.powerBlocs), (b) => record(b, ["name"]))
    + section("Parties", arr(a.parties), (b) => record(b, ["name"]))
    + section("Relations", arr(W.relations).filter((r) => same(r.a, name) || same(r.b, name)), (r) => '<div class="item"><b>' + polity(same(r.a, name) ? r.b : r.a) + "</b>" + esc(r.status) + " (" + esc(r.score) + ")<br>" + esc(r.summary || "") + "</div>")
    + (() => { const d = Object.entries(W.regionClaimants || {}).filter(([, who]) => arr(who).some((c) => same(typeof c === "object" ? c.name || c.polity : c, name))); return d.length ? "<h3>Disputed regions</h3>" + d.map(([rid, who]) => '<p><a class="link" data-region="' + esc(rid) + '">' + esc(D.regions[rid]?.name || rid) + '</a> <span class="muted">with ' + esc(arr(who).map((c) => typeof c === "object" ? c.name || c.polity : c).filter((c) => !same(c, name)).join(", ")) + "</span></p>").join("") : ""; })()
    + section("Agreements", arr(W.agreements).filter((x) => arr(x.parties).some((y) => same(y, name))))
    + section("Wars", arr(W.wars).filter((x) => JSON.stringify(x).includes(name)))
    + section("Puppets and overlords", arr(W.puppets).filter((x) => same(x.overlord, name) || same(x.puppet || x.subject, name)))
    + newsAbout((e) => same(e.title, "") ? false : (arr(e.places).some((p) => same(p.name, name)) || arr(e.combatants).some((c) => same(c, name)) || String(e.title).includes(name)), "News"));
};

// ---- the news, with its cards ----
// The events and the fronts' reports (fronts.mjs), by date: a report is dated
// the day its battlefield's run ended, after that day's events.
// A date as a number that sorts: "-2800-03-21" before "-1150-01-01", which as
// text it is not.
const dateKey = (d) => { const m = /^(-?)(\d+)-(\d{2})-(\d{2})/.exec(String(d || "")); return m ? (m[1] ? -1 : 1) * Number(m[2]) * 10000 + Number(m[3]) * 100 + Number(m[4]) : Infinity; };
const NEWS = [...arr(V.events), ...arr(D.fronts)].map((e, i) => [e, i])
  .sort((a, b) => (dateKey(a[0].date) - dateKey(b[0].date)) || a[1] - b[1]).map(([e]) => e);
// What came in with the week the page was loaded again for (below).
const FRESH = new Set();
// A report's words and an event's forces are written for Discord: **bold**, and a line each.
const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
const card = (e) => {
  const c = D.cards[e.id];
  const pic = c ? '<svg viewBox="' + c.viewBox.join(" ") + '" preserveAspectRatio="xMidYMid slice"><use href="#world"/>' + c.overlay + "</svg>" : "";
  const forces = arr(D.forces[e.id]);
  return '<div class="event' + (e.importance === "major" ? " major" : "") + (e.kind === "front" ? " front" : "") + (FRESH.has(e.id) ? " fresh" : "") + '" data-event=""' + esc(e.id) + '">' + pic + '<div class="body"><div class="meta">' + esc(day(e.date)) + (e.kind === "front" ? " · front report" : "") + (arr(e.tags).length ? " · " + esc(arr(e.tags).join(", ")) : "") + (e.playerRelated ? " · concerns you" : "") + "</div><b>" + esc(e.title) + "</b><p>" + md(e.description) + "</p>"
    + (forces.length ? '<p class="forces"><span class="muted">Forces</span><br>' + forces.map(md).join("<br>") + "</p>" : "")
    + (e.quote ? "<p><i>" + esc(typeof e.quote === "object" ? (e.quote.text || "") + " — " + (e.quote.speaker || "") : e.quote) + "</i></p>" : "")
    + (arr(e.places).length ? '<p class="muted">' + arr(e.places).map((p) => p.regionId ? '<a class="link" data-region="' + esc(p.regionId) + '">' + esc(p.name) + "</a>" : esc(p.name)).join(" · ") + "</p>" : "") + "</div></div>";
};
const newsAbout = (test, title) => { const xs = NEWS.filter(test).slice().reverse().slice(0, 12); return xs.length ? "<h3>" + esc(title) + "</h3>" + xs.map(card).join("") : ""; };

// ---- the news read in order, one event at a time ----
// The latest week begins a round's days before the game's date: an event on
// that day (the week's first, which is also the day the last one ended) is
// the week's. With no week played yet the reader begins at the first event of all.
const weekBegins = () => {
  const m = /^(-?)(\d+)-(\d{2})-(\d{2})/.exec(String(V.game?.gameDate || ""));
  if (!m || !(D.days > 0)) return null;
  const t = new Date(Date.UTC(2000, Number(m[3]) - 1, Number(m[4])));
  t.setUTCFullYear((m[1] ? -1 : 1) * Number(m[2]));
  t.setUTCDate(t.getUTCDate() - D.days);
  return t.getUTCFullYear() * 10000 + (t.getUTCMonth() + 1) * 100 + t.getUTCDate();
};
const firstOfWeek = () => { const from = weekBegins(); const at = from == null ? -1 : NEWS.findIndex((e) => dateKey(e.date) >= from && dateKey(e.date) !== Infinity); return at >= 0 ? at : 0; };
// The map frames the event being read, as its card does.
const frameEvent = (e) => { const c = e && D.cards[e.id]; if (c) frame([c.viewBox[0], c.viewBox[1], c.viewBox[0] + c.viewBox[2], c.viewBox[1] + c.viewBox[3]]); };
let newsAt = null;
const reader = () => {
  const first = firstOfWeek(), e = NEWS[newsAt];
  frameEvent(e);
  // The steps above the event as well as below it: on a phone the chat window
  // covers the panel's foot, and a long event pushes the lower ones away.
  return '<div class="reader"><div class="reader-top"><button type="button" class="step" data-news="prev"' + (newsAt === 0 ? " disabled" : "") + ' aria-label="Previous event">‹</button>'
    + '<span class="muted">Event ' + (newsAt + 1) + " of " + NEWS.length + (newsAt >= first && weekBegins() != null ? " · this week" : "") + "</span>"
    + '<button type="button" class="step" data-news="next"' + (newsAt === NEWS.length - 1 ? " disabled" : "") + ' aria-label="Next event">›</button></div>'
    + (newsAt !== first ? '<p class="reader-back"><button type="button" class="linkbtn" data-news="week">' + (weekBegins() != null ? "First event of this week" : "Back to the first") + "</button></p>" : "")
    + card(e)
    + '<div class="reader-nav"><button type="button" class="quiet" data-news="prev"' + (newsAt === 0 ? " disabled" : "") + ">Previous</button>"
    + '<button type="button" data-news="next"' + (newsAt === NEWS.length - 1 ? " disabled" : "") + ">" + (newsAt === NEWS.length - 1 ? "No later news" : "Next event") + "</button></div></div>";
};
const readNews = (at) => { newsAt = Math.max(0, Math.min(NEWS.length - 1, at)); open("News"); };

// ---- the tabs ----
const TABS = {
  "Your country": () => {
    const mine = arr(V.actions);
    const stats = (W.countryStats || {})[seat];
    return '<a class="link" data-polity="' + esc(seat) + '">Your country\'s full profile</a>'
      + section("Your orders", mine, (o) => '<div class="item"><b>' + esc(o.title || o.text) + '</b><span class="muted">' + esc(o.status || "planned") + "</span>" + (o.text && o.text !== o.title ? "<p>" + esc(o.text) + "</p>" : "") + "</div>")
      + section("Projects", arr(W.projects), (p) => '<div class="item"><b>' + esc(p.name || p.title) + "</b>" + (Number.isFinite(+p.progress) ? '<div class="bar"><i style="width:' + Math.max(0, Math.min(100, +p.progress)) + '%"></i></div>' : "") + "<dl>" + Object.entries(p).filter(([k, v]) => !["id", "name", "title", "progress"].includes(k) && short(v)).map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(short(v)) + "</dd>").join("") + "</dl></div>")
      + (stats ? "<h3>Your realm at a glance</h3>" + statsCard(stats, seat) : "")
      + section("Your goals", valuesOf((W.playerGoals || {})[seat] || W.playerGoals).filter((g) => typeof g === "object"))
      + section("Your relations", arr(W.relations).filter((r) => same(r.a, seat) || same(r.b, seat)).sort((a, b) => b.score - a.score), (r) => '<div class="item"><b>' + polity(same(r.a, seat) ? r.b : r.a) + "</b>" + esc(r.status) + " (" + esc(r.score) + ")<br>" + esc(r.summary || "") + "</div>");
  },
  News: () => {
    if (!NEWS.length) return '<p class="muted">Nothing has happened yet.</p>';
    if (newsAt == null) newsAt = firstOfWeek();
    return reader();
  },
  Polities: () => {
    const names = [...new Set([...Object.values(W.polityOverrides || {}).map((p) => p.name), ...Object.keys(W.groups || {})])].filter(Boolean).sort();
    return names.map((n) => "<p>" + polity(n) + ((W.groups || {})[n] ? ' <span class="muted">group</span>' : "") + (same(n, seat) ? ' <span class="muted">you</span>' : "") + "</p>").join("");
  },
  // The game's own Diplomacy panel (Game/GameUI/chat.jsx): every conversation,
  // with its institutions and intelligence, as the game shows it.
  Diplomacy: () => {
    if (!D.panels) return '<p class="muted">The game\'s Diplomacy panel is not built on this server (node panel/build.mjs). /write Country: message in the chat window still writes to a government.</p>';
    ohPanels?.diplomacy(true);
    return '<p class="muted">Your conversations are open in the Diplomacy panel. A letter to a government is answered when the week is played; one to another player reaches them at once.</p><p><button type="button" class="oh-tap-row" data-diplomacy>Open the Diplomacy panel</button></p>';
  },
  World: () => (Object.keys(W.regionClaimants || {}).length ? "<h3>Disputed regions</h3>" + Object.entries(W.regionClaimants).map(([rid, who]) => '<p><a class="link" data-region="' + esc(rid) + '">' + esc(D.regions[rid]?.name || rid) + "</a>: " + arr(who).map((c) => polity(typeof c === "object" ? c.name || c.polity : c)).join(", ") + (owners[rid] ? ' <span class="muted">held by ' + esc(owners[rid]) + "</span>" : "") + "</p>").join("") : "")
    + section("Wars", arr(W.wars)) + section("Battlefields", arr(W.battlefields)) + section("Peace offers", arr(W.peaceOffers)) + section("Peace treaties", arr(W.peaceTreaties))
    + section("Calls to arms", arr(W.callsToArms)) + section("Agreements", arr(W.agreements)) + section("Institutions", valuesOf(W.institutions).filter((x) => x && typeof x === "object"))
    + section("Puppets and overlords", arr(W.puppets)) + section("Blockades", arr(W.blockades)) + section("Sea battles", arr(W.seaBattles)) + section("Strikes", arr(W.strikes))
    + section("Fortifications", arr(W.fortifications)) + section("Markers", arr(W.markers)) + section("Units", arr(W.units), (u) => record(u, ["name"]))
    + (W.simulationRules ? "<h3>How this world works</h3><p>" + esc(W.simulationRules).replace(/\n+/g, "</p><p>") + "</p>" : "")
    + (W.startingTimelineText ? "<h3>The world before round one</h3><p>" + esc(W.startingTimelineText).replace(/\n+/g, "</p><p>") + "</p>" : ""),
  Intelligence: () => section("Your agents", arr(W.spies)) + section("Reports", arr(W.reports)) + section("Intelligence", valuesOf(W.intelligence).filter((x) => x && typeof x === "object"))
    + section("Intercepts", valuesOf(V.intercepts).filter((x) => x && typeof x === "object")) || '<p class="muted">Your government has no agents or reports yet.</p>',
};
let openTab = "";
const open = (name) => {
  openTab = name;
  nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  panel.innerHTML = TABS[name]() || '<p class="muted">Nothing here yet.</p>'; panel.scrollTop = 0;
};
for (const name of Object.keys(TABS)) {
  const b = document.createElement("button"); b.textContent = name; b.dataset.tab = name; b.setAttribute("role", "tab"); b.onclick = () => open(name); nav.append(b);
}
panel.addEventListener("click", (e) => {
  if (e.target.closest("[data-diplomacy]")) return ohPanels?.diplomacy(true);
  const step = e.target.closest("[data-news]");
  if (step) return readNews(step.dataset.news === "week" ? firstOfWeek() : newsAt + (step.dataset.news === "next" ? 1 : -1));
  const p = e.target.closest("[data-polity]"), r = e.target.closest("[data-region]");
  if (p) showPolity(p.dataset.polity);
  else if (r) { showRegion(r.dataset.region); const box = D.regions[r.dataset.region]?.box; if (box) center(box); }
});
// The game's "See how it began on the timeline" (Stats pane, a war): this page
// has no timeline, so the News tab opens at that event (turnReveal.js
// SHOW_EVENT_ON_TIMELINE).
window.addEventListener("oh:show-event-on-timeline", (e) => {
  const id = String(e.detail?.eventId ?? "");
  const at = id ? NEWS.findIndex((x) => String(x.id) === id) : -1;
  if (at < 0) {
    open("News");
    panel.insertAdjacentHTML("afterbegin", '<p class="muted">Your government never learned how this began.</p>');
    return;
  }
  readNews(at);
  panel.querySelector(".event")?.classList.add("found");
});
// ---- the map's filters: what it shows, and how strongly the countries are coloured ----
const remember = (key, value) => { try { localStorage.setItem("oh-map-" + key, String(value)); } catch {} };
const recall = (key) => { try { return localStorage.getItem("oh-map-" + key); } catch { return null; } };
for (const button of document.querySelectorAll(".filters [data-layer]")) {
  const layer = button.dataset.layer;
  const set = (on) => { button.setAttribute("aria-pressed", String(on)); svg.classList.toggle("no-" + layer, !on); remember(layer, on); };
  set(recall(layer) !== "false");
  button.addEventListener("click", () => set(button.getAttribute("aria-pressed") !== "true"));
}
const opacityBox = document.getElementById("opacity"), opacityToggle = document.querySelector(".opacity-toggle");
const fill = document.getElementById("fill"), fillOut = opacityBox.querySelector("output");
const setFill = (value) => { fill.value = value; fillOut.textContent = value + "%"; svg.style.setProperty("--fill", value / 100); remember("fill", value); };
setFill(Number(recall("fill") ?? 55));
fill.addEventListener("input", () => setFill(Number(fill.value)));
// The borders, fainter or gone: each region keeps its own type's strength,
// scaled by the slider.
const borders = document.getElementById("borders"), bordersOut = opacityBox.querySelectorAll("output")[1];
const baseLines = [...svg.querySelectorAll("#base .region")].map((p) => [p, Number(p.getAttribute("stroke-opacity") ?? 1)]);
const setBorders = (value) => {
  borders.value = value; bordersOut.textContent = value + "%"; remember("borders", value);
  for (const [p, base] of baseLines) p.setAttribute("stroke-opacity", (base * value / 100).toFixed(3));
};
setBorders(Number(recall("borders") ?? 100));
borders.addEventListener("input", () => setBorders(Number(borders.value)));
opacityToggle.addEventListener("click", () => { const open_ = opacityBox.hidden; opacityBox.hidden = !open_; opacityToggle.setAttribute("aria-expanded", String(open_)); });

fit(); open("Your country");

// ---- the chat window: orders, ready, commands ----
const box = document.getElementById("console"), statusLine = box.querySelector(".cstatus"), ordersList = box.querySelector(".corders");
const readyLine = box.querySelector(".cready"), countLine = box.querySelector(".ccount"), emptyLine = box.querySelector(".cempty");
const logBox = box.querySelector(".clog"), input = box.querySelector("textarea"), readyButton = box.querySelector(".ready");
const ORDER_HINT = input.placeholder;
// What this player's advisor would have them order (AI/seatAdvice.js) is in
// the Diplomacy panel's Advisor tab: one picked there comes into the box, to
// send as it is or change first.
const takeAdvice = (text) => {
  if (input.readOnly) return;
  input.value = text;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
};
let state = null;
// The orders are shown once: in the list. A new one is marked there for a
// moment, rather than said again in the log; the log is for what a command
// answers, and for what went wrong.
let justSent = "";
const say = (text, kind) => { const p = document.createElement("p"); p.className = kind; p.textContent = String(text ?? "").replace(/\x60/g, ""); logBox.append(p); logBox.scrollTop = logBox.scrollHeight; };
const PHASE_WORDS = { resolving: "the week is being played…", revealing: "the week's news is coming in…" };
const left = (ms) => { const m = Math.round(ms / 60000); return m >= 120 ? Math.round(m / 60) + " hours" : m + " min"; };
const render = () => {
  if (!state) return;
  const me = state.ready.find((p) => p.you);
  statusLine.innerHTML = "<b>" + esc(day(state.gameDate)) + "</b> · round " + esc(state.round) + " · " + esc(PHASE_WORDS[state.phase] || state.phase) + (state.paused ? " (paused)" : "")
    + (state.phase === "planning" ? " · " + left(state.remainingMs) + " left" : "");
  readyLine.innerHTML = '<b>Ready</b>' + state.ready.map((p) => '<span class="' + (p.ready ? "on" : "") + '" title="' + esc(p.name || "") + '">' + esc(p.country) + (p.ready ? " ✓" : "") + "</span>").join("");
  ordersList.innerHTML = state.orders.map((o) => '<li class="' + (justSent && o.text.replace(/\s+/g, " ").trim() === justSent ? "new" : "") + '"><span>' + esc(o.text) + '</span><button data-cancel="' + esc(o.id) + '" aria-label="Take back this order" title="Take back this order">✕</button></li>').join("");
  justSent = "";
  countLine.textContent = state.orders.length ? "· " + state.orders.length : "";
  emptyLine.hidden = state.orders.length > 0;
  modelLine.hidden = !state.models;
  if (state.models) modelLine.querySelector("b").textContent = state.models.currentName || state.models.current;
  readyButton.textContent = me && me.ready ? "Ready ✓" : "Ready";
  readyButton.classList.toggle("is", Boolean(me && me.ready));
  // While the week is played its orders have been read: nothing is taken
  // until it has landed. What was being written stays in the box.
  const locked = state.phase === "resolving";
  input.readOnly = locked;
  input.placeholder = locked ? "The week is being played. Orders open again when its news is in." : ORDER_HINT;
  for (const b of box.querySelectorAll(".cbuttons button, .corders [data-cancel]")) b.disabled = locked;
};
const refresh = async () => {
  try {
    const r = await (await fetch("/world/state" + location.search)).json();
    if (r.ok) { state = r.state; render(); weekPlayed(); } else statusLine.textContent = r.text;
  } catch { statusLine.textContent = "The game cannot be reached right now."; }
};
const post = async (text) => (await fetch("/world/say" + location.search, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) })).json();
// An order (anything not a command, or /order): only the list shows it. Ready
// and taking an order back: the button and the list show it. Other commands:
// what was asked, and the answer.
const send = async (text, { quiet = false } = {}) => {
  const order = !text.startsWith("/") ? text : /^\/(?:oh\s+)?order\s+/i.test(text) ? text.replace(/^\/(?:oh\s+)?order\s+/i, "") : "";
  if (!order && !quiet) say(text, "you");
  try {
    const r = await post(text);
    if (!r.ok) say((order ? "Not sent: " : "") + r.text, "err");
    else if (order) justSent = order.replace(/\s+/g, " ").trim();
    else if (!quiet) say(r.text, "bot");
  } catch { say("The game cannot be reached right now.", "err"); }
  refresh();
};
box.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); const text = input.value.trim(); if (!text || input.readOnly) return; input.value = ""; send(text); });
input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); box.querySelector("form").requestSubmit(); } });
// The lead's model picker, a window of its own: every model the bot's keys
// reach, searched and filtered by maker, the ones tried in this game first with
// what a week cost and took on each. Opened from "Choose the AI", and on Ready
// (the one in use picked already, so Ready is one more click).
const modelsBox = document.getElementById("models"), modelsList = modelsBox.querySelector(".list"), modelsSearch = modelsBox.querySelector("input[type=search]");
const modelsChips = modelsBox.querySelector(".chips"), modelsChosen = modelsBox.querySelector(".chosen"), modelsGo = modelsBox.querySelector("[data-models-go]");
const modelLine = box.querySelector(".cmodel");
let catalog = null, catalogAsked = null, modelsMode = "choose", modelsFilter = "all", modelsPick = "";
const askCatalog = () => catalogAsked ??= fetch("/world/models" + location.search).then((r) => r.json()).then((r) => {
  if (!r.ok) throw new Error(r.text || "The models could not be listed.");
  catalog = r.catalog;
}).catch((error) => { catalog = { error: String(error.message || error), providers: [] }; catalogAsked = null; }).finally(drawModels);
const modelCard = (m, { tried = false } = {}) => {
  const now = m.id === state.models.current;
  return '<label data-id="' + esc(m.id) + '"><input type="radio" name="model" value="' + esc(m.id) + '"' + (m.id === modelsPick ? " checked" : "") + '><span class="txt"><b>' + esc(m.name) + "</b>"
    + (now ? '<span class="tag now">In use</span>' : tried ? '<span class="tag tried">Tried in this game</span>' : m.wontPlay ? '<span class="tag no">Won\'t play here</span>' : '<span class="tag">Not tried here</span>')
    + '<span class="id">' + esc(m.id) + "</span>"
    + (tried ? '<span class="when">' + esc(m.wait) + " · " + esc(m.cost) + '</span><span class="plus">' + esc(m.good) + '</span><span class="minus">' + esc(m.weak) + "</span>" : "")
    + "</span></label>";
};
const drawModels = () => {
  if (!state || !state.models) return;
  const q = modelsSearch.value.trim().toLowerCase();
  const hit = (m, maker = "") => !q || (m.name + " " + m.id + " " + maker).toLowerCase().includes(q);
  const tried = state.models.offered.filter((m) => hit(m));
  const providers = arr(catalog?.providers);
  const triedIds = new Set(state.models.offered.map((m) => m.id));
  const groups = providers.map((p) => ({ ...p, rows: arr(p.models).filter((m) => !triedIds.has(m.id) && !triedIds.has(m.model) && hit(m, p.label)) }));
  const count = (n) => '<span>' + n + "</span>";
  modelsChips.innerHTML = '<button type="button" data-filter="all" aria-pressed="' + (modelsFilter === "all") + '">All</button>'
    + '<button type="button" data-filter="tried" aria-pressed="' + (modelsFilter === "tried") + '">Tried in this game' + count(tried.length) + "</button>"
    + groups.map((g) => '<button type="button" data-filter="' + esc(g.id) + '" aria-pressed="' + (modelsFilter === g.id) + '">' + esc(g.label) + count(g.rows.length) + "</button>").join("");
  let html = "";
  if (modelsFilter === "all" || modelsFilter === "tried") html += "<h3>Tried in this game</h3>" + (tried.length ? '<div class="grid">' + tried.map((m) => modelCard(m, { tried: true })).join("") + "</div>" : '<p class="note">None matches.</p>');
  if (modelsFilter !== "tried") {
    if (!catalog) html += '<p class="note"><span class="loading" aria-hidden="true"></span>Asking each provider for its models…</p>';
    else if (catalog.error) html += '<p class="note err">' + esc(catalog.error) + "</p>";
    for (const g of groups) {
      if (modelsFilter !== "all" && modelsFilter !== g.id) continue;
      html += "<h3>" + esc(g.label) + "</h3>" + (g.error ? '<p class="note err">' + esc(g.error) + "</p>" : "")
        + (g.rows.length ? '<div class="grid">' + g.rows.map((m) => modelCard(m)).join("") + "</div>" : g.error ? "" : '<p class="note">None matches.</p>');
    }
    // A provider without a key is said, not left out in silence.
    const unkeyed = arr(catalog?.unkeyed);
    if (unkeyed.length && modelsFilter === "all") html += '<p class="note">Not listed, for want of a key in the bot\'s settings: ' + unkeyed.map((p) => esc(p.label) + " (" + esc(p.key) + ")").join(", ") + ".</p>";
  }
  modelsList.innerHTML = html;
  const pickedName = [...state.models.offered, ...providers.flatMap((p) => arr(p.models))].find((m) => m.id === modelsPick)?.name || modelsPick;
  modelsChosen.innerHTML = modelsPick ? "Chosen: <b>" + esc(pickedName) + "</b>" : "";
};
const openModels = (mode) => {
  modelsMode = mode;
  modelsPick = state.models.current;
  modelsFilter = "all";
  modelsSearch.value = "";
  modelsGo.textContent = mode === "ready" ? "Ready on this model" : "Use this model";
  modelsBox.hidden = false;
  drawModels();
  askCatalog();
  modelsSearch.focus();
};
const closeModels = () => { modelsBox.hidden = true; (modelsMode === "ready" ? readyButton : modelLine.querySelector("button")).focus(); };
modelsSearch.addEventListener("input", drawModels);
modelsChips.addEventListener("click", (e) => { const b = e.target.closest("[data-filter]"); if (b) { modelsFilter = b.dataset.filter; drawModels(); } });
modelsList.addEventListener("change", (e) => { if (e.target.name === "model") { modelsPick = e.target.value; drawModels(); modelsList.querySelector('input[value="' + CSS.escape(modelsPick) + '"]')?.focus(); } });
modelsBox.querySelector("[data-models-cancel]").addEventListener("click", closeModels);
modelsBox.addEventListener("click", (e) => { if (e.target === modelsBox) closeModels(); });
modelsBox.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModels(); });
modelsGo.addEventListener("click", async () => {
  const mode = modelsMode, chosen = modelsPick;
  closeModels();
  if (chosen && chosen !== state.models.current) await send("/model " + chosen);
  if (mode === "ready") send("/ready", { quiet: true });
});
modelLine.querySelector("button").addEventListener("click", () => openModels("choose"));
readyButton.addEventListener("click", () => {
  const me = state && state.ready.find((p) => p.you);
  if (me && me.ready) return send("/unready", { quiet: true });
  if (state && state.models) return openModels("ready");
  send("/ready", { quiet: true });
});
ordersList.addEventListener("click", (e) => { const b = e.target.closest("[data-cancel]"); if (b) send("/cancel " + b.dataset.cancel, { quiet: true }); });
// ---- a week played: the page loads itself again, and says what is new ----
// Once the round has moved on and its news is in, the page is loaded again
// where it was (the map's frame, the tab, an order being written), and the
// "Next week" window shows what came in with it. A week taken back is said too.
const CARRY = "oh-world-carry";
let reloading = false;
const weekPlayed = () => {
  const shown = V.game?.round;
  if (reloading || shown == null || state.round == null || String(state.round) === String(shown) || PHASE_WORDS[state.phase]) return;
  reloading = true;
  try { sessionStorage.setItem(CARRY, JSON.stringify({ seat, vb, tab: openTab, draft: input.value, seen: NEWS.map((e) => e.id), round: shown })); } catch {}
  location.reload();
};
const weekBox = document.getElementById("week");
const closeWeek = () => { weekBox.hidden = true; input.focus({ preventScroll: true }); };
// The week's news one event at a time, the first first.
let weekEvents = [], weekAt = 0;
const drawWeek = () => {
  const e = weekEvents[weekAt], last = weekAt >= weekEvents.length - 1;
  weekBox.querySelector(".list").innerHTML = e ? '<p class="muted reader-count">Event ' + (weekAt + 1) + " of " + weekEvents.length + "</p>" + card(e) : "";
  weekBox.querySelector(".list").scrollTop = 0;
  const prev = weekBox.querySelector("[data-week-prev]"), next = weekBox.querySelector("[data-week-next]"), close = weekBox.querySelector("[data-week-close]");
  prev.hidden = !e || weekAt === 0;
  next.hidden = !e || last;
  close.classList.toggle("quiet", Boolean(e) && !last);
  (e && !last ? next : close).focus();
};
const showWeek = (title, note, events) => {
  weekBox.querySelector("h2").textContent = title;
  weekBox.querySelector("header p").textContent = note;
  weekEvents = events; weekAt = 0;
  weekBox.querySelector("[data-week-news]").hidden = !events.length;
  weekBox.hidden = false;
  drawWeek();
};
weekBox.addEventListener("click", (e) => {
  if (e.target === weekBox || e.target.closest("[data-week-close]")) return closeWeek();
  if (e.target.closest("[data-week-next]")) { weekAt = Math.min(weekEvents.length - 1, weekAt + 1); return drawWeek(); }
  if (e.target.closest("[data-week-prev]")) { weekAt = Math.max(0, weekAt - 1); return drawWeek(); }
  // The News tab, at the event being read.
  if (e.target.closest("[data-week-news]")) { closeWeek(); const at = NEWS.indexOf(weekEvents[weekAt]); return at >= 0 ? readNews(at) : open("News"); }
  const p = e.target.closest("[data-polity]"), r = e.target.closest("[data-region]");
  if (p) { closeWeek(); showPolity(p.dataset.polity); }
  else if (r) { closeWeek(); showRegion(r.dataset.region); const box = D.regions[r.dataset.region]?.box; if (box) center(box); }
});
weekBox.addEventListener("keydown", (e) => { if (e.key === "Escape") closeWeek(); });
// A new week, on a page in another tab: its title blinks until it is looked at.
const callAttention = (text) => {
  if (!document.hidden) return;
  const title = document.title;
  let on = false;
  const timer = setInterval(() => { on = !on; document.title = on ? "● " + text : title; }, 1000);
  const stop = () => { if (document.hidden) return; clearInterval(timer); document.title = title; document.removeEventListener("visibilitychange", stop); window.removeEventListener("focus", stop); };
  document.addEventListener("visibilitychange", stop);
  window.addEventListener("focus", stop);
};
(() => {
  let carried = null;
  try { carried = JSON.parse(sessionStorage.getItem(CARRY) || "null"); sessionStorage.removeItem(CARRY); } catch {}
  if (!carried || carried.seat !== seat) return;
  if (Array.isArray(carried.vb) && carried.vb.length === 4) { vb = carried.vb; apply(); }
  if (TABS[carried.tab]) open(carried.tab);
  if (carried.draft) input.value = carried.draft;
  const seen = new Set(arr(carried.seen));
  const fresh = NEWS.filter((e) => !seen.has(e.id));
  fresh.forEach((e) => FRESH.add(e.id));
  if (Number(V.game?.round) > Number(carried.round)) callAttention("New week: " + day(V.game?.gameDate));
  if (Number(V.game?.round) < Number(carried.round)) return showWeek("The week was taken back", "The game is at " + day(V.game?.gameDate) + " again. Orders sent for that week stand.", []);
  // The tab was drawn before the week's news was marked new.
  if (fresh.length && openTab === "News") open("News");
  const span = !(D.days > 0) || D.days === 7 ? "week" : D.days === 1 ? "day" : D.days % 7 === 0 ? (D.days / 7) + " weeks" : D.days + " days";
  showWeek("The " + span + " to " + day(V.game?.gameDate), fresh.length ? fresh.length + (fresh.length === 1 ? " new event" : " new events") + " for " + seat + ", in the order they happened." : "Nothing your government heard of happened this week.", fresh);
})();
refresh(); setInterval(refresh, 8000);
window.addEventListener("resize", apply);
if (D.panels) {
  window.addEventListener("oh-panels-ready", () => {
    ohPanels = window.ohPanels;
    ohPanels.start({ docs: V, link: location.search, hashes: D.hashes });
    ohPanels.advice(takeAdvice);
    // Letters not yet read: a blue number on the Diplomacy button.
    const diplomacyButton = nav.querySelector('[data-tab="Diplomacy"]');
    const badge = document.createElement("span"); badge.className = "unread"; badge.hidden = true; diplomacyButton.append(badge);
    ohPanels.unread((count) => {
      badge.hidden = !count;
      badge.textContent = count > 9 ? "9+" : String(count);
      diplomacyButton.setAttribute("aria-label", count ? "Diplomacy, " + count + " unread" : "Diplomacy");
    });
  }, { once: true });
  const loader = document.createElement("script"); loader.type = "module"; loader.src = "/panel/panel.js?v=" + encodeURIComponent(D.panels); document.head.append(loader);
}
`;
