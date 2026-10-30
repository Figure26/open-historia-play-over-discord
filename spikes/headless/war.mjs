// Headless engine spike: the war as one seat's map shows it, made with the
// game's own drawing (Game/Map/FrontLayers.jsx, SeaBattleLayers.jsx) from that
// seat's projection: each open battlefield as its last run left it (its painted
// ground as a PNG and the corners it lies between, its troops, the arrows of
// their advances), the sea battles and the blockades.
import { encodePng } from "./png.mjs";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const same = (a, b) => Boolean(clean(a)) && clean(a).toLocaleLowerCase() === clean(b).toLocaleLowerCase();

export const warDrawings = (engine, view, country, { log = () => {} } = {}) => {
  const world = view.world ?? {};
  const hex = (value) => (Array.isArray(value) ? value : null);
  const rgbOf = (name) => {
    const own = hex(view.colors?.[name]);
    if (own) return own.slice(0, 3);
    const css = clean(world.groups?.[name]?.color || Object.values(world.polityOverrides ?? {}).find((p) => same(p?.name, name))?.color);
    const m = css.match(/^#([0-9a-f]{6})$/i);
    return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : [150, 150, 150];
  };
  const cssOf = (name) => `rgb(${rgbOf(name).join(", ")})`;
  const arrowColorsOf = (name) => {
    const face = engine.frontArrowRgb(rgbOf(name));
    return { top: `rgb(${face.join(", ")})`, side: `rgb(${face.map((p) => Math.round(p * 0.72)).join(", ")})` };
  };
  const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 360));
  const latOfY = (y) => (Math.atan(Math.exp(y)) * 360) / Math.PI - 90;
  const battlefields = [];
  for (const record of engine.normalizeBattlefields(world.battlefields).filter(engine.isOpenBattlefield)) {
    try {
      const fieldView = engine.frontViewOf(record);
      const stage = engine.stageOf(fieldView);
      const day = Math.max(stage.start, stage.end);
      const drawn = engine.frontAt(stage, day);
      if (!drawn) continue;
      // The painted ground, as the map paints it on its canvas.
      const { frame } = fieldView;
      const { toLngLat, toCell } = engine.projectorOf(frame);
      const scale = engine.paintScaleFor(frame.cols, frame.rows);
      const width = frame.cols * scale, height = frame.rows * scale;
      const [west, north] = toLngLat(0, frame.rows);
      const [east, south] = toLngLat(frame.cols, 0);
      let rowOf = null;
      if (frame.flat === true) {
        rowOf = new Float32Array(height);
        const top = mercY(north), bottom = mercY(south);
        for (let y = 0; y < height; y += 1) rowOf[y] = toCell(west, latOfY(top + ((bottom - top) * (y + 0.5)) / height))[1];
      }
      const pixels = new Uint8ClampedArray(width * height * 4);
      const player = engine.createPaintPlayer(fieldView);
      const palette = new Uint8Array(32 * 4);
      player.names.forEach((name, index) => palette.set([...rgbOf(name), 255], (index + 1) * 4));
      let ground = "";
      if (player.bounds) {
        player.seek(day);
        engine.paintPixels(player, palette, { data: pixels, width, height, scale, rowOf });
        ground = encodePng(pixels, width, height).toString("base64");
      }
      // On the map at large a side's troops are its generals' markers, each
      // where its body of troops stands, with how many it leads (FrontLayers.jsx
      // fronts-sides); the counters are for close in.
      const features = engine.frontTroopFeatures([drawn], cssOf).features;
      const named = [0, 1].map((side) => new Map(engine.generalsOf(record, side).map((g) => [g.command, g])));
      const generals = features.filter((f) => f.properties.what === "side").map((f) => {
        const general = named[f.properties.side]?.get(f.properties.command);
        return { ...f, properties: { ...f.properties, general: general?.name ?? "", at: general?.at ?? "", doing: general?.doing ?? "" } };
      });
      battlefields.push({
        name: record.name, warId: record.warId ?? "", sides: record.sides, status: record.status, ground, corners: [west, north, east, south],
        troops: features.filter((f) => f.properties.what === "troop"),
        generals,
        arrows: engine.frontArrowFeatures([drawn], arrowColorsOf, { day, halfWidthOf: () => 0.45, still: true }).features,
      });
    } catch (error) {
      log(`warn: battlefield ${record?.name} could not be drawn: ${error?.message || error}`);
    }
  }
  return {
    battlefields,
    seaBattles: engine.seaBattleFeatures({ battles: world.seaBattles, viewer: country }).features,
    // { rings, labels }: the water each blockading fleet closes, and what it costs whom.
    blockades: (({ rings, labels }) => ({ rings: rings.features, labels: labels.features }))(engine.blockadeFeatures({ blockades: world.blockades, units: world.units, viewer: country, date: view.game?.gameDate })),
  };
};
