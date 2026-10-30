// Headless engine spike: ONE shared game, in a process of its own (the engine
// keeps its state in module scope, so one game per process). Started and spoken
// to by sessions.mjs over IPC; this is what a Discord bot would talk to.
//
// It is the desktop host's engine window (src/multiplayer/host/engineMain.js)
// without the window: the same store over the game's own readers and queued
// writers, the same round resolution (players' boards lent, the game's own time
// skip, boards returned), and the game's own createGameHost - with a transport
// that hands each player's messages to the parent instead of a WebRTC peer.
//
// Kept (OH_SESSION_DATA): the game lives in that folder, and who plays what in
// its session.json, so a session started again on the same folder reopens the
// game and seats everyone where they were. The round machine itself is not
// kept: a restart begins the current round's planning again (orders already
// sent stay queued).
//
// The lead seat is the game's own country (game.country). When its player
// leaves, the lead passes to the next player, and the host is built again
// around them (handOver).
//
// Commands (parent -> child, answered with { rid, ok, result | error }):
//   open    { settings, lead: { id, name, country } }  the lead seat takes game.country
//   join    { id, name }                               a player connects
//   request { playerId, message }                      a player's request (PLAYER_REQUESTS)
//   leave   { playerId }                               a player gives up their seat for good
//   rewind                                             the last week taken back (the game's undo)
//   start | pause | resume | resolveNow                the round machine
//   status                                             seats, round, players, lead
//   publicEvents { since }                             events an outsider may see
//   privateEvents { country, since }                   events only some may see, as one seat sees them
//   secretEvents                                       events marked for some players only
//   countries | profiles | owners | areas            the polities a player may take; each one's public picture; who holds what
//   createFaction { playerId, name, color, lore, regionIds }  a player's own country (landless or on unheld regions), before the game starts
//   difficulties | setDifficulty { id }                 the game's difficulty levels, and setting one
//   setDays { days }                                    how many game days the next rounds cover
//   lastTurn                                            who wrote the latest round: a model, or the stand-in
//   gm { text } | gmOrders | gmCancel { id }            the lead's Game Master command for the coming round; those waiting; one taken back
//   health | viewOf { country } | stop
// Events (child -> parent): { event: "to-player", playerId, message },
//   { event: "ai-call", model, kb, tools, status, toolUse, error, text },
//   { event: "lead", playerId, country }, { event: "seat", playerId, from, to },
//   { event: "log", ... }.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { bootEngine, mockTimeSkipAnswer } from "./boot.mjs";
import { availableModels, isOffered, modelName } from "./models.mjs";
import { warDrawings } from "./war.mjs";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = (value) => (Array.isArray(value) ? value : []);
const same = (a, b) => Boolean(clean(a)) && clean(a).toLocaleLowerCase() === clean(b).toLocaleLowerCase();
const rid = () => crypto.randomBytes(8).toString("hex");
const emit = (event, payload) => process.send?.({ event, ...payload });
const log = (message, detail) => emit("log", { message, detail });

// What a viewer who plays no polity may see: the public feed's projection.
export const PUBLIC_VIEWER = "Public Chronicle";

const scenarioId = process.env.OH_SESSION_SCENARIO || "new-scenario";
const dataDir = process.env.OH_SESSION_DATA || "";
const { engine, shims, stop, data: dataFolder, setModel, model: playingModel } = await bootEngine({
  scenario: scenarioId,
  port: Number(process.env.OH_SESSION_PORT || 4001),
  dataDir,
  log: (m) => log(m),
});

// Who plays what, kept beside the game when the session is kept:
// { gameId, settings, lead: { id, name, country }, players: [{ id, name, country }], started }.
const metaPath = dataDir ? path.join(path.resolve(dataDir), "session.json") : "";
const readMeta = () => {
  try { return metaPath ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : null; } catch { return null; }
};
let meta = readMeta() ?? { gameId: "", settings: null, lead: null, players: [], started: false };
// The model the lead chose (models.mjs), set again on reopen; the default
// while none was chosen or it is no longer offered.
if (meta.model) setModel(meta.model);
const saveMeta = () => {
  if (!metaPath) return;
  fs.writeFileSync(`${metaPath}.tmp`, JSON.stringify(meta, null, 1));
  fs.renameSync(`${metaPath}.tmp`, metaPath);
};

