// Discord bot spike, the part with no Discord in it: one shared game per
// channel ("a table"), each a headless session (spikes/headless/session.mjs)
// in its own process, kept in a folder of its own so a restarted bot opens
// every table again.
//
// The bot (bot.mjs) turns a slash command into `handle(command, { channelId,
// user, options })` and shows what comes back; the tables speak through
// `post(channelId, payload)` (the channel). A payload is { content?, embeds? }
// with plain embed objects.
//
// What goes where:
//   - the channel: who joined, each round's planning and its deadline, and the
//     round's public events (the projection of a viewer who plays no polity);
//   - a player's own world page (and nowhere else): the events only their
//     government knows of, the letters written to them. The bot sends no
//     private messages at all.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startSession } from "../headless/sessions.mjs";
import { basemapFile, eventSnapshot, geometry, toPng } from "./map.mjs";
import { eventForces, frontLogKeys, frontReports } from "./fronts.mjs";
import { availableModels, isOffered, listAllModels, modelName, unkeyedProviders } from "../headless/models.mjs";
// A game date as players read it, as the game writes it: "19 February 354",
// never the stored 0354-02-19.
import { formatGameDateReadable } from "../../src/runtime/gameDates.js";

const shownDate = (value) => formatGameDateReadable(value) || String(value ?? "");

// The viewer who plays no polity: the public's view of the game (session.mjs).
const PUBLIC_VIEWER = "Public Chronicle";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const rid = () => crypto.randomBytes(8).toString("hex");
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = (value) => (Array.isArray(value) ? value : []);
const same = (a, b) => Boolean(clean(a)) && clean(a).toLocaleLowerCase() === clean(b).toLocaleLowerCase();

// A round's rules for a table (multiplayer/host/settings.js): a week a round,
// a day to send orders (a week at most), up to 8 players (what the game allows
// today), and the round ends early once everyone is ready.
export const tableSettings = ({ name = "Discord", days = 7, hours = 24 } = {}) => ({
  v: 1, name: clean(name).slice(0, 40) || "Discord", seats: 8, roundMinutes: Math.min(7 * 24 * 60, Math.max(1, Math.round(hours * 60))), readyThreshold: 1,
  countdownSeconds: 0, minPlanningSeconds: 0, afkSeconds: 0, daysPerRound: days, leaverGraceMinutes: 60 * 24,
  allowMidGameJoin: true, cheats: "off", payment: "host",
});

