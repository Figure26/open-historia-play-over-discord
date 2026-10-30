// Headless engine spike: what a worker thread needs to look like a browser
// worker. build.mjs injects this ahead of every worker bundle, so it runs before
// the worker's own code assigns `self.onmessage`.
import { parentPort } from "node:worker_threads";
import { HeadlessWorker } from "./node-worker.js";

let handler = null;
const listeners = new Set();
globalThis.self = globalThis;
globalThis.window = globalThis;
// Modules the workers share with the page read the page's address when they
// load (runtime/assets.js), and some read settings; a worker thread inherits
// the process environment, so it can learn the same origin.
globalThis.location = new URL(`${process.env.OH_HEADLESS_ORIGIN || "http://127.0.0.1:3999"}/`);
if (typeof globalThis.localStorage === "undefined") {
  const map = new Map();
  const storage = {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(String(k)); },
    clear: () => map.clear(),
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
}
Object.defineProperty(globalThis, "onmessage", { get: () => handler, set: (fn) => { handler = fn; }, configurable: true });
globalThis.addEventListener = (type, fn) => { if (type === "message") listeners.add(fn); };
globalThis.removeEventListener = (type, fn) => { if (type === "message") listeners.delete(fn); };
globalThis.postMessage = (data) => parentPort.postMessage(data);
parentPort.on("message", (data) => {
  const event = { data };
  handler?.(event);
  for (const fn of listeners) fn(event);
});
// A worker may start workers of its own (the land war's rehearsers).
globalThis.Worker = HeadlessWorker;