// Every AI request, summarized for the parent (and the whole text, so a test
// can see whose orders went into the skip).
const forwarded = new WeakSet();
// A kept game keeps a record of each time skip's AI calls (ai-log/): what was
// asked and what came back, to see why a week went wrong.
const keepSkipRecord = (calls) => {
  if (!metaPath || !calls.length) return;
  try {
    const folder = path.join(path.dirname(metaPath), "ai-log");
    fs.mkdirSync(folder, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.writeFileSync(path.join(folder, `skip-${stamp}.json`), JSON.stringify(calls.map((call) => ({
      model: call.model, status: call.status, toolUse: call.toolUse, toolChoice: call.toolChoice, tools: call.tools,
      error: call.error, answer: call.answer, request: call.body,
    })), null, 1));
  } catch (error) {
    log(`warn: the time skip's record could not be kept: ${error?.message || error}`);
  }
};
// `round`: these are the calls of a round being played. All of them go into its
// record, not only those that offered the time skip's tool: a model that
// refuses the forced tool is asked again for the same answer as JSON, with no
// tool at all, and that answer is the week (DeepSeek, 2026-10-28).
const forwardAiCalls = async ({ round = false } = {}) => {
  const skips = [];
  for (const call of shims.aiCalls) {
    if (forwarded.has(call)) continue;
    forwarded.add(call);
    await call.done;
    if (round || call.tools.includes("submit_jump_result")) skips.push(call);
    emit("ai-call", {
      model: call.model, kb: Math.round(call.chars / 1024), tools: call.tools,
      status: call.status, toolUse: call.toolUse, error: call.error,
      text: JSON.stringify(call.body ?? ""),
    });
  }
  keepSkipRecord(skips);
};

// The game: the kept one opened again, or a new one as from the menu (created,
// entered, its pre-history applied).
const reopened = Boolean(meta.gameId);
if (reopened) {
  await engine.ensureLibraryCatalog();
  await engine.activateGame(meta.gameId);
} else {
  await engine.createGame({ name: `Session ${process.env.OH_SESSION_ID || ""}`.trim(), scenarioId, setActive: true });
  await engine.ensureLibraryCatalog();
  await engine.maybeGeneratePregameHistory();
  meta.gameId = clean(engine.getLibraryState()?.activeGameId);
  saveMeta();
}

// The game's own documents, through its own readers and queued writers
// (as engineMain.js's store).
const store = {
  read: async () => {
    const [bundle, intercepts, colors, flags] = await Promise.all([
      engine.readGameStateBundle({ force: true }),
      engine.readJson(engine.JSON_URLS.intercepts, { defaultValue: {}, force: true }),
      engine.readJson(engine.JSON_URLS.colors, { defaultValue: {}, force: true }),
      engine.readJson(engine.JSON_URLS.flags, { defaultValue: {}, force: true }),
    ]);
    return { world: bundle.world, game: bundle.game, events: bundle.events, chat: bundle.chats, actions: bundle.actions, intercepts, colors, flags };
  },
  updateActions: (fn) => engine.mutateActionsState(fn),
  updateChats: (fn) => engine.mutateChatsState(fn),
  updateWorld: (fn) => engine.mutateWorldState(fn),
  updateGame: (fn) => engine.mutateGameData(fn),
  updateForces: (fn) => engine.mutateCanonicalTurnState(({ world, actions, game }) => fn({ world, actions, game }) || null),
};

// The scenario's groups (runtime/groups.js), by name.
const groupNames = (world) => Object.keys(engine.normalizeGroups(world?.groups));

// The polities a player may take (engineMain.js choosableCountries). Groups
// are not offered: a player leads a country (one already played as a
// group, in a game from before, stays playable as the polity it became).
const choosableCountries = (world, game) => {
  const owners = new Set([clean(game?.country)]);
  for (const owner of Object.values(world?.regionOwnershipOverrides ?? {})) if (clean(owner)) owners.add(clean(owner));
  for (const [key, entry] of Object.entries(world?.polityOverrides ?? {})) {
    if (clean(entry?.status || "active").toLowerCase() === "active") owners.add(clean(entry?.name || entry?.code || key));
  }
  return [...owners].filter(Boolean).sort((a, b) => a.localeCompare(b)).slice(0, 600);
};

// A colour into the game's palette (colors.json), as the new-game picker writes it.
const paint = async (name, hex) => {
  const rgb = /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) : null;
  if (!rgb) return;
  const colors = await engine.readJson(engine.JSON_URLS.colors, { defaultValue: {}, force: true });
  await engine.writeJson(engine.JSON_URLS.colors, { ...colors, [name]: rgb }, { pretty: true });
};


// The map's regions (id -> name), every type alike (land, coast, mountain,
// ocean), from the game's copy of the scenario.
let landCache = null;
const landRegions = () => {
  if (landCache) return landCache;
  landCache = new Map();
  try {
    const folder = path.join(dataFolder, "scenarios", scenarioId);
    const shapes = ["regions.coarse.geojson", "regions.geojson"].map((name) => path.join(folder, name)).find((file) => fs.existsSync(file));
    const regions = JSON.parse(fs.readFileSync(shapes, "utf8"));
    for (const f of list(regions.features)) {
      landCache.set(clean(f.properties?.id), clean(f.properties?.name) || clean(f.properties?.id));
    }
  } catch { /* no map: nothing can be picked */ }
  return landCache;
};

// One turn of an institution's table for a seat (a Council, a hearing, a
// founding's talks): the AI governments at it answer, and the thread is saved
// as the chat panel saves it. The desktop host's engineMain.js tableTurn.
const tableTurn = async ({ chat, seat, ...flags }) => {
  const chatId = clean(chat?.id);
  const outcome = await engine.runChatActionBatch({ chat, playerCountry: seat, useCanonicalState: true, ...flags });
  if (!outcome || outcome.committed || !Array.isArray(outcome.events)) return outcome;
  const projected = engine.projectChatThread(outcome.events);
  await engine.mutateChatsState((current) => list(current).map((entry) => (clean(entry?.id) === chatId
    ? {
      ...entry,
      events: outcome.events,
      countries: projected.countries ?? entry.countries,
      title: projected.title || entry.title,
      polls: projected.polls ?? entry.polls,
      demands: projected.demands ?? entry.demands,
    }
    : entry)));
  return outcome;
};

