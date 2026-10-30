// Discord bot spike: the scenario's map drawn as SVG, for the country page,
// the world page and the event cards.
//
//   geometry(scenario)        the regions (id, name, type, path, box), the
//                             region types' look and the cities, projected once
//                             a run (Web Mercator on a 1000 x 1000 square, the
//                             square the scenario's map image covers)
//   basemapFile(scenario,dir) the scenario's map image as a file (a JPEG when
//                             ImageMagick is there to make one)
//   paintedPaths(geo, view)   every region of every type (land, coast, mountain,
//                             ocean) filled by who holds it in `view` (a
//                             player's projection), see-through over the image
//   eventFocus(geo, view, e)  what an event is about on the map: its regions,
//                             its points, and the box that frames them
//   eventSnapshot(...)        an event's card: the map around its places, its
//                             regions outlined and its points named, and the
//                             battlefields of its war drawn as the game draws
//                             them (their ground, advances and generals)
//   toPng(svg)                a card as PNG, for Discord (rsvg-convert)
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { battlefieldsFor } from "./fronts.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = (value) => (Array.isArray(value) ? value : []);

export const project = (lon, lat) => {
  const phi = (Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180;
  return [((lon + 180) / 360) * 1000, ((1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2) * 1000];
};
const num = (n) => n.toFixed(1);

const geometries = new Map();
export const geometry = (scenario = "new-scenario") => {
  if (geometries.has(scenario)) return geometries.get(scenario);
  const folder = path.join(repo, "server/data/scenarios", scenario);
  // How each region type is drawn (the scenario's own regionTypes): its fill's
  // opacity held and unheld, and its border.
  const types = {};
  try {
    for (const t of list(JSON.parse(fs.readFileSync(path.join(folder, "world.json"), "utf8")).regionTypes)) {
      types[clean(t.id)] = {
        name: clean(t.name) || clean(t.id),
        opacity: Number.isFinite(t.opacity) ? t.opacity : 0.55,
        unownedOpacity: Number.isFinite(t.unownedOpacity) ? t.unownedOpacity : 0.25,
        stroke: hex(t.strokeColor) || "#000000",
        strokeOpacity: Number.isFinite(t.strokeOpacity) ? t.strokeOpacity : 1,
        override: hex(t.overrideColor),
      };
    }
  } catch { /* the defaults below */ }
  const regions = [];
  try {
    // The simplified shapes when the scenario has them, else its full ones.
    const shapes = ["regions.coarse.geojson", "regions.geojson"].map((name) => path.join(folder, name)).find((file) => fs.existsSync(file));
    const source = JSON.parse(fs.readFileSync(shapes, "utf8"));
    for (const f of list(source.features)) {
      const g = f.geometry ?? {};
      const polygons = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const d = polygons.flatMap((polygon) => polygon.map((ring) => `M${ring.map(([lon, lat]) => {
        const [x, y] = project(lon, lat);
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        return `${num(x)} ${num(y)}`;
      }).join("L")}Z`)).join("");
      if (!d) continue;
      const type = clean(f.properties?.typeId) || "land";
      regions.push({ id: clean(f.properties?.id), name: clean(f.properties?.name), type, typeName: types[type]?.name ?? type, d, box: [x0, y0, x1, y1] });
    }
  } catch { /* no map */ }
  const cities = [];
  try {
    const source = JSON.parse(fs.readFileSync(path.join(folder, "cities.geojson"), "utf8"));
    for (const f of list(source.features)) {
      const [lon, lat] = f.geometry?.coordinates ?? [];
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      const [x, y] = project(lon, lat);
      cities.push({ name: clean(f.properties?.city), population: Number(f.properties?.population) || 0, capital: clean(f.properties?.capital) === "primary", tier: Number(f.properties?.tier) || 3, x, y });
    }
  } catch { /* no cities */ }
  // Drawn in the scenario's order of types (z): oceans under the land's borders.
  const z = (r) => (/ocean|sea|lake|water/i.test(r.typeName) ? 0 : 1);
  regions.sort((a, b) => z(a) - z(b));
  const made = { regions, byId: new Map(regions.map((r) => [r.id, r])), byName: new Map(regions.map((r) => [r.name.toLowerCase(), r])), cities, types, folder };
  geometries.set(scenario, made);
  return made;
};

// The scenario's map image (background.json, a data URL; with no bounds it
// covers the whole Mercator square, as the game lays it), kept as a file in
// `dir`: a JPEG at 90% when ImageMagick is installed (a quarter of the size),
// else the image as it is. "" when the scenario has none.
export const basemapFile = (scenario, dir) => {
  const geo = geometry(scenario);
  const jpg = path.join(dir, `basemap-${scenario}.jpg`);
  const png = path.join(dir, `basemap-${scenario}.png`);
  if (fs.existsSync(jpg)) return jpg;
  if (fs.existsSync(png)) return png;
  try {
    const url = String(JSON.parse(fs.readFileSync(path.join(geo.folder, "background.json"), "utf8"))?.dataUrl ?? "");
    const match = url.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
    if (!match) return "";
    fs.mkdirSync(dir, { recursive: true });
    const raw = path.join(dir, `basemap-${scenario}.source.${match[1].replace("jpeg", "jpg")}`);
    fs.writeFileSync(raw, Buffer.from(match[2], "base64"));
    if (spawnSync("magick", [raw, "-quality", "90", jpg], { stdio: "ignore" }).status === 0) return jpg;
    fs.renameSync(raw, png);
    return png;
  } catch {
    return "";
  }
};

// A polity's colour: the game's palette (colors.json, [r, g, b]) or its own.
const hex = (value) => {
  if (Array.isArray(value) && value.length >= 3) return `#${value.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("")}`;
  return /^#[0-9a-f]{6}$/i.test(String(value ?? "")) ? String(value) : "";
};
export const colorOf = (view, polity) => {
  const name = clean(polity);
  if (!name) return "";
  const entry = Object.values(view?.world?.polityOverrides ?? {}).find((p) => clean(p?.name) === name);
  return hex(view?.colors?.[name]) || hex(entry?.color) || hex(view?.world?.groups?.[name]?.color) || "#9a9182";
};

// The game's map colours (Game/Map/Cities.jsx): names off-white on a near-black
// halo, outlines white, a place marked in the HUD's amber.
export const PALETTE = { sea: "#0b1a2b", ink: "rgba(8,12,18,0.9)", text: "rgba(247,246,240,0.96)", line: "#ffffff", mark: "#f5bd4f" };

// The map's paths, every type alike: filled by the holder's colour at the
// type's opacity (see-through, so the map image shows), unheld regions left
// clear, and the type's own border. `<path class="region" data-id data-name
// data-type ...>`.
export const paintedPaths = (geo, view) => {
  const owners = view?.world?.regionOwnershipOverrides ?? {};
  return geo.regions.map((r) => {
    const t = geo.types[r.type] ?? { opacity: 0.55, stroke: "#000000", strokeOpacity: 1 };
    const owner = clean(owners[r.id]);
    const fill = owner ? (t.override || colorOf(view, owner)) : "none";
    return `<path class="region${owner ? " held" : ""}" data-id="${escape(r.id)}" data-name="${escape(r.name)}" data-type="${escape(r.typeName)}" fill="${fill}"${owner ? ` fill-opacity="${t.opacity}"` : ""} stroke="${t.stroke}" stroke-opacity="${t.strokeOpacity}" d="${r.d}"/>`;
  }).join("");
};

// Disputed regions (world.regionClaimants: region id -> the polities claiming
// it): striped over the map in their claimants' colours, outlined dashed. Each
// set of claimants is a pattern of its own; `stripe` is a stripe's width in map
// units. { defs, paths } to put in an SVG's <defs> and over its regions.
export const disputes = (geo, view, { stripe = 2.5 } = {}) => {
  const claims = Object.entries(view?.world?.regionClaimants ?? {})
    .map(([id, who]) => [id, [...new Set(list(who).map((c) => clean(typeof c === "object" ? c?.name ?? c?.polity : c)).filter(Boolean))]])
    .filter(([id, who]) => geo.byId.has(id) && who.length >= 2);
  const patterns = new Map();
  for (const [, who] of claims) {
    const key = who.join("|");
    if (patterns.has(key)) continue;
    const id = `dispute-${patterns.size}`;
    const width = stripe * who.length;
    const bars = who.map((c, i) => `<rect x="${num(i * stripe)}" y="0" width="${num(stripe)}" height="${num(width)}" fill="${colorOf(view, c)}"/>`).join("");
    patterns.set(key, { id, svg: `<pattern id="${id}" width="${num(width)}" height="${num(width)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">${bars}</pattern>` });
  }
  return {
    defs: [...patterns.values()].map((p) => p.svg).join(""),
    paths: claims.map(([id, who]) => `<path class="dispute" data-id="${escape(id)}" data-claimants="${escape(who.join("|"))}" fill="url(#${patterns.get(who.join("|")).id})" fill-opacity="0.75" stroke="${PALETTE.ink}" stroke-dasharray="${num(stripe * 2)} ${num(stripe)}" d="${geo.byId.get(id).d}"/>`).join(""),
    claims: Object.fromEntries(claims),
  };
};

// The map image under everything, over the 1000 x 1000 square it covers.
export const basemapImage = (href) => (href ? `<image href="${escape(href)}" x="0" y="0" width="1000" height="1000" preserveAspectRatio="none"/>` : "");

// An event's places on the map: the regions it names (and those its impacts
// move), the whole land of a country it names, its points, and the ground of
// the battlefields it is about (`fields`, the war's drawings: war.mjs).
export const eventFocus = (geo, view, event, { fields = [] } = {}) => {
  const owners = view?.world?.regionOwnershipOverrides ?? {};
  const regionIds = new Set();
  const countryRegions = new Set();
  const points = [];
  for (const place of list(event?.places)) {
    if (place?.kind === "region" && geo.byId.has(clean(place.regionId))) regionIds.add(clean(place.regionId));
    // A sea is a region of the map too: found by its name.
    else if (place?.kind === "sea" && geo.byName.has(clean(place.name).toLowerCase())) regionIds.add(geo.byName.get(clean(place.name).toLowerCase()).id);
    else if (place?.kind === "country") {
      const held = Object.entries(owners).filter(([, owner]) => clean(owner) === clean(place.name)).map(([id]) => id).filter((id) => geo.byId.has(id));
      if (held.length) held.forEach((id) => countryRegions.add(id));
      else if (Number.isFinite(place.lng)) points.push({ name: place.name, kind: "country", xy: project(place.lng, place.lat) });
    } else if (Number.isFinite(place?.lng) && Number.isFinite(place?.lat)) {
      points.push({ name: clean(place.name), kind: place.kind, xy: project(place.lng, place.lat) });
    }
  }
  const impacts = event?.impacts ?? {};
  for (const op of [...list(impacts.regionControlOps), ...list(impacts.regionTransfers)]) {
    for (const id of [op?.regionId, ...list(op?.regionIds)].map(clean)) if (geo.byId.has(id)) regionIds.add(id);
  }
  // The units the event raised or moved, where they stand now.
  for (const u of list(view?.world?.units)) {
    if (clean(u?.eventId) && clean(u.eventId) === clean(event?.id) && Number.isFinite(u.lng) && Number.isFinite(u.lat)) points.push({ name: "", kind: "unit", xy: project(u.lng, u.lat) });
  }
  // Nothing placed: the land of the sides fighting in it.
  if (!regionIds.size && !countryRegions.size && !points.length && !fields.length) {
    for (const side of list(event?.combatants)) {
      for (const [id, owner] of Object.entries(owners)) if (clean(owner) === clean(side) && geo.byId.has(id)) countryRegions.add(id);
    }
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = ([a, b, c, d]) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d); };
  for (const id of [...regionIds, ...countryRegions]) take(geo.byId.get(id).box);
  for (const p of points) take([p.xy[0], p.xy[1], p.xy[0], p.xy[1]]);
  // A battlefield's ground lies between its corners: [west, north, east, south].
  for (const b of fields) {
    if (list(b?.corners).length !== 4) continue;
    const [a, c] = [project(b.corners[0], b.corners[1]), project(b.corners[2], b.corners[3])];
    take([Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])]);
  }
  if (!Number.isFinite(x0)) return null;
  const w = Math.max(x1 - x0, 50), h = Math.max(y1 - y0, 50), pad = Math.max(w, h) * 0.45;
  let vw = w + pad * 2, vh = h + pad * 2;
  if (vw / vh < 16 / 9) vw = (vh * 16) / 9; else vh = (vw * 9) / 16;
  // Kept inside the map: nothing lies past its edge, not even the image.
  vw = Math.min(vw, 1000); vh = Math.min(vh, 1000);
  const keep = (start, size) => Math.max(0, Math.min(1000 - size, start));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return { regionIds: [...regionIds], countryRegions: [...countryRegions].filter((id) => !regionIds.has(id)), points, viewBox: [keep(cx - vw / 2, vw), keep(cy - vh / 2, vh), vw, vh] };
};

