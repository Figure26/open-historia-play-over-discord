// Headless engine spike: the browser the game expects, enough of it to load and
// run the simulation in plain Node. Imported BEFORE the engine bundle, because
// several modules read `window` the moment they load (runtime/assets.js keeps
// window.location.origin at import time).
//
// Environment:
//   OH_HEADLESS_ORIGIN   the game server the engine talks to (http://127.0.0.1:3999)
//   OH_HEADLESS_STORAGE  JSON object seeded into localStorage (AI connections etc.)
//   OH_HEADLESS_STORAGE_FILE  where the rest of localStorage is kept between runs (optional)
//   OH_HEADLESS_AI       "mock" (default): AI calls are recorded and answered by
//                        the fake below; "live": they go to the provider.

import fs from "node:fs";
import { HeadlessWorker } from "./node-worker.js";

export { workerLog } from "./node-worker.js";

const ORIGIN = process.env.OH_HEADLESS_ORIGIN || "http://127.0.0.1:3999";

// ---- storage ---------------------------------------------------------------
class MemoryStorage {
  #map = new Map();
  #saved = () => {};
  get length() { return this.#map.size; }
  key(i) { return [...this.#map.keys()][i] ?? null; }
  getItem(k) { return this.#map.has(String(k)) ? this.#map.get(String(k)) : null; }
  setItem(k, v) { this.#map.set(String(k), String(v)); this.#saved(); }
  removeItem(k) { this.#map.delete(String(k)); this.#saved(); }
  clear() { this.#map.clear(); this.#saved(); }
  entries() { return [...this.#map]; }
  onChange(fn) { this.#saved = fn; }
}
const local = new MemoryStorage();
// A kept game's engine settings outlive the process (OH_HEADLESS_STORAGE_FILE):
// what the game learned, such as a model that takes no temperature, is not
// learned again with a refused call at every start. The seeded keys (the AI
// connection, which holds the key) are never written to it.
const seeded = JSON.parse(process.env.OH_HEADLESS_STORAGE || "{}");
const storageFile = process.env.OH_HEADLESS_STORAGE_FILE || "";
if (storageFile) {
  try {
    for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(storageFile, "utf8")))) if (!(k in seeded)) local.setItem(k, v);
  } catch { /* none yet */ }
}
for (const [k, v] of Object.entries(seeded)) {
  local.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
}
if (storageFile) {
  local.onChange(() => {
    try {
      fs.writeFileSync(storageFile, JSON.stringify(Object.fromEntries(local.entries().filter(([k]) => !(k in seeded)))));
    } catch { /* kept in memory as before */ }
  });
}
Object.defineProperty(globalThis, "localStorage", { value: local, configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: new MemoryStorage(), configurable: true });

// ---- window and document ---------------------------------------------------
const events = new EventTarget();
globalThis.window = globalThis;
globalThis.location = new URL(`${ORIGIN}/`);
globalThis.addEventListener = events.addEventListener.bind(events);
globalThis.removeEventListener = events.removeEventListener.bind(events);
globalThis.dispatchEvent = events.dispatchEvent.bind(events);
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.requestIdleCallback = (fn) => setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 1);
globalThis.cancelIdleCallback = (id) => clearTimeout(id);
globalThis.innerWidth = 1920;
globalThis.innerHeight = 1080;
globalThis.devicePixelRatio = 1;
const stubElement = () => ({
  style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  setAttribute() {}, getAttribute: () => null, appendChild() {}, removeChild() {}, append() {}, remove() {},
  addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  getContext: () => null, getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
});
globalThis.document = {
  ...stubElement(),
  visibilityState: "visible",
  hidden: false,
  readyState: "complete",
  documentElement: stubElement(),
  body: stubElement(),
  head: stubElement(),
  createElement: stubElement,
  createElementNS: stubElement,
  getElementById: () => null,
  addEventListener: events.addEventListener.bind(events),
  removeEventListener: events.removeEventListener.bind(events),
};

// ---- Worker ----------------------------------------------------------------
// The simulation's workers run on worker_threads (node-worker.js).
globalThis.Worker = HeadlessWorker;

// ---- fetch -----------------------------------------------------------------
// The game fetches its own server by relative path ("/api/runtime/json/world");
// Node needs them absolute. AI calls are recorded, and faked in mock mode.
export const aiCalls = [];
const realFetch = globalThis.fetch;
const AI_HOSTS = /api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com|api\.deepseek\.com|api\.moonshot\.ai/;
let mockAnswer = null;
export const setMockAnswer = (fn) => { mockAnswer = fn; };

globalThis.fetch = async (input, init = {}) => {
  let url = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url;
  if (typeof url === "string" && url.startsWith("/")) url = new URL(url, ORIGIN).href;
  if (AI_HOSTS.test(String(url))) {
    let body = null;
    try { body = JSON.parse(init.body || "null"); } catch { body = null; }
    const call = {
      url,
      model: body?.model,
      chars: String(init.body || "").length,
      // Anthropic names a tool at its top, the OpenAI shape under `function`,
      // Gemini a list of them under `functionDeclarations`.
      tools: (body?.tools || []).flatMap((t) => t.functionDeclarations?.map((d) => d.name) ?? [t.name ?? t.function?.name]).filter(Boolean),
      toolChoice: body?.tool_choice,
      stream: Boolean(body?.stream),
      task: (body?.system?.[0]?.text || body?.system || body?.messages?.[0]?.content || "").toString().slice(0, 80),
      body,
    };
    aiCalls.push(call);
    const response = (process.env.OH_HEADLESS_AI || "mock").startsWith("mock")
      ? (mockAnswer ? await mockAnswer(call) : new Response(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "headless spike: no AI in mock mode" } }), { status: 400, headers: { "content-type": "application/json" } }))
      : await realFetch(url ?? input, init);
    // What the AI actually answered, read from a copy so the game still reads
    // the original: the engine falls back to a placeholder event when a call
    // fails, so a run is only good if every time skip call came back a tool call.
    call.status = response.status;
    call.done = response.clone().text().then((text) => {
      call.toolUse = response.ok && /"type"\s*:\s*"tool_use"|content_block_start[\s\S]*?tool_use|"tool_calls"\s*:\s*\[\s*\{/.test(text);
      call.error = response.ok ? "" : text.slice(0, 300);
      // The answer itself, for the record a session keeps of each time skip.
      call.answer = text.slice(0, 4000000);
    }).catch((error) => { call.toolUse = false; call.error = String(error?.message || error); });
    return response;
  }
  return realFetch(url ?? input, init);
};

// The placeholder the engine writes when the time skip's AI call failed
// (gameplay.js deterministic fallback): seeing it means the model did not answer.
export const FALLBACK_EVENT_TITLE = "The international balance remains in motion";

// Whether every time skip call came back a tool call; with the reasons when not.
export const timeSkipHealth = async () => {
  const calls = aiCalls.filter((c) => c.tools.includes("submit_jump_result"));
  await Promise.all(calls.map((c) => c.done));
  const bad = calls.filter((c) => c.status !== 200 || !c.toolUse);
  return { calls: calls.length, ok: calls.length > 0 && !bad.length, problems: bad.map((c) => `HTTP ${c.status}${c.error ? `: ${c.error}` : " without a tool call"}`) };
};