let host = null;
const connections = new Map(); // id -> { id, device, name }
const connectionOf = ({ id, name }) => ({ id: clean(id), device: clean(id), name: clean(name) });
const seatOfPlayer = (id) => clean(host?.status().players.find((entry) => entry.id === clean(id))?.seat);

// Diplomacy waits for the week: what a player writes to a government the AI
// plays is answered by the time skip, which reads every conversation of the
// period (its "Diplomacy So Far"), with everything else; a letter to another
// player reaches them at once. So the host is given no replyTo (the desktop
// host's engineMain.js answers at once, as the game's chat panel does).

// A player who let the round run out without a single order, and without
// readying up, is not left with a government that does nothing: it is given
// one standing order of its own, written here, to carry on softly as it has
// been. The time skip reads it like any order, with the polity's character,
// goals and recent weeks already in its prompt; and the engine's guard, which
// withdraws a player polity's choice with no order behind it, finds one. It
// rules out anything bold or binding. Taken back if the round fails, so the
// planning that follows starts without it.
const CARETAKER_SOURCE = "caretaker";
const caretakerText = (country) => [
  `No orders came from ${country}'s government this week, so it carries on as it has been, softly.`,
  `Its ministers and officials keep to its established course: routine government, follow-through on what is already under way, and measured, cautious answers to whatever presses on it, in keeping with ${country}'s character, standing goals and what the past weeks set in motion.`,
  "Defend what is attacked, keep agreements already made, and answer letters politely without promising anything new.",
  "Nothing bold or binding in its name: no new war, treaty, alliance, ceasefire, surrender, cession of land, change of government or major new policy.",
].join(" ");
const addCaretakerOrders = async (humanCountries) => {
  const ready = list(host?.status().round?.ready);
  const added = [];
  await engine.mutateActionsState((actions) => {
    const planned = list(actions).filter((action) => clean(action?.status || "planned") === "planned");
    const idle = list(humanCountries).filter((country) =>
      !ready.some((seat) => same(seat, country)) && !planned.some((action) => same(action?.ownerCode, country)));
    if (!idle.length) return null;
    const at = new Date().toISOString();
    return [...list(actions), ...idle.map((country) => {
      added.push(country);
      return {
        id: `order-${Date.now().toString(36)}-caretaker-${added.length}`,
        kind: "action",
        source: CARETAKER_SOURCE,
        status: "planned",
        title: "Carry on softly (no orders were sent this week)",
        text: caretakerText(country),
        rawInput: caretakerText(country),
        ownerCode: country,
        createdAt: at,
      };
    })];
  });
  if (added.length) log(`no orders from ${added.join(", ")}: their governments carry on softly this week`);
  return added;
};
// A Game Master's command (AI/gameMasterOrders.js): the lead's, queued for the
// coming period like an order, with no owner, so only the lead's view holds it
// and the lead can take it back as one of their own. The next time skip
// carries it out above every other rule, for any polity.
const GAME_MASTER_SOURCE = "game-master";
const addGameMasterOrder = async (text) => {
  const body = String(text ?? "").trim().slice(0, 1500);
  if (!body) throw new Error("Write the command.");
  if (host?.status().round?.phase === "resolving") throw new Error("The round is being played; give the command once its news is in.");
  const id = `order-${Date.now().toString(36)}-gm-${rid().slice(0, 6)}`;
  const title = `Game Master: ${clean(body).length > 52 ? `${clean(body).slice(0, 49)}...` : clean(body)}`;
  await engine.mutateActionsState((actions) => [...list(actions), {
    id, kind: "action", source: GAME_MASTER_SOURCE, status: "planned", title, text: body, rawInput: body, createdAt: new Date().toISOString(),
  }]);
  log(`a Game Master's command was queued (${id})`);
  return { id, title };
};
const gameMasterOrders = async () => list((await store.read()).actions)
  .filter((action) => action?.source === GAME_MASTER_SOURCE && clean(action?.status || "planned") === "planned")
  .map((action) => ({ id: clean(action.id), text: clean(action.text || action.title) }));

const dropCaretakerOrders = () => engine.mutateActionsState((actions) => {
  const kept = list(actions).filter((action) => !(action?.source === CARETAKER_SOURCE && clean(action?.status || "planned") === "planned"));
  return kept.length === list(actions).length ? null : kept;
});

