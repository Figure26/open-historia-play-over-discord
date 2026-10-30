// Discord bot spike: a scenario's flags from a folder of images. Each image is
// named after its polity ("Assar.png", "The Blue Armada.jpg", or "blue-armada.webp"),
// made a PNG at most 256 pixels on a side (ImageMagick's `magick`, when it is
// installed) and written into the scenario's flags.json as the game keeps
// author-set flags: polity name -> PNG data URL (server/libraryStore.js; the
// map editor writes the same). The game then shows them wherever it shows a
// flag: the new-game picker, the country panel, the diplomacy list.
//
//   node spikes/discord-bot/import-flags.mjs <scenario id> <folder of images>
//
// Close the map editor first: it saves the scenario whole and would put the old
// flags back. Flags already in flags.json that the folder has no image for stay.
// The scenario's games with no flags of their own are given them too.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [scenario, folder] = process.argv.slice(2);
if (!scenario || !folder) {
  console.error("Usage: node spikes/discord-bot/import-flags.mjs <scenario id> <folder of images>");
  process.exit(1);
}
const scenarioDir = path.join(repo, "server/data/scenarios", scenario);
if (!fs.existsSync(path.join(scenarioDir, "world.json"))) {
  console.error(`No scenario ${scenario} in server/data/scenarios.`);
  process.exit(1);
}

// "The Blue Armada", "blue_armada" and "Blue-Armada" are one name, and so is
// "blue_armada_00001" (an image generator's counter after it).
const key = (name) => String(name ?? "").toLowerCase().replace(/[\s_-]*\d+$/, "").replace(/^the[\s_-]+/, "").replace(/[^a-z0-9]+/g, "");
const world = JSON.parse(fs.readFileSync(path.join(scenarioDir, "world.json"), "utf8"));
const polities = new Map(Object.values(world.polityOverrides ?? {}).map((p) => String(p?.name ?? "").trim()).filter(Boolean).map((name) => [key(name), name]));

const flagsFile = path.join(scenarioDir, "flags.json");
let flags = {};
try { flags = JSON.parse(fs.readFileSync(flagsFile, "utf8")); } catch { /* none yet */ }

const hasMagick = spawnSync("magick", ["-version"], { stdio: "ignore" }).status === 0;
const done = [];
const unmatched = [];
for (const file of fs.readdirSync(folder).sort()) {
  if (!/\.(png|jpe?g|webp|gif)$/i.test(file)) continue;
  const name = polities.get(key(path.parse(file).name));
  if (!name) { unmatched.push(file); continue; }
  const source = path.join(folder, file);
  // A PNG at most 256 pixels on a side, its metadata stripped.
  const made = hasMagick ? spawnSync("magick", [source, "-resize", "256x256>", "-strip", "png:-"], { maxBuffer: 32 * 1024 * 1024 }) : null;
  const png = made?.status === 0 ? made.stdout : null;
  if (!png && !/\.png$/i.test(file)) { unmatched.push(`${file} (needs ImageMagick to become a PNG)`); continue; }
  const bytes = png ?? fs.readFileSync(source);
  flags[name] = `data:image/png;base64,${bytes.toString("base64")}`;
  done.push(`${name} (${Math.round(bytes.length / 1024)} KB)`);
}

fs.writeFileSync(flagsFile, `${JSON.stringify(flags, null, 2)}\n`);
console.log(`${scenario}: ${done.length} flag(s) written to flags.json${done.length ? `:\n  ${done.join("\n  ")}` : ""}`);
if (unmatched.length) console.log(`Not matched to a polity (name the file after it):\n  ${unmatched.join("\n  ")}`);
// The scenario's games: each began with its own copy of the scenario's flags,
// which hides the scenario's (server/libraryStore.js). A game that began
// before the scenario had any has an empty copy: it is given these. One that
// set flags of its own keeps them.
const gamesDir = path.join(repo, "server/data/games");
const filled = [];
const kept = [];
for (const game of fs.existsSync(gamesDir) ? fs.readdirSync(gamesDir) : []) {
  try {
    if (JSON.parse(fs.readFileSync(path.join(gamesDir, game, "game-instance.json"), "utf8")).scenarioId !== scenario) continue;
    const own = path.join(gamesDir, game, "flags.json");
    if (!fs.existsSync(own)) continue;
    if (Object.keys(JSON.parse(fs.readFileSync(own, "utf8")) ?? {}).length) { kept.push(game); continue; }
    fs.writeFileSync(own, `${JSON.stringify(flags, null, 2)}\n`);
    filled.push(game);
  } catch { /* not a game */ }
}
if (filled.length) console.log(`Games that had no flags now have them: ${filled.join(", ")}`);
if (kept.length) console.log(`Games with flags of their own, left as they are: ${kept.join(", ")}`);
const without = [...polities.values()].filter((name) => !flags[name]);
if (without.length) console.log(`Polities with no flag yet: ${without.join(", ")}`);