// What lies over the painted map on a card: the event's regions outlined,
// its country's land edged, its points marked and named, and the region
// names. `scale` is map units per pixel of the drawn card.
// The units a viewer can see that stand inside a card's frame, squares in their
// owner's colour; the event's own units (the ones it raised or moved) named. A
// formation on a battlefield drawn on the card is there, with its troops.
export const unitMarks = (view, event, viewBox, scale, { fields = [] } = {}) => {
  const [x0, y0, w, h] = viewBox;
  const s = (n) => num(n * scale);
  const atFront = new Set(list(fields).map((b) => clean(b?.name).toLocaleLowerCase()).filter(Boolean));
  return list(view?.world?.units).filter((u) => Number.isFinite(u?.lng) && Number.isFinite(u?.lat) && !atFront.has(clean(u.committedTo).toLocaleLowerCase())).map((u) => {
    const [x, y] = project(u.lng, u.lat);
    if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return "";
    const own = event && clean(u.eventId) && clean(u.eventId) === clean(event.id);
    const size = own ? 14 : 10;
    return `<rect x="${num(x - (size / 2) * scale)}" y="${num(y - (size / 2) * scale)}" width="${s(size)}" height="${s(size)}" rx="${s(2)}" fill="${colorOf(view, u.ownerCode)}" stroke="${own ? PALETTE.line : "rgba(7,10,14,0.96)"}" stroke-width="${s(own ? 2 : 1.2)}"/>`
      + (own ? `<text x="${num(x)}" y="${num(y + 21 * scale)}" font-family="Open Sans, Segoe UI, sans-serif" font-size="${s(13)}" font-weight="600" text-anchor="middle" fill="${PALETTE.text}" stroke="${PALETTE.ink}" stroke-width="${s(3.5)}" paint-order="stroke" stroke-linejoin="round">${escape(u.name)}</text>` : "");
  }).join("");
};