// Every polity of the game gets its stat sheet (its Economy tab's figures),
// written by the game's own reading as a player's Stats pane asks for one
// (readCountryForPlayer), one at a time in the background: after the game
// starts, after each week (for a country founded in it), and when a kept game
// is opened again. A complete sheet is not asked again, and the time skip
// refreshes the ones it touches.
let sheetsRunning = null;
const fillStatSheets = () => {
  if (sheetsRunning || !meta.started) return sheetsRunning;
  sheetsRunning = (async () => {
    const docs = await store.read();
    const groups = new Set(groupNames(docs.world).map((name) => name.toLocaleLowerCase()));
    const played = new Set([meta.lead?.country, ...list(meta.players).map((p) => p.country)].map((c) => clean(c).toLocaleLowerCase()));
    // A scenario group nobody has made a polity has no economy of its own.
    const polities = choosableCountries(docs.world, docs.game)
      .filter((name) => !groups.has(name.toLocaleLowerCase()) || played.has(name.toLocaleLowerCase()) || Object.values(docs.world?.polityOverrides ?? {}).some((entry) => same(entry?.name, name)));
    const missing = polities.filter((name) => !docs.world?.countryStats?.[name]);
    if (!missing.length) return;
    log(`writing the stat sheets of ${missing.length} polit${missing.length === 1 ? "y" : "ies"}`);
    let written = 0;
    for (const name of missing) {
      // The week comes first: a sheet waits for it rather than sharing the key.
      while (host?.status().round?.phase === "resolving") await new Promise((r) => setTimeout(r, 5000));
      try {
        await engine.readCountryForPlayer(name);
        written += 1;
      } catch (error) {
        log(`warn: ${name}'s stat sheet was not written: ${error?.message || error}`);
      } finally {
        await forwardAiCalls();
      }
    }
    log(`stat sheets written: ${written} of ${missing.length}`);
  })().catch((error) => log(`warn: the stat sheets stopped: ${error?.message || error}`)).finally(() => { sheetsRunning = null; });
  return sheetsRunning;
};

// The host, built from `meta`: the lead's seat first, then every other player
// joined again and seated where they were. Used to open the game, to reopen a
// kept one, and to hand the lead on.
// The settings the host plays its rounds by: the one object it reads a round's
// days from when the round is played (gameHost.js), so a change to it is the
// next round's.
let hostSettings = null;
const buildHost = async () => {
  const checked = engine.normalizeSettings(meta.settings);
  if (!checked.ok) throw new Error(checked.error);
  hostSettings = checked.settings;
  const docs = await store.read();
  const countries = choosableCountries(docs.world, docs.game);
  const lead = meta.lead;
  engine.setHostingSharedGame(true, { host: lead.country });
  if (process.env.OH_HEADLESS_AI === "mock-answer") {
    shims.setMockAnswer(mockTimeSkipAnswer({ start: docs.game?.gameDate, days: checked.settings.daysPerRound }));
  }
  host = engine.createGameHost({
    transport: { send: (playerId, message) => emit("to-player", { playerId, message }) },
    settings: checked.settings,
    hostSeat: { device: clean(lead.id), name: clean(lead.name), country: lead.country },
    scenario: { id: scenarioId, name: "Open Historia", hash: "" },
    countries,
    store,
    // A country's stat sheet for a player whose Stats pane has none (its
    // Economy tab), written by the game's own reading on the host's AI key, as
    // the desktop host's engine window does; the host allows a player a few a
    // round (gameHost.js MAX_SHEETS_PER_ROUND). A new game has none at all.
    readCountry: async ({ country, fresh }) => {
      const now = await store.read();
      const name = choosableCountries(now.world, now.game).find((known) => clean(known).toLocaleLowerCase() === clean(country).toLocaleLowerCase());
      if (!name) throw new Error("That is not a country of this game.");
      try {
        if (fresh) await engine.generateCountryStatSheet({ code: name, name, forceReassess: true });
        else await engine.readCountryForPlayer(name);
      } finally {
        await forwardAiCalls();
      }
    },
    resolveRound: async ({ daysPerRound, humanCountries }) => {
      // Each player's open projects stand on the game's board for the skip and go
      // home afterwards (engineMain.js).
      const people = { host: meta.lead.country, humans: list(humanCountries) };
      let hostHad = new Set();
      await engine.mutateWorldState((world) => {
        hostHad = new Set(list(world?.projects).map((row) => clean(row?.id)).filter(Boolean));
        const lent = engine.lendBoards(world, people);
        for (const board of Object.values(lent?.seatBoards ?? {})) for (const row of list(board)) hostHad.delete(clean(row?.id));
        return lent === world ? null : lent;
      });
      await addCaretakerOrders(people.humans);
      try {
        await engine.simulateTimelineJump({ days: daysPerRound });
      } catch (error) {
        engine.discardHeldTurns();
        await dropCaretakerOrders();
        throw error;
      } finally {
        await forwardAiCalls({ round: true });
        await engine.mutateWorldState((world) => {
          const home = engine.returnBoards(world, { ...people, hostHad });
          return home === world ? null : home;
        });
      }
      // A country founded this week has no sheet yet.
      fillStatSheets();
    },
    // The map as this game's own engine reads it, for the war room's lines and
    // fleets: without it a fleet could be sent nowhere ("the map could not be read").
    readChart: () => engine.warRoomChart(),
    // A player's institution business, run here for their country, as the
    // desktop host runs it. Without it every founding, invitation and vote
    // came back "Institutions are not run here."
    institution: engine.createInstitutionDesk({
      host: () => meta.lead.country,
      game: {
        lifecycle: (args) => engine.commitInstitutionLifecycleCommand(args),
        negotiation: (args) => engine.ensureInstitutionLifecycleNegotiationChat(args),
        channel: (args) => engine.ensureInstitutionalChannel(args),
        proposal: (args) => engine.commitInstitutionalPlayerProposal(args),
        voteRequest: (args) => engine.commitWithVotingRuleBackfill(
          () => engine.commitInstitutionalPlayerVoteRequest(args),
          { institutionId: args.institutionId, proposalId: args.proposalId },
        ),
        governance: (args) => engine.commitInstitutionGovernanceCommand(args),
        message: (args) => engine.commitInstitutionalPlayerMessage(args),
        chatTurn: async (args) => {
          try { return await tableTurn(args); } finally { await forwardAiCalls(); }
        },
        readChats: () => engine.readChatsState({ force: true }),
        updateChats: (fn) => engine.mutateChatsState(fn),
      },
    }),
    // A seat that followed its people to the country they founded
    // (multiplayer/host/foundings.js), kept for a restart.
    onSeatsMoved: (moves) => {
      for (const { from, to } of moves) {
        const seat = [meta.lead, ...meta.players].find((p) => clean(p?.country).toLowerCase() === clean(from).toLowerCase());
        if (!seat) continue;
        seat.country = to;
        if (seat === meta.lead) engine.setHostingSharedGame(true, { host: to });
        // Remembered, so a rewind past the founding puts the seat back.
        meta.foundings = [...list(meta.foundings), { from, to }];
        emit("seat", { playerId: seat.id, from, to });
      }
      saveMeta();
    },
    log: (level, message, detail) => log(`${level}: ${message}`, detail),
  });
  host.start();
  connections.clear();
  const leadConnection = connectionOf(lead);
  connections.set(leadConnection.id, leadConnection);
  host.join(leadConnection);
  for (const player of meta.players) {
    const connection = connectionOf(player);
    connections.set(connection.id, connection);
    host.join(connection);
    if (player.country) await host.receive(connection, { t: "pick", id: rid(), country: player.country });
  }
  if (meta.started) await host.control.start();
};

