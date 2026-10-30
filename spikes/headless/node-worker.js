// Headless engine spike: a browser Worker on worker_threads.
//
// The simulation's workers (political background, world director, stat sheets,
// land war and its rehearsers) are created as
// `new Worker(new URL("./x.js", import.meta.url))`. build.mjs bundles each one
// beside engine.mjs under its own name, so that URL is a real file; this runs it
// on a thread with a browser Worker's surface. A worker file that was not
// bundled throws, as an unsupported Worker does in a browser, and the game takes
// its usual way round.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Worker as NodeWorker } from "node:worker_threads";

export const workerLog = [];

export class HeadlessWorker {
  #thread;
  #listeners = { message: new Set(), error: new Set() };
  onmessage = null;
  onerror = null;

  constructor(url, options = {}) {
    const file = url instanceof URL || String(url).startsWith("file:") ? fileURLToPath(url) : String(url);
    if (!fs.existsSync(file)) throw new Error(`headless: no bundled worker at ${file}`);
    this.#thread = new NodeWorker(file, { name: options.name });
    // A worker must never keep the process alive on its own.
    this.#thread.unref();
    workerLog.push({ name: options.name || file, at: Date.now() });
    this.#thread.on("message", (data) => this.#emit("message", { data }));
    this.#thread.on("error", (error) => this.#emit("error", { message: error?.message, error }));
  }

  #emit(type, event) {
    const handler = type === "message" ? this.onmessage : this.onerror;
    handler?.call(this, event);
    for (const listener of this.#listeners[type]) listener.call(this, event);
  }

  postMessage(data) { this.#thread.postMessage(data); }
  terminate() { this.#thread.terminate(); }
  addEventListener(type, listener) { this.#listeners[type]?.add(listener); }
  removeEventListener(type, listener) { this.#listeners[type]?.delete(listener); }
}