export const focusOverlay = (geo, focus, scale) => {
  const s = (n) => num(n * scale);
  const outline = (id, width, dash = "") => `<path d="${geo.byId.get(id).d}" fill="none" stroke="${PALETTE.line}" stroke-width="${s(width)}"${dash ? ` stroke-dasharray="${dash.split(" ").map((n) => s(Number(n))).join(" ")}"` : ""} stroke-linejoin="round"/>`;
  // Region names in Georgia, as the game's country labels; places in Open Sans.
  const label = (x, y, text, size, weight = 600, family = "Open Sans, Segoe UI, sans-serif") => `<text x="${num(x)}" y="${num(y)}" font-family="${family}" font-size="${s(size)}" font-weight="${weight}" text-anchor="middle" fill="${PALETTE.text}" stroke="${PALETTE.ink}" stroke-width="${s(size / 4)}" paint-order="stroke" stroke-linejoin="round">${escape(text)}</text>`;
  const parts = [
    ...focus.countryRegions.map((id) => outline(id, 1.5, "5 3")),
    ...focus.regionIds.map((id) => `<path d="${geo.byId.get(id).d}" fill="#ffffff" fill-opacity="0.14" stroke="none"/>${outline(id, 3)}`),
    ...focus.regionIds.map((id) => {
      const [a, b, c, d] = geo.byId.get(id).box;
      return label((a + c) / 2, (b + d) / 2, geo.byId.get(id).name, 15, 700, "Georgia, serif");
    }),
    ...focus.points.filter((p) => p.kind !== "unit").map(({ name, xy: [x, y] }) => `<circle cx="${num(x)}" cy="${num(y)}" r="${s(6.5)}" fill="${PALETTE.mark}" stroke="rgba(7,10,14,0.96)" stroke-width="${s(2.2)}"/>${label(x, y - 12 * scale, name, 15, 600)}`),
  ];
  return parts.join("");
};