// The lead passes to `next` (a player of meta.players). What was the old lead's
// by default - its Projects board (world.projects) and the threads with no
// owner written on them - is written down as theirs first, and the new lead's
// own board takes the game's place.
const handOver = async (next, { leaving }) => {
  if (host.status().round.phase === "resolving") throw new Error("a round is being resolved; hand the lead on once it is done");
  const old = meta.lead;
  await host.stop();
  await engine.mutateChatsState((chats) => list(chats).map((chat) => (chat && !clean(chat.player) ? { ...chat, player: old.country } : chat)));
  await engine.mutateWorldState((world) => {
    const boards = { ...(world?.seatBoards ?? {}) };
    const nextKey = Object.keys(boards).find((key) => same(key, next.country));
    const nextBoard = nextKey ? boards[nextKey] : [];
    if (nextKey) delete boards[nextKey];
    if (list(world?.projects).length) boards[old.country] = world.projects;
    return { ...world, projects: list(nextBoard), seatBoards: boards };
  });
  await store.updateGame((game) => ({ ...game, country: next.country }));
  meta.players = meta.players.filter((p) => p.id !== next.id);
  if (!leaving) meta.players.push({ id: old.id, name: old.name, country: old.country });
  meta.lead = { id: next.id, name: next.name, country: next.country };
  saveMeta();
  await buildHost();
  emit("lead", { playerId: next.id, country: next.country });
  log(`the lead passed from ${old.country} to ${next.country}`);
  return { lead: meta.lead };
};

// `difficulty` is one of the game's levels (runtime/difficulty.js), or the game's own.
const open = async ({ settings: input = {}, lead: leadSeat, difficulty = "" } = {}) => {
  if (host) throw new Error("this session is already open");
  const checked = engine.normalizeSettings(input);
  if (!checked.ok) throw new Error(checked.error);
  const docs = await store.read();
  const countries = choosableCountries(docs.world, docs.game);
  const country = countries.find((c) => same(c, leadSeat?.country));
  if (!country) throw new Error(`${leadSeat?.country} is not a country of this game`);
  // The lead seat is the game's own country: the time skip is told of the
  // others through game.humanCountries, as a desktop host's game is.
  await store.updateGame((game) => ({ ...game, country, ...(clean(difficulty) ? { difficulty: engine.normalizeDifficulty(difficulty) } : {}) }));
  meta = { ...meta, settings: input, lead: { id: clean(leadSeat.id), name: clean(leadSeat.name), country }, players: [], started: false };
  saveMeta();
  await buildHost();
  return { country, countries };
};