// The polities of a scenario before any game of it runs (session.mjs
// choosableCountries), for the country lists of /oh new.
export const scenarioCountries = (scenario = "new-scenario") => {
  try {
    const world = JSON.parse(fs.readFileSync(path.join(repo, "server/data/scenarios", scenario, "world.json"), "utf8"));
    const owners = new Set();
    for (const owner of Object.values(world?.regionOwnershipOverrides ?? {})) if (clean(owner)) owners.add(clean(owner));
    for (const [key, entry] of Object.entries(world?.polityOverrides ?? {})) {
      if (clean(entry?.status || "active").toLowerCase() === "active") owners.add(clean(entry?.name || entry?.code || key));
    }
    return [...owners].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
};

// The scenarios a game may be played on: the library's, in its own order
// (server/data/scenario-manifest.json), each with its title, its line and
// how many polities it has.
export const listScenarios = () => {
  const root = path.join(repo, "server/data/scenarios");
  let order = [];
  try { order = list(JSON.parse(fs.readFileSync(path.join(repo, "server/data/scenario-manifest.json"), "utf8")).order); } catch { /* the folders' order */ }
  const ids = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, "scenario.json"))).map((d) => d.name);
  ids.sort((a, b) => (order.indexOf(a) < 0 ? 1e9 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 1e9 : order.indexOf(b)) || a.localeCompare(b));
  return ids.map((id) => {
    try {
      const card = JSON.parse(fs.readFileSync(path.join(root, id, "scenario.json"), "utf8"));
      return {
        id,
        name: clean(card.heroTitle || card.name) || id,
        subtitle: String(card.heroSubtitle ?? "").trim(),
        description: String(card.description ?? "").trim(),
        polities: scenarioCountries(id).length,
        cover: fs.existsSync(path.join(root, id, "cover-image.bin")),
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
};

// Events as embeds: at most 10 to a message, each within Discord's limits.
const COLORS = { major: 0xc0392b, minor: 0x7f8c8d, front: 0xd35400 };
const EMBED_BUDGET = 5900;

// `images` maps an event id to its card (a PNG), sent with the message as an
// attachment the embed shows (Discord shows no SVG and reaches no local URL).
// `forces` maps an event id to the formations it is about, a line each
// (fronts.mjs eventForces). A front report (kind "front") has its own colour.
export const eventMessages = (events, { header = "", footer = "", images = {}, forces = {} } = {}) => {
  const files = [];
  const embeds = list(events).map((e, i) => {
    const image = images[e.id];
    const name = `card-${i}.png`;
    if (image) files.push({ attachment: image, name });
    const troops = list(forces[e.id]);
    return {
      title: clean(e.title).slice(0, 256) || "Untitled",
      // One event never fills a message alone past Discord's 6,000.
      description: String(e.description ?? "").slice(0, 4000),
      color: e.kind === "front" ? COLORS.front : COLORS[e.importance] ?? COLORS.minor,
      footer: { text: `${shownDate(clean(e.date))}${footer ? ` · ${footer}` : ""}`.slice(0, 2048) },
      ...(troops.length ? { fields: [{ name: "Forces", value: troops.join("\n").slice(0, 1024) }] } : {}),
      ...(image ? { image: { url: `attachment://${name}` } } : {}),
    };
  });
  // Discord takes 10 embeds to a message and 6,000 characters across them all
  // (titles, descriptions, fields, footers): a long week is several messages.
  const sizeOf = (e) => e.title.length + e.description.length + e.footer.text.length + list(e.fields).reduce((n, f) => n + f.name.length + f.value.length, 0);
  const chunks = [];
  let chunk = [];
  let size = 0;
  for (const embed of embeds) {
    if (chunk.length && (chunk.length === 10 || size + sizeOf(embed) > EMBED_BUDGET)) { chunks.push(chunk); chunk = []; size = 0; }
    chunk.push(embed);
    size += sizeOf(embed);
  }
  if (chunk.length) chunks.push(chunk);
  const messages = chunks.map((part, i) => {
    const attached = files.filter((f) => part.some((e) => e.image?.url === `attachment://${f.name}`));
    return { ...(i === 0 && header ? { content: header } : {}), embeds: part, ...(attached.length ? { files: attached } : {}) };
  });
  if (!messages.length && header) messages.push({ content: header });
  return messages;
};

// "A", "A and B", "A, B and C".
const names = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

const minutes = (ms) => {
  const m = Math.round(ms / 60000);
  return m >= 120 ? `${Math.round(m / 60)} hours` : `${m} minutes`;
};

export const createTables = ({
  dataRoot,
  scenario = "new-scenario",
  post = async () => {},
  basePort = 4100,
  // (channelId, user) -> the URL of that player's country page, or null for none.
  pickLink = null,
  // (channelId, user) -> the URL of that player's world page, or null for none.
  viewLink = null,
  log = () => {},
} = {}) => {
  fs.mkdirSync(dataRoot, { recursive: true });
  const tables = new Map(); // channelId -> table
  let nextPort = basePort;
  const folderOf = (channelId) => path.join(dataRoot, String(channelId).replace(/[^\w-]/g, ""));

  // A table: its session, and what it has already told the channel.
  // `told` is "round:phase", so the same news sent to every player is posted once;
  // `posted` the ids of the events already told to the channel:
  // the week's news is every event not among them, whatever its date (a
  // date filter lost the events of a week's first day, which is the last day
  // of the week before).
  // `scenarioId` the game's scenario, kept in its folder (table.json) for a
  // restarted bot; a folder from before that is the default scenario's.
  const tableFile = (channelId) => path.join(folderOf(channelId), "table.json");
  const attach = async (channelId, scenarioId = "") => {
    let kept = {};
    try { kept = JSON.parse(fs.readFileSync(tableFile(channelId), "utf8")); } catch { /* new, or from before */ }
    const gameScenario = clean(scenarioId) || clean(kept.scenario) || scenario;
    fs.mkdirSync(folderOf(channelId), { recursive: true });
    fs.writeFileSync(tableFile(channelId), JSON.stringify({ ...kept, scenario: gameScenario }));
    const session = await startSession({ id: `table-${channelId}`, port: nextPort++, scenario: gameScenario, dataDir: folderOf(channelId) });
    const table = { channelId, scenario: gameScenario, session, told: "", acks: new Map(), posted: new Set(), busy: Promise.resolve(), pending: null };
    try { table.pending = JSON.parse(fs.readFileSync(pendingFile(channelId), "utf8")); } catch { /* opened, or new */ }
    tables.set(channelId, table);
    const status = await session.call("status");
    // What is on the timeline when the bot starts has been told (or was before it).
    table.posted = await toldSoFar(session);
    session.on("to-player", ({ playerId, message }) => {
      if (message.t === "ack") table.acks.get(`${playerId}:${message.id}`)?.(message);
      if (message.t === "round") table.busy = table.busy.then(() => onRound(table, message)).catch((error) => log(`round news failed: ${error?.message || error}`));
    });
    // The week's time skip calls, for why a week the engine wrote itself was
    // not the model's (the game's record of the round says whether it was).
    table.skips = { refused: [] };
    session.on("ai-call", (call) => {
      const skip = call.tools?.includes("submit_jump_result");
      if (call.status === 200) return;
      if (skip) table.skips.refused.push(call.status);
      const retried = /temperature|thinking\.type|tool_choice/i.test(String(call.error ?? ""));
      // Which task it was: the tool it answers with, or a reply in words.
      const task = skip ? "the week's time skip" : call.tools?.length ? `a ${call.tools.find((t) => t.startsWith("submit_")) ?? call.tools[0]} call` : "a reply in words";
      log(`table ${channelId}: ${task} was refused, HTTP ${call.status} ${clean(call.error).slice(0, 200)}${retried ? " (the game asks again without it)" : ""}`);
    });
    session.on("lead", ({ playerId, country }) => void post(channelId, { content: `<@${playerId}> now leads the game (${country}).` }));
    // A player's people founded a country of their own: the seat went with them.
    session.on("seat", ({ playerId, from, to }) => void post(channelId, { content: `🏛️ ${from} has founded **${to}**: <@${playerId}> now plays ${to}.` }));
    session.on("exit", ({ code }) => {
      tables.delete(channelId);
      log(`table ${channelId} stopped (${code})`);
    });
    return table;
  };

  // What has been told by the time the game stands where it does: every event
  // on its timeline, and the front reports of its battlefields as they are,
  // with every happening on them.
  const toldSoFar = async (session) => {
    const told = new Set(await session.call("eventIds"));
    const view = await session.call("fullView", { country: PUBLIC_VIEWER }).catch(() => null);
    for (const report of frontReports(view)) told.add(report.id);
    for (const key of frontLogKeys(view)) told.add(key);
    return told;
  };

  const onRound = async (table, message) => {
    const key = `${message.round}:${message.phase}`;
    if (key === table.told) return;
    table.told = key;
    const { channelId, session } = table;
    if (message.phase === "planning") {
      const status = await session.call("status");
      // "My map" answers each player who clicks it with their own link, seen
      // by them alone (an ephemeral reply: a bot sends one only in answer to a
      // click or a command, never unasked).
      await post(channelId, {
        content: `**${shownDate(status.gameDate)}: planning.** Send your government's orders with \`/oh order\` or on your map, then ready up. The week is played when everyone is ready, or in ${minutes(message.remainingMs)}.`,
        components: [{ type: 1, components: [
          ...(viewLink ? [{ type: 2, style: 1, label: "My map", custom_id: "oh:view" }] : []),
          { type: 2, style: 3, label: "Ready", custom_id: "oh:ready" },
        ] }],
      });
    } else if (message.phase === "resolving") {
      table.skips = { refused: [] };
      await post(channelId, { content: "The week is being played..." });
    } else if (message.phase === "revealing") {
      // The week the model did not write is the engine's stand-in: the players
      // are told, rather than left to read it as the story.
      // A week the model "answered" with nothing in it (a stand-in it wrote
      // itself, as a "placeholder" titled "x") is no week either.
      const week = list((await session.call("fullView", { country: PUBLIC_VIEWER })).events).filter((e) => e?.id && !table.posted.has(clean(e.id)));
      const hollow = week.length > 0 && week.every((e) => /^(placeholder|tbd|todo|x|event|untitled)?$/i.test(clean(e.title)) || clean(e.description).length < 12);
      if (hollow) {
        await post(channelId, { content: "⚠️ The model's answer for this week had nothing in it (a placeholder). The lead can take the week back with `/oh rewind` and play it again: orders sent for it stand." });
      } else if ((await session.call("lastTurn").catch(() => null))?.source === "fallback") {
        // Told by the game's own record of the round, not by counting calls: a
        // model that refuses the forced tool is asked again for the same answer
        // as JSON with no tool, and that answer is the week (DeepSeek, which
        // was reported as the stand-in when it had written the month, 2026-10-28).
        const last = table.skips.refused.at(-1);
        const why = last === 401 ? "the AI key was refused (401)" : last === 429 ? "the AI provider is rate-limiting (429)" : last ? `the AI call failed (HTTP ${last})` : "the model's answer could not be used";
        await post(channelId, { content: `⚠️ The model did not play this week: ${why}. The events below are the engine's stand-in, not the story. The lead can take the week back with \`/oh rewind\` and play it again, on another model if this one keeps failing.` });
      }
      // The week's news: the public part to the channel, each player's own to them.
      const status = await session.call("status");

      const publicView = await session.call("fullView", { country: PUBLIC_VIEWER });
      // The land war as the public's map draws it, drawn once for every card.
      const war = await session.call("warDrawings", { country: PUBLIC_VIEWER }).catch((error) => { log(`table ${channelId}: the war could not be drawn: ${error?.message || error}`); return null; });
      const fresh = (events) => list(events).filter((e) => e?.id && !table.posted.has(clean(e.id)));
      // The front engine's battles are on the battlefields' records, not the
      // timeline: each battlefield that saw something gets a report of its own.
      const open = [...fresh(publicView.events), ...fresh(frontReports(publicView, { formatDate: shownDate, told: table.posted }))];
      const seated = [status.lead, ...list(status.players)].filter((p) => p?.country);
      // What only a player's government knows is on their world page, and
      // nowhere else: the bot sends nobody a private message.
      // Each card drawn once, on the map everyone can see, and kept.
      const images = {};
      const forces = {};
      for (const event of open) {
        images[event.id] ??= await cardFor(table, event, publicView, war);
        forces[event.id] ??= eventForces(publicView, event);
      }
      // Each message on its own: one Discord refuses loses only itself.
      const send = async (to, payload) => { try { await to(payload); } catch (error) { log(`table ${channelId}: a news message was refused: ${String(error?.message || error).slice(0, 300)}`); } };
      const days = Number(status.daysPerRound) || 7;
      const span = days === 7 ? "week" : days === 1 ? "day" : days % 7 === 0 ? `${days / 7} weeks` : `${days} days`;
      for (const payload of eventMessages(open, { header: `**The ${span} to ${shownDate(status.gameDate)}**`, images, forces })) await send((p) => post(channelId, p), payload);
      for (const event of open) {
        table.posted.add(clean(event.id));
        for (const key of list(event.logKeys)) table.posted.add(key);
      }
      const reports = open.filter((e) => e.kind === "front");
      if (reports.length) {
        const ids = new Set(reports.map((r) => r.id));
        keepFronts(channelId, [...toldFronts(channelId).filter((r) => !ids.has(r.id)), ...reports]);
      }
      // Shown: the next round's planning may begin.
      for (const player of seated) await session.call("request", { playerId: player.id, message: { t: "revealed", id: rid(), round: message.round } }).catch(() => {});
    }
  };

  // A scenario's map image for the cards, as a data URL (made once a scenario).
  const basemaps = new Map();
  const basemapUrl = (scenarioId) => {
    if (basemaps.has(scenarioId)) return basemaps.get(scenarioId);
    const file = basemapFile(scenarioId, dataRoot);
    const url = file ? `data:image/${file.endsWith(".png") ? "png" : "jpeg"};base64,${fs.readFileSync(file).toString("base64")}` : "";
    basemaps.set(scenarioId, url);
    return url;
  };

  // An event's card: the map around its places, as a PNG, drawn once and kept
  // in the table's folder (old cards keep the borders of their day). null for
  // an event with no place on the map, or with no PNG renderer installed.
  const cardFor = async (table, event, publicView, war = null) => {
    const file = path.join(folderOf(table.channelId), "cards", `${String(event.id).replace(/[^\w-]/g, "_")}.png`);
    try { return fs.readFileSync(file); } catch { /* not drawn yet */ }
    const png = await toPng(eventSnapshot(geometry(table.scenario), publicView, event, { image: basemapUrl(table.scenario), war }));
    if (png) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, png);
    }
    return png;
  };

  // A player's request, answered with the host's own acknowledgement.
  const request = async (table, playerId, message) => {
    const id = rid();
    const answered = new Promise((resolve) => {
      table.acks.set(`${playerId}:${id}`, resolve);
      setTimeout(() => resolve(null), 8000);
    });
    try {
      await table.session.call("request", { playerId, message: { ...message, id } });
      const ack = await answered;
      if (ack && !ack.ok) throw new Error(ack.error || "refused");
      return ack?.result ?? null;
    } finally {
      table.acks.delete(`${playerId}:${id}`);
    }
  };

  // What a player is told once a letter is sent; `to` is everyone else in the
  // conversation. A player written to reads it on their world page.
  const lettered = async (table, status, seat, to, title) => {
    const seated = [status.lead, ...list(status.players)].filter((p) => p?.country);
    const people = seated.filter((p) => to.some((name) => same(name, p.country)) && !same(p.country, seat));
    const governments = to.filter((name) => !seated.some((p) => same(p.country, name)));
    return [
      people.length ? `Delivered to ${people.map((p) => p.country).join(", ")}.` : "",
      governments.length ? `${governments.join(", ")} will answer when the week is played.` : "",
    ].filter(Boolean).join(" ") || "Sent.";
  };

  const tableIn = (channelId) => {
    if (openings.has(channelId)) throw new Error("The game is not open yet: its lead is still choosing a scenario.");
    const table = tables.get(channelId);
    if (!table) throw new Error("No game in this channel. Start one with `/oh new`.");
    return table;
  };
  const requireLead = async (table, user) => {
    const status = await table.session.call("status");
    if (status.lead?.id !== user.id) throw new Error("Only the game's lead can do that.");
    return status;
  };
  const seatOf = (status, userId) => status.lead?.id === userId ? status.lead.country : clean(list(status.players).find((p) => p.id === userId)?.country);
  const pick = (countries, wanted) => countries.find((c) => same(c, wanted));

  // A game opened by /oh new with no country, waiting for its lead's pick.
  const pendingFile = (channelId) => path.join(folderOf(channelId), "pending-lead.json");
  // A game opened by /oh new whose lead has not chosen its scenario yet: no
  // game runs for it until they do ({ id, name, settings }).
  const openings = new Map();
  const openingFile = (channelId) => path.join(folderOf(channelId), "opening.json");
  // The front reports told so far, oldest first, for the world page's news:
  // a battlefield's record keeps only its last run, the reports every week's.
  const frontsFile = (channelId) => path.join(folderOf(channelId), "front-reports.json");
  const toldFronts = (channelId) => { try { return list(JSON.parse(fs.readFileSync(frontsFile(channelId), "utf8"))); } catch { return []; } };
  const keepFronts = (channelId, reports) => fs.writeFileSync(frontsFile(channelId), JSON.stringify(reports.map(({ logKeys: _keys, ...report }) => report)));
  // The game opened with `user` as its lead, playing `country`.
  const openAs = async (table, user, country, settings, difficulty = "") => {
    const opened = await table.session.call("open", { settings, lead: { id: user.id, name: user.name, country }, difficulty });
    table.pending = null;
    fs.rmSync(pendingFile(table.channelId), { force: true });
    await post(table.channelId, { content: `<@${user.id}> opened a game as **${opened.country}**. Join with \`/oh join\` and pick a country; the lead starts it with \`/oh start\`.` });
    return { content: `You lead this game as ${opened.country}.`, ephemeral: true };
  };

  // A seat's orders still waiting for this round's skip (the game's own queue).
  // The lead's include their Game Master commands, marked as such.
  const ordersOf = async (table, country) => list((await table.session.call("fullView", { country })).actions)
    .filter((a) => clean(a?.status || "planned") === "planned")
    .map((a) => ({ id: clean(a.id), text: `${a.source === "game-master" ? "Game Master: " : ""}${clean(a.text || a.title)}`, ...(a.source === "game-master" ? { gm: true } : {}) }));

  const commands = {
    async new({ channelId, user, options }) {
      if (tables.has(channelId)) throw new Error("This channel already has a game.");
      if (fs.existsSync(path.join(folderOf(channelId), "session.json"))) throw new Error("This channel's game is still on disk; the bot should have reopened it.");
      if (openings.has(channelId)) throw new Error("This channel already has a game: its lead is choosing a scenario.");
      const settings = tableSettings({ name: options.name || "Discord", days: options.days || 7, hours: options.hours || 24 });
      // No country named: the lead chooses the scenario on the start page, then
      // their country and the difficulty; no game runs until the scenario is chosen.
      if (!clean(options.country) && pickLink) {
        const opening = { id: user.id, name: user.name, settings };
        fs.mkdirSync(folderOf(channelId), { recursive: true });
        fs.writeFileSync(openingFile(channelId), JSON.stringify(opening));
        openings.set(channelId, opening);
        await post(channelId, { content: `<@${user.id}> is opening a game here: choosing its scenario and their country.` });
        return { content: `Choose the scenario, then your country and the difficulty, here (this link is yours alone, for the next hour):\n${pickLink(channelId, user)}`, ephemeral: true };
      }
      const table = await attach(channelId, options.scenario);
      try {
        // No country named: the game waits for its lead to pick one on the
        // country page (join, below, opens it then).
        if (!clean(options.country) && pickLink) {
          table.pending = { id: user.id, name: user.name, settings };
          fs.writeFileSync(pendingFile(channelId), JSON.stringify(table.pending));
          await post(channelId, { content: `<@${user.id}> is opening a game here and picking their country.` });
          return { content: `Pick your country here; the game opens when you do (this link is yours alone, for the next hour):\n${pickLink(channelId, user)}`, ephemeral: true };
        }
        return await openAs(table, user, options.country, settings);
      } catch (error) {
        await table.session.stop();
        fs.rmSync(folderOf(channelId), { recursive: true, force: true });
        throw error;
      }
    },
    async join({ channelId, user, options }) {
      const opening = openings.get(channelId);
      if (opening) {
        if (opening.id !== user.id) throw new Error("The game is not open yet: its lead is still choosing a scenario.");
        return { content: `Choose the scenario here:\n${pickLink(channelId, user)}`, ephemeral: true };
      }
      const table = tableIn(channelId);
      if (table.pending) {
        if (table.pending.id !== user.id) throw new Error("The game is not open yet: its lead is still picking a country.");
        if (!clean(options.country) && pickLink) return { content: `Pick your country here; the game opens when you do:\n${pickLink(channelId, user)}`, ephemeral: true };
        return openAs(table, user, options.country, table.pending.settings, options.difficulty);
      }
      const status = await table.session.call("status");
      if (seatOf(status, user.id)) throw new Error(`You already play ${seatOf(status, user.id)}.`);
      // No country named: a link to the page that lists them (web.mjs), bound to this player.
      if (!clean(options.country) && pickLink) {
        return { content: `Pick your country here (this link is yours alone, for the next hour):\n${pickLink(channelId, user)}`, ephemeral: true };
      }
      const country = pick(await table.session.call("countries"), options.country);
      if (!country) throw new Error(`${options.country} is not a country of this game.`);
      await table.session.call("join", { id: user.id, name: user.name });
      await request(table, user.id, { t: "pick", country });
      const seated = seatOf(await table.session.call("status"), user.id);
      if (!same(seated, country)) throw new Error(`${country} could not be taken (is it played already?).`);
      await post(channelId, { content: `<@${user.id}> plays **${country}**.` });
      return { content: `You play ${country}. Orders go in with \`/oh order\`.`, ephemeral: true };
    },
    // A faction of the player's own (the country page's "Create a faction"): a
    // country, landless or on up to five regions no country holds, only before
    // the game starts. The lead still choosing makes it and opens the game as it.
    async create({ channelId, user, options }) {
      const table = tableIn(channelId);
      const faction = { name: clean(options.name), color: clean(options.color), lore: String(options.lore ?? "").trim(), regionIds: list(options.regionIds).map(clean).filter(Boolean) };
      if (table.pending) {
        if (table.pending.id !== user.id) throw new Error("The game is not open yet: its lead is still picking a country.");
        const made = await table.session.call("createFaction", faction);
        await post(channelId, { content: `<@${user.id}> founded **${made.name}**, a country of their own${made.regions.length ? ` in ${names(made.regions)}` : ", with no land yet"}.` });
        return openAs(table, user, made.name, table.pending.settings, options.difficulty);
      }
      const status = await table.session.call("status");
      if (status.started) throw new Error("Factions can only be made before the game starts.");
      if (seatOf(status, user.id)) throw new Error(`You already play ${seatOf(status, user.id)}.`);
      await table.session.call("join", { id: user.id, name: user.name });
      const made = await table.session.call("createFaction", { ...faction, playerId: user.id });
      if (!same(seatOf(await table.session.call("status"), user.id), made.name)) throw new Error(`${made.name} was made, but could not be taken.`);
      await post(channelId, { content: `<@${user.id}> founded **${made.name}**, a country of their own${made.regions.length ? ` in ${names(made.regions)}` : ", with no land yet"}, and plays it.` });
      return { content: `You play ${made.name}.`, ephemeral: true };
    },
    // The lead of an opening game chooses its scenario (the start page): the
    // game is made on it, and they go on to their country and the difficulty.
    async scenario({ channelId, user, options }) {
      const opening = openings.get(channelId);
      if (!opening) throw new Error("This game's scenario is chosen already.");
      if (opening.id !== user.id) throw new Error("Only the game's lead can do that.");
      const chosen = listScenarios().find((entry) => entry.id === clean(options.scenario));
      if (!chosen) throw new Error(`There is no scenario ${options.scenario}.`);
      openings.delete(channelId);
      fs.rmSync(openingFile(channelId), { force: true });
      try {
        const table = await attach(channelId, chosen.id);
        table.pending = { id: opening.id, name: opening.name, settings: opening.settings };
        fs.writeFileSync(pendingFile(channelId), JSON.stringify(table.pending));
      } catch (error) {
        openings.set(channelId, opening);
        fs.writeFileSync(openingFile(channelId), JSON.stringify(opening));
        throw error;
      }
      await post(channelId, { content: `The game will be played on **${chosen.name}**.` });
      return { content: `${chosen.name} it is.`, ephemeral: true };
    },
    // The lead sets the difficulty; the next week is played at it.
    async difficulty({ channelId, user, options }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      const { levels } = await table.session.call("difficulties");
      const wanted = levels.find((l) => same(l.id, options.level) || same(l.label, options.level));
      if (!wanted) throw new Error(`The difficulties are: ${levels.map((l) => l.label).join(", ")}.`);
      await table.session.call("setDifficulty", { id: wanted.id });
      await post(channelId, { content: `${wanted.emoji} The game is now played at **${wanted.label}**: ${wanted.description}` });
      return { content: `Difficulty: ${wanted.label}.`, ephemeral: true };
    },
    // How many game days the next rounds cover, from a day to a year.
    async days({ channelId, user, options }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      const { days } = await table.session.call("setDays", { days: options.days });
      const span = days === 1 ? "a day" : days === 7 ? "a week" : days % 7 === 0 ? `${days / 7} weeks` : `${days} days`;
      await post(channelId, { content: `🗓️ From the next round on, each round plays **${span}** of game time.` });
      return { content: `Rounds now cover ${days} day${days === 1 ? "" : "s"}.`, ephemeral: true };
    },
    // The player's own link to the world page.
    async view({ channelId, user }) {
      const table = tableIn(channelId);
      const country = seatOf(await table.session.call("status"), user.id);
      if (!country) throw new Error("Join the game first.");
      if (!viewLink) throw new Error("The world page is not running.");
      return { content: `The world as ${country} knows it:\n${viewLink(channelId, user)}`, ephemeral: true };
    },
    // An order of this round taken back, by its id or its number in /oh orders.
    async unorder({ channelId, user, options }) {
      const table = tableIn(channelId);
      const country = seatOf(await table.session.call("status"), user.id);
      if (!country) throw new Error("Join the game first.");
      const mine = await ordersOf(table, country);
      const wanted = clean(options.order);
      const order = mine.find((o) => o.id === wanted) ?? mine[Number(wanted) - 1];
      if (!order) throw new Error(mine.length ? `No order ${wanted}: you have ${mine.length} (see /orders).` : "You have no orders this round.");
      if (order.gm) await table.session.call("gmCancel", { id: order.id });
      else await request(table, user.id, { t: "unorder", order: order.id });
      return { content: `Taken back: "${order.text.slice(0, 200)}".`, ephemeral: true };
    },
    async orders({ channelId, user }) {
      const table = tableIn(channelId);
      const country = seatOf(await table.session.call("status"), user.id);
      if (!country) throw new Error("Join the game first.");
      const mine = await ordersOf(table, country);
      return { content: mine.length ? mine.map((o, i) => `${i + 1}. ${o.text}`).join("\n") : "No orders yet this round.", ephemeral: true };
    },
    async order({ channelId, user, options }) {
      const table = tableIn(channelId);
      if (!seatOf(await table.session.call("status"), user.id)) throw new Error("Join the game first.");
      await request(table, user.id, { t: "order", text: clean(options.text) });
      return { content: `Order queued: "${clean(options.text).slice(0, 300)}". It goes into the next week. \`/oh ready\` when you are done.`, ephemeral: true };
    },
    // The lead as Game Master: a command for the coming round, queued like an
    // order, that the time skip must carry out above everything else, for any
    // country (AI/gameMasterOrders.js). Seen by the lead alone, who can take it
    // back like an order. With no text, the commands still waiting.
    async gm({ channelId, user, options }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      const text = String(options.text ?? "").trim();
      if (!text) {
        const waiting = await table.session.call("gmOrders");
        return { content: waiting.length ? `Your Game Master commands for the coming round:\n${waiting.map((o, i) => `${i + 1}. ${o.text}`).join("\n")}\nTake one back with \`/oh cancel\` (they are among your orders).` : "No Game Master command waits for the coming round.", ephemeral: true };
      }
      await table.session.call("gm", { text });
      return { content: `Game Master command queued: "${clean(text).slice(0, 300)}". The coming round carries it out in full, above every other rule, whoever it touches. Only you see it.`, ephemeral: true };
    },
    // Diplomacy (the game's own "say"). A letter to a government the AI plays
    // is answered when the week is played: the time skip reads every
    // conversation with everything else. One to another player reaches them at
    // once, and they read it on their world page.
    async reply({ channelId, user, options }) {
      const table = tableIn(channelId);
      const status = await table.session.call("status");
      const seat = seatOf(status, user.id);
      if (!seat) throw new Error("Join the game first.");
      const thread = list(await table.session.call("threads", { country: seat })).find((c) => clean(c?.id) === clean(options.thread));
      if (!thread) throw new Error("That conversation is not one of yours.");
      await request(table, user.id, { t: "say", thread: thread.id, to: [], text: clean(options.text) });
      return { content: await lettered(table, status, seat, list(thread.countries).map((c) => clean(c?.name ?? c)), clean(thread.title)), ephemeral: true };
    },
    async write({ channelId, user, options }) {
      const table = tableIn(channelId);
      const status = await table.session.call("status");
      const seat = seatOf(status, user.id);
      if (!seat) throw new Error("Join the game first.");
      const to = clean(options.to);
      if (!to || !clean(options.text)) throw new Error("Write it as /write Country: your message.");
      await request(table, user.id, { t: "say", thread: null, to: [to], text: clean(options.text) });
      return { content: await lettered(table, status, seat, [to], ""), ephemeral: true };
    },
    async ready({ channelId, user, options }) {
      const table = tableIn(channelId);
      const value = options.value !== false;
      await request(table, user.id, { t: "ready", value });
      return { content: value ? "Ready. The week is played once everyone is." : "No longer ready.", ephemeral: true };
    },
    // The lead's choice of the model the weeks are played on (headless/models.mjs):
    // one tried in this game, by its name or id, or any model a provider with a
    // key lists, by its id ("openai:gpt-6-luna-mini") or its own name.
    async model({ channelId, user, options }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      const { offered } = await table.session.call("models");
      const asked = clean(options.model);
      let id = offered.find((m) => same(m.id, asked) || same(m.name, asked))?.id ?? (isOffered(asked) ? asked : "");
      if (!id) {
        const listed = (await listAllModels()).flatMap((provider) => provider.models);
        id = (listed.find((m) => same(m.id, asked)) ?? listed.find((m) => same(m.model, asked)) ?? listed.find((m) => same(m.name, asked)))?.id ?? "";
      }
      if (!id) throw new Error(`No model ${asked} is offered here. The lead's model picker on the world page lists every one.`);
      await table.session.call("model", { id });
      return { content: `The weeks are played on ${modelName(id)} from now on.`, ephemeral: true };
    },
    async status({ channelId }) {
      const table = tableIn(channelId);
      const status = await table.session.call("status");
      const round = status.status?.round ?? {};
      const seats = [status.lead, ...list(status.players)].filter((p) => p?.country)
        .map((p) => `- ${p.country}: <@${p.id}>${p.id === status.lead?.id ? " (lead)" : ""}${list(round.ready).some((c) => same(c, p.country)) ? " - ready" : ""}`);
      return {
        content: [`**${shownDate(status.gameDate)}**, round ${status.round}: ${round.phase ?? "lobby"}${round.paused ? " (paused)" : ""}${round.phase === "planning" ? `, ${minutes(round.remainingMs ?? 0)} left` : ""}. Played on ${status.model}.`, ...seats].join("\n"),
        ephemeral: false,
      };
    },
    async leave({ channelId, user }) {
      const table = tableIn(channelId);
      const status = await table.session.call("status");
      const country = seatOf(status, user.id);
      if (!country) throw new Error("You are not in this game.");
      await table.session.call("leave", { playerId: user.id });
      await post(channelId, { content: `<@${user.id}> left; ${country} is played by the AI.` });
      return { content: "You left the game.", ephemeral: true };
    },
    async start({ channelId, user }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      await table.session.call("start");
      return { content: "Started.", ephemeral: true };
    },
    // The lead takes back the last week (the game's own undo): the world, the
    // timeline and the orders as they were before it, and its planning again.
    async rewind({ channelId, user }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      const back = await table.session.call("rewind");
      // The timeline as it was before the week: what is on it was told then.
      table.posted = await toldSoFar(table.session);
      table.told = "";
      // The week's cards go with it: a replayed week's events are new. So do
      // its front reports.
      fs.rmSync(path.join(folderOf(channelId), "cards"), { recursive: true, force: true });
      keepFronts(channelId, toldFronts(channelId).filter((r) => clean(r.date) <= clean(back.gameDate)));
      await post(channelId, { content: `⏪ <@${user.id}> took back the last week: the game is at **${shownDate(back.gameDate)}** again. Orders sent for that week stand; ready up to play it again.` });
      return { content: `Taken back to ${shownDate(back.gameDate)}.`, ephemeral: true };
    },
    async pause({ channelId, user }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      await table.session.call("pause");
      await post(channelId, { content: "The game is paused." });
      return { content: "Paused.", ephemeral: true };
    },
    async resume({ channelId, user }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      await table.session.call("resume");
      await post(channelId, { content: "The game goes on." });
      return { content: "Resumed.", ephemeral: true };
    },
    async resolve({ channelId, user }) {
      const table = tableIn(channelId);
      await requireLead(table, user);
      await table.session.call("resolveNow");
      return { content: "The week is being played now.", ephemeral: true };
    },
    // The lead ends the game: the session stops and its folder is put aside.
    async end({ channelId, user }) {
      const opening = openings.get(channelId);
      if (opening) {
        if (opening.id !== user.id) throw new Error("Only the game's lead can do that.");
        openings.delete(channelId);
        fs.rmSync(folderOf(channelId), { recursive: true, force: true });
        await post(channelId, { content: "The game has ended." });
        return { content: "Ended before it began.", ephemeral: true };
      }
      const table = tableIn(channelId);
      await requireLead(table, user);
      await table.session.stop();
      tables.delete(channelId);
      const ended = path.join(dataRoot, "ended", `${path.basename(folderOf(channelId))}-${Date.now()}`);
      fs.mkdirSync(path.dirname(ended), { recursive: true });
      fs.renameSync(folderOf(channelId), ended);
      await post(channelId, { content: "The game has ended." });
      return { content: `Ended; the game is kept in ${ended}.`, ephemeral: true };
    },
  };

  return {
    // Every table on disk opened again (a restarted bot).
    async restore() {
      const opened = [];
      for (const entry of fs.readdirSync(dataRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === "ended") continue;
        // A game whose lead had not chosen its scenario yet waits as it was.
        if (!fs.existsSync(path.join(dataRoot, entry.name, "session.json"))) {
          try { openings.set(entry.name, JSON.parse(fs.readFileSync(openingFile(entry.name), "utf8"))); opened.push(entry.name); } catch { /* nothing to open */ }
          continue;
        }
        try {
          await attach(entry.name);
          opened.push(entry.name);
        } catch (error) {
          log(`table ${entry.name} could not be reopened: ${error?.message || error}`);
        }
      }
      return opened;
    },
    async handle(command, context) {
      const handler = commands[command];
      if (!handler) throw new Error(`Unknown command ${command}.`);
      return handler({ ...context, options: context.options ?? {} });
    },
    // The country choices for a command's autocomplete.
    async countries(channelId) {
      const table = tables.get(channelId);
      return table ? table.session.call("countries") : scenarioCountries(scenario);
    },
    // A table's countries for the country page: each with who plays it.
    async seats(channelId) {
      const table = tableIn(channelId);
      const [status, countries, profiles, owners, areas, difficulties, flags] = await Promise.all(["status", "countries", "profiles", "owners", "areas", "difficulties", "flags"].map((command) => table.session.call(command)));
      const flagged = new Set(Object.keys(flags ?? {}).map((name) => clean(name).toLocaleLowerCase()));
      const players = [status.lead, ...list(status.players)].filter((p) => p?.country);
      return {
        gameDate: status.gameDate,
        scenario: table.scenario,
        difficulties,
        // The lead still choosing: their page sets the difficulty too.
        leadChoosing: Boolean(table.pending),
        owners,
        areas,
        // Factions are made only before the game starts.
        started: Boolean(status.started),
        countries: countries.map((name) => ({ name, player: players.find((p) => same(p.country, name))?.name ?? "", profile: profiles[name] ?? {}, flag: flagged.has(clean(name).toLocaleLowerCase()) })),
        playerOf: (userId) => seatOf(status, userId),
      };
    },
    // What one player's world page shows: their seat now, and the game as
    // their government knows it (the game's own projection).
    async worldView(channelId, userId) {
      const table = tableIn(channelId);
      const status = await table.session.call("status");
      const seat = seatOf(status, userId);
      if (!seat) throw new Error("You no longer play in this game.");
      const [view, war] = await Promise.all([table.session.call("fullView", { country: seat }), table.session.call("warDrawings", { country: seat }).catch(() => null)]);
      // The fronts' reports, every week's, and each battlefield's latest
      // where the channel has not been told it yet.
      const kept = toldFronts(channelId);
      const keptIds = new Set(kept.map((r) => r.id));
      const fronts = [...kept, ...frontReports(view, { formatDate: shownDate }).filter((r) => !keptIds.has(r.id))].map(({ logKeys: _keys, ...report }) => report);
      return { seat, view, war, fronts, scenario: table.scenario, days: status.daysPerRound || 0 };
    },
    // The world page's chat window: the round, who is ready, and this player's
    // orders, refreshed while the page is open.
    async roundState(channelId, userId) {
      const table = tableIn(channelId);
      const status = await table.session.call("status");
      const seat = seatOf(status, userId);
      if (!seat) throw new Error("You no longer play in this game.");
      const round = status.status?.round ?? {};
      const seated = [status.lead, ...list(status.players)].filter((p) => p?.country);
      return {
        gameDate: status.gameDate, round: status.round, phase: round.phase ?? "lobby", paused: Boolean(round.paused),
        remainingMs: round.remainingMs ?? 0, seat,
        ready: seated.map((p) => ({ country: p.country, name: p.name, ready: list(round.ready).some((c) => same(c, p.country)), you: p.id === userId })),
        orders: await ordersOf(table, seat),
        // The lead picks the model when they ready up.
        ...(status.lead?.id === userId ? { models: await table.session.call("models").catch(() => null) } : {}),
        threads: await table.session.call("threads", { country: seat }).catch(() => null),
      };
    },
    // The lead's model picker: the models tried in this game, and every model
    // each provider with a key lists (asked of the providers, kept a while).
    // The lead's alone: the route checks it, not only the page.
    async modelCatalog(channelId, userId) {
      const table = tableIn(channelId);
      const status = await table.session.call("status");
      if (status.lead?.id !== userId) throw new Error("Only the game's lead chooses the model.");
      const [models, providers] = await Promise.all([table.session.call("models"), listAllModels()]);
      return { ...models, providers, unkeyed: unkeyedProviders() };
    },
    // Model ids for /oh model's autocomplete: the tried ones, then the listed ones.
    async modelChoices(typed = "") {
      const q = clean(typed).toLocaleLowerCase();
      // Discord drops an answer after 3 seconds: a listing not in hand by then
      // leaves the tried models alone this time (the bot warms it on start).
      const providers = await Promise.race([listAllModels().catch(() => []), new Promise((resolve) => setTimeout(() => resolve([]), 2000))]);
      const rows = [...availableModels().map((m) => ({ name: `${m.name} (tried here)`, value: m.id })), ...providers.flatMap((p) => p.models.map((m) => ({ name: `${m.name} · ${p.label}`, value: m.id })))];
      return rows.filter((row) => !q || `${row.name} ${row.value}`.toLocaleLowerCase().includes(q)).slice(0, 25).map((row) => ({ name: row.name.slice(0, 100), value: row.value.slice(0, 100) }));
    },
    // What the game's own panels on the world page ask of the game (the host's
    // player requests, game/messages.js), answered as a guest's game client
    // answers them: { ok, error, result }.
    async panelRequest(channelId, userId, { t, fields = {} } = {}) {
      const table = tableIn(channelId);
      if (!seatOf(await table.session.call("status"), userId)) return { ok: false, error: "You no longer play in this game." };
      try {
        return { ok: true, result: await request(table, userId, { ...fields, t: clean(t) }) };
      } catch (error) {
        return { ok: false, error: clean(error?.message || error) || "The host could not do that." };
      }
    },
    // Where a table's own game server is, for the scenario's files the panels read.
    async originOf(channelId) {
      return clean(await tableIn(channelId).session.call("origin"));
    },
    // A polity's flag as the game shows it ({ type, bytes }), or null.
    async flagOf(channelId, name) {
      const table = tables.get(channelId);
      if (!table) return null;
      const flags = await table.session.call("flags");
      const url = Object.entries(flags ?? {}).find(([key]) => same(key, name))?.[1] ?? "";
      const match = String(url).match(/^data:(image\/(?:png|jpe?g|webp|gif|svg\+xml));base64,(.+)$/);
      return match ? { type: match[1], bytes: Buffer.from(match[2], "base64") } : null;
    },
    has: (channelId) => tables.has(channelId),
    // A game whose lead is choosing its scenario: who leads it.
    opening: (channelId) => openings.get(channelId) ?? null,
    async stopAll() {
      await Promise.all([...tables.values()].map((t) => t.session.stop()));
      tables.clear();
    },
  };
};