// The battlefields on a card, as the game's map draws them (FrontLayers.jsx):
// each one's ground in its holders' colours, the way its troops walked and the
// arrows of their advances, and its generals, each a disc in its side's colour
// with the troops it leads, named.
export const warMarks = (fields, scale) => {
  const s = (n) => num(n * scale);
  const xy = ([lng, lat]) => project(lng, lat).map(num);
  const ground = list(fields).filter((b) => b.ground && list(b.corners).length === 4).map((b) => {
    const [gx0, gy0] = xy([b.corners[0], b.corners[1]]), [gx1, gy1] = xy([b.corners[2], b.corners[3]]);
    return `<image href="data:image/png;base64,${b.ground}" x="${gx0}" y="${gy0}" width="${num(gx1 - gx0)}" height="${num(gy1 - gy0)}" preserveAspectRatio="none" opacity="0.85"/>`;
  });
  // A week's advance is a few kilometres, far less than a pixel of a card: each
  // is drawn as an arrowhead at the head of its way, pointing where it went,
  // larger for more troops, edged in white: a side's colour is its own land's.
  const arrows = list(fields).flatMap((b) => {
    const ways = new Map(list(b.arrows).filter((f) => f.geometry?.type === "LineString").map((f) => [`${f.properties.side}:${f.properties.index}`, f.geometry.coordinates]));
    return list(b.arrows).filter((f) => f.geometry?.type === "Polygon").map((f) => {
      const outline = list(f.geometry.coordinates?.[0]).map(([lng, lat]) => project(lng, lat));
      const way = list(ways.get(`${f.properties.side}:${f.properties.index}`)).map(([lng, lat]) => project(lng, lat));
      if (outline.length < 3 || !way.length) return "";
      const head = outline.reduce((best, p) => (Math.hypot(p[0] - way[0][0], p[1] - way[0][1]) > Math.hypot(best[0] - way[0][0], best[1] - way[0][1]) ? p : best), outline[0]);
      const [dx, dy] = [head[0] - way[0][0], head[1] - way[0][1]];
      const length = Math.hypot(dx, dy);
      if (!(length > 0)) return "";
      const [ux, uy] = [dx / length, dy / length];
      const size = (7 + Math.min(7, Math.sqrt(Number(f.properties.troops) || 1) * 1.6)) * scale;
      const tip = [head[0] + ux * size * 0.6, head[1] + uy * size * 0.6];
      const back = [tip[0] - ux * size * 1.6, tip[1] - uy * size * 1.6];
      const points = [tip, [back[0] - uy * size * 0.8, back[1] + ux * size * 0.8], [back[0] + ux * size * 0.45, back[1] + uy * size * 0.45], [back[0] + uy * size * 0.8, back[1] - ux * size * 0.8]];
      return `<path d="M${points.map((p) => p.map((n) => n.toFixed(3)).join(" ")).join("L")}Z" fill="${escape(f.properties.rgb)}" stroke="${PALETTE.line}" stroke-width="${s(1.6)}" stroke-linejoin="round" fill-opacity="${(0.95 * (f.properties.alpha ?? 1)).toFixed(2)}"/>`;
    });
  });
  const generals = list(fields).flatMap((b) => list(b.generals).map((f) => {
    const [x, y] = project(...f.geometry.coordinates);
    const name = clean(f.properties.general);
    return `<circle cx="${num(x)}" cy="${num(y)}" r="${s(11)}" fill="${escape(f.properties.rgb)}" stroke="${PALETTE.line}" stroke-width="${s(2)}"/>`
      + `<text x="${num(x)}" y="${num(y + 4.5 * scale)}" font-family="Open Sans, Segoe UI, sans-serif" font-size="${s(12)}" font-weight="700" text-anchor="middle" fill="${PALETTE.text}" stroke="rgba(0,0,0,0.7)" stroke-width="${s(2.5)}" paint-order="stroke">${escape(f.properties.count ?? "")}</text>`
      + (name ? `<text x="${num(x)}" y="${num(y + 26 * scale)}" font-family="Open Sans, Segoe UI, sans-serif" font-size="${s(12)}" font-weight="600" text-anchor="middle" fill="${PALETTE.text}" stroke="${PALETTE.ink}" stroke-width="${s(3.5)}" paint-order="stroke" stroke-linejoin="round">${escape(name)}</text>` : "");
  }));
  return { under: ground.join(""), over: arrows.join("") + generals.join("") };
};

