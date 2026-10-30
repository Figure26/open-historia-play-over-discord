// Headless engine spike: run several shared games at once, one process each.
//
//   const session = await startSession({ id: "guild-1", port: 4001 });
//   session.on("to-player", ({ playerId, message }) => ...);   // whisper this
//   await session.call("open", { settings, lead: { id, name, country } });
//   await session.call("request", { playerId, message: { t: "order", id, text } });
//   await session.stop();
//
// With `dataDir` the game is kept there, and a session started again on the
// same folder reopens it with everyone seated (session.mjs).
//
// The engine keeps its state in module scope, so each session is its own Node
// process with its own game server, port and data folder (session.mjs).
import { fork } from "node:child_process";
import { EventEmitter } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const startSession = ({ id, port, scenario = "new-scenario", days = 7, dataDir = "", env = {} } = {}) => new Promise((resolve, reject) => {
  const child = fork(path.join(here, "session.mjs"), [], {
    env: { ...process.env, ...env, OH_SESSION_ID: id, OH_SESSION_PORT: String(port), OH_SESSION_SCENARIO: scenario, OH_SESSION_DAYS: String(days), OH_SESSION_DATA: dataDir },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  const events = new EventEmitter();
  const pending = new Map();
  let nextRid = 0;
  let output = "";
  child.stdout.on("data", (d) => { output += d; });
  child.stderr.on("data", (d) => { output += d; });

  const session = {
    id,
    port,
    on: (name, fn) => { events.on(name, fn); return session; },
    call: (cmd, args = {}) => new Promise((ok, fail) => {
      const rid = ++nextRid;
      pending.set(rid, { ok, fail });
      child.send({ rid, cmd, args });
    }),
    stop: async () => {
      if (child.exitCode !== null) return;
      const exited = new Promise((r) => child.once("exit", r));
      try { await session.call("stop"); } catch { /* already going */ }
      await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))]);
      if (child.exitCode === null) child.kill();
    },
    output: () => output,
  };

  child.on("message", (message) => {
    if (message?.rid) {
      const waiter = pending.get(message.rid);
      pending.delete(message.rid);
      if (message.ok) waiter?.ok(message.result);
      else waiter?.fail(new Error(message.error));
      return;
    }
    if (message?.event === "ready") { session.reopened = Boolean(message.reopened); resolve(session); }
    else if (message?.event) events.emit(message.event, message);
  });
  child.on("exit", (code) => {
    for (const waiter of pending.values()) waiter.fail(new Error(`session ${id} exited (${code})`));
    pending.clear();
    events.emit("exit", { code });
    reject(new Error(`session ${id} exited before it was ready (${code}):\n${output.slice(-3000)}`));
  });
});
