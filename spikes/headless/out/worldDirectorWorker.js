import { createRequire as __ohRequire } from 'node:module'; const require = __ohRequire(import.meta.url);
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err2) => function __init() {
  if (err2) throw err2[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err2 = [e], e;
  }
};

// <define:import.meta.env>
var define_import_meta_env_default;
var init_define_import_meta_env = __esm({
  "<define:import.meta.env>"() {
    define_import_meta_env_default = { MODE: "production", DEV: false, PROD: true, SSR: false, BASE_URL: "/" };
  }
});

// spikes/headless/node-worker.js
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Worker as NodeWorker } from "node:worker_threads";
var workerLog, HeadlessWorker;
var init_node_worker = __esm({
  "spikes/headless/node-worker.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    workerLog = [];
    HeadlessWorker = class {
      #thread;
      #listeners = { message: /* @__PURE__ */ new Set(), error: /* @__PURE__ */ new Set() };
      onmessage = null;
      onerror = null;
      constructor(url, options = {}) {
        const file = url instanceof URL || String(url).startsWith("file:") ? fileURLToPath(url) : String(url);
        if (!fs.existsSync(file)) throw new Error(`headless: no bundled worker at ${file}`);
        this.#thread = new NodeWorker(file, { name: options.name });
        this.#thread.unref();
        workerLog.push({ name: options.name || file, at: Date.now() });
        this.#thread.on("message", (data) => this.#emit("message", { data }));
        this.#thread.on("error", (error) => this.#emit("error", { message: error?.message, error }));
      }
      #emit(type, event) {
        const handler2 = type === "message" ? this.onmessage : this.onerror;
        handler2?.call(this, event);
        for (const listener of this.#listeners[type]) listener.call(this, event);
      }
      postMessage(data) {
        this.#thread.postMessage(data);
      }
      terminate() {
        this.#thread.terminate();
      }
      addEventListener(type, listener) {
        this.#listeners[type]?.add(listener);
      }
      removeEventListener(type, listener) {
        this.#listeners[type]?.delete(listener);
      }
    };
  }
});

// spikes/headless/worker-shims.js
import { parentPort } from "node:worker_threads";
var handler, listeners;
var init_worker_shims = __esm({
  "spikes/headless/worker-shims.js"() {
    init_node_worker();
    handler = null;
    listeners = /* @__PURE__ */ new Set();
    globalThis.self = globalThis;
    globalThis.window = globalThis;
    globalThis.location = new URL(`${process.env.OH_HEADLESS_ORIGIN || "http://127.0.0.1:3999"}/`);
    if (typeof globalThis.localStorage === "undefined") {
      const map = /* @__PURE__ */ new Map();
      const storage = {
        get length() {
          return map.size;
        },
        key: (i2) => [...map.keys()][i2] ?? null,
        getItem: (k2) => map.has(String(k2)) ? map.get(String(k2)) : null,
        setItem: (k2, v2) => {
          map.set(String(k2), String(v2));
        },
        removeItem: (k2) => {
          map.delete(String(k2));
        },
        clear: () => map.clear()
      };
      Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    }
    Object.defineProperty(globalThis, "onmessage", { get: () => handler, set: (fn) => {
      handler = fn;
    }, configurable: true });
    globalThis.addEventListener = (type, fn) => {
      if (type === "message") listeners.add(fn);
    };
    globalThis.removeEventListener = (type, fn) => {
      if (type === "message") listeners.delete(fn);
    };
    globalThis.postMessage = (data) => parentPort.postMessage(data);
    parentPort.on("message", (data) => {
      const event = { data };
      handler?.(event);
      for (const fn of listeners) fn(event);
    });
    globalThis.Worker = HeadlessWorker;
  }
});

// src/runtime/gameDates.js
var DAY_MS, MAX_ABS_YEAR, text, pad, astronomicalYear, isLeap, gameDateDaysInMonth, utcMillis, parseGameDate, formatGameDate, normalizeGameDate, gameDateDayNumber, compareGameDates, gameDateYear;
var init_gameDates = __esm({
  "src/runtime/gameDates.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    DAY_MS = 864e5;
    MAX_ABS_YEAR = 999999;
    text = (value) => String(value ?? "").trim();
    pad = (n, width) => String(Math.abs(n)).padStart(width, "0");
    astronomicalYear = (year) => year < 0 ? year + 1 : year;
    isLeap = (astronomical) => astronomical % 4 === 0 && (astronomical % 100 !== 0 || astronomical % 400 === 0);
    gameDateDaysInMonth = (year, month) => {
      const lengths = [31, isLeap(astronomicalYear(year)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      return lengths[month - 1] ?? 0;
    };
    utcMillis = ({ year, month, day }) => {
      const date = /* @__PURE__ */ new Date(0);
      date.setUTCFullYear(astronomicalYear(year), month - 1, day);
      date.setUTCHours(0, 0, 0, 0);
      return date.getTime();
    };
    parseGameDate = (value) => {
      let raw = text(value);
      if (!raw) return null;
      let bc = false;
      const era = /\s*(BCE|BC|CE|AD)$/i.exec(raw);
      if (era) {
        bc = /^BC/i.test(era[1]);
        raw = raw.slice(0, era.index).trim();
      }
      const datePart = raw.split(/[T ]/, 1)[0];
      const match = /^([+-]?)(\d{1,6})-(\d{1,2})-(\d{1,2})$/.exec(datePart);
      if (!match) return null;
      let year = Number(match[2]);
      const month = Number(match[3]);
      const day = Number(match[4]);
      if (match[1] === "-" || bc) year = -year;
      if (year === 0 || Math.abs(year) > MAX_ABS_YEAR) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > gameDateDaysInMonth(year, month)) return null;
      return { year, month, day };
    };
    formatGameDate = (parts) => {
      if (!parts) return "";
      const { year, month, day } = parts;
      return `${year < 0 ? "-" : ""}${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
    };
    normalizeGameDate = (value) => formatGameDate(parseGameDate(value));
    gameDateDayNumber = (value) => {
      const parts = parseGameDate(value);
      return parts ? Math.round(utcMillis(parts) / DAY_MS) : null;
    };
    compareGameDates = (a, b2) => {
      const left = gameDateDayNumber(a);
      const right = gameDateDayNumber(b2);
      if (left !== null && right !== null) return left === right ? 0 : left < right ? -1 : 1;
      if (left !== null) return -1;
      if (right !== null) return 1;
      return text(a).localeCompare(text(b2));
    };
    gameDateYear = (value) => parseGameDate(value)?.year ?? null;
  }
});

// src/runtime/statsBackend.js
var STATS_BACKEND_KEYS;
var init_statsBackend = __esm({
  "src/runtime/statsBackend.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    STATS_BACKEND_KEYS = Object.freeze(["population", "gdp", "budgetBalance", "publicDebt"]);
  }
});

// src/runtime/warOutcomes.js
var WAR_OUTCOMES_MOST, clean, fold, list, normalizeWarOutcomes;
var init_warOutcomes = __esm({
  "src/runtime/warOutcomes.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    WAR_OUTCOMES_MOST = 24;
    clean = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold = (value) => clean(value).toLowerCase();
    list = (value) => Array.isArray(value) ? value : [];
    normalizeWarOutcomes = (value) => {
      const kept = [];
      const seen = /* @__PURE__ */ new Set();
      for (const raw of list(value)) {
        const winner = clean(raw?.winner);
        const loser = clean(raw?.loser);
        if (!winner || !loser || fold(winner) === fold(loser)) continue;
        const key = `${fold(winner)}${fold(loser)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        kept.push({ winner, loser });
        if (kept.length >= WAR_OUTCOMES_MOST) break;
      }
      return kept;
    };
  }
});

// src/runtime/warSettings.js
var WAR_MECHANICS, ERA_LABELS, MEN_PER_COUNTER_MOST, MUSTER_DAYS_MOST, WARFARE_FORMS, numberIn, normalizeEra, normalizeMusterPoints, normalizeWarfare, normalizeWarSettings;
var init_warSettings = __esm({
  "src/runtime/warSettings.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    init_warOutcomes();
    WAR_MECHANICS = Object.freeze(["fatigue", "weather", "terrain", "walls", "muster", "military", "air", "supply", "attrition"]);
    ERA_LABELS = Object.freeze(["Before 1500", "1500 to 1850", "1850 to 1945", "From 1945"]);
    MEN_PER_COUNTER_MOST = 1e6;
    MUSTER_DAYS_MOST = 3650;
    WARFARE_FORMS = Object.freeze(["front", "swarm"]);
    numberIn = (value, least, most) => {
      if (value === null || value === void 0 || value === "") return null;
      const number = Number(value);
      return Number.isFinite(number) && number >= least && number <= most ? number : null;
    };
    normalizeEra = (value) => {
      const era = numberIn(value, 0, 3);
      return era !== null && Number.isInteger(era) ? era : null;
    };
    normalizeMusterPoints = (value) => {
      if (!Array.isArray(value) || value.length < 2) return null;
      const points = value.slice(0, 2).map((point) => [numberIn(Array.isArray(point) ? point[0] : NaN, 1e-3, 1), numberIn(Array.isArray(point) ? point[1] : NaN, 0.1, MUSTER_DAYS_MOST)]);
      if (points.some(([share, days]) => share === null || days === null)) return null;
      points.sort((a, b2) => a[0] - b2[0]);
      if (points[1][0] - points[0][0] < 1e-3 || points[1][1] <= points[0][1]) return null;
      return points.map(([share, days]) => [Math.round(share * 1e3) / 1e3, Math.round(days * 10) / 10]);
    };
    normalizeWarfare = (value) => WARFARE_FORMS.includes(value) ? value : null;
    normalizeWarSettings = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const mechanics = {};
      for (const key of WAR_MECHANICS) if (typeof value.mechanics?.[key] === "boolean") mechanics[key] = value.mechanics[key];
      const men = numberIn(value.menPerCounter, 1, MEN_PER_COUNTER_MOST);
      const share = numberIn(value.manpowerShare, 1, 100);
      const outcomes = normalizeWarOutcomes(value.outcomes);
      return {
        mechanics,
        era: normalizeEra(value.era),
        menPerCounter: men === null ? null : Math.round(men),
        manpowerShare: share === null ? null : Math.round(share * 10) / 10,
        muster: normalizeMusterPoints(value.muster),
        ...outcomes.length > 0 ? { outcomes } : {},
        ...normalizeWarfare(value.warfare) ? { warfare: normalizeWarfare(value.warfare) } : {}
      };
    };
  }
});

// src/runtime/militaryStats.js
var MILITARY_STAT_FIELDS, RANGES, isRecord, normalizeMilitaryStats, MILITARY_SHIFT_FIELDS, normalizeMilitaryShift;
var init_militaryStats = __esm({
  "src/runtime/militaryStats.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_warSettings();
    MILITARY_STAT_FIELDS = Object.freeze(["quality", "technology", "land", "sea", "air", "spending", "weariness", "manpowerShare", "cavalryShare", "siegeShare", "menPerCounter", "muster"]);
    RANGES = Object.freeze({
      quality: [0, 100, 1],
      technology: [0, 100, 1],
      land: [0, 100, 1],
      sea: [0, 100, 1],
      air: [0, 100, 1],
      spending: [0, 100, 1],
      weariness: [0, 100, 1],
      manpowerShare: [0.1, 100, 10],
      cavalryShare: [0, 1, 1e3],
      siegeShare: [0, 1, 1e3],
      menPerCounter: [1, 1e6, 1]
    });
    isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
    normalizeMilitaryStats = (value) => {
      if (!isRecord(value)) return null;
      const out = {};
      for (const [key, [least, most, places]] of Object.entries(RANGES)) {
        const raw = value[key];
        if (raw === null || raw === void 0 || raw === "") continue;
        const number = Number(raw);
        if (!Number.isFinite(number)) continue;
        const kept = number < least ? least : number > most ? most : number;
        out[key] = Math.round(kept * places) / places;
      }
      const muster = normalizeMusterPoints(value.muster);
      if (muster) out.muster = muster;
      return Object.keys(out).length > 0 ? out : null;
    };
    MILITARY_SHIFT_FIELDS = Object.freeze(["quality", "technology", "land", "sea", "air", "spending", "manpowerShare"]);
    normalizeMilitaryShift = (value) => {
      if (!isRecord(value)) return null;
      const out = {};
      for (const field of MILITARY_SHIFT_FIELDS) {
        const raw = field === "manpowerShare" ? value.manpowerShare ?? value.manpower : value[field];
        if (raw === null || raw === void 0 || raw === "") continue;
        const number = Number(raw);
        if (!Number.isFinite(number) || number === 0) continue;
        out[field] = Math.round(number < -100 ? -100 : number > 100 ? 100 : number);
      }
      return Object.keys(out).length > 0 ? out : null;
    };
  }
});

// src/runtime/statIndexDefinitions.js
var MAX_STAT_INDICES, STAT_INDEX_KEY_PATTERN, STAT_KINDS, DEFAULT_STAT_INDEX_ROWS, DEFAULT_STAT_INDEX_KEYS, DEFAULT_CUSTOM_STAT_SECTIONS;
var init_statIndexDefinitions = __esm({
  "src/runtime/statIndexDefinitions.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    MAX_STAT_INDICES = 12;
    STAT_INDEX_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
    STAT_KINDS = Object.freeze(["index", "number", "percentage", "currency"]);
    DEFAULT_STAT_INDEX_ROWS = Object.freeze([
      Object.freeze({ key: "sovereignty", label: "Sovereignty", kind: "index", icon: "\u2691", color: "#f97316", description: "Practical political sovereignty and freedom of action." }),
      Object.freeze({ key: "foodAutonomy", label: "Food autonomy", kind: "index", icon: "\u{1F33E}", color: "#22c55e", description: "Ability to meet food needs without vulnerable external supply." }),
      Object.freeze({ key: "energyAutonomy", label: "Energy autonomy", kind: "index", icon: "\u26A1", color: "#eab308", description: "Ability to meet energy needs without vulnerable external supply." }),
      Object.freeze({ key: "economicIndependence", label: "Economic independence", kind: "index", icon: "\u{1F3E6}", color: "#06b6d4", description: "Economic resilience and freedom from external dependency." }),
      Object.freeze({ key: "internalSecurity", label: "Internal security", kind: "index", icon: "\u{1F6E1}", color: "#f43f5e", description: "Domestic security, institutional control, and resistance to internal disruption." }),
      Object.freeze({ key: "internationalReputation", label: "International reputation", kind: "index", icon: "\u{1F91D}", color: "#3b82f6", description: "International trust, legitimacy, and standing." })
    ]);
    DEFAULT_STAT_INDEX_KEYS = Object.freeze(DEFAULT_STAT_INDEX_ROWS.map((row) => row.key));
    DEFAULT_CUSTOM_STAT_SECTIONS = Object.freeze([
      Object.freeze({
        key: "national",
        label: "National",
        icon: "\u25C8",
        stats: Object.freeze([
          Object.freeze({ key: "nationalStability", label: "National stability", kind: "index", icon: "\u2696", color: "#22c55e", description: "Overall political and social stability." }),
          Object.freeze({ key: "intelligenceService", label: "Intelligence service", kind: "index", icon: "\u265F", color: "#38bdf8", description: "Capability of the polity's intelligence and counter-intelligence apparatus." })
        ])
      }),
      Object.freeze({ key: "strategic", label: "Strategic indices", icon: "\u2691", stats: DEFAULT_STAT_INDEX_ROWS }),
      Object.freeze({
        key: "population",
        label: "Population",
        icon: "\u265F",
        stats: Object.freeze([
          Object.freeze({ key: "totalPopulation", label: "Total population", kind: "number", icon: "\u265F", color: "#94a3b8", unit: "people", compact: true, decimals: 0, minimum: 0, description: "Population represented by this polity in the scenario's own accounting terms." })
        ])
      }),
      Object.freeze({
        key: "economy",
        label: "Economy",
        icon: "\u{1F4C8}",
        stats: Object.freeze([
          Object.freeze({ key: "gdp", label: "GDP", kind: "currency", icon: "\u{1F4B6}", color: "#34d399", prefix: "\u20AC", compact: true, decimals: 1, minimum: 0, description: "Scenario-appropriate total economic output. Change the label/unit for eras where GDP is not meaningful." }),
          Object.freeze({ key: "gdpPerCapita", label: "GDP/capita", kind: "currency", icon: "\u25EB", color: "#e5e7eb", prefix: "\u20AC", compact: true, decimals: 0, minimum: 0, description: "Scenario-appropriate output or income per person. Delete or repurpose when not meaningful." }),
          Object.freeze({ key: "inflation", label: "Inflation", kind: "percentage", icon: "\u2197", color: "#34d399", suffix: "%", decimals: 1, minimum: 0, maximum: 1e3, description: "Price inflation in percent." }),
          Object.freeze({ key: "unemployment", label: "Unemployment", kind: "percentage", icon: "\u265F", color: "#34d399", suffix: "%", decimals: 1, minimum: 0, maximum: 100, description: "Unemployment in percent." }),
          Object.freeze({ key: "publicDebt", label: "Public debt", kind: "percentage", icon: "\u25A5", color: "#34d399", suffix: "%", decimals: 1, minimum: 0, maximum: 1e3, description: "Public debt in the scenario's chosen percentage basis." }),
          Object.freeze({ key: "budgetBalance", label: "Budget balance", kind: "percentage", icon: "\xB1", color: "#34d399", suffix: "%", decimals: 1, minimum: -1e3, maximum: 1e3, description: "Budget balance in percent; negative values represent deficits." }),
          Object.freeze({ key: "agricultureShare", label: "Agriculture", kind: "percentage", icon: "\u{1F33E}", color: "#22c55e", suffix: "%", decimals: 0, minimum: 0, maximum: 100, description: "Agriculture share of output." }),
          Object.freeze({ key: "industryShare", label: "Industry", kind: "percentage", icon: "\u{1F3ED}", color: "#3b82f6", suffix: "%", decimals: 0, minimum: 0, maximum: 100, description: "Industry share of output." }),
          Object.freeze({ key: "servicesShare", label: "Services", kind: "percentage", icon: "\u25C6", color: "#f59e0b", suffix: "%", decimals: 0, minimum: 0, maximum: 100, description: "Services share of output." })
        ])
      })
    ]);
  }
});

// src/runtime/countryStats.js
var COUNTRY_STATS_SCHEMA_VERSION, COUNTRY_STATS_TRACKING_INTERVALS, COUNTRY_STATS_COMPONENT_GROUPS, COUNTRY_STATS_TERRITORIAL_SCOPES, COMPONENT_GROUP_SET, TERRITORIAL_SCOPE_SET, INDEX_KEYS, ECONOMY_NUMERIC_KEYS, clean2, clamp, MAX_CUSTOM_STATS_VALUES, normalizeCustomCountryStats, STAT_SCALES, STAT_SCALE_AFTER_NUMBER, parseStatNumber, normalizePercent, normalizeSignedPercent, componentKey, normalizeTerritorialComponents, aggregateTerritorialEconomy, normalizeCountryStatIndices, normalizeIndexKeys, normalizeBreakdown, normalizeEconomy, normalizePopulation, MAX_ACCOUNTED_ECONOMIC_EVENTS, MAX_SEMANTIC_SPLIT_COMPONENTS, normalizeCountryStatContinuity, copyTextField, normalizeCountryStatSheet, finalizeCountryStatSheet, HISTORY_INDEX_KEYS, HISTORY_ECONOMY_KEYS, HISTORY_BREAKDOWN_KEYS, isCompleteCountryStatSheet, buildEconomicConditionSummary, compactEconomicNumber, buildCompactEconomicContext;
var init_countryStats = __esm({
  "src/runtime/countryStats.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    init_statsBackend();
    init_militaryStats();
    init_statIndexDefinitions();
    COUNTRY_STATS_SCHEMA_VERSION = 1;
    COUNTRY_STATS_TRACKING_INTERVALS = Object.freeze([0, 3, 6, 12, 24]);
    COUNTRY_STATS_COMPONENT_GROUPS = Object.freeze([
      "core",
      "integrated",
      "overseas/dependent"
    ]);
    COUNTRY_STATS_TERRITORIAL_SCOPES = Object.freeze([
      "mapped",
      "nonterritorial"
    ]);
    COMPONENT_GROUP_SET = new Set(COUNTRY_STATS_COMPONENT_GROUPS);
    TERRITORIAL_SCOPE_SET = new Set(COUNTRY_STATS_TERRITORIAL_SCOPES);
    INDEX_KEYS = DEFAULT_STAT_INDEX_KEYS;
    ECONOMY_NUMERIC_KEYS = Object.freeze([
      "gdp",
      "gdpPerCapita",
      "coreGdpPerCapita",
      "otherGdpPerCapita",
      "gdpGrowth",
      "inflation",
      "unemployment",
      "publicDebt",
      "budgetBalance"
    ]);
    clean2 = (value) => String(value ?? "").trim();
    clamp = (value, min, max2) => Math.max(min, Math.min(max2, value));
    MAX_CUSTOM_STATS_VALUES = 60;
    normalizeCustomCountryStats = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
      const out = {};
      for (const [rawKey, rawValue] of Object.entries(value)) {
        const key = clean2(rawKey);
        if (!/^[A-Za-z][A-Za-z0-9]{0,39}$/.test(key)) continue;
        const number = parseStatNumber(rawValue);
        if (!Number.isFinite(number)) continue;
        out[key] = Math.max(-1e18, Math.min(1e18, number));
        if (Object.keys(out).length >= MAX_CUSTOM_STATS_VALUES) break;
      }
      return Object.keys(out).length ? out : void 0;
    };
    STAT_SCALES = Object.freeze({
      trillion: 1e12,
      tn: 1e12,
      t: 1e12,
      billion: 1e9,
      bn: 1e9,
      b: 1e9,
      million: 1e6,
      mn: 1e6,
      m: 1e6,
      thousand: 1e3,
      k: 1e3
    });
    STAT_SCALE_AFTER_NUMBER = /^\s*(trillion|tn|t|billion|bn|b|million|mn|m|thousand|k)(?![a-z])/;
    parseStatNumber = (value) => {
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
      if (typeof value !== "string") return null;
      const text3 = value.trim();
      if (!text3) return null;
      const normalized = text3.replace(/\u00a0/g, " ").replace(/,/g, "").replace(/−/g, "-").toLowerCase();
      const match = normalized.match(/[-+]?\d+(?:\.\d+)?/);
      if (!match) return null;
      const scale = normalized.slice(match.index + match[0].length).match(STAT_SCALE_AFTER_NUMBER);
      const number = Number(match[0]) * (scale ? STAT_SCALES[scale[1]] : 1);
      return Number.isFinite(number) ? number : null;
    };
    normalizePercent = (value) => {
      const parsed = parseStatNumber(value);
      return parsed == null ? null : clamp(parsed, 0, 100);
    };
    normalizeSignedPercent = (value) => {
      const parsed = parseStatNumber(value);
      return parsed == null ? null : clamp(parsed, -1e3, 1e3);
    };
    componentKey = (value) => clean2(value).toLocaleLowerCase();
    normalizeTerritorialComponents = (value) => {
      if (!Array.isArray(value)) return [];
      const byKey = /* @__PURE__ */ new Map();
      for (const item of value) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const geography = clean2(item.geography);
        const group = clean2(item.group).toLowerCase();
        const population = parseStatNumber(item.population);
        const gdpPerCapita = parseStatNumber(item.gdpPerCapita);
        if (!geography || !COMPONENT_GROUP_SET.has(group)) continue;
        if (!Number.isFinite(population) || population < 0) continue;
        if (!Number.isFinite(gdpPerCapita) || gdpPerCapita <= 0) continue;
        const normalized = {
          geography,
          group,
          population: Math.round(population),
          gdpPerCapita: Math.round(gdpPerCapita * 100) / 100
        };
        byKey.set(componentKey(geography), normalized);
      }
      return [...byKey.values()];
    };
    aggregateTerritorialEconomy = (componentsInput) => {
      const components = normalizeTerritorialComponents(componentsInput);
      if (!components.length) return null;
      let population = 0;
      let gdp = 0;
      let corePopulation = 0;
      let otherPopulation = 0;
      let coreGdp = 0;
      let otherGdp = 0;
      for (const component of components) {
        const componentGdp = component.population * component.gdpPerCapita;
        population += component.population;
        gdp += componentGdp;
        if (component.group === "overseas/dependent") {
          otherPopulation += component.population;
          otherGdp += componentGdp;
        } else {
          corePopulation += component.population;
          coreGdp += componentGdp;
        }
      }
      if (!(population > 0) || !(gdp > 0)) return null;
      return {
        population: Math.round(population),
        gdp,
        gdpPerCapita: gdp / population,
        corePopulation: Math.round(corePopulation),
        otherPopulation: Math.round(otherPopulation),
        coreGdp,
        otherGdp,
        coreGdpPerCapita: corePopulation > 0 ? coreGdp / corePopulation : null,
        otherGdpPerCapita: otherPopulation > 0 ? otherGdp / otherPopulation : null
      };
    };
    normalizeCountryStatIndices = (value, { allowedKeys = INDEX_KEYS } = {}) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
      const allowed = Array.isArray(allowedKeys) ? new Set(allowedKeys.map((key) => clean2(key)).filter((key) => STAT_INDEX_KEY_PATTERN.test(key))) : null;
      const out = {};
      for (const [key, raw] of Object.entries(value)) {
        if (Object.keys(out).length >= MAX_STAT_INDICES) break;
        if (!STAT_INDEX_KEY_PATTERN.test(key) || allowed && !allowed.has(key)) continue;
        const normalized = normalizePercent(raw);
        if (normalized != null) out[key] = Math.round(normalized);
      }
      return Object.keys(out).length ? out : void 0;
    };
    normalizeIndexKeys = (value) => {
      if (!Array.isArray(value)) return void 0;
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const raw of value) {
        const key = clean2(raw);
        const token = key.toLowerCase();
        if (!STAT_INDEX_KEY_PATTERN.test(key) || seen.has(token)) continue;
        seen.add(token);
        out.push(key);
        if (out.length >= MAX_STAT_INDICES) break;
      }
      return out.length ? out : void 0;
    };
    normalizeBreakdown = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
      const raw = ["agriculture", "industry", "services"].map((key) => normalizePercent(value[key]));
      if (raw.some((number) => number == null)) return void 0;
      const total = raw.reduce((sum, number) => sum + number, 0);
      if (!(total > 0)) return void 0;
      const scaled = raw.map((number) => number / total * 100);
      const floors = scaled.map((number) => Math.floor(number));
      let remainder = 100 - floors.reduce((sum, number) => sum + number, 0);
      const order = scaled.map((number, index) => ({ index, fraction: number - floors[index] })).sort((a, b2) => b2.fraction - a.fraction || a.index - b2.index);
      for (let i2 = 0; i2 < order.length && remainder > 0; i2 += 1, remainder -= 1) {
        floors[order[i2].index] += 1;
      }
      return {
        agriculture: floors[0],
        industry: floors[1],
        services: floors[2]
      };
    };
    normalizeEconomy = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
      const out = {};
      for (const key of ECONOMY_NUMERIC_KEYS) {
        let normalized = null;
        if (["gdpGrowth", "budgetBalance", "inflation"].includes(key)) normalized = normalizeSignedPercent(value[key]);
        else if (key === "unemployment") normalized = normalizePercent(value[key]);
        else if (key === "publicDebt") {
          const parsed = parseStatNumber(value[key]);
          normalized = parsed == null ? null : clamp(parsed, 0, 1e3);
        } else normalized = parseStatNumber(value[key]);
        if (normalized != null && Number.isFinite(normalized)) out[key] = normalized;
      }
      const currency = clean2(value.currency);
      if (currency) out.currency = currency;
      return Object.keys(out).length ? out : void 0;
    };
    normalizePopulation = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
      const out = {};
      for (const key of ["total", "coreIntegrated", "otherTerritories"]) {
        const number = parseStatNumber(value[key]);
        if (Number.isFinite(number) && number >= 0) out[key] = Math.round(number);
      }
      return Object.keys(out).length ? out : void 0;
    };
    MAX_ACCOUNTED_ECONOMIC_EVENTS = 64;
    MAX_SEMANTIC_SPLIT_COMPONENTS = 64;
    normalizeCountryStatContinuity = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
      const out = {};
      const assessedDate = clean2(value.assessedDate);
      const stateFingerprint = clean2(value.stateFingerprint);
      const territorialFingerprint = clean2(value.territorialFingerprint);
      const assessedRound = Number(value.assessedRound);
      const populationCalibrationVersion = Number(value.populationCalibrationVersion);
      if (assessedDate) out.assessedDate = assessedDate;
      if (Number.isFinite(assessedRound) && assessedRound >= 0) {
        out.assessedRound = Math.trunc(assessedRound);
      }
      if (stateFingerprint) out.stateFingerprint = stateFingerprint;
      if (territorialFingerprint) out.territorialFingerprint = territorialFingerprint;
      if (Number.isInteger(populationCalibrationVersion) && populationCalibrationVersion > 0) {
        out.populationCalibrationVersion = populationCalibrationVersion;
      }
      const accountedEventIds = [...new Set(
        (Array.isArray(value.accountedEventIds) ? value.accountedEventIds : []).map(clean2).filter(Boolean)
      )].slice(-MAX_ACCOUNTED_ECONOMIC_EVENTS);
      if (accountedEventIds.length) out.accountedEventIds = accountedEventIds;
      if (Array.isArray(value.semanticSplitComponents)) {
        const byGeography = /* @__PURE__ */ new Map();
        for (const entry of value.semanticSplitComponents) {
          const geography = clean2(entry?.geography);
          const regions = Number(entry?.regions);
          if (!geography || !Number.isInteger(regions) || regions < 0) continue;
          if (!byGeography.has(componentKey(geography))) byGeography.set(componentKey(geography), { geography, regions });
        }
        out.semanticSplitComponents = [...byGeography.values()].slice(0, MAX_SEMANTIC_SPLIT_COMPONENTS);
      }
      return Object.keys(out).length ? out : void 0;
    };
    copyTextField = (source, target, key) => {
      const text3 = clean2(source?.[key]);
      if (text3) target[key] = text3;
    };
    normalizeCountryStatSheet = (value, { indexKeys: expectedIndexKeys } = {}) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const out = {};
      for (const key of ["capital", "continent", "government", "leader"]) {
        copyTextField(value, out, key);
      }
      const stability = normalizePercent(value.stability);
      if (stability != null) out.stability = Math.round(stability);
      const customStats = normalizeCustomCountryStats(value.customStats);
      if (customStats) out.customStats = customStats;
      const indexKeys = normalizeIndexKeys(value.indexKeys);
      const indices = normalizeCountryStatIndices(value.indices, { allowedKeys: normalizeIndexKeys(expectedIndexKeys) || indexKeys || INDEX_KEYS });
      if (indices) out.indices = indices;
      if (indexKeys) out.indexKeys = indexKeys;
      const economy = normalizeEconomy(value.economy);
      if (economy) out.economy = economy;
      const population = normalizePopulation(value.population);
      if (population) out.population = population;
      const breakdown = normalizeBreakdown(value.gdpBreakdown);
      if (breakdown) out.gdpBreakdown = breakdown;
      const territorialScope = clean2(value.territorialScope).toLowerCase();
      if (TERRITORIAL_SCOPE_SET.has(territorialScope)) out.territorialScope = territorialScope;
      const hasExplicitComponents = Array.isArray(value.territorialComponents);
      const components = normalizeTerritorialComponents(value.territorialComponents);
      if (components.length || hasExplicitComponents) out.territorialComponents = components;
      const continuity = normalizeCountryStatContinuity(value.continuity);
      if (continuity) out.continuity = continuity;
      const military = normalizeMilitaryStats(value.military);
      if (military) out.military = military;
      const declaredVersion = Number(value.statsSchemaVersion);
      out.statsSchemaVersion = Number.isInteger(declaredVersion) && declaredVersion > 0 ? declaredVersion : components.length || territorialScope === "nonterritorial" ? COUNTRY_STATS_SCHEMA_VERSION : 0;
      if (components.length) return finalizeCountryStatSheet(out);
      return out;
    };
    finalizeCountryStatSheet = (value, { indexKeys: expectedIndexKeys } = {}) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return value;
      const out = {};
      for (const key of ["capital", "continent", "government", "leader"]) copyTextField(value, out, key);
      const stability = normalizePercent(value.stability);
      if (stability != null) out.stability = Math.round(stability);
      const customStats = normalizeCustomCountryStats(value.customStats);
      if (customStats) out.customStats = customStats;
      const indexKeys = normalizeIndexKeys(value.indexKeys);
      const indices = normalizeCountryStatIndices(value.indices, { allowedKeys: normalizeIndexKeys(expectedIndexKeys) || indexKeys || INDEX_KEYS });
      if (indices) out.indices = indices;
      if (indexKeys) out.indexKeys = indexKeys;
      const breakdown = normalizeBreakdown(value.gdpBreakdown);
      if (breakdown) out.gdpBreakdown = breakdown;
      const territorialScope = clean2(value.territorialScope).toLowerCase();
      if (TERRITORIAL_SCOPE_SET.has(territorialScope)) out.territorialScope = territorialScope;
      const economy = normalizeEconomy(value.economy) || {};
      const hasExplicitComponents = Array.isArray(value.territorialComponents);
      const components = normalizeTerritorialComponents(value.territorialComponents);
      const aggregate = aggregateTerritorialEconomy(components);
      const continuity = normalizeCountryStatContinuity(value.continuity);
      if (components.length || hasExplicitComponents) out.territorialComponents = components;
      if (continuity) out.continuity = continuity;
      const military = normalizeMilitaryStats(value.military);
      if (military) out.military = military;
      if (aggregate) {
        out.population = {
          total: aggregate.population,
          coreIntegrated: aggregate.corePopulation,
          otherTerritories: aggregate.otherPopulation
        };
        out.economy = {
          ...economy,
          gdp: Math.round(aggregate.gdp),
          gdpPerCapita: Math.round(aggregate.gdpPerCapita * 100) / 100,
          ...aggregate.coreGdpPerCapita == null ? {} : { coreGdpPerCapita: Math.round(aggregate.coreGdpPerCapita * 100) / 100 },
          ...aggregate.otherGdpPerCapita == null ? {} : { otherGdpPerCapita: Math.round(aggregate.otherGdpPerCapita * 100) / 100 }
        };
        out.statsSchemaVersion = COUNTRY_STATS_SCHEMA_VERSION;
      } else {
        const population = normalizePopulation(value.population);
        if (population) out.population = population;
        if (Object.keys(economy).length) out.economy = economy;
        const declaredVersion = Number(value.statsSchemaVersion);
        out.statsSchemaVersion = Number.isInteger(declaredVersion) && declaredVersion > 0 ? declaredVersion : territorialScope === "nonterritorial" ? COUNTRY_STATS_SCHEMA_VERSION : 0;
      }
      return out;
    };
    HISTORY_INDEX_KEYS = Object.freeze([
      "sovereignty",
      "foodAutonomy",
      "energyAutonomy",
      "economicIndependence",
      "internalSecurity",
      "internationalReputation"
    ]);
    HISTORY_ECONOMY_KEYS = Object.freeze([
      "gdp",
      "gdpPerCapita",
      "gdpGrowth",
      "inflation",
      "unemployment",
      "publicDebt",
      "budgetBalance"
    ]);
    HISTORY_BREAKDOWN_KEYS = Object.freeze([
      "agriculture",
      "industry",
      "services"
    ]);
    isCompleteCountryStatSheet = (value) => {
      const sheet = finalizeCountryStatSheet(value);
      if (!sheet || sheet.statsSchemaVersion !== COUNTRY_STATS_SCHEMA_VERSION) return false;
      if (!["capital", "continent", "government", "leader"].every((key) => clean2(sheet[key]))) return false;
      if (!Number.isFinite(Number(sheet.stability))) return false;
      const expectedIndexKeys = normalizeIndexKeys(sheet.indexKeys) || INDEX_KEYS;
      if (!expectedIndexKeys.length || !expectedIndexKeys.every((key) => Number.isFinite(Number(sheet.indices?.[key])))) return false;
      if (!Array.isArray(sheet.territorialComponents)) return false;
      const nonterritorial = sheet.territorialScope === "nonterritorial";
      if (!nonterritorial && sheet.territorialComponents.length < 1) return false;
      if (!nonterritorial && !(Number(sheet.population?.total) > 0)) return false;
      if (!nonterritorial && (!(Number(sheet.economy?.gdp) > 0) || !(Number(sheet.economy?.gdpPerCapita) > 0))) return false;
      if (!["gdpGrowth", "inflation", "unemployment", "publicDebt", "budgetBalance"].every(
        (key) => Number.isFinite(Number(sheet.economy?.[key]))
      )) return false;
      if (!clean2(sheet.economy?.currency)) return false;
      const breakdown = sheet.gdpBreakdown;
      if (!breakdown || breakdown.agriculture + breakdown.industry + breakdown.services !== 100) return false;
      return true;
    };
    buildEconomicConditionSummary = (value) => {
      const sheet = finalizeCountryStatSheet(value);
      if (!sheet || !sheet.economy) return "No canonical economic stat sheet is available yet.";
      const economy = sheet.economy;
      const growth = Number(economy.gdpGrowth);
      const inflation = Number(economy.inflation);
      const unemployment = Number(economy.unemployment);
      const debt = Number(economy.publicDebt);
      const balance = Number(economy.budgetBalance);
      const clauses = [];
      if (Number.isFinite(growth)) {
        clauses.push(growth <= -5 ? "severe contraction" : growth < -1 ? "economic contraction" : growth >= 5 ? "rapid growth" : growth > 1 ? "positive growth" : "near-stagnant growth");
      }
      if (Number.isFinite(inflation)) {
        if (inflation >= 20) clauses.push("very high inflation");
        else if (inflation >= 8) clauses.push("elevated inflation");
        else if (inflation < 0) clauses.push("deflation");
        else if (inflation <= 3) clauses.push("contained inflation");
      }
      if (Number.isFinite(unemployment)) {
        if (unemployment >= 15) clauses.push("very high unemployment");
        else if (unemployment >= 8) clauses.push("high unemployment");
      }
      if (Number.isFinite(debt)) {
        if (debt >= 120) clauses.push("very heavy public debt");
        else if (debt >= 80) clauses.push("high public debt");
      }
      if (Number.isFinite(balance)) {
        if (balance <= -10) clauses.push("extreme fiscal deficit");
        else if (balance <= -5) clauses.push("large fiscal deficit");
        else if (balance >= 3) clauses.push("strong fiscal surplus");
      }
      const position = clauses.length ? clauses.join(", ") : "broadly moderate recorded conditions";
      return `${position}. Economic stress constrains the cost and financing of major programs; it does not make them impossible. Extraordinary spending may require borrowing, taxation, cuts elsewhere, foreign finance, or acceptance of inflation/debt consequences.`;
    };
    compactEconomicNumber = (value) => {
      const number = Number(value);
      if (!Number.isFinite(number)) return "\u2014";
      const abs = Math.abs(number);
      if (abs >= 1e12) return `${Math.round(number / 1e12 * 10) / 10}T`;
      if (abs >= 1e9) return `${Math.round(number / 1e9 * 10) / 10}B`;
      if (abs >= 1e6) return `${Math.round(number / 1e6 * 10) / 10}M`;
      if (abs >= 1e3) return `${Math.round(number / 1e3 * 10) / 10}K`;
      return `${Math.round(number * 10) / 10}`;
    };
    buildCompactEconomicContext = (value, { name = "", conditions = true } = {}) => {
      const sheet = finalizeCountryStatSheet(value);
      if (!sheet || !sheet.economy) return "";
      const economy = sheet.economy;
      const breakdown = sheet.gdpBreakdown || {};
      const indices = sheet.indices || {};
      const fields = [
        Number.isFinite(Number(economy.gdp)) ? `GDP-eq \u20AC${compactEconomicNumber(economy.gdp)}` : "",
        Number.isFinite(Number(economy.gdpGrowth)) ? `growth ${Number(economy.gdpGrowth)}%` : "",
        Number.isFinite(Number(economy.inflation)) ? `inflation ${Number(economy.inflation)}%` : "",
        Number.isFinite(Number(economy.unemployment)) ? `unemployment ${Number(economy.unemployment)}%` : "",
        Number.isFinite(Number(economy.publicDebt)) ? `debt ${Number(economy.publicDebt)}% GDP` : "",
        Number.isFinite(Number(economy.budgetBalance)) ? `budget ${Number(economy.budgetBalance)}% GDP` : "",
        Number.isFinite(Number(breakdown.industry)) ? `industry ${Number(breakdown.industry)}%` : "",
        Number.isFinite(Number(indices.foodAutonomy)) ? `food autonomy ${Number(indices.foodAutonomy)}/100` : "",
        Number.isFinite(Number(indices.energyAutonomy)) ? `energy autonomy ${Number(indices.energyAutonomy)}/100` : "",
        Number.isFinite(Number(indices.economicIndependence)) ? `economic independence ${Number(indices.economicIndependence)}/100` : ""
      ].filter(Boolean);
      if (!fields.length) return "";
      const prefix = clean2(name);
      return `${prefix ? `${prefix}: ` : ""}${fields.join("; ")}.${conditions ? ` ${buildEconomicConditionSummary(sheet)}` : ""}`;
    };
  }
});

// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
function gunzipSync(data, opts) {
  var st = gzs(data);
  if (st + 8 > data.length)
    err(6, "invalid gzip data");
  return inflt(data.subarray(st, -8), { i: 2 }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
}
function unzlibSync(data, opts) {
  return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
function decompressSync(data, opts) {
  return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzipSync(data, opts) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflateSync(data, opts) : unzlibSync(data, opts);
}
var require2, Worker, u8, u16, i32, fleb, fdeb, clim, freb, _a, fl, revfl, _b, fd, revfd, rev, x, i, hMap, flt, i, i, i, i, fdt, i, flrm, fdrm, max, bits, bits16, shft, slc, ec, err, inflt, et, gzs, gzl, zls, td, tds;
var init_esm = __esm({
  "node_modules/fflate/esm/index.mjs"() {
    init_define_import_meta_env();
    init_worker_shims();
    require2 = createRequire("/");
    try {
      Worker = require2("worker_threads").Worker;
    } catch (e) {
    }
    u8 = Uint8Array;
    u16 = Uint16Array;
    i32 = Int32Array;
    fleb = new u8([
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      2,
      2,
      2,
      2,
      3,
      3,
      3,
      3,
      4,
      4,
      4,
      4,
      5,
      5,
      5,
      5,
      0,
      /* unused */
      0,
      0,
      /* impossible */
      0
    ]);
    fdeb = new u8([
      0,
      0,
      0,
      0,
      1,
      1,
      2,
      2,
      3,
      3,
      4,
      4,
      5,
      5,
      6,
      6,
      7,
      7,
      8,
      8,
      9,
      9,
      10,
      10,
      11,
      11,
      12,
      12,
      13,
      13,
      /* unused */
      0,
      0
    ]);
    clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    freb = function(eb, start) {
      var b2 = new u16(31);
      for (var i2 = 0; i2 < 31; ++i2) {
        b2[i2] = start += 1 << eb[i2 - 1];
      }
      var r = new i32(b2[30]);
      for (var i2 = 1; i2 < 30; ++i2) {
        for (var j2 = b2[i2]; j2 < b2[i2 + 1]; ++j2) {
          r[j2] = j2 - b2[i2] << 5 | i2;
        }
      }
      return { b: b2, r };
    };
    _a = freb(fleb, 2);
    fl = _a.b;
    revfl = _a.r;
    fl[28] = 258, revfl[258] = 28;
    _b = freb(fdeb, 0);
    fd = _b.b;
    revfd = _b.r;
    rev = new u16(32768);
    for (i = 0; i < 32768; ++i) {
      x = (i & 43690) >> 1 | (i & 21845) << 1;
      x = (x & 52428) >> 2 | (x & 13107) << 2;
      x = (x & 61680) >> 4 | (x & 3855) << 4;
      rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
    }
    hMap = (function(cd, mb, r) {
      var s = cd.length;
      var i2 = 0;
      var l2 = new u16(mb);
      for (; i2 < s; ++i2) {
        if (cd[i2])
          ++l2[cd[i2] - 1];
      }
      var le = new u16(mb);
      for (i2 = 1; i2 < mb; ++i2) {
        le[i2] = le[i2 - 1] + l2[i2 - 1] << 1;
      }
      var co;
      if (r) {
        co = new u16(1 << mb);
        var rvb = 15 - mb;
        for (i2 = 0; i2 < s; ++i2) {
          if (cd[i2]) {
            var sv = i2 << 4 | cd[i2];
            var r_1 = mb - cd[i2];
            var v2 = le[cd[i2] - 1]++ << r_1;
            for (var m2 = v2 | (1 << r_1) - 1; v2 <= m2; ++v2) {
              co[rev[v2] >> rvb] = sv;
            }
          }
        }
      } else {
        co = new u16(s);
        for (i2 = 0; i2 < s; ++i2) {
          if (cd[i2]) {
            co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
          }
        }
      }
      return co;
    });
    flt = new u8(288);
    for (i = 0; i < 144; ++i)
      flt[i] = 8;
    for (i = 144; i < 256; ++i)
      flt[i] = 9;
    for (i = 256; i < 280; ++i)
      flt[i] = 7;
    for (i = 280; i < 288; ++i)
      flt[i] = 8;
    fdt = new u8(32);
    for (i = 0; i < 32; ++i)
      fdt[i] = 5;
    flrm = /* @__PURE__ */ hMap(flt, 9, 1);
    fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
    max = function(a) {
      var m2 = a[0];
      for (var i2 = 1; i2 < a.length; ++i2) {
        if (a[i2] > m2)
          m2 = a[i2];
      }
      return m2;
    };
    bits = function(d, p, m2) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8) >> (p & 7) & m2;
    };
    bits16 = function(d, p) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
    };
    shft = function(p) {
      return (p + 7) / 8 | 0;
    };
    slc = function(v2, s, e) {
      if (s == null || s < 0)
        s = 0;
      if (e == null || e > v2.length)
        e = v2.length;
      return new u8(v2.subarray(s, e));
    };
    ec = [
      "unexpected EOF",
      "invalid block type",
      "invalid length/literal",
      "invalid distance",
      "stream finished",
      "no stream handler",
      ,
      "no callback",
      "invalid UTF-8 data",
      "extra field too long",
      "date not in range 1980-2099",
      "filename too long",
      "stream finishing",
      "invalid zip data"
      // determined by unknown compression method
    ];
    err = function(ind, msg, nt) {
      var e = new Error(msg || ec[ind]);
      e.code = ind;
      if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
      if (!nt)
        throw e;
      return e;
    };
    inflt = function(dat, st, buf, dict) {
      var sl = dat.length, dl = dict ? dict.length : 0;
      if (!sl || st.f && !st.l)
        return buf || new u8(0);
      var noBuf = !buf;
      var resize = noBuf || st.i != 2;
      var noSt = st.i;
      if (noBuf)
        buf = new u8(sl * 3);
      var cbuf = function(l3) {
        var bl = buf.length;
        if (l3 > bl) {
          var nbuf = new u8(Math.max(bl * 2, l3));
          nbuf.set(buf);
          buf = nbuf;
        }
      };
      var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
      var tbts = sl * 8;
      do {
        if (!lm) {
          final = bits(dat, pos, 1);
          var type = bits(dat, pos + 1, 3);
          pos += 3;
          if (!type) {
            var s = shft(pos) + 4, l2 = dat[s - 4] | dat[s - 3] << 8, t = s + l2;
            if (t > sl) {
              if (noSt)
                err(0);
              break;
            }
            if (resize)
              cbuf(bt + l2);
            buf.set(dat.subarray(s, t), bt);
            st.b = bt += l2, st.p = pos = t * 8, st.f = final;
            continue;
          } else if (type == 1)
            lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
          else if (type == 2) {
            var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
            var tl = hLit + bits(dat, pos + 5, 31) + 1;
            pos += 14;
            var ldt = new u8(tl);
            var clt = new u8(19);
            for (var i2 = 0; i2 < hcLen; ++i2) {
              clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
            }
            pos += hcLen * 3;
            var clb = max(clt), clbmsk = (1 << clb) - 1;
            var clm = hMap(clt, clb, 1);
            for (var i2 = 0; i2 < tl; ) {
              var r = clm[bits(dat, pos, clbmsk)];
              pos += r & 15;
              var s = r >> 4;
              if (s < 16) {
                ldt[i2++] = s;
              } else {
                var c = 0, n = 0;
                if (s == 16)
                  n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i2 - 1];
                else if (s == 17)
                  n = 3 + bits(dat, pos, 7), pos += 3;
                else if (s == 18)
                  n = 11 + bits(dat, pos, 127), pos += 7;
                while (n--)
                  ldt[i2++] = c;
              }
            }
            var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
            lbt = max(lt);
            dbt = max(dt);
            lm = hMap(lt, lbt, 1);
            dm = hMap(dt, dbt, 1);
          } else
            err(1);
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
        }
        if (resize)
          cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (; ; lpos = pos) {
          var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
          pos += c & 15;
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (!c)
            err(2);
          if (sym < 256)
            buf[bt++] = sym;
          else if (sym == 256) {
            lpos = pos, lm = null;
            break;
          } else {
            var add = sym - 254;
            if (sym > 264) {
              var i2 = sym - 257, b2 = fleb[i2];
              add = bits(dat, pos, (1 << b2) - 1) + fl[i2];
              pos += b2;
            }
            var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
            if (!d)
              err(3);
            pos += d & 15;
            var dt = fd[dsym];
            if (dsym > 3) {
              var b2 = fdeb[dsym];
              dt += bits16(dat, pos) & (1 << b2) - 1, pos += b2;
            }
            if (pos > tbts) {
              if (noSt)
                err(0);
              break;
            }
            if (resize)
              cbuf(bt + 131072);
            var end = bt + add;
            if (bt < dt) {
              var shift = dl - dt, dend = Math.min(dt, end);
              if (shift + bt < 0)
                err(3);
              for (; bt < dend; ++bt)
                buf[bt] = dict[shift + bt];
            }
            for (; bt < end; ++bt)
              buf[bt] = buf[bt - dt];
          }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
          final = 1, st.m = lbt, st.d = dm, st.n = dbt;
      } while (!final);
      return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
    };
    et = /* @__PURE__ */ new u8(0);
    gzs = function(d) {
      if (d[0] != 31 || d[1] != 139 || d[2] != 8)
        err(6, "invalid gzip data");
      var flg = d[3];
      var st = 10;
      if (flg & 4)
        st += (d[10] | d[11] << 8) + 2;
      for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
        ;
      return st + (flg & 2);
    };
    gzl = function(d) {
      var l2 = d.length;
      return (d[l2 - 4] | d[l2 - 3] << 8 | d[l2 - 2] << 16 | d[l2 - 1] << 24) >>> 0;
    };
    zls = function(d, dict) {
      if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31)
        err(6, "invalid zlib data");
      if ((d[1] >> 5 & 1) == +!dict)
        err(6, "invalid zlib data: " + (d[1] & 32 ? "need" : "unexpected") + " dictionary");
      return (d[1] >> 3 & 4) + 2;
    };
    td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
    tds = 0;
    try {
      td.decode(et, { stream: true });
      tds = 1;
    } catch (e) {
    }
  }
});

// node_modules/pmtiles/dist/esm/index.js
function b(o, t) {
  return (t >>> 0) * 4294967296 + (o >>> 0);
}
function N(o, t) {
  let e = t.buf, r = e[t.pos++], n = (r & 112) >> 4;
  if (r < 128 || (r = e[t.pos++], n |= (r & 127) << 3, r < 128) || (r = e[t.pos++], n |= (r & 127) << 10, r < 128) || (r = e[t.pos++], n |= (r & 127) << 17, r < 128) || (r = e[t.pos++], n |= (r & 127) << 24, r < 128) || (r = e[t.pos++], n |= (r & 1) << 31, r < 128)) return b(o, n);
  throw new Error("Expected varint not more than 10 bytes");
}
function x2(o) {
  let t = o.buf, e = t[o.pos++], r = e & 127;
  return e < 128 || (e = t[o.pos++], r |= (e & 127) << 7, e < 128) || (e = t[o.pos++], r |= (e & 127) << 14, e < 128) || (e = t[o.pos++], r |= (e & 127) << 21, e < 128) ? r : (e = t[o.pos], r |= (e & 15) << 28, N(r, o));
}
function k(o, t, e, r, n) {
  return n === 0 ? r !== 0 ? [o - 1 - e, o - 1 - t] : [e, t] : [t, e];
}
function q(o, t, e) {
  if (o > 26) throw new Error("Tile zoom level exceeds max safe number limit (26)");
  if (t >= 1 << o || e >= 1 << o) throw new Error("tile x/y outside zoom level bounds");
  let r = ((1 << o) * (1 << o) - 1) / 3, n = o - 1, [s, i2] = [t, e];
  for (let a = 1 << n; a > 0; a >>= 1) {
    let c = s & a, u = i2 & a;
    r += (3 * c ^ u) * (1 << n), [s, i2] = k(a, s, i2, c, u), n--;
  }
  return r;
}
function G(o) {
  let t = 3 * o + 1;
  return t < 4294967296 ? 31 - Math.clz32(t) : 63 - Math.clz32(t / 4294967296);
}
function ie(o) {
  let t = G(o) >> 1;
  if (t > 26) throw new Error("Tile zoom level exceeds max safe number limit (26)");
  let e = ((1 << t) * (1 << t) - 1) / 3, r = o - e, n = 0, s = 0, i2 = 1 << t;
  for (let a = 1; a < i2; a <<= 1) {
    let c = a & r / 2, u = a & (r ^ c);
    [n, s] = k(a, n, s, c, u), r = r / 2, n += c, s += u;
  }
  return [t, n, s];
}
function D(o, t) {
  return m(this, null, function* () {
    if (t === 1 || t === 0) return o;
    if (t === 2) {
      if (typeof globalThis.DecompressionStream == "undefined") return decompressSync(new Uint8Array(o));
      let e = new Response(o).body;
      if (!e) throw new Error("Failed to read response stream");
      let r = e.pipeThrough(new globalThis.DecompressionStream("gzip"));
      return new Response(r).arrayBuffer();
    }
    throw new Error("Compression method not supported");
  });
}
function _(o) {
  return o === 1 ? ".mvt" : o === 2 ? ".png" : o === 3 ? ".jpg" : o === 4 ? ".webp" : o === 5 ? ".avif" : o === 6 ? ".mlt" : "";
}
function Q(o, t) {
  let e = 0, r = o.length - 1;
  for (; e <= r; ) {
    let n = r + e >> 1, s = t - o[n].tileId;
    if (s > 0) e = n + 1;
    else if (s < 0) r = n - 1;
    else return o[n];
  }
  return r >= 0 && (o[r].runLength === 0 || t - o[r].tileId < o[r].runLength) ? o[r] : null;
}
function g(o, t) {
  let e = o.getUint32(t + 4, true), r = o.getUint32(t + 0, true);
  return e * B(2, 32) + r;
}
function X(o, t) {
  let e = new DataView(o), r = e.getUint8(7);
  if (r > 3) throw new Error(`Archive is spec version ${r} but this library supports up to spec version 3`);
  return { specVersion: r, rootDirectoryOffset: g(e, 8), rootDirectoryLength: g(e, 16), jsonMetadataOffset: g(e, 24), jsonMetadataLength: g(e, 32), leafDirectoryOffset: g(e, 40), leafDirectoryLength: g(e, 48), tileDataOffset: g(e, 56), tileDataLength: g(e, 64), numAddressedTiles: g(e, 72), numTileEntries: g(e, 80), numTileContents: g(e, 88), clustered: e.getUint8(96) === 1, internalCompression: e.getUint8(97), tileCompression: e.getUint8(98), tileType: e.getUint8(99), minZoom: e.getUint8(100), maxZoom: e.getUint8(101), minLon: e.getInt32(102, true) / 1e7, minLat: e.getInt32(106, true) / 1e7, maxLon: e.getInt32(110, true) / 1e7, maxLat: e.getInt32(114, true) / 1e7, centerZoom: e.getUint8(118), centerLon: e.getInt32(119, true) / 1e7, centerLat: e.getInt32(123, true) / 1e7, etag: t };
}
function Z(o) {
  let t = { buf: new Uint8Array(o), pos: 0 }, e = x2(t), r = [], n = 0;
  for (let s = 0; s < e; s++) {
    let i2 = x2(t);
    r.push({ tileId: n + i2, offset: 0, length: 0, runLength: 1 }), n += i2;
  }
  for (let s = 0; s < e; s++) r[s].runLength = x2(t);
  for (let s = 0; s < e; s++) r[s].length = x2(t);
  for (let s = 0; s < e; s++) {
    let i2 = x2(t);
    i2 === 0 && s > 0 ? r[s].offset = r[s - 1].offset + r[s - 1].length : r[s].offset = i2 - 1;
  }
  return r;
}
function I(o, t) {
  return m(this, null, function* () {
    let e = yield o.getBytes(0, 16384);
    if (new DataView(e.data).getUint16(0, true) !== 19792) throw new Error("Wrong magic number for PMTiles archive");
    let n = e.data.slice(0, Y), s = X(n, e.etag), i2 = e.data.slice(s.rootDirectoryOffset, s.rootDirectoryOffset + s.rootDirectoryLength), a = `${o.getKey()}|${s.etag || ""}|${s.rootDirectoryOffset}|${s.rootDirectoryLength}`, c = Z(yield t(i2, s.internalCompression));
    return [s, [a, c.length, c]];
  });
}
function K(o, t, e, r, n) {
  return m(this, null, function* () {
    let s = yield o.getBytes(e, r, void 0, n.etag), i2 = yield t(s.data, n.internalCompression), a = Z(i2);
    if (a.length === 0) throw new Error("Empty directory is invalid");
    return a;
  });
}
var j, B, l, m, re, W, E, S, J, O, Y, A, C, T, U, v, R, M, P, H, w;
var init_esm2 = __esm({
  "node_modules/pmtiles/dist/esm/index.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_esm();
    j = Object.defineProperty;
    B = Math.pow;
    l = (o, t) => j(o, "name", { value: t, configurable: true });
    m = (o, t, e) => new Promise((r, n) => {
      var s = (c) => {
        try {
          a(e.next(c));
        } catch (u) {
          n(u);
        }
      }, i2 = (c) => {
        try {
          a(e.throw(c));
        } catch (u) {
          n(u);
        }
      }, a = (c) => c.done ? r(c.value) : Promise.resolve(c.value).then(s, i2);
      a((e = e.apply(o, t)).next());
    });
    re = l((o, t) => {
      let e = false, r = "", n = L.GridLayer.extend({ createTile: l((s, i2) => {
        let a = document.createElement("img"), c = new AbortController(), u = c.signal;
        return a.cancel = () => {
          c.abort();
        }, e || (o.getHeader().then((d) => {
          d.tileType === 1 ? console.error("Error: archive contains MVT vector tiles, but leafletRasterLayer is for displaying raster tiles. See https://github.com/protomaps/PMTiles/tree/main/js for details.") : d.tileType === 2 ? r = "image/png" : d.tileType === 3 ? r = "image/jpeg" : d.tileType === 4 ? r = "image/webp" : d.tileType === 5 && (r = "image/avif");
        }), e = true), o.getZxy(s.z, s.x, s.y, u).then((d) => {
          if (d) {
            let h = new Blob([d.data], { type: r }), p = window.URL.createObjectURL(h);
            a.src = p;
          } else a.style.display = "none";
          a.cancel = void 0, i2(void 0, a);
        }).catch((d) => {
          if (d.name !== "AbortError") throw d;
        }), a;
      }, "createTile"), _removeTile: l(function(s) {
        let i2 = this._tiles[s];
        i2 && (i2.el.cancel && i2.el.cancel(), i2.el.width = 0, i2.el.height = 0, i2.el.deleted = true, L.DomUtil.remove(i2.el), delete this._tiles[s], this.fire("tileunload", { tile: i2.el, coords: this._keyToTileCoords(s) }));
      }, "_removeTile") });
      return new n(t);
    }, "leafletRasterLayer");
    W = l((o) => (t, e) => {
      if (e instanceof AbortController) return o(t, e);
      let r = new AbortController();
      return o(t, r).then((n) => e(void 0, n.data, n.cacheControl || "", n.expires || ""), (n) => e(n)).catch((n) => e(n)), { cancel: l(() => r.abort(), "cancel") };
    }, "v3compat");
    E = class E2 {
      constructor(t) {
        this.tilev4 = l((t2, e) => m(this, null, function* () {
          if (t2.type === "json") {
            let p = t2.url.substr(10), y = this.tiles.get(p);
            if (y || (y = new w(p), this.tiles.set(p, y)), this.metadata) {
              let z = yield y.getTileJson(t2.url);
              return e.signal.throwIfAborted(), { data: z };
            }
            let f = yield y.getHeader();
            return e.signal.throwIfAborted(), (f.minLon >= f.maxLon || f.minLat >= f.maxLat) && console.error(`Bounds of PMTiles archive ${f.minLon},${f.minLat},${f.maxLon},${f.maxLat} are not valid.`), { data: { tiles: [`${t2.url}/{z}/{x}/{y}`], minzoom: f.minZoom, maxzoom: f.maxZoom, bounds: [f.minLon, f.minLat, f.maxLon, f.maxLat] } };
          }
          let r = new RegExp(/pmtiles:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/), n = t2.url.match(r);
          if (!n) throw new Error("Invalid PMTiles protocol URL");
          let s = n[1], i2 = this.tiles.get(s);
          i2 || (i2 = new w(s), this.tiles.set(s, i2));
          let a = n[2], c = n[3], u = n[4], d = yield i2.getHeader(), h = yield i2 == null ? void 0 : i2.getZxy(+a, +c, +u, e.signal);
          if (e.signal.throwIfAborted(), h) return { data: new Uint8Array(h.data), cacheControl: h.cacheControl, expires: h.expires };
          if (d.tileType === 1) {
            if (this.errorOnMissingTile) throw new Error("Tile not found.");
            return { data: new Uint8Array() };
          }
          return { data: null };
        }), "tilev4");
        this.tile = W(this.tilev4);
        this.tiles = /* @__PURE__ */ new Map(), this.metadata = (t == null ? void 0 : t.metadata) || false, this.errorOnMissingTile = (t == null ? void 0 : t.errorOnMissingTile) || false;
      }
      add(t) {
        this.tiles.set(t.source.getKey(), t);
      }
      get(t) {
        return this.tiles.get(t);
      }
    };
    l(E, "Protocol");
    S = E;
    l(b, "toNum");
    l(N, "readVarintRemainder");
    l(x2, "readVarint");
    l(k, "rotate");
    l(q, "zxyToTileId");
    l(G, "tileIdToZ");
    l(ie, "tileIdToZxy");
    J = ((s) => (s[s.Unknown = 0] = "Unknown", s[s.None = 1] = "None", s[s.Gzip = 2] = "Gzip", s[s.Brotli = 3] = "Brotli", s[s.Zstd = 4] = "Zstd", s))(J || {});
    l(D, "defaultDecompress");
    O = ((a) => (a[a.Unknown = 0] = "Unknown", a[a.Mvt = 1] = "Mvt", a[a.Png = 2] = "Png", a[a.Jpeg = 3] = "Jpeg", a[a.Webp = 4] = "Webp", a[a.Avif = 5] = "Avif", a[a.Mlt = 6] = "Mlt", a))(O || {});
    l(_, "tileTypeExt");
    Y = 127;
    l(Q, "findTile");
    A = class A2 {
      constructor(t) {
        this.file = t;
      }
      getKey() {
        return this.file.name;
      }
      getBytes(t, e) {
        return m(this, null, function* () {
          return { data: yield this.file.slice(t, t + e).arrayBuffer() };
        });
      }
    };
    l(A, "FileSource");
    C = class C2 {
      constructor(t, e = new Headers()) {
        var i2, a;
        this.url = t, this.customHeaders = e, this.mustReload = false;
        let r = "";
        "navigator" in globalThis && (r = (a = (i2 = globalThis.navigator) == null ? void 0 : i2.userAgent) != null ? a : "");
        let n = r.indexOf("Windows") > -1, s = /Chrome|Chromium|Edg|OPR|Brave/.test(r);
        this.chromeWindowsNoCache = false, n && s && (this.chromeWindowsNoCache = true);
      }
      getKey() {
        return this.url;
      }
      setHeaders(t) {
        this.customHeaders = t;
      }
      getBytes(t, e, r, n) {
        return m(this, null, function* () {
          let s, i2;
          r ? i2 = r : (s = new AbortController(), i2 = s.signal);
          let a = new Headers(this.customHeaders);
          a.set("range", `bytes=${t}-${t + e - 1}`);
          let c;
          this.mustReload ? c = "reload" : this.chromeWindowsNoCache && (c = "no-store");
          let u = yield fetch(this.url, { signal: i2, cache: c, headers: a });
          if (t === 0 && u.status === 416) {
            let y = u.headers.get("Content-Range");
            if (!y || !y.startsWith("bytes */")) throw new Error("Missing content-length on 416 response");
            let f = +y.substr(8);
            u = yield fetch(this.url, { signal: i2, cache: "reload", headers: { range: `bytes=0-${f - 1}` } });
          }
          let d = u.headers.get("Etag");
          if (d != null && d.startsWith("W/") && (d = null), u.status === 416 || n && d && d !== n) throw this.mustReload = true, new v(`Server returned non-matching ETag ${n} after one retry. Check browser extensions and servers for issues that may affect correct ETag headers.`);
          if (u.status >= 300) throw new Error(`Bad response code: ${u.status}`);
          let h = u.headers.get("Content-Length");
          if (u.status === 200 && (!h || +h > e)) throw s && s.abort(), new Error("Server returned no content-length header or content-length exceeding request. Check that your storage backend supports HTTP Byte Serving.");
          return { data: yield u.arrayBuffer(), etag: d || void 0, cacheControl: u.headers.get("Cache-Control") || void 0, expires: u.headers.get("Expires") || void 0 };
        });
      }
    };
    l(C, "FetchSource");
    T = C;
    l(g, "getUint64");
    l(X, "bytesToHeader");
    l(Z, "deserializeIndex");
    U = class U2 extends Error {
    };
    l(U, "EtagMismatch");
    v = U;
    l(I, "getHeaderAndRoot");
    l(K, "getDirectory");
    R = class R2 {
      constructor(t = 100, e = true, r = D) {
        this.cache = /* @__PURE__ */ new Map(), this.maxCacheEntries = t, this.counter = 1, this.decompress = r;
      }
      getHeader(t) {
        return m(this, null, function* () {
          let e = t.getKey(), r = this.cache.get(e);
          if (r) return r.lastUsed = this.counter++, r.data;
          let n = yield I(t, this.decompress);
          return n[1] && this.cache.set(n[1][0], { lastUsed: this.counter++, data: n[1][2] }), this.cache.set(e, { lastUsed: this.counter++, data: n[0] }), this.prune(), n[0];
        });
      }
      getDirectory(t, e, r, n) {
        return m(this, null, function* () {
          let s = `${t.getKey()}|${n.etag || ""}|${e}|${r}`, i2 = this.cache.get(s);
          if (i2) return i2.lastUsed = this.counter++, i2.data;
          let a = yield K(t, this.decompress, e, r, n);
          return this.cache.set(s, { lastUsed: this.counter++, data: a }), this.prune(), a;
        });
      }
      prune() {
        if (this.cache.size > this.maxCacheEntries) {
          let t = 1 / 0, e;
          this.cache.forEach((r, n) => {
            r.lastUsed < t && (t = r.lastUsed, e = n);
          }), e && this.cache.delete(e);
        }
      }
      invalidate(t) {
        return m(this, null, function* () {
          this.cache.delete(t.getKey());
        });
      }
    };
    l(R, "ResolvedValueCache");
    M = class M2 {
      constructor(t = 100, e = true, r = D) {
        this.cache = /* @__PURE__ */ new Map(), this.invalidations = /* @__PURE__ */ new Map(), this.maxCacheEntries = t, this.counter = 1, this.decompress = r;
      }
      getHeader(t) {
        return m(this, null, function* () {
          let e = t.getKey(), r = this.cache.get(e);
          if (r) return r.lastUsed = this.counter++, yield r.data;
          let n = new Promise((s, i2) => {
            I(t, this.decompress).then((a) => {
              a[1] && this.cache.set(a[1][0], { lastUsed: this.counter++, data: Promise.resolve(a[1][2]) }), s(a[0]), this.prune();
            }).catch((a) => {
              i2(a);
            });
          });
          return this.cache.set(e, { lastUsed: this.counter++, data: n }), n;
        });
      }
      getDirectory(t, e, r, n) {
        return m(this, null, function* () {
          let s = `${t.getKey()}|${n.etag || ""}|${e}|${r}`, i2 = this.cache.get(s);
          if (i2) return i2.lastUsed = this.counter++, yield i2.data;
          let a = new Promise((c, u) => {
            K(t, this.decompress, e, r, n).then((d) => {
              c(d), this.prune();
            }).catch((d) => {
              u(d);
            });
          });
          return this.cache.set(s, { lastUsed: this.counter++, data: a }), a;
        });
      }
      prune() {
        if (this.cache.size >= this.maxCacheEntries) {
          let t = 1 / 0, e;
          this.cache.forEach((r, n) => {
            r.lastUsed < t && (t = r.lastUsed, e = n);
          }), e && this.cache.delete(e);
        }
      }
      invalidate(t) {
        return m(this, null, function* () {
          let e = t.getKey();
          if (this.invalidations.get(e)) return yield this.invalidations.get(e);
          this.cache.delete(t.getKey());
          let r = new Promise((n, s) => {
            this.getHeader(t).then((i2) => {
              n(), this.invalidations.delete(e);
            }).catch((i2) => {
              s(i2);
            });
          });
          this.invalidations.set(e, r);
        });
      }
    };
    l(M, "SharedPromiseCache");
    P = M;
    H = class H2 {
      constructor(t, e, r) {
        typeof t == "string" ? this.source = new T(t) : this.source = t, r ? this.decompress = r : this.decompress = D, e ? this.cache = e : this.cache = new P();
      }
      getHeader() {
        return m(this, null, function* () {
          return yield this.cache.getHeader(this.source);
        });
      }
      getZxyAttempt(t, e, r, n) {
        return m(this, null, function* () {
          let s = q(t, e, r), i2 = yield this.cache.getHeader(this.source);
          if (t < i2.minZoom || t > i2.maxZoom) return;
          let a = i2.rootDirectoryOffset, c = i2.rootDirectoryLength;
          for (let u = 0; u <= 3; u++) {
            let d = yield this.cache.getDirectory(this.source, a, c, i2), h = Q(d, s);
            if (h) {
              if (h.runLength > 0) {
                let p = yield this.source.getBytes(i2.tileDataOffset + h.offset, h.length, n, i2.etag);
                return { data: yield this.decompress(p.data, i2.tileCompression), cacheControl: p.cacheControl, expires: p.expires };
              }
              a = i2.leafDirectoryOffset + h.offset, c = h.length;
            } else return;
          }
          throw new Error("Maximum directory depth exceeded");
        });
      }
      getZxy(t, e, r, n) {
        return m(this, null, function* () {
          try {
            return yield this.getZxyAttempt(t, e, r, n);
          } catch (s) {
            if (s instanceof v) return this.cache.invalidate(this.source), yield this.getZxyAttempt(t, e, r, n);
            throw s;
          }
        });
      }
      getMetadataAttempt() {
        return m(this, null, function* () {
          let t = yield this.cache.getHeader(this.source), e = yield this.source.getBytes(t.jsonMetadataOffset, t.jsonMetadataLength, void 0, t.etag), r = yield this.decompress(e.data, t.internalCompression), n = new TextDecoder("utf-8");
          return JSON.parse(n.decode(r));
        });
      }
      getMetadata() {
        return m(this, null, function* () {
          try {
            return yield this.getMetadataAttempt();
          } catch (t) {
            if (t instanceof v) return this.cache.invalidate(this.source), yield this.getMetadataAttempt();
            throw t;
          }
        });
      }
      getTileJson(t) {
        return m(this, null, function* () {
          let e = yield this.getHeader(), r = yield this.getMetadata(), n = _(e.tileType);
          return { tilejson: "3.0.0", scheme: "xyz", tiles: [`${t}/{z}/{x}/{y}${n}`], vector_layers: r.vector_layers, attribution: r.attribution, description: r.description, name: r.name, version: r.version, bounds: [e.minLon, e.minLat, e.maxLon, e.maxLat], center: [e.centerLon, e.centerLat, e.centerZoom], minzoom: e.minZoom, maxzoom: e.maxZoom };
        });
      }
    };
    l(H, "PMTiles");
    w = H;
  }
});

// src/runtime/regionNameFixes.js
var init_regionNameFixes = __esm({
  "src/runtime/regionNameFixes.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// server/logRedaction.js
var init_logRedaction = __esm({
  "server/logRedaction.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/debugLog.js
var MAX_LOG_CHARS, MAX_STORED_CHARS, ENABLED_STORAGE_KEY, VERBOSE_STORAGE_KEY, loggingEnabled, verboseLogging, readStoredFlag, PAGE_STARTED_AT, LOG_SECTION_MAX_CHARS, LOGGING_FILE_MAX_CHARS;
var init_debugLog = __esm({
  "src/runtime/debugLog.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_logRedaction();
    MAX_LOG_CHARS = 1024 * 1024;
    MAX_STORED_CHARS = 1200 * 1024;
    ENABLED_STORAGE_KEY = "oh_debug_log_enabled";
    VERBOSE_STORAGE_KEY = "oh_debug_log_verbose";
    loggingEnabled = true;
    verboseLogging = false;
    readStoredFlag = (key, fallback) => {
      if (typeof localStorage === "undefined") return fallback;
      try {
        const stored = localStorage.getItem(key);
        return stored === null ? fallback : stored === "1";
      } catch {
        return fallback;
      }
    };
    loggingEnabled = readStoredFlag(ENABLED_STORAGE_KEY, true);
    verboseLogging = readStoredFlag(VERBOSE_STORAGE_KEY, false);
    PAGE_STARTED_AT = (/* @__PURE__ */ new Date()).toISOString();
    LOG_SECTION_MAX_CHARS = 1024 * 1024;
    LOGGING_FILE_MAX_CHARS = 2 * 1024 * 1024;
  }
});

// src/runtime/generated/countryNames.js
var countryNames_default;
var init_countryNames = __esm({
  "src/runtime/generated/countryNames.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    countryNames_default = {
      "CAN": "Canada",
      "USA": "United States",
      "MEX": "Mexico",
      "GTM": "Guatemala",
      "GRL": "Greenland",
      "SPM": "Saint Pierre and Miquelon",
      "BHS": "Bahamas",
      "BLZ": "Belize",
      "SLV": "El Salvador",
      "HND": "Honduras",
      "NIC": "Nicaragua",
      "CYM": "Cayman Islands",
      "CUB": "Cuba",
      "CRI": "Costa Rica",
      "PAN": "Panama",
      "JAM": "Jamaica",
      "TCA": "Turks and Caicos Islands",
      "HTI": "Haiti",
      "DOM": "Dominican Republic",
      "ABW": "Aruba",
      "CUW": "Curacao",
      "BES": "Bonaire, Sint Eustatius and Saba",
      "COL": "Colombia",
      "BMU": "Bermuda",
      "PRI": "Puerto Rico",
      "VIR": "Virgin Islands, U.S.",
      "VGB": "British Virgin Islands",
      "AIA": "Anguilla",
      "KNA": "Saint Kitts and Nevis",
      "ATG": "Antigua and Barbuda",
      "MSR": "Montserrat",
      "GLP": "Guadeloupe",
      "BLM": "Saint Barthelemy",
      "DMA": "Dominica",
      "MTQ": "Martinique",
      "VCT": "Saint Vincent and the Grenadines",
      "LCA": "Saint Lucia",
      "GRD": "Grenada",
      "BRB": "Barbados",
      "VEN": "Venezuela",
      "TTO": "Trinidad and Tobago",
      "GUY": "Guyana",
      "SUR": "Suriname",
      "GUF": "French Guiana",
      "ISL": "Iceland",
      "FRO": "Faroe Islands",
      "IRL": "Ireland",
      "IMN": "Isle of Man",
      "GBR": "United Kingdom",
      "GGY": "Guernsey",
      "JEY": "Jersey",
      "KIR": "Kiribati",
      "CPV": "Cabo Verde",
      "ESH": "Western Sahara",
      "PRT": "Portugal",
      "ESP": "Spain",
      "MAR": "Morocco",
      "SEN": "Senegal",
      "GMB": "Gambia",
      "GNB": "Guinea-Bissau",
      "SLE": "Sierra Leone",
      "MRT": "Mauritania",
      "MLI": "Mali",
      "BFA": "Burkina Faso",
      "GIN": "Guinea",
      "LBR": "Liberia",
      "CIV": "Cote d'Ivoire",
      "GHA": "Ghana",
      "TKL": "Tokelau",
      "TON": "Tonga",
      "WSM": "Samoa",
      "ASM": "American Samoa",
      "COK": "Cook Islands",
      "PYF": "French Polynesia",
      "ECU": "Ecuador",
      "PER": "Peru",
      "CHL": "Chile",
      "BOL": "Bolivia",
      "BRA": "Brazil",
      "PRY": "Paraguay",
      "ARG": "Argentina",
      "URY": "Uruguay",
      "FLK": "Falkland Islands",
      "SHN": "Saint Helena, Ascension and Tris",
      "SGS": "South Georgia and the South Sand",
      "SJM": "Svalbard and Jan Mayen",
      "ATA": "Antarctica",
      "DNK": "Denmark",
      "NOR": "Norway",
      "SWE": "Sweden",
      "ALA": "Aland Islands",
      "NLD": "Netherlands",
      "BEL": "Belgium",
      "LUX": "Luxembourg",
      "DEU": "Germany",
      "FRA": "France",
      "AND": "Andorra",
      "CHE": "Switzerland",
      "LIE": "Liechtenstein",
      "SMR": "San Marino",
      "CZE": "Czechia",
      "POL": "Poland",
      "AUT": "Austria",
      "SVN": "Slovenia",
      "ITA": "Italy",
      "HRV": "Croatia",
      "SVK": "Slovakia",
      "HUN": "Hungary",
      "BIH": "Bosnia and Herzegovina",
      "MNE": "Montenegro",
      "SRB": "Serbia",
      "XKO": "Kosovo",
      "ALB": "Albania",
      "MKD": "North Macedonia",
      "FIN": "Finland",
      "LVA": "Latvia",
      "EST": "Estonia",
      "LTU": "Lithuania",
      "BLR": "Belarus",
      "UKR": "Ukraine",
      "ROU": "Romania",
      "BGR": "Bulgaria",
      "MDA": "Moldova",
      "GEO": "Georgia",
      "TUN": "Tunisia",
      "DZA": "Algeria",
      "MLT": "Malta",
      "LBY": "Libya",
      "NER": "Niger",
      "TGO": "Togo",
      "BEN": "Benin",
      "NGA": "Nigeria",
      "STP": "Sao Tome and Principe",
      "GNQ": "Equatorial Guinea",
      "TCD": "Chad",
      "CMR": "Cameroon",
      "CAF": "Central African Republic",
      "GRC": "Greece",
      "CYP": "Cyprus",
      "ZNC": "Northern Cyprus",
      "XAD": "Akrotiri and Dhekelia",
      "EGY": "Egypt",
      "TUR": "Turkey",
      "LBN": "Lebanon",
      "SYR": "Syria",
      "ARM": "Armenia",
      "IRQ": "Iraq",
      "ISR": "Israel",
      "PSE": "Palestine",
      "JOR": "Jordan",
      "SAU": "Saudi Arabia",
      "SDN": "Sudan",
      "SSD": "South Sudan",
      "UGA": "Uganda",
      "ERI": "Eritrea",
      "DJI": "Djibouti",
      "KEN": "Kenya",
      "ETH": "Ethiopia",
      "XCA": "Caspian Sea",
      "KAZ": "Kazakhstan",
      "UZB": "Uzbekistan",
      "KGZ": "Kyrgyzstan",
      "AZE": "Azerbaijan",
      "IRN": "Iran",
      "KWT": "Kuwait",
      "BHR": "Bahrain",
      "QAT": "Qatar",
      "ARE": "United Arab Emirates",
      "TKM": "Turkmenistan",
      "AFG": "Afghanistan",
      "YEM": "Yemen",
      "OMN": "Oman",
      "SOM": "Somalia",
      "TJK": "Tajikistan",
      "Z06": "Pakistan",
      "Z02": "China",
      "Z01": "India",
      "Z04": "India",
      "PAK": "Pakistan",
      "Z03": "China",
      "Z08": "China",
      "Z09": "India",
      "Z05": "India",
      "NPL": "Nepal",
      "IND": "India",
      "MDV": "Maldives",
      "LKA": "Sri Lanka",
      "RUS": "Russia",
      "MNG": "Mongolia",
      "BTN": "Bhutan",
      "Z07": "India",
      "BGD": "Bangladesh",
      "CHN": "China",
      "MMR": "Myanmar",
      "THA": "Thailand",
      "LAO": "Laos",
      "VNM": "Vietnam",
      "KHM": "Cambodia",
      "MYS": "Malaysia",
      "TWN": "Taiwan",
      "PRK": "North Korea",
      "KOR": "South Korea",
      "PHL": "Philippines",
      "BRN": "Brunei",
      "SGP": "Singapore",
      "PLW": "Palau",
      "JPN": "Japan",
      "MNP": "Northern Mariana Islands",
      "GUM": "Guam",
      "FSM": "Micronesia",
      "MHL": "Marshall Islands",
      "NRU": "Nauru",
      "GAB": "Gabon",
      "COG": "Republic of the Congo",
      "AGO": "Angola",
      "NAM": "Namibia",
      "COD": "Democratic Republic of the Congo",
      "RWA": "Rwanda",
      "BDI": "Burundi",
      "ZMB": "Zambia",
      "ZWE": "Zimbabwe",
      "TZA": "Tanzania",
      "MWI": "Malawi",
      "MOZ": "Mozambique",
      "COM": "Comoros",
      "BWA": "Botswana",
      "ZAF": "South Africa",
      "SWZ": "Swaziland",
      "LSO": "Lesotho",
      "BVT": "Bouvet Island",
      "SYC": "Seychelles",
      "MYT": "Mayotte",
      "MDG": "Madagascar",
      "REU": "Reunion",
      "MUS": "Mauritius",
      "ATF": "French Southern Territories",
      "HMD": "Heard Island and McDonald Island",
      "IDN": "Indonesia",
      "TLS": "Timor-Leste",
      "AUS": "Australia",
      "PNG": "Papua New Guinea",
      "SLB": "Solomon Islands",
      "FJI": "Fiji",
      "VUT": "Vanuatu",
      "TUV": "Tuvalu",
      "UMI": "United States Minor Outlying Islands",
      "WLF": "Wallis and Futuna",
      "NCL": "New Caledonia",
      "NZL": "New Zealand"
    };
  }
});

// src/runtime/generated/officialCountryAliases.js
var officialCountryAliases_default;
var init_officialCountryAliases = __esm({
  "src/runtime/generated/officialCountryAliases.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    officialCountryAliases_default = {
      "afghanistan": "AFG",
      "aland islands": "ALA",
      "albania": "ALB",
      "algeria": "DZA",
      "american samoa": "ASM",
      "andorra": "AND",
      "angola": "AGO",
      "anguilla": "AIA",
      "antarctica": "ATA",
      "antigua and barbuda": "ATG",
      "arab republic of egypt": "EGY",
      "argentina": "ARG",
      "argentine republic": "ARG",
      "armenia": "ARM",
      "aruba": "ABW",
      "ascension and tristan da cunha saint helena": "SHN",
      "australia": "AUS",
      "austria": "AUT",
      "azerbaijan": "AZE",
      "bahamas": "BHS",
      "bahrain": "BHR",
      "bangladesh": "BGD",
      "barbados": "BRB",
      "belarus": "BLR",
      "belgium": "BEL",
      "belize": "BLZ",
      "benin": "BEN",
      "bermuda": "BMU",
      "bhutan": "BTN",
      "bolivarian republic of venezuela": "VEN",
      "bolivia": "BOL",
      "bolivia plurinational state of": "BOL",
      "bonaire sint eustatius and saba": "BES",
      "bosnia and herzegovina": "BIH",
      "botswana": "BWA",
      "bouvet island": "BVT",
      "brazil": "BRA",
      "british indian ocean territory": "IOT",
      "british virgin islands": "VGB",
      "brunei darussalam": "BRN",
      "bulgaria": "BGR",
      "burkina faso": "BFA",
      "burundi": "BDI",
      "cabo verde": "CPV",
      "cambodia": "KHM",
      "cameroon": "CMR",
      "canada": "CAN",
      "cayman islands": "CYM",
      "central african republic": "CAF",
      "chad": "TCD",
      "chile": "CHL",
      "china": "CHN",
      "christmas island": "CXR",
      "cocos keeling islands": "CCK",
      "colombia": "COL",
      "commonwealth of dominica": "DMA",
      "commonwealth of the bahamas": "BHS",
      "commonwealth of the northern mariana islands": "MNP",
      "comoros": "COM",
      "congo": "COG",
      "congo the democratic republic of the": "COD",
      "cook islands": "COK",
      "costa rica": "CRI",
      "cote divoire": "CIV",
      "croatia": "HRV",
      "cuba": "CUB",
      "curacao": "CUW",
      "cyprus": "CYP",
      "czech republic": "CZE",
      "czechia": "CZE",
      "democratic peoples republic of korea": "PRK",
      "democratic republic of sao tome and principe": "STP",
      "democratic republic of timor leste": "TLS",
      "democratic socialist republic of sri lanka": "LKA",
      "denmark": "DNK",
      "djibouti": "DJI",
      "dominica": "DMA",
      "dominican republic": "DOM",
      "eastern republic of uruguay": "URY",
      "ecuador": "ECU",
      "egypt": "EGY",
      "el salvador": "SLV",
      "equatorial guinea": "GNQ",
      "eritrea": "ERI",
      "estonia": "EST",
      "eswatini": "SWZ",
      "ethiopia": "ETH",
      "falkland islands malvinas": "FLK",
      "faroe islands": "FRO",
      "federal democratic republic of ethiopia": "ETH",
      "federal democratic republic of nepal": "NPL",
      "federal republic of germany": "DEU",
      "federal republic of nigeria": "NGA",
      "federal republic of somalia": "SOM",
      "federated states of micronesia": "FSM",
      "federative republic of brazil": "BRA",
      "fiji": "FJI",
      "finland": "FIN",
      "france": "FRA",
      "french guiana": "GUF",
      "french polynesia": "PYF",
      "french republic": "FRA",
      "french southern territories": "ATF",
      "gabon": "GAB",
      "gabonese republic": "GAB",
      "gambia": "GMB",
      "georgia": "GEO",
      "germany": "DEU",
      "ghana": "GHA",
      "gibraltar": "GIB",
      "grand duchy of luxembourg": "LUX",
      "greece": "GRC",
      "greenland": "GRL",
      "grenada": "GRD",
      "guadeloupe": "GLP",
      "guam": "GUM",
      "guatemala": "GTM",
      "guernsey": "GGY",
      "guinea": "GIN",
      "guinea bissau": "GNB",
      "guyana": "GUY",
      "haiti": "HTI",
      "hashemite kingdom of jordan": "JOR",
      "heard island and mcdonald islands": "HMD",
      "hellenic republic": "GRC",
      "holy see vatican city state": "VAT",
      "honduras": "HND",
      "hong kong": "HKG",
      "hong kong special administrative region of china": "HKG",
      "hungary": "HUN",
      "iceland": "ISL",
      "independent state of papua new guinea": "PNG",
      "independent state of samoa": "WSM",
      "india": "IND",
      "indonesia": "IDN",
      "iran": "IRN",
      "iran islamic republic of": "IRN",
      "iraq": "IRQ",
      "ireland": "IRL",
      "islamic republic of afghanistan": "AFG",
      "islamic republic of iran": "IRN",
      "islamic republic of mauritania": "MRT",
      "islamic republic of pakistan": "PAK",
      "isle of man": "IMN",
      "israel": "ISR",
      "italian republic": "ITA",
      "italy": "ITA",
      "jamaica": "JAM",
      "japan": "JPN",
      "jersey": "JEY",
      "jordan": "JOR",
      "kazakhstan": "KAZ",
      "kenya": "KEN",
      "kingdom of bahrain": "BHR",
      "kingdom of belgium": "BEL",
      "kingdom of bhutan": "BTN",
      "kingdom of cambodia": "KHM",
      "kingdom of denmark": "DNK",
      "kingdom of eswatini": "SWZ",
      "kingdom of lesotho": "LSO",
      "kingdom of morocco": "MAR",
      "kingdom of norway": "NOR",
      "kingdom of saudi arabia": "SAU",
      "kingdom of spain": "ESP",
      "kingdom of sweden": "SWE",
      "kingdom of thailand": "THA",
      "kingdom of the netherlands": "NLD",
      "kingdom of tonga": "TON",
      "kiribati": "KIR",
      "korea democratic peoples republic of": "PRK",
      "korea republic of": "KOR",
      "kuwait": "KWT",
      "kyrgyz republic": "KGZ",
      "kyrgyzstan": "KGZ",
      "lao peoples democratic republic": "LAO",
      "laos": "LAO",
      "latvia": "LVA",
      "lebanese republic": "LBN",
      "lebanon": "LBN",
      "lesotho": "LSO",
      "liberia": "LBR",
      "libya": "LBY",
      "liechtenstein": "LIE",
      "lithuania": "LTU",
      "luxembourg": "LUX",
      "macao": "MAC",
      "macao special administrative region of china": "MAC",
      "madagascar": "MDG",
      "malawi": "MWI",
      "malaysia": "MYS",
      "maldives": "MDV",
      "mali": "MLI",
      "malta": "MLT",
      "marshall islands": "MHL",
      "martinique": "MTQ",
      "mauritania": "MRT",
      "mauritius": "MUS",
      "mayotte": "MYT",
      "mexico": "MEX",
      "micronesia federated states of": "FSM",
      "moldova": "MDA",
      "moldova republic of": "MDA",
      "monaco": "MCO",
      "mongolia": "MNG",
      "montenegro": "MNE",
      "montserrat": "MSR",
      "morocco": "MAR",
      "mozambique": "MOZ",
      "myanmar": "MMR",
      "namibia": "NAM",
      "nauru": "NRU",
      "nepal": "NPL",
      "netherlands": "NLD",
      "new caledonia": "NCL",
      "new zealand": "NZL",
      "nicaragua": "NIC",
      "niger": "NER",
      "nigeria": "NGA",
      "niue": "NIU",
      "norfolk island": "NFK",
      "north korea": "PRK",
      "north macedonia": "MKD",
      "northern mariana islands": "MNP",
      "norway": "NOR",
      "oman": "OMN",
      "pakistan": "PAK",
      "palau": "PLW",
      "palestine state of": "PSE",
      "panama": "PAN",
      "papua new guinea": "PNG",
      "paraguay": "PRY",
      "peoples democratic republic of algeria": "DZA",
      "peoples republic of bangladesh": "BGD",
      "peoples republic of china": "CHN",
      "peru": "PER",
      "philippines": "PHL",
      "pitcairn": "PCN",
      "plurinational state of bolivia": "BOL",
      "poland": "POL",
      "portugal": "PRT",
      "portuguese republic": "PRT",
      "principality of andorra": "AND",
      "principality of liechtenstein": "LIE",
      "principality of monaco": "MCO",
      "province of china taiwan": "TWN",
      "puerto rico": "PRI",
      "qatar": "QAT",
      "republic of albania": "ALB",
      "republic of angola": "AGO",
      "republic of armenia": "ARM",
      "republic of austria": "AUT",
      "republic of azerbaijan": "AZE",
      "republic of belarus": "BLR",
      "republic of benin": "BEN",
      "republic of bosnia and herzegovina": "BIH",
      "republic of botswana": "BWA",
      "republic of bulgaria": "BGR",
      "republic of burundi": "BDI",
      "republic of cabo verde": "CPV",
      "republic of cameroon": "CMR",
      "republic of chad": "TCD",
      "republic of chile": "CHL",
      "republic of colombia": "COL",
      "republic of costa rica": "CRI",
      "republic of cote divoire": "CIV",
      "republic of croatia": "HRV",
      "republic of cuba": "CUB",
      "republic of cyprus": "CYP",
      "republic of djibouti": "DJI",
      "republic of ecuador": "ECU",
      "republic of el salvador": "SLV",
      "republic of equatorial guinea": "GNQ",
      "republic of estonia": "EST",
      "republic of fiji": "FJI",
      "republic of finland": "FIN",
      "republic of ghana": "GHA",
      "republic of guatemala": "GTM",
      "republic of guinea": "GIN",
      "republic of guinea bissau": "GNB",
      "republic of guyana": "GUY",
      "republic of haiti": "HTI",
      "republic of honduras": "HND",
      "republic of iceland": "ISL",
      "republic of india": "IND",
      "republic of indonesia": "IDN",
      "republic of iraq": "IRQ",
      "republic of kazakhstan": "KAZ",
      "republic of kenya": "KEN",
      "republic of kiribati": "KIR",
      "republic of korea": "KOR",
      "republic of latvia": "LVA",
      "republic of liberia": "LBR",
      "republic of lithuania": "LTU",
      "republic of madagascar": "MDG",
      "republic of malawi": "MWI",
      "republic of maldives": "MDV",
      "republic of mali": "MLI",
      "republic of malta": "MLT",
      "republic of mauritius": "MUS",
      "republic of moldova": "MDA",
      "republic of mozambique": "MOZ",
      "republic of myanmar": "MMR",
      "republic of namibia": "NAM",
      "republic of nauru": "NRU",
      "republic of nicaragua": "NIC",
      "republic of north macedonia": "MKD",
      "republic of palau": "PLW",
      "republic of panama": "PAN",
      "republic of paraguay": "PRY",
      "republic of peru": "PER",
      "republic of poland": "POL",
      "republic of san marino": "SMR",
      "republic of senegal": "SEN",
      "republic of serbia": "SRB",
      "republic of seychelles": "SYC",
      "republic of sierra leone": "SLE",
      "republic of singapore": "SGP",
      "republic of slovenia": "SVN",
      "republic of south africa": "ZAF",
      "republic of south sudan": "SSD",
      "republic of suriname": "SUR",
      "republic of tajikistan": "TJK",
      "republic of the congo": "COG",
      "republic of the gambia": "GMB",
      "republic of the marshall islands": "MHL",
      "republic of the niger": "NER",
      "republic of the philippines": "PHL",
      "republic of the sudan": "SDN",
      "republic of trinidad and tobago": "TTO",
      "republic of tunisia": "TUN",
      "republic of turkiye": "TUR",
      "republic of uganda": "UGA",
      "republic of uzbekistan": "UZB",
      "republic of vanuatu": "VUT",
      "republic of yemen": "YEM",
      "republic of zambia": "ZMB",
      "republic of zimbabwe": "ZWE",
      "reunion": "REU",
      "romania": "ROU",
      "russian federation": "RUS",
      "rwanda": "RWA",
      "rwandese republic": "RWA",
      "saint barthelemy": "BLM",
      "saint helena ascension and tristan da cunha": "SHN",
      "saint kitts and nevis": "KNA",
      "saint lucia": "LCA",
      "saint martin french part": "MAF",
      "saint pierre and miquelon": "SPM",
      "saint vincent and the grenadines": "VCT",
      "samoa": "WSM",
      "san marino": "SMR",
      "sao tome and principe": "STP",
      "saudi arabia": "SAU",
      "senegal": "SEN",
      "serbia": "SRB",
      "seychelles": "SYC",
      "sierra leone": "SLE",
      "singapore": "SGP",
      "sint eustatius and saba bonaire": "BES",
      "sint maarten dutch part": "SXM",
      "slovak republic": "SVK",
      "slovakia": "SVK",
      "slovenia": "SVN",
      "socialist republic of viet nam": "VNM",
      "solomon islands": "SLB",
      "somalia": "SOM",
      "south africa": "ZAF",
      "south georgia and the south sandwich islands": "SGS",
      "south korea": "KOR",
      "south sudan": "SSD",
      "spain": "ESP",
      "sri lanka": "LKA",
      "state of israel": "ISR",
      "state of kuwait": "KWT",
      "state of palestine": "PSE",
      "state of qatar": "QAT",
      "sudan": "SDN",
      "sultanate of oman": "OMN",
      "suriname": "SUR",
      "svalbard and jan mayen": "SJM",
      "sweden": "SWE",
      "swiss confederation": "CHE",
      "switzerland": "CHE",
      "syria": "SYR",
      "syrian arab republic": "SYR",
      "taiwan": "TWN",
      "taiwan province of china": "TWN",
      "tajikistan": "TJK",
      "tanzania": "TZA",
      "tanzania united republic of": "TZA",
      "thailand": "THA",
      "the democratic republic of the congo": "COD",
      "the state of eritrea": "ERI",
      "the state of palestine": "PSE",
      "timor leste": "TLS",
      "togo": "TGO",
      "togolese republic": "TGO",
      "tokelau": "TKL",
      "tonga": "TON",
      "trinidad and tobago": "TTO",
      "tunisia": "TUN",
      "turkiye": "TUR",
      "turkmenistan": "TKM",
      "turks and caicos islands": "TCA",
      "tuvalu": "TUV",
      "u s virgin islands": "VIR",
      "uganda": "UGA",
      "ukraine": "UKR",
      "union of the comoros": "COM",
      "united arab emirates": "ARE",
      "united kingdom": "GBR",
      "united kingdom of great britain and northern ireland": "GBR",
      "united mexican states": "MEX",
      "united republic of tanzania": "TZA",
      "united states": "USA",
      "united states minor outlying islands": "UMI",
      "united states of america": "USA",
      "uruguay": "URY",
      "uzbekistan": "UZB",
      "vanuatu": "VUT",
      "venezuela": "VEN",
      "venezuela bolivarian republic of": "VEN",
      "viet nam": "VNM",
      "vietnam": "VNM",
      "virgin islands british": "VGB",
      "virgin islands of the united states": "VIR",
      "virgin islands u s": "VIR",
      "wallis and futuna": "WLF",
      "western sahara": "ESH",
      "yemen": "YEM",
      "zambia": "ZMB",
      "zimbabwe": "ZWE"
    };
  }
});

// src/runtime/ownerNames.js
var toCountryName, ownerIdentityKey, COUNTRY_NAME_KEYS, buildOwnerAliasMap, canonicalOwnerName, createOwnerResolver;
var init_ownerNames = __esm({
  "src/runtime/ownerNames.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_countryNames();
    toCountryName = (token) => {
      const raw = String(token ?? "").trim();
      if (!raw) return "";
      return countryNames_default[raw] || countryNames_default[raw.toUpperCase()] || raw;
    };
    ownerIdentityKey = (value) => String(value ?? "").normalize("NFD").toLowerCase().replace(/[^a-z0-9]+/g, "");
    COUNTRY_NAME_KEYS = new Set(Object.values(countryNames_default).map(ownerIdentityKey));
    buildOwnerAliasMap = (polityOverrides) => {
      const rows = [];
      const identities = /* @__PURE__ */ new Set();
      for (const [key, polity] of Object.entries(polityOverrides ?? {})) {
        if (!polity || typeof polity !== "object") {
          continue;
        }
        const token = String(polity.code ?? "").trim() || String(key ?? "").trim();
        const tokenKey = ownerIdentityKey(token);
        if (!tokenKey) {
          continue;
        }
        identities.add(tokenKey);
        rows.push({
          names: [polity.name, ...Array.isArray(polity.aliases) ? polity.aliases : []],
          // The keys this polity had before a rename re-keyed it. They WERE this
          // country, so a real country's name among them still folds onto it —
          // unless that country is alive again as a polity of its own.
          formerNames: Array.isArray(polity.formerNames) ? polity.formerNames : [],
          token,
          tokenKey
        });
      }
      const aliases = /* @__PURE__ */ new Map();
      for (const row of rows) {
        for (const [name, former] of [...row.names.map((entry) => [entry, false]), ...row.formerNames.map((entry) => [entry, true])]) {
          const nameKey = ownerIdentityKey(name);
          if (!nameKey || nameKey === row.tokenKey || identities.has(nameKey) || !former && COUNTRY_NAME_KEYS.has(nameKey)) {
            continue;
          }
          const claimed = aliases.get(nameKey);
          aliases.set(nameKey, claimed !== void 0 && claimed !== row.token ? "" : row.token);
        }
      }
      for (const [key, token] of aliases) {
        if (!token) {
          aliases.delete(key);
        }
      }
      return aliases;
    };
    canonicalOwnerName = (token, aliasMap2) => {
      const name = toCountryName(token);
      if (!name || !aliasMap2?.size) {
        return name;
      }
      return aliasMap2.get(ownerIdentityKey(name)) || name;
    };
    createOwnerResolver = (aliasMap2) => {
      const cache = /* @__PURE__ */ new Map();
      return (value) => {
        const raw = String(value ?? "").trim();
        if (!raw) {
          return "";
        }
        const cached = cache.get(raw);
        if (cached !== void 0) {
          return cached;
        }
        const resolved = canonicalOwnerName(raw, aliasMap2);
        cache.set(raw, resolved);
        return resolved;
      };
    };
  }
});

// src/runtime/polityIdentity.js
var normalizeString, MEMO_LIMIT, memoizedFold, foldIdentityText, normalizeIdentityText, STOCK_COUNTRY_NAMES, STOCK_CODES_BY_NAME, normalizeMapRefs, stockCodesForToken, isStockPolityName, resolveStockCountryCode, foldPolityCore, polityCore, normalizeAliases, countOwnedRegions, buildDeclaredPolities, chooseUnique, buildPolityIdentityIndex, resolvePolityIdentity;
var init_polityIdentity = __esm({
  "src/runtime/polityIdentity.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_countryNames();
    init_officialCountryAliases();
    init_ownerNames();
    normalizeString = (value) => String(value ?? "").trim();
    MEMO_LIMIT = 2e4;
    memoizedFold = (fold13) => {
      const memo = /* @__PURE__ */ new Map();
      return (value) => {
        const key = typeof value === "string" ? value : String(value ?? "");
        let answer = memo.get(key);
        if (answer === void 0) {
          answer = fold13(key);
          if (memo.size >= MEMO_LIMIT) memo.clear();
          memo.set(key, answer);
        }
        return answer;
      };
    };
    foldIdentityText = (value) => normalizeString(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    normalizeIdentityText = memoizedFold(foldIdentityText);
    STOCK_COUNTRY_NAMES = new Set(
      Object.values(countryNames_default).map(normalizeIdentityText).filter(Boolean)
    );
    STOCK_CODES_BY_NAME = (() => {
      const out = /* @__PURE__ */ new Map();
      const add = (normalizedName, normalizedCode) => {
        if (!normalizedName || !normalizedCode) return;
        const list12 = out.get(normalizedName) || [];
        if (!list12.includes(normalizedCode)) list12.push(normalizedCode);
        out.set(normalizedName, list12);
      };
      for (const [code, name] of Object.entries(countryNames_default)) {
        add(
          normalizeIdentityText(name),
          normalizeString(code).toUpperCase()
        );
      }
      for (const [normalizedName, code] of Object.entries(officialCountryAliases_default)) {
        add(
          normalizeIdentityText(normalizedName),
          normalizeString(code).toUpperCase()
        );
      }
      return out;
    })();
    normalizeMapRefs = (value) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const gadm0 = Array.isArray(source.gadm0) ? source.gadm0 : [];
      return {
        gadm0: [...new Set(
          gadm0.map((entry) => normalizeString(entry).toUpperCase()).filter((entry) => Boolean(countryNames_default[entry]))
        )]
      };
    };
    stockCodesForToken = (rawToken, stockName) => {
      const raw = normalizeString(rawToken).toUpperCase();
      const direct = countryNames_default[raw] ? [raw] : [];
      const byName = STOCK_CODES_BY_NAME.get(normalizeIdentityText(stockName)) || [];
      return [.../* @__PURE__ */ new Set([...direct, ...byName])];
    };
    isStockPolityName = (value) => STOCK_COUNTRY_NAMES.has(
      normalizeIdentityText(toCountryName(value))
    );
    resolveStockCountryCode = (value) => {
      const raw = normalizeString(value);
      if (!raw) return null;
      const stockName = toCountryName(raw);
      const codes = stockCodesForToken(raw, stockName);
      return codes.length === 1 ? codes[0] : null;
    };
    foldPolityCore = (value) => {
      let text3 = normalizeIdentityText(value);
      if (!text3) return "";
      text3 = text3.replace(/^the\s+/, "");
      const prefixes = [
        "federal democratic republic of ",
        "federal republic of ",
        "peoples democratic republic of ",
        "people s democratic republic of ",
        "peoples republic of ",
        "people s republic of ",
        "democratic republic of ",
        "socialist republic of ",
        "united republic of ",
        "grand duchy of ",
        "kingdom of ",
        "republic of ",
        "empire of ",
        "principality of ",
        "duchy of ",
        "sultanate of ",
        "emirate of ",
        "caliphate of ",
        "commonwealth of ",
        "federation of ",
        "confederation of "
      ];
      for (const prefix of prefixes) {
        if (text3.startsWith(prefix)) {
          text3 = text3.slice(prefix.length).trim();
          break;
        }
      }
      const suffixes = [
        " federal republic",
        " democratic republic",
        " peoples republic",
        " people s republic",
        " socialist republic",
        " grand duchy",
        " kingdom",
        " republic",
        " empire",
        " principality",
        " duchy",
        " sultanate",
        " emirate",
        " caliphate",
        " commonwealth",
        " federation",
        " confederation"
      ];
      for (const suffix of suffixes) {
        if (text3.endsWith(suffix)) {
          text3 = text3.slice(0, -suffix.length).trim();
          break;
        }
      }
      return text3;
    };
    polityCore = memoizedFold(foldPolityCore);
    normalizeAliases = (value) => Array.isArray(value) ? value.map((entry) => normalizeString(entry)).filter(Boolean) : [];
    countOwnedRegions = (world) => {
      const counts = /* @__PURE__ */ new Map();
      for (const owner of Object.values(
        world?.regionOwnershipOverrides || {}
      )) {
        const name = normalizeString(owner);
        if (!name) continue;
        counts.set(
          name,
          (counts.get(name) || 0) + 1
        );
      }
      return counts;
    };
    buildDeclaredPolities = (world) => {
      const ownershipCounts = countOwnedRegions(world);
      return Object.entries(
        world?.polityOverrides || {}
      ).map(([key, value]) => {
        const canonical = normalizeString(key);
        if (!canonical) return null;
        const names = [
          canonical,
          normalizeString(value?.code),
          normalizeString(value?.name),
          ...normalizeAliases(value?.aliases)
        ].filter(Boolean);
        const lifecycleStatus = normalizeString(value?.status).toLowerCase();
        const ownedRegions = ownershipCounts.get(canonical) || 0;
        return {
          canonical,
          names: [...new Set(names)],
          normalizedNames: [
            ...new Set(
              names.map(normalizeIdentityText).filter(Boolean)
            )
          ],
          cores: [
            ...new Set(
              names.map(polityCore).filter(Boolean)
            )
          ],
          mapRefs: normalizeMapRefs(value?.mapRefs),
          ownedRegions,
          lifecycleStatus,
          active: lifecycleStatus === "active" || ownedRegions > 0
        };
      }).filter(Boolean);
    };
    chooseUnique = (candidates) => {
      if (candidates.length === 1) {
        return {
          candidate: candidates[0],
          ambiguous: false
        };
      }
      if (candidates.length === 0) {
        return {
          candidate: null,
          ambiguous: false
        };
      }
      const active = candidates.filter(
        (candidate) => candidate.active
      );
      if (active.length === 1) {
        return {
          candidate: active[0],
          ambiguous: false
        };
      }
      return {
        candidate: null,
        ambiguous: true
      };
    };
    buildPolityIdentityIndex = (world) => ({
      declared: buildDeclaredPolities(world),
      ownershipCounts: countOwnedRegions(world)
    });
    resolvePolityIdentity = (token, world, {
      allowUnknown = true,
      requireActive = false,
      allowCoreMatch = true,
      allowStockBase = true,
      allowMapRefs = true,
      identityIndex = null
    } = {}) => {
      const stockName = toCountryName(normalizeString(token));
      if (!stockName) {
        return {
          input: normalizeString(token),
          normalizedInput: "",
          resolved: "",
          status: "empty",
          candidates: []
        };
      }
      const normalizedInput = normalizeIdentityText(stockName);
      const coreInput = polityCore(stockName);
      const index = identityIndex && Array.isArray(identityIndex?.declared) ? identityIndex : buildPolityIdentityIndex(world);
      const stockCodes = stockCodesForToken(token, stockName);
      const mapRefMatches = allowMapRefs && stockCodes.length ? index.declared.filter((candidate) => candidate.mapRefs.gadm0.some((code) => stockCodes.includes(code)) && (!requireActive || candidate.active)) : [];
      const declaredRelated = index.declared.filter(
        (candidate) => candidate.normalizedNames.includes(normalizedInput) || coreInput && candidate.cores.includes(coreInput) || allowMapRefs && candidate.mapRefs.gadm0.some((code) => stockCodes.includes(code))
      );
      const exact = index.declared.filter(
        (candidate) => candidate.normalizedNames.includes(
          normalizedInput
        ) && (!requireActive || candidate.active)
      );
      {
        const choice = chooseUnique(exact);
        if (choice.candidate) {
          return {
            input: normalizeString(token),
            normalizedInput,
            resolved: choice.candidate.canonical,
            status: "exact-declared",
            candidates: exact.map(
              (candidate) => candidate.canonical
            )
          };
        }
        if (choice.ambiguous) {
          return {
            input: normalizeString(token),
            normalizedInput,
            resolved: "",
            status: "ambiguous-exact",
            candidates: exact.map(
              (candidate) => candidate.canonical
            )
          };
        }
      }
      {
        const choice = chooseUnique(mapRefMatches);
        if (choice.candidate) {
          return {
            input: normalizeString(token),
            normalizedInput,
            resolved: choice.candidate.canonical,
            status: "map-ref",
            candidates: mapRefMatches.map((candidate) => candidate.canonical)
          };
        }
        if (choice.ambiguous) {
          return {
            input: normalizeString(token),
            normalizedInput,
            resolved: "",
            status: "ambiguous-map-ref",
            candidates: mapRefMatches.map((candidate) => candidate.canonical)
          };
        }
      }
      const coreMatches = allowCoreMatch && coreInput ? index.declared.filter(
        (candidate) => candidate.cores.includes(
          coreInput
        ) && (!requireActive || candidate.active)
      ) : [];
      {
        const choice = chooseUnique(coreMatches);
        if (choice.candidate) {
          return {
            input: normalizeString(token),
            normalizedInput,
            resolved: choice.candidate.canonical,
            status: "core-match",
            candidates: coreMatches.map(
              (candidate) => candidate.canonical
            )
          };
        }
        if (choice.ambiguous) {
          return {
            input: normalizeString(token),
            normalizedInput,
            resolved: "",
            status: "ambiguous-core",
            candidates: coreMatches.map(
              (candidate) => candidate.canonical
            )
          };
        }
      }
      if (allowStockBase && isStockPolityName(stockName) && declaredRelated.length === 0) {
        return {
          input: normalizeString(token),
          normalizedInput,
          resolved: stockName,
          status: "stock-base",
          candidates: []
        };
      }
      if (allowUnknown) {
        return {
          input: normalizeString(token),
          normalizedInput,
          resolved: stockName,
          status: "unknown-pass-through",
          candidates: []
        };
      }
      return {
        input: normalizeString(token),
        normalizedInput,
        resolved: "",
        status: "unresolved",
        candidates: declaredRelated.map(
          (candidate) => candidate.canonical
        )
      };
    };
  }
});

// src/runtime/countryList.js
var init_countryList = __esm({
  "src/runtime/countryList.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_ownerNames();
  }
});

// src/runtime/wholeFileSource.js
var WholeFileSource;
var init_wholeFileSource = __esm({
  "src/runtime/wholeFileSource.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    WholeFileSource = class {
      // load(url) resolves to the archive's bytes (an ArrayBuffer or a Uint8Array).
      // Called on every read, so it must hand back the one buffer rather than
      // fetch again; warmPmtilesArchive dedupes in-flight loads and keeps the
      // result.
      constructor(url, load) {
        this.url = url;
        this.load = load;
      }
      getKey() {
        return this.url;
      }
      async getBytes(offset, length) {
        const buffer = await this.load(this.url);
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        const start = Math.min(bytes.byteLength, Math.max(0, Number(offset) || 0));
        const end = Math.min(bytes.byteLength, start + Math.max(0, Number(length) || 0));
        return { data: bytes.slice(start, end).buffer };
      }
    };
  }
});

// src/runtime/native/bridge.js
var isNativeBuild;
var init_bridge = __esm({
  "src/runtime/native/bridge.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    isNativeBuild = () => {
      try {
        return Boolean(define_import_meta_env_default.VITE_OH_NATIVE);
      } catch {
        return false;
      }
    };
  }
});

// src/runtime/assets.js
var PRELOAD_CACHE_NAME, KEPT_MUSIC_CACHE_NAME, SAVE_MOVE_CACHE_NAME, runtimeAssetToken, origin, withRuntimeToken, buildAbsoluteUrl, JSON_URLS, PMTILES_ARCHIVES, PMTILES_PROTOCOL_URLS, jsonValueCache, jsonRequestCache, runtimeJsonValueCache, runtimeJsonRequestCache, binaryValueCache, binaryRequestCache, pmtilesArchives, pmtilesCache, jsonLoadedUrls, jsonByteLengths, pmtilesProtocol, workerFetchableUrls, workerFetchableUrlListeners, WORKER_URL_REVOKE_GRACE_MS, notifyWorkerFetchableUrls, releaseWorkerFetchableUrl, isLoopbackHost, servedFromThisMachine, isStalePersistedCopy, sweepPersistedCopies, persistedCopiesSwept, setRuntimeAssetEndpoints, getPersistentCache, readPersistedResponse, persistResponse, fetchWithPersistence, MemorySource, loadWholeArchive, createPmtilesArchive, registerPmtilesArchive, getPmtilesArchive, primePmtilesArchive, warmPmtilesArchive;
var init_assets = __esm({
  "src/runtime/assets.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_esm2();
    init_regionNameFixes();
    init_debugLog();
    init_polityIdentity();
    init_countryList();
    init_wholeFileSource();
    init_bridge();
    PRELOAD_CACHE_NAME = "open-historia-preload-v2";
    KEPT_MUSIC_CACHE_NAME = "oh-music-v1";
    SAVE_MOVE_CACHE_NAME = "oh-save-move";
    if (typeof caches !== "undefined" && caches?.keys) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key !== PRELOAD_CACHE_NAME && key !== KEPT_MUSIC_CACHE_NAME && key !== SAVE_MOVE_CACHE_NAME) caches.delete(key).catch(() => {
          });
        }
      }).catch(() => {
      });
    }
    runtimeAssetToken = "";
    origin = typeof window !== "undefined" ? window.location.origin : "";
    withRuntimeToken = (pathname) => {
      if (!runtimeAssetToken) {
        return pathname;
      }
      if (!origin) {
        return `${pathname}?v=${encodeURIComponent(runtimeAssetToken)}`;
      }
      const url = new URL(pathname, origin);
      url.searchParams.set("v", runtimeAssetToken);
      return `${url.pathname}${url.search}`;
    };
    buildAbsoluteUrl = (pathname) => {
      const relativePath = withRuntimeToken(pathname);
      return origin ? new URL(relativePath, origin).toString() : relativePath;
    };
    JSON_URLS = {
      advisor: "",
      actions: "",
      chat: "",
      colors: "",
      flags: "",
      tags: "",
      stats: "",
      events: "",
      game: "",
      prompts: "",
      regionsGeojson: "",
      citiesGeojson: "",
      backgroundData: "",
      ownBasemapsData: "",
      world: "",
      intercepts: ""
    };
    PMTILES_ARCHIVES = {
      cities: "",
      countries: "",
      regions: ""
    };
    PMTILES_PROTOCOL_URLS = {
      cities: "",
      countries: "",
      regions: ""
    };
    jsonValueCache = /* @__PURE__ */ new Map();
    jsonRequestCache = /* @__PURE__ */ new Map();
    runtimeJsonValueCache = /* @__PURE__ */ new Map();
    runtimeJsonRequestCache = /* @__PURE__ */ new Map();
    binaryValueCache = /* @__PURE__ */ new Map();
    binaryRequestCache = /* @__PURE__ */ new Map();
    pmtilesArchives = /* @__PURE__ */ new Map();
    pmtilesCache = new P(256);
    jsonLoadedUrls = /* @__PURE__ */ new Set();
    jsonByteLengths = /* @__PURE__ */ new Map();
    pmtilesProtocol = new S();
    if (isNativeBuild() && pmtilesProtocol.tiles instanceof Map) {
      const opened = pmtilesProtocol.tiles;
      const lookup = opened.get.bind(opened);
      opened.get = (url) => lookup(url) ?? getPmtilesArchive(url);
    }
    workerFetchableUrls = /* @__PURE__ */ new Map();
    workerFetchableUrlListeners = /* @__PURE__ */ new Set();
    WORKER_URL_REVOKE_GRACE_MS = 6e4;
    notifyWorkerFetchableUrls = () => {
      for (const listener of workerFetchableUrlListeners) listener();
    };
    releaseWorkerFetchableUrl = (url) => {
      const entry = workerFetchableUrls.get(url);
      if (!entry) return;
      workerFetchableUrls.delete(url);
      if (entry.blobUrl && typeof URL.revokeObjectURL === "function") {
        setTimeout(() => URL.revokeObjectURL(entry.blobUrl), WORKER_URL_REVOKE_GRACE_MS);
      }
      notifyWorkerFetchableUrls();
    };
    isLoopbackHost = (hostname) => /^(localhost|127(?:\.\d{1,3}){3}|\[?::1\]?)$/i.test(String(hostname ?? "").trim());
    servedFromThisMachine = (() => {
      try {
        return isLoopbackHost(new URL(origin).hostname);
      } catch {
        return false;
      }
    })();
    isStalePersistedCopy = (entryUrl, { token = runtimeAssetToken, local = servedFromThisMachine } = {}) => {
      let url;
      try {
        url = new URL(String(entryUrl ?? ""), origin || "https://open-historia.local");
      } catch {
        return false;
      }
      if (url.pathname.startsWith("/__runtime-cache/")) return false;
      if (local) return true;
      if (!token) return false;
      const version = url.searchParams.get("v");
      if (version === null) return url.pathname.startsWith("/api/runtime/");
      return version !== token;
    };
    sweepPersistedCopies = async (options) => {
      if (typeof caches === "undefined") return 0;
      let removed = 0;
      try {
        const cache = await caches.open(PRELOAD_CACHE_NAME);
        for (const request of await cache.keys()) {
          if (!isStalePersistedCopy(request?.url, options)) continue;
          if (await cache.delete(request)) removed += 1;
        }
      } catch {
      }
      return removed;
    };
    persistedCopiesSwept = false;
    setRuntimeAssetEndpoints = ({ token = "" } = {}) => {
      const nextToken = String(token ?? "").trim();
      const tokenMoved = nextToken !== runtimeAssetToken;
      if (nextToken !== runtimeAssetToken) {
        for (const url of Object.values(JSON_URLS)) {
          if (!url) continue;
          jsonValueCache.delete(url);
          jsonRequestCache.delete(url);
          jsonLoadedUrls.delete(url);
          jsonByteLengths.delete(url);
          releaseWorkerFetchableUrl(url);
        }
        for (const url of Object.values(PMTILES_ARCHIVES)) {
          if (!url) continue;
          binaryValueCache.delete(url);
          binaryRequestCache.delete(url);
          pmtilesArchives.delete(url);
          pmtilesProtocol?.tiles?.delete?.(url);
          pmtilesCache?.cache?.delete?.(url);
        }
        runtimeJsonValueCache.clear();
        runtimeJsonRequestCache.clear();
      }
      runtimeAssetToken = nextToken;
      if (tokenMoved || !persistedCopiesSwept) {
        persistedCopiesSwept = true;
        void sweepPersistedCopies().catch(() => {
        });
      }
      JSON_URLS.advisor = withRuntimeToken("/api/runtime/json/advisor");
      JSON_URLS.actions = withRuntimeToken("/api/runtime/json/actions");
      JSON_URLS.chat = withRuntimeToken("/api/runtime/json/chat");
      JSON_URLS.colors = withRuntimeToken("/api/runtime/json/colors");
      JSON_URLS.flags = withRuntimeToken("/api/runtime/json/flags");
      JSON_URLS.tags = withRuntimeToken("/api/runtime/json/tags");
      JSON_URLS.stats = withRuntimeToken("/api/runtime/json/stats");
      JSON_URLS.events = withRuntimeToken("/api/runtime/json/events");
      JSON_URLS.game = withRuntimeToken("/api/runtime/json/game");
      JSON_URLS.prompts = withRuntimeToken("/api/runtime/json/prompts");
      JSON_URLS.snapshots = withRuntimeToken("/api/runtime/json/snapshots");
      JSON_URLS.snapshotsIndex = withRuntimeToken("/api/runtime/json/snapshotsIndex");
      JSON_URLS.regionsGeojson = withRuntimeToken("/api/runtime/json/regionsGeojson");
      JSON_URLS.citiesGeojson = withRuntimeToken("/api/runtime/json/citiesGeojson");
      JSON_URLS.backgroundData = withRuntimeToken("/api/runtime/json/backgroundData");
      JSON_URLS.ownBasemapsData = withRuntimeToken("/api/runtime/json/ownBasemapsData");
      JSON_URLS.world = withRuntimeToken("/api/runtime/json/world");
      JSON_URLS.intercepts = withRuntimeToken("/api/runtime/json/intercepts");
      PMTILES_ARCHIVES.cities = buildAbsoluteUrl("/api/runtime/pmtiles/cities");
      PMTILES_ARCHIVES.countries = buildAbsoluteUrl("/api/runtime/pmtiles/countries");
      PMTILES_ARCHIVES.regions = buildAbsoluteUrl("/api/runtime/pmtiles/regions");
      PMTILES_PROTOCOL_URLS.cities = `pmtiles://${PMTILES_ARCHIVES.cities}`;
      PMTILES_PROTOCOL_URLS.countries = `pmtiles://${PMTILES_ARCHIVES.countries}`;
      PMTILES_PROTOCOL_URLS.regions = `pmtiles://${PMTILES_ARCHIVES.regions}`;
    };
    setRuntimeAssetEndpoints();
    getPersistentCache = async () => {
      if (typeof caches === "undefined") return null;
      try {
        return await caches.open(PRELOAD_CACHE_NAME);
      } catch {
        return null;
      }
    };
    readPersistedResponse = async (url) => {
      const cache = await getPersistentCache();
      if (!cache) return null;
      try {
        return await cache.match(url);
      } catch {
        return null;
      }
    };
    persistResponse = async (url, response) => {
      const cache = await getPersistentCache();
      if (!cache) return;
      try {
        await cache.put(url, response);
      } catch {
      }
    };
    fetchWithPersistence = async (url, { bypassPersistentCache = false, signal } = {}) => {
      const persistent = !bypassPersistentCache && !servedFromThisMachine;
      if (persistent) {
        const cached = await readPersistedResponse(url);
        if (cached) {
          try {
            const head = await fetch(url, { method: "HEAD", signal });
            const serverLength = head.ok ? head.headers.get("content-length") : null;
            const cachedLength = cached.headers.get("content-length");
            if (!serverLength || !cachedLength || serverLength === cachedLength) {
              return { response: cached, fromCache: true };
            }
          } catch {
            return { response: cached, fromCache: true };
          }
        }
      }
      const response = await fetch(url, {
        // The Android app has no Cache Storage (an http origin is not a secure
        // context) and its archives come from inside the APK: nothing to keep a
        // second copy of in the WebView's HTTP cache.
        cache: bypassPersistentCache || define_import_meta_env_default.VITE_OH_NATIVE ? "no-store" : "force-cache",
        signal
      });
      if (!response.ok) {
        const error = new Error(`Failed to load ${url}: HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      if (persistent) {
        persistResponse(url, response.clone());
      }
      return { response, fromCache: false };
    };
    MemorySource = class {
      constructor(url, buffer) {
        this.url = url;
        this.bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      }
      getKey() {
        return this.url;
      }
      async getBytes(offset, length) {
        const end = Math.min(this.bytes.byteLength, offset + length);
        return {
          data: this.bytes.slice(offset, end).buffer
        };
      }
    };
    loadWholeArchive = async (url) => {
      await warmPmtilesArchive(url);
      const buffer = binaryValueCache.get(url);
      if (!buffer) throw new Error(`${url} was released while it was being read.`);
      return buffer;
    };
    createPmtilesArchive = (url) => {
      const source = binaryValueCache.has(url) ? new MemorySource(url, binaryValueCache.get(url)) : define_import_meta_env_default.VITE_OH_NATIVE ? new WholeFileSource(url, loadWholeArchive) : url;
      return new w(source, pmtilesCache);
    };
    registerPmtilesArchive = (url) => {
      const archive = createPmtilesArchive(url);
      pmtilesArchives.set(url, archive);
      pmtilesProtocol.add(archive);
      return archive;
    };
    getPmtilesArchive = (url) => pmtilesArchives.get(url) || registerPmtilesArchive(url);
    primePmtilesArchive = (url, buffer) => {
      binaryValueCache.set(url, buffer);
      binaryRequestCache.delete(url);
      return registerPmtilesArchive(url);
    };
    warmPmtilesArchive = async (url, { signal } = {}) => {
      if (binaryValueCache.has(url)) {
        return {
          fromCache: true,
          kind: "pmtiles",
          size: binaryValueCache.get(url).byteLength,
          url
        };
      }
      if (binaryRequestCache.has(url)) {
        const buffer2 = await binaryRequestCache.get(url);
        return {
          fromCache: true,
          kind: "pmtiles",
          size: buffer2.byteLength,
          url
        };
      }
      const request = (async () => {
        let buffer2 = null;
        const { response } = await fetchWithPersistence(url, { signal });
        buffer2 = await response.arrayBuffer();
        primePmtilesArchive(url, buffer2);
        return buffer2;
      })().finally(() => {
        binaryRequestCache.delete(url);
      });
      binaryRequestCache.set(url, request);
      const buffer = await request;
      return {
        fromCache: false,
        kind: "pmtiles",
        size: buffer.byteLength,
        url
      };
    };
  }
});

// src/runtime/mapClaims.js
var init_mapClaims = __esm({
  "src/runtime/mapClaims.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/populationFigure.js
var POPULATION_FIGURE_MOST, SCALES, readPopulationFigure, populationFigureOf;
var init_populationFigure = __esm({
  "src/runtime/populationFigure.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    POPULATION_FIGURE_MOST = 2e10;
    SCALES = { k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9 };
    readPopulationFigure = (value) => {
      if (typeof value === "number") return Number.isFinite(value) && value >= 1 ? Math.min(POPULATION_FIGURE_MOST, Math.round(value)) : 0;
      const text3 = String(value ?? "").trim().toLowerCase().replace(/[,\s_'’]/g, "");
      const match = /^(\d+(?:\.\d+)?)([a-z]*)$/.exec(text3);
      if (!match) return 0;
      const scale = match[2] ? SCALES[match[2]] : 1;
      if (!scale) return 0;
      const people = Number(match[1]) * scale;
      return Number.isFinite(people) && people >= 1 ? Math.min(POPULATION_FIGURE_MOST, Math.round(people)) : 0;
    };
    populationFigureOf = (record) => readPopulationFigure(record && typeof record === "object" ? record.population : 0);
  }
});

// src/runtime/naval/record.js
var SEA_BATTLES_KEPT_MOST, NAVIES_RAISED_KEPT_MOST, clean3, list2, normalizeFleet, normalizeSeaBattle, normalizeNaviesRaised, normalizeSeaBattles;
var init_record = __esm({
  "src/runtime/naval/record.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    SEA_BATTLES_KEPT_MOST = 24;
    NAVIES_RAISED_KEPT_MOST = 120;
    clean3 = (value, most = 160) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    list2 = (value) => Array.isArray(value) ? value : [];
    normalizeFleet = (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const name = clean3(raw.name, 120);
      const owner = clean3(raw.owner, 120);
      if (!name || !owner) return null;
      const figure4 = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
      return { name, owner, before: figure4(raw.before), after: figure4(raw.after), ...raw.sunk === true ? { sunk: true } : {}, ...raw.broke === true ? { broke: true } : {} };
    };
    normalizeSeaBattle = (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const lng = Number(raw.lng);
      const lat = Number(raw.lat);
      const id = clean3(raw.id, 80);
      if (!id || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      const fleets = [0, 1].map((side) => list2(raw.fleets?.[side]).map(normalizeFleet).filter(Boolean).slice(0, 12));
      if (fleets[0].length === 0 || fleets[1].length === 0) return null;
      return {
        id,
        date: clean3(raw.date, 40),
        round: Math.max(0, Math.trunc(Number(raw.round) || 0)),
        place: clean3(raw.place, 120) || "at sea",
        lng,
        lat,
        warId: clean3(raw.warId, 120),
        sides: [0, 1].map((side) => list2(raw.sides?.[side]).map((name) => clean3(name, 120)).filter(Boolean).slice(0, 12)),
        fleets,
        winner: raw.winner === 0 || raw.winner === 1 ? raw.winner : -1
      };
    };
    normalizeNaviesRaised = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list2(value)) {
        const country = clean3(raw?.country, 120);
        const date = clean3(raw?.date, 40);
        if (!country || !date) continue;
        kept.delete(country.toLowerCase());
        kept.set(country.toLowerCase(), { country, date });
      }
      return [...kept.values()].slice(-NAVIES_RAISED_KEPT_MOST);
    };
    normalizeSeaBattles = (value) => list2(value).map(normalizeSeaBattle).filter(Boolean).slice(-SEA_BATTLES_KEPT_MOST);
  }
});

// src/runtime/naval/blockade.js
var BLOCKADE_LEAST, BLOCKADES_KEPT_MOST, clean4, fold2, list3, within, normalizeBlockade, normalizeBlockades;
var init_blockade = __esm({
  "src/runtime/naval/blockade.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    BLOCKADE_LEAST = 0.02;
    BLOCKADES_KEPT_MOST = 40;
    clean4 = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold2 = (value) => clean4(value).toLowerCase();
    list3 = (value) => Array.isArray(value) ? value : [];
    within = (value, least, most) => Math.min(most, Math.max(least, value));
    normalizeBlockade = (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const country = clean4(raw.country);
      const pressure = Number(raw.pressure);
      if (!country || !(pressure >= BLOCKADE_LEAST)) return null;
      return {
        country,
        by: [...new Set(list3(raw.by).map((name) => clean4(name)).filter(Boolean))].slice(0, 12),
        pressure: Math.round(within(pressure, 0, 1) * 1e3) / 1e3,
        covered: Math.round(within(Number(raw.covered) || 0, 0, 1) * 1e3) / 1e3,
        days: Math.max(0, Math.round(Number(raw.days) || 0)),
        since: clean4(raw.since, 40)
      };
    };
    normalizeBlockades = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list3(value)) {
        const record = normalizeBlockade(raw);
        if (record) kept.set(fold2(record.country), record);
      }
      return [...kept.values()].slice(0, BLOCKADES_KEPT_MOST);
    };
  }
});

// src/runtime/alliances.js
var DEFENSIVE_AGREEMENT_TYPES, DEFENSIVE_INSTITUTION_KINDS, CALL_STATUSES, WAR_SIDE_MOST, CALLS_KEPT_MOST, clean5, fold3, list4, figure, normalizeCallToArms, normalizeCallsToArms;
var init_alliances = __esm({
  "src/runtime/alliances.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    DEFENSIVE_AGREEMENT_TYPES = Object.freeze(["alliance", "mutual_defense"]);
    DEFENSIVE_INSTITUTION_KINDS = Object.freeze(["security_alliance", "defense_pact"]);
    CALL_STATUSES = Object.freeze(["open", "honoured", "refused", "lapsed"]);
    WAR_SIDE_MOST = 12;
    CALLS_KEPT_MOST = 40;
    clean5 = (value, most = 160) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold3 = (value) => clean5(value).toLowerCase();
    list4 = (value) => Array.isArray(value) ? value : [];
    figure = (value) => {
      const read = Number(value);
      return Number.isFinite(read) ? read : 0;
    };
    normalizeCallToArms = (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const id = clean5(raw.id, 120);
      const warId = clean5(raw.warId);
      const ally = clean5(raw.ally);
      const defender = clean5(raw.defender);
      if (!id || !warId || !ally || !defender || fold3(ally) === fold3(defender)) return null;
      const status = CALL_STATUSES.includes(raw.status) ? raw.status : "open";
      const answered = Math.round(figure(raw.answeredRound));
      return {
        id,
        warId,
        ally,
        defender,
        attackers: [...new Set(list4(raw.attackers).map((name) => clean5(name)).filter(Boolean))].slice(0, WAR_SIDE_MOST),
        via: { kind: raw.via?.kind === "institution" ? "institution" : "agreement", id: clean5(raw.via?.id), title: clean5(raw.via?.title) },
        date: clean5(raw.date, 40),
        round: Math.max(0, Math.round(figure(raw.round))),
        status,
        ...status !== "open" && answered > 0 ? { answeredRound: answered } : {}
      };
    };
    normalizeCallsToArms = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list4(value)) {
        const call = normalizeCallToArms(raw);
        if (call) kept.set(call.id, call);
      }
      return [...kept.values()].slice(-CALLS_KEPT_MOST);
    };
  }
});

// src/runtime/peaceTerms.js
var TERRITORY_AS_HELD, TERRITORY_RESTORED, PEACE_TERRITORIES, OFFER_STATUSES, REPARATIONS_SHARE_LEAST, OFFERS_KEPT_MOST, REPARATIONS_KEPT_MOST, clean6, fold4, list5, within2, figure2, round, normalizePayment, normalizeTerms, normalizePeaceOffer, normalizePeaceOffers, normalizeReparation, normalizeReparations, TREATIES_KEPT_MOST, TREATY_WAYS, normalizePeaceTreaties;
var init_peaceTerms = __esm({
  "src/runtime/peaceTerms.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    TERRITORY_AS_HELD = "as held";
    TERRITORY_RESTORED = "restored";
    PEACE_TERRITORIES = Object.freeze([TERRITORY_AS_HELD, TERRITORY_RESTORED]);
    OFFER_STATUSES = Object.freeze(["open", "accepted", "declined", "lapsed"]);
    REPARATIONS_SHARE_LEAST = 5e-3;
    OFFERS_KEPT_MOST = 24;
    REPARATIONS_KEPT_MOST = 24;
    clean6 = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold4 = (value) => clean6(value).toLowerCase();
    list5 = (value) => Array.isArray(value) ? value : [];
    within2 = (value, least, most) => Math.min(most, Math.max(least, value));
    figure2 = (value) => {
      const read = Number(value);
      return Number.isFinite(read) ? read : 0;
    };
    round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
    normalizePayment = (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const payer = clean6(raw.payer);
      const receiver = clean6(raw.receiver);
      const share = figure2(raw.share);
      const years = Math.round(figure2(raw.years));
      if (!payer || !receiver || fold4(payer) === fold4(receiver) || !(share >= REPARATIONS_SHARE_LEAST / 2) || !(years >= 1)) return null;
      return { payer, receiver, share: round(within2(share, 0, 0.2), 4), years: Math.min(30, years) };
    };
    normalizeTerms = (raw) => ({
      territory: PEACE_TERRITORIES.includes(raw?.territory) ? raw.territory : TERRITORY_RESTORED,
      reparations: normalizePayment(raw?.reparations)
    });
    normalizePeaceOffer = (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const id = clean6(raw.id, 80);
      const warId = clean6(raw.warId);
      const from = clean6(raw.from);
      const to = clean6(raw.to);
      if (!id || !warId || !from || !to || fold4(from) === fold4(to)) return null;
      const status = OFFER_STATUSES.includes(raw.status) ? raw.status : "open";
      const answered = Math.round(figure2(raw.answeredRound));
      return {
        id,
        warId,
        from,
        to,
        terms: normalizeTerms(raw.terms),
        date: clean6(raw.date, 40),
        round: Math.max(0, Math.round(figure2(raw.round))),
        status,
        ...status !== "open" && answered > 0 ? { answeredRound: answered } : {}
      };
    };
    normalizePeaceOffers = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list5(value)) {
        const offer = normalizePeaceOffer(raw);
        if (offer) kept.set(offer.id, offer);
      }
      return [...kept.values()].slice(-OFFERS_KEPT_MOST);
    };
    normalizeReparation = (raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const id = clean6(raw.id, 80);
      const payer = clean6(raw.payer);
      const receiver = clean6(raw.receiver);
      const share = figure2(raw.share);
      const days = Math.round(figure2(raw.days));
      if (!id || !payer || !receiver || fold4(payer) === fold4(receiver) || !(share > 0) || !(days > 0)) return null;
      const paidDays = within2(Math.round(figure2(raw.paidDays)), 0, days);
      return { id, warId: clean6(raw.warId), payer, receiver, share: round(within2(share, 0, 0.2), 4), since: clean6(raw.since, 40), days, paidDays };
    };
    normalizeReparations = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list5(value)) {
        const entry = normalizeReparation(raw);
        if (entry && entry.paidDays < entry.days) kept.set(entry.id, entry);
      }
      return [...kept.values()].slice(-REPARATIONS_KEPT_MOST);
    };
    TREATIES_KEPT_MOST = 12;
    TREATY_WAYS = Object.freeze(["offer", "proposal", "settled"]);
    normalizePeaceTreaties = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list5(value)) {
        const id = clean6(raw?.id, 120);
        const warId = clean6(raw?.warId);
        if (!id || !warId) continue;
        kept.set(id, {
          id,
          warId,
          title: clean6(raw.title),
          date: clean6(raw.date, 40),
          round: Math.max(0, Math.round(figure2(raw.round))),
          from: clean6(raw.from),
          to: clean6(raw.to),
          sides: [0, 1].map((side) => list5(raw.sides?.[side]).map((name) => clean6(name)).filter(Boolean).slice(0, 12)),
          terms: normalizeTerms(raw.terms),
          by: TREATY_WAYS.includes(raw.by) ? raw.by : "offer"
        });
      }
      return [...kept.values()].slice(-TREATIES_KEPT_MOST);
    };
  }
});

// src/runtime/warWeariness.js
var WEARINESS_MOST, WEARINESS_KEPT_MOST, clean7, fold5, list6, within3, figure3, normalizeWarWeariness, WEARINESS_WORDS;
var init_warWeariness = __esm({
  "src/runtime/warWeariness.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    WEARINESS_MOST = 100;
    WEARINESS_KEPT_MOST = 80;
    clean7 = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold5 = (value) => clean7(value).toLowerCase();
    list6 = (value) => Array.isArray(value) ? value : [];
    within3 = (value, least, most) => Math.min(most, Math.max(least, value));
    figure3 = (value) => {
      const read = Number(value);
      return Number.isFinite(read) ? read : 0;
    };
    normalizeWarWeariness = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list6(value)) {
        const country = clean7(raw?.country);
        const weary = Math.round(within3(figure3(raw?.value), 0, WEARINESS_MOST) * 10) / 10;
        if (!country || !(weary > 0)) continue;
        kept.set(fold5(country), { country, value: weary });
      }
      return [...kept.values()].slice(0, WEARINESS_KEPT_MOST);
    };
    WEARINESS_WORDS = Object.freeze([[80, "exhausted"], [60, "war-weary"], [40, "strained"], [20, "uneasy"]]);
  }
});

// src/runtime/fronts/military.js
var MILITARY_NEUTRAL, QUALITY_FACTORS, TECHNOLOGY_FACTORS, ARM_FACTORS;
var init_military = __esm({
  "src/runtime/fronts/military.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    MILITARY_NEUTRAL = Object.freeze({
      quality: 50,
      technology: 50,
      land: 50,
      sea: 50,
      air: 50,
      manpowerShare: null,
      cavalryShare: null,
      siegeShare: null,
      menPerCounter: null
    });
    QUALITY_FACTORS = Object.freeze([0.5, 1.5]);
    TECHNOLOGY_FACTORS = Object.freeze([0.7, 1.3]);
    ARM_FACTORS = Object.freeze([0.5, 1.5]);
  }
});

// src/runtime/militaryFunding.js
var init_militaryFunding = __esm({
  "src/runtime/militaryFunding.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_military();
  }
});

// src/runtime/warResources.js
var RESOURCES_FULL, RESOURCES_KEPT_MOST, clean8, fold6, list7, within4, normalizeWarResources;
var init_warResources = __esm({
  "src/runtime/warResources.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    init_militaryFunding();
    RESOURCES_FULL = 100;
    RESOURCES_KEPT_MOST = 120;
    clean8 = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold6 = (value) => clean8(value).toLowerCase();
    list7 = (value) => Array.isArray(value) ? value : [];
    within4 = (value, least, most) => Math.min(most, Math.max(least, value));
    normalizeWarResources = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list7(value)) {
        const country = clean8(raw?.country);
        const read = Number(raw?.value);
        if (!country || !Number.isFinite(read) || kept.has(fold6(country))) continue;
        const held = Math.round(within4(read, 0, RESOURCES_FULL) * 10) / 10;
        if (held < RESOURCES_FULL) kept.set(fold6(country), { country, value: held });
      }
      return [...kept.values()].slice(0, RESOURCES_KEPT_MOST);
    };
  }
});

// src/runtime/attrition.js
var ATTRITION_KEPT_MOST, clean9, fold7, list8, count, normalizeAttrition;
var init_attrition = __esm({
  "src/runtime/attrition.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_warWeariness();
    ATTRITION_KEPT_MOST = 120;
    clean9 = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold7 = (value) => clean9(value).toLowerCase();
    list8 = (value) => Array.isArray(value) ? value : [];
    count = (value) => {
      const read = Math.round(Number(value));
      return Number.isFinite(read) && read > 0 ? read : 0;
    };
    normalizeAttrition = (value) => {
      const kept = /* @__PURE__ */ new Map();
      for (const raw of list8(value)) {
        const country = clean9(raw?.country);
        if (!country || kept.has(fold7(country))) continue;
        const lastFormations = Math.round(Math.max(0, Number(raw?.lastFormations) || 0) * 10) / 10;
        kept.set(fold7(country), { country, lastMen: count(raw?.lastMen), lastFormations, warMen: count(raw?.warMen) });
      }
      return [...kept.values()].slice(0, ATTRITION_KEPT_MOST);
    };
  }
});

// src/runtime/unitMotion.js
var EARTH_RADIUS_KM, toRad, haversineKm, wrapLng;
var init_unitMotion = __esm({
  "src/runtime/unitMotion.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    EARTH_RADIUS_KM = 6371;
    toRad = (deg) => deg * Math.PI / 180;
    haversineKm = (lat1, lng1, lat2, lng2) => {
      const dLat = toRad((lat2 ?? 0) - (lat1 ?? 0));
      const dLng = toRad((lng2 ?? 0) - (lng1 ?? 0));
      const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1 ?? 0)) * Math.cos(toRad(lat2 ?? 0)) * Math.sin(dLng / 2) ** 2;
      return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
    };
    wrapLng = (lng) => {
      if (lng >= -180 && lng <= 180) return lng;
      return ((lng + 180) % 360 + 360) % 360 - 180;
    };
  }
});

// src/runtime/fronts/constants.js
var BATTLEFIELD_VERSION, MAX_BATTLEFIELDS, MAX_CLOSED_BATTLEFIELDS, BATTLEFIELD_NAME_MAX, MAX_SIDE_MEMBERS, MAX_TROOPS_PER_SIDE, MAX_NAMED_TROOPS, MAX_ORDERS_PER_SIDE, COMMAND_TROOPS, MAX_WAY_POINTS, MARK_MAX, MAX_CELLS, MAX_GRID_SPAN, CELL_STEPS_KM, MAX_CONTESTED_REGIONS, MAX_LOG_ENTRIES, LOG_TEXT_MAX, BATTLEFIELD_STATUSES, TROOP_KINDS, TROOP_STATES, FRONT_ORDERS, WAR_ROOM_ORDERS, WAR_ROOM_STANCES, FRONT_RESULTS, FRONT_EFFORTS, DEFAULT_EFFORT, STAND_OFF_KM, TROOP_ATTACK, TROOP_DEFENCE, TRAIT_DRIVE, TRAIT_DEPTH, TRAIT_LANE, TRAIT_LAG_DAYS, MEN_PER_FORMATION_BY_ERA, EFFORT_FACTORS, ARMOUR_SHARE_BY_ERA, ARTILLERY_SHARE_BY_ERA, STAFF_MARK, SCENARIO_MARK, LINE_MARKS, WAR_EFFORTS, DIG_PER_DAY_HOLD, DIG_MAX_HOLD, DIFFICULTY_EDGES, SHORTAGE_EDGE, COMPASS_16, TURNS, SUPPLY_FULL_KM, SHOULDER_STOPS, SHOULDER_OUT_KM, MAX_ORDER_ATTACKS, THRUST_TROOPS, SLIDE_BAND, DUG_IN_DEFENCE, DUG_IN_LOSS, WORKS, STRONG_WORKS, CLOSE_NEAR_KM, CLOSE_FAR_KM, CLOSE_LEAVES_KM, CLOSE_APART_COS, ASSAULT_RING_KM;
var init_constants = __esm({
  "src/runtime/fronts/constants.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    BATTLEFIELD_VERSION = 1;
    MAX_BATTLEFIELDS = 12;
    MAX_CLOSED_BATTLEFIELDS = 4;
    BATTLEFIELD_NAME_MAX = 80;
    MAX_SIDE_MEMBERS = 8;
    MAX_TROOPS_PER_SIDE = 400;
    MAX_NAMED_TROOPS = 64;
    MAX_ORDERS_PER_SIDE = 16;
    COMMAND_TROOPS = Object.freeze([12, 40, 110, 220]);
    MAX_WAY_POINTS = 12;
    MARK_MAX = 170;
    MAX_CELLS = 64e3;
    MAX_GRID_SPAN = 255;
    CELL_STEPS_KM = Object.freeze([4, 6, 8, 12, 16, 24, 32, 48, 64, 96]);
    MAX_CONTESTED_REGIONS = 160;
    MAX_LOG_ENTRIES = 12;
    LOG_TEXT_MAX = 160;
    BATTLEFIELD_STATUSES = Object.freeze(["active", "frozen", "closed", "standing"]);
    TROOP_KINDS = Object.freeze(["infantry", "armor", "artillery"]);
    TROOP_STATES = Object.freeze(["holding", "advancing", "encircled", "spent", "dug in"]);
    FRONT_ORDERS = Object.freeze(["advance", "blitz", "spearhead", "encircle", "hold", "dig in", "fall back", "withdraw", "land", "flank", "assault"]);
    WAR_ROOM_ORDERS = Object.freeze(["advance", "blitz", "spearhead", "flank", "encircle", "hold", "dig in", "fall back", "withdraw"]);
    WAR_ROOM_STANCES = Object.freeze(["accepts", "objects", "speaks"]);
    FRONT_RESULTS = Object.freeze(["breakthrough", "captured", "repulsed", "stalemate", "collapse", "surrender"]);
    FRONT_EFFORTS = Object.freeze(["token", "limited", "major", "total"]);
    DEFAULT_EFFORT = "major";
    STAND_OFF_KM = Object.freeze([8, 8, 16]);
    TROOP_ATTACK = Object.freeze([1, 1.6, 1.2]);
    TROOP_DEFENCE = Object.freeze([1.2, 1, 0.8]);
    TRAIT_DRIVE = Object.freeze([0.7, 1.35]);
    TRAIT_DEPTH = Object.freeze([0.4, 1.8]);
    TRAIT_LANE = Object.freeze([-0.45, 0.45]);
    TRAIT_LAG_DAYS = Object.freeze([0, 0, 1, 1, 2]);
    MEN_PER_FORMATION_BY_ERA = Object.freeze([2e3, 5e3, 12e3, 1e4]);
    EFFORT_FACTORS = Object.freeze({ token: 0.3, limited: 0.6, major: 1, total: 1.4 });
    ARMOUR_SHARE_BY_ERA = Object.freeze([0.15, 0.15, 0.1, 0.3]);
    ARTILLERY_SHARE_BY_ERA = Object.freeze([0.1, 0.1, 0.15, 0.15]);
    STAFF_MARK = "staff";
    SCENARIO_MARK = "scenario";
    LINE_MARKS = Object.freeze([STAFF_MARK, SCENARIO_MARK]);
    WAR_EFFORTS = Object.freeze(["major", "total"]);
    DIG_PER_DAY_HOLD = 0.04;
    DIG_MAX_HOLD = 0.5;
    DIFFICULTY_EDGES = Object.freeze({
      "very-easy": Object.freeze({ power: 0.85, pace: 0.9, reserves: 0.7, mend: 0.75 }),
      easy: Object.freeze({ power: 0.93, pace: 0.95, reserves: 0.85, mend: 0.9 }),
      medium: Object.freeze({ power: 1, pace: 1, reserves: 1, mend: 1 }),
      hard: Object.freeze({ power: 1.15, pace: 1.1, reserves: 1.3, mend: 1.25 }),
      "very-hard": Object.freeze({ power: 1.35, pace: 1.2, reserves: 1.75, mend: 1.6 }),
      impossible: Object.freeze({ power: 1.75, pace: 1.4, reserves: 3, mend: 2.5 })
    });
    SHORTAGE_EDGE = Object.freeze({ power: 0.15, pace: 0.15, reserves: 0.5, mend: 0.5 });
    COMPASS_16 = Object.freeze([
      1,
      0,
      0.9238795325112867,
      0.3826834323650898,
      0.7071067811865476,
      0.7071067811865476,
      0.3826834323650898,
      0.9238795325112867,
      0,
      1,
      -0.3826834323650898,
      0.9238795325112867,
      -0.7071067811865476,
      0.7071067811865476,
      -0.9238795325112867,
      0.3826834323650898,
      -1,
      0,
      -0.9238795325112867,
      -0.3826834323650898,
      -0.7071067811865476,
      -0.7071067811865476,
      -0.3826834323650898,
      -0.9238795325112867,
      0,
      -1,
      0.3826834323650898,
      -0.9238795325112867,
      0.7071067811865476,
      -0.7071067811865476,
      0.9238795325112867,
      -0.3826834323650898
    ]);
    TURNS = Object.freeze([
      0.8660254037844387,
      0.5,
      0.8660254037844387,
      -0.5,
      0.5,
      0.8660254037844387,
      0.5,
      -0.8660254037844387
    ]);
    SUPPLY_FULL_KM = Object.freeze([120, 180, 300, 450]);
    SHOULDER_STOPS = Object.freeze([0.25, 0.9]);
    SHOULDER_OUT_KM = Object.freeze([8, 30]);
    MAX_ORDER_ATTACKS = 4;
    THRUST_TROOPS = Object.freeze({ spearhead: 44, encircle: 32, flank: 16, advance: 36, blitz: 36 });
    SLIDE_BAND = Object.freeze([0.8, 3.5]);
    DUG_IN_DEFENCE = 1.6;
    DUG_IN_LOSS = 0.55;
    WORKS = Object.freeze({ defence: DUG_IN_DEFENCE, loss: DUG_IN_LOSS, perDay: DIG_PER_DAY_HOLD, most: DIG_MAX_HOLD, assault: 1 });
    STRONG_WORKS = Object.freeze({ defence: 2.5, loss: 0.35, perDay: 0.06, most: 0.7, assault: 2.5 });
    CLOSE_NEAR_KM = Object.freeze([60, 35]);
    CLOSE_FAR_KM = Object.freeze([150, 80]);
    CLOSE_LEAVES_KM = Object.freeze([160, 90]);
    CLOSE_APART_COS = Object.freeze([0.309, 0.5878, 0.729, 0.809, 0.8584, 0.891, 0.9135, 0.9298, 0.9418, 0.9511, 0.9582, 0.964, 0.9686, 0.9724]);
    ASSAULT_RING_KM = Object.freeze([3, 11]);
  }
});

// src/runtime/fronts/codec.js
var ALPHABET, VALUE_OF, PACKED_TEXT, RUN_BITS, RUN_MAX, TROOP_LETTERS, LINE_MAX, TRACK_DAY_MAX, STATE_BITS, STATE_RUN_BITS, STATE_RUN_MAX, PAINT_WALL, PAINT_OWN_B, PAINT_NAMES_MAX, PAINT_RUN_BITS, PAINT_RUN_MAX;
var init_codec = __esm({
  "src/runtime/fronts/codec.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_unitMotion();
    init_constants();
    ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    VALUE_OF = new Int8Array(128).fill(-1);
    for (let index = 0; index < ALPHABET.length; index += 1) VALUE_OF[ALPHABET.charCodeAt(index)] = index;
    PACKED_TEXT = /^[A-Za-z0-9_;-]*$/;
    RUN_BITS = 10;
    RUN_MAX = 1 << RUN_BITS;
    TROOP_LETTERS = 7;
    LINE_MAX = (1 << 13) - 1;
    TRACK_DAY_MAX = 4095;
    STATE_BITS = 5;
    STATE_RUN_BITS = 13;
    STATE_RUN_MAX = 1 << STATE_RUN_BITS;
    PAINT_WALL = (1 << STATE_BITS) - 1;
    PAINT_OWN_B = PAINT_WALL - 1;
    PAINT_NAMES_MAX = PAINT_OWN_B - 1;
    PAINT_RUN_BITS = 6;
    PAINT_RUN_MAX = 1 << PAINT_RUN_BITS;
  }
});

// src/runtime/fronts/frame.js
var KM_PER_DEGREE, RAD, MERCATOR_MAX_LAT, homeLng0, normalizeFrame;
var init_frame = __esm({
  "src/runtime/fronts/frame.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_constants();
    KM_PER_DEGREE = 111.32;
    RAD = Math.PI / 180;
    MERCATOR_MAX_LAT = 85.0511287798066;
    homeLng0 = (lng0, width) => {
      const middle = lng0 + width / 2;
      const turn = Math.floor((middle + 180) / 360);
      return turn === 0 ? lng0 : lng0 - turn * 360;
    };
    normalizeFrame = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const lng0 = Number(value.lng0);
      const lat0 = Number(value.lat0);
      const cell = Number(value.cell);
      const cols = Number(value.cols);
      const rows = Number(value.rows);
      const km = Number(value.km);
      if (![lng0, lat0, cell, km].every(Number.isFinite) || !(cell > 0) || !(km > 0)) return null;
      if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 2 || rows < 2) return null;
      if (cols > MAX_GRID_SPAN || rows > MAX_GRID_SPAN || cols * rows > MAX_CELLS) return null;
      if (lat0 < -MERCATOR_MAX_LAT || lat0 > MERCATOR_MAX_LAT || lng0 < -540 || lng0 > 540) return null;
      const frame = { lng0: homeLng0(lng0, cols * cell), lat0, cell, cols, rows, km };
      if (value.flat === true) {
        const scale = Number(value.scale);
        frame.flat = true;
        frame.scale = scale > 0 && Number.isFinite(scale) ? scale : KM_PER_DEGREE;
      }
      return frame;
    };
  }
});

// src/runtime/regionTypes.js
var REGION_TYPE_DEFAULTS, EMPTY_STATE;
var init_regionTypes = __esm({
  "src/runtime/regionTypes.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    REGION_TYPE_DEFAULTS = Object.freeze({
      opacity: 0.55,
      unownedOpacity: 0.25,
      zIndex: 1,
      strokeWidth: 1.5,
      strokeColor: Object.freeze([0, 0, 0]),
      strokeOpacity: 1,
      overrideColor: null,
      pathfindingSpeed: 1,
      interactable: true,
      showToDefaultPrompt: true,
      passable: true,
      includedInLabels: true,
      zoomSettings: Object.freeze([Object.freeze({ minZoom: 0, maxZoom: 24 })])
    });
    EMPTY_STATE = Object.freeze({ typeFill: null, typeOpacity: null, typeStroke: null, typeStrokeScale: null });
  }
});

// src/runtime/fronts/arena.js
var init_arena = __esm({
  "src/runtime/fronts/arena.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_codec();
    init_constants();
    init_frame();
    init_regionTypes();
  }
});

// src/runtime/fronts/field.js
var LEAST;
var init_field = __esm({
  "src/runtime/fronts/field.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_codec();
    init_constants();
    init_arena();
    init_frame();
    LEAST = 1 / 1024;
  }
});

// src/runtime/fronts/ground.js
var FAR_THIRDS;
var init_ground = __esm({
  "src/runtime/fronts/ground.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_constants();
    init_field();
    FAR_THIRDS = 1 << 28;
  }
});

// src/runtime/fronts/weather.js
var WEATHER_STATES, SEASONS, CLIMATES, effect, WEATHER, odds, WEATHER_ODDS;
var init_weather = __esm({
  "src/runtime/fronts/weather.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    init_unitMotion();
    init_climate();
    init_ground();
    init_constants();
    WEATHER_STATES = Object.freeze(["clear", "rain", "storm", "mud", "snow", "blizzard", "frost", "heat", "fog"]);
    SEASONS = Object.freeze(["winter", "spring", "summer", "autumn"]);
    CLIMATES = Object.freeze(["polar", "continental", "arid", "tropical"]);
    effect = (pace, attack, wear, rest, air, cold, heat) => Object.freeze({ pace, attack, wear, rest, air, cold, heat });
    WEATHER = Object.freeze({
      clear: effect(1, 1, 0, 1, 1, 0, 0),
      rain: effect(0.8, 0.95, 0.01, 0.9, 0.6, 0, 0),
      storm: effect(0.6, 0.85, 0.02, 0.8, 0, 0.1, 0),
      mud: effect(0.45, 0.85, 0.025, 0.85, 0.7, 0, 0),
      snow: effect(0.65, 0.9, 0.015, 0.85, 0.5, 0.3, 0),
      blizzard: effect(0.3, 0.7, 0.03, 0.6, 0, 1, 0),
      frost: effect(0.9, 0.95, 0.01, 0.8, 0.9, 0.6, 0),
      heat: effect(0.85, 0.9, 0.02, 0.8, 1, 0, 0.5),
      fog: effect(0.9, 0.8, 0, 1, 0, 0, 0)
    });
    odds = (fields) => Object.freeze({ clear: 0, rain: 0, storm: 0, mud: 0, snow: 0, blizzard: 0, frost: 0, heat: 0, fog: 0, ...fields });
    WEATHER_ODDS = Object.freeze({
      polar: Object.freeze({
        winter: odds({ clear: 0.45, frost: 0.25, snow: 0.2, blizzard: 0.1 }),
        spring: odds({ clear: 0.55, frost: 0.15, snow: 0.15, fog: 0.15 }),
        summer: odds({ clear: 0.65, fog: 0.2, rain: 0.15 }),
        autumn: odds({ clear: 0.5, snow: 0.2, frost: 0.15, rain: 0.15 })
      }),
      continental: Object.freeze({
        winter: odds({ clear: 0.5, snow: 0.2, frost: 0.15, blizzard: 0.05, fog: 0.1 }),
        spring: odds({ clear: 0.55, rain: 0.2, mud: 0.2, fog: 0.05 }),
        summer: odds({ clear: 0.7, rain: 0.15, storm: 0.08, heat: 0.07 }),
        autumn: odds({ clear: 0.55, rain: 0.2, mud: 0.15, fog: 0.1 })
      }),
      arid: Object.freeze({
        winter: odds({ clear: 0.8, rain: 0.12, fog: 0.08 }),
        spring: odds({ clear: 0.75, heat: 0.18, storm: 0.07 }),
        summer: odds({ clear: 0.6, heat: 0.4 }),
        autumn: odds({ clear: 0.82, heat: 0.13, rain: 0.05 })
      }),
      tropical: Object.freeze({
        winter: odds({ clear: 0.7, heat: 0.22, fog: 0.08 }),
        spring: odds({ clear: 0.6, heat: 0.2, rain: 0.2 }),
        summer: odds({ clear: 0.4, rain: 0.35, storm: 0.15, mud: 0.1 }),
        autumn: odds({ clear: 0.45, rain: 0.3, storm: 0.15, mud: 0.1 })
      })
    });
  }
});

// src/runtime/fronts/climate.js
var NEUTRAL_EFFECTS, WEATHER_NEIGHBOURS;
var init_climate = __esm({
  "src/runtime/fronts/climate.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    init_arena();
    init_weather();
    NEUTRAL_EFFECTS = Object.freeze({ pace: 1, attack: 1, wear: 0, cold: 0, heat: 0, air: 1, freezes: 0 });
    WEATHER_NEIGHBOURS = Object.freeze({
      clear: Object.freeze(["clear", "frost", "fog", "heat", "rain", "snow", "mud"]),
      frost: Object.freeze(["frost", "clear", "snow", "fog", "blizzard"]),
      snow: Object.freeze(["snow", "frost", "blizzard", "clear", "rain", "fog"]),
      blizzard: Object.freeze(["blizzard", "snow", "frost"]),
      fog: Object.freeze(["fog", "clear", "frost", "rain", "mud", "snow"]),
      rain: Object.freeze(["rain", "storm", "fog", "mud", "clear", "snow"]),
      storm: Object.freeze(["storm", "rain", "mud"]),
      mud: Object.freeze(["mud", "rain", "storm", "fog", "clear"]),
      heat: Object.freeze(["heat", "clear"])
    });
  }
});

// src/runtime/warGeography.js
var TERRAIN_LEVEL_MOST, WALL_LEVEL_LEAST, WALL_LEVEL_MOST, CLIMATE_ZONES_MOST, TERRAIN_AREAS_MOST, FORTIFICATIONS_MOST, POINTS_MOST, NAME_MOST, isRecord2, clean10, round2, numberIn2, pointOf, lineOf, ringsOf, idOf, normalizeTerrainAreas, stretchesOf, normalizeFortifications, monthDayOf, colorOf, EFFECT_RANGES, effectsOf, weatherMixOf, normalizeClimateZones, normalizeZoneWeather, normalizeFreezingRegions;
var init_warGeography = __esm({
  "src/runtime/warGeography.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_climate();
    init_weather();
    TERRAIN_LEVEL_MOST = 10;
    WALL_LEVEL_LEAST = 3;
    WALL_LEVEL_MOST = 10;
    CLIMATE_ZONES_MOST = 48;
    TERRAIN_AREAS_MOST = 200;
    FORTIFICATIONS_MOST = 200;
    POINTS_MOST = 2e3;
    NAME_MOST = 80;
    isRecord2 = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
    clean10 = (value, most = NAME_MOST) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most);
    round2 = (value, places = 1e5) => Math.round(value * places) / places;
    numberIn2 = (value, least, most, otherwise = null) => {
      if (value === null || value === void 0 || value === "") return otherwise;
      const number = Number(value);
      return Number.isFinite(number) ? number < least ? least : number > most ? most : number : otherwise;
    };
    pointOf = (value) => {
      if (!Array.isArray(value) || value.length < 2) return null;
      const lng = Number(value[0]);
      const lat = Number(value[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || lat < -90 || lat > 90) return null;
      return [round2(lng), round2(lat)];
    };
    lineOf = (value, least) => {
      const points = (Array.isArray(value) ? value : []).map(pointOf).filter(Boolean).slice(0, POINTS_MOST);
      return points.length >= least ? points : null;
    };
    ringsOf = (value) => {
      const rings = (Array.isArray(value) ? value : []).map((ring) => lineOf(ring, 3)).filter(Boolean).slice(0, 32);
      return rings.length > 0 ? rings : null;
    };
    idOf = (value, fallback) => clean10(value, 64) || fallback;
    normalizeTerrainAreas = (value) => (Array.isArray(value) ? value : []).map((area, at) => {
      if (!isRecord2(area)) return null;
      const rings = ringsOf(area.rings);
      if (!rings) return null;
      return { id: idOf(area.id, `terrain-${at + 1}`), name: clean10(area.name), level: Math.round(numberIn2(area.level, 0, TERRAIN_LEVEL_MOST, 5)), rings };
    }).filter(Boolean).slice(0, TERRAIN_AREAS_MOST);
    stretchesOf = (value) => {
      const stretches = (Array.isArray(value) ? value : []).map((entry) => Array.isArray(entry) ? [Number(entry[0]), Number(entry[1])] : null).filter((entry) => entry && Number.isFinite(entry[0]) && Number.isFinite(entry[1]) && entry[1] > entry[0] && entry[0] >= 0).sort((a, b2) => a[0] - b2[0]);
      const merged = [];
      for (const [from, to] of stretches) {
        const last = merged.at(-1);
        if (last && from <= last[1]) last[1] = Math.max(last[1], to);
        else merged.push([from, to]);
      }
      return merged.slice(0, 200).map(([from, to]) => [round2(from, 100), round2(to, 100)]);
    };
    normalizeFortifications = (value) => (Array.isArray(value) ? value : []).map((wall, at) => {
      if (!isRecord2(wall)) return null;
      const points = lineOf(wall.points, 2);
      if (!points) return null;
      const since = clean10(wall.building?.since, 40);
      const days = numberIn2(wall.building?.days, 0, 36500, null);
      const wear = (Array.isArray(wall.wear) ? wall.wear : []).map((entry) => Array.isArray(entry) ? [Math.floor(Number(entry[0])), numberIn2(entry[1], 0, 1, null)] : null).filter((entry) => entry && entry[0] >= 0 && entry[1] !== null && entry[1] > 0).slice(0, 2e3).map(([piece, worn]) => [piece, round2(worn, 1e3)]);
      return {
        id: idOf(wall.id, `wall-${at + 1}`),
        name: clean10(wall.name),
        owner: clean10(wall.owner),
        level: Math.round(numberIn2(wall.level, WALL_LEVEL_LEAST, WALL_LEVEL_MOST, 5)),
        points,
        breaches: stretchesOf(wall.breaches),
        wear,
        ...since && days !== null ? { building: { since, days: Math.round(days) } } : {}
      };
    }).filter(Boolean).slice(0, FORTIFICATIONS_MOST);
    monthDayOf = (value) => {
      const match = /^(\d{1,2})-(\d{1,2})$/.exec(String(value ?? "").trim());
      if (!match) return null;
      const month = Number(match[1]);
      const day = Number(match[2]);
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };
    colorOf = (value) => /^#[0-9a-f]{6}$/i.test(String(value ?? "").trim()) ? String(value).trim().toLowerCase() : "";
    EFFECT_RANGES = Object.freeze({ pace: [0, 2], attack: [0, 2], wear: [0, 0.2], cold: [0, 2], heat: [0, 2], air: [0, 1] });
    effectsOf = (value) => {
      const out = {};
      for (const [key, [least, most]] of Object.entries(EFFECT_RANGES)) {
        const number = numberIn2(value?.[key], least, most, null);
        if (number !== null) out[key] = round2(number, 1e3);
      }
      if (value?.freezes === true) out.freezes = true;
      return out;
    };
    weatherMixOf = (value) => {
      const out = {};
      for (const state of WEATHER_STATES) {
        const weight = numberIn2(value?.[state], 0, 100, null);
        if (weight !== null && weight > 0) out[state] = round2(weight, 1e3);
      }
      return out;
    };
    normalizeClimateZones = (value) => (Array.isArray(value) ? value : []).map((zone, at) => {
      if (!isRecord2(zone)) return null;
      const rings = ringsOf(zone.rings);
      if (!rings) return null;
      const seasons = (Array.isArray(zone.seasons) ? zone.seasons : []).map((season) => {
        const start = monthDayOf(season?.start);
        const end = monthDayOf(season?.end);
        if (!isRecord2(season) || !start || !end) return null;
        return { name: clean10(season.name, 40) || "season", start, end, ...colorOf(season.color) ? { color: colorOf(season.color) } : {}, weather: weatherMixOf(season.weather), effects: effectsOf(season.effects) };
      }).filter(Boolean).slice(0, 12);
      const events = (Array.isArray(zone.events) ? zone.events : []).map((event) => {
        const from = clean10(event?.from, 40);
        const to = clean10(event?.to, 40);
        if (!isRecord2(event) || !from || !to) return null;
        const weather = WEATHER_STATES.includes(event.weather) ? event.weather : "";
        return { name: clean10(event.name) || "event", from, to, ...weather ? { weather } : {}, effects: effectsOf(event.effects) };
      }).filter(Boolean).slice(0, 40);
      return {
        id: idOf(zone.id, `zone-${at + 1}`),
        name: clean10(zone.name),
        color: colorOf(zone.color) || "#7f8c99",
        rings,
        blendKm: Math.round(numberIn2(zone.blendKm, 0, 2e3, 100)),
        transitionDays: Math.round(numberIn2(zone.transitionDays, 0, 120, 14)),
        seasons,
        events
      };
    }).filter(Boolean).slice(0, CLIMATE_ZONES_MOST);
    normalizeZoneWeather = (value) => {
      if (!isRecord2(value) || !clean10(value.date, 40) || !Array.isArray(value.zones)) return null;
      const zones = value.zones.map((entry) => isRecord2(entry) && clean10(entry.id, 64) && WEATHER_STATES.includes(entry.state) ? { id: clean10(entry.id, 64), state: entry.state, season: clean10(entry.season, 80) } : null).filter(Boolean).slice(0, CLIMATE_ZONES_MOST);
      return zones.length > 0 ? { date: clean10(value.date, 40), zones } : null;
    };
    normalizeFreezingRegions = (value) => [...new Set((Array.isArray(value) ? value : []).map((id) => clean10(id, 120)).filter(Boolean))].slice(0, 5e3);
  }
});

// src/runtime/groups.js
var GROUP_NAME_MAX, GROUP_DESCRIPTION_MAX, MAX_GROUPS, MAX_GROUP_OP_REGIONS, GROUP_PALETTE, clean11, isRecord3, fold8, normalizeGroupColor, defaultGroupColor, normalizeGroupName, normalizeGroupDescription, findGroupKey, normalizeGroup, normalizeGroups, normalizeGroupAreas, OP_ALIASES, normalizeGroupOp;
var init_groups = __esm({
  "src/runtime/groups.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_militaryStats();
    init_populationFigure();
    GROUP_NAME_MAX = 80;
    GROUP_DESCRIPTION_MAX = 1200;
    MAX_GROUPS = 64;
    MAX_GROUP_OP_REGIONS = 200;
    GROUP_PALETTE = ["#e11d48", "#f97316", "#eab308", "#65a30d", "#10b981", "#06b6d4", "#3b82f6", "#ec4899", "#dc2626", "#0ea5e9"];
    clean11 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    isRecord3 = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
    fold8 = (value) => clean11(value).toLocaleLowerCase();
    normalizeGroupColor = (value) => {
      const text3 = clean11(value).toLowerCase();
      if (/^#[0-9a-f]{6}$/.test(text3)) return text3;
      if (/^#[0-9a-f]{3}$/.test(text3)) return `#${[...text3.slice(1)].map((digit) => digit + digit).join("")}`;
      return "";
    };
    defaultGroupColor = (name) => {
      let hash2 = 0;
      for (const char of fold8(name)) hash2 = hash2 * 31 + char.codePointAt(0) >>> 0;
      return GROUP_PALETTE[hash2 % GROUP_PALETTE.length];
    };
    normalizeGroupName = (value) => clean11(value).slice(0, GROUP_NAME_MAX).trim();
    normalizeGroupDescription = (value) => String(value ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, GROUP_DESCRIPTION_MAX).trim();
    findGroupKey = (groups, name) => {
      const registry = isRecord3(groups) ? groups : {};
      const wanted = fold8(name);
      if (!wanted) return "";
      if (isRecord3(registry[clean11(name)])) return clean11(name);
      const keys = Object.keys(registry);
      return keys.find((key) => fold8(key) === wanted) ?? keys.find((key) => (registry[key]?.formerNames ?? []).some((former) => fold8(former) === wanted)) ?? "";
    };
    normalizeGroup = (key, value) => {
      const name = normalizeGroupName(key || value?.name);
      if (!name) return null;
      const record = isRecord3(value) ? value : {};
      const formerNames = [...new Set((Array.isArray(record.formerNames) ? record.formerNames : []).map(normalizeGroupName).filter((former) => former && fold8(former) !== fold8(name)))].slice(0, 12);
      return {
        name,
        description: normalizeGroupDescription(record.description ?? record.note),
        color: normalizeGroupColor(record.color) || defaultGroupColor(name),
        // Its people when the scenario begins, where its author says (populationFigure.js).
        ...populationFigureOf(record) > 0 ? { population: populationFigureOf(record) } : {},
        // Its own military figures, where its author gives them (militaryStats.js).
        ...normalizeMilitaryStats(record.military) ? { military: normalizeMilitaryStats(record.military) } : {},
        ...formerNames.length ? { formerNames } : {}
      };
    };
    normalizeGroups = (raw) => {
      const out = {};
      for (const [key, value] of Object.entries(isRecord3(raw) ? raw : {})) {
        const group = normalizeGroup(key, value);
        if (!group || Object.keys(out).some((existing) => fold8(existing) === fold8(group.name))) continue;
        out[group.name] = group;
        if (Object.keys(out).length >= MAX_GROUPS) break;
      }
      return out;
    };
    normalizeGroupAreas = (raw, groups) => {
      const out = {};
      for (const [regionId, name] of Object.entries(isRecord3(raw) ? raw : {})) {
        const id = clean11(regionId);
        const key = findGroupKey(groups, name);
        if (id && key) out[id] = key;
      }
      return out;
    };
    OP_ALIASES = {
      create: "create",
      add: "create",
      new: "create",
      found: "create",
      form: "create",
      update: "update",
      modify: "update",
      edit: "update",
      rename: "update",
      describe: "update",
      recolor: "update",
      recolour: "update",
      dissolve: "dissolve",
      erase: "dissolve",
      delete: "dissolve",
      remove: "dissolve",
      disband: "dissolve",
      destroy: "dissolve",
      take: "take",
      control: "take",
      seize: "take",
      expand: "take",
      spread: "take",
      occupy: "take",
      claim: "take",
      release: "release",
      lose: "release",
      withdraw: "release",
      retreat: "release",
      abandon: "release",
      shrink: "release"
    };
    normalizeGroupOp = (entry) => {
      if (!isRecord3(entry)) return null;
      const op = OP_ALIASES[fold8(entry.op ?? entry.operation)] ?? "";
      const name = normalizeGroupName(entry.name ?? entry.group ?? entry.groupName);
      if (!op || !name) return null;
      const list12 = Array.isArray(entry.regionIds) ? entry.regionIds : Array.isArray(entry.regions) ? entry.regions : entry.regionId ? [entry.regionId] : [];
      const regionIds = [...new Set(list12.map(clean11).filter(Boolean))].slice(0, MAX_GROUP_OP_REGIONS);
      const newName = normalizeGroupName(entry.newName);
      const description = normalizeGroupDescription(entry.description);
      const color = normalizeGroupColor(entry.color);
      return {
        op,
        name,
        ...newName && fold8(newName) !== fold8(name) ? { newName } : {},
        ...description ? { description } : {},
        ...color ? { color } : {},
        regionIds,
        note: clean11(entry.note).slice(0, 300),
        // An area the front engine moved with the line (see normalizeRegionControlOp).
        ...entry.by === "front" ? { by: "front" } : {}
      };
    };
  }
});

// src/Game/AI/fallbackRunner.js
var HOUR_MS, pacificFormat, pacificWallClockMs, nextPacificMidnight, SHORT_SKIP_MS, BUSY_SKIP_MS;
var init_fallbackRunner = __esm({
  "src/Game/AI/fallbackRunner.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    HOUR_MS = 60 * 60 * 1e3;
    pacificFormat = null;
    pacificWallClockMs = (at) => {
      pacificFormat ??= new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const part = Object.fromEntries(pacificFormat.formatToParts(new Date(at)).map(({ type, value }) => [type, Number(value)]));
      return Date.UTC(part.year, part.month - 1, part.day, part.hour % 24, part.minute, part.second);
    };
    nextPacificMidnight = (at) => {
      try {
        const offsetAt = (instant) => pacificWallClockMs(instant) - Math.floor(instant / 1e3) * 1e3;
        const wall = new Date(pacificWallClockMs(at));
        const midnightWall = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + 1);
        const guess = midnightWall - offsetAt(at);
        return midnightWall - offsetAt(guess);
      } catch {
        const day = 24 * HOUR_MS;
        return Math.floor((at - 8 * HOUR_MS) / day) * day + day + 8 * HOUR_MS;
      }
    };
    SHORT_SKIP_MS = 60 * 1e3;
    BUSY_SKIP_MS = 60 * 1e3;
  }
});

// src/Game/AI/requestBudget.js
var DEFAULT_DAILY_REQUEST_LIMIT, DEFAULT_BACKGROUND_DAILY_CAP, SKIP_SPENDERS, REQUEST_BUDGET_KEYS, createMemoryStorage, fallbackMemory, resolveStorage, liveStorage, defaultStorage, readItem, writeItem, wholeNumber, createRequestSettings, emptyDay, TASK_ROWS_KEPT, normalizeDay, BACKGROUND_REQUEST, PLAYER_REQUEST, createRequestLedger, announce, requestSettings, requestLedger;
var init_requestBudget = __esm({
  "src/Game/AI/requestBudget.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_fallbackRunner();
    DEFAULT_DAILY_REQUEST_LIMIT = 500;
    DEFAULT_BACKGROUND_DAILY_CAP = 30;
    SKIP_SPENDERS = Object.freeze(["jump", "review", "history", "stats", "institutionBallots"]);
    REQUEST_BUDGET_KEYS = Object.freeze({
      // ON unless the player turned it off ("0"): an absent key saves requests.
      saveRequests: "ai_save_requests",
      // ON unless the player turned it off ("0"), within its daily cap.
      backgroundAi: "ai_background_activity",
      dailyLimit: "ai_daily_request_limit",
      backgroundDailyCap: "ai_background_daily_cap",
      ledger: "ai_request_ledger"
    });
    createMemoryStorage = (initial = {}) => {
      const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
      return {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => {
          values.set(key, String(value));
        },
        removeItem: (key) => {
          values.delete(key);
        }
      };
    };
    fallbackMemory = createMemoryStorage();
    resolveStorage = () => {
      try {
        if (typeof localStorage !== "undefined" && localStorage) return localStorage;
      } catch {
      }
      return fallbackMemory;
    };
    liveStorage = {
      getItem: (key) => resolveStorage().getItem(key),
      setItem: (key, value) => resolveStorage().setItem(key, value),
      removeItem: (key) => resolveStorage().removeItem?.(key)
    };
    defaultStorage = () => liveStorage;
    readItem = (storage, key) => {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    };
    writeItem = (storage, key, value) => {
      try {
        storage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    };
    wholeNumber = (value, { min, max: max2, fallback }) => {
      const number = Math.round(Number(value));
      if (value === null || value === void 0 || value === "" || !Number.isFinite(number)) return fallback;
      return Math.min(max2, Math.max(min, number));
    };
    createRequestSettings = ({ storage = defaultStorage() } = {}) => ({
      saveRequests: () => readItem(storage, REQUEST_BUDGET_KEYS.saveRequests) !== "0",
      backgroundAi: () => readItem(storage, REQUEST_BUDGET_KEYS.backgroundAi) !== "0",
      dailyLimit: () => wholeNumber(readItem(storage, REQUEST_BUDGET_KEYS.dailyLimit), {
        min: 1,
        max: 1e6,
        fallback: DEFAULT_DAILY_REQUEST_LIMIT
      }),
      backgroundDailyCap: () => wholeNumber(readItem(storage, REQUEST_BUDGET_KEYS.backgroundDailyCap), {
        min: 0,
        max: 1e6,
        fallback: DEFAULT_BACKGROUND_DAILY_CAP
      }),
      setSaveRequests: (on) => writeItem(storage, REQUEST_BUDGET_KEYS.saveRequests, on ? "1" : "0"),
      setBackgroundAi: (on) => writeItem(storage, REQUEST_BUDGET_KEYS.backgroundAi, on ? "1" : "0"),
      setDailyLimit: (value) => writeItem(
        storage,
        REQUEST_BUDGET_KEYS.dailyLimit,
        String(wholeNumber(value, { min: 1, max: 1e6, fallback: DEFAULT_DAILY_REQUEST_LIMIT }))
      ),
      setBackgroundDailyCap: (value) => writeItem(
        storage,
        REQUEST_BUDGET_KEYS.backgroundDailyCap,
        String(wholeNumber(value, { min: 0, max: 1e6, fallback: DEFAULT_BACKGROUND_DAILY_CAP }))
      )
    });
    emptyDay = (at) => ({
      version: 1,
      startedAt: at,
      resetAt: nextPacificMidnight(at),
      used: 0,
      background: 0,
      refused: 0,
      failed: 0,
      byTask: {},
      lastJump: null
    });
    TASK_ROWS_KEPT = 40;
    normalizeDay = (value, at) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return emptyDay(at);
      const resetAt = Number(value.resetAt);
      if (!Number.isFinite(resetAt) || resetAt <= at || resetAt - at > 26 * 60 * 60 * 1e3) return emptyDay(at);
      const count4 = (field) => wholeNumber(value[field], { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 });
      const byTask = {};
      if (value.byTask && typeof value.byTask === "object" && !Array.isArray(value.byTask)) {
        for (const [task, total] of Object.entries(value.byTask).slice(0, TASK_ROWS_KEPT)) {
          const requests = wholeNumber(total, { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 });
          if (task && requests > 0) byTask[task] = requests;
        }
      }
      const lastJump = value.lastJump && typeof value.lastJump === "object" && !Array.isArray(value.lastJump) ? {
        used: wholeNumber(value.lastJump.used, { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
        refused: wholeNumber(value.lastJump.refused, { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
        at: Number.isFinite(Number(value.lastJump.at)) ? Number(value.lastJump.at) : at
      } : null;
      return {
        version: 1,
        startedAt: Number.isFinite(Number(value.startedAt)) ? Number(value.startedAt) : at,
        resetAt,
        used: count4("used"),
        background: count4("background"),
        refused: count4("refused"),
        failed: count4("failed"),
        byTask,
        lastJump
      };
    };
    BACKGROUND_REQUEST = "background";
    PLAYER_REQUEST = "player";
    createRequestLedger = ({ storage = defaultStorage(), now = Date.now, onChange = null } = {}) => {
      const read = () => {
        const at = now();
        let stored = null;
        try {
          stored = JSON.parse(readItem(storage, REQUEST_BUDGET_KEYS.ledger) ?? "null");
        } catch {
          stored = null;
        }
        return normalizeDay(stored, at);
      };
      const write = (day) => {
        writeItem(storage, REQUEST_BUDGET_KEYS.ledger, JSON.stringify(day));
        try {
          onChange?.(day);
        } catch {
        }
        return day;
      };
      return {
        today: read,
        // One provider response. `status` is the HTTP status; `kind` says whether
        // the player asked for this (a skip, a chat message, a panel they opened)
        // or the game did it by itself in the background.
        note: ({ status, kind = PLAYER_REQUEST, taskKey = "" } = {}) => {
          const day = read();
          const code = Number(status);
          if (code >= 200 && code < 300) {
            day.used += 1;
            if (kind === BACKGROUND_REQUEST) day.background += 1;
            const task = String(taskKey || "other").slice(0, 60);
            if (task in day.byTask || Object.keys(day.byTask).length < TASK_ROWS_KEPT) {
              day.byTask[task] = (day.byTask[task] || 0) + 1;
            }
          } else if (code === 429) {
            day.refused += 1;
          } else {
            day.failed += 1;
          }
          return write(day);
        },
        // What the time skip that just finished cost, for the time panel.
        noteJump: ({ used = 0, refused = 0 } = {}) => {
          const day = read();
          day.lastJump = {
            used: wholeNumber(used, { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
            refused: wholeNumber(refused, { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
            at: now()
          };
          return write(day);
        },
        reset: () => write(emptyDay(now()))
      };
    };
    announce = () => {
      try {
        window.dispatchEvent(new CustomEvent("ai:request-budget"));
      } catch {
      }
    };
    requestSettings = createRequestSettings();
    requestLedger = createRequestLedger({ onChange: announce });
  }
});

// src/runtime/i18n.js
var SHIPPED_PACK_LANGUAGES;
var init_i18n = __esm({
  "src/runtime/i18n.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    SHIPPED_PACK_LANGUAGES = Object.freeze([
      "ar",
      "bn",
      "de",
      "es",
      "fa",
      "fr",
      "hi",
      "id",
      "it",
      "ja",
      "ko",
      "nl",
      "pl",
      "pt",
      "ru",
      "sv",
      "th",
      "tr",
      "uk",
      "ur",
      "vi",
      "zh"
    ]);
  }
});

// src/runtime/localDates.js
var MONTHS, MONTHS_SHORT, LONG, SHORT, SHAPES;
var init_localDates = __esm({
  "src/runtime/localDates.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    LONG = MONTHS.join("|");
    SHORT = MONTHS_SHORT.join("|");
    SHAPES = [
      // 1 January 2016 · 1 March 218 BC
      { re: new RegExp(`^(\\d{1,2}) (${LONG}) (\\d{1,6})( BC)?$`), day: 1, month: 2, year: 3, bc: 4, style: "long" },
      // January 1, 2016 · January 1st, 2016
      { re: new RegExp(`^(${LONG}) (\\d{1,2})(?:st|nd|rd|th)?, (\\d{1,6})( BC)?$`), month: 1, day: 2, year: 3, bc: 4, style: "long" },
      // Jan 1, 2016 · Jan 1st, 2016
      { re: new RegExp(`^(${SHORT}) (\\d{1,2})(?:st|nd|rd|th)?, (\\d{1,6})( BC)?$`), month: 1, day: 2, year: 3, bc: 4, style: "medium" },
      // 1 Jan 2016
      { re: new RegExp(`^(\\d{1,2}) (${SHORT}) (\\d{1,6})( BC)?$`), day: 1, month: 2, year: 3, bc: 4, style: "medium" },
      // January 2016
      { re: new RegExp(`^(${LONG}) (\\d{1,6})( BC)?$`), month: 1, year: 2, bc: 3, style: "monthLong" },
      // Jan 2016
      { re: new RegExp(`^(${SHORT}) (\\d{1,6})( BC)?$`), month: 1, year: 2, bc: 3, style: "monthShort" },
      // 1/8/2016 (month first, as the jump widget writes it)
      { re: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, month: 1, day: 2, year: 3, numericMonth: true, style: "short" },
      // 2016-01-08, a game date as stored (cards, the game menu); -0218-03-01 is 218 BC
      { re: /^(-?\d{4,6})-(\d{2})-(\d{2})$/, year: 1, month: 2, day: 3, numericMonth: true, iso: true, style: "medium" }
    ];
  }
});

// src/runtime/phraseBook.js
var SLOT, STRONG_LETTERS, WEAK_MAX_VALUE_WORDS, SENTENCE_LETTERS, MEMO_LIMIT2, LIST_SEPARATOR, LIST_SPLIT, collapse, letterCount, wordCount, escapeRegex, literalSource, isPatternKey, compilePattern, fill, fillSlots, acceptsValues, createPhraseBook;
var init_phraseBook = __esm({
  "src/runtime/phraseBook.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    SLOT = /\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}/g;
    STRONG_LETTERS = 8;
    WEAK_MAX_VALUE_WORDS = 4;
    SENTENCE_LETTERS = 16;
    MEMO_LIMIT2 = 5e3;
    LIST_SEPARATOR = / [/·•|] /;
    LIST_SPLIT = /( [/·•|] )/;
    collapse = (text3) => text3.replace(/\s+/g, " ").trim();
    letterCount = (text3) => (text3.match(new RegExp("\\p{L}", "gu")) ?? []).length;
    wordCount = (text3) => (text3.match(/[\p{L}\p{N}]+/gu) ?? []).length;
    escapeRegex = (text3) => text3.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    literalSource = (text3) => text3.split(/\s+/).map(escapeRegex).join("\\s+");
    isPatternKey = (text3) => typeof text3 === "string" && text3.includes("{{") && new RegExp(SLOT.source).test(text3);
    compilePattern = (english, translated) => {
      if (typeof english !== "string" || typeof translated !== "string") return null;
      const key = english.trim();
      const slots = [];
      const literals = [];
      let source = "^";
      let last = 0;
      for (const match of key.matchAll(SLOT)) {
        const literal = key.slice(last, match.index);
        literals.push(literal);
        source += `${literalSource(literal)}([\\s\\S]*?)`;
        slots.push(match[1]);
        last = match.index + match[0].length;
      }
      if (!slots.length) return null;
      if (literals.slice(1).some((literal) => !literal)) return null;
      const tail = key.slice(last);
      literals.push(tail);
      source += `${literalSource(tail)}$`;
      const literalText = literals.join(" ");
      const strength = letterCount(literalText);
      if (!strength) return null;
      const anchor = (literalText.match(new RegExp("\\p{L}+", "gu")) ?? []).reduce((best, word) => word.length > best.length ? word : best, "");
      return {
        anchor,
        english: key,
        literalLength: collapse(literalText).length,
        regex: new RegExp(source, "u"),
        slots,
        strength,
        translated
      };
    };
    fill = (template, slots, values) => {
      const queues = /* @__PURE__ */ new Map();
      slots.forEach((name, index) => {
        if (!queues.has(name)) queues.set(name, []);
        queues.get(name).push(values[index]);
      });
      const used = /* @__PURE__ */ new Map();
      return template.replace(SLOT, (_whole, name) => {
        const queue = queues.get(name);
        if (!queue) return "";
        const index = used.get(name) ?? 0;
        used.set(name, index + 1);
        return queue[Math.min(index, queue.length - 1)];
      });
    };
    fillSlots = (template, params = {}) => String(template ?? "").replace(SLOT, (_whole, name) => params && Object.hasOwn(params, name) && params[name] != null ? String(params[name]) : "");
    acceptsValues = (pattern, values) => {
      if (pattern.strength < STRONG_LETTERS) {
        const words = values.reduce((total, value) => total + wordCount(value), 0);
        if (words > WEAK_MAX_VALUE_WORDS) return false;
      }
      if (pattern.strength < SENTENCE_LETTERS && values.some((value) => /[.!?。！？]\s+\S/u.test(value))) return false;
      return true;
    };
    createPhraseBook = ({ localizeValue = null } = {}) => {
      const exact = /* @__PURE__ */ new Map();
      const patternEntries = /* @__PURE__ */ new Map();
      let patterns = null;
      const memo = /* @__PURE__ */ new Map();
      const compiled = () => {
        if (!patterns) {
          patterns = [];
          for (const [english, translated] of patternEntries) {
            const pattern = compilePattern(english, translated);
            if (pattern) patterns.push(pattern);
          }
          patterns.sort((a, b2) => b2.strength - a.strength || b2.literalLength - a.literalLength);
        }
        return patterns;
      };
      const changed = () => {
        memo.clear();
      };
      const set = (english, translated) => {
        if (typeof english !== "string" || typeof translated !== "string") return;
        const key = english.trim();
        const value = translated.trim();
        if (!key || !value) return;
        if (isPatternKey(key)) {
          patternEntries.set(key, value);
          patterns = null;
        } else {
          exact.set(key, value);
          const collapsed = collapse(key);
          if (collapsed !== key) exact.set(collapsed, value);
        }
        changed();
      };
      const setAll = (entries) => {
        const list12 = entries instanceof Map ? entries.entries() : Object.entries(entries ?? {});
        for (const [english, translated] of list12) set(english, translated);
      };
      const get = (text3) => {
        if (typeof text3 !== "string") return void 0;
        const key = text3.trim();
        return exact.get(key) ?? exact.get(collapse(key));
      };
      const byRule = (text3) => {
        if (!localizeValue) return null;
        try {
          return localizeValue(text3) ?? null;
        } catch {
          return null;
        }
      };
      const matchPattern = (text3) => {
        for (const pattern of compiled()) {
          if (pattern.anchor && !text3.includes(pattern.anchor)) continue;
          if (text3.length > pattern.english.length + 300) continue;
          const match = pattern.regex.exec(text3);
          if (!match) continue;
          const values = match.slice(1);
          if (!acceptsValues(pattern, values)) continue;
          if (pattern.strength < STRONG_LETTERS && values.some((value) => {
            const inner = value.trim();
            return new RegExp("\\p{L}", "u").test(inner) && /\d/.test(inner) && get(inner) === void 0 && byRule(inner) == null;
          })) continue;
          const translatedValues = values.map((value) => {
            const inner = value.trim();
            if (!inner) return value;
            const known = get(inner) ?? byRule(inner) ?? byParts(inner);
            return known == null ? value : value.replace(inner, () => known);
          });
          return fill(pattern.translated, pattern.slots, translatedValues).trim();
        }
        return null;
      };
      const byParts = (text3) => {
        if (text3.length > 240 || !LIST_SEPARATOR.test(text3)) return null;
        const parts = text3.split(LIST_SPLIT);
        if (parts.length > 15) return null;
        let changed2 = false;
        const out = parts.map((part, index) => {
          const inner = part.trim();
          if (index % 2 === 1 || !inner) return part;
          const known = get(inner) ?? byRule(inner) ?? (patternEntries.size ? matchPattern(inner) : null);
          if (known == null) return part;
          changed2 = true;
          return part.replace(inner, () => known);
        });
        return changed2 ? out.join("") : null;
      };
      const translate = (text3) => {
        if (typeof text3 !== "string") return null;
        const key = text3.trim();
        if (!key) return null;
        const known = get(key);
        if (known !== void 0) return known;
        if (memo.has(key)) return memo.get(key);
        const result = byRule(key) ?? (patternEntries.size ? matchPattern(key) : null) ?? byParts(key);
        if (memo.size >= MEMO_LIMIT2) memo.clear();
        memo.set(key, result);
        return result;
      };
      const format = (key, params = {}) => {
        if (typeof key !== "string") return null;
        const trimmed = key.trim();
        const template = isPatternKey(trimmed) ? patternEntries.get(trimmed) : get(trimmed);
        return template == null ? null : fillSlots(template, params);
      };
      return {
        format,
        get,
        has: (text3) => get(text3) !== void 0,
        patternCount: () => patternEntries.size,
        set,
        setAll,
        size: () => exact.size + patternEntries.size,
        translate
      };
    };
  }
});

// src/runtime/promptTranslations.js
var init_promptTranslations = __esm({
  "src/runtime/promptTranslations.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/translationRules.js
var init_translationRules = __esm({
  "src/runtime/translationRules.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/translator.js
var TRANSLATED_ATTRIBUTES, book, ATTRIBUTE_SELECTOR;
var init_translator = __esm({
  "src/runtime/translator.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_requestBudget();
    init_i18n();
    init_localDates();
    init_phraseBook();
    init_promptTranslations();
    init_translationRules();
    TRANSLATED_ATTRIBUTES = ["placeholder", "title", "aria-label", "aria-description", "alt"];
    book = createPhraseBook();
    ATTRIBUTE_SELECTOR = TRANSLATED_ATTRIBUTES.map((attribute) => `[${attribute}]`).join(",");
  }
});

// src/runtime/countryTags.js
var MAX_TAGS, MAX_TAG_LEN, normalizeTagList;
var init_countryTags = __esm({
  "src/runtime/countryTags.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    MAX_TAGS = 8;
    MAX_TAG_LEN = 32;
    normalizeTagList = (list12, { maxTags = MAX_TAGS, maxLen = MAX_TAG_LEN } = {}) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const raw of Array.isArray(list12) ? list12 : []) {
        if (typeof raw !== "string") continue;
        const tag = raw.trim().replace(/\s+/g, " ").slice(0, maxLen);
        if (!tag) continue;
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(tag);
        if (out.length >= maxTags) break;
      }
      return out;
    };
  }
});

// src/runtime/puppets.js
var PUPPET_KINDS, PUPPET_SECRECY_LEVELS, PUPPET_STATUSES, MAX_PUPPETS;
var init_puppets = __esm({
  "src/runtime/puppets.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    PUPPET_KINDS = ["protectorate", "satellite", "client"];
    PUPPET_SECRECY_LEVELS = ["open", "covert"];
    PUPPET_STATUSES = ["active", "released", "annexed", "revolted"];
    MAX_PUPPETS = 64;
  }
});

// server/battlefieldNames.js
var init_battlefieldNames = __esm({
  "server/battlefieldNames.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// server/polityRename.js
var init_polityRename = __esm({
  "server/polityRename.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_battlefieldNames();
  }
});

// src/runtime/projects.js
var asText, isMilestoneOutstanding, MILESTONE_REPEATS, REPEAT_ALIASES, normalizeMilestoneRepeat, EFFORT_START_PATTERN;
var init_projects = __esm({
  "src/runtime/projects.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    asText = (value) => String(value ?? "").trim();
    isMilestoneOutstanding = (milestone) => {
      const status = asText(milestone?.status) || "pending";
      return status === "pending" || status === "slipped";
    };
    MILESTONE_REPEATS = ["weekly", "monthly", "quarterly", "annual", "biennial"];
    REPEAT_ALIASES = {
      yearly: "annual",
      annually: "annual",
      year: "annual",
      "every year": "annual",
      "1y": "annual",
      biannual: "biennial",
      "two-yearly": "biennial",
      "2y": "biennial",
      quarter: "quarterly",
      "3m": "quarterly",
      month: "monthly",
      "1m": "monthly",
      week: "weekly",
      "1w": "weekly",
      daily: "",
      day: ""
    };
    normalizeMilestoneRepeat = (value) => {
      const raw = asText(value).toLowerCase();
      if (!raw) return "";
      if (MILESTONE_REPEATS.includes(raw)) return raw;
      return REPEAT_ALIASES[raw] ?? "";
    };
    EFFORT_START_PATTERN = new RegExp(
      "\\b(?:launch(?:es|ed|ing)?|begins?|began|begun|starts?|started|initiat\\w+|commission(?:s|ed|ing)?|authori[sz]\\w+|approv\\w+|green-?lights?|breaks? ground|broke ground|lays? (?:down )?the keel|funds?|funded|unveil\\w*|announc\\w+|orders?|ordered|embarks?|embarked|sets? up|establish\\w*)\\b[^.!?]{0,90}\\b(?:programmes?|programs?|projects?|operations?|construction|initiatives?|campaigns?|build-?up|moderni[sz]ation|rearmament|expansion|reactors?|canals?|railways?|railroads?|pipelines?|shipyards?|fleets?|five-year plan|reforms?|networks?|academ(?:y|ies)|bureau|agenc(?:y|ies))\\b",
      "i"
    );
  }
});

// src/runtime/eventDedup.js
var init_eventDedup = __esm({
  "src/runtime/eventDedup.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/eventTags.js
var EVENT_TAG_ENUM;
var init_eventTags = __esm({
  "src/runtime/eventTags.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    EVENT_TAG_ENUM = Object.freeze([
      "Military",
      "Diplomacy",
      "Economy",
      "Politics",
      "Culture",
      "Disaster"
    ]);
  }
});

// src/runtime/eventPlaces.js
var EVENT_PLACE_KINDS;
var init_eventPlaces = __esm({
  "src/runtime/eventPlaces.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    EVENT_PLACE_KINDS = Object.freeze(["country", "region", "city", "structure", "unit", "sea"]);
  }
});

// src/runtime/eventQuote.js
var init_eventQuote = __esm({
  "src/runtime/eventQuote.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/eventAgency.js
var EVENT_AGENCY_PRINCIPAL_KINDS, EVENT_AGENCY_AUTHORITIES, EVENT_AGENCY_SOVEREIGN_AUTHORITIES;
var init_eventAgency = __esm({
  "src/runtime/eventAgency.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    EVENT_AGENCY_PRINCIPAL_KINDS = Object.freeze([
      "polity",
      "institution",
      "domestic-actor",
      "domestic-process",
      "collective-process",
      "organization",
      "person",
      "exogenous-process"
    ]);
    EVENT_AGENCY_AUTHORITIES = Object.freeze([
      "autonomous",
      "player-order",
      "player-commitment",
      "canonical-process",
      "delegated-routine",
      "endogenous-domestic",
      "independent",
      "external-consequence"
    ]);
    EVENT_AGENCY_SOVEREIGN_AUTHORITIES = Object.freeze([
      "autonomous",
      "player-order",
      "player-commitment"
    ]);
  }
});

// src/runtime/polityFounding.js
var FOUNDING_ROLES;
var init_polityFounding = __esm({
  "src/runtime/polityFounding.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_ownerNames();
    FOUNDING_ROLES = Object.freeze(/* @__PURE__ */ new Set(["transfer", "control", "contest", "claim"]));
  }
});

// src/runtime/territoryBasis.js
var TERRITORY_BASIS_MOVES_MAP, TERRITORY_BASIS_NO_CONTROL, TERRITORY_BASIS_ENUM, MOVES_MAP, NO_CONTROL, BASIS_SYNONYMS, clean12, normalizeTerritoryBasis;
var init_territoryBasis = __esm({
  "src/runtime/territoryBasis.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    TERRITORY_BASIS_MOVES_MAP = Object.freeze([
      "treaty",
      "annexation",
      "unification",
      "independence",
      "occupation"
    ]);
    TERRITORY_BASIS_NO_CONTROL = Object.freeze([
      "claim",
      "threat",
      "raid"
    ]);
    TERRITORY_BASIS_ENUM = Object.freeze([
      ...TERRITORY_BASIS_MOVES_MAP,
      ...TERRITORY_BASIS_NO_CONTROL
    ]);
    MOVES_MAP = new Set(TERRITORY_BASIS_MOVES_MAP);
    NO_CONTROL = new Set(TERRITORY_BASIS_NO_CONTROL);
    BASIS_SYNONYMS = Object.freeze({
      cession: "treaty",
      ceded: "treaty",
      purchase: "treaty",
      sale: "treaty",
      settlement: "treaty",
      peace: "treaty",
      annexed: "annexation",
      annex: "annexation",
      union: "unification",
      accession: "unification",
      succession: "unification",
      secession: "independence",
      liberation: "occupation",
      capture: "occupation",
      conquest: "occupation",
      occupied: "occupation",
      administration: "occupation",
      handover: "occupation",
      collapse: "occupation",
      declaration: "claim",
      declared: "claim",
      proclamation: "claim",
      decree: "claim",
      claimed: "claim",
      demand: "threat",
      ultimatum: "threat",
      bombardment: "raid",
      incursion: "raid"
    });
    clean12 = (value) => String(value ?? "").trim();
    normalizeTerritoryBasis = (value) => {
      const token = clean12(value).toLowerCase().replace(/[\s-]+/g, "_");
      if (!token) return "";
      if (MOVES_MAP.has(token) || NO_CONTROL.has(token)) return token;
      return BASIS_SYNONYMS[token] ?? "";
    };
  }
});

// src/runtime/eventImpactKeys.js
var EVENT_IMPACT_KEYS;
var init_eventImpactKeys = __esm({
  "src/runtime/eventImpactKeys.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    EVENT_IMPACT_KEYS = Object.freeze([
      "regionTransfers",
      "regionControlOps",
      "regionClaims",
      "groupOps",
      "polityChanges",
      "politicalActorOps",
      "institutionLifecycleOps",
      "unitOps",
      "markerOps",
      "spyOps",
      "projectOps",
      "createdChats",
      "reports",
      "actionIds"
    ]);
  }
});

// src/runtime/receiptPlayerNotes.js
var RECEIPT_PLAYER_TEXTS, WITHHELD_ROUTE_KEYS;
var init_receiptPlayerNotes = __esm({
  "src/runtime/receiptPlayerNotes.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_phraseBook();
    init_gameDates();
    RECEIPT_PLAYER_TEXTS = Object.freeze({
      // Events kept off the timeline.
      eventDiscarded: "An event with neither a title nor a description was discarded.",
      withheldImpossible: "Kept off the timeline: the engine judged it impossible in this world.",
      withheldContradiction: "Kept off the timeline: it contradicted the established record.",
      withheldRestatement: "Kept off the timeline: it restated an event already on the record.",
      withheldProcess: "Kept off the timeline: it described work going on with no concrete outcome.",
      withheldIncrement: "Kept off the timeline: the change it described was too small to record.",
      withheldRoutineMilitary: "Kept off the timeline: routine military activity that changed nothing.",
      withheldRoutineAdministration: "Kept off the timeline: routine administration with no concrete outcome.",
      withheldSaturated: "Kept off the timeline: one more small update on a story that already had several.",
      withheldPlayerAgency: "Kept off the timeline: it made a decision for your country that none of your orders or messages authorized.",
      withheldOther: "Kept off the timeline by the engine's checks.",
      withheldWordForWord: "Kept off the timeline: word for word an event already on the record.",
      interventionOne: 'You stopped the time skip after "{{title}}" ({{date}}): the event after it never happened, and the world stands at {{closingDate}}.',
      interventionMany: 'You stopped the time skip after "{{title}}" ({{date}}): the {{count}} events after it never happened, and the world stands at {{closingDate}}.',
      tempoOne: "1 territorial change was held back: this scenario limits how fast the map may change.",
      tempoMany: "{{count}} territorial changes were held back: this scenario limits how fast the map may change.",
      // Changes that were not applied.
      malformedOne: "One change this event carried was malformed and was ignored.",
      malformedMany: "{{count}} changes this event carried were malformed and were ignored.",
      warRecordsOne: "1 war record could not be tied to its events and was dropped; the events stay as history.",
      warRecordsMany: "{{count}} war records could not be tied to their events and were dropped; the events stay as history.",
      warLinksOne: "1 event lost its link to a war whose record could not be tied to it; the event stays as history.",
      warLinksMany: "{{count}} events lost their links to a war whose records could not be tied to them; the events stay as history.",
      relationUnknownCountry: "The change in relations between {{a}} and {{b}} was not recorded: {{name}} is not a country on this map.",
      relationUnnamed: "A change in relations was not recorded: it did not name both of its sides.",
      relationSameCountry: "A change in relations was not recorded: both of its sides were the same country.",
      relationIncomplete: "The change in relations between {{a}} and {{b}} was not recorded: it was incomplete.",
      agreementIncomplete: "A change to an agreement was not recorded: it was incomplete.",
      agreementMissing: 'A change to the agreement "{{name}}" was not recorded: no such agreement exists.',
      agreementAlreadyInForce: 'The agreement "{{name}}" was not signed again: it is already in force.',
      agreementTooFewParties: 'The agreement "{{name}}" was not recorded: fewer than two of its parties are countries on this map.',
      agreementUntitled: "A new agreement was not recorded: it had no title.",
      staleOrderLinksOne: "1 link from an event to an order that is not in your queue was removed.",
      staleOrderLinksMany: "{{count}} links from events to orders that are not in your queue were removed.",
      cityControlUnchanged: "The event says control of {{city}} changed, but nothing changed it, so the map still shows its previous controller.",
      transferWholeCountryUnknown: "The transfer of all of {{name}}'s land was not applied: no regions are held under that exact name.",
      controlWholeCountryUnknown: "The change of control over all of {{name}}'s land was not applied: no regions are held under that exact name.",
      transferUnknownOwner: "The transfer of {{region}} was not applied: {{owner}} is not a country on this map.",
      controlUnknownOwner: "The change of control over {{region}} was not applied: {{owner}} is not a country on this map.",
      transferNoRegion: "The transfer of {{region}} was not applied: no region on the map matches that name.",
      controlNoRegion: "The change of control over {{region}} was not applied: no region on the map matches that name.",
      politicalRefused: "A change to a government, party or leader was not applied: the engine's political records refused it.",
      institutionRefused: "A change to an institution or its membership was not applied: the institution's rules refused it.",
      chatNotOpened: 'The conversation "{{title}}" was not opened: none of its participants is a country on this map.',
      untitledChatNotOpened: "A conversation was not opened: none of its participants is a country on this map.",
      unitNotRaised: "A new unit was not raised: it had no name or no owner.",
      unitOrderNoUnit: "An order to a unit was not carried out: it did not say which unit.",
      unitOrderUnknownUnit: 'An order to the unit "{{unit}}" was not carried out: no unit has that id, and it may have been destroyed.',
      structureUnnamed: "A structure was not built: it had no name.",
      structureNowhere: 'The structure "{{name}}" was not built: it had no position on the map.',
      structureRemovalUnnamed: "A structure was not removed: the event did not say which one.",
      reportEmpty: "A report was not written: it carried no document.",
      reportNoHolders: 'The report "{{title}}" was not written: none of the governments meant to hold it is a country on this map.',
      projectUnnamed: "A project was not opened: it had no name.",
      projectChangeNoProject: "A change to a project was not applied: it did not say which project.",
      projectChangeUnknown: 'A change to the project "{{name}}" was not applied: nothing on the board has that name.',
      schemaTruncatedOne: "1 item beyond the allowed length was left out of the answer.",
      schemaTruncatedMany: "{{count}} items beyond the allowed length were left out of the answer.",
      schemaMalformed: "A malformed part of the answer was left out.",
      placedNowhere: "{{name}} could not be placed where the event said and was left off the map.",
      unnamedPlacedNowhere: "A unit or structure could not be placed where the event said and was left off the map.",
      // Changes the engine adjusted.
      warLinkRemoved: "Kept as history, but no longer tied to a war: it described fighting the engine could not match to one.",
      claimInsteadOfTransfer: "The transfer of {{region}} to {{country}} was recorded as a claim instead, since a claim moves no border; the region now shows as disputed.",
      claimInsteadOfControl: "Control of {{region}} passing to {{country}} was recorded as a claim instead, since a claim moves no border; the region now shows as disputed.",
      transferMovesNoBorder: "The transfer of {{region}} was not applied: the event described something that moves no border, so nothing changed on the map.",
      controlMovesNoBorder: "The change of control over {{region}} was not applied: the event described something that moves no border, so nothing changed on the map.",
      wholeCountryMovesNoBorder: "The transfer of all of {{name}}'s land was not applied: the event described something that moves no border, so nothing changed on the map.",
      reportFewerHolders: 'The report "{{title}}" went only to {{holders}}: the other governments it named are not countries on this map.',
      placedInRegion: "{{name}} could not be placed where the event said, so it was placed in {{region}} instead.",
      unnamedPlacedInRegion: "A unit or structure could not be placed where the event said, so it was placed in {{region}} instead.",
      raisedAtHome: "{{name}} could not be placed where the event said, so it was raised in {{region}}, inside {{owner}}'s own territory.",
      unnamedRaisedAtHome: "A new unit could not be placed where the event said, so it was raised in {{region}}, inside {{owner}}'s own territory.",
      placedByCoordinates: "{{name}} could not be placed where the event said, so the coordinates it came with were used.",
      unnamedPlacedByCoordinates: "A unit or structure could not be placed where the event said, so the coordinates it came with were used.",
      movedAshore: "{{name}} was placed in the sea and was moved ashore to {{region}}.",
      unnamedMovedAshore: "A land unit was placed in the sea and was moved ashore to {{region}}.",
      datesClamped: "Some event dates fell outside this period and were moved inside it.",
      scriptedBeatWritten: `The scripted event "{{title}}" of {{date}} was missing, so the engine wrote it in the author's words.`,
      // Rejected and written again.
      redone: "The first answer broke one of the engine's rules and was written again.",
      // Kept as written, though short of what was asked.
      eventCountOne: "The time skip wrote 1 event for a period that called for {{min}} to {{max}}.",
      eventCountMany: "The time skip wrote {{count}} events for a period that called for {{min}} to {{max}}.",
      worldShareOne: "1 of the {{total}} events was about the world beyond your country; this scenario asks for at least {{needed}}.",
      worldShareMany: "{{count}} of the {{total}} events were about the world beyond your country; this scenario asks for at least {{needed}}.",
      focusOne: "1 of the {{total}} events involved your country; your focus setting asks for at least {{needed}}.",
      focusMany: "{{count}} of the {{total}} events involved your country; your focus setting asks for at least {{needed}}.",
      politicalNotRecorded: "Kept as written, but the change of government, party or leader it describes was not recorded.",
      overdueOrdersOne: "1 of your orders got no outcome in this time skip and stays queued as overdue.",
      overdueOrdersMany: "{{count}} of your orders got no outcome in this time skip and stay queued as overdue."
    });
    WITHHELD_ROUTE_KEYS = Object.freeze({
      NON_BELLIGERENT_WARTIME_CAUSALITY: "withheldImpossible",
      UNSUPPORTED_REVERSAL: "withheldContradiction",
      EXACT_DUPLICATE: "withheldRestatement",
      EVIDENCED_REDUNDANCY: "withheldRestatement",
      RETRIEVAL_ASSISTED_REDUNDANCY: "withheldRestatement",
      NATIVE_PROCESS_FILLER: "withheldProcess",
      LOW_VALUE_INCREMENTAL_CHURN: "withheldIncrement",
      ROUTINE_MILITARY_NO_DELTA: "withheldRoutineMilitary",
      ROUTINE_MILITARY_PRECURATION: "withheldRoutineMilitary",
      ROUTINE_ADMINISTRATIVE_PROCESS: "withheldRoutineAdministration",
      SATURATED_ROUTINE_MILITARY_CHURN: "withheldSaturated",
      SATURATED_INCREMENTAL_REDUNDANCY: "withheldSaturated",
      LOW_TRAJECTORY_FEED_SATURATION: "withheldSaturated",
      PLAYER_AGENCY_AUTHORITY: "withheldPlayerAgency"
    });
  }
});

// src/runtime/applicationReceipt.js
var RECEIPT_VERSION, RECEIPT_MAX_NOTES, RECEIPT_NOTE_MAX_CHARS, RECEIPT_EVENT_MAX_CHARS, RECEIPT_NOTE_KINDS, APPLIED_KEYS, APPLIED_LABELS, clean13, count2, array, clip, emptyApplied, playerFields, storedPlayer, normalizeApplicationReceipt, KIND_HEADINGS, RECEIPT_KIND_PLAYER_TITLES;
var init_applicationReceipt = __esm({
  "src/runtime/applicationReceipt.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_eventImpactKeys();
    init_receiptPlayerNotes();
    RECEIPT_VERSION = 1;
    RECEIPT_MAX_NOTES = 40;
    RECEIPT_NOTE_MAX_CHARS = 280;
    RECEIPT_EVENT_MAX_CHARS = 120;
    RECEIPT_NOTE_KINDS = Object.freeze(["redone", "withheld", "dropped", "adjusted", "short"]);
    APPLIED_KEYS = Object.freeze([
      "events",
      ...EVENT_IMPACT_KEYS.filter((key) => key !== "actionIds")
    ]);
    APPLIED_LABELS = Object.freeze({
      events: ["event", "events"],
      regionTransfers: ["region transfer", "region transfers"],
      regionControlOps: ["control operation", "control operations"],
      regionClaims: ["claim", "claims"],
      groupOps: ["group operation", "group operations"],
      polityChanges: ["polity change", "polity changes"],
      politicalActorOps: ["political actor operation", "political actor operations"],
      institutionLifecycleOps: ["institution operation", "institution operations"],
      unitOps: ["unit operation", "unit operations"],
      markerOps: ["structure operation", "structure operations"],
      spyOps: ["espionage order", "espionage orders"],
      projectOps: ["project operation", "project operations"],
      createdChats: ["new chat", "new chats"],
      reports: ["report", "reports"]
    });
    clean13 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    count2 = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? Math.trunc(Number(value)) : 0;
    array = (value) => Array.isArray(value) ? value : [];
    clip = (text3, max2 = RECEIPT_NOTE_MAX_CHARS) => {
      const value = clean13(text3);
      return value.length > max2 ? `${value.slice(0, max2 - 1).trimEnd()}\u2026` : value;
    };
    emptyApplied = () => Object.fromEntries(APPLIED_KEYS.map((key) => [key, 0]));
    playerFields = (player) => {
      const text3 = clip(player?.text);
      if (!text3) return {};
      const event = clip(player.event, RECEIPT_EVENT_MAX_CHARS);
      return event ? { player: text3, event } : { player: text3 };
    };
    storedPlayer = (note) => ({ text: note?.player, event: note?.event });
    normalizeApplicationReceipt = (value, { keepNotes = true } = {}) => {
      if (!value || typeof value !== "object") return null;
      const applied = emptyApplied();
      for (const key of APPLIED_KEYS) applied[key] = count2(value.applied?.[key]);
      const notes = [];
      if (keepNotes) {
        for (const note of array(value.notes)) {
          const kind = clean13(note?.kind);
          const text3 = clip(note?.text);
          if (!RECEIPT_NOTE_KINDS.includes(kind) || !text3) continue;
          if (notes.length >= RECEIPT_MAX_NOTES) break;
          notes.push({ kind, text: text3, ...playerFields(storedPlayer(note)) });
        }
      }
      const omitted = count2(value.omitted) + (keepNotes ? Math.max(0, array(value.notes).length - notes.length) : 0);
      return { version: RECEIPT_VERSION, applied, notes, omitted: keepNotes ? omitted : 0 };
    };
    KIND_HEADINGS = Object.freeze({
      redone: "Rejected and regenerated within the turn",
      withheld: "Events you wrote that did NOT reach the timeline \u2014 the record you are shown does not contain them",
      dropped: "Operations that were NOT applied \u2014 the map and records do not show them",
      adjusted: "Operations the engine changed before applying",
      short: "Kept exactly as you wrote it, but short of what was asked \u2014 meet it this turn"
    });
    RECEIPT_KIND_PLAYER_TITLES = Object.freeze({
      redone: "Rejected and written again during the skip",
      withheld: "Events kept off the timeline",
      dropped: "Changes that were not applied to the map or the records",
      adjusted: "Changes the engine adjusted before applying them",
      short: "Kept as written, though shorter than was asked"
    });
  }
});

// src/runtime/filedEvents.js
var clean14, clip2, FILED_EVENTS_MAX, TITLE_MAX, DESCRIPTION_MAX, FILED_FATES, ROUTINE_MILITARY, UNFINISHED, SMALL_STEP, REPEAT, ROUTES, ownership, describeFiledRoute, normalizeFiledEvents;
var init_filedEvents = __esm({
  "src/runtime/filedEvents.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    clean14 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    clip2 = (value, max2) => {
      const text3 = clean14(value);
      return text3.length > max2 ? `${text3.slice(0, max2 - 1).trimEnd()}\u2026` : text3;
    };
    FILED_EVENTS_MAX = 24;
    TITLE_MAX = 200;
    DESCRIPTION_MAX = 600;
    FILED_FATES = Object.freeze({
      offTimeline: "off-timeline",
      notRecorded: "not-recorded"
    });
    ROUTINE_MILITARY = "Routine military activity that changed nothing";
    UNFINISHED = "Work going on, with nothing finished yet";
    SMALL_STEP = "A small step on a thread that already has several";
    REPEAT = "Repeats an event already on the record";
    ROUTES = Object.freeze({
      ROUTINE_MILITARY_PRECURATION: [FILED_FATES.offTimeline, ROUTINE_MILITARY],
      ROUTINE_MILITARY_NO_DELTA: [FILED_FATES.offTimeline, ROUTINE_MILITARY],
      SATURATED_ROUTINE_MILITARY_CHURN: [FILED_FATES.offTimeline, ROUTINE_MILITARY],
      ROUTINE_ADMINISTRATIVE_PROCESS: [FILED_FATES.offTimeline, UNFINISHED],
      NATIVE_PROCESS_FILLER: [FILED_FATES.offTimeline, UNFINISHED],
      LOW_VALUE_INCREMENTAL_CHURN: [FILED_FATES.offTimeline, SMALL_STEP],
      SATURATED_INCREMENTAL_REDUNDANCY: [FILED_FATES.offTimeline, SMALL_STEP],
      LOW_TRAJECTORY_FEED_SATURATION: [FILED_FATES.offTimeline, SMALL_STEP],
      EVIDENCED_REDUNDANCY: [FILED_FATES.offTimeline, REPEAT],
      RETRIEVAL_ASSISTED_REDUNDANCY: [FILED_FATES.offTimeline, REPEAT],
      EXACT_DUPLICATE: [FILED_FATES.notRecorded, REPEAT],
      NON_BELLIGERENT_WARTIME_CAUSALITY: [FILED_FATES.notRecorded, "Couldn't have happened: it assumes a war this country is not in"],
      UNSUPPORTED_REVERSAL: [FILED_FATES.notRecorded, "Contradicts what is already on the record"],
      PLAYER_AGENCY_AUTHORITY: [FILED_FATES.notRecorded, "Not recorded: the game could not tell it was your government's order"]
    });
    ownership = (event) => {
      const actionIds = (Array.isArray(event?.impacts?.actionIds) ? event.impacts.actionIds : []).map(clean14).filter(Boolean).slice(0, 12);
      const player = event?.playerRelated === true || actionIds.length > 0;
      return { ...player ? { player: true } : {}, ...actionIds.length ? { actionIds } : {} };
    };
    describeFiledRoute = (route) => {
      const [fate, note] = ROUTES[clean14(route)] || [FILED_FATES.notRecorded, "Kept off the timeline by the engine's checks"];
      return { fate, note };
    };
    normalizeFiledEvents = (value) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const entry of Array.isArray(value) ? value : []) {
        if (!entry || typeof entry !== "object") continue;
        const title = clip2(entry.title, TITLE_MAX);
        if (!title || seen.has(title.toLowerCase())) continue;
        const route = clean14(entry.route);
        const described = describeFiledRoute(route);
        const fate = Object.values(FILED_FATES).includes(entry.fate) ? entry.fate : described.fate;
        seen.add(title.toLowerCase());
        out.push({
          title,
          description: clip2(entry.description, DESCRIPTION_MAX),
          date: clean14(entry.date),
          route,
          fate,
          note: clip2(entry.note, 160) || described.note,
          ...ownership({ playerRelated: entry.player === true, impacts: { actionIds: entry.actionIds } })
        });
        if (out.length >= FILED_EVENTS_MAX) break;
      }
      return out;
    };
  }
});

// src/runtime/reports.js
var REPORTS_LIMIT, REPORT_BODY_MAX_CHARS, REPORT_TITLE_MAX_CHARS, REPORT_OPS, asArray, asText2, clip3, fold9, nameList, normalizeReportEntry, normalizeReports, normalizeReportOp;
var init_reports = __esm({
  "src/runtime/reports.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    REPORTS_LIMIT = 240;
    REPORT_BODY_MAX_CHARS = 6e3;
    REPORT_TITLE_MAX_CHARS = 160;
    REPORT_OPS = Object.freeze(["create", "share"]);
    asArray = (value) => Array.isArray(value) ? value : [];
    asText2 = (value) => String(value ?? "").trim();
    clip3 = (text3, max2) => text3.length > max2 ? `${text3.slice(0, max2 - 1)}\u2026` : text3;
    fold9 = (value) => asText2(value).toLowerCase();
    nameList = (value) => {
      const seen = /* @__PURE__ */ new Set();
      const names = [];
      for (const entry of asArray(value)) {
        const name = asText2(typeof entry === "object" && entry ? entry.name ?? entry.code : entry);
        if (!name || seen.has(fold9(name))) continue;
        seen.add(fold9(name));
        names.push(name);
      }
      return names;
    };
    normalizeReportEntry = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") return null;
      const title = clip3(asText2(entry.title), REPORT_TITLE_MAX_CHARS);
      const body = clip3(String(entry.body ?? "").replace(/\r\n/g, "\n").trim(), REPORT_BODY_MAX_CHARS);
      if (!title || !body) return null;
      const visibleTo = entry.visibleTo === null || entry.visibleTo === void 0 ? null : nameList(entry.visibleTo);
      const from = asText2(entry.from);
      const interceptedBy = nameList(entry.interceptedBy);
      const receivedFrom = Object.fromEntries(Object.entries(entry.receivedFrom && typeof entry.receivedFrom === "object" ? entry.receivedFrom : {}).map(([holder, giver]) => [asText2(holder), asText2(giver)]).filter(([holder, giver]) => holder && giver));
      return {
        id: asText2(entry.id) || `report-${index + 1}`,
        title,
        body,
        visibleTo: visibleTo && visibleTo.length ? visibleTo : null,
        ...from ? { from } : {},
        ...interceptedBy.length ? { interceptedBy } : {},
        ...Object.keys(receivedFrom).length ? { receivedFrom } : {},
        sourceEventId: asText2(entry.sourceEventId),
        createdRound: Math.max(0, Math.round(Number(entry.createdRound) || 0)),
        createdDate: asText2(entry.createdDate),
        dateline: asText2(entry.dateline),
        origin: asText2(entry.origin) || "ai"
      };
    };
    normalizeReports = (reports) => {
      const seen = /* @__PURE__ */ new Set();
      const list12 = [];
      asArray(reports).forEach((entry, index) => {
        const report = normalizeReportEntry(entry, index);
        if (!report || seen.has(report.id)) return;
        seen.add(report.id);
        list12.push(report);
      });
      return list12.slice(-REPORTS_LIMIT);
    };
    normalizeReportOp = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const op = fold9(entry.op || entry.operation || (entry.title || entry.body ? "create" : ""));
      if (op === "create") {
        const title = clip3(asText2(entry.title), REPORT_TITLE_MAX_CHARS);
        const body = clip3(String(entry.body ?? entry.text ?? "").replace(/\r\n/g, "\n").trim(), REPORT_BODY_MAX_CHARS);
        if (!title || !body) return null;
        const from = asText2(entry.from || entry.author || entry.sender);
        return {
          op: "create",
          reportId: asText2(entry.reportId || entry.id),
          title,
          body,
          visibleTo: nameList(entry.visibleTo ?? entry.recipients ?? entry.holders),
          ...from ? { from } : {},
          dateline: asText2(entry.dateline || entry.date)
        };
      }
      if (op === "share" || op === "update") {
        const reportId = asText2(entry.reportId || entry.id);
        const visibleTo = nameList(entry.visibleTo ?? entry.addVisibleTo ?? entry.recipients ?? entry.holders);
        if (!reportId || !visibleTo.length) return null;
        const from = asText2(entry.from || entry.sharedBy || entry.sender);
        return { op: "share", reportId, visibleTo, ...from ? { from } : {} };
      }
      return null;
    };
  }
});

// src/runtime/gmChanges.js
var GM_CHANGES_LIMIT, GM_CHANGE_SUMMARY_MAX_CHARS, REMINDERS_LIMIT, REMINDER_MAX_CHARS, GM_CHANGE_KINDS, clean15, array2, clip4, roundOf, hash, stableId, GM_CHANGE_ITEMS_LIMIT, ITEMS_SHOWN, ITEMS_TOKEN, renderItems, normalizeGmChange, normalizeGmChanges, KIND_LABELS, normalizeReminder, normalizeReminders;
var init_gmChanges = __esm({
  "src/runtime/gmChanges.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    GM_CHANGES_LIMIT = 64;
    GM_CHANGE_SUMMARY_MAX_CHARS = 280;
    REMINDERS_LIMIT = 12;
    REMINDER_MAX_CHARS = 600;
    GM_CHANGE_KINDS = Object.freeze([
      "gm-console",
      "territory",
      "groups",
      "puppets",
      "polity",
      "stats",
      "feature",
      "timeline",
      "history",
      "rollback",
      "reminder",
      "setting",
      "other"
    ]);
    clean15 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    array2 = (value) => Array.isArray(value) ? value : [];
    clip4 = (text3, max2) => {
      const value = clean15(text3);
      return value.length > max2 ? `${value.slice(0, max2 - 1).trimEnd()}\u2026` : value;
    };
    roundOf = (value) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.trunc(Number(value)) : 0;
    hash = (text3) => {
      let value = 2166136261;
      for (let index = 0; index < text3.length; index += 1) {
        value ^= text3.charCodeAt(index);
        value = Math.imul(value, 16777619) >>> 0;
      }
      return value.toString(36);
    };
    stableId = (prefix, ...parts) => `${prefix}-${hash(parts.map(clean15).join("|"))}`;
    GM_CHANGE_ITEMS_LIMIT = 40;
    ITEMS_SHOWN = 8;
    ITEMS_TOKEN = "{items}";
    renderItems = (items) => {
      const shown = items.slice(0, ITEMS_SHOWN).join(", ");
      return items.length > ITEMS_SHOWN ? `${shown} and ${items.length - ITEMS_SHOWN} more` : shown;
    };
    normalizeGmChange = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const kind = GM_CHANGE_KINDS.includes(clean15(entry.kind)) ? clean15(entry.kind) : "other";
      const at = clean15(entry.at);
      const round5 = roundOf(entry.round);
      const group = clean15(entry.group);
      const template = clean15(entry.template);
      const items = [...new Set(array2(entry.items).map(clean15).filter(Boolean))].slice(0, GM_CHANGE_ITEMS_LIMIT);
      const grouped = Boolean(group && template.includes(ITEMS_TOKEN) && items.length);
      const summary = clip4(grouped ? template.split(ITEMS_TOKEN).join(renderItems(items)) : entry.summary, GM_CHANGE_SUMMARY_MAX_CHARS);
      if (!summary) return null;
      return {
        id: clean15(entry.id) || stableId("gm-change", kind, grouped ? `${group}|${round5}|${items[0]}` : summary, round5, at),
        kind,
        summary,
        round: round5,
        date: clean15(entry.date),
        at,
        ...grouped ? { group, template, items } : {}
      };
    };
    normalizeGmChanges = (list12) => {
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const entry of array2(list12)) {
        const normalized = normalizeGmChange(entry);
        if (!normalized || seen.has(normalized.id)) continue;
        seen.add(normalized.id);
        out.push(normalized);
        if (out.length >= GM_CHANGES_LIMIT) break;
      }
      return out;
    };
    KIND_LABELS = Object.freeze({
      "gm-console": "GM console",
      territory: "territory",
      groups: "groups",
      puppets: "puppet states",
      polity: "country editor",
      stats: "statistics",
      feature: "map features",
      timeline: "event editor",
      history: "history document",
      rollback: "rollback",
      reminder: "reminder",
      setting: "setting",
      other: "other"
    });
    normalizeReminder = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const text3 = String(entry.text ?? "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter((line, index, lines) => line || index > 0 && lines[index - 1]).join("\n").trim().slice(0, REMINDER_MAX_CHARS);
      if (!text3) return null;
      const at = clean15(entry.at);
      const round5 = roundOf(entry.round);
      return {
        // Made once, when the reminder is issued, and stored with it from then on:
        // an edited reminder keeps the id it was given.
        id: clean15(entry.id) || stableId("reminder", round5, at, text3),
        text: text3,
        round: round5,
        date: clean15(entry.date),
        at
      };
    };
    normalizeReminders = (list12) => {
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const entry of array2(list12)) {
        const normalized = normalizeReminder(entry);
        if (!normalized || seen.has(normalized.id)) continue;
        seen.add(normalized.id);
        out.push(normalized);
      }
      return out.slice(-REMINDERS_LIMIT);
    };
  }
});

// src/runtime/playerGoal.js
var PLAYER_GOAL_MAX_CHARS, asText3, normalizePlayerGoals;
var init_playerGoal = __esm({
  "src/runtime/playerGoal.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    PLAYER_GOAL_MAX_CHARS = 600;
    asText3 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    normalizePlayerGoals = (value) => {
      const out = {};
      if (!value || typeof value !== "object" || Array.isArray(value)) return out;
      for (const [polity, entry] of Object.entries(value)) {
        const name = asText3(polity);
        const text3 = asText3(typeof entry === "string" ? entry : entry?.text).slice(0, PLAYER_GOAL_MAX_CHARS);
        if (!name || !text3) continue;
        const round5 = Number(entry?.round);
        out[name] = {
          text: text3,
          ...Number.isFinite(round5) && round5 > 0 ? { round: round5 } : {},
          ...asText3(entry?.date) ? { date: asText3(entry.date) } : {}
        };
      }
      return out;
    };
  }
});

// src/runtime/spycraft.js
var COLLECTION_FOCI, OPERATION_KINDS, OPERATION_OUTCOMES, OPERATION_INSTRUCTIONS_MAX, MAX_ASSETS, MAX_OPERATIONS_KEPT, oneLine, normalizeMission, normalizeAssets, normalizeOperationRecord, normalizeOperationRecords, spyTasking, SPY_OP_KINDS, normalizeSpyOp;
var init_spycraft = __esm({
  "src/runtime/spycraft.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    COLLECTION_FOCI = ["diplomacy", "military", "research", "economy", "politics"];
    OPERATION_KINDS = ["sabotage", "recruit", "assassinate", "operation"];
    OPERATION_OUTCOMES = ["success", "failure", "foiled"];
    OPERATION_INSTRUCTIONS_MAX = 300;
    MAX_ASSETS = 3;
    MAX_OPERATIONS_KEPT = 8;
    oneLine = (value, max2 = OPERATION_INSTRUCTIONS_MAX) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max2);
    normalizeMission = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const kind = String(value.kind ?? "").trim().toLowerCase();
      const instructions = oneLine(value.instructions);
      if (!OPERATION_KINDS.includes(kind) || !instructions) return null;
      return { kind, instructions, orderedAt: String(value.orderedAt ?? "").trim() };
    };
    normalizeAssets = (list12) => (Array.isArray(list12) ? list12 : []).map((entry) => {
      const who = oneLine(entry?.who ?? entry);
      return who ? { who, recruitedAt: String(entry?.recruitedAt ?? "").trim() } : null;
    }).filter(Boolean).slice(-MAX_ASSETS);
    normalizeOperationRecord = (entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const kind = String(entry.kind ?? "").trim().toLowerCase();
      const outcome = String(entry.outcome ?? "").trim().toLowerCase();
      if (!OPERATION_KINDS.includes(kind) || !OPERATION_OUTCOMES.includes(outcome)) return null;
      const caught = entry.caught === true;
      return {
        id: String(entry.id ?? "").trim(),
        kind,
        instructions: oneLine(entry.instructions),
        date: String(entry.date ?? "").trim(),
        round: Number.isFinite(Number(entry.round)) ? Number(entry.round) : 0,
        outcome,
        caught,
        identified: caught && entry.identified === true
      };
    };
    normalizeOperationRecords = (list12) => (Array.isArray(list12) ? list12 : []).map(normalizeOperationRecord).filter(Boolean).slice(-MAX_OPERATIONS_KEPT);
    spyTasking = (entry) => {
      const focus = COLLECTION_FOCI.includes(entry?.focus) ? entry.focus : "diplomacy";
      const mission = normalizeMission(entry?.mission);
      const assets = normalizeAssets(entry?.assets);
      const operations = normalizeOperationRecords(entry?.operations);
      return {
        ...focus !== "diplomacy" ? { focus } : {},
        ...mission ? { mission } : {},
        ...assets.length ? { assets } : {},
        ...operations.length ? { operations } : {},
        ...entry?.identified === false ? { identified: false } : {}
      };
    };
    SPY_OP_KINDS = ["deploy", "recall"];
    normalizeSpyOp = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const op = String(entry.op ?? "").trim().toLowerCase();
      const target = String(entry.target ?? entry.country ?? entry.polity ?? "").trim();
      if (!SPY_OP_KINDS.includes(op) || !target) return null;
      const coverStory = String(entry.coverStory ?? "").trim();
      const note = String(entry.note ?? "").trim();
      return { op, target, ...coverStory ? { coverStory } : {}, ...note ? { note } : {} };
    };
  }
});

// src/runtime/interactiveOffer.js
var INTERACTIVE_OFFER_CHANCE, text2, whole, normalizeInteractiveOffer;
var init_interactiveOffer = __esm({
  "src/runtime/interactiveOffer.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_spycraft();
    INTERACTIVE_OFFER_CHANCE = 1 / 4;
    text2 = (value) => String(value ?? "").trim();
    whole = (value) => Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;
    normalizeInteractiveOffer = (value) => {
      if (!value || typeof value !== "object") return null;
      const eventId = text2(value.eventId);
      return eventId ? { eventId, round: whole(value.round) } : null;
    };
  }
});

// src/runtime/chatThreads.js
var CHAT_EVENT_KINDS, DEMAND_ANSWERS, DEMAND_SUMMARY_MAX_CHARS, DEMAND_ALTERNATIVE_MAX_CHARS, DEMAND_SETTLED, DEMAND_ANSWERABLE, CHAT_EVENTS_LIMIT, POLL_OPTION_LIMIT, POLL_QUESTION_MAX_CHARS, POLL_LABEL_MAX_CHARS, asArray2, asText4, clip5, fold10, sequence, mintId, normalizeMember, sameMember, normalizeChatEvent, normalizeChatEvents, projectChatThread, contentId, withUnloggedMessages;
var init_chatThreads = __esm({
  "src/runtime/chatThreads.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    CHAT_EVENT_KINDS = Object.freeze([
      "chat_created",
      "member_joined",
      "member_left",
      "title_changed",
      "message",
      "reaction",
      "poll_created",
      "poll_option_added",
      "poll_vote_cast",
      // A demand an Overlord makes of its own Puppet, and each answer to it, in the
      // one-on-one thread between them (see "Demands" below).
      "demand_made",
      "demand_answered"
    ]);
    DEMAND_ANSWERS = Object.freeze(["accepted", "refused", "alternative", "alternative_accepted"]);
    DEMAND_SUMMARY_MAX_CHARS = 240;
    DEMAND_ALTERNATIVE_MAX_CHARS = 600;
    DEMAND_SETTLED = /* @__PURE__ */ new Set(["accepted", "refused", "settled", "superseded"]);
    DEMAND_ANSWERABLE = /* @__PURE__ */ new Set(["open", "refused"]);
    CHAT_EVENTS_LIMIT = 600;
    POLL_OPTION_LIMIT = 10;
    POLL_QUESTION_MAX_CHARS = 500;
    POLL_LABEL_MAX_CHARS = 120;
    asArray2 = (value) => Array.isArray(value) ? value : [];
    asText4 = (value) => String(value ?? "").trim();
    clip5 = (text3, max2) => text3.length > max2 ? `${text3.slice(0, max2 - 1)}\u2026` : text3;
    fold10 = (value) => asText4(value).toLowerCase();
    sequence = 0;
    mintId = (prefix) => {
      sequence += 1;
      return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
    };
    normalizeMember = (value) => {
      if (!value) return null;
      if (typeof value === "string") {
        const name2 = asText4(value);
        return name2 ? { code: "", name: name2 } : null;
      }
      if (typeof value !== "object") return null;
      const name = asText4(value.name ?? value.label ?? value.country);
      const code = asText4(value.code ?? value.id);
      if (!name && !code) return null;
      const polityKey = asText4(value.polityKey);
      return { code, name: name || code, ...polityKey ? { polityKey } : {} };
    };
    sameMember = (left, right) => Boolean(asText4(left?.polityKey)) && fold10(left?.polityKey) === fold10(right?.polityKey) || fold10(left?.name) === fold10(right?.name) || Boolean(asText4(left?.code)) && fold10(left?.code) === fold10(right?.code);
    normalizeChatEvent = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") return null;
      const kind = fold10(entry.kind ?? entry.type);
      if (!CHAT_EVENT_KINDS.includes(kind)) return null;
      const base = {
        id: asText4(entry.id) || `chat-event-${index + 1}`,
        kind,
        // In-game date, as messages have always carried.
        time: asText4(entry.time ?? entry.date),
        // Who did it: a polity name, or "" for the engine/system.
        by: asText4(entry.by ?? entry.actor ?? entry.speaker)
      };
      if (kind === "chat_created") {
        return { ...base, title: asText4(entry.title), source: asText4(entry.source) || "manual", linkedEventId: asText4(entry.linkedEventId) };
      }
      if (kind === "member_joined" || kind === "member_left") {
        const member = normalizeMember(entry.member ?? entry.country ?? entry.target);
        return member ? { ...base, member } : null;
      }
      if (kind === "title_changed") {
        const title = asText4(entry.title);
        return title ? { ...base, title } : null;
      }
      if (kind === "message") {
        const text3 = asText4(entry.text ?? entry.message ?? entry.content);
        if (!text3) return null;
        return {
          ...base,
          role: asText4(entry.role) || (base.by ? "leader" : "system"),
          code: asText4(entry.code),
          text: text3,
          memorySummary: asText4(entry.memorySummary),
          // A turn's own message: shown when this event is revealed
          // (runtime/unseenEvents.js).
          ...asText4(entry.eventId) ? { eventId: asText4(entry.eventId) } : {},
          // The catch-up the player's message was sent with
          // (AI/conversationCatchUp.js buildThreadCatchUp).
          ...asText4(entry.catchUp) ? { catchUp: asText4(entry.catchUp), ...asText4(entry.catchUpLabel) ? { catchUpLabel: asText4(entry.catchUpLabel) } : {} } : {}
        };
      }
      if (kind === "reaction") {
        const emoji = asText4(entry.emoji);
        const target = asText4(entry.target ?? entry.targetId ?? entry.messageId);
        return emoji && target ? { ...base, target, emoji, code: asText4(entry.code) } : null;
      }
      if (kind === "poll_created") {
        const pollId2 = asText4(entry.pollId ?? entry.id);
        const question = clip5(asText4(entry.question), POLL_QUESTION_MAX_CHARS);
        const options = asArray2(entry.options).map((option, optionIndex) => ({
          id: asText4(option?.id ?? option?.optionId) || `option-${optionIndex + 1}`,
          label: clip5(asText4(option?.label ?? option), POLL_LABEL_MAX_CHARS)
        })).filter((option) => option.label).slice(0, POLL_OPTION_LIMIT);
        if (!pollId2 || !question || options.length < 2) return null;
        return { ...base, pollId: pollId2, question, options, allowCustom: entry.allowCustom === true };
      }
      if (kind === "poll_option_added") {
        const pollId2 = asText4(entry.pollId);
        const label = clip5(asText4(entry.label), POLL_LABEL_MAX_CHARS);
        return pollId2 && label ? { ...base, pollId: pollId2, optionId: asText4(entry.optionId) || mintId("option"), label } : null;
      }
      if (kind === "demand_made") {
        const demandId = asText4(entry.demandId);
        const target = asText4(entry.target);
        const summary = clip5(asText4(entry.summary), DEMAND_SUMMARY_MAX_CHARS);
        if (!demandId || !base.by || !target || !summary) return null;
        return {
          ...base,
          demandId,
          target,
          summary,
          ...asText4(entry.messageId) ? { messageId: asText4(entry.messageId) } : {},
          ...asText4(entry.supersedes) ? { supersedes: asText4(entry.supersedes) } : {}
        };
      }
      if (kind === "demand_answered") {
        const demandId = asText4(entry.demandId);
        const answer = fold10(entry.answer);
        if (!demandId || !base.by || !DEMAND_ANSWERS.includes(answer)) return null;
        const text3 = clip5(asText4(entry.text), DEMAND_ALTERNATIVE_MAX_CHARS);
        if (answer === "alternative" && !text3) return null;
        return { ...base, demandId, answer, ...text3 ? { text: text3 } : {} };
      }
      const pollId = asText4(entry.pollId);
      const optionId = asText4(entry.optionId);
      return pollId && optionId && base.by ? { ...base, pollId, optionId } : null;
    };
    normalizeChatEvents = (events) => {
      const seen = /* @__PURE__ */ new Set();
      const list12 = [];
      asArray2(events).forEach((entry, index) => {
        const event = normalizeChatEvent(entry, index);
        if (!event || seen.has(event.id)) return;
        seen.add(event.id);
        list12.push(event);
      });
      if (list12.length <= CHAT_EVENTS_LIMIT) return list12;
      const structural = /* @__PURE__ */ new Set(["chat_created", "member_joined", "member_left", "title_changed"]);
      const keep = list12.filter((event) => structural.has(event.kind));
      const rest = list12.filter((event) => !structural.has(event.kind)).slice(-(CHAT_EVENTS_LIMIT - keep.length));
      return list12.filter((event) => keep.includes(event) || rest.includes(event));
    };
    projectChatThread = (events) => {
      const log = normalizeChatEvents(events);
      let title = "";
      let source = "manual";
      let linkedEventId = "";
      const members = [];
      const messages = [];
      const messageById = /* @__PURE__ */ new Map();
      const polls = /* @__PURE__ */ new Map();
      const demands = /* @__PURE__ */ new Map();
      for (const event of log) {
        if (event.kind === "chat_created") {
          title = event.title || title;
          source = event.source || source;
          linkedEventId = event.linkedEventId || linkedEventId;
          continue;
        }
        if (event.kind === "title_changed") {
          title = event.title;
          continue;
        }
        if (event.kind === "member_joined") {
          if (!members.some((member) => sameMember(member, event.member))) members.push({ ...event.member });
          continue;
        }
        if (event.kind === "member_left") {
          const index = members.findIndex((member) => sameMember(member, event.member));
          if (index >= 0) members.splice(index, 1);
          continue;
        }
        if (event.kind === "message") {
          const message = {
            id: event.id,
            code: event.code,
            role: event.role,
            speaker: event.by,
            text: event.text,
            time: event.time,
            memorySummary: event.memorySummary,
            reactions: {},
            // Who was in the room when this was said (E5): a member added
            // later did not hear it, and must not be written as though it did.
            heardBy: members.map((member) => member.name),
            ...event.eventId ? { eventId: event.eventId } : {},
            ...event.catchUp ? { catchUp: event.catchUp, ...event.catchUpLabel ? { catchUpLabel: event.catchUpLabel } : {} } : {}
          };
          messages.push(message);
          messageById.set(event.id, message);
          continue;
        }
        if (event.kind === "reaction") {
          const message = messageById.get(event.target);
          if (message && event.by) {
            let key = event.by;
            let suffix = 2;
            while (Object.prototype.hasOwnProperty.call(message.reactions, key)) {
              key = `${event.by}#${suffix}`;
              suffix += 1;
            }
            message.reactions[key] = {
              emoji: event.emoji,
              code: event.code,
              ...key === event.by ? {} : { country: event.by }
            };
          }
          continue;
        }
        if (event.kind === "poll_created") {
          polls.set(event.pollId, {
            id: event.pollId,
            question: event.question,
            options: event.options.map((option) => ({ ...option })),
            allowCustom: event.allowCustom,
            openedBy: event.by,
            time: event.time,
            votes: {}
          });
          continue;
        }
        if (event.kind === "poll_option_added") {
          const poll2 = polls.get(event.pollId);
          if (poll2 && poll2.options.length < POLL_OPTION_LIMIT && !poll2.options.some((option) => option.id === event.optionId)) {
            poll2.options.push({ id: event.optionId, label: event.label });
          }
          continue;
        }
        if (event.kind === "demand_made") {
          const replaced = event.supersedes ? demands.get(event.supersedes) : null;
          if (replaced && !DEMAND_SETTLED.has(replaced.status)) {
            replaced.status = "superseded";
            replaced.supersededBy = event.demandId;
          }
          if (!demands.has(event.demandId)) {
            demands.set(event.demandId, {
              id: event.demandId,
              by: event.by,
              target: event.target,
              summary: event.summary,
              messageId: event.messageId || "",
              time: event.time,
              status: "open",
              alternative: "",
              ...event.supersedes ? { supersedes: event.supersedes } : {}
            });
          }
          continue;
        }
        if (event.kind === "demand_answered") {
          const demand = demands.get(event.demandId);
          if (!demand) continue;
          const byPuppet = fold10(event.by) === fold10(demand.target);
          const byOverlord = fold10(event.by) === fold10(demand.by);
          if (event.answer === "alternative_accepted") {
            if (byOverlord && demand.status === "countered") demand.status = "settled";
            continue;
          }
          if (!byPuppet || !DEMAND_ANSWERABLE.has(demand.status)) continue;
          if (event.answer === "alternative") {
            demand.status = "countered";
            demand.alternative = event.text;
          } else {
            demand.status = event.answer;
          }
          demand.answeredAt = event.time;
          continue;
        }
        const poll = polls.get(event.pollId);
        if (!poll || poll.votes[event.by] || !poll.options.some((option) => option.id === event.optionId)) continue;
        poll.votes[event.by] = event.optionId;
      }
      return {
        title,
        source,
        linkedEventId,
        countries: members,
        messages,
        polls: [...polls.values()].map((poll) => ({
          ...poll,
          tally: poll.options.map((option) => ({
            ...option,
            votes: Object.values(poll.votes).filter((optionId) => optionId === option.id).length
          }))
        })),
        demands: [...demands.values()]
      };
    };
    contentId = (text3) => {
      let value = 2166136261;
      for (let index = 0; index < text3.length; index += 1) {
        value ^= text3.charCodeAt(index);
        value = Math.imul(value, 16777619) >>> 0;
      }
      return value.toString(36);
    };
    withUnloggedMessages = (events, messages, { threadId = "" } = {}) => {
      const log = normalizeChatEvents(events);
      if (!log.length) return log;
      const logged = projectChatThread(log).messages;
      const ids = new Set(logged.map((message) => asText4(message.id)).filter(Boolean));
      const said = new Set(logged.map((message) => `${fold10(message.speaker)}|${asText4(message.text)}`));
      const claimed = new Set(asArray2(messages).map((message) => asText4(message?.id)).filter(Boolean));
      const unclaimed = /* @__PURE__ */ new Map();
      for (const message of logged) {
        if (claimed.has(asText4(message.id))) continue;
        const key = `${fold10(message.speaker)}|${asText4(message.text)}`;
        unclaimed.set(key, (unclaimed.get(key) ?? 0) + 1);
      }
      const additions = [];
      for (const message of asArray2(messages)) {
        const role = asText4(message?.role ?? message?.sender);
        if (role === "error") continue;
        const text3 = asText4(message?.text ?? message?.message ?? message?.content);
        if (!text3) continue;
        const speaker = asText4(message?.speaker ?? message?.senderName);
        const id = asText4(message?.id);
        const key = `${fold10(speaker)}|${text3}`;
        if (id) {
          if (ids.has(id)) continue;
          const left = unclaimed.get(key) ?? 0;
          if (left > 0) {
            unclaimed.set(key, left - 1);
            continue;
          }
        } else if (said.has(key)) continue;
        said.add(key);
        additions.push({
          id: id || `${asText4(threadId) || "chat"}-unlogged-${contentId(`${key}|${asText4(message?.time)}`)}`,
          kind: "message",
          time: asText4(message?.time ?? message?.date),
          by: speaker,
          role: role || (speaker ? "leader" : "system"),
          code: asText4(message?.code),
          text: text3,
          memorySummary: asText4(message?.memorySummary ?? message?.diplomaticMemorySummary),
          eventId: asText4(message?.eventId),
          catchUp: asText4(message?.catchUp),
          catchUpLabel: asText4(message?.catchUpLabel)
        });
      }
      return additions.length ? normalizeChatEvents([...log, ...additions]) : log;
    };
  }
});

// src/runtime/unseenEvents.js
var asArray3, asText5, UNSEEN_EVENTS_KEY, TURNS_KEPT, createMemoryStorage2, fallbackMemory2, resolveStorage2, liveStorage2, readState, writeState, idsOf, latestTurnEventIds, unseenIn, withTurnUnseen, withSeenThrough, UNSEEN_EVENTS_CHANGED, announce2, createUnseenEvents, unseenEvents;
var init_unseenEvents = __esm({
  "src/runtime/unseenEvents.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    asArray3 = (value) => Array.isArray(value) ? value : [];
    asText5 = (value) => String(value ?? "").trim();
    UNSEEN_EVENTS_KEY = "oh_unseen_turn_events";
    TURNS_KEPT = 6;
    createMemoryStorage2 = (initial = {}) => {
      const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
      return {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => {
          values.set(key, String(value));
        },
        removeItem: (key) => {
          values.delete(key);
        }
      };
    };
    fallbackMemory2 = createMemoryStorage2();
    resolveStorage2 = () => {
      try {
        if (typeof localStorage !== "undefined" && localStorage) return localStorage;
      } catch {
      }
      return fallbackMemory2;
    };
    liveStorage2 = {
      getItem: (key) => resolveStorage2().getItem(key),
      setItem: (key, value) => resolveStorage2().setItem(key, value)
    };
    readState = (storage) => {
      try {
        const raw = JSON.parse(storage.getItem(UNSEEN_EVENTS_KEY) ?? "null");
        return {
          turns: asArray3(raw?.turns).map((turn) => ({ key: asText5(turn?.key), unseen: asArray3(turn?.unseen).map(asText5).filter(Boolean) })).filter((turn) => turn.key)
        };
      } catch {
        return { turns: [] };
      }
    };
    writeState = (storage, state) => {
      try {
        storage.setItem(UNSEEN_EVENTS_KEY, JSON.stringify(state));
      } catch {
      }
    };
    idsOf = (turnEventIds) => asArray3(turnEventIds).map(asText5).filter(Boolean);
    latestTurnEventIds = (world) => idsOf(world?.simulationHistory?.[0]?.eventIds);
    unseenIn = (state, turnEventIds) => {
      const ids = idsOf(turnEventIds);
      if (!ids.length) return /* @__PURE__ */ new Set();
      const entry = asArray3(state?.turns).find((turn) => turn.key === ids[0]);
      if (!entry) return /* @__PURE__ */ new Set();
      const inTurn = new Set(ids);
      return new Set(entry.unseen.filter((id) => inTurn.has(id)));
    };
    withTurnUnseen = (state, turnEventIds, { shown = 1 } = {}) => {
      const ids = idsOf(turnEventIds);
      if (!ids.length) return state;
      const rest = asArray3(state?.turns).filter((turn) => turn.key !== ids[0]);
      return { turns: [{ key: ids[0], unseen: ids.slice(Math.max(0, shown)) }, ...rest].slice(0, TURNS_KEPT) };
    };
    withSeenThrough = (state, turnEventIds, count4) => {
      const ids = idsOf(turnEventIds);
      const entry = ids.length ? asArray3(state?.turns).find((turn) => turn.key === ids[0]) : null;
      if (!entry) return state;
      const seen = new Set(ids.slice(0, Math.max(0, count4)));
      const unseen = entry.unseen.filter((id) => !seen.has(id));
      if (unseen.length === entry.unseen.length) return state;
      return { turns: state.turns.map((turn) => turn === entry ? { ...turn, unseen } : turn) };
    };
    UNSEEN_EVENTS_CHANGED = "oh:unseen-events-changed";
    announce2 = () => {
      try {
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof Event === "function") {
          window.dispatchEvent(new Event(UNSEEN_EVENTS_CHANGED));
        }
      } catch {
      }
    };
    createUnseenEvents = ({ storage = liveStorage2, onChange = announce2 } = {}) => {
      const change = (next) => {
        writeState(storage, next);
        try {
          onChange();
        } catch {
        }
      };
      return {
        // What of the world's newest turn the player has not been shown.
        unseenFor: (world) => unseenIn(readState(storage), latestTurnEventIds(world)),
        unseenInTurn: (turnEventIds) => unseenIn(readState(storage), turnEventIds),
        markTurnUnseen: (turnEventIds, options) => change(withTurnUnseen(readState(storage), turnEventIds, options)),
        markSeenThrough: (turnEventIds, count4) => {
          const before = readState(storage);
          const next = withSeenThrough(before, turnEventIds, count4);
          if (next !== before) change(next);
        },
        // An undo or an Intervene: whatever was left of the reveal no longer exists.
        clear: () => change({ turns: [] })
      };
    };
    unseenEvents = createUnseenEvents();
  }
});

// src/runtime/institutionLogos.js
var clean16, BUILTIN_INSTITUTION_LOGOS, isAllowedLogoUrl, normalizeInstitutionLogoUrl;
var init_institutionLogos = __esm({
  "src/runtime/institutionLogos.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    clean16 = (value) => String(value ?? "").trim();
    BUILTIN_INSTITUTION_LOGOS = Object.freeze({
      eu: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg",
      nato: "https://upload.wikimedia.org/wikipedia/commons/3/37/Flag_of_NATO.svg",
      csto: "https://upload.wikimedia.org/wikipedia/commons/3/39/Emblem_of_the_Collective_Security_Treaty_Organization.svg",
      cis: "https://upload.wikimedia.org/wikipedia/commons/4/49/Emblem_of_CIS.svg",
      visegrad: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Visegr%C3%A1d_Group_logo.svg",
      asean: "https://asean.org/wp-content/uploads/2024/11/ASEAN-Emblem-300x300.png",
      au: "https://upload.wikimedia.org/wikipedia/commons/5/51/Flag_of_the_African_Union.svg",
      gcc: "https://upload.wikimedia.org/wikipedia/commons/2/29/Emblem_GCC.svg",
      osce: "https://upload.wikimedia.org/wikipedia/commons/3/34/OSCE_logo.svg",
      un: "https://upload.wikimedia.org/wikipedia/commons/5/52/Emblem_of_the_United_Nations.svg",
      "arab-league": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Emblem_of_the_Arab_League.svg",
      // BRICS did not have one timeless permanent emblem in 2014. The Fault Lines
      // save is in July 2014, so use the official Fortaleza summit mark from that
      // month's sixth BRICS summit rather than inventing a generic BRICS badge.
      brics: "https://upload.wikimedia.org/wikipedia/en/d/da/2014_BRICS_summit_logo.png",
      // The compact emblem used by the SCO itself. This file is hosted on Chinese
      // Wikipedia and reproduces the official Chinese/Russian circular emblem.
      sco: "https://upload.wikimedia.org/wikipedia/zh/9/9a/Shanghai_Cooperation_Organisation_(SECTSCO).svg",
      opec: "https://upload.wikimedia.org/wikipedia/commons/3/3f/OPEC_Logo.svg",
      oecd: "https://upload.wikimedia.org/wikipedia/commons/a/a2/OECD_logo.svg",
      wto: "https://upload.wikimedia.org/wikipedia/commons/5/59/WTO_Logo.svg",
      mercosur: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Mercosur.svg"
    });
    isAllowedLogoUrl = (value) => {
      const url = clean16(value);
      if (!url || url.length > 2400) return false;
      if (/^data:image\/(?:png|jpe?g|webp|gif);/i.test(url)) return true;
      if (/^https?:\/\//i.test(url)) return true;
      if (/^(?:\/|\.\.?\/)/.test(url)) return true;
      if (/^[a-z0-9][a-z0-9_./%+@() -]*\.(?:svg|png|jpe?g|webp|gif)(?:[?#].*)?$/i.test(url)) return true;
      return false;
    };
    normalizeInstitutionLogoUrl = (value) => {
      const url = clean16(value);
      return isAllowedLogoUrl(url) ? url.slice(0, 2400) : "";
    };
  }
});

// src/runtime/stableId.js
var clean17, hash53, stableAsciiId;
var init_stableId = __esm({
  "src/runtime/stableId.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    clean17 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    hash53 = (value) => {
      let h1 = 3735928559;
      let h2 = 1103547991;
      const text3 = String(value ?? "");
      for (let index = 0; index < text3.length; index += 1) {
        const code = text3.charCodeAt(index);
        h1 = Math.imul(h1 ^ code, 2654435761);
        h2 = Math.imul(h2 ^ code, 1597334677);
      }
      h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
      h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
      return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    };
    stableAsciiId = (value, { maxLength = 72 } = {}) => {
      const folded = clean17(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
      const legacy = folded.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (legacy) return legacy.slice(0, Math.max(1, maxLength));
      if (!/[\p{L}\p{N}]/u.test(folded)) return "";
      return `u-${hash53(folded)}`.slice(0, Math.max(1, maxLength));
    };
  }
});

// src/runtime/institutions.js
var INSTITUTIONS_SCHEMA_VERSION, clean18, lower, array3, clone, slug, unique, normalizeInstitutionPredecessor, normalizeInstitutionPredecessors, canonicalInstitutionIdentity, INSTITUTION_STATUSES, INSTITUTION_STATUS_SET, NON_FOUNDING_MEMBER_STATUSES, institutionFoundingMemberCount, institutionFoundingThreshold, institutionFoundingThresholdReached, INSTITUTION_KINDS, INSTITUTION_KIND_SET, INSTITUTION_MEMBER_STATUSES, MEMBER_STATUS_SET, INSTITUTION_MEMBER_ROLES, MEMBER_ROLE_SET, INSTITUTION_LIFECYCLE_CASE_KINDS, LIFECYCLE_CASE_KIND_SET, INSTITUTION_LIFECYCLE_CASE_STATUSES, LIFECYCLE_CASE_STATUS_SET, INSTITUTION_LIFECYCLE_DECISIONS, LIFECYCLE_DECISION_SET, INSTITUTION_VOTING_RULE_TYPES, VOTING_RULE_TYPE_SET, INSTITUTION_ABSTENTION_POLICIES, ABSTENTION_POLICY_SET, INSTITUTION_PROPOSAL_STATUSES, PROPOSAL_STATUS_SET, INSTITUTION_CONSEQUENCE_KINDS, INSTITUTION_CONSEQUENCE_KIND_SET, CONSEQUENCE_KIND_ALIASES, consequenceKind, CONSEQUENCE_PATCH_KEYS, boundedPlainObject, normalizeInstitutionProposalConsequence, hasExactPolityKey, canonicalPolity, boundedFraction, normalizeInstitutionVotingRuleType, normalizeInstitutionVotingRule, normalizeInstitutionLifecycleRule, normalizeInstitutionLifecycleRules, normalizeInstitutionLifecycleCase, normalizeInstitutionLifecycleCases, normalizeInstitutionMembershipHistoryEntry, normalizeInstitutionMembershipHistory, normalizeInstitutionCharter, normalizeProposalAmendment, normalizeProposalBallot, normalizeInstitutionProposal, normalizeInstitutionProposals, normalizeMember2, normalizeInstitutionRecord, normalizeInstitutions;
var init_institutions = __esm({
  "src/runtime/institutions.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_polityIdentity();
    init_institutionLogos();
    init_gameDates();
    init_stableId();
    INSTITUTIONS_SCHEMA_VERSION = 1;
    clean18 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    lower = (value) => clean18(value).toLocaleLowerCase();
    array3 = (value) => Array.isArray(value) ? value : [];
    clone = (value) => {
      if (value == null || typeof value !== "object") return value;
      if (typeof structuredClone === "function") return structuredClone(value);
      return JSON.parse(JSON.stringify(value));
    };
    slug = (value) => stableAsciiId(value, { maxLength: 72 });
    unique = (values, limit = 128) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const raw of array3(values)) {
        const value = clean18(raw);
        const key = lower(value);
        if (!value || seen.has(key)) continue;
        seen.add(key);
        out.push(value);
        if (out.length >= limit) break;
      }
      return out;
    };
    normalizeInstitutionPredecessor = (value = {}, fallbackId = "") => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const id = slug(value.id || value.predecessorId || value.name || value.shortName || fallbackId);
      const name = clean18(value.name || value.predecessorName || value.shortName || id);
      if (!id || !name) return null;
      return {
        id,
        name,
        shortName: clean18(value.shortName).slice(0, 80),
        aliases: unique(value.aliases, 24),
        foundedDate: clean18(value.foundedDate || value.fromDate),
        dissolvedDate: clean18(value.dissolvedDate || value.untilDate),
        membershipContinuity: value.membershipContinuity === true,
        note: clean18(value.note).slice(0, 600)
      };
    };
    normalizeInstitutionPredecessors = (value = {}) => {
      const raw = Array.isArray(value) ? value : array3(value?.predecessors || value?.lineage || value?.institutionLineage);
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (let index = 0; index < raw.length; index += 1) {
        const predecessor = normalizeInstitutionPredecessor(raw[index], `predecessor-${index + 1}`);
        if (!predecessor || seen.has(predecessor.id)) continue;
        seen.add(predecessor.id);
        out.push(predecessor);
      }
      return out.slice(0, 16);
    };
    canonicalInstitutionIdentity = (institution = {}) => {
      const id = slug(institution?.id || institution?.name || institution?.shortName);
      const name = clean18(institution?.name || institution?.title || institution?.shortName || id);
      return {
        id,
        name,
        shortName: clean18(institution?.shortName).slice(0, 80),
        aliases: unique(institution?.aliases, 24),
        kind: lower(institution?.kind || institution?.type || "other").replace(/[\s-]+/g, "_"),
        foundedDate: clean18(institution?.foundedDate),
        dissolvedDate: clean18(institution?.dissolvedDate),
        predecessors: normalizeInstitutionPredecessors(institution),
        // Badge identity is explicit or abbreviation-derived. Core runtime never
        // infers a real-world organization from its storage id.
        badgeKey: slug(institution?.badgeKey || institution?.shortName),
        logoUrl: normalizeInstitutionLogoUrl(institution?.logoUrl || institution?.logo || institution?.emblemUrl || institution?.emblem),
        logoAsset: institution?.logoAsset === true,
        priority: Number.isFinite(Number(institution?.priority)) ? Number(institution.priority) : 0
      };
    };
    INSTITUTION_STATUSES = Object.freeze([
      "provisional",
      "active",
      "dormant",
      "dissolved"
    ]);
    INSTITUTION_STATUS_SET = new Set(INSTITUTION_STATUSES);
    NON_FOUNDING_MEMBER_STATUSES = /* @__PURE__ */ new Set(["observer", "candidate", "suspended"]);
    institutionFoundingMemberCount = (institution = {}) => array3(institution?.members).filter((member) => member && !NON_FOUNDING_MEMBER_STATUSES.has(lower(member?.status || "member"))).length;
    institutionFoundingThreshold = (institution = {}) => {
      const raw = Number(institution?.charter?.lifecycle?.minimumFoundingMembers);
      return Number.isFinite(raw) ? Math.max(1, Math.min(64, Math.trunc(raw))) : 1;
    };
    institutionFoundingThresholdReached = (institution = {}) => institutionFoundingMemberCount(institution) >= institutionFoundingThreshold(institution);
    INSTITUTION_KINDS = Object.freeze([
      "security_alliance",
      "defense_pact",
      "political_union",
      "economic_union",
      "regional_bloc",
      "international_organization",
      "consultative_group",
      "other"
    ]);
    INSTITUTION_KIND_SET = new Set(INSTITUTION_KINDS);
    INSTITUTION_MEMBER_STATUSES = Object.freeze([
      "member",
      "candidate",
      "associate",
      "participant",
      "observer",
      "suspended"
    ]);
    MEMBER_STATUS_SET = new Set(INSTITUTION_MEMBER_STATUSES);
    INSTITUTION_MEMBER_ROLES = Object.freeze([
      "leader",
      "leading-member",
      "member"
    ]);
    MEMBER_ROLE_SET = new Set(INSTITUTION_MEMBER_ROLES);
    INSTITUTION_LIFECYCLE_CASE_KINDS = Object.freeze([
      "founding-invitation",
      "invitation",
      "application",
      "withdrawal",
      "expulsion",
      "suspension",
      "reinstate",
      "dissolution"
    ]);
    LIFECYCLE_CASE_KIND_SET = new Set(INSTITUTION_LIFECYCLE_CASE_KINDS);
    INSTITUTION_LIFECYCLE_CASE_STATUSES = Object.freeze([
      "pending",
      "negotiating",
      "pending-approval",
      "accepted",
      "rejected",
      "withdrawn",
      "resolved",
      "expired"
    ]);
    LIFECYCLE_CASE_STATUS_SET = new Set(INSTITUTION_LIFECYCLE_CASE_STATUSES);
    INSTITUTION_LIFECYCLE_DECISIONS = Object.freeze([
      "accept",
      "reject",
      "seek-observer",
      "request-terms",
      "delay"
    ]);
    LIFECYCLE_DECISION_SET = new Set(INSTITUTION_LIFECYCLE_DECISIONS);
    INSTITUTION_VOTING_RULE_TYPES = Object.freeze([
      "unspecified",
      "unanimity",
      "consensus",
      "simple-majority",
      "two-thirds",
      "qualified-majority",
      "weighted"
    ]);
    VOTING_RULE_TYPE_SET = new Set(INSTITUTION_VOTING_RULE_TYPES);
    INSTITUTION_ABSTENTION_POLICIES = Object.freeze([
      "exclude",
      "count-against"
    ]);
    ABSTENTION_POLICY_SET = new Set(INSTITUTION_ABSTENTION_POLICIES);
    INSTITUTION_PROPOSAL_STATUSES = Object.freeze([
      "draft",
      "debate",
      "amendment",
      "formalized",
      "voting",
      "passed",
      "failed",
      "vetoed",
      "withdrawn",
      "implementation",
      "archived"
    ]);
    PROPOSAL_STATUS_SET = new Set(INSTITUTION_PROPOSAL_STATUSES);
    INSTITUTION_CONSEQUENCE_KINDS = Object.freeze([
      "declaration",
      "agreement",
      "institution-membership",
      "institution-charter",
      "institution-status",
      "shared-project",
      "deployment-authorization",
      "sanctions-authorization",
      "funding-authorization",
      "policy-commitment",
      "subordinate-institution",
      "custom"
    ]);
    INSTITUTION_CONSEQUENCE_KIND_SET = new Set(INSTITUTION_CONSEQUENCE_KINDS);
    CONSEQUENCE_KIND_ALIASES = Object.freeze({
      membership: "institution-membership",
      "institution-membership": "institution-membership",
      charter: "institution-charter",
      "institution-charter": "institution-charter",
      status: "institution-status",
      "institution-status": "institution-status",
      project: "shared-project",
      "institution-project": "shared-project",
      "shared-project": "shared-project",
      deployment: "deployment-authorization",
      deploy: "deployment-authorization",
      unit: "deployment-authorization",
      "military-deployment": "deployment-authorization",
      "deployment-authorization": "deployment-authorization",
      sanction: "sanctions-authorization",
      sanctions: "sanctions-authorization",
      "sanctions-authorization": "sanctions-authorization",
      funding: "funding-authorization",
      fund: "funding-authorization",
      budget: "funding-authorization",
      "funding-authorization": "funding-authorization",
      policy: "policy-commitment",
      commitment: "policy-commitment",
      "policy-commitment": "policy-commitment",
      institution: "subordinate-institution",
      "create-institution": "subordinate-institution",
      "subordinate-institution": "subordinate-institution",
      declaration: "declaration",
      resolution: "declaration",
      position: "declaration",
      agreement: "agreement",
      custom: "custom"
    });
    consequenceKind = (value) => {
      const raw = lower(value).replace(/[\s_]+/g, "-");
      const mapped = CONSEQUENCE_KIND_ALIASES[raw] || raw;
      return INSTITUTION_CONSEQUENCE_KIND_SET.has(mapped) ? mapped : "custom";
    };
    CONSEQUENCE_PATCH_KEYS = /* @__PURE__ */ new Set([
      "world",
      "worldpatch",
      "worldstate",
      "events",
      "eventids",
      "actions",
      "actionids",
      "chats",
      "politychanges",
      "unitops",
      "regiontransfers",
      "markerops",
      "oncomplete",
      "authorityref",
      "agency"
    ]);
    boundedPlainObject = (value, { maxKeys = 24, maxString = 1200, maxArray = 32 } = {}) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return {};
      const out = {};
      for (const [rawKey, rawValue] of Object.entries(value).slice(0, maxKeys)) {
        const key = clean18(rawKey).slice(0, 80);
        if (!key || CONSEQUENCE_PATCH_KEYS.has(lower(key).replace(/[^a-z0-9]/g, ""))) continue;
        if (typeof rawValue === "string") out[key] = clean18(rawValue).slice(0, maxString);
        else if (typeof rawValue === "number" && Number.isFinite(rawValue)) out[key] = rawValue;
        else if (typeof rawValue === "boolean" || rawValue == null) out[key] = rawValue;
        else if (Array.isArray(rawValue)) {
          out[key] = rawValue.slice(0, maxArray).map((entry) => {
            if (typeof entry === "string") return clean18(entry).slice(0, maxString);
            if (typeof entry === "number" && Number.isFinite(entry)) return entry;
            if (typeof entry === "boolean" || entry == null) return entry;
            return boundedPlainObject(entry, { maxKeys: 12, maxString: 600, maxArray: 12 });
          });
        } else if (typeof rawValue === "object") {
          out[key] = boundedPlainObject(rawValue, { maxKeys: 12, maxString: 600, maxArray: 12 });
        }
      }
      return out;
    };
    normalizeInstitutionProposalConsequence = (value = {}, index = 0, world = {}, identityIndex = null) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const requestedKind = lower(value.kind || value.type).replace(/[\s_]+/g, "-");
      const kind = consequenceKind(requestedKind);
      const id = slug(value.id || `${kind || "consequence"}-${index + 1}`) || `consequence-${index + 1}`;
      const note = clean18(value.note || value.summary || value.description).slice(0, 1200);
      const base = { id, kind, ...note ? { note } : {} };
      if (kind === "institution-membership") {
        return {
          ...base,
          institutionId: slug(value.institutionId),
          op: lower(value.op),
          polity: canonicalPolity(value.polity || value.country || value.member, world, identityIndex),
          status: MEMBER_STATUS_SET.has(lower(value.status)) ? lower(value.status) : clean18(value.status),
          role: MEMBER_ROLE_SET.has(lower(value.role)) ? lower(value.role) : clean18(value.role)
        };
      }
      if (kind === "institution-charter") {
        const patch = value.charterPatch || value.patch || value.payload || {};
        return { ...base, institutionId: slug(value.institutionId), charterPatch: boundedPlainObject(patch, { maxKeys: 12, maxString: 800, maxArray: 24 }) };
      }
      if (kind === "institution-status") {
        const status = lower(value.status);
        return { ...base, institutionId: slug(value.institutionId), status: INSTITUTION_STATUS_SET.has(status) ? status : clean18(value.status) };
      }
      if (kind === "agreement") {
        const source = value.payload && typeof value.payload === "object" && !Array.isArray(value.payload) ? { ...value, ...value.payload } : value;
        return {
          ...base,
          payload: {
            id: clean18(source.agreementId || source.payload?.id || (value.payload ? "" : source.id)).slice(0, 160),
            op: lower(source.op),
            type: lower(source.type || source.agreementType).replace(/[\s_]+/g, "-").slice(0, 80),
            parties: unique(source.parties, 24).map((polity) => canonicalPolity(polity, world, identityIndex)).filter(Boolean),
            title: clean18(source.title || source.name).slice(0, 240),
            terms: clean18(source.terms || source.summary || source.description).slice(0, 6e3)
          }
        };
      }
      if (kind === "shared-project") {
        const source = value.payload && typeof value.payload === "object" && !Array.isArray(value.payload) ? { ...value, ...value.payload } : value;
        return {
          ...base,
          payload: {
            id: clean18(source.projectId || source.payload?.id || (value.payload ? "" : source.id)).slice(0, 160),
            op: lower(source.op || "create"),
            name: clean18(source.name || source.title).slice(0, 240),
            kind: lower(source.projectKind || (source.kind === "operation" ? "operation" : "project")).slice(0, 80),
            summary: clean18(source.summary || source.description).slice(0, 6e3),
            ongoing: source.ongoing === true,
            targetDate: clean18(source.targetDate || source.dueDate).slice(0, 40),
            tags: unique(source.tags, 24),
            milestones: array3(source.milestones).slice(0, 32).map((entry) => boundedPlainObject(entry, { maxKeys: 12, maxString: 600, maxArray: 12 }))
          }
        };
      }
      const semanticPayload = value.payload && typeof value.payload === "object" && !Array.isArray(value.payload) ? value.payload : Object.fromEntries(Object.entries(value).filter(([key]) => !["id", "kind", "type", "note", "summary", "description"].includes(key)));
      return {
        ...base,
        ...kind === "custom" && requestedKind ? { requestedKind: requestedKind.slice(0, 80) } : {},
        payload: boundedPlainObject(semanticPayload, { maxKeys: 20, maxString: 1200, maxArray: 24 })
      };
    };
    hasExactPolityKey = (world, token) => Boolean(
      Object.prototype.hasOwnProperty.call(world?.polityOverrides || {}, token) || Object.prototype.hasOwnProperty.call(world?.politicalActors?.byPolity || {}, token) || Object.prototype.hasOwnProperty.call(world?.countryStats || {}, token) || Object.prototype.hasOwnProperty.call(world?.powerStatus?.byPolity || {}, token)
    );
    canonicalPolity = (value, world, identityIndex = null) => {
      const token = clean18(value);
      if (!token) return "";
      if (hasExactPolityKey(world || {}, token)) return token;
      const identity = resolvePolityIdentity(token, world || {}, {
        allowUnknown: true,
        requireActive: false,
        allowCoreMatch: true,
        allowStockBase: true,
        identityIndex
      });
      return clean18(identity?.resolved || token);
    };
    boundedFraction = (value, fallback = 0) => {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.max(0, Math.min(1, number));
    };
    normalizeInstitutionVotingRuleType = (value) => {
      const raw = lower(value || "unspecified").replace(/[\s_]+/g, "-");
      if (VOTING_RULE_TYPE_SET.has(raw)) return raw;
      const aliases = {
        "qmv": "qualified-majority",
        "qualified-majority-vote": "qualified-majority",
        "qualified-majority-voting": "qualified-majority",
        "simple-majority-vote": "simple-majority",
        "simple-majority-voting": "simple-majority",
        "majority": "simple-majority",
        "two-thirds-majority": "two-thirds",
        "two-third-majority": "two-thirds",
        "supermajority-two-thirds": "two-thirds",
        "unanimous": "unanimity",
        "unanimous-consent": "unanimity",
        "consensus-based": "consensus",
        "consensus-decision": "consensus",
        "weighted-vote": "weighted",
        "weighted-voting": "weighted"
      };
      return aliases[raw] || "unspecified";
    };
    normalizeInstitutionVotingRule = (value = {}, world = {}, identityIndex = null) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const type = normalizeInstitutionVotingRuleType(source.type || source.rule || source.mode || "unspecified");
      const defaultThreshold = type === "two-thirds" ? 2 / 3 : type === "qualified-majority" ? 0.55 : 0.5;
      const eligibleStatuses = unique(source.eligibleStatuses?.length ? source.eligibleStatuses : ["member"], 16).map(lower).filter((status) => MEMBER_STATUS_SET.has(status) && status !== "suspended");
      const vetoRoles = unique(source.vetoRoles, 16).map(lower).filter((role) => MEMBER_ROLE_SET.has(role));
      const vetoPolities = unique(source.vetoPolities, 64).map((polity) => canonicalPolity(polity, world, identityIndex)).filter(Boolean);
      const weightsByPolity = {};
      const rawWeights = source.weightsByPolity && typeof source.weightsByPolity === "object" && !Array.isArray(source.weightsByPolity) ? source.weightsByPolity : {};
      for (const [rawPolity, rawWeight] of Object.entries(rawWeights)) {
        const polity = canonicalPolity(rawPolity, world, identityIndex);
        const weight = Number(rawWeight);
        if (!polity || !Number.isFinite(weight) || weight <= 0) continue;
        weightsByPolity[polity] = Math.min(1e6, weight);
      }
      const abstentionRaw = lower(source.abstentionPolicy || source.abstentions || "exclude").replace(/[\s_]+/g, "-");
      return {
        type,
        threshold: boundedFraction(source.threshold, defaultThreshold),
        quorum: boundedFraction(source.quorum, type === "unanimity" ? 1 : 0.5),
        abstentionPolicy: ABSTENTION_POLICY_SET.has(abstentionRaw) ? abstentionRaw : "exclude",
        eligibleStatuses: eligibleStatuses.length ? eligibleStatuses : ["member"],
        vetoPolities: unique(vetoPolities, 64),
        vetoRoles: unique(vetoRoles, 16),
        negativeVoteIsVeto: source.negativeVoteIsVeto === true,
        weightsByPolity
      };
    };
    normalizeInstitutionLifecycleRule = (value = {}, { defaultMode = "approval", defaultStatuses = ["member"] } = {}) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const modeRaw = lower(source.mode || source.type || defaultMode).replace(/[\s_]+/g, "-");
      const modeAliases = {
        vote: "approval",
        ballot: "approval",
        direct: "direct",
        unilateral: "unilateral",
        notice: "notice",
        "notice-required": "notice",
        forbidden: "not-permitted",
        closed: "not-permitted"
      };
      const mode = ["approval", "direct", "unilateral", "notice", "not-permitted"].includes(modeRaw) ? modeRaw : modeAliases[modeRaw] || defaultMode;
      const statuses = unique(source.allowedStatuses?.length ? source.allowedStatuses : defaultStatuses, 12).map(lower).filter((status) => MEMBER_STATUS_SET.has(status) && status !== "suspended");
      const noticeDays = Number(source.noticeDays ?? source.noticePeriodDays ?? 0);
      return {
        mode,
        allowedStatuses: statuses.length ? statuses : [...defaultStatuses],
        noticeDays: Number.isFinite(noticeDays) ? Math.max(0, Math.min(3650, Math.trunc(noticeDays))) : 0,
        note: clean18(source.note || source.summary).slice(0, 800)
      };
    };
    normalizeInstitutionLifecycleRules = (value = {}, world = {}, identityIndex = null) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const identitySource = source.identity && typeof source.identity === "object" && !Array.isArray(source.identity) ? source.identity : {};
      const minimum = Number(source.minimumFoundingMembers ?? source.minimumMembers ?? 1);
      return {
        minimumFoundingMembers: Number.isFinite(minimum) ? Math.max(1, Math.min(64, Math.trunc(minimum))) : 1,
        purpose: unique(source.purpose || source.purposes, 16).slice(0, 16),
        identity: {
          geographicScope: unique(identitySource.geographicScope || source.geographicScope, 24),
          politicalCharacter: clean18(identitySource.politicalCharacter || source.politicalCharacter).slice(0, 500),
          primaryThreatModel: unique(identitySource.primaryThreatModel || source.primaryThreatModel, 24)
        },
        accession: normalizeInstitutionLifecycleRule(source.accession, { defaultMode: "approval", defaultStatuses: ["member", "observer"] }),
        withdrawal: normalizeInstitutionLifecycleRule(source.withdrawal, { defaultMode: "unilateral", defaultStatuses: ["member"] }),
        expulsion: normalizeInstitutionLifecycleRule(source.expulsion, { defaultMode: "approval", defaultStatuses: ["member"] }),
        dissolution: normalizeInstitutionLifecycleRule(source.dissolution, { defaultMode: "approval", defaultStatuses: ["member"] }),
        approvalRule: normalizeInstitutionVotingRule(source.approvalRule || source.membershipVotingRule || {}, world, identityIndex),
        note: clean18(source.note).slice(0, 1200)
      };
    };
    normalizeInstitutionLifecycleCase = (value = {}, fallbackId = "", world = {}, identityIndex = null) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const id = slug(value.id || fallbackId || `${value.kind || "case"}-${value.polity || value.targetPolity || "polity"}-${value.createdDate || "date"}`);
      const kind = lower(value.kind || value.type).replace(/[\s_]+/g, "-");
      const status = lower(value.status || "pending").replace(/[\s_]+/g, "-");
      const decision = lower(value.decision || value.response).replace(/[\s_]+/g, "-");
      const polity = canonicalPolity(value.polity || value.targetPolity || value.applicant || value.member, world, identityIndex);
      const initiatedBy = canonicalPolity(value.initiatedBy || value.invitedBy || value.requestedBy || value.proposer, world, identityIndex);
      if (!id || !LIFECYCLE_CASE_KIND_SET.has(kind)) return null;
      return {
        id,
        kind,
        status: LIFECYCLE_CASE_STATUS_SET.has(status) ? status : "pending",
        polity,
        initiatedBy,
        requestedStatus: MEMBER_STATUS_SET.has(lower(value.requestedStatus || value.memberStatus)) ? lower(value.requestedStatus || value.memberStatus) : "member",
        decision: LIFECYCLE_DECISION_SET.has(decision) ? decision : "",
        createdDate: clean18(value.createdDate || value.date),
        updatedDate: clean18(value.updatedDate || value.resolvedDate || value.createdDate || value.date),
        resolvedDate: clean18(value.resolvedDate),
        effectiveDate: clean18(value.effectiveDate),
        proposalId: slug(value.proposalId),
        chatId: clean18(value.chatId).slice(0, 160),
        reason: clean18(value.reason || value.note).slice(0, 1200),
        terms: clean18(value.terms || value.requestedTerms).slice(0, 2400),
        sourceEventIds: unique(value.sourceEventIds, 24)
      };
    };
    normalizeInstitutionLifecycleCases = (value = {}, world = {}, identityIndex = null) => {
      const source = Array.isArray(value) ? Object.fromEntries(value.map((entry, index) => [entry?.id || `case-${index + 1}`, entry])) : value && typeof value === "object" ? value : {};
      const out = {};
      for (const [rawId, rawCase] of Object.entries(source)) {
        const lifecycleCase = normalizeInstitutionLifecycleCase(rawCase, rawId, world, identityIndex);
        if (lifecycleCase) out[lifecycleCase.id] = lifecycleCase;
      }
      return out;
    };
    normalizeInstitutionMembershipHistoryEntry = (value = {}, index = 0, world = {}, identityIndex = null) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const action = lower(value.action || value.kind || value.type).replace(/[\s_]+/g, "-");
      if (!["founded", "invited", "applied", "joined", "observer", "associate", "left", "withdrawn", "expelled", "suspended", "reinstated", "rejected", "dissolved", "activated", "reactivated", "role-changed"].includes(action)) return null;
      const polity = canonicalPolity(value.polity || value.member || value.country, world, identityIndex);
      const actor = canonicalPolity(value.actor || value.by || value.initiatedBy, world, identityIndex);
      const id = slug(value.id || `${action}-${polity || "institution"}-${value.date || index + 1}`) || `history-${index + 1}`;
      return {
        id,
        action,
        polity,
        actor,
        date: clean18(value.date || value.effectiveDate),
        status: MEMBER_STATUS_SET.has(lower(value.status)) ? lower(value.status) : "",
        role: MEMBER_ROLE_SET.has(lower(value.role)) ? lower(value.role) : "",
        sourceCaseId: slug(value.sourceCaseId),
        sourceProposalId: slug(value.sourceProposalId),
        reason: clean18(value.reason || value.note).slice(0, 1200)
      };
    };
    normalizeInstitutionMembershipHistory = (value = [], world = {}, identityIndex = null) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (let index = 0; index < array3(value).length; index += 1) {
        const entry = normalizeInstitutionMembershipHistoryEntry(array3(value)[index], index, world, identityIndex);
        if (!entry || seen.has(entry.id)) continue;
        seen.add(entry.id);
        out.push(entry);
      }
      return out.slice(-512);
    };
    normalizeInstitutionCharter = (value = {}, world = {}, identityIndex = null) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const proposalRules = {};
      const rawProposalRules = source.proposalRules && typeof source.proposalRules === "object" && !Array.isArray(source.proposalRules) ? source.proposalRules : {};
      for (const [rawType, rawRule] of Object.entries(rawProposalRules)) {
        const type = slug(rawType);
        if (!type) continue;
        proposalRules[type] = normalizeInstitutionVotingRule(rawRule, world, identityIndex);
      }
      return {
        votingRule: normalizeInstitutionVotingRule(source.votingRule || source.defaultVotingRule || source, world, identityIndex),
        proposalRules,
        lifecycle: normalizeInstitutionLifecycleRules(source.lifecycle || source.membership || {}, world, identityIndex),
        note: clean18(source.note || source.summary).slice(0, 1200),
        lastUpdatedDate: clean18(source.lastUpdatedDate || source.updatedDate),
        sourceEventIds: unique(source.sourceEventIds, 24)
      };
    };
    normalizeProposalAmendment = (value = {}, index = 0, world = {}, identityIndex = null) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const id = slug(value.id || `amendment-${index + 1}`);
      const text3 = clean18(value.text || value.summary || value.description).slice(0, 4e3);
      if (!id || !text3) return null;
      const revisionSource = value.revision && typeof value.revision === "object" && !Array.isArray(value.revision) ? value.revision : {};
      const revision = {};
      if (clean18(revisionSource.title)) revision.title = clean18(revisionSource.title).slice(0, 240);
      if (clean18(revisionSource.summary)) revision.summary = clean18(revisionSource.summary).slice(0, 6e3);
      if (Array.isArray(revisionSource.consequences)) {
        revision.consequences = revisionSource.consequences.map((entry, revisionIndex) => normalizeInstitutionProposalConsequence(entry, revisionIndex, world, identityIndex)).filter(Boolean).slice(0, 64);
      }
      return {
        id,
        text: text3,
        proposedBy: canonicalPolity(value.proposedBy || value.sponsor, world, identityIndex),
        proposedDate: clean18(value.proposedDate || value.date),
        status: ["proposed", "accepted", "rejected", "withdrawn"].includes(lower(value.status)) ? lower(value.status) : "proposed",
        resolvedBy: canonicalPolity(value.resolvedBy, world, identityIndex),
        resolvedDate: clean18(value.resolvedDate),
        ...Object.keys(revision).length ? { revision } : {},
        revisionApplied: value.revisionApplied === true
      };
    };
    normalizeProposalBallot = (value = {}, polity = "", world = {}, identityIndex = null) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : { choice: value };
      const voter = canonicalPolity(source.polity || polity, world, identityIndex);
      const choice = lower(source.choice || source.vote);
      if (!voter || !["yes", "no", "abstain", "veto"].includes(choice)) return null;
      return {
        polity: voter,
        choice,
        date: clean18(source.date || source.castDate),
        government: clean18(source.government || source.governmentLabel).slice(0, 240),
        reason: clean18(source.reason).slice(0, 1200)
      };
    };
    normalizeInstitutionProposal = (value = {}, fallbackId = "", world = {}, identityIndex = null) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const id = slug(value.id || fallbackId || value.title);
      const title = clean18(value.title || value.name || id).slice(0, 240);
      if (!id || !title) return null;
      const statusRaw = lower(value.status || "draft");
      const ballotSource = value?.voting?.ballots && typeof value.voting.ballots === "object" && !Array.isArray(value.voting.ballots) ? value.voting.ballots : {};
      const ballots = {};
      for (const [rawPolity, rawBallot] of Object.entries(ballotSource)) {
        const ballot = normalizeProposalBallot(rawBallot, rawPolity, world, identityIndex);
        if (ballot) ballots[ballot.polity] = ballot;
      }
      const askedSource = value?.voting?.asked && typeof value.voting.asked === "object" && !Array.isArray(value.voting.asked) ? value.voting.asked : {};
      const asked = {};
      for (const [rawPolity, rawCount] of Object.entries(askedSource)) {
        const polity = canonicalPolity(rawPolity, world, identityIndex);
        const count4 = Math.trunc(Number(rawCount));
        if (polity && count4 > 0) asked[polity] = Math.min(99, count4);
      }
      const voting = value.voting && typeof value.voting === "object" && !Array.isArray(value.voting) ? {
        openedDate: clean18(value.voting.openedDate),
        closedDate: clean18(value.voting.closedDate),
        rule: normalizeInstitutionVotingRule(value.voting.rule, world, identityIndex),
        eligibleVoters: unique(value.voting.eligibleVoters, 256).map((polity) => canonicalPolity(polity, world, identityIndex)).filter(Boolean),
        ballots,
        // How many post-turn ballot passes asked each government that still has
        // not voted (institutionBallotAskCount).
        ...Object.keys(asked).length ? { asked } : {},
        outcome: value.voting.outcome && typeof value.voting.outcome === "object" && !Array.isArray(value.voting.outcome) ? clone(value.voting.outcome) : null
      } : null;
      return {
        id,
        type: slug(value.type || value.proposalType || "general") || "general",
        title,
        summary: clean18(value.summary || value.description).slice(0, 6e3),
        status: PROPOSAL_STATUS_SET.has(statusRaw) ? statusRaw : "draft",
        createdDate: clean18(value.createdDate || value.date),
        createdBy: canonicalPolity(value.createdBy || value.proposedBy || value.sponsor, world, identityIndex),
        sponsorPolities: unique(value.sponsorPolities || value.sponsors, 64).map((polity) => canonicalPolity(polity, world, identityIndex)).filter(Boolean),
        amendments: array3(value.amendments).map((entry, index) => normalizeProposalAmendment(entry, index, world, identityIndex)).filter(Boolean).slice(0, 64),
        voting,
        consequences: array3(value.consequences).map((entry, index) => normalizeInstitutionProposalConsequence(entry, index, world, identityIndex)).filter(Boolean).slice(0, 64),
        implementation: value.implementation && typeof value.implementation === "object" && !Array.isArray(value.implementation) ? {
          status: ["pending", "partial", "complete", "blocked"].includes(lower(value.implementation.status)) ? lower(value.implementation.status) : "pending",
          applied: array3(value.implementation.applied).filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry)).map(clone).slice(0, 64),
          pending: array3(value.implementation.pending).filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry)).map(clone).slice(0, 64),
          lastUpdatedDate: clean18(value.implementation.lastUpdatedDate || value.implementation.date),
          note: clean18(value.implementation.note).slice(0, 1200)
        } : null,
        lastUpdatedDate: clean18(value.lastUpdatedDate || value.updatedDate || value.createdDate || value.date),
        sourceEventIds: unique(value.sourceEventIds, 24),
        note: clean18(value.note).slice(0, 1200)
      };
    };
    normalizeInstitutionProposals = (value = {}, world = {}, identityIndex = null) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const out = {};
      for (const [rawId, rawProposal] of Object.entries(source)) {
        const proposal = normalizeInstitutionProposal(rawProposal, rawId, world, identityIndex);
        if (proposal) out[proposal.id] = proposal;
      }
      return out;
    };
    normalizeMember2 = (value, world, identityIndex = null) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const polity = canonicalPolity(value.polity || value.country || value.member, world, identityIndex);
      if (!polity) return null;
      const statusRaw = lower(value.status || "member");
      const roleRaw = lower(value.role || "member");
      return {
        polity,
        status: MEMBER_STATUS_SET.has(statusRaw) ? statusRaw : "member",
        role: MEMBER_ROLE_SET.has(roleRaw) ? roleRaw : "member",
        sinceDate: clean18(value.sinceDate || value.joinedDate),
        lastUpdatedDate: clean18(value.lastUpdatedDate || value.sinceDate || value.joinedDate),
        sourceEventIds: unique(value.sourceEventIds, 24),
        sourceProposalIds: unique(value.sourceProposalIds, 24),
        note: clean18(value.note).slice(0, 600)
      };
    };
    normalizeInstitutionRecord = (value, fallbackId = "", world = {}, identityIndex = null) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const identity = canonicalInstitutionIdentity({ ...value, id: value.id || fallbackId });
      const id = identity.id;
      const name = identity.name;
      if (!id || !name) return null;
      const kindRaw = lower(value.kind || identity.kind || value.type || "other").replace(/[\s-]+/g, "_");
      const rawStatus = lower(value.status || "active");
      const memberMap = /* @__PURE__ */ new Map();
      for (const rawMember of array3(value.members)) {
        const member = normalizeMember2(rawMember, world, identityIndex);
        if (!member) continue;
        memberMap.set(lower(member.polity), member);
      }
      const leaders = unique([
        ...array3(value.leaders),
        ...[...memberMap.values()].filter((member) => ["leader", "leading-member"].includes(member.role)).map((member) => member.polity)
      ], 24).map((polity) => canonicalPolity(polity, world, identityIndex)).filter(Boolean);
      const leaderKeys = new Set(leaders.map(lower));
      for (const member of memberMap.values()) {
        if (leaderKeys.has(lower(member.polity)) && member.role === "member") member.role = "leading-member";
      }
      const charter = normalizeInstitutionCharter(value.charter || value.governance || {}, world, identityIndex);
      const normalizedStatus = INSTITUTION_STATUS_SET.has(rawStatus) ? rawStatus : "active";
      const status = normalizedStatus === "provisional" && institutionFoundingThresholdReached({
        members: [...memberMap.values()],
        charter
      }) ? "active" : normalizedStatus;
      return {
        id,
        name,
        shortName: clean18(value.shortName || identity.shortName).slice(0, 80),
        aliases: unique([...identity.aliases || [], ...array3(value.aliases)], 24),
        badgeKey: slug(value.badgeKey || identity.badgeKey),
        logoUrl: normalizeInstitutionLogoUrl(value.logoUrl || value.logo || value.emblemUrl || value.emblem || identity.logoUrl),
        logoAsset: value?.logoAsset === true || identity.logoAsset === true,
        priority: Number.isFinite(Number(value.priority)) ? Number(value.priority) : Number(identity.priority || 0),
        // Stable link to the persistent diplomatic channel. Membership remains
        // institution-owned; the channel materializes that membership for UI/history.
        channelId: clean18(value.channelId || value.institutionalChannelId).slice(0, 160),
        kind: INSTITUTION_KIND_SET.has(kindRaw) ? kindRaw : "other",
        status,
        members: [...memberMap.values()].sort((a, b2) => a.polity.localeCompare(b2.polity)),
        leaders,
        foundedDate: clean18(value.foundedDate || identity.foundedDate),
        dissolvedDate: clean18(value.dissolvedDate || identity.dissolvedDate),
        predecessors: normalizeInstitutionPredecessors(value?.predecessors?.length ? value.predecessors : identity.predecessors),
        charter,
        proposals: normalizeInstitutionProposals(value.proposals || value.resolutions || {}, world, identityIndex),
        lifecycleCases: normalizeInstitutionLifecycleCases(value.lifecycleCases || value.membershipCases || {}, world, identityIndex),
        membershipHistory: normalizeInstitutionMembershipHistory(value.membershipHistory || value.lifecycleHistory || [], world, identityIndex),
        lastUpdatedDate: clean18(value.lastUpdatedDate),
        note: clean18(value.note).slice(0, 1e3),
        sourceEventIds: unique(value.sourceEventIds, 24),
        sourceProposalIds: unique(value.sourceProposalIds, 24)
      };
    };
    normalizeInstitutions = (input, world = {}, givenIdentityIndex = null) => {
      const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
      const byIdSource = source.byId && typeof source.byId === "object" && !Array.isArray(source.byId) ? source.byId : source;
      const identityIndex = givenIdentityIndex || buildPolityIdentityIndex(world || {});
      const byId = {};
      for (const [rawId, rawInstitution] of Object.entries(byIdSource)) {
        if (rawId === "schemaVersion" || rawId === "ledgerVersion") continue;
        const institution = normalizeInstitutionRecord(rawInstitution, rawId, world, identityIndex);
        if (institution) byId[institution.id] = institution;
      }
      return {
        schemaVersion: INSTITUTIONS_SCHEMA_VERSION,
        ledgerVersion: Math.max(0, Math.trunc(Number(source.ledgerVersion) || 0)),
        byId
      };
    };
  }
});

// src/runtime/scenarioPolities.js
var init_scenarioPolities = __esm({
  "src/runtime/scenarioPolities.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/powerStatus.js
var POWER_STATUS_SCHEMA_VERSION, POWER_TIERS, POWER_INSTITUTIONAL_LEVERAGE_MAX, POWER_STRATEGIC_ACTIVITY_MAX, POWER_TIER_SET, clean19, lower2, array4, clamp2, round1, hasExactPolityKey2, canonicalPolity2, normalizePowerTier, isFinitePowerScore, normalizePowerRecord, normalizePowerStatus;
var init_powerStatus = __esm({
  "src/runtime/powerStatus.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_institutions();
    init_polityIdentity();
    init_scenarioPolities();
    POWER_STATUS_SCHEMA_VERSION = 1;
    POWER_TIERS = Object.freeze(["minor-power", "regional-power", "major-power"]);
    POWER_INSTITUTIONAL_LEVERAGE_MAX = 18;
    POWER_STRATEGIC_ACTIVITY_MAX = 9;
    POWER_TIER_SET = new Set(POWER_TIERS);
    clean19 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    lower2 = (value) => clean19(value).toLocaleLowerCase();
    array4 = (value) => Array.isArray(value) ? value : [];
    clamp2 = (value, min, max2) => Math.max(min, Math.min(max2, Number(value) || 0));
    round1 = (value) => Math.round(Number(value) * 10) / 10;
    hasExactPolityKey2 = (world, token) => Boolean(
      Object.prototype.hasOwnProperty.call(world?.polityOverrides || {}, token) || Object.prototype.hasOwnProperty.call(world?.politicalActors?.byPolity || {}, token) || Object.prototype.hasOwnProperty.call(world?.countryStats || {}, token) || Object.prototype.hasOwnProperty.call(world?.powerStatus?.byPolity || {}, token)
    );
    canonicalPolity2 = (value, world, identityIndex = null) => {
      const token = clean19(value);
      if (!token) return "";
      if (hasExactPolityKey2(world || {}, token)) return token;
      const identity = resolvePolityIdentity(token, world || {}, {
        allowUnknown: true,
        requireActive: false,
        allowCoreMatch: true,
        allowStockBase: true,
        identityIndex
      });
      return clean19(identity?.resolved || token);
    };
    normalizePowerTier = (value) => {
      const text3 = lower2(value).replace(/_/g, "-");
      if (text3 === "great-power" || text3 === "global-power") return "major-power";
      if (text3 === "middle-power") return "regional-power";
      return POWER_TIER_SET.has(text3) ? text3 : "";
    };
    isFinitePowerScore = (value) => value !== null && value !== void 0 && value !== "" && Number.isFinite(Number(value));
    normalizePowerRecord = (value, polityKey = "") => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const tier = normalizePowerTier(source.tier || source.powerTier || source.status);
      if (!tier) return null;
      const score = isFinitePowerScore(source.score) ? round1(clamp2(source.score, 0, 100)) : null;
      return {
        polityKey: clean19(source.polityKey || polityKey),
        tier,
        // Backwards-compatible continuous STRATEGIC weight. Tiering no longer reads
        // this composite because institutional embeddedness is not sovereign power.
        score,
        strategicWeight: isFinitePowerScore(source.strategicWeight) ? round1(clamp2(source.strategicWeight, 0, 100)) : score,
        sovereignCapabilityScore: isFinitePowerScore(source.sovereignCapabilityScore) ? round1(clamp2(source.sovereignCapabilityScore, 0, 100)) : null,
        institutionalLeverageScore: isFinitePowerScore(source.institutionalLeverageScore) ? round1(clamp2(source.institutionalLeverageScore, 0, POWER_INSTITUTIONAL_LEVERAGE_MAX)) : null,
        strategicActivityScore: isFinitePowerScore(source.strategicActivityScore) ? round1(clamp2(source.strategicActivityScore, 0, POWER_STRATEGIC_ACTIVITY_MAX)) : null,
        baselineScore: isFinitePowerScore(source.baselineScore ?? source.startingScore) ? round1(clamp2(source.baselineScore ?? source.startingScore, 0, 100)) : null,
        basis: clean19(source.basis || "generated-estimate"),
        lastUpdatedDate: clean19(source.lastUpdatedDate),
        lastUpdatedRound: Math.max(0, Math.trunc(Number(source.lastUpdatedRound) || 0)),
        candidateTier: normalizePowerTier(source.candidateTier),
        candidateRounds: Math.max(0, Math.trunc(Number(source.candidateRounds) || 0)),
        reasons: array4(source.reasons).map(clean19).filter(Boolean).slice(0, 12)
      };
    };
    normalizePowerStatus = (input, world = {}) => {
      const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
      const byPolitySource = source.byPolity && typeof source.byPolity === "object" && !Array.isArray(source.byPolity) ? source.byPolity : source;
      const entries = Object.entries(byPolitySource).filter(([rawKey]) => rawKey !== "schemaVersion");
      const needsIdentityIndex = entries.some(([rawKey]) => !hasExactPolityKey2(world || {}, clean19(rawKey)));
      const identityIndex = needsIdentityIndex ? buildPolityIdentityIndex(world || {}) : null;
      const byPolity = {};
      for (const [rawKey, rawValue] of entries) {
        const polityKey = canonicalPolity2(rawKey, world, identityIndex);
        const record = normalizePowerRecord(rawValue, polityKey);
        if (polityKey && record) byPolity[polityKey] = { ...record, polityKey };
      }
      return { schemaVersion: POWER_STATUS_SCHEMA_VERSION, byPolity };
    };
  }
});

// src/runtime/institutionLifecycleCore.js
var clean20, lower3, list9, unique2, STANDING_RANK, INSTITUTION_LIFECYCLE_IMPACT_OPS, normalizeInstitutionLifecycleImpactOp;
var init_institutionLifecycleCore = __esm({
  "src/runtime/institutionLifecycleCore.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_institutions();
    init_polityIdentity();
    init_gameDates();
    init_stableId();
    clean20 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    lower3 = (value) => clean20(value).toLocaleLowerCase();
    list9 = (value) => Array.isArray(value) ? value : [];
    unique2 = (values, limit = 128) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const raw of list9(values)) {
        const value = clean20(raw);
        const key = lower3(value);
        if (!value || seen.has(key)) continue;
        seen.add(key);
        out.push(value);
        if (out.length >= limit) break;
      }
      return out;
    };
    STANDING_RANK = Object.freeze({ observer: 1, candidate: 2, participant: 3, associate: 4, member: 5 });
    INSTITUTION_LIFECYCLE_IMPACT_OPS = Object.freeze([
      "found",
      "invite",
      "apply",
      "respond",
      "withdraw",
      "expel",
      "suspend",
      "reinstate",
      "dissolve"
    ]);
    normalizeInstitutionLifecycleImpactOp = (entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const op = lower3(entry.op || entry.type).replace(/[\s_]+/g, "-");
      if (!INSTITUTION_LIFECYCLE_IMPACT_OPS.includes(op)) return null;
      const actorPolity = clean20(entry.actorPolity || entry.actor || entry.initiatedBy || entry.founder || entry.polity);
      const institutionId = clean20(entry.institutionId || entry.institution);
      const targetPolity = clean20(entry.targetPolity || entry.target || (op === "invite" || ["expel", "suspend", "reinstate"].includes(op) ? entry.polity : ""));
      const requestedStatus = lower3(entry.requestedStatus || entry.status);
      const decision = lower3(entry.decision).replace(/[\s_]+/g, "-");
      const out = {
        op,
        ...actorPolity ? { actorPolity } : {},
        ...institutionId ? { institutionId } : {},
        ...targetPolity ? { targetPolity } : {},
        ...clean20(entry.caseId) ? { caseId: clean20(entry.caseId) } : {},
        ...requestedStatus ? { requestedStatus } : {},
        ...decision ? { decision } : {},
        ...clean20(entry.reason) ? { reason: clean20(entry.reason) } : {},
        ...clean20(entry.terms) ? { terms: clean20(entry.terms) } : {}
      };
      if (op === "found") {
        const name = clean20(entry.name);
        if (!name || !actorPolity) return null;
        Object.assign(out, {
          name,
          ...clean20(entry.shortName) ? { shortName: clean20(entry.shortName) } : {},
          kind: INSTITUTION_KINDS.includes(clean20(entry.kind)) ? clean20(entry.kind) : "other",
          purpose: unique2(entry.purpose, 16),
          geographicScope: unique2(entry.geographicScope, 24),
          primaryThreatModel: unique2(entry.primaryThreatModel, 24),
          politicalCharacter: clean20(entry.politicalCharacter),
          votingRule: clean20(entry.votingRule || entry.decisionRule || "simple-majority"),
          minimumFoundingMembers: Math.max(1, Math.min(64, Number(entry.minimumFoundingMembers) || 1)),
          accessionMode: ["approval", "direct"].includes(lower3(entry.accessionMode)) ? lower3(entry.accessionMode) : "approval",
          allowObserver: entry.allowObserver !== false,
          withdrawalMode: ["unilateral", "notice", "approval", "not-permitted"].includes(lower3(entry.withdrawalMode)) ? lower3(entry.withdrawalMode) : "unilateral",
          withdrawalNoticeDays: Math.max(0, Math.min(3650, Number(entry.withdrawalNoticeDays) || 0)),
          expulsionMode: ["approval", "not-permitted"].includes(lower3(entry.expulsionMode)) ? lower3(entry.expulsionMode) : "approval",
          dissolutionMode: ["approval", "not-permitted"].includes(lower3(entry.dissolutionMode)) ? lower3(entry.dissolutionMode) : "approval",
          invitees: unique2(entry.invitees, 24),
          charterNote: clean20(entry.charterNote)
        });
      }
      if (op !== "found" && !institutionId) return null;
      if (["invite", "expel", "suspend", "reinstate"].includes(op) && !targetPolity) return null;
      if (["apply", "withdraw"].includes(op) && !actorPolity) return null;
      if (op === "respond" && (!actorPolity || !out.caseId || !decision)) return null;
      if (["invite", "found", "expel", "suspend", "reinstate", "dissolve"].includes(op) && !actorPolity) return null;
      return out;
    };
  }
});

// src/runtime/politicalPressure.js
var POLITICAL_PRESSURE_STATE_VERSION, POLITICAL_PRESSURE_AXES, ISSUE_KEY_PATTERN, MAX_ISSUES, MAX_RECENT_SOURCES, DEFAULT_PERSISTENCE, DROP_EPSILON, clean21, round12, clamp3, clampPercent, clampLean, clampPersistence, normalizeIssueKey, normalizeSource, normalizeRecentSources, normalizePoliticalPressureIssue, normalizePoliticalPressureState;
var init_politicalPressure = __esm({
  "src/runtime/politicalPressure.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    POLITICAL_PRESSURE_STATE_VERSION = 1;
    POLITICAL_PRESSURE_AXES = Object.freeze({
      immigration: Object.freeze({ negative: "more open", positive: "more restrictive" }),
      sovereignty: Object.freeze({ negative: "deeper integration", positive: "greater national sovereignty" }),
      security: Object.freeze({ negative: "restraint/de-escalation", positive: "hardline/security-first" }),
      national_identity: Object.freeze({ negative: "cosmopolitan/pluralist", positive: "nationalist/identity-first" }),
      social_order: Object.freeze({ negative: "social liberalisation", positive: "traditional/order-first" }),
      economic_intervention: Object.freeze({ negative: "market-oriented", positive: "state intervention/redistribution" }),
      inequality: Object.freeze({ negative: "accept existing distribution", positive: "redistribution/economic equality" }),
      corruption: Object.freeze({ negative: "status quo tolerance", positive: "anti-corruption/reform demand" }),
      institutional_trust: Object.freeze({ negative: "institutional confidence", positive: "institutional distrust" }),
      regionalism: Object.freeze({ negative: "centralisation", positive: "regional autonomy/devolution" }),
      religion: Object.freeze({ negative: "secularisation", positive: "greater religious/traditional role" }),
      environment: Object.freeze({ negative: "growth/resource priority", positive: "environmental protection" }),
      authoritarianism: Object.freeze({ negative: "liberal checks/pluralism", positive: "strong executive/order" }),
      reform: Object.freeze({ negative: "institutional continuity", positive: "institutional reform/change" }),
      war_weariness: Object.freeze({ negative: "continued mobilisation/escalation", positive: "peace/de-escalation demand" }),
      economic_stress: Object.freeze({ negative: "economic confidence", positive: "economic anxiety/distress" }),
      cost_of_living: Object.freeze({ negative: "price stability", positive: "cost-of-living pressure" }),
      unemployment: Object.freeze({ negative: "labour-market confidence", positive: "employment insecurity" })
    });
    ISSUE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
    MAX_ISSUES = 24;
    MAX_RECENT_SOURCES = 4;
    DEFAULT_PERSISTENCE = 0.72;
    DROP_EPSILON = 0.15;
    clean21 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    round12 = (value) => Math.round(Number(value) * 10) / 10;
    clamp3 = (value, min, max2) => Math.max(min, Math.min(max2, value));
    clampPercent = (value, fallback = 0) => {
      const number = Number(value);
      return Number.isFinite(number) ? round12(clamp3(number, 0, 100)) : fallback;
    };
    clampLean = (value, fallback = 0) => {
      const number = Number(value);
      return Number.isFinite(number) ? round12(clamp3(number, -100, 100)) : fallback;
    };
    clampPersistence = (value, fallback = DEFAULT_PERSISTENCE) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.round(clamp3(number, 0, 1) * 1e3) / 1e3 : fallback;
    };
    normalizeIssueKey = (value) => {
      const key = clean21(value).toLocaleLowerCase().replace(/[\s.]+/g, "_");
      return ISSUE_KEY_PATTERN.test(key) ? key : "";
    };
    normalizeSource = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const kind = clean21(value.kind || value.sourceKind || value.type).slice(0, 40);
      const id = clean21(value.id || value.sourceId).slice(0, 120);
      const date = clean21(value.date).slice(0, 32);
      const note = clean21(value.note).slice(0, 180);
      if (!kind && !id && !date && !note) return null;
      return {
        ...kind ? { kind } : {},
        ...id ? { id } : {},
        ...date ? { date } : {},
        ...note ? { note } : {}
      };
    };
    normalizeRecentSources = (value) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const raw of Array.isArray(value) ? value : []) {
        const source = normalizeSource(raw);
        if (!source) continue;
        const key = `${source.kind || ""}|${source.id || ""}|${source.date || ""}|${source.note || ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(source);
        if (out.length >= MAX_RECENT_SOURCES) break;
      }
      return out;
    };
    normalizePoliticalPressureIssue = (value) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const out = {
        salience: clampPercent(source.salience),
        lean: clampLean(source.lean ?? source.direction),
        strain: clampPercent(source.strain),
        persistence: clampPersistence(source.persistence),
        momentum: clampLean(source.momentum)
      };
      const recentSources = normalizeRecentSources(source.recentSources || source.sources);
      if (recentSources.length) out.recentSources = recentSources;
      return out;
    };
    normalizePoliticalPressureState = (value) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const sourceIssues = source.issues && typeof source.issues === "object" && !Array.isArray(source.issues) ? source.issues : {};
      const issues = {};
      for (const [rawKey, rawIssue] of Object.entries(sourceIssues).slice(0, MAX_ISSUES)) {
        const key = normalizeIssueKey(rawKey);
        if (!key) continue;
        const issue = normalizePoliticalPressureIssue(rawIssue);
        if (issue.salience <= DROP_EPSILON && issue.strain <= DROP_EPSILON && Math.abs(issue.lean) <= DROP_EPSILON) continue;
        issues[key] = issue;
      }
      const updatedAt = clean21(source.updatedAt).slice(0, 32);
      return {
        schemaVersion: POLITICAL_PRESSURE_STATE_VERSION,
        ...updatedAt ? { updatedAt } : {},
        issues
      };
    };
  }
});

// src/runtime/politicalActors.js
function normalizePoliticalActors(input) {
  const source = input && typeof input === "object" ? input : {};
  const byPolity = {};
  if (source.byPolity && typeof source.byPolity === "object" && !Array.isArray(source.byPolity)) {
    for (const [rawKey, rawActor] of Object.entries(source.byPolity)) {
      const key = clean22(rawKey);
      if (!key || !rawActor || typeof rawActor !== "object" || Array.isArray(rawActor)) continue;
      const actor = normalizePoliticalActorRecord(rawActor, key);
      if (actor) byPolity[key] = actor;
    }
  }
  return {
    schemaVersion: POLITICAL_ACTORS_SCHEMA_VERSION,
    byPolity
  };
}
function candidatesForPolity(world, key) {
  if (!key) return [];
  const out = [key];
  const override = world?.polityOverrides?.[key];
  if (override?.name) out.push(override.name);
  for (const [candidateKey2, candidate] of Object.entries(world?.polityOverrides || {})) {
    if (candidateKey2 === key || candidate?.name === key || candidate?.aliases?.includes?.(key)) {
      out.push(candidateKey2, candidate?.name, ...candidate?.aliases || []);
    }
  }
  return [...new Set(out.filter(Boolean))];
}
function ownPolityNames(world) {
  const names = new Set(Object.keys(world?.polityOverrides || {}).map(clean22));
  for (const owner of Object.values(world?.regionOwnershipOverrides || {})) names.add(clean22(owner));
  names.delete("");
  return names;
}
function getPoliticalProfile(world, polityKey) {
  const byPolity = world?.politicalActors?.byPolity;
  if (!byPolity) return null;
  const normalizeActorKey = (value) => String(value ?? "").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
  for (const candidate of candidatesForPolity(world, polityKey)) {
    if (byPolity[candidate]) return byPolity[candidate];
  }
  const normalizedTargetKeys = new Set(
    candidatesForPolity(world, polityKey).map(normalizeActorKey).filter(Boolean)
  );
  for (const [actorKey, actor] of Object.entries(byPolity)) {
    if (normalizedTargetKeys.has(normalizeActorKey(actorKey))) return actor;
    if (actor?.polityKey && normalizedTargetKeys.has(normalizeActorKey(actor.polityKey))) return actor;
    if (actor?.name && normalizedTargetKeys.has(normalizeActorKey(actor.name))) return actor;
  }
  const candidates = new Set(candidatesForPolity(world, polityKey));
  for (const actor of Object.values(byPolity)) {
    if (!actor || typeof actor !== "object") continue;
    if (actor.polityKey && candidates.has(actor.polityKey)) return actor;
  }
  for (const [actorKey, actor] of Object.entries(byPolity)) {
    if (candidates.has(actorKey)) return actor;
  }
  const stockCode = resolveStockCountryCode(polityKey);
  if (stockCode) {
    const ownPolities = ownPolityNames(world);
    const requested = clean22(polityKey);
    const isOtherPolity = (token) => clean22(token) !== requested && ownPolities.has(clean22(token));
    const requestedIsOwnPolity = ownPolities.has(requested);
    for (const [actorKey, actor] of Object.entries(byPolity)) {
      if (requestedIsOwnPolity && [actorKey, actor?.polityKey].some((token) => token && isOtherPolity(token))) continue;
      const actorTokens = [actorKey, actor?.polityKey, actor?.name].filter(Boolean);
      if (actorTokens.some((token) => resolveStockCountryCode(token) === stockCode)) return actor;
    }
  }
  return null;
}
var POLITICAL_ACTORS_SCHEMA_VERSION, POLITICAL_REPRESENTATIONS, POLITICAL_REPRESENTATION_SET, POLITICAL_REGIME_CHARACTERS, POLITICAL_REGIME_CHARACTER_SET, TEXT_MEMO_LIMIT, rememberedText, clean22, lowerKey, NOT_PLAIN, copyPlainData, cloneActorValue, clampPercent2, normalizeLandscapeShare, clampSignedPercent, POLITICAL_RESPONSE_ISSUE_KEY_PATTERN, normalizePoliticalResponseIssueKey, normalizePoliticalResponseIssue, normalizePoliticalResponseProfile, POLITICAL_DISPOSITION_DIMENSIONS, normalizePoliticalBehavioralDisposition, cleanStringArray, normalizeMetricRecord, normalizeOfficeholder, partyTokenKey, asciiPartySlug, stableTextHash, derivePartyId, derivePoliticalEntityId, normalizePoliticalParty, normalizePoliticalPowerBloc, inferPoliticalSystemType, inferPoliticalRepresentation, normalizePoliticalSystem, partyTokens, resolvePoliticalParty, normalizePartyReferenceList, partyDisplayNamesFromRefs, normalizePoliticalGovernment, REBUILT_ACTOR_FIELDS, normalizePoliticalActorRecord;
var init_politicalActors = __esm({
  "src/runtime/politicalActors.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_polityIdentity();
    init_politicalPressure();
    POLITICAL_ACTORS_SCHEMA_VERSION = 6;
    POLITICAL_REPRESENTATIONS = Object.freeze({
      ELECTORAL: "electoral",
      COURT_FACTIONS: "court_factions",
      PARTY_STATE: "party_state",
      ELITE_FACTIONS: "elite_factions",
      MILITARY_FACTIONS: "military_factions",
      REVOLUTIONARY_FACTIONS: "revolutionary_factions",
      COLONIAL: "colonial",
      NONE: "none"
    });
    POLITICAL_REPRESENTATION_SET = new Set(Object.values(POLITICAL_REPRESENTATIONS));
    POLITICAL_REGIME_CHARACTERS = Object.freeze([
      "democratic",
      "hybrid",
      "authoritarian",
      "totalitarian",
      "theocratic",
      "military",
      "colonial",
      "other"
    ]);
    POLITICAL_REGIME_CHARACTER_SET = new Set(POLITICAL_REGIME_CHARACTERS);
    TEXT_MEMO_LIMIT = 5e4;
    rememberedText = (fold13) => {
      const memo = /* @__PURE__ */ new Map();
      return (value) => {
        if (typeof value !== "string") return fold13(value);
        let answer = memo.get(value);
        if (answer === void 0) {
          answer = fold13(value);
          if (memo.size >= TEXT_MEMO_LIMIT) memo.clear();
          memo.set(value, answer);
        }
        return answer;
      };
    };
    clean22 = rememberedText((value) => String(value ?? "").replace(/\s+/g, " ").trim());
    lowerKey = rememberedText((text3) => text3.toLocaleLowerCase());
    NOT_PLAIN = /* @__PURE__ */ Symbol("not plain data");
    copyPlainData = (value, depth) => {
      if (value === null || typeof value !== "object") return typeof value === "function" ? NOT_PLAIN : value;
      if (depth > 64) return NOT_PLAIN;
      if (Array.isArray(value)) {
        const out2 = new Array(value.length);
        for (let index = 0; index < value.length; index += 1) {
          if (!(index in value)) continue;
          const item = copyPlainData(value[index], depth + 1);
          if (item === NOT_PLAIN) return NOT_PLAIN;
          out2[index] = item;
        }
        return out2;
      }
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) return NOT_PLAIN;
      const out = {};
      for (const key of Object.keys(value)) {
        const item = copyPlainData(value[key], depth + 1);
        if (item === NOT_PLAIN) return NOT_PLAIN;
        out[key] = item;
      }
      return out;
    };
    cloneActorValue = (value) => {
      if (!value || typeof value !== "object") return value;
      const copy = copyPlainData(value, 0);
      if (copy !== NOT_PLAIN) return copy;
      if (typeof structuredClone === "function") return structuredClone(value);
      return JSON.parse(JSON.stringify(value));
    };
    clampPercent2 = (value) => {
      if (value === null || value === void 0 || value === "") return null;
      const number = Number(value);
      if (!Number.isFinite(number)) return null;
      return Math.max(0, Math.min(100, Math.round(number * 10) / 10));
    };
    normalizeLandscapeShare = (value, { allowLabel = false } = {}) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : { percent: value };
      const percent2 = clampPercent2(source.percent);
      const basis = clean22(source.basis);
      const label = allowLabel ? clean22(source.label) : "";
      if (percent2 == null && !label) return null;
      return {
        ...percent2 != null ? { percent: percent2 } : {},
        ...basis ? { basis } : {},
        ...label ? { label } : {}
      };
    };
    clampSignedPercent = (value) => {
      if (value === null || value === void 0 || value === "") return null;
      const number = Number(value);
      if (!Number.isFinite(number)) return null;
      return Math.max(-100, Math.min(100, Math.round(number * 10) / 10));
    };
    POLITICAL_RESPONSE_ISSUE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
    normalizePoliticalResponseIssueKey = (value) => {
      const key = clean22(value).toLocaleLowerCase().replace(/[\s.]+/g, "_");
      return POLITICAL_RESPONSE_ISSUE_KEY_PATTERN.test(key) ? key : "";
    };
    normalizePoliticalResponseIssue = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const out = {};
      const position = clampSignedPercent(value.position ?? value.stance);
      if (position != null) out.position = position;
      const sensitivity = clampPercent2(value.sensitivity ?? value.issueSensitivity);
      if (sensitivity != null) out.sensitivity = sensitivity;
      const strainResponse = clampSignedPercent(value.strainResponse ?? value.strainAffinity);
      if (strainResponse != null) out.strainResponse = strainResponse;
      return Object.keys(out).length ? out : null;
    };
    normalizePoliticalResponseProfile = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const out = {};
      for (const key of ["organization", "credibility", "inertia", "resilience"]) {
        const number = clampPercent2(value[key]);
        if (number != null) out[key] = number;
      }
      const sourceIssues = value.issues && typeof value.issues === "object" && !Array.isArray(value.issues) ? value.issues : {};
      const issues = {};
      for (const [rawKey, rawIssue] of Object.entries(sourceIssues).slice(0, 24)) {
        const key = normalizePoliticalResponseIssueKey(rawKey);
        if (!key) continue;
        const issue = normalizePoliticalResponseIssue(rawIssue);
        if (issue) issues[key] = issue;
      }
      if (Object.keys(issues).length) out.issues = issues;
      return Object.keys(out).length ? out : null;
    };
    POLITICAL_DISPOSITION_DIMENSIONS = Object.freeze([
      "assertiveness",
      "riskTolerance",
      "escalationPressure",
      "compromisePressure",
      "regimeVulnerability",
      "deterrenceSensitivity",
      "opportunityPerception",
      "threatPerception"
    ]);
    normalizePoliticalBehavioralDisposition = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const out = cloneActorValue(value);
      let ownedFields = 0;
      for (const key of POLITICAL_DISPOSITION_DIMENSIONS) {
        const number = clampPercent2(value[key]);
        if (number != null) {
          out[key] = number;
          ownedFields += 1;
        } else {
          delete out[key];
        }
      }
      const updatedAt = clean22(value.updatedAt);
      if (updatedAt) out.updatedAt = updatedAt.slice(0, 32);
      else delete out.updatedAt;
      if (!ownedFields && !Object.keys(out).some((key) => key !== "updatedAt")) return null;
      return out;
    };
    cleanStringArray = (value, limit = 32) => {
      const source = Array.isArray(value) ? value : clean22(value) ? [value] : [];
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const entry of source) {
        const text3 = clean22(entry);
        const key = lowerKey(text3);
        if (!text3 || seen.has(key)) continue;
        seen.add(key);
        out.push(text3);
        if (out.length >= limit) break;
      }
      return out;
    };
    normalizeMetricRecord = (value, { depth = 0, maxDepth = 3, maxKeys = 32, clampNumeric = false } = {}) => {
      if (!value || typeof value !== "object" || Array.isArray(value) || depth > maxDepth) return {};
      const out = {};
      for (const [rawKey, rawValue] of Object.entries(value).slice(0, maxKeys)) {
        const key = clean22(rawKey);
        if (!key) continue;
        if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
          const nested = normalizeMetricRecord(rawValue, { depth: depth + 1, maxDepth, maxKeys, clampNumeric });
          if (Object.keys(nested).length) out[key] = nested;
          continue;
        }
        if (Array.isArray(rawValue)) {
          const list12 = cleanStringArray(rawValue, 16);
          if (list12.length) out[key] = list12;
          continue;
        }
        if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
          const rounded = Math.round(rawValue * 10) / 10;
          out[key] = clampNumeric ? Math.max(0, Math.min(100, rounded)) : rounded;
          continue;
        }
        if (typeof rawValue === "boolean") {
          out[key] = rawValue;
          continue;
        }
        const text3 = clean22(rawValue);
        if (text3) out[key] = text3;
      }
      return out;
    };
    normalizeOfficeholder = (value) => {
      if (typeof value === "string") return clean22(value);
      if (!value || typeof value !== "object" || Array.isArray(value)) return "";
      const name = clean22(value.name || value.id);
      if (!name) return "";
      const out = {};
      if (clean22(value.id)) out.id = clean22(value.id);
      out.name = name;
      const title = clean22(value.title || value.role);
      if (title) out.title = title;
      return out;
    };
    partyTokenKey = (value) => clean22(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
    asciiPartySlug = (value) => clean22(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    stableTextHash = (value) => {
      let hash2 = 2166136261;
      for (const char of String(value ?? "")) {
        hash2 ^= char.codePointAt(0);
        hash2 = Math.imul(hash2, 16777619);
      }
      return (hash2 >>> 0).toString(16).padStart(8, "0");
    };
    derivePartyId = (party, index = 0) => {
      const explicit = clean22(party?.id);
      if (explicit) return explicit;
      for (const candidate of [
        party?.shortName,
        party?.abbreviation,
        party?.name,
        ...Array.isArray(party?.aliases) ? party.aliases : []
      ]) {
        const slug2 = asciiPartySlug(candidate);
        if (slug2) return slug2;
      }
      const seed = clean22(party?.name || party?.shortName || party?.abbreviation) || `party-${index + 1}`;
      return `party-${stableTextHash(seed)}`;
    };
    derivePoliticalEntityId = (value, index = 0, prefix = "bloc") => {
      const explicit = clean22(value?.id);
      if (explicit) return explicit;
      for (const candidate of [
        value?.shortName,
        value?.abbreviation,
        value?.name,
        ...Array.isArray(value?.aliases) ? value.aliases : []
      ]) {
        const slug2 = asciiPartySlug(candidate);
        if (slug2) return slug2;
      }
      const seed = clean22(value?.name || value?.shortName || value?.abbreviation) || `${prefix}-${index + 1}`;
      return `${prefix}-${stableTextHash(seed)}`;
    };
    normalizePoliticalParty = (value, { index = 0 } = {}) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const name = clean22(value.name || value.shortName || value.abbreviation || value.id);
      if (!name) return null;
      const out = cloneActorValue(value);
      out.id = derivePartyId(value, index);
      out.name = name;
      const shortName = clean22(value.shortName || value.abbreviation);
      if (shortName) out.shortName = shortName;
      else delete out.shortName;
      delete out.abbreviation;
      const aliases = cleanStringArray(value.aliases, 24).filter((alias) => partyTokenKey(alias) !== partyTokenKey(name));
      if (aliases.length) out.aliases = aliases;
      else delete out.aliases;
      const support = normalizeLandscapeShare(value.support);
      if (support) out.support = support;
      else delete out.support;
      const influence = normalizeLandscapeShare(value.influence, { allowLabel: true });
      if (influence) out.influence = influence;
      else delete out.influence;
      const politicalResponse = normalizePoliticalResponseProfile(value.politicalResponse || value.responseProfile);
      if (politicalResponse) out.politicalResponse = politicalResponse;
      else delete out.politicalResponse;
      delete out.responseProfile;
      const ideology = clean22(value.ideology);
      if (ideology) out.ideology = ideology;
      else delete out.ideology;
      const leader = normalizeOfficeholder(value.leader);
      if (leader) out.leader = leader;
      else delete out.leader;
      for (const key of ["goals", "publicPriorities", "publicForeignPolicy"]) {
        const list12 = cleanStringArray(value[key], 16);
        if (list12.length) out[key] = list12;
        else delete out[key];
      }
      for (const key of ["publicDescription", "color", "internalStrategy", "internalPressure", "privateGoal"]) {
        const text3 = clean22(value[key]);
        if (text3) out[key] = text3;
        else delete out[key];
      }
      if (value.ruling === true) out.ruling = true;
      else delete out.ruling;
      if (value.coalition === true) out.coalition = true;
      else delete out.coalition;
      return out;
    };
    normalizePoliticalPowerBloc = (value, { index = 0 } = {}) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const name = clean22(value.name || value.shortName || value.abbreviation || value.id);
      if (!name) return null;
      const out = cloneActorValue(value);
      out.id = derivePoliticalEntityId(value, index, "bloc");
      out.name = name;
      const shortName = clean22(value.shortName || value.abbreviation);
      if (shortName) out.shortName = shortName;
      else delete out.shortName;
      delete out.abbreviation;
      const aliases = cleanStringArray(value.aliases, 24).filter((alias) => partyTokenKey(alias) !== partyTokenKey(name));
      if (aliases.length) out.aliases = aliases;
      else delete out.aliases;
      const influenceSource = value?.influence && typeof value.influence === "object" && !Array.isArray(value.influence) ? { ...value.influence, ...clean22(value.influenceLabel) && !clean22(value.influence?.label) ? { label: clean22(value.influenceLabel) } : {} } : typeof value.influence === "number" ? { percent: value.influence, ...clean22(value.influenceLabel) ? { label: clean22(value.influenceLabel) } : {} } : { ...clean22(value.influenceLabel) ? { label: clean22(value.influenceLabel) } : {} };
      const influence = normalizeLandscapeShare(influenceSource, { allowLabel: true });
      if (influence) out.influence = influence;
      else delete out.influence;
      delete out.influenceLabel;
      const politicalResponse = normalizePoliticalResponseProfile(value.politicalResponse || value.responseProfile);
      if (politicalResponse) out.politicalResponse = politicalResponse;
      else delete out.politicalResponse;
      delete out.responseProfile;
      for (const key of ["kind", "ideology", "status", "publicDescription", "color", "internalStrategy", "internalPressure", "privateGoal"]) {
        const text3 = clean22(value[key]);
        if (text3) out[key] = text3;
        else delete out[key];
      }
      const leader = normalizeOfficeholder(value.leader);
      if (leader) out.leader = leader;
      else delete out.leader;
      for (const key of ["goals", "publicPriorities", "publicForeignPolicy"]) {
        const list12 = cleanStringArray(value[key], 16);
        if (list12.length) out[key] = list12;
        else delete out[key];
      }
      return out;
    };
    inferPoliticalSystemType = (governmentForm) => {
      const form = clean22(governmentForm).toLocaleLowerCase();
      if (!form) return "unspecified";
      if (/absolute monarchy|absolute monarch/.test(form)) return "absolute_monarchy";
      if (/constitutional monarchy|constitutional monarch/.test(form)) return "constitutional_monarchy";
      if (/semi[- ]presidential republic/.test(form)) return "semi_presidential_republic";
      if (/parliamentary republic/.test(form)) return "parliamentary_republic";
      if (/presidential republic/.test(form)) return "presidential_republic";
      if (/one[- ]party|single[- ]party|party[- ]state/.test(form)) return "one_party_state";
      if (/military junta|military regime/.test(form)) return "military_regime";
      if (/personalist/.test(form)) return "personalist_regime";
      if (/revolutionary/.test(form)) return "revolutionary_government";
      if (/colonial|colony|protectorate|mandate/.test(form)) return "colonial_administration";
      return "unspecified";
    };
    inferPoliticalRepresentation = ({ type = "", governmentForm = "", parties = [], powerBlocs = [] } = {}) => {
      const joined = `${clean22(type)} ${clean22(governmentForm)}`.toLocaleLowerCase();
      if (/absolute_monarchy|absolute monarchy|emirate|sultanate/.test(joined)) return POLITICAL_REPRESENTATIONS.COURT_FACTIONS;
      if (/one_party_state|one[- ]party|single[- ]party|party[- ]state/.test(joined)) return POLITICAL_REPRESENTATIONS.PARTY_STATE;
      if (/military_regime|military junta|military regime/.test(joined)) return POLITICAL_REPRESENTATIONS.MILITARY_FACTIONS;
      if (/revolutionary_government|revolutionary/.test(joined)) return POLITICAL_REPRESENTATIONS.REVOLUTIONARY_FACTIONS;
      if (/personalist_regime|personalist/.test(joined)) return POLITICAL_REPRESENTATIONS.ELITE_FACTIONS;
      if (/colonial_administration|colonial|colony|protectorate|mandate/.test(joined)) return POLITICAL_REPRESENTATIONS.COLONIAL;
      if (Array.isArray(parties) && parties.length) return POLITICAL_REPRESENTATIONS.ELECTORAL;
      if (Array.isArray(powerBlocs) && powerBlocs.length) return POLITICAL_REPRESENTATIONS.ELITE_FACTIONS;
      return POLITICAL_REPRESENTATIONS.NONE;
    };
    normalizePoliticalSystem = (value, { government = {}, parties = [], powerBlocs = [] } = {}) => {
      const source = typeof value === "string" ? { type: value } : value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const out = cloneActorValue(source);
      const explicitType = clean22(source.type).toLocaleLowerCase().replace(/[ -]+/g, "_");
      const type = explicitType || inferPoliticalSystemType(government?.form);
      out.type = type || "unspecified";
      const explicitRepresentation = clean22(source.representation).toLocaleLowerCase().replace(/[ -]+/g, "_");
      out.representation = POLITICAL_REPRESENTATION_SET.has(explicitRepresentation) ? explicitRepresentation : inferPoliticalRepresentation({ type: out.type, governmentForm: government?.form, parties, powerBlocs });
      const regimeCharacter = clean22(source.regimeCharacter).toLocaleLowerCase().replace(/[ -]+/g, "_");
      if (POLITICAL_REGIME_CHARACTER_SET.has(regimeCharacter)) out.regimeCharacter = regimeCharacter;
      else delete out.regimeCharacter;
      for (const key of ["label", "notes"]) {
        const text3 = clean22(source[key]);
        if (text3) out[key] = text3;
        else delete out[key];
      }
      return out;
    };
    partyTokens = (party) => [
      party?.id,
      party?.name,
      party?.shortName,
      ...Array.isArray(party?.aliases) ? party.aliases : []
    ].map(clean22).filter(Boolean);
    resolvePoliticalParty = (actorOrWorld, polityOrToken, maybeToken) => {
      const actor = maybeToken === void 0 ? actorOrWorld : getPoliticalProfile(actorOrWorld, polityOrToken);
      const token = maybeToken === void 0 ? polityOrToken : maybeToken;
      if (!actor || !Array.isArray(actor.parties)) return null;
      const target = partyTokenKey(token);
      if (!target) return null;
      return actor.parties.find(
        (party) => partyTokens(party).some((candidate) => partyTokenKey(candidate) === target)
      ) || null;
    };
    normalizePartyReferenceList = (value, parties, { deriveFromFlags = null } = {}) => {
      const source = cleanStringArray(value, 32);
      const ids = [];
      const unresolvedNames = [];
      const seen = /* @__PURE__ */ new Set();
      for (const token of source) {
        const match = resolvePoliticalParty({ parties }, token);
        if (match) {
          if (!seen.has(match.id)) {
            seen.add(match.id);
            ids.push(match.id);
          }
        } else {
          const key = partyTokenKey(token);
          if (key && !seen.has(`name:${key}`)) {
            seen.add(`name:${key}`);
            unresolvedNames.push(token);
          }
        }
      }
      if (!ids.length && !unresolvedNames.length && deriveFromFlags) {
        for (const party of parties.filter((entry) => entry?.[deriveFromFlags] === true)) {
          if (!seen.has(party.id)) {
            seen.add(party.id);
            ids.push(party.id);
          }
        }
      }
      return { ids, unresolvedNames };
    };
    partyDisplayNamesFromRefs = (ids, unresolvedNames, parties) => {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      for (const id of ids) {
        const party = parties.find((entry) => entry.id === id);
        const name = clean22(party?.name || id);
        const key = partyTokenKey(name);
        if (!name || seen.has(key)) continue;
        seen.add(key);
        out.push(name);
      }
      for (const name of unresolvedNames) {
        const key = partyTokenKey(name);
        if (!name || seen.has(key)) continue;
        seen.add(key);
        out.push(name);
      }
      return out;
    };
    normalizePoliticalGovernment = (value, parties = []) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const out = cloneActorValue(source);
      for (const key of ["form", "ideology", "status", "coalitionName"]) {
        const text3 = clean22(source[key]);
        if (text3) out[key] = text3;
        else delete out[key];
      }
      const headOfState = normalizeOfficeholder(source.headOfState || source.headOfStateId);
      const headOfGovernment = normalizeOfficeholder(source.headOfGovernment || source.headOfGovernmentId);
      if (headOfState) out.headOfState = headOfState;
      else delete out.headOfState;
      if (headOfGovernment) out.headOfGovernment = headOfGovernment;
      else delete out.headOfGovernment;
      delete out.headOfStateId;
      delete out.headOfGovernmentId;
      for (const key of ["approval", "stability"]) {
        const number = clampPercent2(source[key]);
        if (number != null) out[key] = number;
        else delete out[key];
      }
      const hasExplicitRulingRefs = Object.prototype.hasOwnProperty.call(source, "rulingPartyIds") || Object.prototype.hasOwnProperty.call(source, "rulingParties") || Object.prototype.hasOwnProperty.call(source, "rulingParty");
      const hasExplicitCoalitionRefs = Object.prototype.hasOwnProperty.call(source, "coalitionPartyIds") || Object.prototype.hasOwnProperty.call(source, "coalition");
      const rulingTokens = [
        ...Array.isArray(source.rulingPartyIds) ? source.rulingPartyIds : [],
        ...Array.isArray(source.rulingParties) ? source.rulingParties : [],
        ...clean22(source.rulingParty) ? [source.rulingParty] : []
      ];
      const coalitionTokens = [
        ...Array.isArray(source.coalitionPartyIds) ? source.coalitionPartyIds : [],
        ...Array.isArray(source.coalition) ? source.coalition : []
      ];
      const ruling = normalizePartyReferenceList(rulingTokens, parties, {
        deriveFromFlags: hasExplicitRulingRefs ? null : "ruling"
      });
      const coalition = normalizePartyReferenceList(coalitionTokens, parties, {
        deriveFromFlags: hasExplicitCoalitionRefs ? null : "coalition"
      });
      out.rulingPartyIds = ruling.ids;
      out.coalitionPartyIds = coalition.ids;
      out.rulingParties = partyDisplayNamesFromRefs(ruling.ids, ruling.unresolvedNames, parties);
      out.coalition = partyDisplayNamesFromRefs(coalition.ids, coalition.unresolvedNames, parties);
      delete out.rulingParty;
      return out;
    };
    REBUILT_ACTOR_FIELDS = /* @__PURE__ */ new Set([
      "government",
      "parties",
      "powerBlocs",
      "politicalSystem",
      "leader",
      "goals",
      "fears",
      "ambitions",
      "domesticPressures",
      "tags",
      "traits",
      "perceptions",
      "behavioralDisposition",
      "politicalPressures",
      "name",
      "ideology"
    ]);
    normalizePoliticalActorRecord = (value, fallbackPolityKey = "") => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const out = {};
      for (const key of Object.keys(value)) out[key] = REBUILT_ACTOR_FIELDS.has(key) ? null : cloneActorValue(value[key]);
      const polityKey = clean22(value.polityKey || fallbackPolityKey);
      if (polityKey) out.polityKey = polityKey;
      const parties = [];
      const seenIds = /* @__PURE__ */ new Set();
      for (const [index, rawParty] of (Array.isArray(value.parties) ? value.parties : []).entries()) {
        const party = normalizePoliticalParty(rawParty, { index });
        if (!party) continue;
        let id = party.id;
        if (seenIds.has(id)) {
          id = `${id}-${stableTextHash(`${party.name}:${index}`)}`;
          party.id = id;
        }
        seenIds.add(id);
        parties.push(party);
      }
      const governmentSource = value.government && typeof value.government === "object" && !Array.isArray(value.government) ? value.government : {};
      const government = normalizePoliticalGovernment(
        governmentSource.ideology || !clean22(value.ideology) ? governmentSource : { ...governmentSource, ideology: value.ideology },
        parties
      );
      const rulingIds = new Set(government.rulingPartyIds || []);
      const coalitionIds = new Set(government.coalitionPartyIds || []);
      for (const party of parties) {
        if (rulingIds.has(party.id)) party.ruling = true;
        else delete party.ruling;
        if (coalitionIds.has(party.id)) party.coalition = true;
        else delete party.coalition;
      }
      const powerBlocs = [];
      const seenBlocIds = /* @__PURE__ */ new Set();
      for (const [index, rawBloc] of (Array.isArray(value.powerBlocs) ? value.powerBlocs : []).entries()) {
        const bloc = normalizePoliticalPowerBloc(rawBloc, { index });
        if (!bloc) continue;
        let id = bloc.id;
        if (seenBlocIds.has(id)) {
          id = `${id}-${stableTextHash(`${bloc.name}:${index}`)}`;
          bloc.id = id;
        }
        seenBlocIds.add(id);
        powerBlocs.push(bloc);
      }
      out.government = government;
      out.parties = parties;
      out.powerBlocs = powerBlocs;
      out.politicalSystem = normalizePoliticalSystem(value.politicalSystem, {
        government,
        parties,
        powerBlocs
      });
      const leader = normalizeOfficeholder(value.leader || government.headOfState);
      if (leader) out.leader = leader;
      else delete out.leader;
      for (const key of ["goals", "fears", "ambitions", "domesticPressures", "tags"]) {
        const list12 = cleanStringArray(value[key], key === "tags" ? 24 : 32);
        if (list12.length) out[key] = list12;
        else delete out[key];
      }
      for (const key of ["traits", "perceptions"]) {
        const record = normalizeMetricRecord(value[key], {
          clampNumeric: key !== "perceptions"
        });
        if (Object.keys(record).length) out[key] = record;
        else delete out[key];
      }
      const behavioralDisposition = normalizePoliticalBehavioralDisposition(value.behavioralDisposition);
      if (behavioralDisposition) out.behavioralDisposition = behavioralDisposition;
      else delete out.behavioralDisposition;
      const politicalPressures = normalizePoliticalPressureState(value.politicalPressures);
      if (Object.keys(politicalPressures.issues).length || politicalPressures.updatedAt) {
        out.politicalPressures = politicalPressures;
      } else {
        delete out.politicalPressures;
      }
      const name = clean22(value.name);
      if (name) out.name = name;
      else delete out.name;
      delete out.ideology;
      return out;
    };
  }
});

// src/runtime/politicalTraitRegistry.js
var defineTrait, POLITICAL_TRAIT_REGISTRY, POLITICAL_TRAIT_KEYS, cleanKey, aliasMap;
var init_politicalTraitRegistry = __esm({
  "src/runtime/politicalTraitRegistry.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    defineTrait = (key, label, description, aliases = []) => Object.freeze({
      key,
      label,
      description,
      min: 0,
      max: 100,
      aliases: Object.freeze([...aliases]),
      editable: true
    });
    POLITICAL_TRAIT_REGISTRY = Object.freeze([
      defineTrait(
        "riskTolerance",
        "Risk tolerance",
        "Willingness to accept uncertain costs and downside in pursuit of political or strategic opportunity.",
        ["risk_tolerance"]
      ),
      defineTrait(
        "recklessness",
        "Recklessness",
        "Tendency to discount downside, safeguards, institutional restraint, or second-order consequences.",
        ["reckless"]
      ),
      defineTrait(
        "caution",
        "Caution",
        "Preference for verification, delay, hedging, and risk reduction before committing to consequential action.",
        ["cautious"]
      ),
      defineTrait(
        "opportunism",
        "Opportunism",
        "Readiness to exploit openings, rival weakness, ambiguity, or temporary changes in the balance of power.",
        ["opportunistic"]
      ),
      defineTrait(
        "militarism",
        "Militarism",
        "Preference for military power, coercive instruments, readiness, prestige, and force-backed solutions.",
        ["militaristic"]
      ),
      defineTrait(
        "conciliatory",
        "Conciliatory tendency",
        "Preference for accommodation, de-escalation, negotiated settlement, and preservation of workable relationships.",
        ["conciliation"]
      ),
      defineTrait(
        "pragmatism",
        "Pragmatism",
        "Willingness to adapt means, alliances, or doctrine when practical outcomes outweigh ideological consistency.",
        ["pragmatic"]
      ),
      defineTrait(
        "paranoia",
        "Paranoia",
        "Tendency to infer hidden hostility, conspiracy, encirclement, or bad faith under ambiguous conditions.",
        ["paranoid"]
      ),
      defineTrait(
        "vindictiveness",
        "Vindictiveness",
        "Persistence in retaliation, punishment, or grievance after perceived injury, humiliation, betrayal, or defiance.",
        ["vindictive"]
      ),
      defineTrait(
        "consensusDriven",
        "Consensus driven",
        "Preference for internal coalition, elite, institutional, or cabinet consensus before major decisions.",
        ["consensus_driven", "consensus"]
      )
    ]);
    POLITICAL_TRAIT_KEYS = Object.freeze(POLITICAL_TRAIT_REGISTRY.map((entry) => entry.key));
    cleanKey = (value) => String(value ?? "").replace(/[^a-z0-9]+/gi, "").toLocaleLowerCase();
    aliasMap = /* @__PURE__ */ new Map();
    for (const entry of POLITICAL_TRAIT_REGISTRY) {
      for (const token of [entry.key, ...entry.aliases]) aliasMap.set(cleanKey(token), entry.key);
    }
  }
});

// src/runtime/politicalActorOps.js
var POLITICAL_ACTOR_OPS, POLITICAL_ACTOR_GENERATED_OP_EXAMPLES, GENERATED_OP_NOTES, POLITICAL_ACTOR_GENERATED_ARG_GUIDANCE;
var init_politicalActorOps = __esm({
  "src/runtime/politicalActorOps.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_politicalActors();
    init_politicalPressure();
    init_politicalTraitRegistry();
    POLITICAL_ACTOR_OPS = Object.freeze({
      CREATE_PARTY: "create-party",
      UPDATE_PARTY: "update-party",
      SET_PARTY_SUPPORT: "set-party-support",
      SET_PARTY_INFLUENCE: "set-party-influence",
      SET_PARTY_LEADER: "set-party-leader",
      CREATE_POWER_BLOC: "create-power-bloc",
      UPDATE_POWER_BLOC: "update-power-bloc",
      SET_POWER_BLOC_INFLUENCE: "set-power-bloc-influence",
      SET_POLITICAL_PRESSURES: "set-political-pressures",
      SET_BEHAVIORAL_DISPOSITION: "set-behavioral-disposition",
      SET_POLITICAL_SYSTEM: "set-political-system",
      SET_GOVERNMENT: "set-government",
      FORM_COALITION: "form-coalition",
      LEAVE_COALITION: "leave-coalition",
      REPLACE_LEADER: "replace-leader",
      SET_STRATEGY: "set-strategy",
      SET_TRAITS: "set-traits",
      SET_PERCEPTIONS: "set-perceptions",
      REMOVE_PERCEPTION: "remove-perception"
    });
    POLITICAL_ACTOR_GENERATED_OP_EXAMPLES = Object.freeze({
      [POLITICAL_ACTOR_OPS.CREATE_PARTY]: Object.freeze({
        party: Object.freeze({ id: "stable-party-id", name: "Party Name", ideology: "Political ideology" })
      }),
      [POLITICAL_ACTOR_OPS.UPDATE_PARTY]: Object.freeze({
        partyId: "stable-party-id",
        patch: Object.freeze({ ideology: "Updated ideology", publicDescription: "Public description" })
      }),
      [POLITICAL_ACTOR_OPS.SET_PARTY_SUPPORT]: Object.freeze({ partyId: "stable-party-id", percent: 42 }),
      [POLITICAL_ACTOR_OPS.SET_PARTY_INFLUENCE]: Object.freeze({ partyId: "stable-party-id", percent: 42 }),
      [POLITICAL_ACTOR_OPS.SET_PARTY_LEADER]: Object.freeze({
        partyId: "stable-party-id",
        leader: Object.freeze({ name: "Party Leader" })
      }),
      [POLITICAL_ACTOR_OPS.CREATE_POWER_BLOC]: Object.freeze({
        bloc: Object.freeze({ id: "stable-bloc-id", name: "Power Bloc", kind: "court", ideology: "Political outlook" })
      }),
      [POLITICAL_ACTOR_OPS.UPDATE_POWER_BLOC]: Object.freeze({
        blocId: "stable-bloc-id",
        patch: Object.freeze({ ideology: "Updated outlook", publicDescription: "Public description" })
      }),
      [POLITICAL_ACTOR_OPS.SET_POWER_BLOC_INFLUENCE]: Object.freeze({
        blocId: "stable-bloc-id",
        percent: 40,
        label: "strong"
      }),
      [POLITICAL_ACTOR_OPS.SET_POLITICAL_SYSTEM]: Object.freeze({
        patch: Object.freeze({
          type: "parliamentary_republic",
          representation: "electoral",
          regimeCharacter: "democratic",
          publicLabel: "Parliamentary Republic"
        })
      }),
      [POLITICAL_ACTOR_OPS.SET_GOVERNMENT]: Object.freeze({
        patch: Object.freeze({ form: "Parliamentary Republic", ideology: "social liberalism" })
      }),
      [POLITICAL_ACTOR_OPS.FORM_COALITION]: Object.freeze({
        rulingPartyIds: Object.freeze(["stable-party-id"]),
        coalitionPartyIds: Object.freeze(["coalition-party-id"]),
        coalitionName: "Governing Coalition"
      }),
      [POLITICAL_ACTOR_OPS.LEAVE_COALITION]: Object.freeze({ partyId: "stable-party-id" }),
      [POLITICAL_ACTOR_OPS.REPLACE_LEADER]: Object.freeze({
        office: "headOfGovernment",
        leader: Object.freeze({ name: "Officeholder" })
      }),
      [POLITICAL_ACTOR_OPS.SET_STRATEGY]: Object.freeze({
        patch: Object.freeze({
          goals: Object.freeze(["Goal"]),
          fears: Object.freeze(["Fear"]),
          ambitions: Object.freeze(["Ambition"]),
          domesticPressures: Object.freeze(["Domestic pressure"])
        })
      }),
      [POLITICAL_ACTOR_OPS.SET_TRAITS]: Object.freeze({
        traits: Object.freeze({ pragmatism: 70, caution: 55 })
      }),
      [POLITICAL_ACTOR_OPS.SET_PERCEPTIONS]: Object.freeze({
        perceptions: Object.freeze({
          "Other Polity": Object.freeze({ threat: 70, opportunity: 30, weakness: 40, cohesionEstimate: 65 })
        })
      }),
      [POLITICAL_ACTOR_OPS.REMOVE_PERCEPTION]: Object.freeze({ target: "Other Polity" })
    });
    GENERATED_OP_NOTES = Object.freeze({
      [POLITICAL_ACTOR_OPS.CREATE_PARTY]: "party fields MUST be nested under party; do not put name/id/ideology at argsJson root",
      [POLITICAL_ACTOR_OPS.CREATE_POWER_BLOC]: "power-bloc fields MUST be nested under bloc (or powerBloc)",
      [POLITICAL_ACTOR_OPS.SET_PARTY_SUPPORT]: "use for electoral/popular support; percent is 0-100",
      [POLITICAL_ACTOR_OPS.SET_PARTY_INFLUENCE]: "use for non-electoral or party-state influence; percent is 0-100",
      [POLITICAL_ACTOR_OPS.SET_POWER_BLOC_INFLUENCE]: "percent is 0-100; label is optional",
      [POLITICAL_ACTOR_OPS.SET_GOVERNMENT]: "government fields belong inside patch; this does NOT establish governing party membership - use form-coalition for that",
      [POLITICAL_ACTOR_OPS.FORM_COALITION]: "use to establish governing party membership even for a single-party or minority government; REUSE exact existing canonical party ids when parties already exist; rulingPartyIds may contain one party and coalitionPartyIds may be empty",
      [POLITICAL_ACTOR_OPS.SET_TRAITS]: "trait keys must come from the canonical trait registry and values are 0-100",
      [POLITICAL_ACTOR_OPS.SET_PERCEPTIONS]: "perceptions are subjective beliefs keyed by target polity; common bounded metrics include threat, opportunity, weakness and cohesionEstimate"
    });
    POLITICAL_ACTOR_GENERATED_ARG_GUIDANCE = [
      "Inside argsJson, encode EXACTLY one JSON object using the native shape for the chosen op:",
      ...Object.entries(POLITICAL_ACTOR_GENERATED_OP_EXAMPLES).map(([op, args]) => {
        const note = GENERATED_OP_NOTES[op] ? ` - ${GENERATED_OP_NOTES[op]}` : "";
        return `- ${op} argsJson=${JSON.stringify(args)}${note}`;
      }),
      "Dependency order inside one event: create-party/create-power-bloc first; then update/support/influence/party-leader; then form-coalition/set-government/replace-leader; then strategy/traits/perceptions. When a later op references an entity created earlier in the same event, use that create op's exact stable id.",
      "Government formation in a parliamentary party system must identify the governing force canonically. Use form-coalition to set rulingPartyIds/coalitionPartyIds; set-government plus replace-leader alone does not say which party or parties govern.",
      "When a polity already has canonical parties, government formation MUST reuse their exact existing ids. Do not create replacement/near-duplicate parties merely to populate form-coalition. create-party is only for an event that actually establishes a genuinely new party, split, merger or reorganization."
    ].join("\n");
  }
});

// src/runtime/politicalClock.js
var POLITICAL_SIMULATION_CLOCK_VERSION, AVERAGE_MONTH_DAYS, clean23, clamp4, round4, parseDateParts, MAX_HELD_REGION_POLITIES, normalizeHeldRegions, normalizePoliticalSimulationClock;
var init_politicalClock = __esm({
  "src/runtime/politicalClock.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    POLITICAL_SIMULATION_CLOCK_VERSION = 1;
    AVERAGE_MONTH_DAYS = 365.2425 / 12;
    clean23 = (value) => String(value ?? "").trim();
    clamp4 = (value, min, max2) => Math.max(min, Math.min(max2, value));
    round4 = (value) => Math.round(Number(value) * 1e4) / 1e4;
    parseDateParts = (value) => {
      const dayNumber = gameDateDayNumber(clean23(value));
      if (dayNumber === null) return null;
      return { text: normalizeGameDate(clean23(value)), time: dayNumber * 864e5 };
    };
    MAX_HELD_REGION_POLITIES = 512;
    normalizeHeldRegions = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const out = {};
      for (const [rawKey, rawCount] of Object.entries(value).slice(0, MAX_HELD_REGION_POLITIES)) {
        const key = clean23(rawKey);
        const count4 = Number(rawCount);
        if (key && Number.isInteger(count4) && count4 > 0) out[key] = count4;
      }
      return Object.keys(out).length ? out : null;
    };
    normalizePoliticalSimulationClock = (value) => {
      const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const lastProcessedDate = parseDateParts(source.lastProcessedDate)?.text || "";
      const lastProcessedRound = Number(source.lastProcessedRound);
      const remainder = Number(source.responseRemainderMonths);
      const heldRegions = normalizeHeldRegions(source.heldRegions);
      return {
        schemaVersion: POLITICAL_SIMULATION_CLOCK_VERSION,
        ...lastProcessedDate ? { lastProcessedDate } : {},
        ...Number.isInteger(lastProcessedRound) && lastProcessedRound >= 0 ? { lastProcessedRound } : {},
        responseRemainderMonths: Number.isFinite(remainder) ? round4(clamp4(remainder, 0, 0.9999)) : 0,
        ...heldRegions ? { heldRegions } : {}
      };
    };
  }
});

// src/runtime/fronts/invade.js
var fold11, readAttacks;
var init_invade = __esm({
  "src/runtime/fronts/invade.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_constants();
    fold11 = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
    readAttacks = (value) => {
      const kept = [];
      for (const raw of Array.isArray(value) ? value : []) {
        const name = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 120).trim();
        if (!name || kept.some((entry) => fold11(entry) === fold11(name))) continue;
        kept.push(name);
        if (kept.length >= MAX_ORDER_ATTACKS) break;
      }
      return kept;
    };
  }
});

// src/runtime/fronts/replay.js
var SAME_PLACE, MAX_SHOWN_REGIONS, MAX_SHOWN_TURNS, TEXT_MAX, DATE_MAX, NAME_MAX, isRecord4, memberList, wholeDay, packed, made, normalizeReplay;
var init_replay = __esm({
  "src/runtime/fronts/replay.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameDates();
    init_codec();
    init_constants();
    SAME_PLACE = 1 / 32;
    MAX_SHOWN_REGIONS = 600;
    MAX_SHOWN_TURNS = 1200;
    TEXT_MAX = 2e5;
    DATE_MAX = 40;
    NAME_MAX = 120;
    isRecord4 = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
    memberList = (value) => (Array.isArray(value) ? value : []).map((name) => String(name ?? "").slice(0, NAME_MAX));
    wholeDay = (value, most) => {
      const number = Math.floor(Number(value));
      if (!Number.isFinite(number) || number < 0) return 0;
      return number > most ? most : number;
    };
    packed = (value) => typeof value === "string" && value.length <= TEXT_MAX && PACKED_TEXT.test(value) ? value : "";
    made = /* @__PURE__ */ new WeakSet();
    normalizeReplay = (raw) => {
      if (!isRecord4(raw) || !Array.isArray(raw.t)) return null;
      if (made.has(raw)) return raw;
      const n = wholeDay(raw.n, TRACK_DAY_MAX);
      const s = wholeDay(raw.s, n);
      const replay = {
        d: String(raw.d ?? "").replace(/\s+/g, " ").trim().slice(0, DATE_MAX),
        n,
        s,
        e: Math.max(s, raw.e === void 0 ? n : wholeDay(raw.e, n)),
        t: [packed(raw.t[0]), packed(raw.t[1])],
        names: memberList(raw.names).map((name) => name.replace(/\s+/g, " ").trim()).slice(0, PAINT_NAMES_MAX),
        m: packed(raw.m),
        p: packed(raw.p)
      };
      if (Array.isArray(raw.o) && raw.o.length > 0) {
        const text3 = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, NAME_MAX) : "";
        const first = [];
        const known = /* @__PURE__ */ new Set();
        for (const entry of raw.o) {
          if (first.length >= MAX_SHOWN_REGIONS) break;
          const id = Array.isArray(entry) ? text3(entry[0]) : "";
          const name = Array.isArray(entry) ? text3(entry[1]) : "";
          if (!id || !name || known.has(id)) continue;
          known.add(id);
          first.push([id, name]);
        }
        if (first.length > 0) {
          const turns = [];
          for (const entry of Array.isArray(raw.f) ? raw.f : []) {
            if (turns.length >= MAX_SHOWN_TURNS) break;
            const id = Array.isArray(entry) ? text3(entry[1]) : "";
            const name = Array.isArray(entry) ? text3(entry[2]) : "";
            if (!id || !name || !known.has(id)) continue;
            turns.push([wholeDay(entry[0], n), id, name]);
          }
          turns.sort((a, b2) => a[0] - b2[0]);
          replay.o = first;
          replay.f = turns;
        }
      }
      if (Number.isFinite(raw.until)) {
        replay.until = Math.max(0, Math.min(n, Number(raw.until)));
        replay.from = Number.isFinite(raw.from) ? Math.max(0, Math.min(replay.until, Number(raw.from))) : replay.until;
      }
      made.add(replay);
      return replay;
    };
  }
});

// src/runtime/fronts/troops.js
var init_troops = __esm({
  "src/runtime/fronts/troops.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_unitMotion();
    init_constants();
    init_field();
  }
});

// src/runtime/fronts/chronicle.js
var CHRONICLE_KINDS, CHRONICLE_MOST, STRENGTH_MOST, clean24, count3, percent, readChronicle;
var init_chronicle = __esm({
  "src/runtime/fronts/chronicle.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_constants();
    init_troops();
    CHRONICLE_KINDS = Object.freeze(["offensive", "counter", "city", "pocket", "siege", "breached", "destroyed", "invaded", "attacked", "landed", "withdrew", "returned", "assault"]);
    CHRONICLE_MOST = 120;
    STRENGTH_MOST = 60;
    clean24 = (value, most) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most);
    count3 = (value) => Number(value) > 0 ? Math.floor(Number(value)) : 0;
    percent = (value) => Number(value) > 0 ? Number(value) > 100 ? 100 : Math.round(Number(value)) : 0;
    readChronicle = (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const moments = [];
      for (const entry of Array.isArray(value.moments) ? value.moments : []) {
        const k2 = clean24(entry?.k, 24).toLowerCase();
        if (!CHRONICLE_KINDS.includes(k2)) continue;
        moments.push({
          d: clean24(entry.d, 40),
          k: k2,
          ...entry.s === 0 || entry.s === 1 ? { s: entry.s } : {},
          at: clean24(entry.at, 160),
          ...count3(entry.size) > 0 ? { size: count3(entry.size) } : {},
          ...entry.capital === true ? { capital: true } : {}
        });
      }
      const strength = [];
      for (const row of Array.isArray(value.strength) ? value.strength : []) {
        if (!Array.isArray(row) || row.length < 3) continue;
        strength.push([clean24(row[0], 40), count3(row[1]), count3(row[2]), percent(row[3]), percent(row[4])]);
      }
      if (moments.length === 0 && strength.length === 0) return null;
      return { moments: moments.slice(-CHRONICLE_MOST), strength: strength.slice(-STRENGTH_MOST) };
    };
  }
});

// src/runtime/fronts/record.js
var NAME_MAX2, DATE_MAX2, PACKED_MAX, isRecord5, clean25, foldBattlefieldName, memberList2, pairOf, amount, packed2, troopText, sideIndex, normalizeOrder, normalizeOrders, normalizeNamed, normalizeContested, normalizeLog, normalizeBattlefield, made2, results, normalizeBattlefields;
var init_record2 = __esm({
  "src/runtime/fronts/record.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_codec();
    init_constants();
    init_frame();
    init_invade();
    init_replay();
    init_chronicle();
    NAME_MAX2 = 120;
    DATE_MAX2 = 40;
    PACKED_MAX = 2e5;
    isRecord5 = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
    clean25 = (value, max2) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max2).trim();
    foldBattlefieldName = (value) => clean25(value, BATTLEFIELD_NAME_MAX).toLowerCase();
    memberList2 = (value) => {
      const members = [];
      const seen = /* @__PURE__ */ new Set();
      for (const entry of Array.isArray(value) ? value : []) {
        const name = clean25(entry, NAME_MAX2);
        const key = name.toLowerCase();
        if (!name || seen.has(key)) continue;
        seen.add(key);
        members.push(name);
        if (members.length >= MAX_SIDE_MEMBERS) break;
      }
      return members;
    };
    pairOf = (value, read) => [read(Array.isArray(value) ? value[0] : void 0), read(Array.isArray(value) ? value[1] : void 0)];
    amount = (fallback) => (value) => {
      const number = Number(value);
      return Number.isFinite(number) && number >= 0 ? number : fallback;
    };
    packed2 = (value) => typeof value === "string" && value.length <= PACKED_MAX && PACKED_TEXT.test(value) ? value : "";
    troopText = (value) => {
      const text3 = packed2(value);
      return text3.slice(0, Math.min(Math.floor(text3.length / TROOP_LETTERS), MAX_TROOPS_PER_SIDE) * TROOP_LETTERS);
    };
    sideIndex = (value) => value === 0 || value === 1 ? value : -1;
    normalizeOrder = (raw) => {
      if (!isRecord5(raw)) return null;
      const s = sideIndex(raw.s);
      const order = clean25(raw.order, 20).toLowerCase();
      if (s < 0 || !FRONT_ORDERS.includes(order)) return null;
      const entry = { s, sector: clean25(raw.sector, NAME_MAX2) || "all", order, since: clean25(raw.since, DATE_MAX2) };
      const objective = clean25(raw.objective, NAME_MAX2);
      if (objective) entry.objective = objective;
      const effort = clean25(raw.effort, 20).toLowerCase();
      if (FRONT_EFFORTS.includes(effort)) entry.effort = effort;
      const by = clean25(raw.by, NAME_MAX2);
      if (by) entry.by = by;
      if (raw.chosen === true) entry.chosen = true;
      const mark = entry.chosen || LINE_MARKS.includes(raw.mark) ? clean25(raw.mark, MARK_MAX) : "";
      if (mark) entry.mark = mark;
      const way = [];
      for (const point of Array.isArray(raw.way) ? raw.way : []) {
        const lng = Number(Array.isArray(point) ? point[0] : NaN);
        const lat = Number(Array.isArray(point) ? point[1] : NaN);
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90) continue;
        way.push([Math.round(lng * 1e4) / 1e4, Math.round(lat * 1e4) / 1e4]);
        if (way.length >= MAX_WAY_POINTS) break;
      }
      if (way.length > 0) entry.way = way;
      const attacks = entry.chosen ? readAttacks(raw.attacks) : [];
      if (attacks.length > 0) entry.attacks = attacks;
      return entry;
    };
    normalizeOrders = (value) => {
      const kept = [];
      const count4 = [0, 0];
      for (const raw of Array.isArray(value) ? value : []) {
        const order = normalizeOrder(raw);
        if (!order || count4[order.s] >= MAX_ORDERS_PER_SIDE) continue;
        count4[order.s] += 1;
        kept.push(order);
      }
      return kept;
    };
    normalizeNamed = (value) => {
      const kept = [];
      for (const raw of Array.isArray(value) ? value : []) {
        if (!isRecord5(raw)) continue;
        const s = sideIndex(raw.s);
        const i2 = Number(raw.i);
        const unitId = clean25(raw.unitId, NAME_MAX2);
        if (s < 0 || !Number.isInteger(i2) || i2 < 0 || i2 >= MAX_TROOPS_PER_SIDE || !unitId) continue;
        kept.push({ s, i: i2, name: clean25(raw.name, NAME_MAX2), unitId });
        if (kept.length >= MAX_NAMED_TROOPS) break;
      }
      return kept;
    };
    normalizeContested = (value) => {
      const kept = [];
      const known = /* @__PURE__ */ new Set();
      for (const raw of Array.isArray(value) ? value : []) {
        const regionId = clean25(Array.isArray(raw) ? raw[0] : "", NAME_MAX2);
        const shown = Array.isArray(raw) && typeof raw[1] === "string" ? clean25(raw[1], NAME_MAX2) : "";
        if (!regionId || !shown || known.has(regionId)) continue;
        known.add(regionId);
        kept.push([regionId, shown]);
        if (kept.length >= MAX_CONTESTED_REGIONS) break;
      }
      return kept;
    };
    normalizeLog = (value) => {
      const kept = [];
      for (const raw of Array.isArray(value) ? value : []) {
        if (!isRecord5(raw)) continue;
        const at = clean25(raw.at, LOG_TEXT_MAX);
        const k2 = clean25(raw.k, 24).toLowerCase();
        if (!at || !k2) continue;
        const entry = { d: clean25(raw.d, DATE_MAX2), k: k2, at };
        if (sideIndex(raw.s) >= 0) entry.s = raw.s;
        kept.push(entry);
      }
      return kept.slice(-MAX_LOG_ENTRIES);
    };
    normalizeBattlefield = (raw) => {
      if (!isRecord5(raw)) return null;
      const name = clean25(raw.name, BATTLEFIELD_NAME_MAX);
      const sides = pairOf(raw.sides, memberList2);
      const frame = normalizeFrame(raw.frame);
      if (!name || !frame || sides[0].length === 0 || sides[1].length === 0) return null;
      const status = BATTLEFIELD_STATUSES.includes(raw.status) ? raw.status : "active";
      const record = {
        v: BATTLEFIELD_VERSION,
        name,
        warId: clean25(raw.warId, NAME_MAX2),
        status,
        sides,
        openedDate: clean25(raw.openedDate, DATE_MAX2),
        asOf: clean25(raw.asOf, DATE_MAX2),
        frame,
        troops: pairOf(raw.troops, troopText),
        named: normalizeNamed(raw.named),
        pool: pairOf(raw.pool, amount(0)),
        base: pairOf(raw.base, amount(0)),
        quality: pairOf(raw.quality, amount(1)),
        effort: pairOf(raw.effort, (value) => FRONT_EFFORTS.includes(value) ? value : DEFAULT_EFFORT),
        // EXPERIMENT, in the lab (mind/policy.js): what a side's trained staff remembers, a list of numbers a side.
        ...Array.isArray(raw.mind) ? { mind: [0, 1].map((side) => Array.isArray(raw.mind[side]) ? raw.mind[side].slice(0, 64).map((value) => Number.isFinite(Number(value)) ? Number(value) : 0) : []) } : {},
        orders: normalizeOrders(raw.orders),
        replay: normalizeReplay(raw.replay),
        held: packed2(raw.held),
        contested: normalizeContested(raw.contested),
        brief: isRecord5(raw.brief) ? raw.brief : {},
        log: normalizeLog(raw.log),
        // What its war has come to, run by run (chronicle.js), for its report once it is over.
        ...readChronicle(raw.chronicle) ? { chronicle: readChronicle(raw.chronicle) } : {}
      };
      if (status === "closed") record.closedDate = clean25(raw.closedDate, DATE_MAX2);
      else if (isRecord5(raw.field)) record.field = { mask: packed2(raw.field.mask), band: packed2(raw.field.band), key: clean25(raw.field.key, 40) };
      return record;
    };
    made2 = /* @__PURE__ */ new WeakSet();
    results = /* @__PURE__ */ new WeakMap();
    normalizeBattlefields = (value) => {
      if (!Array.isArray(value)) return [];
      if (made2.has(value)) return value;
      const known = results.get(value);
      if (known) return known;
      const seen = /* @__PURE__ */ new Set();
      const open = [];
      const closed = [];
      for (const raw of value) {
        const record = normalizeBattlefield(raw);
        const key = record ? foldBattlefieldName(record.name) : "";
        if (!record || seen.has(key)) continue;
        seen.add(key);
        (record.status === "closed" ? closed : open).push(record);
      }
      const list12 = [...open.slice(0, MAX_BATTLEFIELDS), ...closed.slice(-MAX_CLOSED_BATTLEFIELDS)];
      made2.add(list12);
      results.set(value, list12);
      return list12;
    };
  }
});

// src/runtime/fronts/worldGrid.js
var PI, HALF_PI, RAD2, SINE_TERMS, COSINE_TERMS;
var init_worldGrid = __esm({
  "src/runtime/fronts/worldGrid.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_frame();
    PI = 3.141592653589793;
    HALF_PI = PI / 2;
    RAD2 = PI / 180;
    SINE_TERMS = [1, -1 / 6, 1 / 120, -1 / 5040, 1 / 362880, -1 / 39916800, 1 / 6227020800, -1 / 1307674368e3, 1 / 355687428096e3];
    COSINE_TERMS = [1, -1 / 2, 1 / 24, -1 / 720, 1 / 40320, -1 / 3628800, 1 / 479001600, -1 / 87178291200, 1 / 20922789888e3];
  }
});

// src/runtime/fronts/wayfinder.js
var MEDIA, WAY_POINTS_MOST, CANALS;
var init_wayfinder = __esm({
  "src/runtime/fronts/wayfinder.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_worldGrid();
    MEDIA = Object.freeze(["sea", "land", "air"]);
    WAY_POINTS_MOST = 48;
    CANALS = Object.freeze([
      {
        name: "Suez",
        since: 1869,
        a: [32.35, 31.55],
        b: [32.6, 29.6],
        // The Mediterranean off the delta and off the Levant, and the Red Sea; the delta, Sinai, the Negev and the Eastern Desert.
        sea: [[32.3, 32.2], [33.5, 32.6], [35, 26.5]],
        land: [[31.2, 30.1], [33.9, 29.6], [34.9, 30.9], [32.5, 27.5]]
      },
      {
        name: "Panama",
        since: 1914,
        a: [-79.95, 9.55],
        b: [-79.5, 8.75],
        // The Caribbean and the Pacific on either hand; Veraguas, the Darien, Costa Rica and Colombia.
        sea: [[-80, 10.2], [-78, 11], [-79.3, 8], [-82, 6.5]],
        land: [[-81, 8.5], [-78, 8.5], [-84, 10], [-76.5, 7]]
      }
    ]);
  }
});

// src/runtime/fronts/transports.js
var TRANSPORT_MEDIA, TRANSPORT_ORDERS, TRANSPORT_STATUSES, TRANSPORT_ENDED, MAX_TRANSPORTS, TRANSPORT_LOAD_MOST, TRANSPORT_HUNTERS_MOST, TRANSPORT_SPEED_KM, TRANSPORT_CAPACITY, CARRIERS, clean26, fold12, list10, clamp5, round3, numberOf, readPoint, readPlace, readLoad, readNames, normalizeTransport, normalizeTransports, INTERCEPT_REACH_KM, INTERCEPT_BASE, SHORE_REACH_KM, SHORE_BASE, HIT_SHARE;
var init_transports = __esm({
  "src/runtime/fronts/transports.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_unitMotion();
    init_constants();
    init_wayfinder();
    init_worldGrid();
    TRANSPORT_MEDIA = MEDIA;
    TRANSPORT_ORDERS = Object.freeze({ ship: "sea", rail: "land", airlift: "air" });
    TRANSPORT_STATUSES = Object.freeze(["ordered", "moving", "landed", "lost", "refused", "returned"]);
    TRANSPORT_ENDED = Object.freeze(["landed", "lost", "refused", "returned"]);
    MAX_TRANSPORTS = 24;
    TRANSPORT_LOAD_MOST = 40;
    TRANSPORT_HUNTERS_MOST = 6;
    TRANSPORT_SPEED_KM = Object.freeze({ sea: [40, 1400], land: [15, 1600], air: [300, 22e3] });
    TRANSPORT_CAPACITY = Object.freeze([1, 12]);
    CARRIERS = Object.freeze({
      sea: Object.freeze([
        Object.freeze({ since: 1940, kind: "troop convoy", speed: 720, capacity: 6 }),
        Object.freeze({ since: 1850, kind: "troopships", speed: 480, capacity: 5 }),
        Object.freeze({ since: -Infinity, kind: "transport fleet", speed: 190, capacity: 3 })
      ]),
      land: Object.freeze([
        Object.freeze({ since: 1920, kind: "troop trains", speed: 800, capacity: 4 }),
        Object.freeze({ since: 1840, kind: "troop trains", speed: 480, capacity: 4 }),
        Object.freeze({ since: -Infinity, kind: "wagon train", speed: 35, capacity: 2 })
      ]),
      air: Object.freeze([
        Object.freeze({ since: 1960, kind: "transport aircraft", speed: 15e3, capacity: 2 }),
        Object.freeze({ since: 1936, kind: "transport aircraft", speed: 5500, capacity: 1 })
      ])
    });
    clean26 = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    fold12 = (value) => clean26(value).toLowerCase();
    list10 = (value) => Array.isArray(value) ? value : [];
    clamp5 = (value, least, most) => Math.min(most, Math.max(least, value));
    round3 = (value) => Math.round(value * 1e3) / 1e3;
    numberOf = (value) => value === null || value === void 0 || value === "" ? NaN : Number(value);
    readPoint = (value) => {
      const lng = numberOf(Array.isArray(value) ? value[0] : value?.lng);
      const lat = numberOf(Array.isArray(value) ? value[1] : value?.lat);
      return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90 ? [round3(lng), round3(lat)] : null;
    };
    readPlace = (value) => {
      const point = readPoint(value);
      return point ? { lng: point[0], lat: point[1], name: clean26(value?.name, 120) } : null;
    };
    readLoad = (value) => {
      const load = [];
      for (const entry of list10(value)) {
        const strength = Math.round(Number(Array.isArray(entry) ? entry[0] : entry?.strength));
        const kind = Math.round(Number(Array.isArray(entry) ? entry[1] : entry?.kind));
        if (!(strength > 0)) continue;
        load.push([clamp5(strength, 1, 100), kind === 1 || kind === 2 ? kind : 0]);
        if (load.length >= TRANSPORT_LOAD_MOST) break;
      }
      return load;
    };
    readNames = (value, most) => {
      const names = [];
      for (const entry of list10(value)) {
        const name = clean26(entry);
        if (name && !names.some((other) => fold12(other) === fold12(name))) names.push(name);
        if (names.length >= most) break;
      }
      return names;
    };
    normalizeTransport = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const id = clean26(entry.id, 24);
      const medium = TRANSPORT_MEDIA.includes(entry.medium) ? entry.medium : "";
      const owner = clean26(entry.owner);
      const to = readPlace(entry.to) ?? (clean26(entry.to?.name) ? { lng: null, lat: null, name: clean26(entry.to.name) } : null);
      if (!id || !medium || !owner || !to) return null;
      const [slow, fast] = TRANSPORT_SPEED_KM[medium];
      const record = {
        id,
        medium,
        kind: clean26(entry.kind, 40),
        owner,
        warId: clean26(entry.warId, 80),
        battlefield: clean26(entry.battlefield, BATTLEFIELD_NAME_MAX),
        from: readPlace(entry.from),
        to,
        speed: clamp5(Math.round(Number(entry.speed) || 0) || slow, slow, fast),
        capacity: clamp5(Math.round(Number(entry.capacity) || 0) || 1, TRANSPORT_CAPACITY[0], TRANSPORT_CAPACITY[1]),
        load: readLoad(entry.load),
        status: TRANSPORT_STATUSES.includes(entry.status) ? entry.status : "ordered",
        ordered: clean26(entry.ordered, 40),
        departed: clean26(entry.departed, 40),
        due: clean26(entry.due, 40),
        ended: clean26(entry.ended, 40),
        way: list10(entry.way).map(readPoint).filter(Boolean).slice(0, WAY_POINTS_MOST),
        km: Math.max(0, Math.round(Number(entry.km) || 0)),
        gone: Math.max(0, Math.round(Number(entry.gone) || 0)),
        at: readPoint(entry.at),
        landing: readPoint(entry.landing),
        hunters: readNames(entry.hunters, TRANSPORT_HUNTERS_MOST),
        hits: Math.max(0, Math.round(Number(entry.hits) || 0)),
        sunk: Math.max(0, Math.round(Number(entry.sunk) || 0)),
        by: clean26(entry.by),
        note: clean26(entry.note, 160)
      };
      const attacks = readNames(entry.attacks, 2);
      if (attacks.length > 0) record.attacks = attacks;
      const raise = Math.round(Number(entry.raise) || 0);
      if (raise > 0 && record.load.length === 0) record.raise = clamp5(raise, 1, TRANSPORT_LOAD_MOST);
      const embark = entry.embark && typeof entry.embark === "object" ? entry.embark : null;
      if (embark && clean26(embark.battlefield) && (embark.side === 0 || embark.side === 1)) {
        const troops = [...new Set(list10(embark.troops).map(Number).filter((index) => Number.isInteger(index) && index >= 0))].slice(0, TRANSPORT_LOAD_MOST);
        if (troops.length > 0) record.embark = { battlefield: clean26(embark.battlefield, BATTLEFIELD_NAME_MAX), side: embark.side, troops };
      }
      return record;
    };
    normalizeTransports = (value) => {
      const kept = [];
      const seen = /* @__PURE__ */ new Set();
      for (const entry of list10(value)) {
        const record = normalizeTransport(entry);
        if (!record || seen.has(record.id)) continue;
        seen.add(record.id);
        kept.push(record);
      }
      return kept.slice(-MAX_TRANSPORTS);
    };
    INTERCEPT_REACH_KM = Object.freeze({ naval: Object.freeze({ sea: 380, air: 130, land: 0 }), air: Object.freeze({ sea: 900, air: 900, land: 650 }) });
    INTERCEPT_BASE = Object.freeze({ naval: Object.freeze({ sea: 0.26, air: 0.05, land: 0 }), air: Object.freeze({ sea: 0.16, air: 0.22, land: 0.09 }) });
    SHORE_REACH_KM = Object.freeze({ sea: 110, air: 220, land: 45 });
    SHORE_BASE = Object.freeze({ sea: 0.05, air: 0.09, land: 0.04 });
    HIT_SHARE = Object.freeze([0.3, 0.85]);
  }
});

// src/runtime/strikes.js
var STRIKE_WEAPONS, NUCLEAR_WEAPONS, AIRCRAFT_WEAPONS, STRIKE_COUNT_MOST, STRIKES_KEPT_MOST, clean27, list11, round42, numberOf2, readPlace2, normalizeStrike, normalizeStrikes, SEA_LAUNCH_KM;
var init_strikes = __esm({
  "src/runtime/strikes.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    STRIKE_WEAPONS = Object.freeze(["silo missile", "submarine missile", "missile strike", "nuclear bomber", "bombing run"]);
    NUCLEAR_WEAPONS = Object.freeze(["silo missile", "submarine missile", "nuclear bomber"]);
    AIRCRAFT_WEAPONS = Object.freeze(["nuclear bomber", "bombing run"]);
    STRIKE_COUNT_MOST = 500;
    STRIKES_KEPT_MOST = 48;
    clean27 = (value, most = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
    list11 = (value) => Array.isArray(value) ? value : [];
    round42 = (value) => Math.round(value * 1e4) / 1e4;
    numberOf2 = (value) => value === null || value === void 0 || value === "" ? NaN : Number(value);
    readPlace2 = (value) => {
      const name = clean27(typeof value === "string" ? value : value?.name);
      const lng = numberOf2(value?.lng);
      const lat = numberOf2(value?.lat);
      const placed = Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90;
      if (!name && !placed) return null;
      return { name, lng: placed ? round42(lng) : null, lat: placed ? round42(lat) : null };
    };
    normalizeStrike = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const id = clean27(entry.id, 40);
      const weapon = STRIKE_WEAPONS.includes(entry.weapon) ? entry.weapon : "";
      const owner = clean27(entry.owner);
      const to = readPlace2(entry.to);
      if (!id || !weapon || !owner || !to) return null;
      const count4 = Math.max(1, Math.min(STRIKE_COUNT_MOST, Math.round(Number(entry.count) || 0) || 1));
      return {
        id,
        eventId: clean27(entry.eventId, 80),
        date: clean27(entry.date, 40),
        round: Math.max(0, Math.round(Number(entry.round) || 0)),
        owner,
        weapon,
        count: count4,
        down: Math.max(0, Math.min(count4, Math.round(Number(entry.down) || 0))),
        from: readPlace2(entry.from),
        to
      };
    };
    normalizeStrikes = (value) => {
      const kept = [];
      const seen = /* @__PURE__ */ new Set();
      for (const entry of list11(value)) {
        const strike = normalizeStrike(entry);
        if (!strike || seen.has(strike.id)) continue;
        seen.add(strike.id);
        kept.push(strike);
      }
      return kept.slice(-STRIKES_KEPT_MOST);
    };
    SEA_LAUNCH_KM = Object.freeze({ least: 400, most: 2600, usual: 1200, offshore: 110 });
  }
});

// src/runtime/fronts/heldRegions.js
var init_heldRegions = __esm({
  "src/runtime/fronts/heldRegions.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/humanPolities.js
var init_humanPolities = __esm({
  "src/runtime/humanPolities.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/runtime/gameState.js
var WORLD_DEFAULTS, UNIT_TYPES, UNIT_TYPE_SET, UNIT_STATUSES, UNIT_STATUS_SET, UNIT_SOURCE_SET, UNIT_POSTURES, UNIT_POSTURE_SET, finiteOrNull, clampUnitStrength, cloneValue, normalizeString2, normalizeOptionalString, normalizeArray, WORLD_WAR_STATUS_SET, WORLD_RELATION_STATUS_SET, WORLD_AGREEMENT_TYPE_SET, WORLD_AGREEMENT_STATUS_SET, MAX_WORLD_WARS, WORLD_STORYLINE_STATUS_SET, MAX_WORLD_STORYLINES, MAX_WORLD_RELATIONS, MAX_WORLD_AGREEMENTS, normalizeTextLike, generateId, normalizeActionParticipants, normalizeUnitRevert, normalizeActionEntry, normalizeActions, normalizeInteractiveChoice, normalizeInteractiveHistoryEntry, normalizeInteractive, normalizeReactionMap, normalizeChatMessage, normalizeChatCountry, normalizeChatEntry, normalizeRegionTransfer, normalizeRegionClaim, POLITY_OPERATION_SET, POLITY_STATUS_SET, normalizeRegionControlOp, normalizePolityChange, normalizeUnitEntry, normalizeUnits, PENDING_ORDER_KIND_SET, normalizePendingUnitOrderEntry, normalizePendingUnitOrders, PENDING_ORDER_ARRIVAL_KM, pruneSatisfiedUnitOrders, MARKER_STATUSES, MARKER_STATUS_SET, MAX_MARKER_ALIASES, MAX_MARKER_SOURCE_EVENT_IDS, MAX_GM_AUDIT, hasOwn, normalizeMarkerNameList, normalizeMarkerSourceEventIds, normalizePendingEventOutreach, normalizeGameMasterAudit, normalizeMarkerEntry, normalizeApproximateMark, normalizeMarkers, normalizeMarkerPatch, normalizeMarkerOp, PROJECT_STATUSES, PROJECT_STATUS_SET, PROJECT_OPEN_STATUSES, PROJECT_KIND_SET, PROJECT_VERIFICATIONS, PROJECT_VERIFICATION_SET, PROJECT_SECRECY_SET, PROJECT_MILESTONE_STATUS_SET, PROJECT_MILESTONE_STATUS_ALIASES, resolveMilestoneStatus, PROJECT_STATUS_ALIASES, resolveProjectStatus, PROJECT_PRIORITIES, PROJECT_PRIORITY_SET, PROJECT_PRIORITY_ALIASES, resolveProjectPriority, MAX_PROJECTS, MAX_PROJECT_MILESTONES, MAX_PROJECT_EVENT_IDS, normalizeProjectMilestone, normalizeProjectMilestones, deriveNextMilestoneFrom, normalizeProjectOnComplete, normalizeProjectCoords, normalizeIdList, normalizeProjectEntry, capProjectList, normalizeProjects, PROJECT_FIELD_ALIASES, listProvidedFields, normalizeProjectOp, describeUnitOpRejection, REPORTED_UNIT_OP_DROPS_LIMIT, reportedUnitOpDrops, reportUnitOpDrop, awaitsPlacement, normalizeUnitOp, UNIT_SYSTEM_SET, normalizeCreatedChat, normalizePoliticalActorImpactOp, normalizeEventImpacts, EVENT_IMPACT_KEYS2, normalizeRenamedKind, normalizePolityOverride, normalizeActionSuggestions, normalizeHistoryDocument, normalizeConsolidatedHistory, clampWorldStorylinePercent, normalizeWorldStoryline, normalizeWorldStorylines, normalizeWorldWar, normalizeWorldWars, diplomaticIdentityIndexes, diplomaticIdentityIndexOf, resolveWorldDiplomaticPolity, worldRelationPairKey, normalizeWorldRelation, normalizeWorldRelations, normalizeWorldAgreement, normalizeWorldAgreements, normalizeWorldPuppet, normalizeWorldPuppets, withFormerSceneKeyMoved, normalizeWorldState, canonicalizeDateString, chatWriteQueue;
var init_gameState = __esm({
  "src/runtime/gameState.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_assets();
    init_mapClaims();
    init_populationFigure();
    init_record();
    init_blockade();
    init_alliances();
    init_peaceTerms();
    init_warWeariness();
    init_warResources();
    init_attrition();
    init_warSettings();
    init_warGeography();
    init_militaryStats();
    init_groups();
    init_translator();
    init_countryTags();
    init_puppets();
    init_polityRename();
    init_battlefieldNames();
    init_projects();
    init_eventDedup();
    init_eventTags();
    init_eventPlaces();
    init_eventQuote();
    init_eventAgency();
    init_ownerNames();
    init_polityFounding();
    init_territoryBasis();
    init_applicationReceipt();
    init_filedEvents();
    init_reports();
    init_gmChanges();
    init_playerGoal();
    init_interactiveOffer();
    init_spycraft();
    init_chatThreads();
    init_unseenEvents();
    init_countryStats();
    init_institutions();
    init_powerStatus();
    init_institutionLifecycleCore();
    init_politicalActors();
    init_politicalActorOps();
    init_politicalClock();
    init_polityIdentity();
    init_unitMotion();
    init_gameDates();
    init_record2();
    init_transports();
    init_strikes();
    init_heldRegions();
    init_humanPolities();
    WORLD_DEFAULTS = {
      actionSuggestions: [],
      // The interactive event being played, a scene of beats (AI/interactiveRewind.js).
      activeInteractive: null,
      // The event the last time skip offered to be played out as an interactive
      // event, { eventId, round }, until it is taken up, let pass or replaced by the
      // next skip's; and the round of the last offer made, which keeps offers rare
      // (interactiveOffer.js).
      interactiveOffer: null,
      lastInteractiveOfferRound: 0,
      consolidatedHistory: [],
      // The living history document the AI is shown in place of the folded events
      // (AI/historyConsolidation.js); null until the first consolidation pass.
      historyDocument: null,
      // Per-polity international reputation (0-100), evolved by the AI each turn via
      // polityChanges and fed back into prompts. Authoritative, unlike the on-demand
      // stat sheet it was first read from.
      internationalReputation: {},
      // Per-polity intelligence service (0-100), the same shape and lifecycle as
      // reputation: moved by the AI through polityChanges.intelligence, absent means
      // ordinary (see spycraft.js DEFAULT_INTELLIGENCE). It decides how much of an
      // intercepted exchange the player can read — and how much of the player's own
      // traffic a rival can.
      intelligence: {},
      // Every spy in the world, both directions: [{ id, owner, target, deployedAt,
      // status, turnedAt, exposedAt, coverStory, suspected }] — see spycraft.js for
      // the statuses. What the player's spies bring back lives in the intercepts
      // asset, sealed under spySeal (see readInterceptsState, spySeal.js).
      spies: [],
      // Random per-game key the intercepts are sealed with. Minted the first time a
      // spy exists; 64 hex chars.
      spySeal: "",
      // Bounded audit trail of applied GM Console transactions. Administrative
      // history, not a second world model: canonical state stays in the ledgers
      // below; the record keeps the exact previewed transaction for debugging.
      gmAudit: [],
      // Every change made outside the simulation — the GM console and each cheats
      // tool — one line each, tagged with its round, newest first; the next skip is
      // told the ones from the round it starts in. And the Game Master's standing
      // reminders, which every AI in the game is shown. See gmChanges.js.
      gmChanges: [],
      simulationReminders: [],
      // What each player's government is steering toward, set in the Actions panel:
      // polity name -> { text, round, date }. Told to the advisor, the time skip and
      // the suggestions, never to a foreign leader. See playerGoal.js.
      playerGoals: {},
      // Persisted per-country stat sheets (code -> the full sheet), seeded on first view
      // and thereafter changed ONLY by the AI (polityChanges.stats), so a country's stats
      // stop regenerating/drifting every date change.
      countryStats: {},
      // Continuum canonical political substrate. These are native world-state ledgers,
      // not editable Stats aliases: UI/AI consumers project from them through bounded
      // political knowledge/context seams.
      politicalActors: { schemaVersion: POLITICAL_ACTORS_SCHEMA_VERSION, byPolity: {} },
      politicalSimulation: normalizePoliticalSimulationClock({}),
      institutions: { schemaVersion: 1, ledgerVersion: 0, byId: {} },
      powerStatus: { schemaVersion: 1, byPolity: {} },
      // Per-country tags the AI has changed: owner code -> string[]. The scenario's
      // tags.json holds the map-maker's STARTING tags; this holds every change since,
      // and wins where present (see resolveCountryTags).
      countryTags: {},
      // AI renames of STOCK map cities (which live in PMTiles, not world.markers):
      // lowercased original city name -> new display name. world.markers cities are
      // renamed in place by applyMarkerOps; this is the override layer for the rest.
      cityRenames: {},
      // AI changes to a city's POPULATION, same override shape as cityRenames and for
      // the same reason: stock cities live in PMTiles and cannot be edited in place.
      // Lowercased original city name -> number. Applies to authored cities too, so a
      // siege or a boom moves one number wherever the city came from.
      cityPopulations: {},
      // Country-label styling, set in the scenario settings. Empty = the defaults
      // (Georgia, white letters, half-black outline). The font renders from the
      // PLAYER's local fonts — the style has no glyphs endpoint, so MapLibre v5
      // rasterizes every glyph client-side using the stack as a CSS font-family.
      labelFont: "",
      labelHaloColor: "",
      labelTextColor: "",
      language: "English",
      lastJumpMode: "",
      lastJumpSummary: "",
      lastJumpTargetDate: "",
      // Structures built during play (world.markers[]): free-form kinds — a city, a
      // military base, a bunker, a missile silo, an embassy — placed at coordinates
      // and rendered as map markers beside the stock cities. Stored here so they
      // share every existing read/write/poll/normalize path, exactly like units.
      markers: [],
      // Documents held by the governments they were addressed to (runtime/reports.js):
      // a secret pact, a letter, an intelligence assessment. Written by events
      // (impacts.reports); read by an audience through visibleTo. Listed in the
      // normalizeWorldState return too, for the reason given elsewhere here.
      reports: [],
      // How far each polity has been shown of each OTHER thread it is party to
      // (AI/crossChatKnowledge.js): "<threadId>|<polity>" -> the last message id it
      // was shown. Keeps a leader from being handed the same exchange twice, and a
      // long campaign from growing the chat prompt without bound.
      chatKnowledgeCursors: {},
      // Refusals of an Overlord's demand the engine has already charged, by the id of
      // the message that carried them (chargeRefusals). It lives HERE, and not as a
      // stamp on the message, because of who writes what: every writer of the world
      // re-reads it at write time, while chats are written from whatever copy each
      // panel happens to hold — so a stamp on a message was erased by the next save
      // from a stale panel, and the refusal charged again on every jump after.
      // Written only by the turn, so it rides the turn's restore point like the
      // puppet ledger it pays into. Never sent to a model.
      chargedRefusals: [],
      // Real-time grace-period queue for optional Event Editor -> NPC diplomatic
      // reactions. Pending evaluations only, never chats: the conversation itself
      // is created later through the normal chat merge seam.
      pendingEventOutreach: [],
      // Bumped by every idle world pulse (see gameplay.js). It is the third component
      // of a patrolling unit's position seed, which is what lets a fleet on station
      // visibly reposition between pulses even though no game time has passed. Listed
      // in the normalizeWorldState return too — this spread is overwritten by the
      // incoming world, so a field declared only here never survives a round trip.
      idlePulseTick: 0,
      // The round the Projects board was last checked against a turn's events (the
      // time skip's own board ops, the turn review's board job, or the board's own
      // request). 0 = never. It is
      // what lets a skip decide, without asking anyone, whether the calendar is due
      // another look (projects.js boardPassReasons). Listed in the normalizeWorldState
      // return too, for the reason given above.
      boardReviewedRound: 0,
      // Standing multi-turn orders the ENGINE advances: {id, unitId, kind, toLng,
      // toLat, radiusKm, untilRound, targetId, targetLabel, note, issuedAt,
      // issuedRound}. kind is "move" (travel to a destination) or "patrol" (work a
      // station centred on it). Independent of the actions queue (which a jump's
      // single clearActions flag wipes wholesale), so a unit ordered across an ocean
      // keeps advancing every turn until it arrives — see advanceStandingOrders and
      // pruneSatisfiedUnitOrders below.
      pendingUnitOrders: [],
      polityOverrides: {},
      // Long-running efforts the player is pursuing or has learned of: research
      // programmes, construction projects, military and political operations. Only
      // the AI writes these -- events via impacts.projectOps, the advisor via its
      // ```projects block -- because a hand-editable board would drift out of step
      // with the narrative that is supposed to be driving it. Listed in the
      // normalizeWorldState return too: this spread is overwritten by the incoming
      // world, so a field declared only here never survives a round trip.
      projects: [],
      // Region id -> claimant polity names: the world-data way to mark a region
      // DISPUTED (striped in the administrator's + claimants' colors). Same effect
      // as a claimants list on the region's geojson feature, but declarable by a
      // scenario whose geometry ships as an immutable seed (the modern world), and
      // overridable per-world without touching geometry. Wins over feature props.
      regionClaimants: {},
      // Region ids whose dispute the world has ended — renounced, cleared, handed
      // over cleanly. The claimant list stays sparse (no row once a region is
      // undisputed), so without this the map could not tell a dispute that ended
      // from one never recorded, and drew the claimants the region's geojson feature
      // bakes in again. A region disputed anew leaves the list. See
      // settleRegionClaims.
      settledRegionClaims: [],
      // Groups: actors that are not countries — a terrorist organisation, a cartel,
      // a zombie outbreak — keyed by exact name, each with a description (what the
      // AI is told it is) and a colour (runtime/groups.js). A group owns no land;
      // groupAreas says which regions it CONTROLS (region id -> group name, one
      // group per region), drawn outlined and tinted over the countries' colours.
      groups: {},
      groupAreas: {},
      regionOwnershipOverrides: {},
      // Legal sovereignty where it differs from the polity administering a region
      // (an occupation). Sparse: normal territory has no row. Written by legal
      // regionTransfers and by de-facto regionControlOps, which anchor the lawful
      // sovereign before control flips.
      regionSovereigntyOverrides: {},
      // Canonical diplomacy and belligerency, owned by the engine (see
      // AI/nativeDiplomaticDirector.js and AI/nativeWarLedger.js). Relations say
      // how warm a pair of polities is; agreements are the formal instruments in
      // force between them; wars say who is mechanically at war with whom - the
      // ONLY thing that licenses a battle event. The model changes them through the
      // compact warUpdates / relationUpdates / agreementUpdates lines on a jump
      // payload, never by writing them. Listed in the normalizeWorldState return
      // too, for the usual reason.
      relations: [],
      agreements: [],
      // Bumped once migrateLegacyDiplomaticState has seeded the two ledgers from a
      // save's older treaty/alliance events, so that only ever happens once.
      diplomaticLedgerVersion: 0,
      wars: [],
      // Where land wars are fought: two sides, the troops each has there, and the
      // front line between what each holds (runtime/fronts/record.js). Written by
      // the front engine and by nothing else.
      battlefields: [],
      // The transporters carrying troops to where their side holds no land
      // (fronts/transports.js): ordered, under way, and those that ended last turn.
      transports: [],
      // The missiles and bombing runs the last turns' events told of, for the map
      // to play (strikes.js). They change nothing by themselves.
      strikes: [],
      // The battles the last turns' fleets fought (naval/record.js), for the map to
      // mark. What a battle did to the fleets is on the fleets.
      seaBattles: [],
      // When each country was last given a navy by the game, or lost the last of
      // one (naval/record.js): a navy sunk is not handed back the turn after.
      naviesRaised: [],
      // The blockades that stand (naval/blockade.js): how hard each presses on its
      // country and how many days it has stood. Written by the war at sea; the
      // land war and the economy read them.
      blockades: [],
      // How weary of war each country is, 0 to 100 (warWeariness.js): the game's
      // own figure, moved every turn by what the turn did to it.
      warWeariness: [],
      // What each country has left to fight with, 0 to 100 (warResources.js): spent
      // by advancing and building fortified lines, refilled by its funding.
      warResources: [],
      // What the weather and being cut off have cost each country at war (attrition.js).
      attrition: [],
      // How the scenario's wars are fought (warSettings.js): null where it says nothing.
      warSettings: null,
      // What the scenario draws on its map for war (warGeography.js): ground harder
      // to cross, walls that must be broken through, its own climates, and the
      // water that freezes in winter.
      terrainAreas: [],
      fortifications: [],
      climateZones: [],
      freezingRegions: [],
      // The water frozen as the last turn left it (runtime/fronts/climate.js): for the map to show as ice.
      frozenRegions: [],
      // Each climate zone's weather as the last turn left it (runtime/zoneWeather.js): the map's patches of weather.
      zoneWeather: null,
      // Peace (peaceTerms.js): the offers that wait for an answer or were given
      // one, the reparations being paid, and the last peaces made on terms.
      peaceOffers: [],
      reparations: [],
      peaceTreaties: [],
      // Alliances coming due (alliances.js): who was called on to defend whom in
      // which war, and what they answered.
      callsToArms: [],
      // Subordinations: who directs whom. Directional, partly secret, and written
      // only through the diplomatic director's compact puppetUpdates lines — see
      // docs/adr/0004-puppet-ledger-and-secrecy.md.
      puppets: [],
      // Persistent storylines: the hidden state of the world's ongoing processes
      // (AI/nativeWorldDirector.js), advanced by compact storylineUpdates lines on
      // a jump payload exactly like the ledgers above.
      storylines: [],
      simulationHistory: [],
      simulationRules: "",
      startingTimelineText: "",
      units: []
    };
    UNIT_TYPES = ["infantry", "armor", "air", "naval", "artillery", "garrison"];
    UNIT_TYPE_SET = new Set(UNIT_TYPES);
    UNIT_STATUSES = ["idle", "moving", "engaged", "defeated", "pending"];
    UNIT_STATUS_SET = new Set(UNIT_STATUSES);
    UNIT_SOURCE_SET = /* @__PURE__ */ new Set(["player", "ai", "scenario"]);
    UNIT_POSTURES = [
      "holding",
      "massing",
      "patrol",
      "transit",
      "exercise",
      "blockade",
      "withdrawing",
      // The one posture that also moves the lifecycle: a formation arriving under
      // "assaulting" is stamped status "engaged" rather than "idle" (applyUnitOpBatch).
      // It exists so the BETA system can express a province assault at all. Classic
      // players get there through the Attack button, which does the same bookkeeping
      // locally; beta has no such button by design ("intent, not control"), so a typed
      // order like "Attack Provence" has to be something the MODEL can enact — and
      // without this it could only ever hand back a unit reading "idle" on the
      // objective it had just stormed.
      "assaulting"
    ];
    UNIT_POSTURE_SET = new Set(UNIT_POSTURES);
    finiteOrNull = (value) => {
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
      if (typeof value !== "string") {
        const num2 = Number(value);
        return Number.isFinite(num2) ? num2 : null;
      }
      let text3 = value.trim();
      if (!text3) return null;
      let sign = 1;
      const hemisphere = /^([NSEW])\s*|\s*([NSEW])$/i.exec(text3);
      if (hemisphere) {
        const letter = (hemisphere[1] || hemisphere[2]).toUpperCase();
        if (letter === "S" || letter === "W") sign = -1;
        text3 = text3.replace(/^[NSEW]\s*/i, "").replace(/\s*[NSEW]$/i, "");
      }
      if (text3.includes(",") && !text3.includes(".")) text3 = text3.replace(",", ".");
      text3 = text3.replace(/[^\d+\-.eE]/g, "");
      if (!text3 || !/\d/.test(text3)) return null;
      const num = Number(text3);
      return Number.isFinite(num) ? sign * num : null;
    };
    clampUnitStrength = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return 100;
      const percent2 = num > 100 ? num / 10 : num;
      return Math.max(0, Math.min(100, Math.round(percent2)));
    };
    cloneValue = (value) => {
      if (value == null) return value;
      if (typeof structuredClone === "function") {
        return structuredClone(value);
      }
      return JSON.parse(JSON.stringify(value));
    };
    normalizeString2 = (value) => String(value ?? "").trim();
    normalizeOptionalString = (value) => {
      const nextValue = normalizeString2(value);
      return nextValue || "";
    };
    normalizeArray = (value) => Array.isArray(value) ? value : [];
    WORLD_WAR_STATUS_SET = /* @__PURE__ */ new Set(["active", "ceasefire", "ended"]);
    WORLD_RELATION_STATUS_SET = /* @__PURE__ */ new Set(["friendly", "cordial", "neutral", "cautious", "strained", "hostile", "rival"]);
    WORLD_AGREEMENT_TYPE_SET = /* @__PURE__ */ new Set(["alliance", "mutual_defense", "guarantee", "non_aggression", "friendship_consultation", "trade_economic", "military_cooperation", "military_access", "neutrality", "peace_settlement", "other"]);
    WORLD_AGREEMENT_STATUS_SET = /* @__PURE__ */ new Set(["active", "suspended", "ended", "expired"]);
    MAX_WORLD_WARS = 64;
    WORLD_STORYLINE_STATUS_SET = /* @__PURE__ */ new Set(["active", "dormant", "resolved"]);
    MAX_WORLD_STORYLINES = 96;
    MAX_WORLD_RELATIONS = 256;
    MAX_WORLD_AGREEMENTS = 128;
    normalizeTextLike = (value) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return normalizeOptionalString(value);
      }
      if (value && typeof value === "object") {
        return normalizeOptionalString(
          value.text ?? value.title ?? value.label ?? value.name ?? value.summary ?? value.description ?? value.content ?? value.result
        );
      }
      return "";
    };
    generateId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    normalizeActionParticipants = (value) => normalizeArray(value).map((entry) => normalizeString2(entry)).filter(Boolean);
    normalizeUnitRevert = (value) => {
      if (!value || typeof value !== "object") return null;
      const unitId = normalizeOptionalString(value.unitId);
      if (!unitId) return null;
      const lng = finiteOrNull(value.lng);
      const lat = finiteOrNull(value.lat);
      const restore = value.restore && typeof value.restore === "object" ? normalizeUnitEntry({ ...value.restore, id: unitId }) : null;
      return {
        unitId,
        ...lng !== null && lat !== null ? { lng, lat } : {},
        ...value.remove === true ? { remove: true } : {},
        ...restore ? { restore } : {},
        ...normalizeOptionalString(value.status) ? { status: normalizeOptionalString(value.status) } : {},
        // The standing multi-turn order (world.pendingUnitOrders) this move/attack
        // created, if any — so deleting the queued action also cancels the order
        // instead of leaving an orphaned "keep advancing this unit" entry behind.
        ...normalizeOptionalString(value.pendingOrderId) ? { pendingOrderId: normalizeOptionalString(value.pendingOrderId) } : {}
      };
    };
    normalizeActionEntry = (entry, index = 0) => {
      if (typeof entry === "string") {
        const text4 = normalizeString2(entry);
        if (!text4) return null;
        return {
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          id: generateId(`action-${index}`),
          kind: "action",
          participants: [],
          rawInput: text4,
          source: "manual",
          status: "planned",
          text: text4,
          title: text4.length > 64 ? `${text4.slice(0, 61)}...` : text4
        };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const rawInput = normalizeTextLike(entry.rawInput || entry.input || entry.text || entry.content);
      const text3 = normalizeTextLike(entry.text || entry.content || entry.body || rawInput);
      const title = normalizeTextLike(entry.title || entry.name) || (text3.length > 64 ? `${text3.slice(0, 61)}...` : text3);
      if (!title && !text3 && !rawInput) {
        return null;
      }
      const kind = normalizeString2(entry.kind || entry.type).toLowerCase() === "chat" ? "chat" : "action";
      const unitRevert = normalizeUnitRevert(entry.unitRevert);
      return {
        chatStarter: normalizeOptionalString(entry.chatStarter || entry.openingMessage),
        createdAt: normalizeOptionalString(entry.createdAt) || (/* @__PURE__ */ new Date()).toISOString(),
        id: normalizeOptionalString(entry.id) || generateId(`action-${index}`),
        invitees: normalizeActionParticipants(entry.invitees),
        kind,
        participants: normalizeActionParticipants(entry.participants),
        rawInput: rawInput || text3 || title,
        source: normalizeOptionalString(entry.source) || "manual",
        status: normalizeOptionalString(entry.status) || "planned",
        suggestionTopic: normalizeOptionalString(entry.suggestionTopic || entry.topic),
        text: text3 || rawInput || title,
        title: title || rawInput || text3,
        ...unitRevert ? { unitRevert } : {},
        // Carried over unanswered from the last time skip (AI/playerFocus.js
        // settleOrders): the next skip answers it first.
        ...entry.overdue === true ? { overdue: true } : {},
        // The polity whose order this is, in a shared game (runtime/humanPolities.js).
        // Single player's orders name none: they are the player's.
        ...normalizeOptionalString(entry.ownerCode) ? { ownerCode: normalizeOptionalString(entry.ownerCode) } : {}
      };
    };
    normalizeActions = (actions) => normalizeArray(actions).map((entry, index) => normalizeActionEntry(entry, index)).filter(Boolean);
    normalizeInteractiveChoice = (entry, index = 0) => {
      if (typeof entry === "string") {
        const text4 = normalizeString2(entry);
        if (!text4) {
          return null;
        }
        return {
          id: generateId(`interactive-choice-${index}`),
          result: "",
          text: text4
        };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const text3 = normalizeTextLike(entry.text || entry.title || entry.label || entry.name);
      if (!text3) {
        return null;
      }
      return {
        ...cloneValue(entry),
        id: normalizeOptionalString(entry.id) || generateId(`interactive-choice-${index}`),
        result: normalizeTextLike(entry.result || entry.summary || entry.outcome || entry.effect || entry.description),
        text: text3
      };
    };
    normalizeInteractiveHistoryEntry = (entry, index = 0) => {
      if (typeof entry === "string") {
        const summary2 = normalizeString2(entry);
        if (!summary2) {
          return null;
        }
        return {
          choice: `Step ${index + 1}`,
          summary: summary2
        };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const choice = normalizeTextLike(entry.choice || entry.text || entry.title || entry.name);
      const summary = normalizeTextLike(entry.summary || entry.result || entry.outcome || entry.description);
      if (!choice && !summary) {
        return null;
      }
      return {
        ...cloneValue(entry),
        choice: choice || `Step ${index + 1}`,
        summary
      };
    };
    normalizeInteractive = (value) => {
      if (!value || typeof value !== "object") {
        return null;
      }
      const title = normalizeTextLike(value.title || value.name);
      const premise = normalizeTextLike(value.premise || value.summary || value.description);
      const opening = normalizeTextLike(value.opening || value.text || premise);
      const choices = normalizeArray(value.choices).map((entry, index) => normalizeInteractiveChoice(entry, index)).filter(Boolean);
      const history = normalizeArray(value.history).map((entry, index) => normalizeInteractiveHistoryEntry(entry, index)).filter(Boolean);
      if (!title && !premise && !opening && choices.length === 0 && history.length === 0) {
        return null;
      }
      return {
        ...cloneValue(value),
        choices,
        history,
        opening,
        premise,
        title
      };
    };
    normalizeReactionMap = (value) => {
      if (!value || typeof value !== "object") {
        return {};
      }
      return Object.fromEntries(
        Object.entries(value).map(([name, reaction]) => {
          if (!reaction || typeof reaction !== "object") {
            return [name, null];
          }
          const emoji = normalizeOptionalString(reaction.emoji);
          const code = normalizeOptionalString(reaction.code);
          const country = normalizeOptionalString(reaction.country);
          if (!emoji && !code) {
            return [name, null];
          }
          return [
            name,
            {
              ...code ? { code } : {},
              ...emoji ? { emoji } : {},
              ...country ? { country } : {}
            }
          ];
        }).filter(([, reaction]) => reaction)
      );
    };
    normalizeChatMessage = (message, index = 0) => {
      if (typeof message === "string") {
        const text4 = normalizeString2(message);
        if (!text4) return null;
        return {
          code: "",
          id: generateId(`message-${index}`),
          reactions: {},
          role: "system",
          speaker: "",
          text: text4,
          time: "",
          memorySummary: ""
        };
      }
      if (!message || typeof message !== "object") {
        return null;
      }
      const text3 = normalizeOptionalString(message.text || message.message || message.content);
      if (!text3) {
        return null;
      }
      const eventId = normalizeOptionalString(message.eventId);
      const catchUp = normalizeOptionalString(message.catchUp);
      const catchUpLabel = normalizeOptionalString(message.catchUpLabel);
      return {
        code: normalizeOptionalString(message.code),
        id: normalizeOptionalString(message.id) || generateId(`message-${index}`),
        reactions: normalizeReactionMap(message.reactions),
        role: normalizeOptionalString(message.role || message.sender) || "system",
        speaker: normalizeOptionalString(message.speaker || message.senderName),
        // Rolling durable diplomatic memory attached to a message: never rendered as
        // chat text, it lets long negotiations stay bounded without forgetting
        // agreements, threats or unresolved proposals (promptContext reads the latest).
        memorySummary: normalizeOptionalString(message.memorySummary || message.diplomaticMemorySummary),
        text: text3,
        time: normalizeOptionalString(message.time || message.date),
        ...eventId ? { eventId } : {},
        ...catchUp ? { catchUp, ...catchUpLabel ? { catchUpLabel } : {} } : {}
      };
    };
    normalizeChatCountry = (entry) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === "string") {
        const name2 = normalizeString2(entry);
        if (!name2) return null;
        return {
          code: "",
          name: name2
        };
      }
      if (typeof entry !== "object") {
        return null;
      }
      const name = normalizeOptionalString(entry.name || entry.label || entry.country);
      const code = normalizeOptionalString(entry.code || entry.id);
      if (!name && !code) {
        return null;
      }
      return {
        code,
        name: name || code,
        ...normalizeOptionalString(entry.polityKey) ? { polityKey: normalizeOptionalString(entry.polityKey) } : {}
      };
    };
    normalizeChatEntry = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const institutionId = normalizeOptionalString(entry.institutionId || entry.channelInstitutionId);
      const lifecycleInstitutionId = normalizeOptionalString(entry.lifecycleInstitutionId || entry.institutionLifecycleId);
      const lifecycleCaseIds = normalizeArray(entry.lifecycleCaseIds || entry.institutionLifecycleCaseIds).map((value) => normalizeOptionalString(value)).filter(Boolean).slice(0, 32);
      const countries = normalizeArray(entry.countries || entry.participants).map((country) => normalizeChatCountry(country)).filter(Boolean);
      if (countries.length === 0 && !institutionId) return null;
      const events = withUnloggedMessages(normalizeChatEvents(entry.events), entry.messages, { threadId: entry.id });
      const projected = events.length ? projectChatThread(events) : null;
      const owner = normalizeOptionalString(entry.player);
      return {
        countries: projected?.countries?.length ? projected.countries : countries,
        id: normalizeOptionalString(entry.id) || generateId(`chat-${index}`),
        ...owner ? { player: owner } : {},
        ...institutionId ? { institutionId } : {},
        ...lifecycleInstitutionId ? { lifecycleInstitutionId } : {},
        ...lifecycleCaseIds.length ? { lifecycleCaseIds } : {},
        linkedEventId: normalizeOptionalString(entry.linkedEventId || entry.eventId),
        messages: projected ? projected.messages.map((message, messageIndex) => normalizeChatMessage(message, messageIndex)).filter(Boolean) : normalizeArray(entry.messages).map((message, messageIndex) => normalizeChatMessage(message, messageIndex)).filter(Boolean),
        ...events.length ? { events } : {},
        // The binding votes the log carries, ready for the panel to render.
        ...projected?.polls?.length ? { polls: projected.polls } : {},
        // The demands the log carries (chatThreads.js), for the panel's demand card
        // and for the turn that charges a refusal.
        ...projected?.demands?.length ? { demands: projected.demands } : {},
        source: projected?.source || normalizeOptionalString(entry.source) || "manual",
        status: normalizeOptionalString(entry.status) || "open",
        title: projected?.title || normalizeOptionalString(entry.title)
      };
    };
    normalizeRegionTransfer = (entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const regionId = normalizeOptionalString(entry.regionId || entry.id || entry.gid || entry.GID_1);
      const toCode = toCountryName(normalizeOptionalString(entry.toCode || entry.toPolity || entry.ownerCode || entry.owner));
      const fromCode = toCountryName(normalizeOptionalString(entry.fromCode || entry.fromPolity));
      if (!regionId || !toCode) {
        return null;
      }
      const basis = normalizeTerritoryBasis(entry.basis);
      return {
        ...basis ? { basis } : {},
        fromCode,
        note: normalizeOptionalString(entry.note || entry.reason),
        regionId,
        regionName: normalizeOptionalString(entry.regionName || entry.name),
        toCode
      };
    };
    normalizeRegionClaim = (entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const regionId = normalizeOptionalString(entry.regionId || entry.id || entry.gid || entry.GID_1);
      const claimantCode = toCountryName(normalizeOptionalString(
        entry.claimantCode || entry.claimant || entry.byCode || entry.ownerCode || entry.code
      ));
      if (!regionId || !claimantCode) {
        return null;
      }
      return {
        claimantCode,
        drop: entry.drop === true || entry.drop === "true" || entry.op === "drop" || entry.op === "renounce",
        note: normalizeOptionalString(entry.note || entry.reason),
        regionId,
        regionName: normalizeOptionalString(entry.regionName || entry.name)
      };
    };
    POLITY_OPERATION_SET = /* @__PURE__ */ new Set(["update", "create", "rename", "restore", "dissolve"]);
    POLITY_STATUS_SET = /* @__PURE__ */ new Set(["active", "dormant", "dissolved"]);
    normalizeRegionControlOp = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const op = normalizeOptionalString(entry.op).toLowerCase();
      const regionId = normalizeOptionalString(entry.regionId || entry.id || entry.gid || entry.GID_1);
      const regionName = normalizeOptionalString(entry.regionName || entry.name);
      const fromCode = toCountryName(normalizeOptionalString(entry.fromCode || entry.fromPolity));
      const note = normalizeOptionalString(entry.note || entry.reason);
      if (!regionId) return null;
      if (op === "contest") {
        const actorCode = toCountryName(normalizeOptionalString(entry.actorCode || entry.claimantCode || entry.toCode));
        if (!fromCode || !actorCode || fromCode.toLowerCase() === actorCode.toLowerCase()) return null;
        return { op, regionId, regionName, fromCode, actorCode, note };
      }
      if (op === "control" || op === "control_flip") {
        const toCode = toCountryName(normalizeOptionalString(entry.toCode || entry.controllerCode || entry.ownerCode));
        if (!fromCode || !toCode || fromCode.toLowerCase() === toCode.toLowerCase()) return null;
        const basis = normalizeTerritoryBasis(entry.basis);
        return {
          op: "control",
          regionId,
          regionName,
          fromCode,
          toCode,
          note,
          ...basis ? { basis } : {},
          ...entry.wholeCountry === true ? { wholeCountry: true } : {},
          // A change the front engine worked out from where the line stands, not
          // one the model wrote: a turn applied a second time takes these out and
          // works them out afresh (AI/frontTurn.js).
          ...entry.by === "front" ? { by: "front" } : {}
        };
      }
      if (op === "clear_contest" || op === "clear") {
        const claimantCode = toCountryName(normalizeOptionalString(entry.claimantCode || entry.actorCode));
        const clearAll = entry.clearAll === true || normalizeOptionalString(entry.claimantCode).toLowerCase() === "all";
        if (!claimantCode && !clearAll) return null;
        return {
          op: "clear_contest",
          regionId,
          regionName,
          fromCode,
          claimantCode,
          clearAll,
          note
        };
      }
      return null;
    };
    normalizePolityChange = (entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const code = toCountryName(normalizeOptionalString(entry.code || entry.id || entry.polityCode));
      if (!code) {
        return null;
      }
      const rawReputation = Number(entry.reputation ?? entry.internationalReputation);
      const reputation = Number.isFinite(rawReputation) ? Math.max(0, Math.min(100, Math.round(rawReputation))) : null;
      const rawIntelligence = Number(entry.intelligence ?? entry.intelligenceService);
      const intelligence = Number.isFinite(rawIntelligence) ? Math.max(0, Math.min(100, Math.round(rawIntelligence))) : null;
      const tags = Array.isArray(entry.tags || entry.countryTags) ? normalizeTagList(entry.tags || entry.countryTags) : null;
      const stats = entry.stats && typeof entry.stats === "object" && !Array.isArray(entry.stats) ? entry.stats : null;
      const military = normalizeMilitaryShift(entry.military);
      const rawOperation = normalizeOptionalString(entry.operation || entry.op || entry.action).toLowerCase();
      const operation = POLITY_OPERATION_SET.has(rawOperation) ? rawOperation : "update";
      return {
        aliases: normalizeActionParticipants(entry.aliases || entry.additionalNames),
        code,
        color: normalizeOptionalString(entry.color),
        name: normalizeOptionalString(entry.name || entry.newName),
        intelligence,
        ...military ? { military } : {},
        note: normalizeOptionalString(entry.note || entry.reason),
        operation,
        reputation,
        stats,
        tags
      };
    };
    normalizeUnitEntry = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const rawLng = finiteOrNull(entry.lng ?? entry.lon ?? entry.longitude);
      const lng = rawLng === null ? null : wrapLng(rawLng);
      const lat = finiteOrNull(entry.lat ?? entry.latitude);
      const ownerCode = toCountryName(normalizeOptionalString(entry.ownerCode || entry.owner || entry.code));
      if (lng === null || lat === null || lng === 0 && lat === 0 || !ownerCode) {
        return null;
      }
      const type = normalizeOptionalString(entry.type).toLowerCase();
      const status = normalizeOptionalString(entry.status).toLowerCase();
      const source = normalizeOptionalString(entry.source).toLowerCase();
      const posture = normalizeOptionalString(entry.posture).toLowerCase();
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      return {
        id: normalizeOptionalString(entry.id) || generateId(`unit-${index}`),
        name: normalizeOptionalString(entry.name) || "Unit",
        type: UNIT_TYPE_SET.has(type) ? type : "infantry",
        ownerCode,
        strength: clampUnitStrength(entry.strength ?? 100),
        lng,
        lat,
        regionId: normalizeOptionalString(entry.regionId),
        status: UNIT_STATUS_SET.has(status) ? status : "idle",
        // What the formation is made of, in words — "1 aircraft carrier, 2 frigates".
        // Together with `note` this is what turns a coloured dot into something the
        // player can actually reason about.
        composition: normalizeOptionalString(entry.composition),
        // One present-tense sentence: "Patrolling the North Atlantic approaches".
        note: normalizeOptionalString(entry.note),
        // Intent, not lifecycle. Unknown values fall back to "" rather than a default,
        // so an absent posture stays absent instead of asserting something untrue.
        posture: UNIT_POSTURE_SET.has(posture) ? posture : "",
        // "No confirmed line of support" — a covert insertion OR a presence the player
        // has only just detected. Engine-assigned (see applyUnitOpBatch); never taken
        // from the model, or it would claim covert whenever convenient.
        covert: entry.covert === true,
        // The event that created or last moved this unit, so the popup can say what
        // put it there and click through to it.
        eventId: normalizeOptionalString(entry.eventId),
        // The war the engine raised this formation for, when it was raised only so a
        // war would have a counter (AI/nativeUnitDirector.js): it is disbanded when
        // that war ends. Absent on every other unit.
        ...normalizeOptionalString(entry.raisedForWar) ? { raisedForWar: normalizeOptionalString(entry.raisedForWar) } : {},
        // The battlefield this formation is fighting on (runtime/fronts/). There it
        // is one of its side's troops and the front engine moves it; the record
        // here keeps its name and what it is, and takes its place and strength back
        // when the battlefield closes. Absent on every other unit.
        ...normalizeOptionalString(entry.committedTo) ? { committedTo: normalizeOptionalString(entry.committedTo) } : {},
        source: UNIT_SOURCE_SET.has(source) ? source : "scenario",
        orderId: normalizeOptionalString(entry.orderId),
        createdAt: normalizeOptionalString(entry.createdAt) || timestamp,
        updatedAt: normalizeOptionalString(entry.updatedAt) || timestamp
      };
    };
    normalizeUnits = (units) => normalizeArray(units).map((entry, index) => normalizeUnitEntry(entry, index)).filter(Boolean);
    PENDING_ORDER_KIND_SET = /* @__PURE__ */ new Set(["move", "patrol"]);
    normalizePendingUnitOrderEntry = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") return null;
      const unitId = normalizeOptionalString(entry.unitId);
      const toLng = finiteOrNull(entry.toLng);
      const toLat = finiteOrNull(entry.toLat);
      if (!unitId || toLng === null || toLat === null) return null;
      const rawKind = normalizeOptionalString(entry.kind).toLowerCase();
      const kind = rawKind === "attack" ? "move" : rawKind;
      const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : fallback;
      return {
        id: normalizeOptionalString(entry.id) || generateId(`unitorder-${index}`),
        unitId,
        kind: PENDING_ORDER_KIND_SET.has(kind) ? kind : "move",
        toLng,
        toLat,
        // Station radius for a patrol order; 0 (and meaningless) for a move order.
        radiusKm: Math.min(2e3, numberOr(entry.radiusKm, 0)),
        // Round after which the order lapses; 0 means it never does. Patrols get a
        // finite life so a fleet does not circle the same station forever.
        untilRound: numberOr(entry.untilRound, 0),
        targetId: normalizeOptionalString(entry.targetId),
        targetLabel: normalizeOptionalString(entry.targetLabel),
        note: normalizeOptionalString(entry.note),
        issuedAt: normalizeOptionalString(entry.issuedAt),
        issuedRound: numberOr(entry.issuedRound, 0),
        // The part of the way that is over water, which paces a redeployment
        // (unitMotion.js kmPerDay). Absent on an order nobody worked it out for.
        ...entry.seaShare !== null && entry.seaShare !== void 0 && Number.isFinite(Number(entry.seaShare)) ? { seaShare: Math.max(0, Math.min(1, Number(entry.seaShare))) } : {}
      };
    };
    normalizePendingUnitOrders = (orders) => normalizeArray(orders).map((entry, index) => normalizePendingUnitOrderEntry(entry, index)).filter(Boolean);
    PENDING_ORDER_ARRIVAL_KM = 60;
    pruneSatisfiedUnitOrders = (units, orders) => {
      const byId = new Map(normalizeArray(units).map((unit) => [unit.id, unit]));
      return normalizeArray(orders).filter((order) => {
        const unit = byId.get(order.unitId);
        if (!unit) return false;
        if (order.kind === "patrol") return true;
        if (unit.status === "moving") return true;
        return haversineKm(unit.lat, unit.lng, order.toLat, order.toLng) > PENDING_ORDER_ARRIVAL_KM;
      });
    };
    MARKER_STATUSES = [
      "planned",
      "under_construction",
      "active",
      "damaged",
      "inactive",
      "abandoned",
      "destroyed"
    ];
    MARKER_STATUS_SET = new Set(MARKER_STATUSES);
    MAX_MARKER_ALIASES = 12;
    MAX_MARKER_SOURCE_EVENT_IDS = 24;
    MAX_GM_AUDIT = 64;
    hasOwn = (value, key) => Boolean(value && Object.prototype.hasOwnProperty.call(value, key));
    normalizeMarkerNameList = (values, { exclude = "", limit = MAX_MARKER_ALIASES } = {}) => {
      const excluded = normalizeOptionalString(exclude).toLowerCase();
      const seen = /* @__PURE__ */ new Set();
      const output = [];
      for (const raw of normalizeArray(values)) {
        const value = normalizeOptionalString(raw);
        const key = value.toLowerCase();
        if (!value || key === excluded || seen.has(key)) continue;
        seen.add(key);
        output.push(value);
        if (output.length >= limit) break;
      }
      return output;
    };
    normalizeMarkerSourceEventIds = (values) => {
      const seen = /* @__PURE__ */ new Set();
      const output = [];
      for (const raw of normalizeArray(values)) {
        const value = normalizeOptionalString(raw);
        if (!value || seen.has(value)) continue;
        seen.add(value);
        output.push(value);
      }
      return output.slice(-MAX_MARKER_SOURCE_EVENT_IDS);
    };
    normalizePendingEventOutreach = (entries) => normalizeArray(entries).map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const sourceEventId = normalizeOptionalString(entry.sourceEventId);
      const sourceEventCreatedAt = normalizeOptionalString(entry.sourceEventCreatedAt);
      const deliverAfter = normalizeOptionalString(entry.deliverAfter);
      if (!sourceEventId || !deliverAfter) return null;
      const attempts = Number.isFinite(Number(entry.attempts)) ? Math.max(0, Math.trunc(Number(entry.attempts))) : 0;
      return {
        id: normalizeOptionalString(entry.id) || generateId(`event-outreach-${index}`),
        sourceEventId,
        sourceEventCreatedAt,
        queuedAt: normalizeOptionalString(entry.queuedAt) || (/* @__PURE__ */ new Date()).toISOString(),
        deliverAfter,
        attempts,
        lastError: normalizeOptionalString(entry.lastError)
      };
    }).filter(Boolean).slice(-80);
    normalizeGameMasterAudit = (entries) => normalizeArray(entries).map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const id = normalizeOptionalString(entry.id) || generateId(`gm-audit-${index}`);
      const transactionId = normalizeOptionalString(entry.transactionId || entry.id);
      if (!transactionId) return null;
      return {
        ...cloneValue(entry),
        id,
        transactionId,
        appliedAt: normalizeOptionalString(entry.appliedAt),
        date: normalizeOptionalString(entry.date),
        mode: normalizeOptionalString(entry.mode),
        request: normalizeTextLike(entry.request),
        summary: normalizeTextLike(entry.summary),
        round: Number.isFinite(Number(entry.round)) ? Math.max(0, Math.trunc(Number(entry.round))) : 0,
        eventIds: normalizeActionParticipants(entry.eventIds),
        storylineIds: normalizeActionParticipants(entry.storylineIds),
        warIds: normalizeActionParticipants(entry.warIds),
        relationIds: normalizeActionParticipants(entry.relationIds),
        agreementIds: normalizeActionParticipants(entry.agreementIds),
        chatIds: normalizeActionParticipants(entry.chatIds),
        statCountries: normalizeActionParticipants(entry.statCountries),
        acceptedOperations: normalizeArray(entry.acceptedOperations).map(normalizeTextLike).filter(Boolean).slice(0, 128),
        rejectedOperations: normalizeArray(entry.rejectedOperations).map(normalizeTextLike).filter(Boolean).slice(0, 128),
        status: normalizeOptionalString(entry.status) || "applied",
        source: normalizeOptionalString(entry.source) || "gm-console",
        transaction: entry.transaction && typeof entry.transaction === "object" ? cloneValue(entry.transaction) : null
      };
    }).filter(Boolean).slice(0, MAX_GM_AUDIT);
    normalizeMarkerEntry = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const lng = finiteOrNull(entry.lng ?? entry.lon ?? entry.longitude);
      const lat = finiteOrNull(entry.lat ?? entry.latitude);
      const name = normalizeOptionalString(entry.name || entry.title);
      if (lng === null || lat === null || lng === 0 && lat === 0 || !name) {
        return null;
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const createdAt = normalizeOptionalString(entry.createdAt) || timestamp;
      const status = normalizeOptionalString(entry.status).toLowerCase();
      const foundedAt = normalizeOptionalString(entry.foundedAt || entry.date);
      const approximate = normalizeApproximateMark(entry.approximate);
      return {
        id: normalizeOptionalString(entry.id) || generateId(`marker-${index}`),
        name,
        kind: (normalizeOptionalString(entry.kind || entry.type) || "landmark").toLowerCase(),
        ownerCode: toCountryName(normalizeOptionalString(entry.ownerCode || entry.owner || entry.code)),
        lng,
        lat,
        note: normalizeOptionalString(entry.note || entry.description),
        status: MARKER_STATUS_SET.has(status) ? status : "active",
        aliases: normalizeMarkerNameList(entry.aliases, { exclude: name }),
        foundedAt,
        createdAt,
        updatedAt: normalizeOptionalString(entry.updatedAt) || createdAt,
        updatedDate: normalizeOptionalString(entry.updatedDate || entry.lastUpdatedDate) || foundedAt,
        sourceEventIds: normalizeMarkerSourceEventIds(entry.sourceEventIds),
        ...approximate ? { approximate } : {}
      };
    };
    normalizeApproximateMark = (value) => {
      if (!value || typeof value !== "object") return null;
      const asked = normalizeOptionalString(value.asked);
      const country = normalizeOptionalString(value.country);
      const unnamed = value.unnamed === true;
      if (!(asked || unnamed) || !country) return null;
      return { asked, country, near: normalizeOptionalString(value.near), ...unnamed ? { unnamed } : {} };
    };
    normalizeMarkers = (markers) => normalizeArray(markers).map((entry, index) => normalizeMarkerEntry(entry, index)).filter(Boolean);
    normalizeMarkerPatch = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const patch = {};
      if (hasOwn(entry, "kind") || hasOwn(entry, "type")) {
        const kind = normalizeOptionalString(entry.kind || entry.type).toLowerCase();
        if (kind) patch.kind = kind;
      }
      if (hasOwn(entry, "ownerCode") || hasOwn(entry, "owner") || hasOwn(entry, "code")) {
        patch.ownerCode = toCountryName(normalizeOptionalString(entry.ownerCode ?? entry.owner ?? entry.code));
      }
      if (hasOwn(entry, "status")) {
        const status = normalizeOptionalString(entry.status).toLowerCase();
        if (MARKER_STATUS_SET.has(status)) patch.status = status;
      }
      if (hasOwn(entry, "note") || hasOwn(entry, "description")) {
        patch.note = normalizeOptionalString(entry.note ?? entry.description);
      }
      if (hasOwn(entry, "foundedAt") || hasOwn(entry, "date")) {
        patch.foundedAt = normalizeOptionalString(entry.foundedAt ?? entry.date);
      }
      const hasLng = hasOwn(entry, "lng") || hasOwn(entry, "lon") || hasOwn(entry, "longitude");
      const hasLat = hasOwn(entry, "lat") || hasOwn(entry, "latitude");
      if (hasLng && hasLat) {
        const lng = finiteOrNull(entry.lng ?? entry.lon ?? entry.longitude);
        const lat = finiteOrNull(entry.lat ?? entry.latitude);
        if (lng !== null && lat !== null && !(lng === 0 && lat === 0)) {
          patch.lng = lng;
          patch.lat = lat;
        }
      }
      return Object.keys(patch).length > 0 ? patch : null;
    };
    normalizeMarkerOp = (entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const op = normalizeOptionalString(entry.op).toLowerCase();
      if (op === "build" || op === "found") {
        const marker = normalizeMarkerEntry(entry.marker ?? entry, 0);
        if (!marker) return null;
        return { op: "build", marker };
      }
      if (op === "update" || op === "modify" || op === "destroy") {
        const markerId = normalizeOptionalString(entry.markerId || entry.id);
        const name = normalizeOptionalString(entry.name);
        if (!markerId && !name) return null;
        const patchSource = entry.changes && typeof entry.changes === "object" && !Array.isArray(entry.changes) ? entry.changes : entry;
        const changes = op === "destroy" ? { ...normalizeMarkerPatch(patchSource) || {}, status: "destroyed" } : normalizeMarkerPatch(patchSource);
        if (!changes) return null;
        return { op: "update", markerId, name, changes };
      }
      if (op === "remove") {
        const markerId = normalizeOptionalString(entry.markerId || entry.id);
        const name = normalizeOptionalString(entry.name);
        if (!markerId && !name) return null;
        return { op: "remove", markerId, name, note: normalizeOptionalString(entry.note) };
      }
      if (op === "rename") {
        const markerId = normalizeOptionalString(entry.markerId || entry.id);
        const name = normalizeOptionalString(entry.name || entry.from || entry.oldName);
        const newName = normalizeOptionalString(entry.newName || entry.to);
        if (!markerId && !name || !newName) return null;
        return { op: "rename", markerId, name, newName, note: normalizeOptionalString(entry.note) };
      }
      if (op === "population") {
        const markerId = normalizeOptionalString(entry.markerId || entry.id);
        const name = normalizeOptionalString(entry.name || entry.city);
        const population = Number(entry.population ?? entry.value);
        if (!markerId && !name || !Number.isFinite(population) || population < 0) return null;
        return {
          op: "population",
          markerId,
          name,
          population: Math.round(population),
          note: normalizeOptionalString(entry.note)
        };
      }
      return null;
    };
    PROJECT_STATUSES = [
      "proposed",
      "active",
      "stalled",
      "paused",
      "complete",
      "failed",
      "cancelled"
    ];
    PROJECT_STATUS_SET = new Set(PROJECT_STATUSES);
    PROJECT_OPEN_STATUSES = /* @__PURE__ */ new Set(["proposed", "active", "stalled", "paused"]);
    PROJECT_KIND_SET = /* @__PURE__ */ new Set(["project", "operation"]);
    PROJECT_VERIFICATIONS = ["", "doubted", "confirmed", "refuted"];
    PROJECT_VERIFICATION_SET = new Set(PROJECT_VERIFICATIONS);
    PROJECT_SECRECY_SET = /* @__PURE__ */ new Set(["public", "restricted", "covert"]);
    PROJECT_MILESTONE_STATUS_SET = /* @__PURE__ */ new Set(["pending", "slipped", "done", "missed"]);
    PROJECT_MILESTONE_STATUS_ALIASES = {
      complete: "done",
      completed: "done",
      finished: "done",
      achieved: "done",
      reached: "done",
      met: "done",
      delivered: "done",
      passed: "done",
      late: "slipped",
      overdue: "slipped",
      delayed: "slipped",
      behind: "slipped",
      failed: "missed",
      unmet: "missed",
      outstanding: "pending",
      planned: "pending",
      upcoming: "pending",
      scheduled: "pending"
    };
    resolveMilestoneStatus = (value) => {
      const raw = normalizeOptionalString(value).toLowerCase();
      if (!raw) return "";
      if (PROJECT_MILESTONE_STATUS_SET.has(raw)) return raw;
      return PROJECT_MILESTONE_STATUS_ALIASES[raw] || "pending";
    };
    PROJECT_STATUS_ALIASES = {
      completed: "complete",
      finished: "complete",
      done: "complete",
      delivered: "complete",
      canceled: "cancelled",
      abandoned: "cancelled",
      dropped: "cancelled",
      shelved: "cancelled",
      ongoing: "active",
      "in progress": "active",
      inprogress: "active",
      running: "active",
      underway: "active",
      planned: "proposed",
      proposal: "proposed",
      pending: "proposed",
      suspended: "paused",
      halted: "paused",
      onhold: "paused",
      "on hold": "paused",
      blocked: "stalled",
      delayed: "stalled",
      stalling: "stalled"
    };
    resolveProjectStatus = (value) => {
      const raw = normalizeOptionalString(value).toLowerCase();
      if (PROJECT_STATUS_SET.has(raw)) return raw;
      return PROJECT_STATUS_ALIASES[raw] || "active";
    };
    PROJECT_PRIORITIES = ["high", "normal", "low"];
    PROJECT_PRIORITY_SET = new Set(PROJECT_PRIORITIES);
    PROJECT_PRIORITY_ALIASES = {
      critical: "high",
      urgent: "high",
      top: "high",
      highest: "high",
      "top priority": "high",
      priority: "high",
      important: "high",
      vital: "high",
      max: "high",
      medium: "normal",
      standard: "normal",
      default: "normal",
      moderate: "normal",
      regular: "normal",
      routine: "low",
      background: "low",
      minor: "low",
      lowest: "low",
      deferred: "low",
      "back burner": "low",
      backburner: "low",
      idle: "low"
    };
    resolveProjectPriority = (value) => {
      const raw = normalizeOptionalString(value).toLowerCase();
      if (PROJECT_PRIORITY_SET.has(raw)) return raw;
      return PROJECT_PRIORITY_ALIASES[raw] || "normal";
    };
    MAX_PROJECTS = 120;
    MAX_PROJECT_MILESTONES = 8;
    MAX_PROJECT_EVENT_IDS = 12;
    normalizeProjectMilestone = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") {
        if (typeof entry !== "string") return null;
        const title2 = normalizeString2(entry);
        return title2 ? { id: generateId(`milestone-${index}`), title: title2, date: "", status: "pending", note: "" } : null;
      }
      const title = normalizeOptionalString(entry.title || entry.name || entry.label);
      if (!title) return null;
      const completedCount = Number(entry.completedCount);
      return {
        id: normalizeOptionalString(entry.id) || generateId(`milestone-${index}`),
        title,
        date: canonicalizeDateString(entry.date || entry.due || entry.targetDate),
        // A STORED milestone always has a status, so an absent one is "pending" here.
        // Whether an OP meant to change it is a separate question — see the
        // statusProvided flag normalizeProjectOp records.
        status: resolveMilestoneStatus(entry.status) || "pending",
        note: normalizeOptionalString(entry.note || entry.description),
        // A standing commitment that comes round again — an annual drill, a
        // quarterly review. Marking one done rolls it to its next occurrence rather
        // than retiring it (see applyProjectOps), so the board keeps showing when
        // the next one falls due instead of going blank.
        repeat: normalizeMilestoneRepeat(entry.repeat || entry.recurrence || entry.cadence),
        completedCount: Number.isFinite(completedCount) && completedCount > 0 ? Math.trunc(completedCount) : 0,
        lastCompletedAt: canonicalizeDateString(entry.lastCompletedAt)
      };
    };
    normalizeProjectMilestones = (list12) => normalizeArray(list12).map((entry, index) => normalizeProjectMilestone(entry, index)).filter(Boolean).slice(0, MAX_PROJECT_MILESTONES);
    deriveNextMilestoneFrom = (milestones, stored) => {
      const pending = normalizeArray(milestones).filter(isMilestoneOutstanding);
      if (pending.length > 0) {
        const dated = pending.filter((entry) => entry.date).sort((a, b2) => compareGameDates(a.date, b2.date));
        const next = dated[0] || pending[0];
        return {
          title: next.title,
          date: next.date,
          note: next.note,
          repeat: next.repeat || "",
          completedCount: Number(next.completedCount) || 0
        };
      }
      if (!stored || typeof stored !== "object") return null;
      const title = normalizeOptionalString(stored.title || stored.name);
      if (!title) return null;
      return {
        title,
        date: canonicalizeDateString(stored.date || stored.due),
        note: normalizeOptionalString(stored.note || stored.description)
      };
    };
    normalizeProjectOnComplete = (value) => {
      if (!value || typeof value !== "object") return null;
      const polityChanges = normalizeArray(value.polityChanges).map(normalizePolityChange).filter(Boolean).slice(0, 8);
      const regionTransfers = normalizeArray(value.regionTransfers).map(normalizeRegionTransfer).filter(Boolean).slice(0, 24);
      const regionClaims = normalizeArray(value.regionClaims).map(normalizeRegionClaim).filter(Boolean).slice(0, 24);
      if (polityChanges.length === 0 && regionTransfers.length === 0 && regionClaims.length === 0) return null;
      return { polityChanges, regionClaims, regionTransfers };
    };
    normalizeProjectCoords = (value) => {
      if (!value || typeof value !== "object") return null;
      const lng = finiteOrNull(value.lng ?? value.lon ?? value.longitude);
      const lat = finiteOrNull(value.lat ?? value.latitude);
      if (lng === null || lat === null || lng === 0 && lat === 0) return null;
      return { lng, lat };
    };
    normalizeIdList = (value, limit) => normalizeArray(value).map((entry) => normalizeOptionalString(entry)).filter(Boolean).filter((entry, index, list12) => list12.indexOf(entry) === index).slice(0, limit);
    normalizeProjectEntry = (entry, index = 0) => {
      if (!entry || typeof entry !== "object") return null;
      const name = normalizeOptionalString(entry.name || entry.title || entry.project);
      if (!name) return null;
      const kind = normalizeOptionalString(entry.kind || entry.type).toLowerCase();
      const secrecy = normalizeOptionalString(entry.secrecy || entry.classification).toLowerCase();
      const progress = Number(entry.progress);
      const milestones = normalizeProjectMilestones(entry.milestones);
      const ongoing = entry.ongoing === true || entry.ongoing === "true";
      const updatedRound = Number(entry.updatedRound);
      return {
        id: normalizeOptionalString(entry.id) || generateId(`project-${index}`),
        name,
        kind: PROJECT_KIND_SET.has(kind) ? kind : "project",
        // Same owner namespace as units, markers and every other polity-keyed field:
        // a country NAME, verbatim. Blank means the player — an operation the model
        // reports without naming an owner is one of theirs, and making it restate the
        // player's own name on every entry is how that field ends up wrong.
        ownerCode: toCountryName(normalizeOptionalString(entry.ownerCode || entry.owner || entry.code)),
        summary: normalizeTextLike(entry.summary || entry.description),
        status: resolveProjectStatus(entry.status),
        // The player's dial, not the model's — see PROJECT_PRIORITIES. Defaults to
        // "normal", which is also what every project in a save written before this
        // field existed reads as, so no migration is needed.
        priority: resolveProjectPriority(entry.priority),
        progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0,
        tags: normalizeTagList(entry.tags),
        secrecy: PROJECT_SECRECY_SET.has(secrecy) ? secrecy : "public",
        startedAt: canonicalizeDateString(entry.startedAt || entry.startDate || entry.began),
        ongoing,
        // An ongoing effort has no end date by definition; drop any the model sent
        // alongside the flag rather than showing a deadline it has already disowned.
        targetDate: ongoing ? "" : canonicalizeDateString(entry.targetDate || entry.dueDate || entry.completionDate),
        milestones,
        nextMilestone: deriveNextMilestoneFrom(milestones, entry.nextMilestone),
        lastUpdate: normalizeTextLike(entry.lastUpdate),
        // See normalizeProjectOnComplete. null for the great majority of projects.
        onComplete: normalizeProjectOnComplete(entry.onComplete || entry.completionEffects),
        // The one-way latch that makes onComplete fire exactly ONCE.
        //
        // Effects are released on the TRANSITION into `complete`, never again. Without
        // this, a model restating {"op":"complete"} on an already-finished annexation
        // — and a chatty campaign restates constantly — would hand the same regions
        // over a second time, or re-apply a rename on top of a name the story has
        // since moved past. Stamped by applyProjectOps at the moment of the
        // transition, and read by releaseProjectCompletionEffects just before it.
        //
        // Engine-owned: deliberately absent from PROJECT_FIELD_ALIASES and
        // PROJECT_PATCHABLE_FIELDS, so no model can set or clear it.
        onCompleteAppliedAt: normalizeOptionalString(entry.onCompleteAppliedAt),
        // Newest first: the activity feed reads top-down, so the cap must drop the
        // oldest entry rather than the most recent one.
        eventIds: normalizeIdList(entry.eventIds, MAX_PROJECT_EVENT_IDS),
        linkedUnitIds: normalizeIdList(entry.linkedUnitIds, 12),
        linkedMarkerIds: normalizeIdList(entry.linkedMarkerIds, 12),
        // The agent an entry is sourced from: the operation a spy IS (spyOperationOps)
        // or the foreign programme a spy told us about (spyProvenanceOps). What makes
        // a doubt later find the right entries.
        //
        // Patchable, because the engine sets it through an ordinary update op — but
        // absent from projectSchema, so a strict provider cannot emit it at all. That
        // absence is the real protection, and it is the same one "doubted" relies on:
        // the schema decides what a model can say, the whitelist only decides what an
        // op can carry.
        linkedSpyIds: normalizeIdList(entry.linkedSpyIds, 12),
        verification: PROJECT_VERIFICATION_SET.has(normalizeOptionalString(entry.verification)) ? normalizeOptionalString(entry.verification) : "",
        focus: normalizeProjectCoords(entry.focus),
        note: normalizeTextLike(entry.note),
        createdAt: normalizeOptionalString(entry.createdAt) || (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: normalizeOptionalString(entry.updatedAt) || (/* @__PURE__ */ new Date()).toISOString(),
        updatedRound: Number.isFinite(updatedRound) && updatedRound > 0 ? Math.trunc(updatedRound) : 0
      };
    };
    capProjectList = (list12) => {
      if (list12.length <= MAX_PROJECTS) return list12;
      const evictionRank = (project) => PROJECT_OPEN_STATUSES.has(project.status) ? 1 : 0;
      const doomed = new Set(
        [...list12].sort((a, b2) => evictionRank(a) - evictionRank(b2) || normalizeOptionalString(a.updatedAt).localeCompare(normalizeOptionalString(b2.updatedAt))).slice(0, list12.length - MAX_PROJECTS).map((project) => project.id)
      );
      return list12.filter((project) => !doomed.has(project.id));
    };
    normalizeProjects = (projects) => capProjectList(
      normalizeArray(projects).map((entry, index) => normalizeProjectEntry(entry, index)).filter(Boolean).filter((entry, index, list12) => list12.findIndex((other) => other.name.toLowerCase() === entry.name.toLowerCase()) === index)
    );
    PROJECT_FIELD_ALIASES = {
      name: ["name", "title", "project"],
      kind: ["kind", "type"],
      ownerCode: ["ownerCode", "owner", "code"],
      summary: ["summary", "description"],
      status: ["status"],
      priority: ["priority"],
      onComplete: ["onComplete", "completionEffects"],
      progress: ["progress"],
      tags: ["tags"],
      secrecy: ["secrecy", "classification"],
      startedAt: ["startedAt", "startDate", "began"],
      ongoing: ["ongoing"],
      targetDate: ["targetDate", "dueDate", "completionDate"],
      milestones: ["milestones"],
      lastUpdate: ["lastUpdate"],
      linkedUnitIds: ["linkedUnitIds"],
      linkedMarkerIds: ["linkedMarkerIds"],
      // Listed so the engine's own create carries the link through listProvidedFields
      // when it restates an entry that already exists. Not patchable — see above.
      linkedSpyIds: ["linkedSpyIds"],
      verification: ["verification"],
      focus: ["focus"],
      note: ["note"]
    };
    listProvidedFields = (source) => {
      if (!source || typeof source !== "object") return [];
      return Object.entries(PROJECT_FIELD_ALIASES).filter(([, aliases]) => aliases.some((alias) => source[alias] !== void 0)).map(([field]) => field);
    };
    normalizeProjectOp = (entry) => {
      if (!entry || typeof entry !== "object") return null;
      const op = normalizeOptionalString(entry.op || entry.action).toLowerCase();
      const projectId = normalizeOptionalString(entry.projectId || entry.id);
      const name = normalizeOptionalString(entry.name || entry.project || entry.title);
      if (op === "create" || op === "start" || op === "launch" || op === "open" || op === "add") {
        const source = entry.project ?? entry;
        const project = normalizeProjectEntry(source, 0);
        if (!project) return null;
        const provided = Array.isArray(entry.provided) ? entry.provided : listProvidedFields(source);
        return { op: "create", project, provided };
      }
      if (op === "update" || op === "progress" || op === "edit") {
        if (!projectId && !name) return null;
        return { op: "update", projectId, name, patch: entry.patch ?? entry.project ?? entry };
      }
      if (op === "milestone") {
        if (!projectId && !name) return null;
        const source = entry.milestone ?? entry;
        const milestone = normalizeProjectMilestone(source, 0);
        if (!milestone) return null;
        const statusProvided = typeof entry.statusProvided === "boolean" ? entry.statusProvided : normalizeOptionalString(source && typeof source === "object" ? source.status : "") !== "";
        return { op: "milestone", projectId, name, milestone, statusProvided };
      }
      if (op === "close") {
        if (!projectId && !name) return null;
        const status = resolveProjectStatus(entry.status);
        return {
          op: "close",
          // Anything that is not a recognised ending is treated as cancelled rather
          // than silently promoted to a success — the one outcome that releases
          // onComplete effects must never be reached by a fallback.
          status: status === "complete" || status === "failed" ? status : "cancelled",
          projectId,
          name,
          note: normalizeOptionalString(entry.note)
        };
      }
      if (op === "complete" || op === "finish" || op === "completed") {
        if (!projectId && !name) return null;
        return { op: "close", status: "complete", projectId, name, note: normalizeOptionalString(entry.note) };
      }
      if (op === "cancel" || op === "cancelled" || op === "abandon" || op === "shelve") {
        if (!projectId && !name) return null;
        return { op: "close", status: "cancelled", projectId, name, note: normalizeOptionalString(entry.note) };
      }
      if (op === "fail" || op === "failed") {
        if (!projectId && !name) return null;
        return { op: "close", status: "failed", projectId, name, note: normalizeOptionalString(entry.note) };
      }
      if (op === "remove" || op === "delete" || op === "drop") {
        if (!projectId && !name) return null;
        return { op: "remove", projectId, name, note: normalizeOptionalString(entry.note) };
      }
      return null;
    };
    describeUnitOpRejection = (entry) => {
      if (!entry || typeof entry !== "object") return "not an object";
      const op = normalizeOptionalString(entry.op).toLowerCase();
      if (!op) return "no op (expected spawn, move, strength or remove)";
      if (op === "spawn") {
        const unit = entry.unit ?? entry;
        if (!unit || typeof unit !== "object") return "spawn without a unit";
        const lng = finiteOrNull(unit.lng ?? unit.lon ?? unit.longitude);
        const lat = finiteOrNull(unit.lat ?? unit.latitude);
        if (lng === null || lat === null) {
          return `spawn has unusable coordinates (lng=${JSON.stringify(unit.lng)}, lat=${JSON.stringify(unit.lat)})`;
        }
        if (lng === 0 && lat === 0) return "spawn at 0,0 \u2014 the output template's placeholder, not a real position";
        if (!normalizeOptionalString(unit.ownerCode || unit.owner || unit.code)) return "spawn has no owner";
        return "spawn rejected";
      }
      if (!normalizeOptionalString(entry.unitId || entry.id)) return `${op} without a unitId`;
      if (op === "move") {
        const toLng = finiteOrNull(entry.toLng ?? entry.lng);
        const toLat = finiteOrNull(entry.toLat ?? entry.lat);
        if (toLng === null || toLat === null) return `move has unusable destination (toLng=${JSON.stringify(entry.toLng)}, toLat=${JSON.stringify(entry.toLat)})`;
        if (toLng === 0 && toLat === 0) return "move to 0,0 \u2014 the output template's placeholder, not a real position";
      }
      return `unknown op "${op}"`;
    };
    REPORTED_UNIT_OP_DROPS_LIMIT = 256;
    reportedUnitOpDrops = /* @__PURE__ */ new Set();
    reportUnitOpDrop = (entry, index, event) => {
      let signature = null;
      try {
        signature = JSON.stringify([event?.date ?? "", event?.title ?? "", entry]);
      } catch {
      }
      if (signature !== null) {
        if (reportedUnitOpDrops.has(signature)) return;
        if (reportedUnitOpDrops.size >= REPORTED_UNIT_OP_DROPS_LIMIT) reportedUnitOpDrops.clear();
        reportedUnitOpDrops.add(signature);
      }
      console.warn(`[ai] unitOps[${index}] dropped \u2014 ${describeUnitOpRejection(entry)}:`, entry);
    };
    awaitsPlacement = (entry) => {
      if (!entry || typeof entry !== "object") return false;
      const op = normalizeOptionalString(entry.op).toLowerCase();
      const none = (...values) => values.every((value) => value === void 0 || value === null || value === "");
      if (op === "spawn") {
        const unit = entry.unit && typeof entry.unit === "object" ? entry.unit : entry;
        return none(unit.lng, unit.lon, unit.longitude, unit.lat, unit.latitude) && Boolean(normalizeOptionalString(unit.at ?? entry.at) || normalizeOptionalString(unit.regionId ?? entry.regionId));
      }
      if (op === "move") {
        return none(entry.toLng, entry.toLat, entry.lng, entry.lat) && Boolean(normalizeOptionalString(entry.at) || normalizeOptionalString(entry.regionId));
      }
      return false;
    };
    normalizeUnitOp = (entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const op = normalizeOptionalString(entry.op).toLowerCase();
      const unitId = normalizeOptionalString(entry.unitId || entry.id);
      if (op === "spawn") {
        const unit = normalizeUnitEntry(entry.unit ?? entry, 0);
        if (!unit) return null;
        unit.source = "ai";
        return { op, unit };
      }
      if (!unitId) {
        return null;
      }
      if (op === "move") {
        const toLng = finiteOrNull(entry.toLng ?? entry.lng);
        const toLat = finiteOrNull(entry.toLat ?? entry.lat);
        if (toLng === null || toLat === null || toLng === 0 && toLat === 0) return null;
        const posture = normalizeOptionalString(entry.posture).toLowerCase();
        const seaShare = entry.seaShare === null || entry.seaShare === void 0 ? null : finiteOrNull(entry.seaShare);
        return {
          op,
          unitId,
          toLng,
          toLat,
          ...seaShare !== null ? { seaShare: Math.max(0, Math.min(1, seaShare)) } : {},
          regionId: normalizeOptionalString(entry.regionId),
          // Re-posturing on the move is how "this force is now massing rather than
          // in transit" reaches the map without a second op.
          posture: UNIT_POSTURE_SET.has(posture) ? posture : "",
          note: normalizeOptionalString(entry.note)
        };
      }
      if (op === "strength") {
        return { op, unitId, strength: clampUnitStrength(entry.strength ?? 0), note: normalizeOptionalString(entry.note) };
      }
      if (op === "remove") {
        return { op, unitId, note: normalizeOptionalString(entry.note) };
      }
      return null;
    };
    UNIT_SYSTEM_SET = /* @__PURE__ */ new Set(["beta", "classic"]);
    normalizeCreatedChat = (entry, index) => {
      const chat = normalizeChatEntry(entry, index);
      if (!chat) return null;
      const openingMessage = normalizeOptionalString(entry?.openingMessage);
      const speaker = normalizeOptionalString(entry?.speaker);
      const to = normalizeOptionalString(entry?.to);
      return {
        ...chat,
        ...openingMessage ? { openingMessage } : {},
        ...speaker ? { speaker } : {},
        ...to ? { to } : {}
      };
    };
    normalizePoliticalActorImpactOp = (entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const op = normalizeOptionalString(entry.op);
      const polityKey = normalizeOptionalString(entry.polityKey || entry.polity || entry.country);
      if (!op || !polityKey) return null;
      let argsJson = "";
      if (typeof entry.argsJson === "string") argsJson = entry.argsJson.trim();
      else if (entry.argsJson && typeof entry.argsJson === "object" && !Array.isArray(entry.argsJson)) {
        try {
          argsJson = JSON.stringify(entry.argsJson);
        } catch {
          argsJson = "";
        }
      }
      if (!argsJson) {
        const directArgs = Object.fromEntries(Object.entries(entry).filter(([key]) => ![
          "op",
          "polityKey",
          "polity",
          "country",
          "argsJson"
        ].includes(key)));
        if (Object.keys(directArgs).length) {
          try {
            argsJson = JSON.stringify(directArgs);
          } catch {
            argsJson = "";
          }
        }
      }
      return { op, polityKey, argsJson };
    };
    normalizeEventImpacts = (value, event = null) => {
      if (!value || typeof value !== "object") {
        return {
          actionIds: [],
          createdChats: [],
          groupOps: [],
          institutionLifecycleOps: [],
          markerOps: [],
          polityChanges: [],
          politicalActorOps: [],
          projectOps: [],
          regionClaims: [],
          regionControlOps: [],
          regionTransfers: [],
          reports: [],
          spyOps: [],
          unitOps: []
        };
      }
      return {
        actionIds: normalizeActionParticipants(value.actionIds),
        createdChats: normalizeArray(value.createdChats).map(normalizeCreatedChat).filter(Boolean),
        // Groups the event creates, changes or erases, and the regions they take or
        // lose (runtime/groups.js).
        groupOps: normalizeArray(value.groupOps).map(normalizeGroupOp).filter(Boolean),
        institutionLifecycleOps: normalizeArray(value.institutionLifecycleOps).map(normalizeInstitutionLifecycleImpactOp).filter(Boolean),
        markerOps: normalizeArray(value.markerOps).map(normalizeMarkerOp).filter(Boolean),
        polityChanges: normalizeArray(value.polityChanges).map(normalizePolityChange).filter(Boolean),
        politicalActorOps: normalizeArray(value.politicalActorOps).map(normalizePoliticalActorImpactOp).filter(Boolean),
        projectOps: normalizeArray(value.projectOps).map(normalizeProjectOp).filter(Boolean),
        regionClaims: normalizeArray(value.regionClaims).map(normalizeRegionClaim).filter(Boolean),
        regionControlOps: normalizeArray(value.regionControlOps).map(normalizeRegionControlOp).filter(Boolean),
        regionTransfers: normalizeArray(value.regionTransfers).map(normalizeRegionTransfer).filter(Boolean),
        // Documents the event writes or widens (runtime/reports.js).
        reports: normalizeArray(value.reports).map(normalizeReportOp).filter(Boolean),
        // The player's espionage orders this event carried (runtime/spycraft.js).
        // Kept on the stored event so a reloaded campaign can replay them.
        spyOps: normalizeArray(value.spyOps).map(normalizeSpyOp).filter(Boolean),
        // Say WHY a unit op was thrown away. A dropped op is the difference between an
        // event that narrates a deployment and troops that actually appear on the map,
        // and it used to vanish into .filter(Boolean) without a word — leaving no way
        // to tell "the model never emitted one" from "it emitted one we rejected".
        // Region transfers have logged their drops for a while; units now match.
        // Once per op, however many times its event is read (reportUnitOpDrop).
        unitOps: normalizeArray(value.unitOps).map((entry, index) => {
          const normalized = normalizeUnitOp(entry);
          if (!normalized && !awaitsPlacement(entry)) reportUnitOpDrop(entry, index, event);
          return normalized;
        }).filter(Boolean)
      };
    };
    EVENT_IMPACT_KEYS2 = Object.freeze(Object.keys(normalizeEventImpacts({})));
    normalizeRenamedKind = (value) => {
      const text3 = normalizeOptionalString(value);
      return text3 === "catalyst" ? "interactive" : text3;
    };
    normalizePolityOverride = (key, value) => {
      if (!value || typeof value !== "object") {
        return null;
      }
      const code = normalizeOptionalString(value.code) || normalizeOptionalString(key);
      if (!code) {
        return null;
      }
      const status = normalizeOptionalString(value.status).toLowerCase();
      const rawMapRefs = value.mapRefs && typeof value.mapRefs === "object" && !Array.isArray(value.mapRefs) ? value.mapRefs : {};
      const gadm0 = [...new Set(
        normalizeArray(rawMapRefs.gadm0).map((entry) => normalizeOptionalString(entry).toUpperCase()).filter(Boolean)
      )];
      const formerNames = normalizeActionParticipants(value.formerNames);
      return {
        aliases: normalizeActionParticipants(value.aliases || value.additionalNames),
        code,
        color: normalizeOptionalString(value.color),
        ...formerNames.length ? { formerNames } : {},
        ...gadm0.length ? { mapRefs: { ...rawMapRefs, gadm0 } } : {},
        ...normalizeOptionalString(value.mapLabel) ? { mapLabel: normalizeOptionalString(value.mapLabel) } : {},
        ...normalizeOptionalString(value.mapDistinctLabel) ? { mapDistinctLabel: normalizeOptionalString(value.mapDistinctLabel) } : {},
        name: normalizeOptionalString(value.name || value.label),
        note: normalizeOptionalString(value.note),
        // Its people when the scenario begins, where its author says (runtime/populationFigure.js).
        ...populationFigureOf(value) > 0 ? { population: populationFigureOf(value) } : {},
        // Its own military figures, where its author gives them (runtime/militaryStats.js).
        ...normalizeMilitaryStats(value.military) ? { military: normalizeMilitaryStats(value.military) } : {},
        ...POLITY_STATUS_SET.has(status) ? { status } : {},
        ...value.verbatim === true ? { verbatim: true } : {}
      };
    };
    normalizeActionSuggestions = (value) => normalizeArray(value).map((topic) => {
      if (!topic || typeof topic !== "object") {
        return null;
      }
      const title = normalizeOptionalString(topic.title || topic.name);
      if (!title) {
        return null;
      }
      return {
        actions: normalizeArray(topic.actions).map((entry, index) => normalizeActionEntry(entry, index)).filter(Boolean),
        description: normalizeOptionalString(topic.description),
        id: normalizeOptionalString(topic.id) || generateId("topic"),
        title,
        // Canned topics written when the AI could not be reached say so.
        ...topic.source === "fallback" ? { source: "fallback" } : {}
      };
    }).filter(Boolean);
    normalizeHistoryDocument = (value) => {
      if (!value || typeof value !== "object") return null;
      const text3 = normalizeTextLike(value.text);
      if (!text3) return null;
      const throughRound = Math.trunc(Number(value.throughRound) || 0);
      return {
        text: text3,
        revision: Math.max(1, Math.trunc(Number(value.revision) || 1)),
        updatedAt: normalizeOptionalString(value.updatedAt) || (/* @__PURE__ */ new Date()).toISOString(),
        source: normalizeOptionalString(value.source) || "ai",
        throughDate: normalizeOptionalString(value.throughDate),
        throughEventId: normalizeOptionalString(value.throughEventId),
        throughRound: throughRound > 0 ? throughRound : 0
      };
    };
    normalizeConsolidatedHistory = (value) => normalizeArray(value).map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const summary = normalizeTextLike(entry.summary);
      if (!summary) return null;
      return {
        // Ids of the resolved player orders folded into this summary. Without it the
        // same orders would be re-summarised every consolidation, and — because this
        // object is a fixed whitelist — an actionIds written by the consolidator
        // would be dropped on the next read and the tracking would never stick.
        actionIds: normalizeActionParticipants(entry.actionIds),
        chatIds: normalizeActionParticipants(entry.chatIds),
        createdAt: normalizeOptionalString(entry.createdAt) || (/* @__PURE__ */ new Date()).toISOString(),
        source: normalizeOptionalString(entry.source) || "ai",
        summary,
        throughDate: normalizeOptionalString(entry.throughDate),
        throughEventId: normalizeOptionalString(entry.throughEventId),
        throughRound: Number.isFinite(Number(entry.throughRound)) ? Math.max(0, Math.trunc(Number(entry.throughRound))) : 0
      };
    }).filter(Boolean);
    clampWorldStorylinePercent = (value, fallback = 0) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.max(0, Math.min(100, Math.round(numeric)));
    };
    normalizeWorldStoryline = (entry, index = 0) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const title = normalizeOptionalString(entry.title || entry.name);
      if (!title) return null;
      const id = normalizeOptionalString(entry.id) || `storyline-${index}`;
      const rawStatus = normalizeOptionalString(entry.status).toLowerCase();
      const status = WORLD_STORYLINE_STATUS_SET.has(rawStatus) ? rawStatus : "active";
      const uniqueStrings2 = (value, limit) => [...new Set(normalizeActionParticipants(value))].slice(0, limit);
      return {
        id,
        kind: normalizeOptionalString(entry.kind) || "world",
        title,
        participants: uniqueStrings2(entry.participants, 12),
        status,
        pressure: clampWorldStorylinePercent(entry.pressure),
        momentum: clampWorldStorylinePercent(entry.momentum),
        startedDate: canonicalizeDateString(entry.startedDate),
        accountedThroughDate: canonicalizeDateString(
          entry.accountedThroughDate || entry.lastUpdatedDate || entry.startedDate
        ),
        lastUpdatedDate: canonicalizeDateString(
          entry.lastUpdatedDate || entry.accountedThroughDate || entry.startedDate
        ),
        lastVisibleEventDate: canonicalizeDateString(entry.lastVisibleEventDate),
        nextReviewDate: status === "resolved" ? "" : canonicalizeDateString(entry.nextReviewDate),
        state: normalizeTextLike(entry.state || entry.summary || entry.description),
        ...entry.canonicalIdentity === true ? { canonicalIdentity: true } : {},
        sourceEventIds: uniqueStrings2(entry.sourceEventIds, 16),
        createdRound: Number.isFinite(Number(entry.createdRound)) && Number(entry.createdRound) > 0 ? Math.trunc(Number(entry.createdRound)) : 0,
        updatedRound: Number.isFinite(Number(entry.updatedRound)) && Number(entry.updatedRound) > 0 ? Math.trunc(Number(entry.updatedRound)) : 0
      };
    };
    normalizeWorldStorylines = (value) => {
      const deduped = /* @__PURE__ */ new Map();
      normalizeArray(value).forEach((entry, index) => {
        const normalized = normalizeWorldStoryline(entry, index);
        if (!normalized) return;
        deduped.set(normalized.id, normalized);
      });
      const statusRank = { active: 0, dormant: 1, resolved: 2 };
      return [...deduped.values()].sort(
        (a, b2) => Number(b2.canonicalIdentity === true) - Number(a.canonicalIdentity === true) || (statusRank[a.status] ?? 9) - (statusRank[b2.status] ?? 9) || String(b2.lastUpdatedDate || b2.accountedThroughDate || "").localeCompare(
          String(a.lastUpdatedDate || a.accountedThroughDate || "")
        ) || a.id.localeCompare(b2.id)
      ).slice(0, MAX_WORLD_STORYLINES);
    };
    normalizeWorldWar = (entry, index = 0) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const canonicalPolity3 = (value) => {
        const raw = normalizeOptionalString(value);
        return raw ? toCountryName(raw) || raw : "";
      };
      const uniquePolities = (value, limit = 12) => {
        const seen = /* @__PURE__ */ new Set();
        const result = [];
        for (const raw of normalizeArray(value)) {
          const polity = canonicalPolity3(raw);
          const key = polity.toLocaleLowerCase();
          if (!polity || seen.has(key)) continue;
          seen.add(key);
          result.push(polity);
          if (result.length >= limit) break;
        }
        return result;
      };
      const id = normalizeOptionalString(entry.id) || `war-${index}`;
      const named = (list12) => uniquePolities(list12).filter((name) => new RegExp("\\p{L}", "u").test(name));
      const read = named(entry.sideA);
      const readKeys = new Set(read.map((name) => name.toLocaleLowerCase()));
      const others = named(entry.sideB).filter((name) => !readKeys.has(name.toLocaleLowerCase()));
      const [sideA, sideB] = others.length === 0 && read.length === 2 ? [[read[0]], [read[1]]] : [read, others];
      if (!sideA.length || !sideB.length) return null;
      const rawStatus = normalizeOptionalString(entry.status).toLowerCase();
      const status = WORLD_WAR_STATUS_SET.has(rawStatus) ? rawStatus : "active";
      const sourceEventIds = [...new Set(normalizeActionParticipants(entry.sourceEventIds))].slice(-24);
      const storylineIds = [...new Set(normalizeActionParticipants(entry.storylineIds))].slice(-12);
      const title = normalizeOptionalString(entry.title) || `${sideA[0]}\u2013${sideB[0]} War`;
      return {
        id,
        title,
        status,
        sideA,
        sideB,
        startedDate: canonicalizeDateString(entry.startedDate),
        endedDate: status === "ended" ? canonicalizeDateString(entry.endedDate || entry.lastUpdatedDate) : "",
        lastUpdatedDate: canonicalizeDateString(entry.lastUpdatedDate || entry.startedDate),
        cause: normalizeTextLike(entry.cause),
        note: normalizeTextLike(entry.note),
        sourceEventIds,
        storylineIds,
        createdRound: Number.isFinite(Number(entry.createdRound)) && Number(entry.createdRound) > 0 ? Math.trunc(Number(entry.createdRound)) : 0,
        updatedRound: Number.isFinite(Number(entry.updatedRound)) && Number(entry.updatedRound) > 0 ? Math.trunc(Number(entry.updatedRound)) : 0
      };
    };
    normalizeWorldWars = (value) => {
      const deduped = /* @__PURE__ */ new Map();
      normalizeArray(value).forEach((entry, index) => {
        const normalized = normalizeWorldWar(entry, index);
        if (!normalized) return;
        deduped.set(normalized.id, normalized);
      });
      const statusRank = { active: 0, ceasefire: 1, ended: 2 };
      return [...deduped.values()].sort(
        (a, b2) => (statusRank[a.status] ?? 9) - (statusRank[b2.status] ?? 9) || compareGameDates(b2.lastUpdatedDate || b2.startedDate || "", a.lastUpdatedDate || a.startedDate || "") || a.id.localeCompare(b2.id)
      ).slice(0, MAX_WORLD_WARS);
    };
    diplomaticIdentityIndexes = /* @__PURE__ */ new WeakMap();
    diplomaticIdentityIndexOf = (identityWorld) => {
      if (!identityWorld || typeof identityWorld !== "object") return null;
      let index = diplomaticIdentityIndexes.get(identityWorld);
      if (!index) {
        index = buildPolityIdentityIndex(identityWorld);
        diplomaticIdentityIndexes.set(identityWorld, index);
      }
      return index;
    };
    resolveWorldDiplomaticPolity = (token, identityWorld) => {
      const raw = normalizeOptionalString(token);
      if (!raw) return "";
      const resolved = resolvePolityIdentity(raw, identityWorld, {
        allowUnknown: true,
        requireActive: false,
        allowCoreMatch: true,
        allowStockBase: true,
        identityIndex: diplomaticIdentityIndexOf(identityWorld)
      });
      return normalizeOptionalString(resolved?.resolved || toCountryName(raw) || raw);
    };
    worldRelationPairKey = (a, b2) => [normalizeOptionalString(a), normalizeOptionalString(b2)].map((value) => value.toLocaleLowerCase()).sort().join("||");
    normalizeWorldRelation = (entry, identityWorld, index = 0) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const aRaw = resolveWorldDiplomaticPolity(entry.a, identityWorld);
      const bRaw = resolveWorldDiplomaticPolity(entry.b, identityWorld);
      if (!aRaw || !bRaw || aRaw.toLocaleLowerCase() === bRaw.toLocaleLowerCase()) return null;
      const ordered = [aRaw, bRaw].sort((a, b2) => a.toLocaleLowerCase().localeCompare(b2.toLocaleLowerCase()));
      const scoreNumber = Number(entry.score);
      const score = Number.isFinite(scoreNumber) ? Math.max(-100, Math.min(100, Math.round(scoreNumber))) : 0;
      const rawStatus = normalizeOptionalString(entry.status).toLowerCase();
      const status = WORLD_RELATION_STATUS_SET.has(rawStatus) ? rawStatus : score >= 55 ? "friendly" : score >= 20 ? "cordial" : score >= -10 ? "neutral" : score >= -30 ? "cautious" : score >= -60 ? "strained" : "hostile";
      return {
        id: normalizeOptionalString(entry.id) || `relation-${index}`,
        a: ordered[0],
        b: ordered[1],
        score,
        status,
        summary: normalizeTextLike(entry.summary),
        lastUpdatedDate: canonicalizeDateString(entry.lastUpdatedDate),
        sourceEventIds: [...new Set(normalizeActionParticipants(entry.sourceEventIds))].slice(-24),
        createdRound: Number.isFinite(Number(entry.createdRound)) ? Math.max(0, Math.trunc(Number(entry.createdRound))) : 0,
        updatedRound: Number.isFinite(Number(entry.updatedRound)) ? Math.max(0, Math.trunc(Number(entry.updatedRound))) : 0
      };
    };
    normalizeWorldRelations = (value, identityWorld) => {
      const deduped = /* @__PURE__ */ new Map();
      normalizeArray(value).forEach((entry, index) => {
        const normalized = normalizeWorldRelation(entry, identityWorld, index);
        if (!normalized) return;
        deduped.set(worldRelationPairKey(normalized.a, normalized.b), normalized);
      });
      return [...deduped.values()].sort((a, b2) => Math.abs(b2.score) - Math.abs(a.score) || a.id.localeCompare(b2.id)).slice(0, MAX_WORLD_RELATIONS);
    };
    normalizeWorldAgreement = (entry, identityWorld, index = 0) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const id = normalizeOptionalString(entry.id) || `agreement-${index}`;
      const parties = [...new Set(normalizeArray(entry.parties).map((party) => resolveWorldDiplomaticPolity(party, identityWorld)).filter(Boolean))].slice(0, 12);
      if (!id || parties.length < 2) return null;
      const rawType = normalizeOptionalString(entry.type).toLowerCase().replace(/[ -]+/g, "_");
      const type = WORLD_AGREEMENT_TYPE_SET.has(rawType) ? rawType : "other";
      const rawStatus = normalizeOptionalString(entry.status).toLowerCase();
      const status = WORLD_AGREEMENT_STATUS_SET.has(rawStatus) ? rawStatus : "active";
      const guarantor = type === "guarantee" ? resolveWorldDiplomaticPolity(entry.guarantor || parties[0], identityWorld) : "";
      const beneficiary = type === "guarantee" ? resolveWorldDiplomaticPolity(entry.beneficiary || parties[1], identityWorld) : "";
      const reciprocalAccess = type === "military_access" && entry.reciprocalAccess === true;
      const grantor = type === "military_access" && !reciprocalAccess ? resolveWorldDiplomaticPolity(entry.grantor, identityWorld) : "";
      const grantee = type === "military_access" && !reciprocalAccess ? resolveWorldDiplomaticPolity(entry.grantee, identityWorld) : "";
      return {
        id,
        title: normalizeOptionalString(entry.title) || id,
        type,
        status,
        parties,
        startedDate: canonicalizeDateString(entry.startedDate),
        endedDate: ["ended", "expired"].includes(status) ? canonicalizeDateString(entry.endedDate || entry.lastUpdatedDate) : "",
        lastUpdatedDate: canonicalizeDateString(entry.lastUpdatedDate || entry.startedDate),
        terms: normalizeTextLike(entry.terms),
        ...guarantor && beneficiary ? { guarantor, beneficiary } : {},
        ...type === "military_access" && reciprocalAccess ? { reciprocalAccess: true } : {},
        ...type === "military_access" && grantor && grantee ? { grantor, grantee, reciprocalAccess: false } : {},
        sourceEventIds: [...new Set(normalizeActionParticipants(entry.sourceEventIds))].slice(-24),
        createdRound: Number.isFinite(Number(entry.createdRound)) ? Math.max(0, Math.trunc(Number(entry.createdRound))) : 0,
        updatedRound: Number.isFinite(Number(entry.updatedRound)) ? Math.max(0, Math.trunc(Number(entry.updatedRound))) : 0,
        ...entry.migratedLegacy === true ? { migratedLegacy: true } : {}
      };
    };
    normalizeWorldAgreements = (value, identityWorld) => {
      const deduped = /* @__PURE__ */ new Map();
      normalizeArray(value).forEach((entry, index) => {
        const normalized = normalizeWorldAgreement(entry, identityWorld, index);
        if (normalized) deduped.set(normalized.id, normalized);
      });
      const statusRank = { active: 0, suspended: 1, ended: 2, expired: 3 };
      return [...deduped.values()].sort(
        (a, b2) => (statusRank[a.status] ?? 9) - (statusRank[b2.status] ?? 9) || compareGameDates(b2.lastUpdatedDate || b2.startedDate || "", a.lastUpdatedDate || a.startedDate || "") || a.id.localeCompare(b2.id)
      ).slice(0, MAX_WORLD_AGREEMENTS);
    };
    normalizeWorldPuppet = (entry, identityWorld, index = 0) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const overlord = resolveWorldDiplomaticPolity(entry.overlord, identityWorld);
      const puppet = resolveWorldDiplomaticPolity(entry.puppet, identityWorld);
      if (!overlord || !puppet || overlord.toLocaleLowerCase() === puppet.toLocaleLowerCase()) return null;
      const status = PUPPET_STATUSES.includes(normalizeOptionalString(entry.status).toLowerCase()) ? normalizeOptionalString(entry.status).toLowerCase() : "active";
      const loyaltyNumber = Number(entry.loyalty);
      const kind = normalizeOptionalString(entry.kind).toLowerCase();
      const secrecy = normalizeOptionalString(entry.secrecy).toLowerCase();
      const seen = /* @__PURE__ */ new Set();
      const knownTo = [];
      for (const raw of normalizeArray(entry.knownTo)) {
        const polity = resolveWorldDiplomaticPolity(typeof raw === "string" ? raw : raw?.polity, identityWorld);
        if (!polity) continue;
        const key = polity.toLocaleLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const lastSeen = typeof raw === "string" ? "" : normalizeOptionalString(raw?.seenStatus).toLowerCase();
        knownTo.push({
          polity,
          learnedDate: typeof raw === "string" ? "" : canonicalizeDateString(raw?.learnedDate),
          // The status this polity last SAW. Absent means it saw the arrangement
          // standing — the only thing it could have learned of it by being told.
          ...PUPPET_STATUSES.includes(lastSeen) ? { seenStatus: lastSeen } : {}
        });
        if (knownTo.length >= 24) break;
      }
      return {
        id: normalizeOptionalString(entry.id) || `puppet-${index}`,
        overlord,
        puppet,
        kind: PUPPET_KINDS.includes(kind) ? kind : "client",
        loyalty: Number.isFinite(loyaltyNumber) ? Math.max(0, Math.min(100, Math.round(loyaltyNumber))) : 50,
        secrecy: PUPPET_SECRECY_LEVELS.includes(secrecy) ? secrecy : "open",
        knownTo,
        status,
        startedDate: canonicalizeDateString(entry.startedDate),
        endedDate: status === "active" ? "" : canonicalizeDateString(entry.endedDate || entry.lastUpdatedDate),
        lastUpdatedDate: canonicalizeDateString(entry.lastUpdatedDate || entry.startedDate),
        sourceEventIds: [...new Set(normalizeActionParticipants(entry.sourceEventIds))].slice(-24),
        createdRound: Number.isFinite(Number(entry.createdRound)) ? Math.max(0, Math.trunc(Number(entry.createdRound))) : 0,
        updatedRound: Number.isFinite(Number(entry.updatedRound)) ? Math.max(0, Math.trunc(Number(entry.updatedRound))) : 0
      };
    };
    normalizeWorldPuppets = (value, identityWorld) => {
      const rows = [];
      const liveByPuppet = /* @__PURE__ */ new Set();
      const ids = /* @__PURE__ */ new Set();
      normalizeArray(value).forEach((entry, index) => {
        const normalized = normalizeWorldPuppet(entry, identityWorld, index);
        if (!normalized || ids.has(normalized.id)) return;
        const key = normalized.puppet.toLocaleLowerCase();
        if (normalized.status === "active") {
          if (liveByPuppet.has(key)) return;
          liveByPuppet.add(key);
        }
        ids.add(normalized.id);
        rows.push(normalized);
      });
      if (rows.length <= MAX_PUPPETS) return rows;
      const byRecency = (a, b2) => compareGameDates(b2.lastUpdatedDate || "", a.lastUpdatedDate || "") || a.id.localeCompare(b2.id);
      const live = rows.filter((row) => row.status === "active").sort(byRecency);
      const ended = rows.filter((row) => row.status !== "active").sort(byRecency);
      return [...live, ...ended].slice(0, MAX_PUPPETS);
    };
    withFormerSceneKeyMoved = (world) => {
      if (!("activeCatalyst" in world)) return world;
      const { activeCatalyst: formerScene, ...rest } = world;
      return { ...rest, activeInteractive: rest.activeInteractive ?? formerScene };
    };
    normalizeWorldState = (world) => {
      const nextWorld = withFormerSceneKeyMoved(world && typeof world === "object" ? world : {});
      const polityOverrides = Object.fromEntries(
        Object.entries(nextWorld.polityOverrides ?? {}).map(([key, value]) => [key, normalizePolityOverride(key, value)]).filter(([, value]) => value)
      );
      const resolveOwner = createOwnerResolver(buildOwnerAliasMap(polityOverrides));
      const regionOwnershipOverrides = Object.fromEntries(
        Object.entries(nextWorld.regionOwnershipOverrides ?? {}).map(([regionId, ownerCode]) => [normalizeOptionalString(regionId), resolveOwner(ownerCode)]).filter(([regionId, ownerCode]) => regionId && ownerCode)
      );
      const regionClaimants = Object.fromEntries(
        Object.entries(nextWorld.regionClaimants ?? {}).map(([regionId, claimants]) => [
          normalizeOptionalString(regionId),
          normalizeArray(claimants).map((name) => resolveOwner(name)).filter(Boolean).slice(0, 4)
        ]).filter(([regionId, claimants]) => regionId && claimants.length)
      );
      const groups = normalizeGroups(nextWorld.groups);
      const groupAreas = normalizeGroupAreas(nextWorld.groupAreas, groups);
      const settledRegionClaims = [...new Set(
        normalizeArray(nextWorld.settledRegionClaims).map((regionId) => normalizeOptionalString(regionId))
      )].filter((regionId) => regionId && !Object.prototype.hasOwnProperty.call(regionClaimants, regionId));
      const regionSovereigntyOverrides = Object.fromEntries(
        Object.entries(nextWorld.regionSovereigntyOverrides ?? {}).map(([regionId, ownerCode]) => [normalizeOptionalString(regionId), resolveOwner(ownerCode)]).filter(([regionId, ownerCode]) => {
          if (!regionId || !ownerCode) return false;
          const controller = normalizeOptionalString(regionOwnershipOverrides[regionId]);
          return !controller || controller.toLowerCase() !== ownerCode.toLowerCase();
        })
      );
      const internationalReputation = Object.fromEntries(
        Object.entries(nextWorld.internationalReputation ?? {}).map(([polityCode, value]) => [normalizeOptionalString(polityCode), Number(value)]).filter(([polityCode, value]) => polityCode && Number.isFinite(value)).map(([polityCode, value]) => [polityCode, Math.max(0, Math.min(100, Math.round(value)))])
      );
      const intelligence = Object.fromEntries(
        Object.entries(nextWorld.intelligence ?? {}).map(([polityCode, value]) => [normalizeOptionalString(polityCode), Number(value)]).filter(([polityCode, value]) => polityCode && Number.isFinite(value)).map(([polityCode, value]) => [polityCode, Math.max(0, Math.min(100, Math.round(value)))])
      );
      const SPY_STATUSES = ["active", "discovered", "turned", "exposed", "recalled", "dead"];
      const spies = normalizeArray(nextWorld.spies).map((spy, index) => {
        const target = normalizeOptionalString(spy?.target || spy?.polity);
        if (!target) return null;
        return {
          id: normalizeOptionalString(spy?.id) || `spy-${index + 1}`,
          // Pre-ownership records were all the player's; the field is filled in
          // at read time by whoever knows the player's name (spycraft treats an
          // empty owner as "the player" only when asked to).
          owner: normalizeOptionalString(spy?.owner),
          target,
          deployedAt: normalizeOptionalString(spy?.deployedAt),
          status: SPY_STATUSES.includes(spy?.status) ? spy.status : "active",
          turnedAt: normalizeOptionalString(spy?.turnedAt),
          exposedAt: normalizeOptionalString(spy?.exposedAt),
          coverStory: normalizeOptionalString(spy?.coverStory),
          suspected: spy?.suspected === true,
          ...spyTasking(spy)
        };
      }).filter(Boolean);
      const spySeal = /^[0-9a-f]{64}$/i.test(String(nextWorld.spySeal ?? "")) ? String(nextWorld.spySeal) : "";
      const countryTags = Object.fromEntries(
        Object.entries(nextWorld.countryTags ?? {}).map(([country, list12]) => [normalizeOptionalString(country), normalizeTagList(list12)]).filter(([country, list12]) => country && list12.length)
      );
      const countryStats = Object.fromEntries(
        Object.entries(nextWorld.countryStats ?? {}).map(([code, sheet]) => [normalizeOptionalString(code), normalizeCountryStatSheet(sheet)]).filter(([code, sheet]) => code && sheet && typeof sheet === "object")
      );
      const units = normalizeUnits(nextWorld.units);
      const diplomaticIdentityWorld = { ...nextWorld, polityOverrides, regionOwnershipOverrides };
      return {
        ...WORLD_DEFAULTS,
        ...nextWorld,
        countryTags,
        countryStats,
        politicalActors: normalizePoliticalActors(nextWorld.politicalActors),
        politicalSimulation: normalizePoliticalSimulationClock(nextWorld.politicalSimulation),
        institutions: normalizeInstitutions(nextWorld.institutions, diplomaticIdentityWorld, diplomaticIdentityIndexOf(diplomaticIdentityWorld)),
        powerStatus: normalizePowerStatus(nextWorld.powerStatus, diplomaticIdentityWorld),
        actionSuggestions: normalizeActionSuggestions(nextWorld.actionSuggestions),
        activeInteractive: normalizeInteractive(nextWorld.activeInteractive),
        interactiveOffer: normalizeInteractiveOffer(nextWorld.interactiveOffer),
        lastInteractiveOfferRound: Number.isFinite(Number(nextWorld.lastInteractiveOfferRound)) ? Math.max(0, Math.trunc(Number(nextWorld.lastInteractiveOfferRound))) : 0,
        consolidatedHistory: normalizeConsolidatedHistory(nextWorld.consolidatedHistory),
        historyDocument: normalizeHistoryDocument(nextWorld.historyDocument),
        internationalReputation,
        intelligence,
        spies,
        spySeal,
        gmAudit: normalizeGameMasterAudit(nextWorld.gmAudit),
        gmChanges: normalizeGmChanges(nextWorld.gmChanges),
        simulationReminders: normalizeReminders(nextWorld.simulationReminders),
        playerGoals: normalizePlayerGoals(nextWorld.playerGoals),
        labelFont: normalizeOptionalString(nextWorld.labelFont),
        labelHaloColor: normalizeOptionalString(nextWorld.labelHaloColor),
        labelTextColor: normalizeOptionalString(nextWorld.labelTextColor),
        language: normalizeOptionalString(nextWorld.language) || WORLD_DEFAULTS.language,
        lastJumpMode: normalizeOptionalString(nextWorld.lastJumpMode),
        lastJumpSummary: normalizeOptionalString(nextWorld.lastJumpSummary),
        lastJumpTargetDate: normalizeOptionalString(nextWorld.lastJumpTargetDate),
        idlePulseTick: Number.isFinite(Number(nextWorld.idlePulseTick)) ? Math.max(0, Math.trunc(Number(nextWorld.idlePulseTick))) : 0,
        boardReviewedRound: Number.isFinite(Number(nextWorld.boardReviewedRound)) ? Math.max(0, Math.trunc(Number(nextWorld.boardReviewedRound))) : 0,
        polityOverrides,
        regionClaimants,
        settledRegionClaims,
        groups,
        groupAreas,
        regionOwnershipOverrides,
        regionSovereigntyOverrides,
        simulationHistory: normalizeArray(nextWorld.simulationHistory).map((entry, index, entries) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }
          const newestReceiptIndex = entries.findIndex((candidate) => candidate && typeof candidate === "object" && candidate.receipt);
          const receipt = normalizeApplicationReceipt(entry.receipt, { keepNotes: index === newestReceiptIndex });
          const { receipt: _storedReceipt, filedEvents: _storedFiled, interactive: _scene, catalyst: _formerScene, ...rest } = cloneValue(entry);
          const filedEvents = normalizeFiledEvents(entry.filedEvents);
          return {
            ...rest,
            ...receipt ? { receipt } : {},
            ...filedEvents.length ? { filedEvents } : {},
            date: normalizeOptionalString(entry.date),
            eventIds: normalizeActionParticipants(entry.eventIds),
            fallbackReason: normalizeOptionalString(entry.fallbackReason),
            fromDate: normalizeOptionalString(entry.fromDate || entry.startDate),
            mode: normalizeRenamedKind(entry.mode),
            plannedActions: normalizeActions(entry.plannedActions || entry.actions),
            // The raw model response a fallback turn failed to parse — empty on a
            // normal AI turn. See gameplay.js's runJsonTask/applySimulationResult.
            rawResponse: normalizeOptionalString(entry.rawResponse),
            round: Number.isFinite(Number(entry.round)) && Number(entry.round) > 0 ? Math.trunc(Number(entry.round)) : 0,
            summary: normalizeTextLike(entry.summary),
            source: normalizeOptionalString(entry.source) || "ai",
            toDate: normalizeOptionalString(entry.toDate || entry.endDate || entry.date)
          };
        }).filter(Boolean),
        markers: normalizeMarkers(nextWorld.markers),
        reports: normalizeReports(nextWorld.reports),
        chatKnowledgeCursors: (() => {
          const source = nextWorld.chatKnowledgeCursors;
          if (!source || typeof source !== "object" || Array.isArray(source)) return {};
          const cursors = {};
          for (const [key, value] of Object.entries(source)) {
            const id = normalizeOptionalString(value);
            if (normalizeOptionalString(key) && id) cursors[key] = id;
          }
          return cursors;
        })(),
        // Capped at the most recent 512: a refusal is rare, and past that many the
        // oldest could be charged again — a campaign would need five hundred refused
        // demands for that to matter, and a list that grew forever would matter sooner.
        chargedRefusals: [...new Set(normalizeArray(nextWorld.chargedRefusals).map((id) => normalizeOptionalString(id)).filter(Boolean))].slice(-512),
        pendingEventOutreach: normalizePendingEventOutreach(nextWorld.pendingEventOutreach),
        // Explicit (not via the ...WORLD_DEFAULTS spread) so these new fields survive every
        // write path — the documented new-world-field trap.
        //
        // Owners folded on READ, exactly as regionOwnershipOverrides and regionClaimants
        // above are, and for the same reason: a board written before the ops door began
        // folding them can still carry a foreign programme filed under a polity's era
        // display name ("the Third Reich") rather than the token everything else keys off
        // ("Germany"). Left alone that is a second power beside the first, with no flag
        // and no colour — and where the renamed polity is the PLAYER'S, it is their own
        // programme sitting in the Foreign column with both of its controls gone. Idempotent,
        // so a board already correct reads back unchanged.
        projects: normalizeProjects(nextWorld.projects).map((project) => {
          const owner = resolveOwner(project.ownerCode);
          return owner === project.ownerCode ? project : { ...project, ownerCode: owner };
        }),
        // A shared game's other boards (multiplayer/host/gameHost.js): every country
        // a second person plays keeps a Projects board of its own here, by country
        // name. world.projects stays the host's, which is single player's. Only a
        // world that has the key keeps it, so a single-player save never gains one.
        ...Object.prototype.hasOwnProperty.call(nextWorld, "seatBoards") ? {
          seatBoards: Object.fromEntries(
            Object.entries(nextWorld.seatBoards && typeof nextWorld.seatBoards === "object" && !Array.isArray(nextWorld.seatBoards) ? nextWorld.seatBoards : {}).map(([country, board]) => [normalizeOptionalString(country), normalizeProjects(board)]).filter(([country, board]) => country && board.length).slice(0, 64)
          )
        } : {},
        cityRenames: Object.fromEntries(
          Object.entries(nextWorld.cityRenames && typeof nextWorld.cityRenames === "object" ? nextWorld.cityRenames : {}).map(([key, value]) => [normalizeString2(key).toLowerCase(), normalizeString2(value)]).filter(([key, value]) => key && value)
        ),
        cityPopulations: Object.fromEntries(
          Object.entries(nextWorld.cityPopulations && typeof nextWorld.cityPopulations === "object" ? nextWorld.cityPopulations : {}).map(([city, value]) => [normalizeOptionalString(city).toLowerCase(), Number(value)]).filter(([city, value]) => city && Number.isFinite(value) && value >= 0)
        ),
        relations: normalizeWorldRelations(nextWorld.relations, diplomaticIdentityWorld),
        agreements: normalizeWorldAgreements(nextWorld.agreements, diplomaticIdentityWorld),
        diplomaticLedgerVersion: Number.isFinite(Number(nextWorld.diplomaticLedgerVersion)) ? Math.max(0, Math.trunc(Number(nextWorld.diplomaticLedgerVersion))) : 0,
        wars: normalizeWorldWars(nextWorld.wars),
        // Shape and length only: the engine wrote every record, and this runs on
        // every read of the world.
        battlefields: normalizeBattlefields(nextWorld.battlefields),
        transports: normalizeTransports(nextWorld.transports),
        strikes: normalizeStrikes(nextWorld.strikes),
        seaBattles: normalizeSeaBattles(nextWorld.seaBattles),
        naviesRaised: normalizeNaviesRaised(nextWorld.naviesRaised),
        blockades: normalizeBlockades(nextWorld.blockades),
        warWeariness: normalizeWarWeariness(nextWorld.warWeariness),
        warResources: normalizeWarResources(nextWorld.warResources),
        attrition: normalizeAttrition(nextWorld.attrition),
        // How the scenario's wars are fought (warSettings.js): null where it says nothing.
        warSettings: normalizeWarSettings(nextWorld.warSettings),
        // What it draws on its map for war (warGeography.js).
        terrainAreas: normalizeTerrainAreas(nextWorld.terrainAreas),
        fortifications: normalizeFortifications(nextWorld.fortifications),
        climateZones: normalizeClimateZones(nextWorld.climateZones),
        freezingRegions: normalizeFreezingRegions(nextWorld.freezingRegions),
        frozenRegions: normalizeFreezingRegions(nextWorld.frozenRegions),
        zoneWeather: normalizeZoneWeather(nextWorld.zoneWeather),
        peaceOffers: normalizePeaceOffers(nextWorld.peaceOffers),
        reparations: normalizeReparations(nextWorld.reparations),
        peaceTreaties: normalizePeaceTreaties(nextWorld.peaceTreaties),
        callsToArms: normalizeCallsToArms(nextWorld.callsToArms),
        puppets: normalizeWorldPuppets(nextWorld.puppets, diplomaticIdentityWorld),
        storylines: normalizeWorldStorylines(nextWorld.storylines),
        simulationRules: normalizeOptionalString(nextWorld.simulationRules),
        startingTimelineText: normalizeOptionalString(nextWorld.startingTimelineText),
        units,
        // Pruned against the units computed just above, on every read AND write, so
        // an order clears itself the moment its unit actually arrives — see
        // pruneSatisfiedUnitOrders.
        pendingUnitOrders: pruneSatisfiedUnitOrders(units, normalizePendingUnitOrders(nextWorld.pendingUnitOrders)),
        // Which unit system last took a turn on this save: "beta", "classic", or ""
        // for a save written before the two were distinguishable. Stamped by
        // applyEventImpactsToWorld, never by a normalizer — this module has no idea
        // which system is running and must not acquire one.
        //
        // It exists so resumeStandingOrders can tell that game time passed while the
        // beta engine was not running, and so a save can say what wrote it. Neither
        // system reads it to decide behaviour.
        unitSystem: UNIT_SYSTEM_SET.has(normalizeOptionalString(nextWorld.unitSystem)) ? normalizeOptionalString(nextWorld.unitSystem) : ""
      };
    };
    canonicalizeDateString = (value) => {
      const text3 = normalizeOptionalString(value);
      if (!text3) return text3;
      const canonical = normalizeGameDate(text3);
      if (canonical) return canonical;
      const prefix = /^(\d{4}-\d{2}-\d{2})[T ]/.exec(text3);
      if (prefix) return prefix[1];
      const parsed = new Date(text3);
      if (!Number.isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        if (year >= 1 && year <= 9999) {
          return `${String(year).padStart(4, "0")}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
        }
      }
      return text3;
    };
    chatWriteQueue = Promise.resolve();
  }
});

// src/Game/AI/nativeDiplomaticDirector.js
var DIPLOMATIC_DIRECTOR_VERSION, MAX_RELATIONS, MAX_AGREEMENTS, MAX_CONTEXT_ACTORS, MAX_CONTEXT_RELATIONS, MAX_CONTEXT_AGREEMENTS, RELATION_STATUS_VALUES, AGREEMENT_TYPE_VALUES, AGREEMENT_STATUS_VALUES, RELATION_STATUS_SET, AGREEMENT_TYPE_SET, AGREEMENT_STATUS_SET, clean28, array5, lower4, clamp6, canonicalDiplomaticPolity, diplomaticDisplayName, normalizeRelationStatus, normalizedRelations, normalizedAgreements, PUPPET_OP_VALUES, PUPPET_OP_SET, PUPPET_KIND_SET, MAX_CONTEXT_PUPPETS, agreementDisplay, puppetDisplay, relationDisplay, politySetKey, buildBoundedDiplomaticContext;
var init_nativeDiplomaticDirector = __esm({
  "src/Game/AI/nativeDiplomaticDirector.js"() {
    init_define_import_meta_env();
    init_worker_shims();
    init_gameState();
    init_puppets();
    init_ownerNames();
    init_polityIdentity();
    init_gameDates();
    init_receiptPlayerNotes();
    DIPLOMATIC_DIRECTOR_VERSION = "0.1.7-round-zero-baseline";
    MAX_RELATIONS = 256;
    MAX_AGREEMENTS = 128;
    MAX_CONTEXT_ACTORS = 8;
    MAX_CONTEXT_RELATIONS = 16;
    MAX_CONTEXT_AGREEMENTS = 12;
    RELATION_STATUS_VALUES = Object.freeze([
      "friendly",
      "cordial",
      "neutral",
      "cautious",
      "strained",
      "hostile",
      "rival"
    ]);
    AGREEMENT_TYPE_VALUES = Object.freeze([
      "alliance",
      "mutual_defense",
      "guarantee",
      "non_aggression",
      "friendship_consultation",
      "trade_economic",
      "military_cooperation",
      "military_access",
      "neutrality",
      "peace_settlement",
      "other"
    ]);
    AGREEMENT_STATUS_VALUES = Object.freeze([
      "active",
      "suspended",
      "ended",
      "expired"
    ]);
    RELATION_STATUS_SET = new Set(RELATION_STATUS_VALUES);
    AGREEMENT_TYPE_SET = new Set(AGREEMENT_TYPE_VALUES);
    AGREEMENT_STATUS_SET = new Set(AGREEMENT_STATUS_VALUES);
    clean28 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    array5 = (value) => Array.isArray(value) ? value : [];
    lower4 = (value) => clean28(value).toLocaleLowerCase();
    clamp6 = (value, min, max2) => Math.max(min, Math.min(max2, value));
    canonicalDiplomaticPolity = (token, world, { allowUnknown = false, identityIndex = null } = {}) => {
      const raw = clean28(token);
      if (!raw) return "";
      const resolved = resolvePolityIdentity(raw, world, {
        allowUnknown,
        requireActive: false,
        allowCoreMatch: true,
        allowStockBase: true,
        identityIndex
      });
      if (resolved?.resolved) return clean28(resolved.resolved);
      if (!allowUnknown) return "";
      return clean28(toCountryName(raw)) || raw;
    };
    diplomaticDisplayName = (world, canonicalKey) => {
      const key = clean28(canonicalKey);
      if (!key) return "";
      const direct = world?.polityOverrides?.[key];
      if (clean28(direct?.name)) return clean28(direct.name);
      for (const [candidateKey2, polity] of Object.entries(world?.polityOverrides || {})) {
        if (lower4(candidateKey2) !== lower4(key)) continue;
        return clean28(polity?.name) || clean28(candidateKey2);
      }
      return key;
    };
    normalizeRelationStatus = (_value, score = 0) => {
      const numeric = clamp6(Math.round(Number(score) || 0), -100, 100);
      if (numeric >= 55) return "friendly";
      if (numeric >= 20) return "cordial";
      if (numeric >= -10) return "neutral";
      if (numeric >= -30) return "cautious";
      if (numeric >= -60) return "strained";
      if (numeric > -90) return "hostile";
      return "rival";
    };
    normalizedRelations = (world) => array5(normalizeWorldState(world)?.relations).map((entry) => entry && typeof entry === "object" ? { ...entry, status: normalizeRelationStatus(entry.status, entry.score) } : null).filter(Boolean).slice(0, MAX_RELATIONS);
    normalizedAgreements = (world) => array5(normalizeWorldState(world)?.agreements).map((entry) => entry && typeof entry === "object" ? entry : null).filter(Boolean).slice(0, MAX_AGREEMENTS);
    PUPPET_OP_VALUES = Object.freeze([
      "install",
      "reclassify",
      "loyalty",
      "reveal",
      "release",
      "annex",
      "revolt",
      "suppress"
    ]);
    PUPPET_OP_SET = new Set(PUPPET_OP_VALUES);
    PUPPET_KIND_SET = new Set(PUPPET_KINDS);
    MAX_CONTEXT_PUPPETS = 24;
    agreementDisplay = (agreement, world) => {
      const parties = array5(agreement.parties).map((party) => diplomaticDisplayName(world, party));
      const role = agreement.type === "guarantee" && agreement.guarantor && agreement.beneficiary ? ` | guarantor ${diplomaticDisplayName(world, agreement.guarantor)} \u2192 ${diplomaticDisplayName(world, agreement.beneficiary)}` : "";
      return `- ${agreement.id} | ${String(agreement.status || "active").toUpperCase()} | ${agreement.type} | ${agreement.title} | parties: ${parties.join(", ")}${role}` + (clean28(agreement.terms) ? ` | terms: ${clean28(agreement.terms).slice(0, 280)}` : "");
    };
    puppetDisplay = (row, world) => {
      const overlord = diplomaticDisplayName(world, row.overlord);
      const puppet = diplomaticDisplayName(world, row.puppet);
      const secrecy = row.secrecy === "covert" ? "COVERT" : "open";
      const knownTo = array5(row.knownTo).map((entry) => diplomaticDisplayName(world, entry?.polity || entry)).filter((name) => lower4(name) !== lower4(overlord) && lower4(name) !== lower4(puppet));
      const watching = array5(world.spies).some((spy) => lower4(spy?.owner) === lower4(row.overlord) && lower4(spy?.target) === lower4(row.puppet) && lower4(spy?.status) === "active");
      const service = Number(world.intelligence?.[row.overlord]);
      const eyes = watching ? " | the overlord has an agent inside: unrest there is visible to it" : Number.isFinite(service) && service >= 70 ? " | the overlord's services are strong: it may catch word of unrest there" : " | the overlord has no eyes inside: unrest there would take it by surprise";
      return `- ${overlord} directs ${puppet} | ${row.kind} | ${secrecy} | loyalty ${row.loyalty}${eyes}` + (row.startedDate ? ` | since ${row.startedDate}` : "") + (row.secrecy === "covert" ? ` | also known to: ${knownTo.length ? knownTo.join(", ") : "nobody else"}` : "");
    };
    relationDisplay = (relation, world) => `- ${diplomaticDisplayName(world, relation.a)} \u2194 ${diplomaticDisplayName(world, relation.b)} | ${relation.status} ${Number(relation.score) >= 0 ? "+" : ""}${relation.score}` + (clean28(relation.summary) ? ` | ${clean28(relation.summary).slice(0, 240)}` : "");
    politySetKey = (value) => lower4(value);
    buildBoundedDiplomaticContext = (worldLike, {
      playerPolity = "",
      focusActors = [],
      selectedStorylines = [],
      maxActors = MAX_CONTEXT_ACTORS
    } = {}) => {
      const world = normalizeWorldState(worldLike);
      const identityIndex = buildPolityIdentityIndex(world);
      const requested = [
        playerPolity,
        ...array5(focusActors),
        ...array5(selectedStorylines).flatMap((storyline) => array5(storyline?.participants))
      ].map((actor) => canonicalDiplomaticPolity(actor, world, { identityIndex })).filter(Boolean);
      const actorKeys = /* @__PURE__ */ new Set();
      const actors = [];
      const pushActor = (actor) => {
        const canonical = canonicalDiplomaticPolity(actor, world, { identityIndex });
        const key = politySetKey(canonical);
        if (!canonical || actorKeys.has(key) || actors.length >= maxActors) return;
        actorKeys.add(key);
        actors.push(canonical);
      };
      requested.forEach(pushActor);
      const seedActorKeys = new Set(actorKeys);
      for (const row of array5(world.puppets)) {
        if (lower4(row?.status || "active") !== "active") continue;
        const overlord = canonicalDiplomaticPolity(row?.overlord, world, { identityIndex });
        const puppet = canonicalDiplomaticPolity(row?.puppet, world, { identityIndex });
        if (!overlord || !puppet) continue;
        const overlordSeed = seedActorKeys.has(politySetKey(overlord));
        const puppetSeed = seedActorKeys.has(politySetKey(puppet));
        if (!overlordSeed && !puppetSeed) continue;
        if (overlordSeed) pushActor(puppet);
        if (puppetSeed) pushActor(overlord);
        if (actors.length >= maxActors) break;
      }
      for (const agreement of normalizedAgreements(world)) {
        if (!["active", "suspended"].includes(agreement.status)) continue;
        if (!array5(agreement.parties).some((party) => seedActorKeys.has(politySetKey(party)))) continue;
        array5(agreement.parties).forEach(pushActor);
        if (actors.length >= maxActors) break;
      }
      for (const war of array5(world.wars)) {
        if (!["active", "ceasefire"].includes(lower4(war?.status))) continue;
        const parties = [...array5(war?.sideA), ...array5(war?.sideB)].map((party) => canonicalDiplomaticPolity(party, world, { identityIndex })).filter(Boolean);
        if (!parties.some((party) => seedActorKeys.has(politySetKey(party)))) continue;
        parties.forEach(pushActor);
        if (actors.length >= maxActors) break;
      }
      const relations = normalizedRelations(world).filter((relation) => actorKeys.has(politySetKey(relation.a)) && actorKeys.has(politySetKey(relation.b))).sort((a, b2) => Math.abs(Number(b2.score) || 0) - Math.abs(Number(a.score) || 0)).slice(0, MAX_CONTEXT_RELATIONS);
      const agreements = normalizedAgreements(world).filter((agreement) => ["active", "suspended"].includes(agreement.status)).filter((agreement) => {
        const parties = array5(agreement.parties);
        return parties.length > 0 && parties.every((party) => actorKeys.has(politySetKey(party)));
      }).slice(0, MAX_CONTEXT_AGREEMENTS);
      const inAttention = (row) => actorKeys.has(politySetKey(row.overlord)) || actorKeys.has(politySetKey(row.puppet));
      const puppets = array5(world.puppets).filter((row) => row.status === "active").sort((a, b2) => Number(inAttention(b2)) - Number(inAttention(a))).slice(0, MAX_CONTEXT_PUPPETS);
      const text3 = [
        `[Canonical Diplomatic State v${DIPLOMATIC_DIRECTOR_VERSION} \u2014 bounded relevant slice]`,
        `Attention actors (${actors.length}/${maxActors} max): ${actors.length ? actors.map((actor) => diplomaticDisplayName(world, actor)).join(", ") : "none"}`,
        "",
        "BILATERAL RELATIONS",
        relations.length ? relations.map((relation) => relationDisplay(relation, world)).join("\n") : "No tracked bilateral relation among these attention actors.",
        "",
        "FORMAL AGREEMENTS / COMMITMENTS",
        agreements.length ? agreements.map((agreement) => agreementDisplay(agreement, world)).join("\n") : "No active/suspended formal agreement among these attention actors.",
        "",
        "SUBORDINATIONS (who directs whom)",
        puppets.length ? puppets.map((row) => puppetDisplay(row, world)).join("\n") : "No polity here directs another.",
        "A Puppet is a SEPARATE COUNTRY: it holds its own territory and its own sovereignty, and only its will is directed. A COVERT subordination is known only to the two parties and anyone listed; a covert Puppet speaking to anyone else must present itself as fully independent. Loyalty is never public knowledge, not even for an open arrangement.",
        "Sparse-ledger rule: an untracked pair is NOT secretly hostile and is NOT a numeric score of zero. It only means no material bilateral state has yet been canonically recorded.",
        "Formal commitments and bilateral warmth are different facts. An alliance may be strained; friendly countries may have no alliance.",
        "world.wars remains the sole authority for actual belligerency. A hostile relation does not itself start a war. An alliance, a mutual defence agreement or a guarantee binds: when a party is attacked the game itself enters the others in that war, and one that will not come has broken the treaty and pays for it in reputation."
      ].join("\n");
      return { actors, relations, agreements, puppets, text: text3 };
    };
  }
});

// src/Game/AI/gameMasterOrders.js
var init_gameMasterOrders = __esm({
  "src/Game/AI/gameMasterOrders.js"() {
    init_define_import_meta_env();
    init_worker_shims();
  }
});

// src/Game/AI/worldDirectorWorker.js
init_define_import_meta_env();
init_worker_shims();

// src/Game/AI/nativeWorldDirector.js
init_define_import_meta_env();
init_worker_shims();
init_countryStats();
init_nativeDiplomaticDirector();

// src/Game/AI/playerFocus.js
init_define_import_meta_env();
init_worker_shims();
var asText6 = (value) => String(value ?? "").trim();
var PLAYER_FOCUS_LEVELS = Object.freeze([
  Object.freeze({ key: "world-first", label: "World first", share: 25, contextShare: 1 }),
  Object.freeze({ key: "balanced", label: "Balanced", share: 40, contextShare: 1 }),
  Object.freeze({ key: "focused", label: "Focused", share: 60, contextShare: 0.6 }),
  Object.freeze({ key: "spotlight", label: "Spotlight", share: 75, contextShare: 0.4 })
]);
var PLAYER_FOCUS_DEFAULT = "balanced";
var levelOf = (focus) => PLAYER_FOCUS_LEVELS.find((level) => level.key === normalizePlayerFocus(focus));
var normalizePlayerFocus = (value) => {
  const key = asText6(value).toLowerCase().replace(/[\s_]+/g, "-");
  return PLAYER_FOCUS_LEVELS.some((level) => level.key === key) ? key : PLAYER_FOCUS_DEFAULT;
};
var PACED_PROJECT_STATUSES = /* @__PURE__ */ new Set(["proposed", "active", "stalled"]);
var SLIPPABLE_PROJECT_STATUSES = /* @__PURE__ */ new Set([...PACED_PROJECT_STATUSES, "paused"]);
var asArray4 = (value) => Array.isArray(value) ? value : [];
var trimWorldForFocus = (items, { focus, isPlayerItem = () => false } = {}) => {
  const list12 = asArray4(items);
  const worldCount = list12.filter((item) => !isPlayerItem(item)).length;
  const keep = Math.max(1, Math.ceil(worldCount * levelOf(focus).contextShare));
  let kept = 0;
  return list12.filter((item) => {
    if (isPlayerItem(item)) return true;
    kept += 1;
    return kept <= keep;
  });
};

// src/Game/AI/nativeWorldIntegrity.js
init_define_import_meta_env();
init_worker_shims();
init_polityIdentity();
init_eventAgency();

// src/Game/AI/playerAgencyAuthority.js
init_define_import_meta_env();
init_worker_shims();

// src/Game/AI/nativeWorldIntegrity.js
init_gameMasterOrders();

// src/runtime/institutionalAuthority.js
init_define_import_meta_env();
init_worker_shims();
init_institutions();
var INSTITUTION_EXECUTION_AUTHORITY_KINDS = Object.freeze([
  "deployment-authorization",
  "sanctions-authorization",
  "funding-authorization"
]);
var EXECUTION_AUTHORITY_KIND_SET = new Set(INSTITUTION_EXECUTION_AUTHORITY_KINDS);

// src/Game/AI/nativeWorldIntegrity.js
init_institutions();
init_gameDates();
init_humanPolities();
var WORLD_INTEGRITY_VERSION = "0.18.0-native-event-provenance";
var EXPLORATION_PLAYER_SPHERE_ACTOR_SLOTS = 5;
var EXPLORATION_WIDER_EVIDENCE_ACTOR_SLOTS = 1;
var EXPLORATION_WIDER_LATENT_ACTOR_SLOTS = 2;
var EXPLORATION_WIDER_ACTOR_SLOTS = EXPLORATION_WIDER_EVIDENCE_ACTOR_SLOTS + EXPLORATION_WIDER_LATENT_ACTOR_SLOTS;
var EXPLORATION_TARGET_PER_SCOPE = 5;
var EXPLORATION_DOMAINS = Object.freeze([
  "diplomacy / foreign policy / commercial relations",
  "domestic politics / institutions / leadership pressures",
  "economy / industry / trade / finance",
  "society / labour / public order / reform",
  "science / technology / infrastructure / communications",
  "military readiness / doctrine / procurement (not routine battlefield continuation)",
  "regional / colonial / minority governance where applicable",
  "third-party reaction to wars, crises, treaties, and balance-of-power changes",
  "political rupture / elite fracture / mass unrest / coup or constitutional risk when current pressures support it",
  "strategic risk / coercive escalation / mobilization / brinkmanship / miscalculation when current interests support it"
]);
var ROUTINE_ADMINISTRATIVE_CUE_RE = /\b(?:technical review|committee review|working group|administrative implementation|implementation review|compliance review|compliance tracking|inspection protocol|inspection standards|regulatory harmonization|protocol refinement|procedural update|standards update|monitoring framework|coordination mechanism|advisory committee|streamlined (?:procedures|protocols|standards)|finaliz(?:e|es|ed) (?:technical|administrative|inspection|compliance|procedural|regulatory)|publishes? (?:a )?(?:routine )?(?:review|assessment|report)|reports? on implementation)\b/i;
var ADMINISTRATIVE_MATERIAL_OUTCOME_RE = /\b(?:law (?:passes|is enacted)|tax (?:raised|cut|introduced)|ban (?:takes effect|imposed)|resign(?:s|ed|ation)|appoint(?:s|ed|ment)|government (?:falls|forms)|election|referendum|strike|protest|riot|shortage|shutdown|bank failure|default|market crash|mobiliz(?:e|es|ed|ation)|deploy(?:s|ed|ment)|sanction(?:s|ed)|embargo|treaty|agreement (?:signed|reached)|ceasefire|martial law|state of emergency|opens? (?:a )?(?:factory|plant|facility)|enters service|production begins|becomes operational|disaster|accident)\b/i;
var TRAJECTORY_BREAKPOINT_RE = /\b(coup(?: attempt)?|mutiny|uprising|rebellion|insurgency|secession|civil war|government falls?|cabinet collapses?|banking panic|bank run|sovereign default|currency crash|constitutional crisis|succession crisis|martial law|state of emergency|mobiliz(?:e|es|ed|ation)|ultimatum|blockade|border clash|armed clash|incursion|direct clash|nuclear alert)\b/i;
var TRAJECTORY_INSTABILITY_RE = /\b(reject(?:s|ed|ion)?|refus(?:e|es|ed|al)|schism|split(?:s|ting)?|breakaway|autonomy|federal tension|regional defiance|mass protest|general strike|nationwide strike|industrial dispute|leadership challenge|confidence vote|impeach(?:ment)?|sanction(?:s|ed)?|missile test|ends? (?:the )?moratorium|withdraw(?:s|al)? from|deadlock|talks? (?:fail|collapse|break down)|credit crunch|liquidity crisis|debt crisis|shortage|rationing|separatist|ethnic tension|communal violence)\b/i;
var TRAJECTORY_CAPABILITY_RE = /\b(enters? service|commission(?:s|ed)?|deploy(?:s|ed|ment)|production begins|factory opens?|plant opens?|law (?:passes|is enacted|is signed)|signs? (?:a |the )?(?:treaty|accord|agreement)|ratif(?:y|ies|ied)|election result|resign(?:s|ed|ation)|appoint(?:s|ed|ment)|reorganiz(?:e|es|ed)|restructur(?:e|es|ed)|merger|launches? (?:a )?(?:major )?(?:programme|program|facility)|operational)\b/i;
var TRAJECTORY_SETTLED_RE = /\b(avert(?:s|ed|ing)|settlement reached|agreement reached|deal reached|resolved|stabiliz(?:e|es|ed|ation)|stands? down|de[- ]?escalat(?:e|es|ed|ion)|ceasefire|armistice)\b/i;
var TRAJECTORY_REPORTING_RE = /\b(quarterly|annual|monthly)\s+(?:trade |economic |industrial |export |market )?(?:outlook|assessment|review|report)|publishes? (?:its |a )?(?:quarterly |annual |monthly )?(?:outlook|assessment|review|report)|releases? (?:its |a )?(?:quarterly |annual |monthly )?(?:outlook|assessment|review|report)\b/i;
var deriveWorldTrajectoryValue = (record = {}) => {
  const text3 = `${normalizeString3(record?.title)} ${normalizeString3(record?.description || record?.detail || record?.state)}`;
  const hardImpacts = hardImpactKeysForEvent(record).length;
  if (TRAJECTORY_BREAKPOINT_RE.test(text3)) return 5;
  if (TRAJECTORY_INSTABILITY_RE.test(text3) && !TRAJECTORY_SETTLED_RE.test(text3)) return 4;
  if (hardImpacts >= 2) return 4;
  if (hardImpacts === 1 || TRAJECTORY_CAPABILITY_RE.test(text3)) return 3;
  if (TRAJECTORY_REPORTING_RE.test(text3)) return 0;
  if (ROUTINE_ADMINISTRATIVE_CUE_RE.test(text3) && !ADMINISTRATIVE_MATERIAL_OUTCOME_RE.test(text3)) return 0;
  if (TRAJECTORY_SETTLED_RE.test(text3)) return 2;
  return 1;
};
var latentCrisisConsequenceChannels = (text3) => {
  const channels = /* @__PURE__ */ new Set(["persistent storyline"]);
  if (/\b(border|military|missile|mobiliz|security|clash|incursion|blockade|armed)\b/i.test(text3)) {
    channels.add("relations");
    channels.add("units / readiness");
    channels.add("war or territorial control if belligerency actually crosses the threshold");
  }
  if (/\b(secession|autonomy|federal|constitutional|government|coup|succession|leadership)\b/i.test(text3)) {
    channels.add("polity/government state");
    channels.add("relations");
  }
  if (/\b(bank|credit|debt|currency|financial|shortage|strike|labou?r|industry)\b/i.test(text3)) {
    channels.add("Stats / economic-social state");
  }
  return [...channels].slice(0, 5);
};
var deriveLatentCrisisDiscoveryCandidate = ({
  causalCandidates = [],
  actorResolver,
  playerSphereKeys = /* @__PURE__ */ new Set()
} = {}) => {
  const rows = [];
  for (const candidate of normalizeArray2(causalCandidates)) {
    if (normalizeArray2(candidate?.storylineIds).length) continue;
    const text3 = `${normalizeString3(candidate?.title)} ${normalizeString3(candidate?.detail)}`;
    const trajectoryValue = deriveWorldTrajectoryValue(candidate);
    if (trajectoryValue < 4 || TRAJECTORY_SETTLED_RE.test(text3)) continue;
    const actors = actorResolver.mentionedPolities(text3).map((actor) => actorResolver.canonical(actor)).filter(Boolean);
    if (!actors.length) continue;
    const widerActors = actors.filter((actor) => !playerSphereKeys.has(actor.toLowerCase()));
    if (!widerActors.length) continue;
    rows.push({
      actor: widerActors[0],
      actors: uniqueStrings(actors).slice(0, 4),
      sourceCandidateId: normalizeString3(candidate?.id),
      sourceTitle: normalizeString3(candidate?.title),
      sourceDetail: normalizeString3(candidate?.detail),
      trajectoryValue,
      score: (Number(candidate?.score) || 0) + trajectoryValue * 3,
      consequenceChannels: latentCrisisConsequenceChannels(text3)
    });
  }
  return rows.sort(
    (a, b2) => b2.score - a.score || b2.trajectoryValue - a.trajectoryValue || a.actor.localeCompare(b2.actor)
  )[0] || null;
};
var normalizeString3 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
var normalizeArray2 = (value) => Array.isArray(value) ? value : [];
var uniqueStrings = (items) => [...new Set(
  normalizeArray2(items).map(normalizeString3).filter(Boolean)
)];
var stableHash = (value) => {
  let hash2 = 2166136261;
  for (const ch of String(value ?? "")) {
    hash2 ^= ch.charCodeAt(0);
    hash2 = Math.imul(hash2, 16777619);
  }
  return hash2 >>> 0;
};
var parseIsoDate = (value) => {
  const dayNumber = gameDateDayNumber(value);
  return dayNumber === null ? null : dayNumber * 864e5;
};
var worldIntegrityAgeDays = (originDate, eventDate) => {
  const origin2 = parseIsoDate(originDate);
  const event = parseIsoDate(eventDate);
  if (origin2 == null || event == null) return 99999;
  return Math.max(0, Math.round((origin2 - event) / 864e5));
};
var latestCanonicalWorldEventDate = (events, originDate) => normalizeArray2(events).map((event) => normalizeString3(event?.date)).filter((date) => parseIsoDate(date) != null && (!originDate || compareGameDates(date, originDate) <= 0)).sort(compareGameDates).at(-1) || "";
var activeWarEntries = (world) => normalizeArray2(world?.wars).filter(
  (war) => ["active", "ceasefire"].includes(normalizeString3(war?.status).toLowerCase())
);
var polityAliasRecords = (world, gameCountry = "", humans = []) => {
  const records = [];
  const overrideAliasMap = /* @__PURE__ */ new Map();
  for (const [key, entry] of Object.entries(world?.polityOverrides || {})) {
    const canonical = normalizeString3(entry?.name || entry?.code || key);
    if (!canonical) continue;
    for (const alias of uniqueStrings([
      canonical,
      key,
      entry?.code,
      entry?.name,
      ...normalizeArray2(entry?.aliases)
    ])) {
      overrideAliasMap.set(alias.toLowerCase(), canonical);
    }
  }
  const canonicalize = (token) => {
    const raw = normalizeString3(token);
    if (!raw) return "";
    return overrideAliasMap.get(raw.toLowerCase()) || raw;
  };
  const add = (token, aliases = []) => {
    const canonical = canonicalize(token);
    if (!canonical) return;
    const expandedAliases = uniqueStrings([
      canonical,
      token,
      ...normalizeArray2(aliases)
    ]);
    const stockCodes = uniqueStrings(
      expandedAliases.map((alias) => resolveStockCountryCode(alias)).filter(Boolean)
    );
    records.push({
      canonical,
      aliases: expandedAliases,
      stockCodes
    });
  };
  add(gameCountry);
  for (const human of normalizeArray2(humans)) add(human);
  for (const [key, entry] of Object.entries(world?.polityOverrides || {})) {
    add(
      entry?.name || entry?.code || key,
      [key, entry?.code, entry?.name, ...normalizeArray2(entry?.aliases)]
    );
  }
  for (const key of Object.keys(world?.countryStats || {})) add(key);
  for (const owner of uniqueStrings(Object.values(world?.regionOwnershipOverrides || {}))) add(owner);
  for (const owner of uniqueStrings(Object.values(world?.regionSovereigntyOverrides || {}))) add(owner);
  for (const actor of uniqueStrings(
    Object.values(world?.regionClaimants || {}).flatMap((claimants) => normalizeArray2(claimants))
  )) add(actor);
  for (const war of normalizeArray2(world?.wars)) {
    for (const actor of [...normalizeArray2(war?.sideA), ...normalizeArray2(war?.sideB)]) {
      add(actor);
    }
  }
  for (const relation of normalizeArray2(world?.relations)) {
    add(relation?.polityA || relation?.a || relation?.actorA);
    add(relation?.polityB || relation?.b || relation?.actorB);
  }
  for (const agreement of normalizeArray2(world?.agreements)) {
    for (const actor of normalizeArray2(agreement?.parties)) add(actor);
  }
  for (const storyline of normalizeArray2(world?.storylines)) {
    for (const actor of normalizeArray2(storyline?.participants)) add(actor);
  }
  const byCanonical = /* @__PURE__ */ new Map();
  for (const record of records) {
    const key = record.canonical.toLowerCase();
    const prior = byCanonical.get(key);
    byCanonical.set(key, {
      canonical: prior?.canonical || record.canonical,
      aliases: uniqueStrings([
        ...prior?.aliases || [],
        ...record.aliases
      ]),
      stockCodes: uniqueStrings([
        ...prior?.stockCodes || [],
        ...normalizeArray2(record.stockCodes)
      ])
    });
  }
  return [...byCanonical.values()];
};
var createWorldActorResolver = (world, gameCountry = "", { humans = [] } = {}) => {
  const records = polityAliasRecords(world, gameCountry, humans);
  const byAlias = /* @__PURE__ */ new Map();
  const byCanonical = /* @__PURE__ */ new Map();
  const stockToCanonicals = /* @__PURE__ */ new Map();
  for (const record of records) {
    const canonical2 = normalizeString3(record?.canonical);
    if (!canonical2) continue;
    byCanonical.set(canonical2.toLowerCase(), record);
    for (const alias of uniqueStrings([canonical2, ...normalizeArray2(record?.aliases)])) {
      const key = alias.toLowerCase();
      if (!byAlias.has(key)) byAlias.set(key, canonical2);
    }
    for (const code of normalizeArray2(record?.stockCodes)) {
      const key = normalizeString3(code).toUpperCase();
      if (!key) continue;
      if (!stockToCanonicals.has(key)) stockToCanonicals.set(key, /* @__PURE__ */ new Set());
      stockToCanonicals.get(key).add(canonical2);
    }
  }
  const authoritativeTokens = uniqueStrings([
    gameCountry,
    ...normalizeArray2(humans),
    ...Object.entries(world?.polityOverrides || {}).flatMap(([keyValue, entry]) => [
      keyValue,
      entry?.code,
      entry?.name,
      ...normalizeArray2(entry?.aliases)
    ]),
    ...Object.keys(world?.countryStats || {}),
    ...Object.values(world?.regionOwnershipOverrides || {}),
    ...Object.values(world?.regionSovereigntyOverrides || {}),
    ...Object.values(world?.regionClaimants || {}).flatMap((claimants) => normalizeArray2(claimants)),
    ...normalizeArray2(world?.wars).flatMap((war) => [
      ...normalizeArray2(war?.sideA),
      ...normalizeArray2(war?.sideB)
    ]),
    ...normalizeArray2(world?.relations).flatMap((relation) => [
      relation?.polityA || relation?.a || relation?.actorA,
      relation?.polityB || relation?.b || relation?.actorB
    ]),
    ...normalizeArray2(world?.agreements).flatMap((agreement) => normalizeArray2(agreement?.parties))
  ]);
  const authoritativeByStock = /* @__PURE__ */ new Map();
  for (const token of authoritativeTokens) {
    const code = normalizeString3(resolveStockCountryCode(token)).toUpperCase();
    if (!code) continue;
    const canonical2 = byAlias.get(normalizeString3(token).toLowerCase()) || normalizeString3(token);
    if (!canonical2) continue;
    if (!authoritativeByStock.has(code)) authoritativeByStock.set(code, /* @__PURE__ */ new Set());
    authoritativeByStock.get(code).add(canonical2);
  }
  const canonical = (actor) => {
    const raw = normalizeString3(actor);
    if (!raw) return "";
    const stockCode = normalizeString3(resolveStockCountryCode(raw)).toUpperCase();
    if (stockCode) {
      const authoritative = [...authoritativeByStock.get(stockCode) || []];
      if (authoritative.length === 1) return authoritative[0];
    }
    const exact = byAlias.get(raw.toLowerCase());
    if (exact) return exact;
    if (stockCode) {
      const matches = [...stockToCanonicals.get(stockCode) || []];
      if (matches.length === 1) return matches[0];
    }
    return raw;
  };
  const knownCanonical = (actor) => {
    const resolved = canonical(actor);
    return resolved && byCanonical.has(resolved.toLowerCase()) ? resolved : "";
  };
  const equivalent = (left, right) => {
    const a = canonical(left).toLowerCase();
    const b2 = canonical(right).toLowerCase();
    return Boolean(a && b2 && a === b2);
  };
  const aliasesFor = (actor) => {
    const target = canonical(actor);
    const record = byCanonical.get(target.toLowerCase());
    return uniqueStrings([target, ...record?.aliases || []]);
  };
  const aliasPatterns = /* @__PURE__ */ new Map();
  const aliasPattern = (alias) => {
    const token = normalizeString3(alias).toLowerCase();
    if (!token || token.length < 3) return null;
    if (!aliasPatterns.has(token)) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      aliasPatterns.set(token, new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i"));
    }
    return aliasPatterns.get(token);
  };
  const aliasesMentioned = (aliases, haystack) => aliases.some((alias) => Boolean(aliasPattern(alias)?.test(haystack)));
  const mentioned = (value) => {
    const haystack = ` ${normalizeString3(value).toLowerCase()} `;
    const matches = [];
    for (const record of records) {
      if (aliasesMentioned([record.canonical, ...normalizeArray2(record.aliases)], haystack)) {
        matches.push(record.canonical);
      }
    }
    return uniqueStrings(matches);
  };
  const mentions = (actor, value) => {
    const target = normalizeString3(actor);
    if (!target) return true;
    const record = byCanonical.get(target.toLowerCase());
    return aliasesMentioned([target, ...normalizeArray2(record?.aliases)], ` ${normalizeString3(value).toLowerCase()} `);
  };
  return {
    records,
    canonical,
    knownCanonical,
    equivalent,
    aliasesFor,
    mentionedPolities: mentioned,
    mentions
  };
};
var canonicalWorldActor = (actor, world, gameCountry = "") => createWorldActorResolver(world, gameCountry).canonical(actor);
var worldActorsEquivalent = (left, right, world, gameCountry = "") => {
  const a = canonicalWorldActor(left, world, gameCountry).toLowerCase();
  const b2 = canonicalWorldActor(right, world, gameCountry).toLowerCase();
  return Boolean(a && b2 && a === b2);
};
var hardImpactKeysForEvent = (event) => {
  const impacts = event?.impacts && typeof event.impacts === "object" ? event.impacts : {};
  const keys = [];
  for (const key of [
    "regionTransfers",
    "regionClaims",
    "groupOps",
    "regionControlOps",
    "politicalActorOps",
    "unitOps",
    "markerOps",
    "createdChats"
  ]) {
    if (normalizeArray2(impacts[key]).length) keys.push(key);
  }
  const lifecycle = normalizeArray2(impacts?.polityChanges).filter(
    (change) => ["create", "rename", "restore", "dissolve"].includes(
      normalizeString3(change?.operation).toLowerCase()
    )
  );
  if (lifecycle.length) keys.push("polityLifecycle");
  return keys;
};
var actorPoolForExploration = (bundle, diplomaticActors = [], causalCandidates = []) => {
  const world = bundle?.world || {};
  const gameCountry = normalizeString3(bundle?.game?.country);
  const actorResolver = createWorldActorResolver(world, gameCountry);
  const playerCanonical = actorResolver.canonical(gameCountry);
  const weighted = [];
  const add = (actor, weight = 1, reason = "") => {
    const text3 = actorResolver.canonical(actor);
    if (!text3) return;
    if (playerCanonical && actorResolver.equivalent(text3, playerCanonical)) return;
    weighted.push({
      actor: text3,
      weight: Math.max(0, Number(weight) || 0),
      reason: normalizeString3(reason)
    });
  };
  for (const actor of normalizeArray2(diplomaticActors)) {
    add(actor, 9, "active diplomatic ledger");
  }
  for (const war of activeWarEntries(world)) {
    for (const actor of [...normalizeArray2(war?.sideA), ...normalizeArray2(war?.sideB)]) {
      add(actor, 8, `active canonical conflict ${normalizeString3(war?.id) || "war"}`);
    }
  }
  for (const storyline of normalizeArray2(world?.storylines)) {
    const status = normalizeString3(storyline?.status).toLowerCase();
    if (status === "resolved") continue;
    for (const actor of normalizeArray2(storyline?.participants)) {
      add(
        actor,
        status === "active" ? 7 : 4,
        `unresolved ${normalizeString3(storyline?.kind) || "world"} storyline`
      );
    }
  }
  for (const agreement of normalizeArray2(world?.agreements)) {
    const status = normalizeString3(agreement?.status).toLowerCase();
    if (["ended", "expired", "terminated"].includes(status)) continue;
    for (const actor of normalizeArray2(agreement?.parties)) {
      add(actor, 7, `formal ${normalizeString3(agreement?.type) || "agreement"} relationship`);
    }
  }
  for (const relation of normalizeArray2(world?.relations)) {
    add(relation?.polityA || relation?.a || relation?.actorA, 6, "bilateral relation ledger");
    add(relation?.polityB || relation?.b || relation?.actorB, 6, "bilateral relation ledger");
  }
  for (const unit of normalizeArray2(world?.units)) {
    add(unit?.ownerCode || unit?.owner, 6, "persistent military presence");
  }
  for (const owner of uniqueStrings(Object.values(world?.regionOwnershipOverrides || {}))) {
    add(owner, 6, "current de-facto territorial state");
  }
  for (const owner of uniqueStrings(Object.values(world?.regionSovereigntyOverrides || {}))) {
    add(owner, 6, "current legal territorial state");
  }
  for (const actor of uniqueStrings(
    Object.values(world?.regionClaimants || {}).flatMap((claimants) => normalizeArray2(claimants))
  )) {
    add(actor, 6, "current territorial claim/contest");
  }
  for (const [key, entry] of Object.entries(world?.polityOverrides || {})) {
    if (normalizeString3(entry?.status).toLowerCase() === "active") {
      add(entry?.name || entry?.code || key, 5, "explicitly active polity lifecycle");
    }
  }
  for (const candidate of normalizeArray2(causalCandidates)) {
    const text3 = `${normalizeString3(candidate?.title)} ${normalizeString3(candidate?.detail)}`;
    for (const actor of actorResolver.mentionedPolities(text3)) {
      add(actor, 8, `current evidence: ${normalizeString3(candidate?.title) || "active development"}`);
    }
  }
  const best = /* @__PURE__ */ new Map();
  for (const row of weighted) {
    const key = row.actor.toLowerCase();
    const prior = best.get(key);
    if (!prior) {
      best.set(key, {
        actor: row.actor,
        weight: row.weight,
        reasons: row.reason ? [row.reason] : []
      });
      continue;
    }
    prior.weight = Math.max(prior.weight, row.weight);
    if (row.reason && !prior.reasons.includes(row.reason)) {
      prior.reasons.push(row.reason);
    }
  }
  return [...best.values()];
};
var buildPlayerSphereActorKeys = ({
  bundle,
  diplomaticActors = [],
  causalCandidates = [],
  actorResolver
} = {}) => {
  const world = bundle?.world || {};
  const player = actorResolver.canonical(bundle?.game?.country);
  const playerKey = normalizeString3(player).toLowerCase();
  const keys = /* @__PURE__ */ new Set();
  const add = (actor) => {
    const canonical = actorResolver.canonical(actor);
    const key = normalizeString3(canonical).toLowerCase();
    if (key) keys.add(key);
  };
  add(player);
  for (const actor of normalizeArray2(diplomaticActors)) add(actor);
  for (const relation of normalizeArray2(world?.relations)) {
    const a = actorResolver.canonical(relation?.polityA || relation?.a || relation?.actorA);
    const b2 = actorResolver.canonical(relation?.polityB || relation?.b || relation?.actorB);
    if (normalizeString3(a).toLowerCase() === playerKey) add(b2);
    if (normalizeString3(b2).toLowerCase() === playerKey) add(a);
  }
  for (const agreement of normalizeArray2(world?.agreements)) {
    const parties = normalizeArray2(agreement?.parties).map((actor) => actorResolver.canonical(actor));
    if (parties.some((actor) => normalizeString3(actor).toLowerCase() === playerKey)) {
      for (const actor of parties) add(actor);
    }
  }
  for (const war of activeWarEntries(world)) {
    const actors = [...normalizeArray2(war?.sideA), ...normalizeArray2(war?.sideB)].map((actor) => actorResolver.canonical(actor));
    if (actors.some((actor) => normalizeString3(actor).toLowerCase() === playerKey)) {
      for (const actor of actors) add(actor);
    }
  }
  for (const storyline of normalizeArray2(world?.storylines)) {
    if (normalizeString3(storyline?.status).toLowerCase() === "resolved") continue;
    const participants = normalizeArray2(storyline?.participants).map((actor) => actorResolver.canonical(actor));
    if (participants.some((actor) => normalizeString3(actor).toLowerCase() === playerKey)) {
      for (const actor of participants) add(actor);
    }
  }
  for (const candidate of normalizeArray2(causalCandidates)) {
    const text3 = `${normalizeString3(candidate?.title)} ${normalizeString3(candidate?.detail)}`;
    const mentioned = actorResolver.mentionedPolities(text3);
    if (mentioned.some((actor) => normalizeString3(actor).toLowerCase() === playerKey)) {
      for (const actor of mentioned) add(actor);
    }
  }
  return keys;
};
var buildNativeWorldExplorationSlate = ({
  bundle,
  allStorylines = [],
  selectedStorylines = [],
  diplomaticActors = [],
  causalCandidates = [],
  crisisCandidates = causalCandidates
} = {}) => {
  const actorRows = actorPoolForExploration(
    bundle,
    diplomaticActors,
    causalCandidates
  );
  const actorResolver = createWorldActorResolver(
    bundle?.world || {},
    normalizeString3(bundle?.game?.country)
  );
  const originDate = normalizeString3(bundle?.game?.gameDate);
  const round5 = Math.max(0, Math.trunc(Number(bundle?.game?.round) || 0));
  const seed = stableHash(
    `${originDate}|${round5}|${actorRows.map((row) => row.actor).sort().join("|")}`
  );
  const selectedIds = new Set(
    normalizeArray2(selectedStorylines).map((storyline) => normalizeString3(storyline?.id)).filter(Boolean)
  );
  const selectedParticipantKeys = new Set(
    normalizeArray2(selectedStorylines).flatMap((storyline) => normalizeArray2(storyline?.participants)).map((actor) => actorResolver.canonical(actor).toLowerCase()).filter(Boolean)
  );
  const deferred = normalizeArray2(allStorylines).filter(
    (storyline) => normalizeString3(storyline?.status).toLowerCase() !== "resolved" && !selectedIds.has(normalizeString3(storyline?.id))
  );
  const playerSphereKeys = buildPlayerSphereActorKeys({
    bundle,
    diplomaticActors,
    causalCandidates,
    actorResolver
  });
  const stableRank = (salt) => (a, b2) => b2.weight - a.weight || stableHash(`${seed}|${salt}|${a.actor}`) - stableHash(`${seed}|${salt}|${b2.actor}`) || a.actor.localeCompare(b2.actor);
  const eligibleActorRows = actorRows.filter(
    (row) => !selectedParticipantKeys.has(row.actor.toLowerCase())
  );
  const spherePool = eligibleActorRows.filter((row) => playerSphereKeys.has(row.actor.toLowerCase())).sort(stableRank("player-sphere"));
  const widerPool = eligibleActorRows.filter((row) => !playerSphereKeys.has(row.actor.toLowerCase()));
  const sphereActors = spherePool.slice(0, EXPLORATION_PLAYER_SPHERE_ACTOR_SLOTS).map((row) => ({ ...row, scope: "player-sphere" }));
  const sphereUsed = new Set(sphereActors.map((row) => row.actor.toLowerCase()));
  const widerEvidenceActors = widerPool.filter((row) => row.weight > 5).sort(stableRank("wider-evidence")).slice(0, EXPLORATION_WIDER_EVIDENCE_ACTOR_SLOTS).map((row) => ({ ...row, scope: "wider-world" }));
  const widerUsed = new Set(widerEvidenceActors.map((row) => row.actor.toLowerCase()));
  const widerLatentActors = widerPool.filter(
    (row) => row.weight <= 5 && !widerUsed.has(row.actor.toLowerCase())
  ).sort(
    (a, b2) => stableHash(`${seed}|wider-latent|${a.actor}`) - stableHash(`${seed}|wider-latent|${b2.actor}`) || a.actor.localeCompare(b2.actor)
  ).slice(0, EXPLORATION_WIDER_LATENT_ACTOR_SLOTS).map((row) => ({
    ...row,
    scope: "wider-world",
    reasons: uniqueStrings([
      ...normalizeArray2(row.reasons),
      "rotating latent-world attention: active polity outside the player sphere without a stronger recent evidence slot"
    ])
  }));
  const widerActors = [...widerEvidenceActors, ...widerLatentActors];
  const usedKeys = /* @__PURE__ */ new Set([
    ...sphereUsed,
    ...widerActors.map((row) => row.actor.toLowerCase())
  ]);
  const fillTo = (rows, target, pool, scope, salt) => {
    if (rows.length >= target) return;
    const extras = [...pool].filter((row) => !usedKeys.has(row.actor.toLowerCase())).sort(stableRank(salt));
    for (const row of extras) {
      if (rows.length >= target) break;
      rows.push({ ...row, scope });
      usedKeys.add(row.actor.toLowerCase());
    }
  };
  fillTo(
    sphereActors,
    EXPLORATION_PLAYER_SPHERE_ACTOR_SLOTS,
    spherePool,
    "player-sphere",
    "player-sphere-fill"
  );
  fillTo(
    widerActors,
    EXPLORATION_WIDER_ACTOR_SLOTS,
    widerPool,
    "wider-world",
    "wider-world-fill"
  );
  const rankedActors = [...sphereActors, ...widerActors];
  const actorSlots = rankedActors.map((row, index) => {
    const actor = row.actor;
    const domain = EXPLORATION_DOMAINS[(seed + index * 3) % EXPLORATION_DOMAINS.length];
    const deferredTopics = deferred.filter(
      (storyline) => normalizeArray2(storyline?.participants).some((participant) => actorResolver.equivalent(actor, participant))
    ).slice(0, 3).map((storyline) => normalizeString3(storyline?.title)).filter(Boolean);
    const candidateEvidence = normalizeArray2(causalCandidates).filter(
      (candidate) => actorResolver.aliasesFor(actor).some((alias) => {
        const token = normalizeString3(alias).toLowerCase();
        if (!token || token.length < 3) return false;
        const haystack = normalizeString3(
          `${normalizeString3(candidate?.title)} ${normalizeString3(candidate?.detail)}`
        ).toLowerCase();
        return haystack.includes(token);
      })
    ).slice(0, 2).map((candidate) => normalizeString3(candidate?.title)).filter(Boolean);
    const basisParts = uniqueStrings([
      ...normalizeArray2(row.reasons),
      ...candidateEvidence.map((title) => `current causal evidence: ${title}`)
    ]).slice(0, 4);
    return {
      id: index + 1,
      actor,
      domain,
      deferredTopics,
      basis: basisParts.join("; "),
      relevance: row.weight,
      scope: row.scope || (playerSphereKeys.has(actor.toLowerCase()) ? "player-sphere" : "wider-world"),
      type: "actor-domain"
    };
  });
  const latentCrisis = deriveLatentCrisisDiscoveryCandidate({
    // R3.7: dedicated crisis evidence is allowed to come from the full bounded
    // recent-history scan rather than only the ordinary top-10 initiative list.
    causalCandidates: normalizeArray2(crisisCandidates).length ? crisisCandidates : causalCandidates,
    actorResolver,
    playerSphereKeys
  });
  let nextId = actorSlots.length + 1;
  const systemSlots = [];
  const playerCount = actorSlots.filter((slot) => slot.scope === "player-sphere").length;
  const playerDeficit = Math.max(0, EXPLORATION_TARGET_PER_SCOPE - playerCount);
  for (let index = 0; index < playerDeficit; index += 1) {
    systemSlots.push({
      id: nextId++,
      actor: index === 0 ? "Player-sphere regional system" : `Player-sphere independent system ${index + 1}`,
      domain: index === 0 ? "cross-border reaction, non-sovereign domestic spillover, regional security pressure, incoming diplomacy, economic shock, social response, or a NEW latent problem inside the player's current causal sphere that is not merely another routine update to a selected storyline; do not originate a fresh government/parliament/sovereign choice for the human polity" : EXPLORATION_DOMAINS[(seed + 17 + index * 5) % EXPLORATION_DOMAINS.length],
      deferredTopics: [],
      basis: "same-scope balance filler: local actors already receiving selected-storyline attention remain excluded from independent actor slots; inspect independent regional/system consequences rather than borrowing a wider-world actor or servicing the selected storyline again. PLAYER-SPHERE is not player authority: if the human government must choose, stop at the pressure/proposal unless exact prior player authority exists",
      relevance: 0,
      scope: "player-sphere",
      type: "regional-system"
    });
  }
  const crisisActor = latentCrisis?.actor || "Wider-world latent instability";
  const crisisBasis = latentCrisis ? `PROTECTED CURRENT TRIGGER: ${latentCrisis.sourceTitle}. ${latentCrisis.sourceDetail || ""} Native trajectory value ${latentCrisis.trajectoryValue}/5. Plausible consequence channels if the process genuinely crosses threshold: ${latentCrisis.consequenceChannels.join(", ")}. Do not force escalation; decide whether this evidence has actually become a new persistent unstable process.` : "No trajectory-4/5 wider-world trigger was found in the bounded present-tense ledger. Search latent instability conservatively; a crisis is not required and war is not the default.";
  systemSlots.push({
    id: nextId++,
    actor: crisisActor,
    domain: "CRISIS DISCOVERY: test whether current political legitimacy, elite fracture, constitutional/succession dispute, separatism/federal tension, mass unrest, military-security friction, financial panic, resource shock, sanctions pressure, alliance fracture, or similar instability has crossed from background tension into a genuinely NEW persistent multi-turn crisis",
    deferredTopics: [],
    basis: crisisBasis,
    relevance: latentCrisis?.score || 0,
    scope: "wider-world",
    type: "crisis-discovery",
    targetActor: latentCrisis?.actor || "",
    targetActors: latentCrisis?.actors || [],
    sourceCandidateId: latentCrisis?.sourceCandidateId || "",
    trajectoryValue: latentCrisis?.trajectoryValue || 0,
    consequenceChannels: latentCrisis?.consequenceChannels || []
  });
  systemSlots.push({
    id: nextId++,
    actor: "Cross-border / wider world system",
    domain: "new diplomacy, mediation, alignment, trade, alliance, third-party reaction, technology, industry, social movement, institutional change, disaster, or regional pressure not already represented by a deferred storyline",
    deferredTopics: [],
    basis: "scan the wider current map/canon and surviving structural conditions for an independent consequential development; do not resurrect dormant or future polities from memorized history",
    relevance: 0,
    scope: "wider-world",
    type: "global"
  });
  const widerCount = actorSlots.filter((slot) => slot.scope === "wider-world").length + systemSlots.filter((slot) => slot.scope === "wider-world").length;
  const widerDeficit = Math.max(0, EXPLORATION_TARGET_PER_SCOPE - widerCount);
  for (let index = 0; index < widerDeficit; index += 1) {
    systemSlots.push({
      id: nextId++,
      actor: `Wider-world independent system ${index + 1}`,
      domain: EXPLORATION_DOMAINS[(seed + 31 + index * 7) % EXPLORATION_DOMAINS.length],
      deferredTopics: [],
      basis: "same-scope balance filler: current evidence did not provide another independent named wider-world actor, so inspect structural/latent causes without borrowing a player-sphere actor",
      relevance: 0,
      scope: "wider-world",
      type: "global"
    });
  }
  return [...actorSlots, ...systemSlots].slice(0, 10);
};
var FRESH_SOVEREIGN_POLICY_RE = new RegExp([
  "\\bdeclare(?:s|d)?\\s+war\\b",
  "\\b(?:general\\s+|national\\s+|full\\s+)?mobiliz(?:e|es|ed|ation)\\b",
  "\\b(?:signs?|ratif(?:y|ies|ied)|accedes?|withdraws?)\\b[\\s\\S]{0,80}\\b(?:treaty|alliance|pact|agreement|convention)\\b",
  "\\b(?:imposes?|adopts?|expands?|lifts?)\\s+(?:new\\s+)?(?:economic\\s+|targeted\\s+)?sanctions?\\b",
  "\\bexpels?\\b[\\s\\S]{0,60}\\bdiplomat\\b",
  "\\brecalls?\\b[\\s\\S]{0,60}\\bambassador\\b",
  "\\b(?:recognizes?|derecognizes?)\\b[\\s\\S]{0,80}\\b(?:state|government|independence|sovereignty)\\b",
  "\\b(?:annex(?:es|ed|ation)?|cedes?|transfers?)\\b[\\s\\S]{0,80}\\b(?:territor|province|region|sovereignty|border)\\b",
  "\\b(?:joins?|leaves?|withdraws?\\s+from)\\b[\\s\\S]{0,80}\\b(?:alliance|treaty\\s+organization|union|bloc)\\b",
  "\\b(?:passes?|enacts?|adopts?|approves?)\\s+(?:an?\\s+|the\\s+)?(?:law|bill|national\\s+budget|supplementary\\s+budget|constitutional\\s+amendment)\\b",
  "\\b(?:national|countrywide|armed\\s+forces)\\s+(?:alert|readiness|posture|state\\s+of\\s+emergency)\\b",
  "\\b(?:deploys?|orders?)\\b[\\s\\S]{0,80}\\b(?:troops|brigade|division|battalion|warships?|fighter\\s+aircraft|missile\\s+units?)\\b"
].join("|"), "i");
var HUMAN_SOVEREIGN_REFUSALS = Object.freeze([
  "model-agency-claims-player-sovereignty",
  "joint-player-sovereign-choice-without-authority",
  "player-fresh-sovereign-choice-without-authority",
  "institution-event-also-implicates-player-fresh-sovereign-choice"
]);
var HUMAN_SOVEREIGN_REFUSAL_SET = new Set(HUMAN_SOVEREIGN_REFUSALS);
var installDebugApi = () => {
  if (typeof globalThis === "undefined") return;
  globalThis.__OH_NATIVE_WORLD_INTEGRITY__ = {
    version: WORLD_INTEGRITY_VERSION
  };
};
installDebugApi();

// src/Game/AI/nativeWorldDirector.js
init_gameDates();
init_projects();
var DIPLOMATIC_STATE_HEADING = "Diplomatic state (the relevant slice of the ledger):";
var WORLD_DIRECTOR_VERSION = "0.13.1-crisis-seam-repair";
var DEFAULT_MAX_CANDIDATES = 10;
var RECENT_EVENT_WINDOW = 56;
var RECENT_EVENT_CANDIDATE_MAX_AGE_DAYS = 180;
var RECENT_CHAT_WINDOW = 16;
var CONSOLIDATED_HISTORY_WINDOW = 6;
var TERRITORIAL_SAMPLE_LIMIT = 8;
var ACTIVE_UNIT_SAMPLE_LIMIT = 6;
var MAX_ATTENTION_STORYLINES = 8;
var MAX_PERSISTED_STORYLINES = 96;
var MAX_DEFERRED_STORYLINE_HINTS = 16;
var MAX_ECONOMIC_ACTORS = 8;
var CANDIDATE_STORYLINE_REPEAT_PENALTY = 4;
var CANDIDATE_TYPE_REPEAT_PENALTY = 0.75;
var CANDIDATE_TRAJECTORY_WEIGHT = 1.6;
var RECENT_VISIBLE_EVENT_PENALTY_DAYS = Object.freeze([
  [21, 6],
  [45, 3],
  [75, 1]
]);
var CONSEQUENCE_LOOKBACK_DAYS = 90;
var CONSEQUENCE_MIN_VISIBLE_EVENTS = 8;
var STRATEGIC_CONSEQUENCE_RE = /\b(annex(?:es|ed|ation)?|incorporat(?:e|es|ed|ion)|cede[sd]?|cession|independence|proclaim(?:s|ed)?\s+(?:the\s+)?(?:republic|kingdom|state|government)|abdica(?:te|tes|ted|tion)|resign(?:s|ed|ation)|assassinat(?:e|es|ed|ion)|coup|revolution|uprising|rebellion|mutiny|surrender(?:s|ed)?|armistice|ceasefire|peace treaty|declares? war|declaration of war|joins? (?:the )?war|withdraw(?:s|al)? from (?:the )?war|capture(?:s|d)?|seiz(?:e|es|ed)|occup(?:y|ies|ied)|liberat(?:e|es|ed)|breakthrough|government falls?|cabinet resign(?:s|ed)?|election results?|elected president|elected prime minister|ratif(?:y|ies|ied|ication)|signs? (?:a |the )?(?:treaty|pact|accord|agreement)|treaty (?:is )?(?:signed|concluded|ratified)|strike (?:begins|erupts|ends)|calls? off .*strike|bank(?:ing)? panic|financial crash|defaults? on|bankruptcy|martial law|state of emergency|mobiliz(?:e|es|ed|ation)|reserve(?:s)? (?:called|mobilized|activated)|calls? up (?:the )?reserves|force concentration|troop buildup|ultimatum|blockade|nuclear alert|combat alert|evacuat(?:e|es|ed|ion)|border closure|airspace closure|martial law)\b/i;
var HARD_MILITARY_CONSEQUENCE_RE = /\b(capture(?:s|d)?|seiz(?:e|es|ed)|occup(?:y|ies|ied)|liberat(?:e|es|ed)|retreat(?:s|ed)?|withdraw(?:s|n|al)?|surrender(?:s|ed)?|ceasefire|armistice|breakthrough|encircl(?:e|es|ed)|destroy(?:s|ed)?|defeat(?:s|ed)?|repuls(?:e|es|ed)|casualt(?:y|ies)|killed|wounded|front collapses?)\b/i;
var ESCALATION_LADDER = Object.freeze([
  {
    maxPressure: 34,
    id: "background-pressure",
    label: "background pressure",
    guidance: "signaling, political hardening, diplomatic warnings, intelligence activity, limited sanctions, contingency planning"
  },
  {
    maxPressure: 54,
    id: "coercive-friction",
    label: "coercive friction",
    guidance: "sanctions escalation, exercises, military signaling, covert pressure, alliance consultations, domestic emergency preparation"
  },
  {
    maxPressure: 69,
    id: "confrontation",
    label: "confrontation",
    guidance: "reserve alerts/call-ups, force dispersal, forward deployments, border or airspace restrictions, explicit ultimatums, logistics preparation, evacuation planning"
  },
  {
    maxPressure: 84,
    id: "pre-conflict-brinkmanship",
    label: "pre-conflict brinkmanship",
    guidance: "mobilization, major force concentration, combat alerts, emergency powers, blockade preparation, reciprocal deployments, dangerous interceptions/incidents, alliance activation"
  },
  {
    maxPressure: 100,
    id: "breakpoint",
    label: "breakpoint",
    guidance: "limited strikes, incursions, blockades, direct clashes, attempted faits accomplis, or canonical war when the native belligerency threshold is actually crossed; rapid de-escalation remains possible"
  }
]);
var HOSTILE_RELATION_STATUS_RE = /\b(hostile|enemy|adversarial|rival|severe|confrontational|very tense|crisis)\b/i;
var DEFENSE_COUPLING_RE = /\b(alliance|defen[cs]e|mutual assistance|guarantee|security pact|collective security)\b/i;
var SYSTEMIC_ESCALATION_CUE_RE = /\b(mobiliz(?:e|es|ed|ation)|reserve call[- ]?up|ultimatum|blockade|invasion|incursion|border clash|armed clash|direct clash|combat alert|nuclear alert|force concentration|troop buildup|forward deploy(?:ment|ed)|airspace closure|border closure|missile test|nuclear test|failed talks|talks? collapse|ceasefire collapse|coup attempt|mutiny|uprising|secession)\b/i;
var CRISIS_LIKE_STORYLINE_KIND_RE = /\b(war|crisis|revolution|uprising|insurgency|secession|standoff|security|constitutional|succession|financial|banking)\b/i;
var deriveWorldConflictRiskPosture = ({
  bundle,
  targetDate = "",
  causalCandidates = []
} = {}) => {
  const world = bundle?.world || {};
  const date = normalizeString4(targetDate || bundle?.game?.gameDate);
  const year = gameDateYear(date);
  let eraAdjustment = 0;
  let eraLabel = "unknown-era neutral prior";
  if (Number.isInteger(year)) {
    if (year >= 1870 && year <= 1945) {
      eraAdjustment = 18;
      eraLabel = "mass-mobilization / imperial great-power era: substantially higher baseline interstate-war friction";
    } else if (year >= 1946 && year <= 1991) {
      eraAdjustment = -3;
      eraLabel = "nuclear-deterrence / bloc-competition era: direct great-power war constrained, proxy and peripheral conflict remain plausible";
    } else if (year >= 1992) {
      eraAdjustment = -8;
      eraLabel = "post-Cold-War institutional era: lower baseline interstate-war prior, not immunity from war";
    } else if (year >= 1815) {
      eraAdjustment = 8;
      eraLabel = "pre-mass-war balance-of-power era: moderately elevated interstate-war prior";
    } else {
      eraAdjustment = 10;
      eraLabel = "pre-modern/early-modern interstate system: war is a relatively normal policy instrument when capabilities and causes support it";
    }
  }
  const activeWars = normalizeArray3(world?.wars).filter(
    (war) => ["active", "ceasefire"].includes(normalizeString4(war?.status).toLowerCase())
  );
  let crisisPressure = 0;
  let highMomentumProcesses = 0;
  for (const storyline of normalizeArray3(world?.storylines)) {
    if (normalizeString4(storyline?.status).toLowerCase() !== "active") continue;
    if (!CRISIS_LIKE_STORYLINE_KIND_RE.test(normalizeString4(storyline?.kind))) continue;
    const pressure = clampPercent3(storyline?.pressure);
    const momentum = clampPercent3(storyline?.momentum);
    crisisPressure += Math.max(0, pressure - 40) * 0.22;
    if (momentum >= 60) highMomentumProcesses += 1;
  }
  const hostileRelations = normalizeArray3(world?.relations).filter(
    (relation) => HOSTILE_RELATION_STATUS_RE.test(normalizeString4(
      relation?.status || relation?.state || relation?.summary
    ))
  ).length;
  const defenseCoupling = normalizeArray3(world?.agreements).filter((agreement) => {
    const status = normalizeString4(agreement?.status).toLowerCase();
    if (["ended", "expired", "terminated", "suspended"].includes(status)) return false;
    return DEFENSE_COUPLING_RE.test(normalizeString4(
      `${agreement?.type || ""} ${agreement?.title || ""} ${agreement?.terms || ""}`
    ));
  }).length;
  const contestedRegions = Object.values(world?.regionClaimants || {}).filter((claimants) => normalizeArray3(claimants).length > 0).length;
  const escalationSignals = normalizeArray3(causalCandidates).filter(
    (candidate) => SYSTEMIC_ESCALATION_CUE_RE.test(
      `${normalizeString4(candidate?.title)} ${normalizeString4(candidate?.detail)}`
    )
  ).length;
  const structural = Math.min(18, activeWars.length * 8) + Math.min(24, crisisPressure) + Math.min(8, highMomentumProcesses * 3) + Math.min(12, hostileRelations * 3) + Math.min(8, defenseCoupling * 1.5) + Math.min(10, contestedRegions * 1.25) + Math.min(15, escalationSignals * 3);
  const score = Math.max(0, Math.min(100, Math.round(18 + structural + eraAdjustment)));
  const posture = score >= 70 ? {
    id: "acute",
    label: "acute systemic conflict risk",
    guidance: "direct clashes and new wars are plausible if actors cross a concrete threshold; do not skip the mobilization/diplomatic/operational causes that make that threshold real"
  } : score >= 50 ? {
    id: "elevated",
    label: "elevated conflict risk",
    guidance: "coercion, mobilization, alliance activation, dangerous incidents and limited clashes deserve serious consideration; war is possible but still requires a causal crossing"
  } : score >= 30 ? {
    id: "guarded",
    label: "guarded conflict risk",
    guidance: "new crises and coercive escalation are plausible, but direct interstate war should normally require accumulating pressure, a severe trigger, miscalculation or deliberate high-risk choice"
  } : {
    id: "low",
    label: "low systemic conflict risk",
    guidance: "new interstate war should be exceptional without a threshold shock; political, economic, constitutional, separatist, diplomatic and security crises can still form and develop with real consequences"
  };
  return {
    ...posture,
    score,
    year,
    eraAdjustment,
    eraLabel,
    drivers: {
      activeWars: activeWars.length,
      hostileRelations,
      defenseCoupling,
      contestedRegions,
      escalationSignals,
      highMomentumProcesses,
      crisisPressure: Math.round(crisisPressure * 10) / 10
    }
  };
};
var eventConsequenceScore = (event) => {
  if (!event || typeof event !== "object") return 0;
  const impacts = event?.impacts && typeof event.impacts === "object" ? event.impacts : {};
  const text3 = `${normalizeString4(event?.title)} ${normalizeString4(event?.description)}`;
  let score = 0;
  if (normalizeArray3(impacts.regionTransfers).length) score += 5;
  if (normalizeArray3(impacts.regionClaims).length) score += 4;
  if (normalizeArray3(impacts.regionControlOps).length) score += 4;
  if (normalizeArray3(impacts.polityChanges).length) score += 4;
  if (normalizeArray3(impacts.politicalActorOps).length) score += 4;
  const unitOps = normalizeArray3(impacts.unitOps);
  if (unitOps.some((op) => ["remove"].includes(normalizeString4(op?.op).toLowerCase()))) score += 3;
  if (normalizeString4(event?.warId) && HARD_MILITARY_CONSEQUENCE_RE.test(text3)) score += 3;
  if (STRATEGIC_CONSEQUENCE_RE.test(text3)) score += 3;
  if (normalizeString4(event?.importance).toLowerCase() === "major") score += 1;
  if (normalizeArray3(impacts.markerOps).length && normalizeString4(event?.importance).toLowerCase() === "major") score += 1;
  return score;
};
var assessRecentWorldConsequenceLiveness = ({
  events = [],
  additionalEvents = [],
  referenceDate = "",
  lookbackDays = CONSEQUENCE_LOOKBACK_DAYS
} = {}) => {
  const reference = parseIsoDate2(referenceDate);
  if (reference == null) {
    return { level: "unknown", eventCount: 0, consequentialCount: 0, lookbackDays, examples: [] };
  }
  const seen = /* @__PURE__ */ new Set();
  const recent = [];
  for (const event of [...normalizeArray3(events), ...normalizeArray3(additionalEvents)]) {
    const date = parseIsoDate2(event?.date);
    if (date == null || date > reference) continue;
    const age = Math.max(0, Math.round((reference - date) / 864e5));
    if (age > lookbackDays) continue;
    const key = normalizeString4(event?.id) || `${normalizeString4(event?.date)}|${normalizeString4(event?.title).toLowerCase()}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    recent.push(event);
  }
  const consequential = recent.map((event) => ({ event, score: eventConsequenceScore(event) })).filter((row) => row.score >= 3);
  const eventCount = recent.length;
  const consequentialCount = consequential.length;
  const lowCeiling = Math.max(1, Math.floor(eventCount * 0.18));
  const level = eventCount >= CONSEQUENCE_MIN_VISIBLE_EVENTS && consequentialCount <= lowCeiling ? "low" : "normal";
  return {
    level,
    eventCount,
    consequentialCount,
    lookbackDays,
    examples: consequential.slice(-4).map(({ event }) => `${normalizeString4(event?.date)} \u2014 ${normalizeString4(event?.title)}`).filter(Boolean)
  };
};
var HIGH_PRESSURE_STAGNATION_THRESHOLD = 55;
var STAGNATION_REAPPRAISAL_DAYS = 21;
var STAGNATION_BACKSTOP_DAYS = 45;
var lastAnalysis = null;
var normalizeString4 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
var normalizeArray3 = (value) => Array.isArray(value) ? value : [];
var truncate = (value, max2 = 260) => {
  const text3 = normalizeString4(value);
  if (!text3 || text3.length <= max2) return text3;
  return `${text3.slice(0, Math.max(1, max2 - 1)).trimEnd()}\u2026`;
};
var parseIsoDate2 = (value) => {
  const dayNumber = gameDateDayNumber(value);
  return dayNumber === null ? null : dayNumber * 864e5;
};
var compareIso = (a, b2) => {
  const left = parseIsoDate2(a);
  const right = parseIsoDate2(b2);
  if (left == null || right == null) return 0;
  return left === right ? 0 : left < right ? -1 : 1;
};
var clampPercent3 = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};
var ageDays = (originDate, eventDate) => {
  const origin2 = parseIsoDate2(originDate);
  const event = parseIsoDate2(eventDate);
  if (origin2 == null || event == null) return 99999;
  return Math.max(0, Math.round((origin2 - event) / 864e5));
};
var latestMessageDate = (chat) => {
  const messages = normalizeArray3(chat?.messages);
  for (let i2 = messages.length - 1; i2 >= 0; i2 -= 1) {
    const date = normalizeString4(messages[i2]?.time || messages[i2]?.date);
    if (date) return date;
  }
  return "";
};
var latestMemorySummary = (chat) => {
  const messages = normalizeArray3(chat?.messages);
  for (let i2 = messages.length - 1; i2 >= 0; i2 -= 1) {
    const summary = normalizeString4(messages[i2]?.memorySummary);
    if (summary) return summary;
  }
  return "";
};
var importanceScore = (importance) => {
  switch (normalizeString4(importance).toLowerCase()) {
    case "critical":
      return 8;
    case "major":
      return 5;
    case "moderate":
      return 3;
    case "minor":
      return 1;
    default:
      return 0;
  }
};
var recencyScore = (days) => {
  if (days <= 14) return 7;
  if (days <= 30) return 6;
  if (days <= 60) return 5;
  if (days <= 120) return 4;
  if (days <= 240) return 3;
  if (days <= 365) return 2;
  return 0;
};
var countImpactSignals = (event) => {
  const impacts = event?.impacts && typeof event.impacts === "object" ? event.impacts : {};
  let signals = 0;
  for (const key of [
    "regionTransfers",
    "regionClaims",
    "groupOps",
    "regionControlOps",
    "polityChanges",
    "politicalActorOps",
    "unitOps",
    "markerOps",
    "createdChats"
  ]) {
    if (normalizeArray3(impacts[key]).length) signals += 1;
  }
  return signals;
};
var eventCandidate = (event, originDate, index) => {
  const title = normalizeString4(event?.title);
  if (!title) return null;
  const days = ageDays(originDate, event?.date);
  const impactSignals = countImpactSignals(event);
  const kind = normalizeString4(event?.kind).toLowerCase();
  let score = importanceScore(event?.importance) + recencyScore(days) + Math.min(6, impactSignals * 2);
  if (event?.notable) score += 2;
  if (kind === "military" || kind === "diplomacy") score += 1;
  return {
    id: `event:${normalizeString4(event?.id) || index}`,
    sourceEventId: normalizeString4(event?.id),
    type: "recent-event",
    score,
    date: normalizeString4(event?.date),
    title,
    detail: truncate(event?.description || event?.summary, 280),
    ageDays: days,
    storylineIds: [...new Set(
      normalizeArray3(event?.storylineIds).map(normalizeString4).filter(Boolean)
    )].slice(0, 6),
    trajectoryValue: deriveWorldTrajectoryValue(event)
  };
};
var chatCandidate = (chat, originDate, index) => {
  if (!chat || normalizeString4(chat.status).toLowerCase() === "closed") return null;
  const memory = latestMemorySummary(chat);
  if (!memory) return null;
  const participants = normalizeArray3(chat.countries).map((country) => normalizeString4(country?.name || country?.code)).filter(Boolean);
  const date = latestMessageDate(chat);
  const days = ageDays(originDate, date);
  const score = 7 + recencyScore(days);
  return {
    id: `chat:${normalizeString4(chat.id) || index}`,
    type: "diplomatic-thread",
    score,
    date,
    title: participants.length ? `Active diplomacy: ${participants.join(", ")}` : "Active diplomatic thread",
    detail: truncate(memory, 320),
    ageDays: days,
    trajectoryValue: deriveWorldTrajectoryValue({
      title: participants.length ? `Active diplomacy: ${participants.join(", ")}` : "Active diplomatic thread",
      detail: memory
    })
  };
};
var actorSuppressedByDeferredSet = (actor, suppressedActors, world, gameCountry = "") => [...suppressedActors].some(
  (deferredActor) => worldActorsEquivalent(actor, deferredActor, world, gameCountry)
);
var pushTerritorialCandidates = (candidates, world, suppressedActors = /* @__PURE__ */ new Set(), gameCountry = "") => {
  const claimants = world?.regionClaimants && typeof world.regionClaimants === "object" ? world.regionClaimants : {};
  const controllers = world?.regionOwnershipOverrides && typeof world.regionOwnershipOverrides === "object" ? world.regionOwnershipOverrides : {};
  const sovereigns = world?.regionSovereigntyOverrides && typeof world.regionSovereigntyOverrides === "object" ? world.regionSovereigntyOverrides : {};
  let added = 0;
  for (const regionId in claimants) {
    if (added >= TERRITORIAL_SAMPLE_LIMIT) break;
    const contenderList = normalizeArray3(claimants[regionId]).map(normalizeString4).filter(Boolean);
    const controller = normalizeString4(controllers[regionId]);
    const sovereign = normalizeString4(sovereigns[regionId]);
    if (!contenderList.length && (!controller || !sovereign || controller === sovereign)) {
      continue;
    }
    const territorialActors = [controller, sovereign, ...contenderList].map((actor) => normalizeString4(actor).toLowerCase()).filter(Boolean);
    if (territorialActors.length && territorialActors.every(
      (actor) => actorSuppressedByDeferredSet(actor, suppressedActors, world, gameCountry)
    )) {
      continue;
    }
    candidates.push({
      id: `territory:${regionId}`,
      type: "territorial-pressure",
      score: 10,
      date: "",
      title: `Active territorial pressure: ${regionId}`,
      detail: [
        controller ? `controller ${controller}` : "",
        sovereign ? `legal sovereign ${sovereign}` : "",
        contenderList.length ? `claimants/contenders ${contenderList.join(", ")}` : ""
      ].filter(Boolean).join("; "),
      ageDays: 0,
      trajectoryValue: 4
    });
    added += 1;
  }
};
var pushActiveUnitCandidates = (candidates, world, suppressedActors = /* @__PURE__ */ new Set(), gameCountry = "") => {
  let added = 0;
  for (const unit of normalizeArray3(world?.units)) {
    if (added >= ACTIVE_UNIT_SAMPLE_LIMIT) break;
    const status = normalizeString4(unit?.status).toLowerCase();
    if (!status || status === "idle") continue;
    const owner = normalizeString4(unit?.ownerCode || unit?.owner);
    if (owner && actorSuppressedByDeferredSet(owner, suppressedActors, world, gameCountry)) continue;
    const name = normalizeString4(unit?.name) || "Unit";
    const region = normalizeString4(unit?.regionId);
    candidates.push({
      id: `unit:${normalizeString4(unit?.id) || added}`,
      type: "active-military-state",
      score: 7,
      date: "",
      title: `Active military state: ${owner ? `${owner} \u2014 ` : ""}${name}`,
      detail: [status ? `status ${status}` : "", region ? `region ${region}` : ""].filter(Boolean).join("; "),
      ageDays: 0
    });
    added += 1;
  }
};
var normalizeStorylineForDirector = (entry, index = 0) => {
  if (!entry || typeof entry !== "object") return null;
  const title = normalizeString4(entry.title);
  if (!title) return null;
  const statusRaw = normalizeString4(entry.status).toLowerCase();
  const status = ["active", "dormant", "resolved"].includes(statusRaw) ? statusRaw : "active";
  return {
    id: normalizeString4(entry.id) || `storyline-${index}`,
    kind: normalizeString4(entry.kind) || "world",
    title,
    participants: [...new Set(normalizeArray3(entry.participants).map(normalizeString4).filter(Boolean))].slice(0, 12),
    status,
    pressure: clampPercent3(entry.pressure),
    momentum: clampPercent3(entry.momentum),
    startedDate: normalizeString4(entry.startedDate),
    accountedThroughDate: normalizeString4(entry.accountedThroughDate || entry.lastUpdatedDate || entry.startedDate),
    lastUpdatedDate: normalizeString4(entry.lastUpdatedDate || entry.accountedThroughDate || entry.startedDate),
    lastVisibleEventDate: normalizeString4(entry.lastVisibleEventDate),
    nextReviewDate: status === "resolved" ? "" : normalizeString4(entry.nextReviewDate),
    state: truncate(entry.state || entry.summary || entry.description, 520),
    ...entry.canonicalIdentity === true ? { canonicalIdentity: true } : {},
    sourceEventIds: [...new Set(normalizeArray3(entry.sourceEventIds).map(normalizeString4).filter(Boolean))].slice(0, 16),
    createdRound: Math.max(0, Math.trunc(Number(entry.createdRound) || 0)),
    updatedRound: Math.max(0, Math.trunc(Number(entry.updatedRound) || 0))
  };
};
var storylineParticipantsKey = (participants) => [...new Set(
  normalizeArray3(participants).map((actor) => normalizeString4(actor).toLowerCase()).filter(Boolean)
)].sort().join("|");
var isNativePregameStorylineId = (value) => /^storyline-(?:war-)?r0v\d+-/i.test(normalizeString4(value));
var storylineSemanticIdentityKey = (storyline) => {
  const id = normalizeString4(storyline?.id);
  if (storyline?.canonicalIdentity === true || isNativePregameStorylineId(id)) return `id:${id}`;
  const kind = normalizeString4(storyline?.kind).toLowerCase() || "world";
  const title = normalizeString4(storyline?.title).toLowerCase();
  const participants = storylineParticipantsKey(storyline?.participants);
  if (!title) return "";
  return `${kind}|${title}|${participants}`;
};
var storylineFreshnessValue = (storyline) => {
  const date = parseIsoDate2(storyline?.lastUpdatedDate) ?? parseIsoDate2(storyline?.accountedThroughDate) ?? parseIsoDate2(storyline?.startedDate);
  if (date != null) return date;
  return Math.max(0, Number(storyline?.updatedRound) || 0);
};
var canonicalWarStorylineIdForGroup = (world, group) => {
  if (!group.length || normalizeString4(group[0]?.kind).toLowerCase() !== "war") return "";
  const participantsKey = storylineParticipantsKey(group[0]?.participants);
  if (!participantsKey) return "";
  const matchingWars = normalizeArray3(world?.wars).filter((war) => {
    const warParticipants = [
      ...normalizeArray3(war?.sideA),
      ...normalizeArray3(war?.sideB)
    ];
    return storylineParticipantsKey(warParticipants) === participantsKey;
  });
  if (matchingWars.length !== 1) return "";
  const warId = normalizeString4(matchingWars[0]?.id);
  if (!warId) return "";
  const preferred = `storyline-${warId}`;
  return group.some((entry) => normalizeString4(entry?.id) === preferred) ? preferred : "";
};
var activeCanonicalWarForStoryline = (storyline, worldLike) => {
  if (!storyline || normalizeString4(storyline?.status).toLowerCase() !== "active") return null;
  const world = worldLike && typeof worldLike === "object" ? worldLike : {};
  const storylineId = normalizeString4(storyline?.id);
  const kind = normalizeString4(storyline?.kind).toLowerCase();
  const participantsKey = storylineParticipantsKey(storyline?.participants);
  for (const war of normalizeArray3(world?.wars)) {
    if (normalizeString4(war?.status).toLowerCase() !== "active") continue;
    const warId = normalizeString4(war?.id);
    if (warId && storylineId === `storyline-${warId}`) return war;
    if (kind !== "war" || !participantsKey) continue;
    const warParticipants = [
      ...normalizeArray3(war?.sideA),
      ...normalizeArray3(war?.sideB)
    ];
    if (storylineParticipantsKey(warParticipants) === participantsKey) return war;
  }
  return null;
};
var coalesceWorldStorylines = (worldLike) => {
  const world = worldLike && typeof worldLike === "object" ? worldLike : {};
  const normalized = normalizeArray3(world?.storylines).map(normalizeStorylineForDirector).filter(Boolean);
  const groups = /* @__PURE__ */ new Map();
  for (const storyline of normalized) {
    const semanticKey = storylineSemanticIdentityKey(storyline) || `id:${storyline.id}`;
    if (!groups.has(semanticKey)) groups.set(semanticKey, []);
    groups.get(semanticKey).push(storyline);
  }
  const aliasToCanonical = /* @__PURE__ */ new Map();
  const storylines = [];
  const duplicateGroups = [];
  for (const group of groups.values()) {
    const ordered = [...group].sort(
      (a, b2) => storylineFreshnessValue(b2) - storylineFreshnessValue(a) || (Number(b2?.updatedRound) || 0) - (Number(a?.updatedRound) || 0) || normalizeArray3(b2?.sourceEventIds).length - normalizeArray3(a?.sourceEventIds).length || normalizeString4(a?.id).localeCompare(normalizeString4(b2?.id))
    );
    const freshest = ordered[0];
    const canonicalId = canonicalWarStorylineIdForGroup(world, group) || normalizeString4(freshest?.id);
    for (const entry of group) {
      aliasToCanonical.set(normalizeString4(entry?.id), canonicalId);
    }
    if (group.length === 1) {
      storylines.push({
        ...freshest,
        id: canonicalId
      });
      continue;
    }
    const startedDates = group.map((entry) => normalizeString4(entry?.startedDate)).filter((date) => parseIsoDate2(date) != null).sort(compareIso);
    const lastVisibleDates = group.map((entry) => normalizeString4(entry?.lastVisibleEventDate)).filter((date) => parseIsoDate2(date) != null).sort(compareIso);
    const sourceEventIds = [...new Set(
      group.flatMap((entry) => normalizeArray3(entry?.sourceEventIds)).map(normalizeString4).filter(Boolean)
    )].slice(-16);
    const createdRounds = group.map((entry) => Math.max(0, Math.trunc(Number(entry?.createdRound) || 0))).filter((value) => value > 0);
    const merged = normalizeStorylineForDirector({
      ...freshest,
      id: canonicalId,
      participants: [...new Set(
        group.flatMap((entry) => normalizeArray3(entry?.participants)).map(normalizeString4).filter(Boolean)
      )],
      startedDate: startedDates[0] || freshest?.startedDate,
      lastVisibleEventDate: lastVisibleDates.at(-1) || "",
      sourceEventIds,
      createdRound: createdRounds.length ? Math.min(...createdRounds) : Math.max(0, Math.trunc(Number(freshest?.createdRound) || 0)),
      updatedRound: Math.max(
        ...group.map((entry) => Math.max(0, Math.trunc(Number(entry?.updatedRound) || 0)))
      )
    });
    if (merged) storylines.push(merged);
    duplicateGroups.push({
      canonicalId,
      ids: group.map((entry) => normalizeString4(entry?.id)).filter(Boolean),
      title: normalizeString4(freshest?.title)
    });
  }
  return {
    storylines,
    aliasToCanonical,
    duplicateGroups,
    mergedDuplicateCount: normalized.length - storylines.length
  };
};
var recentEventEligibleForInitiative = (event, originDate) => {
  if (!event || typeof event !== "object") return false;
  const originParsed = parseIsoDate2(originDate);
  const eventParsed = parseIsoDate2(event?.date);
  if (originParsed != null && eventParsed != null) {
    if (ageDays(originDate, event?.date) > RECENT_EVENT_CANDIDATE_MAX_AGE_DAYS) {
      return false;
    }
  }
  if (countImpactSignals(event) > 0) return true;
  if (event?.notable === true) return true;
  if (event?.playerRelated === true) return true;
  if (normalizeArray3(event?.storylineIds).length > 0) return true;
  const importance = normalizeString4(event?.importance).toLowerCase();
  if (["critical", "major"].includes(importance)) return true;
  const age = eventParsed != null && originParsed != null ? ageDays(originDate, event?.date) : 99999;
  if (importance === "moderate" && age <= 60) return true;
  if (normalizeString4(event?.kind).toLowerCase() === "diplomacy" && age <= 45) {
    return true;
  }
  return false;
};
var storylineStagnationAgeDays = (storyline, referenceDate) => {
  if (!storyline || parseIsoDate2(referenceDate) == null) return 0;
  const anchor = parseIsoDate2(storyline.lastVisibleEventDate) != null ? storyline.lastVisibleEventDate : parseIsoDate2(storyline.lastUpdatedDate) != null ? storyline.lastUpdatedDate : parseIsoDate2(storyline.accountedThroughDate) != null ? storyline.accountedThroughDate : storyline.startedDate;
  if (parseIsoDate2(anchor) == null) return 0;
  return ageDays(referenceDate, anchor);
};
var storylineReviewAgeDays = (storyline, referenceDate) => {
  if (!storyline || parseIsoDate2(referenceDate) == null) return 0;
  const anchor = parseIsoDate2(storyline.lastUpdatedDate) != null ? storyline.lastUpdatedDate : parseIsoDate2(storyline.accountedThroughDate) != null ? storyline.accountedThroughDate : storyline.startedDate;
  if (parseIsoDate2(anchor) == null) return 0;
  return ageDays(referenceDate, anchor);
};
var storylineAttentionScore = (storyline, originDate, targetDate, world = null) => {
  if (!storyline || storyline.status === "resolved") return -Infinity;
  let score = storyline.status === "active" ? 8 : 1;
  score += storyline.pressure / 10;
  score += storyline.momentum / 8;
  const stagnationAgeAtHorizon = storylineStagnationAgeDays(storyline, targetDate);
  const reviewAgeAtHorizon = storylineReviewAgeDays(storyline, targetDate);
  const activeWar = Boolean(activeCanonicalWarForStoryline(storyline, world));
  if (activeWar) {
    if (stagnationAgeAtHorizon >= STAGNATION_BACKSTOP_DAYS) score += 24;
    else if (reviewAgeAtHorizon >= STAGNATION_REAPPRAISAL_DAYS) score += 14;
  } else if (storyline.status === "active" && storyline.pressure >= HIGH_PRESSURE_STAGNATION_THRESHOLD) {
    if (stagnationAgeAtHorizon >= STAGNATION_BACKSTOP_DAYS) score += 24;
    else if (stagnationAgeAtHorizon >= STAGNATION_REAPPRAISAL_DAYS) score += 14;
  }
  const nextReview = storyline.nextReviewDate;
  if (!nextReview) {
    score += storyline.status === "active" ? 12 : 3;
  } else if (parseIsoDate2(nextReview) != null && parseIsoDate2(targetDate) != null) {
    if (parseIsoDate2(originDate) != null && compareIso(nextReview, originDate) <= 0) score += 16;
    else if (compareIso(nextReview, targetDate) <= 0) score += 11;
  }
  const staleDays = ageDays(originDate, storyline.lastUpdatedDate || storyline.accountedThroughDate);
  if (staleDays >= 240) score += 8;
  else if (staleDays >= 120) score += 6;
  else if (staleDays >= 60) score += 4;
  else if (staleDays >= 30) score += 2;
  if (parseIsoDate2(storyline.lastVisibleEventDate) != null) {
    const visibleAge = ageDays(originDate, storyline.lastVisibleEventDate);
    for (const [maxDays, penalty] of RECENT_VISIBLE_EVENT_PENALTY_DAYS) {
      if (visibleAge <= maxDays) {
        score -= penalty;
        break;
      }
    }
  }
  return score;
};
var storylineNeedsAttentionWithin = (storyline, originDate, targetDate, world = null) => {
  if (!storyline || storyline.status === "resolved") return false;
  const stagnationAgeAtHorizon = storylineStagnationAgeDays(storyline, targetDate);
  const reviewAgeAtHorizon = storylineReviewAgeDays(storyline, targetDate);
  const activeWar = Boolean(activeCanonicalWarForStoryline(storyline, world));
  if (activeWar && reviewAgeAtHorizon >= STAGNATION_REAPPRAISAL_DAYS) {
    return true;
  }
  if (storyline.status === "active" && storyline.pressure >= HIGH_PRESSURE_STAGNATION_THRESHOLD && stagnationAgeAtHorizon >= STAGNATION_REAPPRAISAL_DAYS) {
    return true;
  }
  if (!storyline.nextReviewDate) return storyline.status === "active";
  if (parseIsoDate2(storyline.nextReviewDate) == null || parseIsoDate2(targetDate) == null) {
    return storyline.status === "active";
  }
  return compareGameDates(storyline.nextReviewDate, targetDate) <= 0;
};
var selectStorylineAttention = (world, originDate, targetDate) => {
  const coalesced = coalesceWorldStorylines(world);
  const normalized = coalesced.storylines.slice(0, MAX_PERSISTED_STORYLINES);
  const ranked = normalized.filter((entry) => storylineNeedsAttentionWithin(entry, originDate, targetDate, world)).map((entry) => ({
    ...entry,
    attentionScore: Math.round(storylineAttentionScore(entry, originDate, targetDate, world) * 10) / 10
  })).sort(
    (a, b2) => b2.attentionScore - a.attentionScore || b2.momentum - a.momentum || b2.pressure - a.pressure || a.id.localeCompare(b2.id)
  );
  const pool = [...ranked];
  const selected = [];
  const kindUse = /* @__PURE__ */ new Map();
  const participantUse = /* @__PURE__ */ new Map();
  while (pool.length > 0 && selected.length < MAX_ATTENTION_STORYLINES) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;
    for (let index = 0; index < pool.length; index += 1) {
      const entry = pool[index];
      const kindKey2 = normalizeString4(entry.kind).toLowerCase() || "world";
      const overlapPenalty = (kindUse.get(kindKey2) || 0) * 1.5 + normalizeArray3(entry.participants).reduce(
        (sum, participant) => sum + (participantUse.get(normalizeString4(participant).toLowerCase()) || 0) * 1.25,
        0
      );
      const adjusted = entry.attentionScore - overlapPenalty;
      if (adjusted > bestAdjusted || adjusted === bestAdjusted && (entry.momentum > pool[bestIndex].momentum || entry.momentum === pool[bestIndex].momentum && entry.pressure > pool[bestIndex].pressure)) {
        bestAdjusted = adjusted;
        bestIndex = index;
      }
    }
    const [picked] = pool.splice(bestIndex, 1);
    selected.push({
      ...picked,
      adjustedAttentionScore: Math.round(bestAdjusted * 10) / 10
    });
    const kindKey = normalizeString4(picked.kind).toLowerCase() || "world";
    kindUse.set(kindKey, (kindUse.get(kindKey) || 0) + 1);
    for (const participant of normalizeArray3(picked.participants)) {
      const key = normalizeString4(participant).toLowerCase();
      if (key) participantUse.set(key, (participantUse.get(key) || 0) + 1);
    }
  }
  return {
    all: normalized,
    ranked,
    selected,
    aliasToCanonical: coalesced.aliasToCanonical,
    duplicateGroups: coalesced.duplicateGroups,
    mergedDuplicateCount: coalesced.mergedDuplicateCount
  };
};
var ANTI_STASIS_MIN_PRESSURE_DELTA = 4;
var ANTI_STASIS_MIN_MOMENTUM_DELTA = 6;
var describeAntiStasisObjectiveRule = ({ withEvent = true } = {}) => `${withEvent ? "link a material event, " : ""}change status, move pressure by ${ANTI_STASIS_MIN_PRESSURE_DELTA} or more points, or move momentum by ${ANTI_STASIS_MIN_MOMENTUM_DELTA} or more points`;
var storylineAtAntiStasisBackstop = (prior, stopDate, world = null) => {
  if (!prior || normalizeString4(prior?.status).toLowerCase() !== "active") return false;
  const activeWar = Boolean(activeCanonicalWarForStoryline(prior, world));
  if (!activeWar && clampPercent3(prior?.pressure) < HIGH_PRESSURE_STAGNATION_THRESHOLD) return false;
  return storylineStagnationAgeDays(prior, stopDate) >= STAGNATION_BACKSTOP_DAYS;
};
var resolveCountryStatEntry = (worldLike, token) => {
  const world = worldLike && typeof worldLike === "object" ? worldLike : {};
  const raw = normalizeString4(token);
  if (!raw) return null;
  const countryStats = world.countryStats && typeof world.countryStats === "object" ? world.countryStats : {};
  const directKey = Object.keys(countryStats).find((key) => normalizeString4(key).toLowerCase() === raw.toLowerCase());
  if (directKey) return { key: directKey, sheet: countryStats[directKey] };
  const overrides = world.polityOverrides && typeof world.polityOverrides === "object" ? world.polityOverrides : {};
  for (const [key, polity] of Object.entries(overrides)) {
    const names = [
      key,
      polity?.code,
      polity?.name,
      ...normalizeArray3(polity?.aliases)
    ].map(normalizeString4).filter(Boolean);
    if (!names.some((name) => name.toLowerCase() === raw.toLowerCase())) continue;
    const statKey = Object.keys(countryStats).find((candidate) => normalizeString4(candidate).toLowerCase() === normalizeString4(key).toLowerCase());
    if (statKey) return { key: statKey, sheet: countryStats[statKey] };
  }
  return null;
};
var buildEconomicAttentionContext = (bundle, storylineAttention, extraActors = []) => {
  const world = bundle?.world || {};
  const requested = [
    normalizeString4(bundle?.game?.country),
    ...normalizeArray3(storylineAttention?.selected).flatMap((storyline) => normalizeArray3(storyline?.participants)).map(normalizeString4),
    ...normalizeArray3(extraActors).map(normalizeString4)
  ].filter(Boolean);
  const seen = /* @__PURE__ */ new Set();
  const rows = [];
  for (const actor of requested) {
    if (rows.length >= MAX_ECONOMIC_ACTORS) break;
    const key = actor.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const resolved = resolveCountryStatEntry(world, actor);
    if (!resolved?.sheet || !isCompleteCountryStatSheet(resolved.sheet)) continue;
    const summary = buildCompactEconomicContext(resolved.sheet, { name: actor });
    if (!summary) continue;
    rows.push({
      actor,
      canonicalKey: resolved.key,
      summary: truncate(summary, 620)
    });
  }
  return rows;
};
var candidateKey = (candidate) => `${normalizeString4(candidate?.type).toLowerCase()}|${normalizeString4(candidate?.title).toLowerCase()}|${normalizeString4(candidate?.detail).toLowerCase()}`;
var candidateStorylineKeys = (candidate) => [...new Set(
  normalizeArray3(candidate?.storylineIds).map((id) => normalizeString4(id).toLowerCase()).filter(Boolean)
)];
var selectBoundedCandidates = (rankedCandidates, limit) => {
  const pool = normalizeArray3(rankedCandidates).map((candidate) => ({ ...candidate }));
  const selected = [];
  const storylineUse = /* @__PURE__ */ new Map();
  const typeUse = /* @__PURE__ */ new Map();
  const boundedLimit = Math.max(1, Math.min(20, Number(limit) || DEFAULT_MAX_CANDIDATES));
  while (pool.length > 0 && selected.length < boundedLimit) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;
    for (let index = 0; index < pool.length; index += 1) {
      const candidate = pool[index];
      const storylinePenalty = candidateStorylineKeys(candidate).reduce(
        (sum, key) => sum + (storylineUse.get(key) || 0) * CANDIDATE_STORYLINE_REPEAT_PENALTY,
        0
      );
      const typeKey2 = normalizeString4(candidate?.type).toLowerCase() || "unknown";
      const typePenalty = Math.max(0, (typeUse.get(typeKey2) || 0) - 1) * CANDIDATE_TYPE_REPEAT_PENALTY;
      const trajectoryValue = Number.isFinite(Number(candidate?.trajectoryValue)) ? Math.max(0, Math.min(5, Number(candidate.trajectoryValue))) : deriveWorldTrajectoryValue(candidate);
      const adjusted = (Number(candidate?.score) || 0) + trajectoryValue * CANDIDATE_TRAJECTORY_WEIGHT - storylinePenalty - typePenalty;
      if (adjusted > bestAdjusted || adjusted === bestAdjusted && ((Number(candidate?.score) || 0) > (Number(pool[bestIndex]?.score) || 0) || (Number(candidate?.score) || 0) === (Number(pool[bestIndex]?.score) || 0) && (Number.isFinite(Number(candidate?.ageDays)) ? Number(candidate.ageDays) : 99999) < (Number.isFinite(Number(pool[bestIndex]?.ageDays)) ? Number(pool[bestIndex].ageDays) : 99999))) {
        bestAdjusted = adjusted;
        bestIndex = index;
      }
    }
    const [picked] = pool.splice(bestIndex, 1);
    const storylineKeys = candidateStorylineKeys(picked);
    const typeKey = normalizeString4(picked?.type).toLowerCase() || "unknown";
    selected.push({
      ...picked,
      trajectoryValue: Number.isFinite(Number(picked?.trajectoryValue)) ? Math.max(0, Math.min(5, Number(picked.trajectoryValue))) : deriveWorldTrajectoryValue(picked),
      adjustedSelectionScore: Math.round(bestAdjusted * 10) / 10
    });
    for (const key of storylineKeys) {
      storylineUse.set(key, (storylineUse.get(key) || 0) + 1);
    }
    typeUse.set(typeKey, (typeUse.get(typeKey) || 0) + 1);
  }
  return selected;
};
var installDebugApi2 = () => {
  if (typeof globalThis === "undefined") return;
  globalThis.__OH_NATIVE_WORLD_DIRECTOR__ = {
    version: WORLD_DIRECTOR_VERSION,
    last: () => lastAnalysis ? JSON.parse(JSON.stringify(lastAnalysis)) : null
  };
};
installDebugApi2();
var buildWorldInitiativeContext = (bundle, {
  targetDate = "",
  maxCandidates = DEFAULT_MAX_CANDIDATES,
  playerFocus = ""
} = {}) => {
  const originDate = normalizeString4(bundle?.game?.gameDate);
  const horizonDate = normalizeString4(targetDate) || originDate;
  const candidates = [];
  const storylineAttention = selectStorylineAttention(
    bundle?.world || {},
    originDate,
    horizonDate
  );
  const selectedStorylineIds = new Set(
    storylineAttention.selected.map((storyline) => normalizeString4(storyline.id)).filter(Boolean)
  );
  const allDeferredStorylines = storylineAttention.all.filter(
    (storyline) => storyline.status !== "resolved" && !selectedStorylineIds.has(normalizeString4(storyline.id))
  );
  const deferredStorylineIds = new Set(
    allDeferredStorylines.map((storyline) => normalizeString4(storyline.id)).filter(Boolean)
  );
  const deferredSourceEventIds = new Set(
    allDeferredStorylines.flatMap((storyline) => normalizeArray3(storyline?.sourceEventIds)).map(normalizeString4).filter(Boolean)
  );
  const selectedParticipantKeys = new Set(
    storylineAttention.selected.flatMap((storyline) => normalizeArray3(storyline?.participants)).map((actor) => normalizeString4(actor).toLowerCase()).filter(Boolean)
  );
  const suppressedDeferredParticipantKeys = new Set(
    allDeferredStorylines.flatMap((storyline) => normalizeArray3(storyline?.participants)).map((actor) => normalizeString4(actor).toLowerCase()).filter((actor) => actor && !selectedParticipantKeys.has(actor))
  );
  const diplomaticAttention = buildBoundedDiplomaticContext(bundle?.world || {}, {
    playerPolity: normalizeString4(bundle?.game?.country),
    selectedStorylines: storylineAttention.selected,
    maxActors: 8
  });
  const canonicalStorylineId = (value) => {
    const id = normalizeString4(value);
    return storylineAttention.aliasToCanonical?.get(id) || id;
  };
  const recentEvents = normalizeArray3(bundle?.events).slice(-RECENT_EVENT_WINDOW);
  const crisisEvidenceCandidates = [];
  let deferredRecentEventsSuppressed = 0;
  let staleRecentEventsSuppressed = 0;
  let lowSignalRecentEventsSuppressed = 0;
  recentEvents.forEach((event, index) => {
    const eventId = normalizeString4(event?.id);
    const eventStorylineIds = normalizeArray3(event?.storylineIds).map(canonicalStorylineId).filter(Boolean);
    const crisisCandidate = eventCandidate(event, originDate, index);
    if (crisisCandidate && crisisCandidate.ageDays <= RECENT_EVENT_CANDIDATE_MAX_AGE_DAYS && !eventStorylineIds.length && Number(crisisCandidate.trajectoryValue) >= 4) {
      crisisEvidenceCandidates.push(crisisCandidate);
    }
    if (!recentEventEligibleForInitiative(event, originDate)) {
      const age = ageDays(originDate, event?.date);
      if (parseIsoDate2(originDate) != null && parseIsoDate2(event?.date) != null && age > RECENT_EVENT_CANDIDATE_MAX_AGE_DAYS) {
        staleRecentEventsSuppressed += 1;
      } else {
        lowSignalRecentEventsSuppressed += 1;
      }
      return;
    }
    const belongsToSelected = eventStorylineIds.some((id) => selectedStorylineIds.has(id));
    const belongsToDeferred = eventStorylineIds.some((id) => deferredStorylineIds.has(id)) || eventId && deferredSourceEventIds.has(eventId);
    if (belongsToDeferred && !belongsToSelected) {
      deferredRecentEventsSuppressed += 1;
      return;
    }
    const candidate = eventCandidate(event, originDate, index);
    if (candidate) candidates.push(candidate);
  });
  const recentChats = normalizeArray3(bundle?.chats).slice(-RECENT_CHAT_WINDOW);
  recentChats.forEach((chat, index) => {
    const candidate = chatCandidate(chat, originDate, index);
    if (candidate) candidates.push(candidate);
  });
  const consolidated = normalizeArray3(bundle?.world?.consolidatedHistory).slice(-CONSOLIDATED_HISTORY_WINDOW);
  const durableCanonExcludedFromInitiative = consolidated.length;
  pushTerritorialCandidates(
    candidates,
    bundle?.world || {},
    suppressedDeferredParticipantKeys,
    normalizeString4(bundle?.game?.country)
  );
  pushActiveUnitCandidates(
    candidates,
    bundle?.world || {},
    suppressedDeferredParticipantKeys,
    normalizeString4(bundle?.game?.country)
  );
  const activeInteractive = bundle?.world?.activeInteractive;
  if (activeInteractive && typeof activeInteractive === "object") {
    const title = normalizeString4(activeInteractive.title);
    const premise = normalizeString4(activeInteractive.premise || activeInteractive.opening);
    if (title || premise) {
      candidates.push({
        id: "active-interactive",
        type: "active-crisis",
        score: 11,
        date: originDate,
        title: title || "Active unresolved crisis",
        detail: truncate(premise, 320),
        ageDays: 0,
        trajectoryValue: 5
      });
    }
  }
  const deduped = [];
  const seen = /* @__PURE__ */ new Set();
  for (const candidate of candidates) {
    const key = candidateKey(candidate);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
  }
  deduped.sort(
    (a, b2) => b2.score - a.score || a.ageDays - b2.ageDays || compareGameDates(b2.date || "", a.date || "")
  );
  const bounded = selectBoundedCandidates(
    deduped,
    maxCandidates
  );
  const explorationSlate = buildNativeWorldExplorationSlate({
    bundle,
    allStorylines: storylineAttention.all,
    selectedStorylines: storylineAttention.selected,
    diplomaticActors: diplomaticAttention.actors,
    causalCandidates: bounded,
    crisisCandidates: crisisEvidenceCandidates
  });
  const conflictRiskPosture = deriveWorldConflictRiskPosture({
    bundle,
    targetDate: horizonDate,
    causalCandidates: bounded
  });
  const explorationActors = explorationSlate.filter((slot) => slot.type === "actor-domain").map((slot) => slot.actor);
  const economicAttention = buildEconomicAttentionContext(
    bundle,
    storylineAttention,
    explorationActors
  );
  const currentUnitCount = normalizeArray3(bundle?.world?.units).length;
  const playerKey = normalizeString4(bundle?.game?.country).toLowerCase();
  const keptCandidates = trimWorldForFocus(bounded, {
    focus: playerFocus,
    isPlayerItem: (candidate) => Boolean(playerKey) && `${normalizeString4(candidate?.title)} ${normalizeString4(candidate?.detail)}`.toLowerCase().includes(playerKey)
  });
  const lines = keptCandidates.map((candidate, index) => {
    const when = candidate.date ? ` (${candidate.date})` : "";
    return `${index + 1}. ${candidate.title}${when}` + (candidate.detail ? `
   ${candidate.detail}` : "");
  });
  const deferredStorylines = allDeferredStorylines.slice(0, MAX_DEFERRED_STORYLINE_HINTS);
  const deferredLines = deferredStorylines.map((storyline, index) => `${index + 1}. [${[storyline.id, storyline.kind, storyline.status, `pressure ${storyline.pressure}`].join(" | ")}] ${storyline.title}`);
  const attentionLines = storylineAttention.selected.map((storyline, index) => {
    const visibleAge = parseIsoDate2(storyline.lastVisibleEventDate) != null ? ageDays(originDate, storyline.lastVisibleEventDate) : null;
    const stagnationAge = storylineStagnationAgeDays(storyline, horizonDate);
    const atBackstop = storylineAtAntiStasisBackstop(storyline, horizonDate, bundle?.world);
    const meta = [
      storyline.id,
      storyline.kind,
      storyline.status,
      `pressure ${storyline.pressure}`,
      `momentum ${storyline.momentum}`
    ].join(" | ");
    const detail = [
      storyline.participants.length ? `participants: ${storyline.participants.join(", ")}` : "",
      storyline.state ? `state: ${storyline.state}` : "",
      visibleAge == null ? "no visible event yet" : `last visible event ${visibleAge} day(s) before this jump`,
      atBackstop ? `MUST MOVE THIS PERIOD: ${stagnationAge} days with no visible development by the stop date; it must ${describeAntiStasisObjectiveRule()}.` : ""
    ].filter(Boolean).join("\n   ");
    return `${index + 1}. [${meta}] ${storyline.title}${detail ? `
   ${detail}` : ""}`;
  });
  const crisisLines = explorationSlate.filter((slot) => slot?.type === "crisis-discovery" && Number(slot?.trajectoryValue) >= 4 && normalizeString4(slot?.basis)).map((slot) => `- ${normalizeString4(slot.actor)}: ${normalizeString4(slot.basis)}`);
  const latestVisibleDate = latestCanonicalWorldEventDate(
    bundle?.events,
    originDate
  );
  const visibleSilenceDays = latestVisibleDate ? worldIntegrityAgeDays(originDate, latestVisibleDate) : 99999;
  const horizonDays = originDate && horizonDate ? worldIntegrityAgeDays(horizonDate, originDate) : 0;
  const consequenceSignal = assessRecentWorldConsequenceLiveness({
    events: bundle?.events,
    referenceDate: originDate
  });
  const text3 = [
    `[What Is in Motion \u2014 ${originDate || "unknown"} to ${horizonDate || "unknown"}]`,
    "Storylines are this world's ongoing processes \u2014 wars, crises, standoffs, movements. Each one due this period gets one storylineUpdates record saying where it stands on the stop date, whether or not it produces a visible event:",
    attentionLines.length ? attentionLines.join("\n") : "None due this period.",
    "",
    "Other open storylines (a record only when something material happens in one):",
    deferredLines.length ? deferredLines.join("\n") + (allDeferredStorylines.length > deferredLines.length ? `
... and ${allDeferredStorylines.length - deferredLines.length} more.` : "") : "None.",
    "",
    "Pressures in the record, most pressing first:",
    lines.length ? lines.join("\n") : "Nothing in the record stands out.",
    ...crisisLines.length ? ["", "Instability the record says may be turning into a crisis:", ...crisisLines] : [],
    "",
    `Conflict risk in this world right now: ${conflictRiskPosture.label}. ${conflictRiskPosture.guidance}.`,
    // The breadth repair is told this too, but it is its own request and is
    // skipped while requests are saved; this line reaches every skip for free.
    ...consequenceSignal.level === "low" ? [`Recent history is busy but thin on real outcomes: ${consequenceSignal.consequentialCount} of the last ${consequenceSignal.eventCount} events in about ${consequenceSignal.lookbackDays} days changed what anyone can do next. Check first whether a pressure already in the record has matured into a real outcome (a vote, a resignation or appointment, a strike settled, a capability completed, an escalation or a climb-down); where none has, write ordinary history and do not invent drama.`] : [],
    "",
    "Economic baselines (a strained state can still borrow, tax or print, at a price):",
    economicAttention.length ? economicAttention.map((row, index) => `${index + 1}. ${row.summary}`).join("\n") : "None recorded yet.",
    "",
    DIPLOMATIC_STATE_HEADING,
    diplomaticAttention.text,
    "",
    "[Storyline Records]",
    "storylineUpdates is ONE string: one record per line, at most 16, fields separated by ~ (never inside a field):",
    "id~status~pressure~momentum~startedDate~kind~title~participantsCSV~eventNumbersCSV~state",
    "status is active, dormant or resolved. pressure (how much is at stake) and momentum (how fast it is changing) run 0-100. startedDate is YYYY-MM-DD for a new storyline; an existing one may leave kind, title and participants blank; eventNumbersCSV may be blank; state says what is true on the stop date. Open a new storyline when an event starts something that will run over several turns \u2014 a crisis, an insurgency, a standoff, a war \u2014 never for a one-off announcement, and never for an effort on the Projects board.",
    `An active war or high-pressure storyline with no visible development for ${STAGNATION_BACKSTOP_DAYS} days may not stand still: it must ${describeAntiStasisObjectiveRule()}.`
  ].join("\n");
  lastAnalysis = {
    version: WORLD_DIRECTOR_VERSION,
    originDate,
    targetDate: normalizeString4(targetDate),
    candidateCount: bounded.length,
    storylineCount: storylineAttention.all.length,
    attentionCount: storylineAttention.selected.length,
    attentionStorylines: storylineAttention.selected,
    deferredCount: allDeferredStorylines.length,
    deferredStorylines: allDeferredStorylines,
    deferredPromptStorylines: deferredStorylines,
    explorationSlate,
    explorationSlotCount: explorationSlate.length,
    explorationActorCount: explorationSlate.filter((slot) => slot.type === "actor-domain").length,
    explorationPlayerSphereCount: explorationSlate.filter((slot) => slot.scope === "player-sphere").length,
    explorationWiderWorldCount: explorationSlate.filter((slot) => slot.scope === "wider-world").length,
    crisisDiscoverySlotCount: explorationSlate.filter((slot) => slot.type === "crisis-discovery").length,
    conflictRiskPosture,
    visibleSilenceDays,
    horizonDays,
    consequenceSignal,
    stagnationPolicy: {
      highPressure: HIGH_PRESSURE_STAGNATION_THRESHOLD,
      activeWarsRegardlessOfPressure: true,
      reappraisalDays: STAGNATION_REAPPRAISAL_DAYS,
      backstopDays: STAGNATION_BACKSTOP_DAYS
    },
    deferredRecentEventsSuppressed,
    staleRecentEventsSuppressed,
    lowSignalRecentEventsSuppressed,
    durableCanonExcludedFromInitiative,
    mergedDuplicateStorylines: storylineAttention.mergedDuplicateCount || 0,
    duplicateStorylineGroups: storylineAttention.duplicateGroups || [],
    economicActors: economicAttention,
    currentUnitCount,
    diplomaticActors: diplomaticAttention.actors,
    diplomaticRelations: diplomaticAttention.relations,
    diplomaticAgreements: diplomaticAttention.agreements,
    scanned: {
      recentEvents: recentEvents.length,
      recentEventsSuppressedAsDeferredEvidence: deferredRecentEventsSuppressed,
      recentEventsSuppressedAsStaleInitiative: staleRecentEventsSuppressed,
      recentEventsSuppressedAsLowSignalInitiative: lowSignalRecentEventsSuppressed,
      durableCanonExcludedFromCurrentInitiative: durableCanonExcludedFromInitiative,
      mergedDuplicateStorylines: storylineAttention.mergedDuplicateCount || 0,
      recentChats: recentChats.length,
      consolidatedHistory: consolidated.length,
      storylines: storylineAttention.all.length
    },
    candidates: bounded,
    doctrine: {
      historicalEvents: "candidates-not-appointments",
      historicalTiming: "causally-re-earned",
      historicalConsequences: "branch-recomputed",
      historicalContinuity: "causal-inertia-not-penalized",
      unchangedHistoricalStructure: "surviving-causes-are-present-tense-reason",
      unchangedHistoricalDateRequires: "surviving-scheduling-mechanism",
      playerSilence: "no-new-authorization",
      worldProcesses: "persistent-storylines-not-event-cards",
      currentUnits: "world.units-exhaustive-history-cannot-resurrect-absent-formations",
      storylineTransport: "compact-line-records",
      storylineBookkeeping: "runtime-owned",
      schedulerFairness: "diversity-aware-with-starvation-and-recent-visibility-cooldown",
      liveness: "breadth-plus-endogenous-active-war-and-high-pressure-motion-without-event-quota",
      reviewCadence: "21d-active-war-or-high-pressure-reappraisal-45d-objective-anti-stasis",
      visibleMilestones: "strategic-ordinary-consequential-or-human-texture",
      deferredStorylines: "low-attention-not-frozen-material-endogenous-reentry-allowed",
      candidateBreadth: "deferred-storyline-evidence-suppressed-plus-repeat-penalties-plus-native-trajectory-bias",
      exploration: "structural-5-5-player-wider-slate-with-protected-trajectory-crisis-lane",
      precuration: "native-integrity-screen-before-hidden-pass-state",
      stagnation: "21d-active-war-or-high-pressure-soft-reappraisal-45d-no-copy-forward-backstop",
      scheduler: "bounded-native-attention",
      eventDensity: "state-dependent-two-stage-world-composition-post-curator-no-hard-quota"
    },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  installDebugApi2();
  console.info(
    `[OH Native World Director v${WORLD_DIRECTOR_VERSION}] ${storylineAttention.selected.length}/${storylineAttention.all.length} storyline(s) selected, ${explorationSlate.length} exploration slot(s) (${explorationSlate.filter((slot) => slot.scope === "player-sphere").length} player-sphere / ${explorationSlate.filter((slot) => slot.scope === "wider-world").length} wider-world), ${bounded.length} causal candidate(s), ${economicAttention.length} economic actor baseline(s), ${currentUnitCount} current unit(s), ${diplomaticAttention.relations.length} relation(s), ${diplomaticAttention.agreements.length} agreement(s), ${recentEvents.length} recent event(s), ${recentChats.length} recent chat(s)`
  );
  if (typeof globalThis !== "undefined" && globalThis.__OH_CONTEXT_DIAGNOSTICS__ === true) {
    console.groupCollapsed(
      `[OH World Exploration v${WORLD_DIRECTOR_VERSION}] ${explorationSlate.length} slot(s); visible silence ${visibleSilenceDays < 99999 ? `${visibleSilenceDays}d` : "unknown"}; ${deferredRecentEventsSuppressed} deferred + ${staleRecentEventsSuppressed} stale + ${lowSignalRecentEventsSuppressed} low-signal recent event candidate(s) suppressed; ${durableCanonExcludedFromInitiative} durable canon block(s) kept out of current initiative; ${storylineAttention.mergedDuplicateCount || 0} duplicate storyline(s) coalesced`
    );
    console.table(
      explorationSlate.map((slot) => ({
        id: slot.id,
        actor: slot.actor,
        relevance: slot.relevance ?? "",
        domain: slot.domain,
        basis: slot.basis || "",
        deferredTopics: slot.deferredTopics.join("; ")
      }))
    );
    console.info("selected storylines:", storylineAttention.selected.map((entry) => entry.id));
    console.info("deferred storylines:", allDeferredStorylines.map((entry) => entry.id));
    console.groupEnd();
  }
  return {
    text: text3,
    analysis: lastAnalysis
  };
};

// src/Game/AI/worldDirectorWorker.js
self.onmessage = (event) => {
  const id = Number(event?.data?.id);
  try {
    const result = buildWorldInitiativeContext(
      event?.data?.bundle || {},
      event?.data?.options || {}
    );
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id,
      error: String(error?.message || error || "Native World Director worker failed.")
    });
  }
};
/*! Open Historia — the two layers of a country's statistics © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — wars meant to end one way © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — how a scenario's wars are fought (Wars and Fronts Pt.2) © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — a country's military figures, as a scenario and the game keep them © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — scenario-defined national Stats sheet definitions © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — native persistent country statistics and economic aggregation. */
/*! Open Historia — GADM region-name corrections © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — log redaction rules © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — in-game diagnostics log © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — owner-name canonicalisation © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*!
 * Open Historia — save-aware polity identity resolver
 * v0.3.0 — lifecycle + map-reference aware
 *
 * ownerNames.js answers "what stock country name does this code mean?"
 * this answers the much more annoying question:
 * "which polity in THIS save does that name actually mean?"
 *
 * a polityOverride key is treated as the stable campaign identity/lineage key.
 * a rename changes its display/current name and aliases, not every key in the
 * save. that lets old/new regime names resolve back to one established actor.
 */
/*! Open Historia — country picker list assembly © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — map archives read whole on Android © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the Capacitor bridge, reached without depending on it © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — portions (custom regions.geojson runtime endpoint) © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the map's own claims, seen by everything © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — a population as a scenario's author writes it © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — war at sea: the battles the world keeps © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — war at sea: blockades © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — alliances that bind © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — peace: offers, terms and reparations © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — war weariness © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: each country's own military figures © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — what a country has to spend on its forces © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — a country's war resources © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — what attrition has cost each country © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — unit motion, reach & detection math © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: limits and vocabulary © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the compact encodings © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the frame a battlefield is laid on © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — region types in the game © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the ground a frame lies on © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the field, who holds the ground and where the line runs © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: how far it is over the ground © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: seasons and the day's weather © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a scenario's own climate zones © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — what a scenario draws on its map for war: terrain, walls, climates, ice © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — groups and the areas they control © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the Fallback list's rules: which model answers, and when one is skipped © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the request budget: how many provider requests the game spends, and on what © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — language setting & top-50 language catalog © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — game dates in the player's language © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the phrase book: translations looked up exactly or by pattern © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the prompts' guidance, in the player's language © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — what the translator sends to the AI, and what it keeps of the answer © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the game in the player's language © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — country tags © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — puppets © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — a renamed country or group, in the battlefields it fights on © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — polity re-keying © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — portions (projects & operations board: derived status, sorting, filtering) © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — timeline event de-duplication © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — event category tags. Ported from Abdulrahman Azmy's fork. */
/*! Open Historia — the places an event is about © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — canonical event quotation and prose repair helpers © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — polities founded by receiving territory © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — why a region changes hands © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the impact arrays an event can carry © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the application receipt, told to the player © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the application receipt © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — events written but not put on the timeline © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — reports: documents in their own voice, held by the governments that have them © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — changes made outside the simulation, and the Game Master's reminders © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the player's standing goal © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — spycraft: intelligence stat, spies both ways, discovery, double agents, redaction © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — when a time skip offers an interactive event © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — chat threads as an event log © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — what the player has not been shown yet © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia Continuum — institution emblem/logo resolution.
 *
 * Canonical institutions own their explicit presentation choice. Historical
 * reference packs may opt into curated authentic emblems through badgeKey. We
 * never infer a real organization from a display name or storage id.
 */
/*! Open Historia — deterministic ASCII-safe ids for player-authored labels. */
/*! Open Historia Continuum — canonical institutions / membership ledger */
/*! Open Historia — canonical active scenario polity roster */
/*! Open Historia Continuum — dynamic native geopolitical power tiers */
/*! Open Historia Continuum — canonical live institution lifecycle (pure core).
 *
 * This module owns deterministic institution lifecycle state only. It does not
 * call providers and it does not infer consent. AI may explain/decide for AI
 * governments through the existing diplomacy request, but every resulting
 * membership mutation is validated here against an explicit lifecycle case.
 */
/*! Open Historia — background political pressure ledger (Continuum) */
/*! Open Historia — political actor runtime domain */
/*! Open Historia — canonical Political World v2 trait registry. */
/*! Open Historia — canonical Political Actor mutation operations */
/*! Open Historia — native political background clock (Continuum) */
/*! Open Historia — battlefields and fronts: troops sent into a country that is not in the war © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the replay of a run © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the troops © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: what a battlefield's war came to © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the saved record © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the whole map as a sheet of land and sea © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the way a transporter takes © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: transporters © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — strikes: missiles and bombing runs an event tells of © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: ground held is not ground disputed © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the polities people play © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — portions (troop deployments + era troop types) © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — the Game Master's commands in a shared game: queued like an order, carried out above everything © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — Player focus: how much of a jump belongs to the player © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia Continuum — canonical authority projection for passed institutional resolutions.
 *
 * Institutions own the legal resolution. This module exposes only specific,
 * still-unfulfilled OPERATIONAL authorization consequences as process authority
 * sources for later delegated execution. Declaratory/policy state and malformed
 * blocked consequences never become reusable authority. It never executes the
 * underlying consequence itself.
 */