const commands = {
  open,
  join: ({ id, name }) => {
    if (!host) throw new Error("open the session first");
    const connection = connectionOf({ id, name });
    connections.set(connection.id, connection);
    if (connection.id !== meta.lead.id && !meta.players.some((p) => p.id === connection.id)) {
      meta.players.push({ id: connection.id, name: connection.name, country: "" });
      saveMeta();
    }
    host.join(connection);
    return { joined: connection.id };
  },
  // A player's request, held to the game's own schema first, as the network
  // session holds every request a real player sends (session/host.js).
  request: async ({ playerId, message }) => {
    const connection = connections.get(clean(playerId));
    if (!connection || !host) throw new Error("no such player");
    const schema = engine.PLAYER_REQUESTS[message?.t];
    if (!schema) throw new Error(`unknown request ${message?.t}`);
    const checked = engine.validate(schema, message);
    if (!checked.ok) throw new Error(checked.error);
    // A group is not a seat a player takes here (one already made a polity is).
    if (checked.value.t === "pick") {
      const world = (await store.read()).world ?? {};
      const group = groupNames(world).find((key) => same(key, checked.value.country));
      if (group && !Object.values(world.polityOverrides ?? {}).some((entry) => same(entry?.name, group))) throw new Error(`${group} is a group; players lead countries`);
    }
    await host.receive(connection, checked.value);
    // Where the player sits now, kept for a restart.
    const player = meta.players.find((p) => p.id === connection.id);
    if (player) {
      const seat = seatOfPlayer(connection.id);
      if (seat !== player.country) {
        player.country = seat;
        saveMeta();
      }
    }
    return { sent: message.t };
  },
  // For good: a player's seat goes back to the AI, and the lead's to the next
  // player who has a seat.
  leave: async ({ playerId }) => {
    const id = clean(playerId);
    if (!host) throw new Error("open the session first");
    if (id === meta.lead.id) {
      const next = meta.players.find((p) => p.country);
      if (!next) throw new Error("the lead is the last player with a seat; stop the game instead");
      return handOver(next, { leaving: true });
    }
    const player = meta.players.find((p) => p.id === id);
    if (!player) throw new Error("no such player");
    const connection = connections.get(id);
    if (player.country) host.control.kick(player.country);
    if (connection) host.leave(connection);
    connections.delete(id);
    meta.players = meta.players.filter((p) => p.id !== id);
    saveMeta();
    return { left: id };
  },
  // The last week taken back with the game's own undo (gameplay.js
  // rollBackToSnapshot, the restore point it keeps before every skip): the
  // world, the timeline and the orders as they stood before it, and that
  // round's planning again with everyone in their seat.
  rewind: async () => {
    if (!host) throw new Error("open the session first");
    if (["resolving", "revealing"].includes(host.status().round.phase)) throw new Error("a week is being played; take it back once it is done");
    const result = await engine.rollBackToSnapshot(0);
    if (!result) throw new Error("there is no week to take back");
    await host.stop();
    // A country founded in the week taken back is gone again: whoever followed
    // their people to it sits where they sat before.
    const docs = await store.read();
    const countries = choosableCountries(docs.world, docs.game);
    for (const founding of [...list(meta.foundings)].reverse()) {
      if (countries.includes(founding.to)) continue;
      for (const seat of [meta.lead, ...meta.players]) if (seat?.country === founding.to) seat.country = founding.from;
      meta.foundings = list(meta.foundings).filter((entry) => entry !== founding);
    }
    saveMeta();
    await buildHost();
    const game = (await store.read()).game;
    log(`the week was taken back to ${game?.gameDate}`);
    return { gameDate: game?.gameDate, round: game?.round, remaining: result.remaining };
  },
  start: async () => {
    await host.control.start();
    meta.started = true;
    saveMeta();
    fillStatSheets();
  },
  // The model the weeks are played on from now on (models.mjs): the lead's choice.
  // Offered: the models tried in this game, with what a week cost and took on
  // each; any other model a provider with a key lists may be chosen too
  // (models.mjs listAllModels, asked by the bot when its picker opens).
  models: async () => ({ current: playingModel(), currentName: modelName(playingModel()), offered: availableModels().map(({ id, name, wait, cost, good, weak }) => ({ id, name, wait, cost, good, weak })) }),
  model: async ({ id }) => {
    if (!isOffered(id)) throw new Error("That model is not offered here.");
    meta.model = setModel(id);
    saveMeta();
    return { current: meta.model };
  },
  // The lead's Game Master commands: one queued, and those still waiting.
  gm: async ({ text }) => {
    if (!host) throw new Error("open the session first");
    return addGameMasterOrder(text);
  },
  gmOrders: () => gameMasterOrders(),
  // One taken back (the host withdraws only orders a seat's own name is on).
  gmCancel: async ({ id }) => {
    if (host?.status().round?.phase !== "planning") throw new Error("Orders can be withdrawn while a round is being planned.");
    let found = false;
    await engine.mutateActionsState((actions) => {
      const kept = list(actions).filter((action) => !(action?.source === GAME_MASTER_SOURCE && clean(action?.id) === clean(id) && clean(action?.status || "planned") === "planned"));
      found = kept.length !== list(actions).length;
      return found ? kept : null;
    });
    if (!found) throw new Error("That is not one of your Game Master commands.");
    return { cancelled: clean(id) };
  },
  pause: () => host.control.pause(),
  resume: () => host.control.resume(),
  resolveNow: () => host.control.resolveNow(),
  status: async () => {
    const docs = await store.read();
    return {
      status: host?.status() ?? null, gameDate: docs.game?.gameDate, round: docs.game?.round, country: docs.game?.country,
      humanCountries: docs.game?.humanCountries ?? [], lead: meta.lead, players: meta.players, started: Boolean(meta.started), reopened, gameId: meta.gameId, model: modelName(playingModel()),
      // How many days a round plays: where the latest week's news begins.
      daysPerRound: Number(meta.settings?.daysPerRound) || 0,
    };
  },
  // The events an outsider may see: what the public channel may be told.
  publicEvents: async ({ since = "" } = {}) => {
    const view = engine.projectForViewer(await store.read(), PUBLIC_VIEWER);
    return list(view.events).filter((e) => !since || String(e?.date || "") > since).map((e) => ({ id: e.id, date: e.date, title: e.title, description: e.description, importance: e.importance }));
  },
  // The events one seat may read that the public may not: what to tell that
  // player privately.
  privateEvents: async ({ country, since = "" } = {}) => {
    const docs = await store.read();
    const open = new Set(list(engine.projectForViewer(docs, PUBLIC_VIEWER).events).map((e) => clean(e?.id)));
    return list(engine.projectForViewer(docs, country).events)
      .filter((e) => !open.has(clean(e?.id)) && (!since || String(e?.date || "") > since))
      .map((e) => ({ id: e.id, date: e.date, title: e.title, description: e.description, importance: e.importance }));
  },
  // What a player choosing a country is told of each: the public picture only
  // (its note, ruler, government, peoples, size and aims), never a faction's
  // inner strategy or who secretly answers to whom.
  profiles: async () => {
    const docs = await store.read();
    const tags = await engine.readJson(engine.JSON_URLS.tags, { defaultValue: {}, force: true });
    const world = docs.world ?? {};
    const overrides = Object.values(world.polityOverrides ?? {});
    const regions = {};
    for (const owner of Object.values(world.regionOwnershipOverrides ?? {})) regions[clean(owner)] = (regions[clean(owner)] ?? 0) + 1;
    const texts = (value, n) => list(value).map(clean).filter(Boolean).slice(0, n);
    return Object.fromEntries(choosableCountries(world, docs.game).map((name) => {
      const override = overrides.find((entry) => same(entry?.name, name)) ?? {};
      const actor = Object.values(world.politicalActors?.byPolity ?? {}).find((entry) => same(entry?.name ?? entry?.polityKey, name)) ?? {};
      const power = Object.values(world.powerStatus?.byPolity ?? {}).find((entry) => same(entry?.polityKey, name)) ?? {};
      const [about = "", character = ""] = String(override.note ?? "").split(/\n?Character:\s*/);
      const leader = actor.leader?.name ? `${clean(actor.leader.title)} ${clean(actor.leader.name)}`.trim() : "";
      const group = engine.normalizeGroups(world.groups)[groupNames(world).find((key) => same(key, name)) ?? ""];
      if (group) {
        const area = Object.values(world.groupAreas ?? {}).filter((owner) => same(owner, name)).length;
        return [name, { kind: "group", about: clean(group.description), regions: area, color: clean(group.color) || clean(override.color), goals: [], ambitions: [], fears: [], peoples: texts(tags?.[name], 6) }];
      }
      return [name, {
        kind: override.note && !actor.name && !Object.keys(world.regionOwnershipOverrides ?? {}).some((id) => same(world.regionOwnershipOverrides[id], name)) ? "faction" : "country",
        about: clean(about), character: clean(character), leader,
        government: clean(actor.government?.form), ideology: clean(actor.government?.ideology),
        peoples: texts(tags?.[name], 6), population: Number(override.population) || 0,
        regions: regions[name] ?? 0, tier: clean(power.tier).replace(/-/g, " "),
        goals: texts(actor.goals, 4), ambitions: texts(actor.ambitions, 3), fears: texts(actor.fears, 3),
        color: clean(override.color),
      }];
    }));
  },
  // A faction a player made up, before the game starts: a country of its own
  // (the game's faction maker, worldWithFaction), landless or holding up to
  // five regions nobody holds. The host is built again so its seat list has it,
  // and the player who made it takes it. With no host yet (a lead still
  // choosing), it is only written into the world, for `open`.
  createFaction: async ({ playerId = "", name: rawName, color = "", lore = "", regionIds = [] } = {}) => {
    if (meta.started) throw new Error("factions can only be made before the game starts");
    const name = clean(rawName);
    if (name.length < 2 || name.length > 40 || /[\p{Cc}<>]/u.test(name)) throw new Error("a faction's name is 2 to 40 characters");
    const docs = await store.read();
    const taken = [...choosableCountries(docs.world, docs.game), ...groupNames(docs.world)];
    if (taken.some((c) => same(c, name))) throw new Error(`${name} already exists`);
    const land = landRegions();
    const area = [...new Set(list(regionIds).map(clean).filter(Boolean))];
    if (area.length > 5) throw new Error("a faction starts with at most 5 regions");
    const strange = area.filter((id) => !land.has(id));
    if (strange.length) throw new Error(`not regions of this map: ${strange.join(", ")}`);
    const held = area.filter((id) => clean(docs.world?.regionOwnershipOverrides?.[id]));
    if (held.length) throw new Error(`already held by a country: ${held.map((id) => `${land.get(id)} (${docs.world.regionOwnershipOverrides[id]})`).join(", ")}`);
    let made = null;
    await engine.mutateWorldState((world) => {
      made = engine.worldWithFaction(world, { name, color, lore: String(lore ?? "").trim().slice(0, 1500), regionIds: area });
      return made.world;
    });
    await paint(made.name, made.color);
    if (host) {
      await host.stop();
      await buildHost();
      const id = clean(playerId);
      if (id) {
        if (!connections.has(id)) await commands.join({ id, name: meta.players.find((p) => p.id === id)?.name ?? id });
        await commands.request({ playerId: id, message: { t: "pick", id: rid(), country: made.name } });
      }
    }
    return { name: made.name, regions: area.map((id) => land.get(id)) };
  },
  // The flags as the game shows them: the game's own, else the scenario's
  // (polity name -> image as a data URL). A flag is public: every map shows it.
  flags: async () => engine.readJson(engine.JSON_URLS.flags, { defaultValue: {}, force: true }),
  // The game's difficulty levels and the one it is played at.
  difficulties: async () => ({
    current: engine.normalizeDifficulty((await store.read()).game?.difficulty),
    levels: engine.DIFFICULTY_LEVELS.map((level) => ({ id: level.id, label: level.label, emoji: level.emoji, blurb: level.blurb, description: level.description })),
  }),
  // The lead sets the difficulty; the next week is played at it.
  // How many game days the next rounds cover; the round being played keeps its own.
  setDays: async ({ days }) => {
    const count = Math.round(Number(days));
    if (!(count >= 1 && count <= 365)) throw new Error("A round covers 1 to 365 days.");
    if (host?.status().round?.phase === "resolving") throw new Error("The round is being played; change it once it is done.");
    meta = { ...meta, settings: { ...meta.settings, daysPerRound: count } };
    saveMeta();
    if (hostSettings) hostSettings.daysPerRound = count;
    if (process.env.OH_HEADLESS_AI === "mock-answer") {
      const docs = await store.read();
      shims.setMockAnswer(mockTimeSkipAnswer({ start: docs.game?.gameDate, days: count }));
    }
    return { days: count };
  },
  // Who wrote the latest round: "ai" (a model) or "fallback" (the engine's
  // stand-in), as the game's own turn history keeps it, with why it fell back.
  lastTurn: async () => {
    const history = list((await store.read()).world?.simulationHistory);
    const latest = history.reduce((best, entry) => (Number(entry?.round) > Number(best?.round ?? -1) ? entry : best), null);
    return latest ? { round: latest.round, source: clean(latest.source) || "ai", fallbackReason: clean(latest.fallbackReason) } : null;
  },
  setDifficulty: async ({ id }) => {
    const level = engine.DIFFICULTY_LEVELS.find((entry) => entry.id === clean(id));
    if (!level) throw new Error(`no difficulty ${id}`);
    await store.updateGame((game) => ({ ...game, difficulty: level.id }));
    return { id: level.id, label: level.label };
  },
  // The groups' areas (region id -> group), for the country page's map.
  areas: async () => ({ ...((await store.read()).world?.groupAreas ?? {}) }),
  // The war as one seat's map shows it, made with the game's own drawing
  // (Game/Map/FrontLayers.jsx, SeaBattleLayers.jsx) from what that seat may see:
  // each open battlefield as its last run left it (its painted ground as a PNG
  // and the corners it lies between, its troops, the arrows of their advances),
  // the sea battles and the blockades.
  warDrawings: async ({ country }) => warDrawings(engine, engine.projectForViewer(await store.read(), country), country, { log }),
  // Who holds each region now (region id -> polity), for the country page's map.
  owners: async () => ({ ...((await store.read()).world?.regionOwnershipOverrides ?? {}) }),
  // The polities a player may take.
  countries: async () => {
    const docs = await store.read();
    return choosableCountries(docs.world, docs.game);
  },
  // The id of every event on the timeline, secret or not: what a bot has
  // already told its players, when it starts.
  eventIds: async () => list((await store.read()).events).map((e) => clean(e?.id)).filter(Boolean),
  // The host's own events marked for some players only (event.audience).
  secretEvents: async () => list((await store.read()).events)
    .filter((e) => list(e?.audience).length)
    .map((e) => ({ id: clean(e.id), title: e.title, audience: e.audience })),
  // Whether the model really answered every time skip: a failed call still
  // advances the date, on the engine's placeholder event.
  // Where this session's own game server is (boot.mjs picks a free port), for
  // a page that reads the scenario's files from it.
  origin: async () => process.env.OH_HEADLESS_ORIGIN || "",
  health: async () => {
    const health = await shims.timeSkipHealth();
    const events = list((await store.read()).events);
    return { ...health, placeholderEvent: events.some((e) => e?.title === shims.FALLBACK_EVENT_TITLE) };
  },
  // Everything one seat may see (the game's own projection), for the world page.
  fullView: async ({ country }) => engine.projectForViewer(await store.read(), country),
  // One seat's diplomacy threads as its view shows them, for a page that keeps
  // them fresh while the governments answer.
  threads: async ({ country }) => engine.projectForViewer(await store.read(), country).chat,
  // What one seat may see, by its polity (for checks; a player's own view
  // arrives as "view" messages).
  viewOf: async ({ country }) => {
    const view = engine.projectForViewer(await store.read(), country);
    return { puppets: view.world?.puppets ?? [], events: list(view.events).map((e) => clean(e?.id)) };
  },
  stop: async () => {
    // Kept: the players stay written into the game for when it is opened again.
    if (!metaPath) await host?.stop?.();
    setTimeout(() => { stop(); process.exit(0); }, 50);
    return { stopping: true };
  },
};

// A kept game that had been opened is seated again as it was.
if (reopened && meta.lead && meta.settings) {
  await buildHost();
  fillStatSheets();
}

process.on("message", async ({ rid: requestId, cmd, args } = {}) => {
  try {
    const handler = commands[cmd];
    if (!handler) throw new Error(`unknown command ${cmd}`);
    const result = await handler(args ?? {});
    process.send?.({ rid: requestId, ok: true, result: result ?? null });
  } catch (error) {
    process.send?.({ rid: requestId, ok: false, error: String(error?.message || error) });
  }
});
emit("ready", { reopened });
