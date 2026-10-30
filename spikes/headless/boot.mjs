// Headless engine spike: boot a game server on a copy of a scenario (a
// throwaway one, or a kept `dataDir` that a restart opens again),
// install the browser shims and load the engine. One boot per process: the
// engine keeps its state in module scope (the active game, its endpoints), so
// two games need two processes (sessions.mjs).
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MODEL, MODELS, aiStorageFor, availableModels, modelFor } from "./models.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");

// Whether nothing listens on this port of this machine yet.
const portFree = (port) => new Promise((resolve) => {
  const probe = net.createServer();
  probe.once("error", () => resolve(false));
  probe.once("listening", () => probe.close(() => resolve(true)));
  probe.listen(port, "127.0.0.1");
});

export const bootEngine = async ({
  scenario = "new-scenario",
  // The first port tried; a taken one is passed over for the next free one.
  port: firstPort = 3999,
  ai = process.env.OH_HEADLESS_AI || "mock",
  // The model the game plays on (models.mjs); a table may change it later
  // (setModel). Each provider's key comes from the environment.
  model = process.env.OH_HEADLESS_MODEL || DEFAULT_MODEL,
  customParams = process.env.OH_HEADLESS_PARAMS || "",
  // A folder of its own that outlives the process: the scenario is copied in
  // once, and the games played in it are still there next time.
  dataDir = "",
  log = () => {},
} = {}) => {
  const anthropicKey = String(process.env.ANTHROPIC_API_KEY ?? "").trim();
  if (!ai.startsWith("mock")) {
    if (anthropicKey && (!/^sk-ant-[\w-]{20,}$/.test(anthropicKey) || anthropicKey.includes("..."))) {
      throw new Error("ANTHROPIC_API_KEY is not a whole key (sk-ant-..., no spaces); none of it is sent anywhere else");
    }
    if (!availableModels().length) {
      throw new Error(`OH_HEADLESS_AI=live needs at least one model's key: ${[...new Set(MODELS.map((m) => m.key))].join(", ")}`);
    }
  }

  // A data folder holding only this scenario: thrown away on stop, unless kept.
  const kept = Boolean(dataDir);
  const data = kept ? path.resolve(dataDir) : fs.mkdtempSync(path.join(os.tmpdir(), "oh-headless-"));
  if (!fs.existsSync(path.join(data, "scenario-manifest.json"))) {
    fs.mkdirSync(data, { recursive: true });
    fs.cpSync(path.join(repo, "server/data/scenarios", scenario), path.join(data, "scenarios", scenario), { recursive: true });
    fs.writeFileSync(path.join(data, "scenario-manifest.json"), JSON.stringify({ version: 2, order: [scenario], activeScenarioId: scenario, selectedScenarioId: scenario }));
  } else {
    // A kept game's copy of the scenario takes the library's flags again: they
    // are its art, added or changed since (spikes/discord-bot/import-flags.mjs).
    // A flag the game set for itself is in the game's own flags.json and stays.
    const flags = path.join(repo, "server/data/scenarios", scenario, "flags.json");
    if (fs.existsSync(flags)) {
      fs.copyFileSync(flags, path.join(data, "scenarios", scenario, "flags.json"));
      // The game's own copy, made empty when it began before the scenario had
      // flags, would hide them: an empty one takes the scenario's.
      const games = path.join(data, "games");
      for (const game of fs.existsSync(games) ? fs.readdirSync(games) : []) {
        const own = path.join(games, game, "flags.json");
        try {
          if (fs.existsSync(own) && !Object.keys(JSON.parse(fs.readFileSync(own, "utf8")) ?? {}).length) fs.copyFileSync(flags, own);
        } catch { /* left as it is */ }
      }
    }
  }

  // Its own game server, on a port nobody else uses. Another game's server
  // already on the port answered for this one and took its games into its own
  // folder (a test run beside a live Discord bot, 2026-10-27): so the port must
  // be free, and the server that answers must be the one started here, which
  // says so on its own output.
  let server = null;
  let serverLog = "";
  let port = firstPort;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try { server?.kill(); } catch { /* gone */ }
    if (!kept) fs.rmSync(data, { recursive: true, force: true });
  };
  process.on("exit", stop);
  let up = false;
  for (let attempt = 0; attempt < 20; attempt++, port++) {
    if (!(await portFree(port))) continue;
    serverLog = "";
    const child = spawn(process.execPath, ["server/server.js"], {
      cwd: repo, env: { ...process.env, OH_DATA_DIR: data, PORT: String(port), OH_HOST: "" }, stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (d) => { serverLog += d; });
    child.stderr.on("data", (d) => { serverLog += d; });
    const listening = `Server running at http://localhost:${port}`;
    for (let i = 0; i < 60 && child.exitCode === null && !up; i++) {
      if (serverLog.includes(listening)) {
        try { up = (await fetch(`http://127.0.0.1:${port}/api/scenarios`)).ok; } catch { /* not yet */ }
      }
      if (!up) await new Promise((r) => setTimeout(r, 500));
    }
    // Ours, and still running: the one that answered is the one started here.
    up = up && child.exitCode === null;
    if (up) {
      server = child;
      break;
    }
    try { child.kill(); } catch { /* gone */ }
    // Taken between the look and the start: the next port.
    if (!/EADDRINUSE/.test(serverLog)) break;
  }
  const origin = `http://127.0.0.1:${port}`;
  if (!up) { stop(); throw new Error(`game server did not start (from port ${firstPort}):\n${serverLog.slice(-2000)}`); }
  log(`server up on ${origin} (data ${data})`);

  // The browser the engine expects, with an AI connection in its storage.
  // Mock mode plays on a fake Anthropic connection whatever the model (the
  // mock answers in Anthropic's shape), and spends nothing.
  // The game saves requests unless told not to (requestBudget.js
  // ai_save_requests), and saving them takes the lookup functions away: the
  // time skip then knows the map only from its summary, and a model told to
  // take a region it could not see there could not find it ("Try to take
  // Redvale Coast", 2026-10-28). A table plays with the lookups, at the cost of
  // more requests a week; OH_HEADLESS_SAVE_REQUESTS=1 saves them again.
  const saveRequests = process.env.OH_HEADLESS_SAVE_REQUESTS === "1" ? "1" : "0";
  const storageFor = (id) => ({
    ...(!ai.startsWith("mock")
      ? aiStorageFor(id, process.env, customParams)
      : {
        ai_connections: [{ id: "conn_headless", provider: "anthropic", name: "Headless", apiKey: "sk-mock", endpoint: "", customParams }],
        ai_fallback_list: [{ id: "entry_headless", connectionId: "conn_headless", model: "claude-sonnet-5-5", customParamsOverride: "", structuredMode: "auto" }],
      }),
    ai_save_requests: saveRequests,
  });
  process.env.OH_HEADLESS_ORIGIN = origin;
  process.env.OH_HEADLESS_AI = ai;
  process.env.OH_HEADLESS_STORAGE = JSON.stringify(storageFor(model));
  // A kept game keeps what its engine learned (shims.js), never its AI key.
  if (kept) process.env.OH_HEADLESS_STORAGE_FILE = path.join(data, "engine-storage.json");
  const shims = await import("./shims.js");
  const engine = await import("./out/engine.mjs");
  // Another model for the calls from now on: the game reads its AI settings
  // at every call. Never kept in the storage file (shims.js keeps seeded keys
  // out of it); the table keeps the model's id and sets it again on reopen.
  let playing = modelFor(model)?.id ?? "claude-sonnet-5-5";
  const setModel = (id) => {
    const chosen = modelFor(id) ?? (ai.startsWith("mock") ? MODELS.find((m) => m.id === id) : null);
    if (!chosen) return playing;
    for (const [key, value] of Object.entries(storageFor(chosen.id))) localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    playing = chosen.id;
    log(`AI model: ${playing}`);
    return playing;
  };
  log(`engine loaded; AI ${ai.startsWith("mock") ? ai : `LIVE (${playing})`}`);

  const readJsonAt = async (url) => (await fetch(`${origin}${url}`)).json();
  return { engine, shims, origin, data, stop, readJsonAt, serverLog: () => serverLog, setModel, model: () => playing };
};