// A card on its own (for Discord): the painted map cropped to the event.
// `image` is the map image as a data URL (rsvg-convert reads no file a piped
// SVG names). `war` is the war as the card's viewer sees it (war.mjs): the
// battlefields of the event's war are drawn on it, and framed whole.
export const eventSnapshot = (geo, view, event, { width = 960, height = 540, image = "", war = null } = {}) => {
  const fields = battlefieldsFor(event, list(war?.battlefields));
  const focus = eventFocus(geo, view, event, { fields });
  if (!focus) return null;
  const [x, y, w, h] = focus.viewBox;
  const scale = w / width;
  const fronts = warMarks(fields, scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${[x, y, w, h].map(num).join(" ")}">`
    + `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${PALETTE.sea}"/>`
    + basemapImage(image)
    + `<g stroke-width="${num(scale * 1.2)}" stroke-linejoin="round">${paintedPaths(geo, view)}</g>`
    + (() => { const d = disputes(geo, view, { stripe: 6 * scale }); return d.paths ? `<defs>${d.defs}</defs><g stroke-width="${num(scale * 1.5)}">${d.paths}</g>` : ""; })()
    + fronts.under
    + focusOverlay(geo, focus, scale)
    + unitMarks(view, event, focus.viewBox, scale, { fields })
    + fronts.over
    + `</svg>`;
};

// PNG through rsvg-convert, when it is installed (null when it is not).
let rsvg = null;
export const canRenderPng = () => {
  if (rsvg === null) rsvg = spawnSync("rsvg-convert", ["--version"], { stdio: "ignore" }).status === 0;
  return rsvg;
};
export const toPng = (svg) => new Promise((resolve) => {
  if (!svg || !canRenderPng()) return resolve(null);
  const child = spawn("rsvg-convert", ["--format", "png"], { stdio: ["pipe", "pipe", "ignore"] });
  const chunks = [];
  child.stdout.on("data", (d) => chunks.push(d));
  child.on("close", (code) => resolve(code === 0 ? Buffer.concat(chunks) : null));
  child.on("error", () => resolve(null));
  child.stdin.end(svg);
});