// The fake AI's small valid time skip: a few events on the days of the skip and
// a relation change, so reading an answer and writing it are tested at no cost.
export const mockTimeSkipAnswer = ({ start, days, events: authored = null }) => {
  const [y, m, d] = String(start || "0354-01-01").split("-").map(Number);
  const day = (n) => new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10).replace(/^(\d+)/, (yr) => yr.padStart(4, "0"));
  const events = authored ?? [
    // On the week's first day, which is the last day of the week before: a bot
    // that told only what came after that day lost it.
    { date: day(0), title: "Heralds Proclaim the New Week Across the Amber Coast", importance: "minor", kind: "world", tags: ["Politics"],
      description: "At dawn the heralds of the Amber coast read the week's proclamations in every market square from Greywater to Harthaven." },
    { date: day(Math.min(2, days)), title: "Ember Warships Shadow Ambermark's Fishing Fleet", importance: "minor", kind: "military", tags: ["Military"],
      places: ["city: Greywater, country: Ambermark", "region: Ithil Coast", "sea: The Amber Sea"],
      description: "Three galleys of the Ember Covenant crossed the Amber Sea at first light and followed Ambermark's herring boats off the Ithil coast for most of the day, close enough for their crews to be seen on deck. The Coast Militia rowed out from Greywater, and the galleys turned back toward the Duskmoor Isle at dusk without a blow being struck." },
    { date: day(Math.min(5, days)), title: "Khazmoor's Thanes Debate the Red Mountain Mines", importance: "minor", kind: "world", tags: ["Politics"],
      places: ["country: Khazmoor", "region: North Red Mountains"],
      description: "In the Hall of Thanes, Eldest Thane Brokka Ironbeard demanded that High King Durin Stonehelm close the western mines until the dragon raids are answered. The guilds objected that the iron trade with the Fenwatch would collapse, and the hall broke up without a vote." },
  ];
  return (call) => {
    if (!call.tools.includes("submit_jump_result")) {
      return new Response(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "headless spike: only the time skip is faked" } }), { status: 400, headers: { "content-type": "application/json" } });
    }
    // Every order gets its outcome in an event that cites its id, as the prompt
    // asks of the model ("ORDERS - every one gets an outcome ... lists its id in
    // actionIds"); an order no event cites stays queued as overdue.
    const prompt = JSON.stringify(call.body ?? "").replace(/\\n/g, "\n");
    const orders = [...prompt.matchAll(/^- \[(order-[^\]]+)\] \(([^)]+)\) (.+)$/gm)]
      .map(([, id, country, text]) => ({ id, country, text: text.replace(/\\"/g, "\"").trim() }));
    const outcomes = [...new Map(orders.map((o) => [o.id, o])).values()].map((o, n) => ({
      date: day(Math.min(1 + n, days)),
      title: `${o.country} Carries Out Its Orders`,
      importance: "minor",
      kind: "player",
      tags: ["Politics"],
      impacts: { actionIds: [o.id] },
      // A covert order's outcome is known to its own government alone (the
      // shared game's rule: an event that is secret lists its audience).
      ...(/^(quietly|secretly|covertly)\b/i.test(o.text) ? { audience: [o.country] } : {}),
      description: `Officials of ${o.country} acted on the government's instruction: ${o.text} The work went ahead as ordered, and by the end of the week it was done.`,
    }));
    const input = {
      events: [...events.map((e) => ({ ...e, date: e.date || day(1) })), ...outcomes],
      stopDate: day(days),
      summary: "A tense quiet week.",
      relationUpdates: "The Ember Covenant~Ambermark~-65~strained~Ember galleys shadowed Ambermark's fishing fleet off the Ithil coast.",
      frontOrders: "",
      // Each player's advisor and three orders, when the prompt asks for them
      // (AI/seatAdvice.js): the polities named in its block.
      ...(() => {
        const asked = prompt.match(/one entry for each polity a person plays: ([^\n]+?)\.\n/);
        if (!asked) return {};
        return { seatAdvice: asked[1].split("; ").map((polity) => ({
          polity, advisorName: `Steward of ${polity}`, advisorTitle: "Keeper of the Seal",
          suggestions: [`Send envoys from ${polity} to its neighbours`, `Muster ${polity}'s levies on the border`, `Open ${polity}'s granaries to the poor`],
        })) };
      })(),
    };
    return new Response(JSON.stringify({
      id: "msg_headless", type: "message", role: "assistant", model: call.model,
      content: [{ type: "tool_use", id: "toolu_headless", name: "submit_jump_result", input }],
      stop_reason: "tool_use", usage: { input_tokens: 1, output_tokens: 1 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
};
