import { createRequire as __ohRequire } from 'node:module'; const require = __ohRequire(import.meta.url);

// spikes/headless/worker-shims.js
import { parentPort } from "node:worker_threads";

// spikes/headless/node-worker.js
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Worker as NodeWorker } from "node:worker_threads";
var workerLog = [];
var HeadlessWorker = class {
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

// spikes/headless/worker-shims.js
var handler = null;
var listeners = /* @__PURE__ */ new Set();
globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.location = new URL(`${process.env.OH_HEADLESS_ORIGIN || "http://127.0.0.1:3999"}/`);
if (typeof globalThis.localStorage === "undefined") {
  const map = /* @__PURE__ */ new Map();
  const storage = {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.has(String(k)) ? map.get(String(k)) : null,
    setItem: (k, v) => {
      map.set(String(k), String(v));
    },
    removeItem: (k) => {
      map.delete(String(k));
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

// src/runtime/fronts/constants.js
var MAX_SIDE_MEMBERS = 8;
var MAX_TROOPS_PER_SIDE = 400;
var COMMAND_TROOPS = Object.freeze([12, 40, 110, 220]);
var FRONT_COMMANDS_MOST = 5;
var MAX_COMMANDS = 8;
var MAX_WAY_POINTS = 12;
var MAX_CELLS = 64e3;
var MAX_GRID_SPAN = 255;
var CELL_STEPS_KM = Object.freeze([4, 6, 8, 12, 16, 24, 32, 48, 64, 96]);
var HOLDER_SIDE_A = 0;
var HOLDER_SIDE_B = 1;
var HOLDER_WALL = 2;
var TROOP_UNITS = 16;
var BATTLEFIELD_STATUSES = Object.freeze(["active", "frozen", "closed", "standing"]);
var TROOP_KINDS = Object.freeze(["infantry", "armor", "artillery"]);
var TROOP_STATES = Object.freeze(["holding", "advancing", "encircled", "spent", "dug in"]);
var FRONT_ORDERS = Object.freeze(["advance", "blitz", "spearhead", "encircle", "hold", "dig in", "fall back", "withdraw", "land", "flank", "assault"]);
var WAR_ROOM_ORDERS = Object.freeze(["advance", "blitz", "spearhead", "flank", "encircle", "hold", "dig in", "fall back", "withdraw"]);
var WAR_ROOM_STANCES = Object.freeze(["accepts", "objects", "speaks"]);
var FRONT_RESULTS = Object.freeze(["breakthrough", "captured", "repulsed", "stalemate", "collapse", "surrender"]);
var FRONT_EFFORTS = Object.freeze(["token", "limited", "major", "total"]);
var TERRAIN_SPEED_MIN = 0.2;
var TERRAIN_SPEED_MAX = 2;
var TERRAIN_DEFENCE_GAIN = 1.25;
var FAR_CELLS = 8;
var EDIT_MARGIN_CELLS = 2;
var REDISTANCE_NEAR_CELLS = 2;
var REDISTANCE_REACH_CELLS = 4;
var GROW_WITHIN_CELLS = 6;
var GROW_KM = 250;
var CONTROL_RADIUS_OF_SPACING = 0.9;
var CONTROL_RADIUS_MIN_KM = 6;
var CONTROL_RADIUS_MAX_KM = 16;
var CONTROL_RADIUS_MIN_CELLS = 0.9;
var REACH_KM = 40;
var REACH_MIN_CELLS = 4;
var STAND_OFF_KM = Object.freeze([8, 8, 16]);
var TROOP_ATTACK = Object.freeze([1, 1.6, 1.2]);
var TROOP_DEFENCE = Object.freeze([1.2, 1, 0.8]);
var TRAIT_DRIVE = Object.freeze([0.7, 1.35]);
var TRAIT_DEPTH = Object.freeze([0.4, 1.8]);
var TRAIT_LANE = Object.freeze([-0.45, 0.45]);
var TRAIT_LAG_DAYS = Object.freeze([0, 0, 1, 1, 2]);
var FLANKED_DEFENCE = 0.75;
var SURROUNDED_DEFENCE = 0.55;
var FLANK_BEHIND_COS = -0.2;
var FLANK_OPPOSITE_COS = -0.7;
var TROOPS_FACTOR_LEAST = 0.25;
var TROOPS_FACTOR_MOST = 4;
var MEN_PER_FORMATION_BY_ERA = Object.freeze([2e3, 5e3, 12e3, 1e4]);
var MANPOWER_SHARE = 0.12;
var POOL_PER_TROOP = 30;
var EFFORT_FACTORS = Object.freeze({ token: 0.3, limited: 0.6, major: 1, total: 1.4 });
var ARMOUR_SHARE_BY_ERA = Object.freeze([0.15, 0.15, 0.1, 0.3]);
var ARTILLERY_SHARE_BY_ERA = Object.freeze([0.1, 0.1, 0.15, 0.15]);
var FALL_BACK_KM_PER_DAY = 15;
var FALL_BACK_MAX_KM = 150;
var STAFF_MARK = "staff";
var FATIGUE_MARCH = 0.05;
var FATIGUE_ATTACK = 0.035;
var FATIGUE_DEFEND = 0.015;
var FATIGUE_REST = 0.07;
var FATIGUE_REST_DUG = 1.25;
var FATIGUE_REST_POCKET = 0.25;
var FATIGUE_STILL_KM = 2;
var STILL_EDGE = 0.08;
var ATTRITION_WEATHER = 0.25;
var ATTRITION_TIRED = 1;
var ATTRITION_DUG = 0.6;
var ATTRITION_SHORT = 1;
var ATTRITION_HARSH_FROM = 0.8;
var FATIGUE_PUNCH = 0.35;
var FATIGUE_GUARD = 0.15;
var FATIGUE_LEGS = 0.4;
var PART_COUNTER_LEAST = 0.1;
var ICE_SPEED = 0.35;
var MIND_MARK = "mind";
var SCENARIO_MARK = "scenario";
var LINE_MARKS = Object.freeze([STAFF_MARK, SCENARIO_MARK]);
var WAR_EFFORTS = Object.freeze(["major", "total"]);
var MUSTER_STANDING_SHARE = 0.25;
var ATTACK_LAPSE_DAYS = 120;
var PLACE_SECTOR_KM = 60;
var SECTOR_AXIS_SHARE = 0.35;
var RATIO_NEEDED = 1.15;
var RATIO_SOFTNESS = 2;
var GAIN = 0.9;
var SUBSTEPS_MAX = 32;
var ATTRITION = 0.6;
var ATTRITION_RATIO_MIN = 0.3;
var ATTRITION_RATIO_MAX = 3;
var ATTACK_COST = 1.5;
var QUIET_ATTRITION = 0.1;
var DIG_PER_DAY_HOLD = 0.04;
var DIG_MAX_HOLD = 0.5;
var DIG_LOST_KM = 2;
var REINFORCE_PER_DAY = 1;
var DIFFICULTY_EDGES = Object.freeze({
  "very-easy": Object.freeze({ power: 0.85, pace: 0.9, reserves: 0.7, mend: 0.75 }),
  easy: Object.freeze({ power: 0.93, pace: 0.95, reserves: 0.85, mend: 0.9 }),
  medium: Object.freeze({ power: 1, pace: 1, reserves: 1, mend: 1 }),
  hard: Object.freeze({ power: 1.15, pace: 1.1, reserves: 1.3, mend: 1.25 }),
  "very-hard": Object.freeze({ power: 1.35, pace: 1.2, reserves: 1.75, mend: 1.6 }),
  impossible: Object.freeze({ power: 1.75, pace: 1.4, reserves: 3, mend: 2.5 })
});
var SHORTAGE_EDGE = Object.freeze({ power: 0.15, pace: 0.15, reserves: 0.5, mend: 0.5 });
var COMPASS_16 = Object.freeze([
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
var TURNS = Object.freeze([
  0.8660254037844387,
  0.5,
  0.8660254037844387,
  -0.5,
  0.5,
  0.8660254037844387,
  0.5,
  -0.8660254037844387
]);
var SUPPLY_EVERY_DAYS = 3;
var SUPPLY_FULL_KM = Object.freeze([120, 180, 300, 450]);
var SUPPLY_FAR_FACTOR = 2.5;
var SUPPLY_LEAST = 0.4;
var CORRIDOR_KM = 20;
var CORRIDOR_COST = 4;
var PATCH_MAX_KM2 = 1500;
var POCKET_DAYS = 10;
var POCKET_LOSS = 2;
var POCKET_ATTACK = 0.7;
var POCKET_DEFENCE = 0.75;
var SIEGE_SPARE_KM = 20;
var SIEGE_DAYS = 45;
var SIEGE_LOSS = 1;
var FLIP_AT = 0.6;
var MIN_DAYS_BETWEEN_FLIPS = 3;
var WHOLE_AT = 0.95;
var CAPTOR_WITHIN_KM = 150;
var FRONT_PACE_SHARE = 0.4;
var GROUP_BREADTH_MIN_KM = 40;
var GROUP_BREADTH_BRUSHES = 1.5;
var GROUP_BREADTH_OF_EXTENT = 1.2;
var SPEARHEAD_BREADTH_KM = 70;
var POINT_BREADTH = 0.75;
var POINT_STOPS_SHORT = 0.3;
var SHOULDER_STOPS = Object.freeze([0.25, 0.9]);
var SHOULDER_OUT = 0.3;
var SHOULDER_OUT_KM = Object.freeze([8, 30]);
var COLUMN_BREADTH_KM = 28;
var ROUND_KM = 34;
var ROUTE_BREADTH_MIN_KM = 24;
var ROUTE_BREADTH_BRUSHES = 1.1;
var ROUTE_STOPS_SHORT_KM = 45;
var ROUTE_STOPS_SHORT_MOST = 0.6;
var ROUTE_SET_OFF_DAYS = 3;
var ROUTE_JOIN_KM = 20;
var HAND_STALL_KM = 4;
var BLITZ_BREADTH = 0.5;
var BLITZ_MASS_DAYS = 4;
var BLITZ_PACE = 1.3;
var WAY_DAYS_MIN = 10;
var WAY_LEGS_MAX = 3;
var WAY_BEND_CELLS = 3;
var OUTWARD_KM = 100;
var OUT_AHEAD_KM = 50;
var THRUST_TROOPS = Object.freeze({ spearhead: 44, encircle: 32, flank: 16, advance: 36, blitz: 36 });
var THRUST_SHARE = 0.6;
var THRUST_LEAST = 4;
var THRUST_LINK_KM = 60;
var SLOT_SLIDE_KM = 30;
var SLOT_SLIDE_MOST = 0.7;
var STEER_PRESS = 0.3;
var STEER_PRESS_KM = 35;
var STEER_DRIFT = 0.15;
var DRIFT_DAYS = 5;
var HEADING_KEPT = 0.7;
var HEADING_KEPT_CLOSING = 0.5;
var TURN_COS = 0.8660254037844387;
var TURN_SIN = 0.5;
var TURN_CLOSING = 0.7071067811865476;
var WAY_LEAST = 0.2;
var SUPPORT_KM = 100;
var SUPPORT_FULL = 0.3;
var SUPPORT_NONE = 0.1;
var ANCHOR_FREE_KM = 75;
var RANK_KM = 100;
var RANK_SLACK_KM = 8;
var RANK_BAND_KM = 16;
var RANK_LEAST = 0.2;
var SPREAD_KM = 24;
var SPREAD_KM_PER_DAY = 5;
var EASE_KM = 2.5;
var EASE_SHARE = 0.2;
var ROOM_BRUSHES = 1.25;
var HOLD_TOO_NEAR = 0.45;
var HOLD_BACK_TO = 1.1;
var FALL_BACK_SEARCH_KM = 52;
var FALL_BACK_FROM_KM = 50;
var STRAIGHT_BACK_FURTHER = 1.6;
var FALL_BACK_PACE_KM = 26;
var COME_UP_FROM = 3.5;
var COME_UP_TO = 2;
var COME_UP_KM = 7;
var SLIDE_KM = 6;
var SLIDE_HEARS_KM = 110;
var SLIDE_NEAR_KM = 30;
var SLIDE_FAR_KM = 75;
var SLIDE_BAND = Object.freeze([0.8, 3.5]);
var SLIDE_LEAST_DEPTH = 0.7;
var GAVE_GROUND_REST_DAYS = 5;
var DEEP_KM = 80;
var OUTFLANKED_FROM_KM = 16;
var OUTFLANKED_NECK_KM = 12;
var OUTFLANKED_NARROW = 0.75;
var STRANDED_DAYS = 2;
var ADRIFT_DAYS = 2;
var DUG_IN_DEFENCE = 1.6;
var DUG_IN_LOSS = 0.55;
var WORKS = Object.freeze({ defence: DUG_IN_DEFENCE, loss: DUG_IN_LOSS, perDay: DIG_PER_DAY_HOLD, most: DIG_MAX_HOLD, assault: 1 });
var STRONG_WORKS = Object.freeze({ defence: 2.5, loss: 0.35, perDay: 0.06, most: 0.7, assault: 2.5 });
var THROWN_OUT_LOSS = 15;
var CLOSE_RIM_KM = 22;
var CLOSE_STRENGTH = 160;
var CLOSE_LEAST = 3;
var CLOSE_MOST = 16;
var CLOSE_NEAR_KM = Object.freeze([60, 35]);
var CLOSE_FAR_KM = Object.freeze([150, 80]);
var CLOSE_UNDER_STRENGTH = 30;
var CLOSE_REST_DAYS = 3;
var CLOSE_DAYS_MOST = 10;
var CLOSE_GIVEN_UP_DAYS = 6;
var CLOSE_WORN = 24;
var CLOSE_LEAVES_KM = Object.freeze([160, 90]);
var CLOSE_APART_COS = Object.freeze([0.309, 0.5878, 0.729, 0.809, 0.8584, 0.891, 0.9135, 0.9298, 0.9418, 0.9511, 0.9582, 0.964, 0.9686, 0.9724]);
var CLOSE_WEAR = 1.8;
var GIVES_UP_UNDER = 14;
var BREAK_OUT_KM = 55;
var BREAK_OUT_DAYS = 4;
var BREAK_OUT_REST_DAYS = 7;
var SCRAP_KM2 = 400;
var OVERRUN_ODDS = 4;
var OVERRUN_WITHIN_KM = 14;
var OVERRUN_ESCAPE_KM = 60;
var OVERRUN_LOSS = 10;
var EMPTY_POCKET_KM2 = 6e3;
var GRIP_KM = 16;
var STRAND_KM = 40;
var SQUEEZED_MIN_KM2 = 300;
var SQUEEZED_TAKEN = 0.5;
var SQUEEZED_NEAR = 0.15;
var SQUEEZED_NEAR_KM = 24;
var SQUEEZED_LOSS = 1;
var ASSAULT_BASE = 4;
var ASSAULT_PER_STRENGTH = 70;
var ASSAULT_LEAST = 6;
var ASSAULT_MOST = 24;
var ASSAULT_DEFENDERS_KM = 25;
var ASSAULT_FROM_KM = 280;
var ASSAULT_RING_KM = Object.freeze([3, 11]);
var ASSAULT_DAYS = 20;
var ASSAULT_WEAR = 2.5;
var SWARM_SPACING_BRUSHES = 0.9;
var SWARM_JOIN_KM = 60;
var SWARM_PLACE_KM = 40;
var SWARM_REAR_KM = 30;

// src/runtime/fronts/manpower.js
var fold = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
var menPerFormation = (era) => MEN_PER_FORMATION_BY_ERA[Math.max(0, Math.min(MEN_PER_FORMATION_BY_ERA.length - 1, Number(era) || 0))];
var menOf = (run, name) => {
  const own = run.mech?.military ? run.militaryOf(name).menPerCounter : null;
  return own > 0 ? own : run.menEach;
};
var shareOf = (run, name) => {
  const own = run.mech?.military ? run.militaryOf(name).manpowerShare : null;
  return own > 0 ? own / 100 : run.manpowerShare > 0 ? run.manpowerShare : MANPOWER_SHARE;
};
var peopleOf = (run, name) => {
  const people = Number(run.input?.peopleOf?.(name));
  return Number.isFinite(people) && people > 0 ? people : 0;
};
var levies = (run) => run.input?.manpower !== false && !run.input?.authored;
var entryOf = (run, name) => {
  const key = fold(name);
  if (!key) return null;
  if (!run.manpower.has(key)) run.manpower.set(key, { name: String(name).replace(/\s+/g, " ").trim(), drawn: 0, returned: 0 });
  return run.manpower.get(key);
};
var draw = (run, name, men) => {
  if (!levies(run) || !(men > 0) || peopleOf(run, name) === 0) return;
  entryOf(run, name).drawn += men;
};
var servingOf = (run, name) => {
  const wanted = fold(name);
  let strength = 0;
  for (const battle of run.battles) {
    if (battle.status === "closed") continue;
    for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
      const owner = battle.sides[side].findIndex((member) => fold(member) === wanted);
      if (owner < 0) continue;
      battle.troops[side].forEach((troop, at) => {
        if (troop.owner !== owner || !(troop.strength > 0)) return;
        if (battle.named.some((entry) => entry.s === side && entry.i === at)) return;
        strength += troop.strength;
      });
    }
  }
  return strength / 100 * menOf(run, name);
};
var formationsLeft = (run, name) => {
  if (!levies(run)) return Infinity;
  const people = peopleOf(run, name);
  if (people === 0) return Infinity;
  return Math.max(0, Math.floor((shareOf(run, name) * people - servingOf(run, name)) / menOf(run, name)));
};
var partLeft = (run, name) => {
  if (!run.mech?.military || !levies(run)) return 0;
  const people = peopleOf(run, name);
  if (people === 0) return 0;
  const men = shareOf(run, name) * people - servingOf(run, name);
  if (!(men > 0)) return 0;
  const counters = men / menOf(run, name);
  const part = counters - Math.floor(counters);
  return part >= PART_COUNTER_LEAST ? part : 0;
};
var mendBudget = (run, day) => {
  if (run.mendDay !== day) {
    run.mendDay = day;
    run.mendLeft = /* @__PURE__ */ new Map();
  }
  return (name) => {
    const key = fold(name);
    if (!run.mendLeft.has(key)) {
      const people = levies(run) ? peopleOf(run, name) : 0;
      run.mendLeft.set(key, people === 0 ? Infinity : Math.max(0, (shareOf(run, name) * people - servingOf(run, name)) / menOf(run, name) * 100));
    }
    return { left: () => run.mendLeft.get(key), spend: (points) => run.mendLeft.set(key, run.mendLeft.get(key) - points) };
  };
};

// src/runtime/gameDates.js
var DAY_MS = 864e5;
var MAX_ABS_YEAR = 999999;
var text = (value) => String(value ?? "").trim();
var pad = (n, width) => String(Math.abs(n)).padStart(width, "0");
var astronomicalYear = (year) => year < 0 ? year + 1 : year;
var calendarYear = (astronomical) => astronomical <= 0 ? astronomical - 1 : astronomical;
var isLeap = (astronomical) => astronomical % 4 === 0 && (astronomical % 100 !== 0 || astronomical % 400 === 0);
var gameDateDaysInMonth = (year, month) => {
  const lengths = [31, isLeap(astronomicalYear(year)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1] ?? 0;
};
var utcMillis = ({ year, month, day }) => {
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(astronomicalYear(year), month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
};
var parseGameDate = (value) => {
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
var formatGameDate = (parts) => {
  if (!parts) return "";
  const { year, month, day } = parts;
  return `${year < 0 ? "-" : ""}${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
};
var gameDateDayNumber = (value) => {
  const parts = parseGameDate(value);
  return parts ? Math.round(utcMillis(parts) / DAY_MS) : null;
};
var gameDateFromDayNumber = (dayNumber) => {
  const date = new Date(Math.round(dayNumber) * DAY_MS);
  return { year: calendarYear(date.getUTCFullYear()), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
};
var addGameDays = (value, days) => {
  const dayNumber = gameDateDayNumber(value);
  if (dayNumber === null || !Number.isFinite(days)) return "";
  const parts = gameDateFromDayNumber(dayNumber + Math.trunc(days));
  return Math.abs(parts.year) > MAX_ABS_YEAR ? "" : formatGameDate(parts);
};
var diffGameDays = (from, to) => {
  const a = gameDateDayNumber(from);
  const b = gameDateDayNumber(to);
  return a === null || b === null ? null : b - a;
};
var compareGameDates = (a, b) => {
  const left = gameDateDayNumber(a);
  const right = gameDateDayNumber(b);
  if (left !== null && right !== null) return left === right ? 0 : left < right ? -1 : 1;
  if (left !== null) return -1;
  if (right !== null) return 1;
  return text(a).localeCompare(text(b));
};

// src/runtime/regionTypes.js
var REGION_TYPE_DEFAULTS = Object.freeze({
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
var text2 = (value) => String(value ?? "").trim();
var WATER_NAME = /(?:^|[^\p{L}])(?:oceans?|seas?|waters?|lakes?)(?:$|[^\p{L}])/iu;
var isWaterType = (type) => {
  if (!type || typeof type !== "object") return false;
  if (typeof type.water === "boolean") return type.water;
  return WATER_NAME.test(text2(type.name));
};
var EMPTY_STATE = Object.freeze({ typeFill: null, typeOpacity: null, typeStroke: null, typeStrokeScale: null });

// src/runtime/unitMotion.js
var hashSeed = (text4) => {
  const str = String(text4 ?? "");
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  h = Math.imul(h ^ h >>> 16, 2246822507);
  h = Math.imul(h ^ h >>> 13, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
};
var ERA_STARTS = [1500, 1850, 1945];
var ADVANCE_KM_PER_DAY = {
  infantry: [18, 20, 20, 30],
  armor: [30, 35, 35, 50],
  artillery: [12, 15, 18, 30]
};
var OVERLAND_KM_PER_DAY = {
  infantry: [25, 28, 300, 500],
  armor: [40, 45, 300, 500],
  artillery: [18, 22, 300, 500]
};
var eraOf = (gameDate, era = null) => {
  if (Number.isInteger(era) && era >= 0 && era <= 3) return era;
  const parsed = parseGameDate(gameDate);
  if (parsed) return ERA_STARTS.filter((start) => parsed.year >= start).length;
  const text4 = String(gameDate ?? "");
  const match = /(-?\d{3,4})/.exec(text4);
  const bce = /BC|BCE/i.test(text4);
  const year = match ? Number(match[1]) * (bce ? -1 : 1) : 2e3;
  return ERA_STARTS.filter((start) => year >= start).length;
};

// src/runtime/fronts/codec.js
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var VALUE_OF = new Int8Array(128).fill(-1);
for (let index = 0; index < ALPHABET.length; index += 1) VALUE_OF[ALPHABET.charCodeAt(index)] = index;
var clampInt = (value, min, max) => {
  const number = Math.round(Number(value) || 0);
  return number < min ? min : number > max ? max : number;
};
var createBitWriter = () => {
  const letters = [];
  let pending = 0;
  let bits = 0;
  return {
    write(value, width) {
      for (let shift = width - 1; shift >= 0; shift -= 1) {
        pending = pending << 1 | value >>> shift & 1;
        bits += 1;
        if (bits === 6) {
          letters.push(ALPHABET[pending]);
          pending = 0;
          bits = 0;
        }
      }
    },
    end() {
      if (bits > 0) letters.push(ALPHABET[pending << 6 - bits]);
      pending = 0;
      bits = 0;
      return letters.join("");
    }
  };
};
var RUN_BITS = 10;
var RUN_MAX = 1 << RUN_BITS;
var indexIn = (list2, value) => {
  if (typeof value === "number") return value;
  const index = list2.indexOf(String(value ?? ""));
  return index < 0 ? 0 : index;
};
var LINE_MAX = (1 << 13) - 1;
var TRACK_DAY_MAX = 4095;
var encodeTrack = (samples) => {
  const writer = createBitWriter();
  for (const sample of Array.isArray(samples) ? samples : []) {
    writer.write(clampInt(sample?.day, 0, TRACK_DAY_MAX), 12);
    writer.write(clampInt((Number(sample?.x) || 0) * TROOP_UNITS, 0, 4095), 12);
    writer.write(clampInt((Number(sample?.y) || 0) * TROOP_UNITS, 0, 4095), 12);
    writer.write(clampInt(sample?.strength, 0, 100), 7);
    writer.write(clampInt(indexIn(TROOP_STATES, sample?.state), 0, TROOP_STATES.length - 1), 3);
    writer.write(0, 2);
  }
  return writer.end();
};
var encodeTracks = (tracks) => (Array.isArray(tracks) ? tracks : []).map(encodeTrack).join(";");
var STATE_BITS = 5;
var STATE_RUN_BITS = 13;
var STATE_RUN_MAX = 1 << STATE_RUN_BITS;
var PAINT_OWN_A = 0;
var PAINT_WALL = (1 << STATE_BITS) - 1;
var PAINT_OWN_B = PAINT_WALL - 1;
var PAINT_NAMES_MAX = PAINT_OWN_B - 1;
var encodeStates = (states) => {
  const writer = createBitWriter();
  const length = states?.length ?? 0;
  let index = 0;
  while (index < length) {
    const state2 = states[index] & PAINT_WALL;
    let run = 1;
    while (index + run < length && run < STATE_RUN_MAX && (states[index + run] & PAINT_WALL) === state2) run += 1;
    writer.write(state2, STATE_BITS);
    writer.write(run - 1, STATE_RUN_BITS);
    index += run;
  }
  return writer.end();
};
var PAINT_TICKS_PER_DAY = 16;
var PAINT_WAIT = 63;
var PAINT_NO_CELL = 65535;
var PAINT_RUN_BITS = 6;
var PAINT_RUN_MAX = 1 << PAINT_RUN_BITS;
var encodePaint = (changes) => {
  const writer = createBitWriter();
  const list2 = Array.isArray(changes) ? changes : [];
  let at = 0;
  let index = 0;
  while (index < list2.length) {
    const tick = Math.max(at, clampInt(list2[index]?.tick, 0, 2147483647));
    const cell = clampInt(list2[index]?.cell, 0, PAINT_NO_CELL - 1);
    const state2 = clampInt(list2[index]?.state, 0, PAINT_WALL);
    let run = 1;
    while (index + run < list2.length && run < PAINT_RUN_MAX && clampInt(list2[index + run]?.cell, 0, PAINT_NO_CELL - 1) === cell + run && clampInt(list2[index + run]?.state, 0, PAINT_WALL) === state2 && Math.max(tick, clampInt(list2[index + run]?.tick, 0, 2147483647)) === tick) run += 1;
    while (tick - at >= PAINT_WAIT) {
      writer.write(PAINT_WAIT, 6);
      writer.write(PAINT_NO_CELL, 16);
      writer.write(0, 14);
      at += PAINT_WAIT;
    }
    writer.write(tick - at, 6);
    writer.write(cell, 16);
    writer.write(state2, STATE_BITS);
    writer.write(run - 1, PAINT_RUN_BITS);
    writer.write(0, 3);
    at = tick;
    index += run;
  }
  return writer.end();
};
var hashKey = (parts) => hashSeed((Array.isArray(parts) ? parts : [parts]).join("")).toString(36);

// src/runtime/fronts/frame.js
var KM_PER_DEGREE = 111.32;
var RAD = Math.PI / 180;
var MERCATOR_MAX_LAT = 85.0511287798066;
var latToY = (lat) => {
  const clamped = Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, Number(lat) || 0));
  return Math.log(Math.tan(Math.PI / 4 + clamped * RAD / 2)) / RAD;
};
var yToLat = (y) => (2 * Math.atan(Math.exp((Number(y) || 0) * RAD)) - Math.PI / 2) / RAD;
var unwrapLng = (lng, around = 0) => {
  const value = Number(lng) || 0;
  return value - Math.round((value - around) / 360) * 360;
};
var round6 = (value) => Math.round(value * 1e6) / 1e6;
var homeLng0 = (lng0, width) => {
  const middle = lng0 + width / 2;
  const turn = Math.floor((middle + 180) / 360);
  return turn === 0 ? lng0 : lng0 - turn * 360;
};
var createFrame = (bounds, { flat = false, scale = KM_PER_DEGREE, marginKm = 0 } = {}) => {
  const west = Number(bounds?.west);
  let east = Number(bounds?.east);
  const south = Number(bounds?.south);
  const north = Number(bounds?.north);
  if (![west, east, south, north].every(Number.isFinite) || north <= south || east === west) return null;
  if (east < west) east += 360;
  const bottom = latToY(south);
  const top = latToY(north);
  const kmPerDegree = flat ? Number(scale) > 0 ? Number(scale) : KM_PER_DEGREE : KM_PER_DEGREE * Math.cos(yToLat((bottom + top) / 2) * RAD);
  const margin = Math.max(0, Number(marginKm) || 0) / kmPerDegree;
  const outer = round6(west - margin);
  const lat0 = round6(yToLat(Math.max(latToY(-MERCATOR_MAX_LAT), bottom - margin)));
  const y0 = latToY(lat0);
  const width = east + margin - outer;
  const lng0 = round6(homeLng0(outer, width));
  const height = Math.min(latToY(MERCATOR_MAX_LAT), top + margin) - y0;
  const fits = (km2) => {
    const cell2 = km2 / kmPerDegree;
    const cols = Math.ceil(width / cell2);
    const rows = Math.ceil(height / cell2);
    return cols <= MAX_GRID_SPAN && rows <= MAX_GRID_SPAN && cols * rows <= MAX_CELLS;
  };
  let km = CELL_STEPS_KM.find(fits) ?? 0;
  if (!km) {
    const needed = Math.max(width / MAX_GRID_SPAN, height / MAX_GRID_SPAN, Math.sqrt(width * height / MAX_CELLS)) * kmPerDegree;
    km = Math.ceil(needed / 8) * 8;
    while (!fits(km)) km += 8;
  }
  const cell = km / kmPerDegree;
  const frame = {
    lng0,
    lat0,
    cell,
    cols: Math.max(2, Math.ceil(width / cell)),
    rows: Math.max(2, Math.ceil(height / cell)),
    km
  };
  if (flat) {
    frame.flat = true;
    frame.scale = kmPerDegree;
  }
  return frame;
};
var projectors = /* @__PURE__ */ new WeakMap();
var projectorOf = (frame) => {
  const made = projectors.get(frame);
  if (made) return made;
  const { lng0, cell, cols, rows } = frame;
  const y0 = latToY(frame.lat0);
  const middle = lng0 + cols * cell / 2;
  const rowKm = new Float64Array(rows);
  for (let row = 0; row < rows; row += 1) {
    rowKm[row] = frame.flat ? cell * (frame.scale || KM_PER_DEGREE) : cell * KM_PER_DEGREE * Math.cos(yToLat(y0 + (row + 0.5) * cell) * RAD);
  }
  const projector = {
    rowKm,
    // Cell units of a stored point; outside the frame it is simply out of range.
    toCell: (lng, lat) => [(unwrapLng(lng, middle) - lng0) / cell, (latToY(lat) - y0) / cell],
    // The stored point of a place in cell units. Its longitude is not wrapped.
    toLngLat: (x, y) => [lng0 + x * cell, yToLat(y0 + y * cell)],
    // One cell's side in kilometres at height y.
    kmAt: (y) => rowKm[y < 0 ? 0 : y >= rows ? rows - 1 : Math.floor(y)]
  };
  projectors.set(frame, projector);
  return projector;
};
var frameBounds = (frame) => {
  const { toLngLat } = projectorOf(frame);
  const [west, south] = toLngLat(0, 0);
  const [east, north] = toLngLat(frame.cols, frame.rows);
  return { west, south, east, north };
};
var cellIndexAt = (frame, x, y) => {
  if (!(x >= 0) || !(y >= 0) || x >= frame.cols || y >= frame.rows) return -1;
  return Math.floor(y) * frame.cols + Math.floor(x);
};

// src/runtime/fronts/arena.js
var text3 = (value) => String(value ?? "").trim();
var polygonsOf = (geometry) => {
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates)) return [];
  if (geometry.type === "Polygon") return [coordinates];
  if (geometry.type === "MultiPolygon") return coordinates;
  return [];
};
var ringLongitudes = (ring, middle) => {
  const count = ring.length;
  const longitudes = new Float64Array(count);
  let west = Infinity;
  let east = -Infinity;
  for (let index = 0; index < count; index += 1) {
    const lng = Number(ring[index]?.[0]) || 0;
    longitudes[index] = lng;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  }
  if (east - west > 180) {
    let runWest = longitudes[0];
    let runEast = longitudes[0];
    const run = new Float64Array(count);
    run[0] = longitudes[0];
    for (let index = 1; index < count; index += 1) {
      const step = longitudes[index] - longitudes[index - 1];
      run[index] = run[index - 1] + step - Math.round(step / 360) * 360;
      if (run[index] < runWest) runWest = run[index];
      if (run[index] > runEast) runEast = run[index];
    }
    if (runEast - runWest < east - west) {
      longitudes.set(run);
      west = runWest;
      east = runEast;
    }
  }
  const turn = Math.round(((west + east) / 2 - middle) / 360) * 360;
  if (turn !== 0) for (let index = 0; index < count; index += 1) longitudes[index] -= turn;
  return longitudes;
};
var projectRegion = (frame, region) => {
  const { lng0, cell, cols } = frame;
  const y0 = latToY(frame.lat0);
  const middle = lng0 + cols * cell / 2;
  const polygons = [];
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const polygon of polygonsOf(region?.geometry)) {
    const rings = [];
    for (const ring of Array.isArray(polygon) ? polygon : []) {
      if (!Array.isArray(ring) || ring.length < 3) continue;
      const longitudes = ringLongitudes(ring, middle);
      const flat = new Float64Array(ring.length * 2);
      for (let index = 0; index < ring.length; index += 1) {
        const x = (longitudes[index] - lng0) / cell;
        const y = (latToY(ring[index]?.[1]) - y0) / cell;
        flat[index * 2] = x;
        flat[index * 2 + 1] = y;
        if (x < west) west = x;
        if (x > east) east = x;
        if (y < south) south = y;
        if (y > north) north = y;
      }
      rings.push(flat);
    }
    if (rings.length > 0) polygons.push(rings);
  }
  return { polygons, west, east, south, north };
};
var boxMayReach = (frame, bbox) => {
  if (!Array.isArray(bbox) || bbox.length < 4) return true;
  const west = Number(bbox[0]);
  let east = Number(bbox[2]);
  const south = Number(bbox[1]);
  const north = Number(bbox[3]);
  if (![west, east, south, north].every(Number.isFinite)) return true;
  if (east < west) east += 360;
  const y0 = latToY(frame.lat0);
  if ((latToY(north) - y0) / frame.cell < 0 || (latToY(south) - y0) / frame.cell > frame.rows) return false;
  const width = frame.cols * frame.cell;
  const middle = frame.lng0 + width / 2;
  const turn = Math.round(((west + east) / 2 - middle) / 360) * 360;
  return east - turn >= frame.lng0 && west - turn <= frame.lng0 + width;
};
var areaOfRings = (rings) => {
  let total = 0;
  for (let ringIndex = 0; ringIndex < rings.length; ringIndex += 1) {
    const flat = rings[ringIndex];
    const count = flat.length / 2;
    let twice = 0;
    for (let index = 0; index < count; index += 1) {
      const next = index + 1 === count ? 0 : index + 1;
      twice += flat[index * 2] * flat[next * 2 + 1] - flat[next * 2] * flat[index * 2 + 1];
    }
    total += (ringIndex === 0 ? 1 : -1) * Math.abs(twice) / 2;
  }
  return Math.max(0, total);
};
var fillPolygon = (rings, grid, width, height, originX, originY, scale, value) => {
  const lines = /* @__PURE__ */ new Map();
  let lowest = height;
  let highest = -1;
  for (const flat of rings) {
    const count = flat.length / 2;
    for (let index = 0; index < count; index += 1) {
      const next = index + 1 === count ? 0 : index + 1;
      const fromX = (flat[index * 2] - originX) * scale;
      const fromY = (flat[index * 2 + 1] - originY) * scale;
      const toX = (flat[next * 2] - originX) * scale;
      const toY = (flat[next * 2 + 1] - originY) * scale;
      if (fromY === toY) continue;
      const low = fromY < toY ? fromY : toY;
      const high = fromY < toY ? toY : fromY;
      const first = Math.max(0, Math.ceil(low - 0.5));
      const last = Math.min(height - 1, Math.ceil(high - 0.5) - 1);
      const slope = (toX - fromX) / (toY - fromY);
      for (let line = first; line <= last; line += 1) {
        let crossings = lines.get(line);
        if (!crossings) {
          crossings = [];
          lines.set(line, crossings);
          if (line < lowest) lowest = line;
          if (line > highest) highest = line;
        }
        crossings.push(fromX + (line + 0.5 - fromY) * slope);
      }
    }
  }
  let filled = 0;
  for (let line = lowest; line <= highest; line += 1) {
    const crossings = lines.get(line);
    if (!crossings || crossings.length < 2) continue;
    crossings.sort((a, b) => a - b);
    const base = line * width;
    for (let pair = 0; pair + 1 < crossings.length; pair += 2) {
      const first = Math.max(0, Math.ceil(crossings[pair] - 0.5));
      const last = Math.min(width - 1, Math.ceil(crossings[pair + 1] - 0.5) - 1);
      for (let sample = first; sample <= last; sample += 1) {
        if (grid[base + sample] !== 0) continue;
        grid[base + sample] = value;
        filled += 1;
      }
    }
  }
  return filled;
};
var speedOfType = (type) => {
  if (!type) return 1;
  const speed = Number(type.pathfindingSpeed);
  if (type.passable === false || speed === 0 || isWaterType(type)) return 0;
  if (!Number.isFinite(speed)) return 1;
  return Math.min(TERRAIN_SPEED_MAX, Math.max(TERRAIN_SPEED_MIN, speed));
};
var citiesInFrame = (frame, cities) => {
  const { toCell } = projectorOf(frame);
  const placed = [];
  for (const city of Array.isArray(cities) ? cities : []) {
    const name = text3(city?.name);
    const lng = Number(city?.lng);
    const lat = Number(city?.lat);
    if (!name || !Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const [x, y] = toCell(lng, lat);
    const cell = cellIndexAt(frame, x, y);
    if (cell < 0) continue;
    placed.push({ name, x, y, cell, population: Math.max(0, Number(city.population) || 0), capital: city.capital === true });
  }
  return placed;
};
var terrainLevels = (frame, terrain) => {
  const areas = (Array.isArray(terrain?.areas) ? terrain.areas : []).filter((area) => Number(area?.level) > 0 && Array.isArray(area.rings)).sort((a, b) => b.level - a.level);
  if (areas.length === 0) return null;
  const { cols, rows } = frame;
  const levels = new Uint8Array(cols * rows);
  let filled = 0;
  for (const area of areas) {
    const shape = projectRegion(frame, { geometry: { type: "Polygon", coordinates: area.rings } });
    if (shape.polygons.length === 0 || shape.east < 0 || shape.west > cols || shape.north < 0 || shape.south > rows) continue;
    for (const rings of shape.polygons) filled += fillPolygon(rings, levels, cols, rows, 0, 0, 1, Math.min(10, Math.round(area.level)));
  }
  return filled > 0 ? levels : null;
};
var rasterizeArena = (frame, regions, { regionTypes = [], cities = [], terrain = null, frozen = null } = {}) => {
  const { cols, rows } = frame;
  const size = cols * rows;
  const speedByType = /* @__PURE__ */ new Map();
  for (const type of Array.isArray(regionTypes) ? regionTypes : []) {
    const id = text3(type?.id);
    if (id && !speedByType.has(id)) speedByType.set(id, speedOfType(type));
  }
  const region = new Uint16Array(size);
  const ids = [""];
  const names = [""];
  const indexOf = /* @__PURE__ */ new Map();
  const cells = [0];
  const area = [0];
  const outside = [0];
  const regionSpeed = [0];
  for (const source of Array.isArray(regions) ? regions : []) {
    const id = text3(source?.id);
    if (!id || indexOf.has(id) || ids.length > 65535 || !boxMayReach(frame, source.bbox)) continue;
    const shape = projectRegion(frame, source);
    if (shape.polygons.length === 0 || shape.east < 0 || shape.west > cols || shape.north < 0 || shape.south > rows) continue;
    const value = ids.length;
    let filled = 0;
    let whole = 0;
    for (const rings of shape.polygons) {
      filled += fillPolygon(rings, region, cols, rows, 0, 0, 1, value);
      whole += areaOfRings(rings);
    }
    if (filled === 0) continue;
    const cut = shape.west < 0 || shape.south < 0 || shape.east > cols || shape.north > rows;
    indexOf.set(id, value);
    ids.push(id);
    names.push(text3(source.name) || id);
    cells.push(filled);
    area.push(cut ? Math.max(whole, filled) : filled);
    outside.push(cut ? Math.max(0, whole - filled) : 0);
    const typeId = text3(source.typeId);
    regionSpeed.push(speedByType.has(typeId) ? speedByType.get(typeId) : 1);
  }
  const count = ids.length;
  const speed = new Float32Array(size);
  const sumX = new Float64Array(count);
  const sumY = new Float64Array(count);
  const levels = terrainLevels(frame, terrain);
  const placed = citiesInFrame(frame, cities);
  const cityCells = levels ? new Set(placed.map((city) => city.cell)) : null;
  const frozenIds = Array.isArray(frozen) && frozen.length > 0 ? new Set(frozen) : null;
  const iced = frozenIds ? new Uint8Array(size) : null;
  let icy = 0;
  let rough = 0;
  let fingerprint = 0;
  for (let index = 0; index < size; index += 1) {
    let value = region[index];
    let level = levels && value !== 0 ? levels[index] : 0;
    if (level >= 10 && cityCells.has(index)) level = 9;
    if (level >= 10 && regionSpeed[value] > 0) {
      cells[value] -= 1;
      area[value] -= 1;
      region[index] = 0;
      value = 0;
    }
    if (level > 0) rough = Math.imul(rough ^ index * 16 + level, 2246822507) + 1;
    fingerprint = Math.imul(fingerprint ^ value, 2246822507) + index;
    fingerprint = fingerprint << 13 | fingerprint >>> 19;
    if (value === 0) continue;
    if (iced && regionSpeed[value] === 0 && frozenIds.has(ids[value])) {
      iced[index] = 1;
      icy = Math.imul(icy ^ index, 2246822507) + 7;
      speed[index] = ICE_SPEED;
      sumX[value] += index % cols + 0.5;
      sumY[value] += Math.floor(index / cols) + 0.5;
      continue;
    }
    speed[index] = level > 0 ? regionSpeed[value] * (10 - level) / 10 : regionSpeed[value];
    sumX[value] += index % cols + 0.5;
    sumY[value] += Math.floor(index / cols) + 0.5;
  }
  const centreX = new Float64Array(count);
  const centreY = new Float64Array(count);
  for (let value = 1; value < count; value += 1) {
    centreX[value] = cells[value] > 0 ? sumX[value] / cells[value] : 0;
    centreY[value] = cells[value] > 0 ? sumY[value] / cells[value] : 0;
  }
  return {
    // (Its rough ground is in the key only where there is some: an arena without any is the one it always was.)
    key: hashKey([cols, rows, fingerprint >>> 0, ids.join(""), regionSpeed.join(","), ...levels ? [rough >>> 0] : [], ...icy !== 0 ? [`ice${icy >>> 0}`] : []]),
    // The cells of frozen water (1), where any water is frozen this turn.
    iced: icy !== 0 ? iced : null,
    frame,
    cols,
    rows,
    size,
    region,
    ids,
    names,
    indexOf,
    cells: Int32Array.from(cells),
    area: Float64Array.from(area),
    outside: Float64Array.from(outside),
    speed,
    regionSpeed: Float64Array.from(regionSpeed),
    centreX,
    centreY,
    cities: placed
  };
};
var cacheKey = (map, frame, regionTypes) => [
  text3(map?.key),
  frame.lng0,
  frame.lat0,
  frame.cell,
  frame.cols,
  frame.rows,
  frame.flat ? frame.scale : "",
  hashKey((Array.isArray(regionTypes) ? regionTypes : []).map((type) => `${text3(type?.id)}:${speedOfType(type)}`)),
  // (And its rough ground, where the scenario drew some: runtime/warGeography.js terrainAreas; and its frozen water.)
  text3(map?.terrain?.key),
  Array.isArray(map?.frozen) && map.frozen.length > 0 ? hashKey(map.frozen.slice().sort()) : ""
].join("|");
var arenaFor = (cache, map, frame, regionTypes) => {
  const key = text3(map?.key) && cache instanceof Map ? cacheKey(map, frame, regionTypes) : "";
  const known = key ? cache.get(key) : null;
  if (known) return known;
  if (!Array.isArray(map?.regions)) return null;
  const arena = rasterizeArena(frame, map.regions, { regionTypes, cities: map.cities, terrain: map.terrain ?? null, frozen: map.frozen ?? null });
  if (key) cache.set(key, arena);
  return arena;
};

// src/runtime/fronts/field.js
var LEAST = 1 / 1024;
var ROUGH = 0.5;
var createField = (arena) => {
  const { cols, rows, size } = arena;
  return {
    arena,
    cols,
    rows,
    size,
    play: new Uint8Array(size),
    holders: new Uint8Array(size).fill(HOLDER_WALL),
    phi: new Float64Array(size),
    // For a wall cell beside the play, the cell in play whose distance it
    // borrows so the line can be traced up to the wall; itself for a cell in
    // play; -1 for a wall with no play beside it.
    ghost: new Int32Array(size).fill(-1),
    // The cells written since distances were last worked out again.
    changed: [],
    marked: new Uint8Array(size),
    // For the map, which paints the ground a side has taken in the colour of
    // the member whose troops took it: that member's place in its side's
    // list, a cell each, and the part of the day (0 to 1) a cell last changed
    // hands at. Working state: neither is saved.
    painter: new Uint8Array(size),
    when: new Float32Array(size).fill(1),
    // Counts every write, and every change of holder: what is worked out from
    // the field (the contour, the pockets) is good while its count stands.
    edits: 0,
    turns: 0,
    contour: null,
    contourEdits: -1,
    pieceFrom: new Int32Array(size * 2).fill(-1),
    pieceTo: new Int32Array(size * 2).fill(-1)
  };
};
var sideSign = (holder) => holder === HOLDER_SIDE_A ? -1 : 1;
var refreshGhosts = (field) => {
  const { cols, rows, play, ghost } = field;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      if (play[index]) {
        ghost[index] = index;
        continue;
      }
      const south = row > 0;
      const north = row < rows - 1;
      const west = col > 0;
      const east = col < cols - 1;
      ghost[index] = south && play[index - cols] ? index - cols : west && play[index - 1] ? index - 1 : east && play[index + 1] ? index + 1 : north && play[index + cols] ? index + cols : south && west && play[index - cols - 1] ? index - cols - 1 : south && east && play[index - cols + 1] ? index - cols + 1 : north && west && play[index + cols - 1] ? index + cols - 1 : north && east && play[index + cols + 1] ? index + cols + 1 : -1;
    }
  }
};
var markChanged = (field, index) => {
  if (field.marked[index]) return;
  field.marked[index] = 1;
  field.changed.push(index);
};
var write = (field, index, value, painter = 0, when = 1) => {
  field.phi[index] = value;
  field.edits += 1;
  markChanged(field, index);
  const holder = value < 0 ? HOLDER_SIDE_A : HOLDER_SIDE_B;
  if (field.holders[index] !== holder) {
    field.holders[index] = holder;
    field.painter[index] = painter;
    field.when[index] = when;
    field.turns += 1;
  }
};
var setGround = (field, sideOfRegion, iceSide = null) => {
  const { arena, size, play, holders, phi } = field;
  let changed = false;
  for (let index = 0; index < size; index += 1) {
    const side = arena.speed[index] > 0 ? iceSide && arena.iced && arena.iced[index] === 1 ? iceSide[index] : sideOfRegion[arena.region[index]] : -1;
    if (side === 0 || side === 1) {
      if (play[index]) continue;
      play[index] = 1;
      holders[index] = side;
      phi[index] = sideSign(side) * ROUGH;
      markChanged(field, index);
    } else {
      if (!play[index] && holders[index] === HOLDER_WALL) continue;
      play[index] = 0;
      holders[index] = HOLDER_WALL;
      phi[index] = 0;
      markChanged(field, index);
    }
    changed = true;
  }
  if (changed) {
    field.edits += 1;
    field.turns += 1;
    refreshGhosts(field);
  }
  return changed;
};
var CASES = [
  [],
  [0, 3],
  [1, 0],
  [1, 3],
  [2, 1],
  null,
  [2, 0],
  [2, 3],
  [3, 2],
  [0, 2],
  null,
  [1, 2],
  [3, 1],
  [0, 1],
  [3, 0],
  []
];
var SADDLE_5 = [[0, 1, 2, 3], [0, 3, 2, 1]];
var SADDLE_10 = [[3, 0, 1, 2], [1, 0, 3, 2]];
var traceContour = (field) => {
  if (field.contour && field.contourEdits === field.edits) return field.contour;
  const { cols, rows, phi, play, holders, ghost, pieceFrom, pieceTo } = field;
  const fromX = [];
  const fromY = [];
  const toX = [];
  const toY = [];
  const startEdge = [];
  const endEdge = [];
  const square = [];
  const edgeX = [0, 0, 0, 0];
  const edgeY = [0, 0, 0, 0];
  const edgeId = [0, 0, 0, 0];
  const edgeReal = [false, false, false, false];
  const used = [];
  const addPiece = (x0, y0, x1, y1, from2, to2, squareIndex) => {
    const piece = fromX.length;
    fromX.push(x0);
    fromY.push(y0);
    toX.push(x1);
    toY.push(y1);
    startEdge.push(from2);
    endEdge.push(to2);
    square.push(squareIndex);
    if (from2 >= 0) {
      pieceFrom[from2] = piece;
      used.push(from2);
    }
    if (to2 >= 0) {
      pieceTo[to2] = piece;
      used.push(to2);
    }
  };
  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < cols - 1; col += 1) {
      const sw = row * cols + col;
      const se = sw + 1;
      const nw = sw + cols;
      const ne = nw + 1;
      const southReal = holders[sw] + holders[se] === 1;
      const eastReal = holders[se] + holders[ne] === 1;
      const northReal = holders[nw] + holders[ne] === 1;
      const westReal = holders[sw] + holders[nw] === 1;
      if (!southReal && !eastReal && !northReal && !westReal) continue;
      const valueSw = phi[ghost[sw]];
      const valueSe = phi[ghost[se]];
      const valueNe = phi[ghost[ne]];
      const valueNw = phi[ghost[nw]];
      const shape = (valueSw < 0 ? 1 : 0) | (valueSe < 0 ? 2 : 0) | (valueNe < 0 ? 4 : 0) | (valueNw < 0 ? 8 : 0);
      let pairs = CASES[shape];
      if (pairs === null) {
        const joined = valueSw + valueSe + valueNe + valueNw < 0 ? 0 : 1;
        pairs = (shape === 5 ? SADDLE_5 : SADDLE_10)[joined];
      }
      if (pairs.length === 0) continue;
      edgeX[0] = col + 0.5 + valueSw / (valueSw - valueSe);
      edgeY[0] = row + 0.5;
      edgeId[0] = sw * 2;
      edgeReal[0] = southReal;
      edgeX[1] = col + 1.5;
      edgeY[1] = row + 0.5 + valueSe / (valueSe - valueNe);
      edgeId[1] = se * 2 + 1;
      edgeReal[1] = eastReal;
      edgeX[2] = col + 0.5 + valueNw / (valueNw - valueNe);
      edgeY[2] = row + 1.5;
      edgeId[2] = nw * 2;
      edgeReal[2] = northReal;
      edgeX[3] = col + 0.5;
      edgeY[3] = row + 0.5 + valueSw / (valueSw - valueNw);
      edgeId[3] = sw * 2 + 1;
      edgeReal[3] = westReal;
      const whole = play[sw] && play[se] && play[ne] && play[nw];
      for (let pair = 0; pair < pairs.length; pair += 2) {
        const from2 = pairs[pair];
        const to2 = pairs[pair + 1];
        if (!edgeReal[from2] && !edgeReal[to2]) continue;
        const x0 = edgeX[from2];
        const y0 = edgeY[from2];
        const x1 = edgeX[to2];
        const y1 = edgeY[to2];
        if (whole) {
          addPiece(x0, y0, x1, y1, edgeId[from2], edgeId[to2], sw);
          continue;
        }
        const middleX = col + 1;
        const middleY = row + 1;
        let first = (middleX - x0) / (x1 - x0);
        let second = (middleY - y0) / (y1 - y0);
        if (!(first > 0 && first < 1)) first = 1;
        if (!(second > 0 && second < 1)) second = 1;
        if (second < first) {
          const swap = first;
          first = second;
          second = swap;
        }
        const stops = [0, first, second, 1];
        const keepRun = (begin, end) => {
          const startsReal = begin === 0 && edgeReal[from2];
          const endsReal = end === 1 && edgeReal[to2];
          if (!startsReal && !endsReal) return;
          addPiece(
            x0 + (x1 - x0) * begin,
            y0 + (y1 - y0) * begin,
            x0 + (x1 - x0) * end,
            y0 + (y1 - y0) * end,
            startsReal ? edgeId[from2] : -1,
            endsReal ? edgeId[to2] : -1,
            sw
          );
        };
        let runStart = -1;
        let runEnd = 0;
        for (let part = 0; part < 3; part += 1) {
          const begin = stops[part];
          const end = stops[part + 1];
          if (!(end > begin)) continue;
          const middle = (begin + end) / 2;
          const east = x0 + (x1 - x0) * middle >= middleX;
          const north = y0 + (y1 - y0) * middle >= middleY;
          if (play[north ? east ? ne : nw : east ? se : sw] === 1) {
            if (runStart < 0) runStart = begin;
            runEnd = end;
          } else if (runStart >= 0) {
            keepRun(runStart, runEnd);
            runStart = -1;
          }
        }
        if (runStart >= 0) keepRun(runStart, runEnd);
      }
    }
  }
  const pieces = fromX.length;
  const strands = [];
  const x = [];
  const y = [];
  const cellA = [];
  const cellB = [];
  const from = [];
  const to = [];
  const segmentSquare = [];
  const taken = new Uint8Array(pieces);
  const pushVertex = (px, py, edge) => {
    x.push(px);
    y.push(py);
    if (edge < 0) {
      cellA.push(-1);
      cellB.push(-1);
      return;
    }
    const low = edge >> 1;
    const high = low + ((edge & 1) === 1 ? cols : 1);
    cellA.push(holders[low] === HOLDER_SIDE_A ? low : high);
    cellB.push(holders[low] === HOLDER_SIDE_A ? high : low);
  };
  const follow = (start, closed) => {
    const first = x.length;
    pushVertex(fromX[start], fromY[start], startEdge[start]);
    let piece = start;
    while (piece >= 0 && !taken[piece]) {
      taken[piece] = 1;
      const edge = endEdge[piece];
      const next = edge >= 0 ? pieceFrom[edge] : -1;
      const last = closed && next === start;
      from.push(x.length - 1);
      segmentSquare.push(square[piece]);
      if (last) {
        to.push(first);
        break;
      }
      to.push(x.length);
      pushVertex(toX[piece], toY[piece], edge);
      piece = next;
    }
    strands.push({ closed, first, count: x.length - first });
  };
  for (let piece = 0; piece < pieces; piece += 1) {
    if (!taken[piece] && (startEdge[piece] < 0 || pieceTo[startEdge[piece]] < 0)) follow(piece, false);
  }
  for (let piece = 0; piece < pieces; piece += 1) {
    if (!taken[piece]) follow(piece, true);
  }
  for (const edge of used) {
    pieceFrom[edge] = -1;
    pieceTo[edge] = -1;
  }
  field.contour = {
    strands,
    x: Float64Array.from(x),
    y: Float64Array.from(y),
    cellA: Int32Array.from(cellA),
    cellB: Int32Array.from(cellB),
    segments: from.length,
    from: Int32Array.from(from),
    to: Int32Array.from(to),
    square: Int32Array.from(segmentSquare),
    heads: null,
    nexts: null
  };
  field.contourEdits = field.edits;
  return field.contour;
};
var bucket = (field, contour) => {
  if (contour.heads) return;
  const heads = new Int32Array(field.size).fill(-1);
  const nexts = new Int32Array(contour.segments);
  for (let segment = contour.segments - 1; segment >= 0; segment -= 1) {
    nexts[segment] = heads[contour.square[segment]];
    heads[contour.square[segment]] = segment;
  }
  contour.heads = heads;
  contour.nexts = nexts;
};
var nearest = { distance: Infinity, segment: -1, along: 0 };
var nearestOnContour = (field, contour, px, py, reach) => {
  bucket(field, contour);
  const { cols, rows } = field;
  const { heads, nexts, x, y, from, to } = contour;
  const col = Math.floor(px - 0.5);
  const row = Math.floor(py - 0.5);
  let best = Infinity;
  let bestSegment = -1;
  let bestAlong = 0;
  const rings = Math.ceil(reach);
  for (let ring = 0; ring <= rings; ring += 1) {
    if (best < ring - 1) break;
    for (let dy = -ring; dy <= ring; dy += 1) {
      const squareRow = row + dy;
      if (squareRow < 0 || squareRow >= rows) continue;
      const edge = dy === -ring || dy === ring;
      for (let dx = -ring; dx <= ring; dx += edge ? 1 : Math.max(1, ring * 2)) {
        const squareCol = col + dx;
        if (squareCol < 0 || squareCol >= cols) continue;
        for (let segment = heads[squareRow * cols + squareCol]; segment >= 0; segment = nexts[segment]) {
          const ax = x[from[segment]];
          const ay = y[from[segment]];
          const bx = x[to[segment]] - ax;
          const by = y[to[segment]] - ay;
          const length = bx * bx + by * by;
          let along = length > 0 ? ((px - ax) * bx + (py - ay) * by) / length : 0;
          along = along < 0 ? 0 : along > 1 ? 1 : along;
          const ox = px - (ax + bx * along);
          const oy = py - (ay + by * along);
          const distance = Math.sqrt(ox * ox + oy * oy);
          if (distance < best || distance === best && segment < bestSegment) {
            best = distance;
            bestSegment = segment;
            bestAlong = along;
          }
        }
      }
    }
  }
  if (best > reach) {
    nearest.distance = Infinity;
    nearest.segment = -1;
    nearest.along = 0;
    return Infinity;
  }
  nearest.distance = best;
  nearest.segment = bestSegment;
  nearest.along = bestAlong;
  return best;
};
var takeCapsule = (field, side, px, py, qx, qy, radiusP, radiusQ, how = null) => {
  const { cols, rows, play, phi } = field;
  const claims = how?.claims ?? null;
  const strength = how?.strength ?? 0;
  const painterP = how?.painter ?? 0;
  const painterQ = how?.painterQ ?? painterP;
  const from = how?.from ?? 1;
  const span = how?.span ?? 0;
  const spare = how?.spare ?? null;
  const keep = how?.keep ?? null;
  const reach = Math.max(radiusP, radiusQ) + EDIT_MARGIN_CELLS;
  const col0 = Math.max(0, Math.floor(Math.min(px, qx) - reach));
  const col1 = Math.min(cols - 1, Math.floor(Math.max(px, qx) + reach));
  const row0 = Math.max(0, Math.floor(Math.min(py, qy) - reach));
  const row1 = Math.min(rows - 1, Math.floor(Math.max(py, qy) + reach));
  const sx = qx - px;
  const sy = qy - py;
  const length = sx * sx + sy * sy;
  for (let row = row0; row <= row1; row += 1) {
    const cy = row + 0.5;
    for (let col = col0; col <= col1; col += 1) {
      const index = row * cols + col;
      if (!play[index] || keep && keep[index]) continue;
      const cx = col + 0.5;
      let along = length > 0 ? ((cx - px) * sx + (cy - py) * sy) / length : 0;
      along = along < 0 ? 0 : along > 1 ? 1 : along;
      const ox = cx - (px + sx * along);
      const oy = cy - (py + sy * along);
      let distance = Math.sqrt(ox * ox + oy * oy) - (radiusP + (radiusQ - radiusP) * along);
      if (spare) {
        for (let at = 0; at < spare.length; at += 3) {
          const dx = cx - spare[at];
          const dy = cy - spare[at + 1];
          const within2 = spare[at + 2] - Math.sqrt(dx * dx + dy * dy);
          if (within2 > distance) distance = within2;
          if (within2 >= 0 && distance < LEAST) distance = LEAST;
        }
      }
      if (distance > EDIT_MARGIN_CELLS) continue;
      if (side === HOLDER_SIDE_A) {
        if (claims && distance < 0 && !(claims.stamp[index] === claims.moment && claims.power[index] >= strength)) {
          claims.stamp[index] = claims.moment;
          claims.power[index] = strength;
        }
        if (distance < phi[index]) write(field, index, distance, along < 0.5 ? painterP : painterQ, from + span * along);
      } else if (-distance > phi[index]) {
        if (claims && claims.stamp[index] === claims.moment && claims.power[index] >= strength) continue;
        write(field, index, -distance, along < 0.5 ? painterP : painterQ, from + span * along);
      }
    }
  }
};
var takeCells = (field, side, cells, painter = 0) => {
  const { cols, rows, play, phi, holders } = field;
  const inside = sideSign(side) * ROUGH;
  for (let position = 0; position < cells.length; position += 1) {
    const index = cells[position];
    if (!play[index]) continue;
    if (side === HOLDER_SIDE_A ? phi[index] > inside : phi[index] < inside) {
      write(field, index, inside, holders[index] === side ? 0 : typeof painter === "function" ? painter(index) : painter);
    }
  }
  for (let position = 0; position < cells.length; position += 1) {
    const index = cells[position];
    if (!play[index]) continue;
    const col = index % cols;
    const row = (index - col) / cols;
    for (let step = 0; step < 4; step += 1) {
      const neighbour = step === 0 ? row > 0 ? index - cols : -1 : step === 1 ? col > 0 ? index - 1 : -1 : step === 2 ? col < cols - 1 ? index + 1 : -1 : row < rows - 1 ? index + cols : -1;
      if (neighbour < 0 || !play[neighbour] || holders[neighbour] === side) continue;
      if (side === HOLDER_SIDE_A ? phi[neighbour] > ROUGH : phi[neighbour] < -ROUGH) write(field, neighbour, -inside);
    }
  }
};
var touchesOtherSide = (field, index) => {
  const { cols, rows, holders } = field;
  const want = 1 - holders[index];
  const col = index % cols;
  const row = (index - col) / cols;
  return row > 0 && holders[index - cols] === want || col > 0 && holders[index - 1] === want || col < cols - 1 && holders[index + 1] === want || row < rows - 1 && holders[index + cols] === want;
};
var distanceFor = (field, contour, index) => {
  const col = index % field.cols;
  const found = nearestOnContour(field, contour, col + 0.5, (index - col) / field.cols + 0.5, REDISTANCE_REACH_CELLS);
  const distance = found === Infinity ? FAR_CELLS : found < LEAST ? LEAST : found;
  return sideSign(field.holders[index]) * distance;
};
var redistance = (field) => {
  const { cols, rows, play, phi, changed, marked } = field;
  if (changed.length === 0) return;
  const contour = traceContour(field);
  field.seen ??= new Uint8Array(field.size);
  const seen = field.seen.fill(0);
  for (let position = 0; position < changed.length; position += 1) {
    const centre = changed[position];
    const col = centre % cols;
    const row = (centre - col) / cols;
    const row1 = Math.min(rows - 1, row + REDISTANCE_NEAR_CELLS);
    const col1 = Math.min(cols - 1, col + REDISTANCE_NEAR_CELLS);
    for (let near = Math.max(0, row - REDISTANCE_NEAR_CELLS); near <= row1; near += 1) {
      for (let index = near * cols + Math.max(0, col - REDISTANCE_NEAR_CELLS); index <= near * cols + col1; index += 1) {
        if (seen[index]) continue;
        seen[index] = 1;
        if (!play[index] || touchesOtherSide(field, index)) continue;
        phi[index] = distanceFor(field, contour, index);
      }
    }
  }
  for (let position = 0; position < changed.length; position += 1) marked[changed[position]] = 0;
  changed.length = 0;
  field.edits += 1;
  field.contourEdits = field.edits;
};
var rebuildDistances = (field, keepLine = false) => {
  const { cols, rows, size, play, phi, holders, changed, marked } = field;
  const contour = traceContour(field);
  const near = new Uint8Array(size);
  const reach = REDISTANCE_REACH_CELLS;
  for (let segment = 0; segment < contour.segments; segment += 1) {
    const square = contour.square[segment];
    const col = square % cols;
    const row = (square - col) / cols;
    const row1 = Math.min(rows - 1, row + reach + 1);
    const col1 = Math.min(cols - 1, col + reach + 1);
    for (let at = Math.max(0, row - reach); at <= row1; at += 1) near.fill(1, at * cols + Math.max(0, col - reach), at * cols + col1 + 1);
  }
  const next = new Float64Array(size);
  for (let index = 0; index < size; index += 1) {
    if (!play[index]) continue;
    next[index] = !near[index] ? sideSign(holders[index]) * FAR_CELLS : keepLine && touchesOtherSide(field, index) ? phi[index] : distanceFor(field, contour, index);
  }
  phi.set(next);
  for (let position = 0; position < changed.length; position += 1) marked[changed[position]] = 0;
  changed.length = 0;
  field.edits += 1;
};
var resampleField = (old, arena, sideOfRegion, iceSide = null) => {
  const field = createField(arena);
  setGround(field, sideOfRegion, iceSide);
  const { cols, size, play, holders, phi } = field;
  const { toLngLat } = projectorOf(arena.frame);
  const { toCell } = projectorOf(old.arena.frame);
  const scale = old.arena.frame.cell / arena.frame.cell;
  for (let index = 0; index < size; index += 1) {
    if (!play[index]) continue;
    const col = index % cols;
    const [lng, lat] = toLngLat(col + 0.5, (index - col) / cols + 0.5);
    const [x, y] = toCell(lng, lat);
    const value = readField(old, x, y);
    if (value !== 0) holders[index] = value < 0 ? HOLDER_SIDE_A : HOLDER_SIDE_B;
    phi[index] = value !== 0 ? value * scale : sideSign(holders[index]) * ROUGH;
  }
  field.changed.length = 0;
  field.marked.fill(0);
  field.edits += 1;
  field.turns += 1;
  rebuildDistances(field, true);
  return field;
};
var readField = (field, x, y) => {
  const { cols, rows, play, phi } = field;
  if (!(x >= 0) || !(y >= 0) || x >= cols || y >= rows) return 0;
  const own = Math.floor(y) * cols + Math.floor(x);
  if (!play[own]) return 0;
  const col = Math.floor(x - 0.5);
  const row = Math.floor(y - 0.5);
  if (col < 0 || row < 0 || col >= cols - 1 || row >= rows - 1) return phi[own];
  const sw = row * cols + col;
  if (!play[sw] || !play[sw + 1] || !play[sw + cols] || !play[sw + cols + 1]) return phi[own];
  const fx = x - 0.5 - col;
  const fy = y - 0.5 - row;
  const value = (phi[sw] * (1 - fx) + phi[sw + 1] * fx) * (1 - fy) + (phi[sw + cols] * (1 - fx) + phi[sw + cols + 1] * fx) * fy;
  return value !== 0 ? value : phi[own];
};
var nearestHeld = (field, side, x, y, reach) => {
  const { cols, rows, holders } = field;
  const col = Math.floor(x);
  const row = Math.floor(y);
  let best = -1;
  let bestDistance = Infinity;
  for (let ring = 0; ring <= reach; ring += 1) {
    if (ring > 1 && bestDistance < (ring - 1) * (ring - 1)) break;
    for (let dy = -ring; dy <= ring; dy += 1) {
      const at = row + dy;
      if (at < 0 || at >= rows) continue;
      const edge = dy === -ring || dy === ring;
      for (let dx = -ring; dx <= ring; dx += edge ? 1 : Math.max(1, ring * 2)) {
        const across = col + dx;
        if (across < 0 || across >= cols || holders[at * cols + across] !== side) continue;
        const ox = across + 0.5 - x;
        const oy = at + 0.5 - y;
        const distance = ox * ox + oy * oy;
        const index = at * cols + across;
        if (distance < bestDistance || distance === bestDistance && index < best) {
          bestDistance = distance;
          best = index;
        }
      }
    }
  }
  return best;
};
var ownCell = (field, side, x, y) => {
  if (!(x >= 0) || !(y >= 0) || x >= field.cols || y >= field.rows) return -1;
  const cell = Math.floor(y) * field.cols + Math.floor(x);
  return field.holders[cell] === side ? cell : nearestHeld(field, side, x, y, 1);
};
var bodiesOf = (field, side) => {
  field.bodies ??= [null, null];
  const known = field.bodies[side];
  if (known && known.turns === field.turns) return known;
  const { cols, rows, size, holders } = field;
  const label = new Int32Array(size).fill(-1);
  const sizes = [];
  const queue = new Int32Array(size);
  for (let seed = 0; seed < size; seed += 1) {
    if (holders[seed] !== side || label[seed] >= 0) continue;
    const body = sizes.length;
    let head = 0;
    let tail = 0;
    queue[tail] = seed;
    tail += 1;
    label[seed] = body;
    while (head < tail) {
      const index = queue[head];
      head += 1;
      const col = index % cols;
      const row = (index - col) / cols;
      if (row > 0 && holders[index - cols] === side && label[index - cols] < 0) {
        label[index - cols] = body;
        queue[tail] = index - cols;
        tail += 1;
      }
      if (col > 0 && holders[index - 1] === side && label[index - 1] < 0) {
        label[index - 1] = body;
        queue[tail] = index - 1;
        tail += 1;
      }
      if (col < cols - 1 && holders[index + 1] === side && label[index + 1] < 0) {
        label[index + 1] = body;
        queue[tail] = index + 1;
        tail += 1;
      }
      if (row < rows - 1 && holders[index + cols] === side && label[index + cols] < 0) {
        label[index + cols] = body;
        queue[tail] = index + cols;
        tail += 1;
      }
    }
    sizes.push(tail);
  }
  const bodies = { turns: field.turns, label, sizes, count: sizes.length };
  field.bodies[side] = bodies;
  return bodies;
};
var countHolders = (field) => {
  const held = [0, 0];
  for (let index = 0; index < field.size; index += 1) {
    const holder = field.holders[index];
    if (holder === HOLDER_SIDE_A || holder === HOLDER_SIDE_B) held[holder] += 1;
  }
  return held;
};

// src/runtime/fronts/troops.js
var KIND_INFANTRY = 0;
var KIND_ARMOUR = 1;
var KIND_ARTILLERY = 2;
var STATE_HOLDING = 0;
var STATE_ADVANCING = 1;
var STATE_ENCIRCLED = 2;
var STATE_SPENT = 3;
var STATE_DUG_IN = 4;
var ATTACKS = /* @__PURE__ */ new Set(["advance", "blitz", "spearhead", "encircle", "flank"]);
var isAttack = (word) => ATTACKS.has(word);
var createTroop = ({ x = 0, y = 0, strength = 100, kind = KIND_INFANTRY, owner = 0, named = false, dig = 0, state: state2 = STATE_HOLDING } = {}) => ({
  x,
  y,
  strength,
  kind,
  owner,
  named,
  dig,
  state: state2,
  // Its side's control radius, in kilometres (sideRadiusKm).
  radiusKm: CONTROL_RADIUS_MAX_KM,
  // What it drew for this run; an even hand until it draws.
  drive: 1,
  depth: 1,
  lane: 0,
  lag: 0,
  drawn: false,
  // Which way it is going, a unit vector, or nothing yet; and the leg of
  // the way it is on, which it never goes backwards along (combat.js).
  hx: 0,
  hy: 0,
  axisX: 0,
  axisY: 0,
  // Where it stands against the line when it is raised (planLanes).
  station: null,
  // What it did today: whether it is to step, and whether it took ground.
  stepping: false,
  walkedToday: false,
  // How it stands against the attackers in reach of it this moment (combat.js).
  flank: 1,
  flankMoment: -1,
  faceX: 0,
  faceY: 0,
  movedKm: 0,
  loss: 0,
  engaged: false,
  // Dug in: stronger where it stands, and it does not move at all. (A troop
  // has one state to be saved as, and one that is dug in AND cut off is saved
  // as cut off. Its works say the rest: only a troop told to dig in has them
  // in full, so a garrison shut in is still dug in when the next run begins.)
  dug: state2 === STATE_DUG_IN || state2 === STATE_ENCIRCLED && dig >= 1,
  // The order it is carrying out, or null (way.js, move.js); which of its
  // side's standing orders that serves, for the record; and which way it
  // steps today.
  order: null,
  serves: -1,
  // On a route drawn for it: which of the route's points it was making for
  // when the last run ended (way.js giveRoute), or -1.
  next: -1,
  // Which of its side's generals it is under (command.js); -1 until it is given one.
  command: -1,
  gx: 0,
  gy: 0,
  paceFactor: 1,
  reducing: false,
  plant: false,
  // With no order: the one place it is falling back to, how long it has stood
  // on the other side's ground with nowhere to go, and whether it has slid.
  fallback: null,
  stranded: 0,
  adrift: 0,
  // The day it last gave ground because it had been got round (move.js).
  gave: -1e3,
  slid: false,
  // The day an assault sent at it was last upon it: it is fought where it
  // stands, and does not fall back from under it.
  pinned: -9,
  // The day until which it is not sent at a pocket again, or does not try to break out again.
  rested: 0,
  spent: 0,
  // Where it stands in the war: `pocket` when it fights as one surrounded,
  // which is truly cut off (`sealed`), in a besieged place, or in squeezed ground.
  body: -1,
  pocket: false,
  sealed: false,
  squeezed: false,
  besieged: false,
  supply: 1,
  // Wars and Fronts Pt.2 (dawn.js): how worn out it is, 0 to 1 (fatigue.js),
  // and what the day's conditions make of its attack, its defence and its
  // pace, set every morning: each 1 with nothing on.
  fatigue: 0,
  punch: 1,
  guard: 1,
  legs: 1,
  // Whether it attacked today (combat.js stepForward).
  fought: false
});
var isLive = (troop) => troop.strength > 0;
var liveCount = (troops) => troops.reduce((count, troop) => count + (troop.strength > 0 ? 1 : 0), 0);
var sideRadiusKm = (lineKm, troops) => Math.min(CONTROL_RADIUS_MAX_KM, Math.max(CONTROL_RADIUS_MIN_KM, CONTROL_RADIUS_OF_SPACING * lineKm / Math.max(1, troops)));
var controlRadius = (troop, kmAt) => Math.max(CONTROL_RADIUS_MIN_CELLS, troop.radiusKm / kmAt(troop.y));
var reachCells = (kmAt, y) => Math.max(REACH_MIN_CELLS, REACH_KM / kmAt(y));
var standOff = (troop, kmAt) => STAND_OFF_KM[troop.kind] * troop.depth / kmAt(troop.y);
var stands = (field, side, x, y) => {
  if (!(x >= 0) || !(y >= 0) || x >= field.cols || y >= field.rows) return false;
  const cell = Math.floor(y) * field.cols + Math.floor(x);
  if (!field.play[cell]) return false;
  if (field.holders[cell] === side) return true;
  const value = readField(field, x, y);
  return side === HOLDER_SIDE_A ? value < 0 : value > 0;
};
var drawTraits = (troop, seed, name, side, index, even = false) => {
  troop.drawn = true;
  if (even) return;
  const draw2 = (trait) => hashSeed([seed, name, side, index, trait].join("|")) % 1e4 / 1e4;
  troop.drive = TRAIT_DRIVE[0] + (TRAIT_DRIVE[1] - TRAIT_DRIVE[0]) * draw2("drive");
  troop.depth = TRAIT_DEPTH[0] + (TRAIT_DEPTH[1] - TRAIT_DEPTH[0]) * draw2("depth");
  troop.lane = TRAIT_LANE[0] + (TRAIT_LANE[1] - TRAIT_LANE[0]) * draw2("lane");
  troop.lag = TRAIT_LAG_DAYS[Math.min(TRAIT_LAG_DAYS.length - 1, Math.floor(TRAIT_LAG_DAYS.length * draw2("lag")))];
};
var troopsFactor = (value) => {
  const factor = Number(value);
  return Number.isFinite(factor) && factor > 0 ? Math.max(TROOPS_FACTOR_LEAST, Math.min(TROOPS_FACTOR_MOST, factor)) : 1;
};
var spread = (index) => {
  const turned = (index + 1) * 0.6180339887498949;
  return turned - Math.floor(turned);
};
var kindsFor = (count, era, mix = null) => {
  const armourShare = mix && Number.isFinite(mix.armour) ? mix.armour : ARMOUR_SHARE_BY_ERA[era];
  const artilleryShare = mix && Number.isFinite(mix.artillery) ? mix.artillery : ARTILLERY_SHARE_BY_ERA[era];
  const armour = Math.min(count, Math.round(count * armourShare));
  const artillery = Math.min(count - armour, Math.round(count * artilleryShare));
  const ranked = Array.from({ length: count }, (_, index) => index).sort((a, b) => spread(a) - spread(b) || a - b);
  const kinds = new Array(count).fill(KIND_INFANTRY);
  ranked.forEach((rank, turn) => {
    if (turn < armour) kinds[rank] = KIND_ARMOUR;
    else if (turn < armour + artillery) kinds[rank] = KIND_ARTILLERY;
  });
  return kinds;
};
var stepAlong = (x, y, hx, hy, length, allowed, out) => {
  for (let turn = -1; turn < TURNS.length / 2; turn += 1) {
    const cos = turn < 0 ? 1 : TURNS[turn * 2];
    const sin = turn < 0 ? 0 : TURNS[turn * 2 + 1];
    const tx = x + (hx * cos - hy * sin) * length;
    const ty = y + (hx * sin + hy * cos) * length;
    if (!allowed(tx, ty)) continue;
    out[0] = tx;
    out[1] = ty;
    return true;
  }
  return false;
};

// src/runtime/fronts/fatigue.js
var tireDay = (run, battle, { wear = 0, rest = 1 } = {}) => {
  for (const side of [0, 1]) {
    for (const troop of battle.troops[side]) {
      if (!isLive(troop)) continue;
      const full = run.advanceKm[troop.kind] * run.pace;
      const marched = full > 0 ? troop.movedKm / full : 0;
      const busy = troop.fought || troop.engaged || troop.movedKm >= FATIGUE_STILL_KM;
      if (busy) {
        const rise = FATIGUE_MARCH * (marched > 1 ? 1 : marched) + (troop.fought ? FATIGUE_ATTACK : troop.engaged ? FATIGUE_DEFEND : 0) + wear + (troop.climate ? troop.climate.wear : 0);
        troop.fatigue = troop.fatigue + rise > 1 ? 1 : troop.fatigue + rise;
      } else {
        const fall = FATIGUE_REST * (troop.dug ? FATIGUE_REST_DUG : 1) * (troop.pocket ? FATIGUE_REST_POCKET : troop.supply) * rest;
        troop.fatigue = troop.fatigue - fall < 0 ? 0 : troop.fatigue - fall;
      }
    }
  }
};
var punchLeft = (fatigue) => 1 - FATIGUE_PUNCH * fatigue;
var guardLeft = (fatigue) => 1 - FATIGUE_GUARD * fatigue;
var legsLeft = (fatigue) => 1 - FATIGUE_LEGS * fatigue;

// src/runtime/fronts/mechanics.js
var MECHANICS = Object.freeze(["fatigue", "weather", "terrain", "walls", "muster", "military", "air", "supply", "attrition"]);
var readMechanics = (value) => Object.freeze(Object.fromEntries(MECHANICS.map((key) => [key, value?.[key] === true])));
var anyMechanic = (mech) => MECHANICS.some((key) => mech?.[key] === true);

// src/runtime/fronts/military.js
var MILITARY_NEUTRAL = Object.freeze({
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
var QUALITY_FACTORS = Object.freeze([0.5, 1.5]);
var TECHNOLOGY_FACTORS = Object.freeze([0.7, 1.3]);
var ARM_FACTORS = Object.freeze([0.5, 1.5]);
var given = (value) => value !== null && value !== void 0 && value !== "" && Number.isFinite(Number(value));
var stat = (value) => {
  if (!given(value)) return 50;
  const number = Number(value);
  return number < 0 ? 0 : number > 100 ? 100 : number;
};
var between = (value, least, most) => {
  if (!given(value)) return null;
  const number = Number(value);
  return number >= least && number <= most ? number : null;
};
var readMilitary = (value) => ({
  quality: stat(value?.quality),
  technology: stat(value?.technology),
  land: stat(value?.land),
  sea: stat(value?.sea),
  air: stat(value?.air),
  manpowerShare: between(value?.manpowerShare, 0.1, 100),
  cavalryShare: between(value?.cavalryShare, 0, 1),
  siegeShare: between(value?.siegeShare, 0, 1),
  menPerCounter: between(value?.menPerCounter, 1, 1e6)
});
var statFactor = (value, least, most) => value === 50 ? 1 : value < 50 ? least + (1 - least) * value / 50 : 1 + (most - 1) * (value - 50) / 50;
var armWorth = (stats, arm) => arm <= 0 ? 0 : statFactor(stats.quality, QUALITY_FACTORS[0], QUALITY_FACTORS[1]) * statFactor(stats.technology, TECHNOLOGY_FACTORS[0], TECHNOLOGY_FACTORS[1]) * statFactor(arm, ARM_FACTORS[0], ARM_FACTORS[1]);
var airWorth = (stats) => armWorth(stats, stats.air);
var mixOf = (stats) => stats.cavalryShare === null && stats.siegeShare === null ? null : { armour: stats.cavalryShare, artillery: stats.siegeShare };

// src/runtime/fronts/worldGrid.js
var PI = 3.141592653589793;
var HALF_PI = PI / 2;
var RAD2 = PI / 180;
var EARTH_KM = 6371.0088;
var SINE_TERMS = [1, -1 / 6, 1 / 120, -1 / 5040, 1 / 362880, -1 / 39916800, 1 / 6227020800, -1 / 1307674368e3, 1 / 355687428096e3];
var COSINE_TERMS = [1, -1 / 2, 1 / 24, -1 / 720, 1 / 40320, -1 / 3628800, 1 / 479001600, -1 / 87178291200, 1 / 20922789888e3];
var seriesOf = (terms, square) => {
  let sum = 0;
  for (let at = terms.length - 1; at >= 0; at -= 1) sum = terms[at] + square * sum;
  return sum;
};
var sineOfSmall = (x) => x * seriesOf(SINE_TERMS, x * x);
var cosineOfSmall = (x) => seriesOf(COSINE_TERMS, x * x);
var sine = (angle) => {
  const quarter = Math.round(angle / HALF_PI);
  const rest = angle - quarter * HALF_PI;
  const turn = (quarter % 4 + 4) % 4;
  return turn === 0 ? sineOfSmall(rest) : turn === 1 ? cosineOfSmall(rest) : turn === 2 ? -sineOfSmall(rest) : -cosineOfSmall(rest);
};
var cosine = (angle) => sine(angle + HALF_PI);
var arcTanOfSmall = (x) => {
  let t = x;
  t /= 1 + Math.sqrt(1 + t * t);
  t /= 1 + Math.sqrt(1 + t * t);
  const s = t * t;
  let sum = 0;
  for (let odd = 27; odd >= 1; odd -= 2) sum = 1 / odd - s * sum;
  return 4 * t * sum;
};
var arcTan2 = (y, x) => {
  if (x === 0 && y === 0) return 0;
  const ay = y < 0 ? -y : y;
  const ax = x < 0 ? -x : x;
  const angle = ax >= ay ? arcTanOfSmall(ay / ax) : HALF_PI - arcTanOfSmall(ax / ay);
  const turned = x < 0 ? PI - angle : angle;
  return y < 0 ? -turned : turned;
};
var kmBetween = (lngA, latA, lngB, latB, { flat = false, scale = KM_PER_DEGREE } = {}) => {
  if (flat) return Math.sqrt((lngB - lngA) * (lngB - lngA) + (latB - latA) * (latB - latA)) * scale;
  const a = latA * RAD2;
  const b = latB * RAD2;
  const down = sine((b - a) / 2);
  const across = sine((lngB - lngA) * RAD2 / 2);
  const h = Math.min(1, Math.max(0, down * down + cosine(a) * cosine(b) * across * across));
  return 2 * EARTH_KM * arcTan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// src/runtime/fronts/air.js
var AIR_REACH_KM = Object.freeze([0, 0, 500, 900]);
var AIR_SUPPORT = 0.25;
var AIR_INTERDICT = 0.2;
var AIR_PER_TROOP = 8;
var AIR_LOSS = 2;
var AIR_MISSIONS = Object.freeze(["support", "strike", "grounded"]);
var AIR_STRIKE = 1.5;
var AIR_STRIKE_WEAR = 1.5;
var AIR_ARM_TROOPS = 6;
var AIR_ARM_MARK = "air arm|";
var airMissionOf = (battle, side) => {
  const mission = battle?.airMission?.[side];
  return AIR_MISSIONS.includes(mission) ? mission : "support";
};
var fold2 = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
var assignWings = (run, day) => {
  if (run.airDay === day) return;
  run.airDay = day;
  run.airOver = /* @__PURE__ */ new Map();
  const reach = AIR_REACH_KM[run.era] ?? 0;
  if (!(reach > 0)) return;
  run.wings = run.wings ?? /* @__PURE__ */ new Map();
  const flat = run.input?.map?.flat === true;
  const scale = run.input?.map?.scale;
  const units = (Array.isArray(run.input?.units) ? run.input.units : []).filter((unit) => fold2(unit?.type) === "air" && Number(unit.strength) > 0 && Number.isFinite(Number(unit.lng)) && Number.isFinite(Number(unit.lat)));
  units.sort((a, b) => String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0);
  for (const unit of units) {
    const id = String(unit.id);
    if (!run.wings.has(id)) run.wings.set(id, { id, owner: String(unit.ownerCode ?? unit.owner ?? ""), strength: Math.min(100, Number(unit.strength)), began: Math.min(100, Number(unit.strength)), lng: Number(unit.lng), lat: Number(unit.lat) });
    const wing = run.wings.get(id);
    if (!(wing.strength > 0) || airWorth(run.militaryOf(wing.owner)) === 0) continue;
    let best = null;
    for (const battle of run.battles) {
      if (battle.status !== "active") continue;
      const side = [0, 1].find((index) => battle.sides[index].some((member, at) => !battle.gone[index].has(at) && fold2(member) === fold2(wing.owner)));
      if (side === void 0) continue;
      const [lng, lat] = battle.place.toLngLat(battle.field.cols / 2, battle.field.rows / 2);
      const km = kmBetween(wing.lng, wing.lat, lng, lat, { flat, scale });
      if (km <= reach && (!best || km < best.km)) best = { battle, side, km };
    }
    if (!best) continue;
    if (!run.airOver.has(best.battle)) run.airOver.set(best.battle, [[], []]);
    run.airOver.get(best.battle)[best.side].push(wing);
  }
  if (run.input?.airArms !== true) return;
  const winged = new Set(units.map((unit) => fold2(unit.ownerCode ?? unit.owner)));
  for (const battle of run.battles) {
    if (battle.status !== "active") continue;
    for (const side of [0, 1]) {
      battle.sides[side].forEach((member, at) => {
        if (battle.gone[side].has(at) || winged.has(fold2(member)) || airWorth(run.militaryOf(member)) === 0) return;
        let troops = 0;
        for (const troop of battle.troops[side]) if (isLive(troop) && troop.owner === at) troops += 1;
        const count = Math.ceil(troops / AIR_ARM_TROOPS);
        for (let index = 0; index < count; index += 1) {
          const id = `${AIR_ARM_MARK}${battle.name}|${member}|${index}`;
          if (!run.wings.has(id)) run.wings.set(id, { id, owner: member, strength: 100, began: 100, arm: true });
          const wing = run.wings.get(id);
          if (!(wing.strength > 0)) continue;
          if (!run.airOver.has(battle)) run.airOver.set(battle, [[], []]);
          run.airOver.get(battle)[side].push(wing);
        }
      });
    }
  }
};
var skyOfWings = (run, battle, day) => {
  assignWings(run, day);
  const wings = run.airOver?.get(battle);
  battle.wings = null;
  if (!wings) return null;
  const flies = battle.sky ? battle.sky.effects.air : 1;
  if (!(flies > 0)) return null;
  const weight = wings.map((list2, side) => airMissionOf(battle, side) === "grounded" ? 0 : list2.reduce((sum, wing) => sum + (wing.strength > 0 ? wing.strength * airWorth(run.militaryOf(wing.owner)) : 0), 0) * flies);
  const total = weight[0] + weight[1];
  if (!(total > 0)) return null;
  const holds = weight[0] >= weight[1] ? 0 : 1;
  const superiority = (weight[holds] - weight[1 - holds]) / total;
  let troops = 0;
  for (const troop of battle.troops[holds]) if (isLive(troop)) troops += 1;
  const density = troops > 0 ? Math.min(1, weight[holds] / (AIR_PER_TROOP * troops)) : 1;
  const edge = superiority * density;
  const punch = [1, 1];
  const guard = [1, 1];
  const legs = [1, 1];
  const striking = airMissionOf(battle, holds) === "strike";
  if (!striking) {
    punch[holds] = 1 + AIR_SUPPORT * edge;
    guard[holds] = 1 + AIR_SUPPORT * edge;
  }
  legs[1 - holds] = 1 - AIR_INTERDICT * edge;
  battle.wings = { holds, weight, superiority, flying: wings.map((list2, side) => airMissionOf(battle, side) === "grounded" ? [] : list2), ...striking ? { strike: edge } : {} };
  return { punch, guard, legs };
};
var airStrikes = (battle) => {
  const strike = battle.wings?.strike;
  if (!(strike > 0)) return;
  for (const troop of battle.troops[1 - battle.wings.holds]) {
    if (!isLive(troop)) continue;
    troop.loss += troop.strength / 100 * AIR_STRIKE * strike;
  }
};
var wearWings = (run, battle) => {
  const sky = battle.wings;
  if (!sky) return;
  const total = sky.weight[0] + sky.weight[1];
  for (const side of [0, 1]) {
    const lost = total > 0 ? sky.weight[1 - side] / total : 0;
    const wear = sky.strike > 0 && sky.holds === side ? AIR_STRIKE_WEAR : 1;
    for (const wing of sky.flying[side]) {
      if (!(wing.strength > 0)) continue;
      wing.strength = Math.max(0, wing.strength - AIR_LOSS * (0.25 + lost) * wear);
      wing.changed = true;
    }
  }
};

// src/runtime/fronts/ground.js
var FAR_THIRDS = 1 << 28;
var distanceFrom = (cols, rows, isSource, out) => {
  const size = cols * rows;
  for (let cell = 0; cell < size; cell += 1) out[cell] = isSource(cell) ? 0 : FAR_THIRDS;
  if (size === 0) return out;
  const last = cols - 1;
  for (let cell = 1; cell < cols; cell += 1) if (out[cell - 1] + 3 < out[cell]) out[cell] = out[cell - 1] + 3;
  for (let start = cols; start < size; start += cols) {
    let best = out[start];
    if (out[start - cols] + 3 < best) best = out[start - cols] + 3;
    if (last > 0 && out[start - cols + 1] + 4 < best) best = out[start - cols + 1] + 4;
    out[start] = best;
    const end = start + last;
    for (let cell = start + 1; cell < end; cell += 1) {
      best = out[cell];
      const west = out[cell - 1] + 3;
      if (west < best) best = west;
      const north = out[cell - cols] + 3;
      if (north < best) best = north;
      const northWest = out[cell - cols - 1] + 4;
      if (northWest < best) best = northWest;
      const northEast = out[cell - cols + 1] + 4;
      if (northEast < best) best = northEast;
      out[cell] = best;
    }
    if (last > 0) {
      best = out[end];
      if (out[end - 1] + 3 < best) best = out[end - 1] + 3;
      if (out[end - cols] + 3 < best) best = out[end - cols] + 3;
      if (out[end - cols - 1] + 4 < best) best = out[end - cols - 1] + 4;
      out[end] = best;
    }
  }
  const lastRow = size - cols;
  for (let cell = size - 2; cell >= lastRow; cell -= 1) if (out[cell + 1] + 3 < out[cell]) out[cell] = out[cell + 1] + 3;
  for (let start = lastRow - cols; start >= 0; start -= cols) {
    const end = start + last;
    let best = out[end];
    if (out[end + cols] + 3 < best) best = out[end + cols] + 3;
    if (last > 0 && out[end + cols - 1] + 4 < best) best = out[end + cols - 1] + 4;
    out[end] = best;
    for (let cell = end - 1; cell > start; cell -= 1) {
      best = out[cell];
      const east = out[cell + 1] + 3;
      if (east < best) best = east;
      const south = out[cell + cols] + 3;
      if (south < best) best = south;
      const southEast = out[cell + cols + 1] + 4;
      if (southEast < best) best = southEast;
      const southWest = out[cell + cols - 1] + 4;
      if (southWest < best) best = southWest;
      out[cell] = best;
    }
    if (last > 0) {
      best = out[start];
      if (out[start + 1] + 3 < best) best = out[start + 1] + 3;
      if (out[start + cols] + 3 < best) best = out[start + cols] + 3;
      if (out[start + cols + 1] + 4 < best) best = out[start + cols + 1] + 4;
      out[start] = best;
    }
  }
  return out;
};
var nearestOf = (cols, rows, labels, out, outLabel) => {
  const size = cols * rows;
  for (let cell = 0; cell < size; cell += 1) {
    out[cell] = labels[cell] >= 0 ? 0 : FAR_THIRDS;
    outLabel[cell] = labels[cell];
  }
  const take = (cell, from, cost) => {
    if (out[from] + cost < out[cell]) {
      out[cell] = out[from] + cost;
      outLabel[cell] = outLabel[from];
    }
  };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = row * cols + col;
      if (col > 0) take(cell, cell - 1, 3);
      if (row > 0) {
        take(cell, cell - cols, 3);
        if (col > 0) take(cell, cell - cols - 1, 4);
        if (col < cols - 1) take(cell, cell - cols + 1, 4);
      }
    }
  }
  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let col = cols - 1; col >= 0; col -= 1) {
      const cell = row * cols + col;
      if (col < cols - 1) take(cell, cell + 1, 3);
      if (row < rows - 1) {
        take(cell, cell + cols, 3);
        if (col < cols - 1) take(cell, cell + cols + 1, 4);
        if (col > 0) take(cell, cell + cols - 1, 4);
      }
    }
  }
};
var measure = (battle) => {
  const { field } = battle;
  if (battle.measuredFor === field && battle.measured === field.turns) return battle.toSide;
  if (battle.measuredFor !== field) battle.toSide = [new Int32Array(field.size), new Int32Array(field.size)];
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) distanceFrom(field.cols, field.rows, (cell) => field.holders[cell] === side, battle.toSide[side]);
  battle.measuredFor = field;
  battle.measured = field.turns;
  return battle.toSide;
};
var cellAt = (field, x, y) => x >= 0 && y >= 0 && x < field.cols && y < field.rows ? Math.floor(y) * field.cols + Math.floor(x) : -1;
var cellsOf = (field, grid, x, y) => {
  const col = x < 0 ? 0 : x >= field.cols ? field.cols - 1 : Math.floor(x);
  const row = y < 0 ? 0 : y >= field.rows ? field.rows - 1 : Math.floor(y);
  return grid[row * field.cols + col] / 3;
};
var downhill = (field, grid, x, y, out) => {
  const dx = cellsOf(field, grid, x - 1.5, y) - cellsOf(field, grid, x + 1.5, y);
  const dy = cellsOf(field, grid, x, y - 1.5) - cellsOf(field, grid, x, y + 1.5);
  const length = Math.sqrt(dx * dx + dy * dy);
  out[0] = length > 0 ? dx / length : 0;
  out[1] = length > 0 ? dy / length : 0;
  return length > 0;
};
var awayOf = (battle, side, x, y) => {
  const { field } = battle;
  const cell = cellAt(field, x, y);
  if (cell < 0 || field.holders[cell] !== side) return 0;
  const near = Math.abs(readField(field, x, y));
  return near < FAR_CELLS - 1 ? near : battle.toSide[1 - side][cell] / 3;
};
var outwardOf = (field, side, x, y, reach, out) => {
  const other = 1 - side;
  const { cols, rows, holders } = field;
  const col0 = Math.floor(x);
  const row0 = Math.floor(y);
  const span = Math.ceil(reach);
  const within2 = reach * reach;
  let sumX = 0;
  let sumY = 0;
  for (let row = Math.max(0, row0 - span); row <= Math.min(rows - 1, row0 + span); row += 1) {
    for (let col = Math.max(0, col0 - span); col <= Math.min(cols - 1, col0 + span); col += 1) {
      const holder = holders[row * cols + col];
      if (holder !== side && holder !== other) continue;
      if (col + 1 < cols) {
        const beside = holders[row * cols + col + 1];
        if (beside !== holder && (beside === side || beside === other)) {
          const dx = col + 1 - x;
          const dy = row + 0.5 - y;
          const apart = dx * dx + dy * dy;
          if (apart <= within2) sumX += (holder === side ? 1 : -1) * (1 - apart / within2);
        }
      }
      if (row + 1 < rows) {
        const below = holders[(row + 1) * cols + col];
        if (below !== holder && (below === side || below === other)) {
          const dx = col + 0.5 - x;
          const dy = row + 1 - y;
          const apart = dx * dx + dy * dy;
          if (apart <= within2) sumY += (holder === side ? 1 : -1) * (1 - apart / within2);
        }
      }
    }
  }
  const length = Math.sqrt(sumX * sumX + sumY * sumY);
  out[0] = length > 0 ? sumX / length : 0;
  out[1] = length > 0 ? sumY / length : 0;
  return length > 0;
};
var clearBetween = (field, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2));
  for (let step = 0; step <= steps; step += 1) {
    const cell = cellAt(field, ax + dx * step / steps, ay + dy * step / steps);
    if (cell < 0 || !field.play[cell]) return false;
  }
  return true;
};
var heldRound = (field, side, x, y, reach) => {
  const col0 = Math.floor(x);
  const row0 = Math.floor(y);
  const span = Math.ceil(reach);
  const within2 = reach * reach;
  let own = 0;
  let theirs = 0;
  for (let row = Math.max(0, row0 - span); row <= Math.min(field.rows - 1, row0 + span); row += 1) {
    const dy = row + 0.5 - y;
    for (let col = Math.max(0, col0 - span); col <= Math.min(field.cols - 1, col0 + span); col += 1) {
      const dx = col + 0.5 - x;
      if (dx * dx + dy * dy > within2) continue;
      const holder = field.holders[row * field.cols + col];
      if (holder === side) own += 1;
      else if (holder === 1 - side) theirs += 1;
    }
  }
  return own + theirs > 0 ? own / (own + theirs) : 1;
};
var cheapestWay = (battle, from, to) => {
  const { field, arena } = battle;
  const { cols, rows, size, play } = field;
  if (from < 0 || to < 0 || !play[from] || !play[to]) return null;
  const cost = new Float64Array(size).fill(Infinity);
  const parent = new Int32Array(size).fill(-1);
  const heap = [from];
  cost[from] = 0;
  const before = (a, b) => cost[a] < cost[b] || cost[a] === cost[b] && a < b;
  const settled = new Uint8Array(size);
  while (heap.length > 0) {
    const index = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let at = 0;
      for (; ; ) {
        const left = at * 2 + 1;
        const right = left + 1;
        let least = at;
        if (left < heap.length && before(heap[left], heap[least])) least = left;
        if (right < heap.length && before(heap[right], heap[least])) least = right;
        if (least === at) break;
        [heap[at], heap[least]] = [heap[least], heap[at]];
        at = least;
      }
    }
    if (settled[index]) continue;
    settled[index] = 1;
    if (index === to) break;
    const col = index % cols;
    const row = (index - col) / cols;
    for (let dy = -1; dy <= 1; dy += 1) {
      const y = row + dy;
      if (y < 0 || y >= rows) continue;
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = col + dx;
        const next = y * cols + x;
        if (dx === 0 && dy === 0 || x < 0 || x >= cols || !play[next] || settled[next]) continue;
        const step = (dx !== 0 && dy !== 0 ? 1.4142135623730951 : 1) * (0.5 / arena.speed[index] + 0.5 / arena.speed[next]);
        if (!(cost[index] + step < cost[next])) continue;
        cost[next] = cost[index] + step;
        parent[next] = index;
        heap.push(next);
        for (let at = heap.length - 1; at > 0; ) {
          const up = at - 1 >> 1;
          if (!before(heap[at], heap[up])) break;
          [heap[at], heap[up]] = [heap[up], heap[at]];
          at = up;
        }
      }
    }
  }
  if (!settled[to]) return null;
  const way = [];
  for (let index = to; index >= 0; index = parent[index]) way.push(index);
  return way.reverse();
};

// src/runtime/fronts/walls.js
var WALL_PIECE_KM = 5;
var WALL_DAYS = Object.freeze([Infinity, Infinity, Infinity, 3, 6, 10, 15, 22, 32, 50, Infinity]);
var WALL_ODDS = 2;
var WALL_DEFENCE_PER_LEVEL = 0.15;
var WALL_ASSAULT_COST = 1.5;
var WALL_SIEGE_WEAR = 3;
var fold3 = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
var list = (value) => Array.isArray(value) ? value : [];
var readLines = (run) => {
  if (run.lines) return run.lines;
  const flat = run.input?.map?.flat === true;
  const scale = run.input?.map?.scale;
  run.lines = (run.mech?.walls ? list(run.input?.fortifications) : []).map((line) => {
    const points = list(line?.points).filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]));
    const at = [0];
    for (let index = 1; index < points.length; index += 1) at.push(at[index - 1] + kmBetween(points[index - 1][0], points[index - 1][1], points[index][0], points[index][1], { flat, scale }));
    return {
      id: String(line?.id ?? ""),
      // (Its name, for what is told of it: a breach.)
      name: String(line?.name ?? "").replace(/s+/g, " ").trim().slice(0, 80),
      owner: String(line?.owner ?? ""),
      level: Math.max(0, Math.min(10, Math.round(Number(line?.level) || 0))),
      points,
      at,
      breaches: list(line?.breaches).map((stretch) => [Number(stretch[0]), Number(stretch[1])]),
      wear: new Map(list(line?.wear).map((entry) => [Math.floor(Number(entry[0])), Number(entry[1])])),
      building: line?.building ?? null,
      changed: false
    };
  }).filter((line) => line.points.length >= 2);
  return run.lines;
};
var standsOn = (line, date) => {
  if (line.level < 3) return false;
  if (!line.building) return true;
  const done = addGameDays(line.building.since, Math.max(0, Math.round(Number(line.building.days) || 0)));
  return Boolean(done) && compareGameDates(done, date) <= 0;
};
var brokenAt = (line, km) => line.breaches.some(([from, to]) => km >= from && km <= to);
var ownerSide = (battle, owner) => {
  const wanted = fold3(owner);
  if (!wanted) return -1;
  for (const side of [0, 1]) if (battle.sides[side].some((member, at) => !battle.gone[side].has(at) && fold3(member) === wanted)) return side;
  return -1;
};
var wallsOf = (run, battle) => {
  const lines = readLines(run);
  const sidesKey = battle.sides.map((members, side) => members.filter((member, at) => !battle.gone[side].has(at)).join("|")).join("/");
  if (battle.wallsFor === battle.place && battle.wallSides === sidesKey) return battle.walls;
  battle.wallsFor = battle.place;
  battle.wallSides = sidesKey;
  battle.walls = null;
  if (lines.length === 0) return null;
  const { field, place } = battle;
  const sides = lines.map((line) => ownerSide(battle, line.owner));
  if (!sides.some((side) => side >= 0)) return null;
  const cellLine = new Int16Array(field.size);
  const cellKm = new Float32Array(field.size);
  let drawn = 0;
  lines.forEach((line, index) => {
    if (sides[index] < 0) return;
    for (let leg = 1; leg < line.points.length; leg += 1) {
      const [ax, ay] = place.toCell(line.points[leg - 1][0], line.points[leg - 1][1]);
      const [bx, by] = place.toCell(line.points[leg][0], line.points[leg][1]);
      const cells = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
      const steps = Math.max(1, Math.ceil(cells * 4));
      for (let step = 0; step <= steps; step += 1) {
        const part = step / steps;
        const cell = cellAt(field, ax + (bx - ax) * part, ay + (by - ay) * part);
        if (cell < 0 || !field.play[cell]) continue;
        cellLine[cell] = index + 1;
        cellKm[cell] = line.at[leg - 1] + (line.at[leg] - line.at[leg - 1]) * part;
        drawn += 1;
      }
    }
  });
  if (drawn > 0) battle.walls = { cellLine, cellKm, sides };
  return battle.walls;
};
var standsAgainst = (run, battle, cell, side, date) => {
  const walls = battle.walls;
  const at = walls ? walls.cellLine[cell] : 0;
  if (at === 0) return null;
  const line = run.lines[at - 1];
  if (walls.sides[at - 1] !== 1 - side || !standsOn(line, date) || brokenAt(line, walls.cellKm[cell])) return null;
  return { line: at - 1, piece: Math.floor(walls.cellKm[cell] / WALL_PIECE_KM) };
};
var raiseWalls = (run, battle, date) => {
  const walls = wallsOf(run, battle);
  battle.wallMask = [null, null];
  battle.wallDate = date;
  battle.wallRun = run;
  if (!walls) {
    for (const side of [0, 1]) for (const troop of battle.troops[side]) troop.walled = 0;
    return;
  }
  const { field } = battle;
  for (let cell = 0; cell < field.size; cell += 1) {
    if (walls.cellLine[cell] === 0) continue;
    for (const side of [0, 1]) {
      if (!standsAgainst(run, battle, cell, side, date)) continue;
      battle.wallMask[side] ??= new Uint8Array(field.size);
      battle.wallMask[side][cell] = 1;
    }
  }
  for (const side of [0, 1]) {
    for (const troop of battle.troops[side]) {
      let level = 0;
      if (troop.strength > 0) {
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const cell = cellAt(field, troop.x + dx, troop.y + dy);
            const at = cell >= 0 ? walls.cellLine[cell] : 0;
            if (at === 0 || walls.sides[at - 1] !== side) continue;
            const line = run.lines[at - 1];
            if (standsOn(line, date) && !brokenAt(line, walls.cellKm[cell]) && line.level > level) level = line.level;
          }
        }
      }
      troop.walled = level;
    }
  }
};
var wallAhead = (battle, side, x, y) => {
  if (!battle.walls || !battle.wallRun) return null;
  const cell = cellAt(battle.field, x, y);
  return cell < 0 ? null : standsAgainst(battle.wallRun, battle, cell, side, battle.wallDate);
};
var wearWall = (battle, { line: index, piece }, odds2, siege, share) => {
  const run = battle.wallRun;
  const line = run?.lines?.[index];
  if (!line || !(WALL_DAYS[line.level] < Infinity)) return false;
  const worn = (line.wear.get(piece) ?? 0) + share * (odds2 >= WALL_ODDS ? 1 : odds2 / WALL_ODDS) * (siege ? WALL_SIEGE_WEAR : 1) / WALL_DAYS[line.level];
  line.changed = true;
  if (worn < 1) {
    line.wear.set(piece, worn);
    return false;
  }
  line.wear.delete(piece);
  const from = piece * WALL_PIECE_KM;
  line.breaches.push([from, from + WALL_PIECE_KM]);
  line.breaches.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const stretch of line.breaches) {
    const last = merged[merged.length - 1];
    if (last && stretch[0] <= last[1]) last[1] = last[1] > stretch[1] ? last[1] : stretch[1];
    else merged.push(stretch.slice());
  }
  line.breaches = merged;
  const owner = battle.walls?.sides?.[index];
  const at = line.name ? `wall: ${line.name}` : "a fortified line";
  const date = String(battle.wallDate ?? "");
  if ((owner === 0 || owner === 1) && !battle.log.some((entry) => entry.k === "breached" && entry.d === date && entry.at === at)) {
    battle.log.push({ d: date, k: "breached", s: 1 - owner, at });
  }
  return true;
};
var keptWith = (battle) => [0, 1].map((side) => {
  const siege = battle.siegeKept?.[side] ?? null;
  const wall = battle.wallMask?.[side] ?? null;
  if (!wall) return siege;
  if (!siege) return wall;
  const both = Uint8Array.from(siege);
  for (let cell = 0; cell < wall.length; cell += 1) if (wall[cell] === 1) both[cell] = 1;
  return both;
});

// src/runtime/fronts/climate.js
var MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
var YEAR = 365;
var dayOfYear = (month, day) => MONTH_START[month - 1] + (day > 28 && month === 2 ? 28 : day);
var dayOfMonthDay = (text4) => {
  const [month, day] = String(text4).split("-").map(Number);
  return month >= 1 && month <= 12 && day >= 1 ? dayOfYear(month, day > 31 ? 31 : day) : 1;
};
var ahead = (from, to) => ((to - from) % YEAR + YEAR) % YEAR;
var within = (value, least, most) => value < least ? least : value > most ? most : value;
var NEUTRAL_EFFECTS = Object.freeze({ pace: 1, attack: 1, wear: 0, cold: 0, heat: 0, air: 1, freezes: 0 });
var effectsOf = (raw) => ({
  pace: Number.isFinite(raw?.pace) ? raw.pace : 1,
  attack: Number.isFinite(raw?.attack) ? raw.attack : 1,
  wear: Number.isFinite(raw?.wear) ? raw.wear : 0,
  cold: Number.isFinite(raw?.cold) ? raw.cold : 0,
  heat: Number.isFinite(raw?.heat) ? raw.heat : 0,
  air: Number.isFinite(raw?.air) ? raw.air : 1,
  freezes: raw?.freezes === true ? 1 : 0
});
var oddsOf = (mix) => {
  let total = 0;
  for (const state2 of WEATHER_STATES) total += mix?.[state2] > 0 ? mix[state2] : 0;
  if (!(total > 0)) return null;
  const odds2 = {};
  for (const state2 of WEATHER_STATES) odds2[state2] = mix?.[state2] > 0 ? mix[state2] / total : 0;
  return odds2;
};
var seasonAt = (zone, day) => {
  const seasons = zone.seasons ?? [];
  for (let at = 0; at < seasons.length; at += 1) {
    const start = dayOfMonthDay(seasons[at].start);
    const end = dayOfMonthDay(seasons[at].end);
    if (start <= end ? day >= start && day <= end : day >= start || day <= end) return at;
  }
  return -1;
};
var stretchOf = (zone, day) => {
  const here = seasonAt(zone, day);
  let first = day;
  let last = day;
  for (let step = 1; step < YEAR && seasonAt(zone, (day - step - 1 + YEAR) % YEAR + 1) === here; step += 1) first = (day - step - 1 + YEAR) % YEAR + 1;
  for (let step = 1; step < YEAR && seasonAt(zone, (day + step - 1) % YEAR + 1) === here; step += 1) last = (day + step - 1) % YEAR + 1;
  return { here, first, last };
};
var seasonMixOn = (zone, date) => {
  const parsed = parseGameDate(date);
  if (!parsed) return [{ season: -1, weight: 1 }];
  const day = dayOfYear(parsed.month, parsed.day);
  const { here, first, last } = stretchOf(zone, day);
  const half = (Number(zone.transitionDays) || 0) / 2;
  if (!(half > 0) || ahead(first, last) >= YEAR - 1) return [{ season: here, weight: 1 }];
  const sinceStart = ahead(first, day) + 0.5;
  const toEnd = ahead(day, last) + 0.5;
  if (sinceStart < half && sinceStart <= toEnd) {
    const before = seasonAt(zone, (first - 2 + YEAR) % YEAR + 1);
    const weight = 0.5 + sinceStart / (2 * half);
    return before === here ? [{ season: here, weight: 1 }] : [{ season: here, weight }, { season: before, weight: 1 - weight }];
  }
  if (toEnd < half) {
    const after = seasonAt(zone, last % YEAR + 1);
    const weight = 0.5 + toEnd / (2 * half);
    return after === here ? [{ season: here, weight: 1 }] : [{ season: here, weight }, { season: after, weight: 1 - weight }];
  }
  return [{ season: here, weight: 1 }];
};
var eventsOn = (zone, date) => {
  const out = [];
  const parsed = parseGameDate(date);
  if (!parsed) return out;
  const half = (Number(zone.transitionDays) || 0) / 2;
  for (const event of zone.events ?? []) {
    const from = parseGameDate(event.from);
    const to = parseGameDate(event.to);
    if (!from || !to) continue;
    const at = (when) => when.year * YEAR + dayOfYear(when.month, when.day);
    const now = at(parsed);
    const outside = now < at(from) ? at(from) - now : now > at(to) ? now - at(to) : 0;
    const weight = outside === 0 ? 1 : half > 0 ? within(1 - outside / (half + 1), 0, 1) : 0;
    if (weight > 0) out.push({ event, weight });
  }
  return out;
};
var zoneMixOn = (zone, date, lat) => {
  const parsed = parseGameDate(date);
  const worldSeason = parsed ? seasonOf(parsed.month, lat) : "summer";
  const worldOdds = WEATHER_ODDS[climateOf(lat)][worldSeason];
  const odds2 = Object.fromEntries(WEATHER_STATES.map((state2) => [state2, 0]));
  const effects = { pace: 0, attack: 0, wear: 0, cold: 0, heat: 0, air: 0, freezes: 0 };
  let top = null;
  for (const { season, weight } of seasonMixOn(zone, date)) {
    const own = season >= 0 ? zone.seasons[season] : null;
    const seasonOdds = (own && oddsOf(own.weather)) ?? worldOdds;
    const seasonEffects = own ? effectsOf(own.effects) : NEUTRAL_EFFECTS;
    for (const state2 of WEATHER_STATES) odds2[state2] += weight * seasonOdds[state2];
    for (const key of Object.keys(effects)) effects[key] += weight * seasonEffects[key];
    if (!top || weight > top.weight) top = { weight, name: own ? own.name : worldSeason, color: own?.color || zone.color };
  }
  for (const { event, weight } of eventsOn(zone, date)) {
    const said = effectsOf({ ...Object.fromEntries(Object.entries(effects).map(([key, value]) => [key, key === "freezes" ? value >= 0.5 : value])), ...event.effects });
    for (const key of Object.keys(effects)) effects[key] = effects[key] * (1 - weight) + said[key] * weight;
    if (event.weather && WEATHER_STATES.includes(event.weather)) for (const state2 of WEATHER_STATES) odds2[state2] = odds2[state2] * (1 - weight) + (state2 === event.weather ? weight : 0);
    if (weight >= 0.5) top = { weight: 1, name: event.name, color: top?.color ?? zone.color };
  }
  return { odds: odds2, effects, season: top?.name ?? worldSeason, color: top?.color ?? zone.color };
};
var zoneLatOf = (zone) => {
  let south = Infinity;
  let north = -Infinity;
  for (const point of zone?.rings?.[0] ?? []) {
    const lat = point?.[1];
    if (!(lat >= -90 && lat <= 90)) continue;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return south <= north ? (south + north) / 2 : 45;
};
var zoneWeatherOn = ({ seed = "", zone, date = "" } = {}) => {
  const lat = zoneLatOf(zone);
  const mix = zoneMixOn(zone, date, lat);
  const sky = weatherOn({ seed, place: `zone:${zone?.id ?? ""}`, lat, date, odds: mix.odds });
  return { ...sky, season: mix.season };
};
var ZONE_CURVE_ROUNDS = 3;
var curves = /* @__PURE__ */ new WeakMap();
var curveRing = (ring, rounds = ZONE_CURVE_ROUNDS) => {
  let points = (Array.isArray(ring) ? ring : []).filter((point) => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]));
  const last = points[points.length - 1];
  if (points.length > 1 && points[0][0] === last[0] && points[0][1] === last[1]) points = points.slice(0, -1);
  if (points.length < 3) return points;
  for (let round = 0; round < rounds; round += 1) {
    const next = [];
    for (let at = 0; at < points.length; at += 1) {
      const [ax, ay] = points[at];
      const [bx, by] = points[(at + 1) % points.length];
      next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    points = next;
  }
  return [...points, [points[0][0], points[0][1]]];
};
var curvedRings = (zone) => {
  const known = zone && typeof zone === "object";
  if (known && curves.has(zone)) return curves.get(zone);
  const rings = (Array.isArray(zone?.rings) ? zone.rings : []).map((ring) => curveRing(ring)).filter((ring) => ring.length >= 4);
  if (known) curves.set(zone, rings);
  return rings;
};
var WEATHER_NEIGHBOURS = Object.freeze({
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
var weathersFit = (a, b) => (WEATHER_NEIGHBOURS[a] ?? []).includes(b);
var PI2 = 3.141592653589793;
var KM_A_DEGREE = 111.2;
var cosineOf = (lat) => {
  const x = (lat < 0 ? -lat : lat) * (PI2 / 180);
  return (PI2 * PI2 - 4 * x * x) / (PI2 * PI2 + x * x);
};
var outlineOf = (zone) => {
  const points = (curvedRings(zone)[0] ?? []).filter((point) => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]));
  if (points.length < 3) return null;
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [lng, lat] of points) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return { points, west, east, south, north, blend: Number(zone.blendKm) || 0 };
};
var insideOutline = (points, [x, y]) => {
  let odd = false;
  for (let at = 0, back = points.length - 1; at < points.length; back = at, at += 1) {
    const [ax, ay] = points[back];
    const [bx, by] = points[at];
    if (ay > y !== by > y && x < ax + (y - ay) * (bx - ax) / (by - ay)) odd = !odd;
  }
  return odd;
};
var fromStretch = (px, py, ax, ay, bx, by, squeeze2) => {
  const x = px * squeeze2;
  const x1 = ax * squeeze2;
  const x2 = bx * squeeze2;
  const dx = x2 - x1;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  let share = length > 0 ? ((x - x1) * dx + (py - ay) * dy) / length : 0;
  share = share < 0 ? 0 : share > 1 ? 1 : share;
  const ex = x1 + share * dx - x;
  const ey = ay + share * dy - py;
  return Math.sqrt(ex * ex + ey * ey);
};
var zonesMeet = (a, b) => {
  const A = outlineOf(a);
  const B = outlineOf(b);
  if (!A || !B) return false;
  const reach = (A.blend + B.blend) / 2 / KM_A_DEGREE;
  const cosine2 = cosineOf((A.south + A.north + B.south + B.north) / 4);
  const squeeze2 = cosine2 > 0.05 ? cosine2 : 0.05;
  const reachAcross = reach / squeeze2;
  if (A.east + reachAcross < B.west || B.east + reachAcross < A.west || A.north + reach < B.south || B.north + reach < A.south) return false;
  if (insideOutline(B.points, A.points[0]) || insideOutline(A.points, B.points[0])) return true;
  const near = (from, to) => {
    for (const [px, py] of from.points) {
      for (let at = 0, back = to.points.length - 1; at < to.points.length; back = at, at += 1) {
        if (fromStretch(px, py, to.points[back][0], to.points[back][1], to.points[at][0], to.points[at][1], squeeze2) <= reach) return true;
      }
    }
    return false;
  };
  return near(A, B) || near(B, A);
};
var zoneNeighbours = (zones) => {
  const list2 = Array.isArray(zones) ? zones : [];
  const beside = new Map(list2.map((_, index) => [index, []]));
  for (let a = 0; a < list2.length; a += 1) {
    for (let b = a + 1; b < list2.length; b += 1) {
      if (!zonesMeet(list2[a], list2[b])) continue;
      beside.get(a).push(b);
      beside.get(b).push(a);
    }
  }
  return beside;
};
var boxArea = (zone) => {
  const outline = outlineOf(zone);
  return outline ? (outline.east - outline.west) * (outline.north - outline.south) : 0;
};
var zoneWeathersOn = ({ seed = "", zones = [], date = "", neighbours = null } = {}) => {
  const list2 = Array.isArray(zones) ? zones : [];
  const beside = neighbours ?? zoneNeighbours(list2);
  const drawn = list2.map((zone) => {
    const lat = zoneLatOf(zone);
    const mix = zoneMixOn(zone, date, lat);
    const place = `zone:${zone?.id ?? ""}`;
    const sky = weatherOn({ seed, place, lat, date, odds: mix.odds });
    return { zone, state: sky.state, season: mix.season, climate: sky.climate, odds: mix.odds, draw: weatherDraw(seed, place, date) };
  });
  const order = drawn.map((_, index) => index).sort((a, b) => boxArea(list2[b]) - boxArea(list2[a]) || a - b);
  const settled = /* @__PURE__ */ new Set();
  for (const index of order) {
    const entry = drawn[index];
    const around = (beside.get(index) ?? []).filter((other) => settled.has(other)).map((other) => drawn[other].state);
    settled.add(index);
    if (around.every((state2) => weathersFit(entry.state, state2))) continue;
    const fitting = WEATHER_STATES.map((state2) => around.filter((other) => weathersFit(state2, other)).length);
    let most = 0;
    for (const count of fitting) if (count > most) most = count;
    const candidates = WEATHER_STATES.filter((_, at) => fitting[at] === most);
    let total = 0;
    for (const state2 of candidates) total += entry.odds?.[state2] > 0 ? entry.odds[state2] : 0;
    let chosen = candidates[0];
    if (total > 0) {
      let sum = 0;
      for (const state2 of candidates) {
        const share = entry.odds?.[state2] > 0 ? entry.odds[state2] / total : 0;
        if (!(share > 0)) continue;
        chosen = state2;
        sum += share;
        if (entry.draw < sum) break;
      }
    }
    entry.state = chosen;
  }
  return drawn.map(({ zone, state: state2, season, climate }) => ({ zone, state: state2, season, climate }));
};
var chamfer = (mask, width, height, target) => {
  const far = 1e9;
  const distance = new Int32Array(width * height);
  for (let at = 0; at < distance.length; at += 1) distance[at] = mask[at] === target ? 0 : far;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = y * width + x;
      let best = distance[at];
      if (x > 0 && distance[at - 1] + 3 < best) best = distance[at - 1] + 3;
      if (y > 0) {
        if (distance[at - width] + 3 < best) best = distance[at - width] + 3;
        if (x > 0 && distance[at - width - 1] + 4 < best) best = distance[at - width - 1] + 4;
        if (x < width - 1 && distance[at - width + 1] + 4 < best) best = distance[at - width + 1] + 4;
      }
      distance[at] = best;
    }
  }
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const at = y * width + x;
      let best = distance[at];
      if (x < width - 1 && distance[at + 1] + 3 < best) best = distance[at + 1] + 3;
      if (y < height - 1) {
        if (distance[at + width] + 3 < best) best = distance[at + width] + 3;
        if (x < width - 1 && distance[at + width + 1] + 4 < best) best = distance[at + width + 1] + 4;
        if (x > 0 && distance[at + width - 1] + 4 < best) best = distance[at + width - 1] + 4;
      }
      distance[at] = best;
    }
  }
  return distance;
};
var PAD_MOST = 80;
var zonesOver = (run, battle) => {
  const zones = Array.isArray(run.input?.climateZones) ? run.input.climateZones : [];
  if (battle.zonesFor === battle.place) return battle.zones;
  battle.zonesFor = battle.place;
  battle.zones = null;
  if (zones.length === 0) return null;
  const { frame } = battle.arena;
  const { cols, rows } = battle.field;
  const { kmAt } = battle.place;
  const found = [];
  for (const zone of zones) {
    let least = Infinity;
    for (let row = 0; row < rows; row += 1) if (kmAt(row) < least) least = kmAt(row);
    const pad2 = Math.min(PAD_MOST, Math.ceil((Number(zone.blendKm) || 0) / 2 / least) + 1);
    const width = cols + 2 * pad2;
    const height = rows + 2 * pad2;
    const mask = new Uint8Array(width * height);
    const shape = projectRegion(frame, { geometry: { type: "Polygon", coordinates: curvedRings(zone) } });
    if (shape.polygons.length === 0 || shape.east < -pad2 || shape.west > cols + pad2 || shape.north < -pad2 || shape.south > rows + pad2) continue;
    let filled = 0;
    for (const rings of shape.polygons) filled += fillPolygon(rings, mask, width, height, -pad2, -pad2, 1, 1);
    if (filled === 0) continue;
    const inside = chamfer(mask, width, height, 0);
    const outside = chamfer(mask, width, height, 1);
    const weights = new Float32Array(cols * rows);
    let any = false;
    for (let row = 0; row < rows; row += 1) {
      const km = kmAt(row + 0.5);
      for (let col = 0; col < cols; col += 1) {
        const at = (row + pad2) * width + col + pad2;
        const into = mask[at] === 1 ? inside[at] / 3 : -outside[at] / 3;
        const blend = Number(zone.blendKm) || 0;
        const weight = blend > 0 ? within(0.5 + into * km / blend, 0, 1) : mask[at] === 1 ? 1 : 0;
        weights[row * cols + col] = weight;
        if (weight > 0) any = true;
      }
    }
    if (any) found.push({ zone, weights });
  }
  if (found.length === 0) return null;
  for (let cell = 0; cell < cols * rows; cell += 1) {
    let total = 0;
    for (const entry of found) total += entry.weights[cell];
    if (total > 1) for (const entry of found) entry.weights[cell] /= total;
  }
  battle.zones = found;
  return found;
};
var zonesToday = (run, battle, date, lat) => {
  const zones = zonesOver(run, battle);
  if (!zones) return null;
  if (battle.zonesDate === date && battle.zonesLat === lat) return battle.zonesMix;
  battle.zonesDate = date;
  battle.zonesLat = lat;
  battle.zonesMix = zones.map((entry) => ({ ...entry, mix: zoneMixOn(entry.zone, date, lat) }));
  return battle.zonesMix;
};
var climateAt = (today, cell) => {
  const out = { ...NEUTRAL_EFFECTS };
  if (!today || cell < 0) return out;
  let rest = 1;
  const sum = { pace: 0, attack: 0, wear: 0, cold: 0, heat: 0, air: 0, freezes: 0 };
  for (const { weights, mix } of today) {
    const weight = weights[cell];
    if (!(weight > 0)) continue;
    rest -= weight;
    for (const key of Object.keys(sum)) sum[key] += weight * mix.effects[key];
  }
  if (rest >= 1) return out;
  for (const key of Object.keys(sum)) out[key] = sum[key] + (rest > 0 ? rest * NEUTRAL_EFFECTS[key] : 0);
  return out;
};
var oddsAt = (today, cell, worldOdds) => {
  if (!today || cell < 0) return { odds: worldOdds, zone: null };
  const odds2 = Object.fromEntries(WEATHER_STATES.map((state2) => [state2, 0]));
  let rest = 1;
  let top = null;
  for (const entry of today) {
    const weight = entry.weights[cell];
    if (!(weight > 0)) continue;
    rest -= weight;
    for (const state2 of WEATHER_STATES) odds2[state2] += weight * entry.mix.odds[state2];
    if (!top || weight > top.weight) top = { weight, zone: entry.zone, mix: entry.mix };
  }
  if (rest >= 1) return { odds: worldOdds, zone: null };
  if (rest > 0) for (const state2 of WEATHER_STATES) odds2[state2] += rest * worldOdds[state2];
  return { odds: odds2, zone: top && top.weight >= 0.5 ? top : null };
};

// src/runtime/fronts/weather.js
var WEATHER_STATES = Object.freeze(["clear", "rain", "storm", "mud", "snow", "blizzard", "frost", "heat", "fog"]);
var SEASONS = Object.freeze(["winter", "spring", "summer", "autumn"]);
var CLIMATES = Object.freeze(["polar", "continental", "arid", "tropical"]);
var effect = (pace, attack, wear, rest, air, cold, heat) => Object.freeze({ pace, attack, wear, rest, air, cold, heat });
var WEATHER = Object.freeze({
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
var WEATHER_LOSS = 1.2;
var odds = (fields) => Object.freeze({ clear: 0, rain: 0, storm: 0, mud: 0, snow: 0, blizzard: 0, frost: 0, heat: 0, fog: 0, ...fields });
var WEATHER_ODDS = Object.freeze({
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
var SPELL_DAYS = 4;
var SPELL_EPOCH = "2000-01-01";
var climateOf = (lat) => {
  const away = lat < 0 ? -lat : lat;
  return away >= 60 ? "polar" : away >= 40 ? "continental" : away >= 20 ? "arid" : "tropical";
};
var seasonOf = (month, lat) => {
  const turned = lat < 0 ? (month + 5) % 12 + 1 : month;
  return turned === 12 || turned <= 2 ? "winter" : turned <= 5 ? "spring" : turned <= 8 ? "summer" : "autumn";
};
var pickWeather = (table, draw2) => {
  let sum = 0;
  for (const state2 of WEATHER_STATES) {
    sum += table[state2] ?? 0;
    if (draw2 < sum) return state2;
  }
  return "clear";
};
var weatherOn = ({ seed = "", place = "", lat = 45, date = "", odds: odds2 = null } = {}) => {
  const climate = climateOf(lat);
  const parsed = parseGameDate(date);
  if (!parsed) return { state: "clear", season: "", climate };
  const season = seasonOf(parsed.month, lat);
  return { state: pickWeather(odds2 ?? WEATHER_ODDS[climate][season], weatherDraw(seed, place, date)), season, climate };
};
var weatherDraw = (seed, place, date) => {
  const days = diffGameDays(SPELL_EPOCH, date);
  const spell = Math.floor((Number.isFinite(days) ? days : 0) / SPELL_DAYS);
  return hashSeed(`${seed}|${place}|${spell}|weather`) % 1e4 / 1e4;
};
var zoneSkyOn = (run, zone, date, seed) => {
  if (run.zoneSkiesDate !== date) {
    const zones = Array.isArray(run.input?.climateZones) ? run.input.climateZones : [];
    if (!run.zoneNeighbours) run.zoneNeighbours = zoneNeighbours(zones);
    run.zoneSkies = zoneWeathersOn({ seed, zones, date, neighbours: run.zoneNeighbours });
    run.zoneSkiesDate = date;
  }
  const found = run.zoneSkies.find((entry) => entry.zone === zone) ?? run.zoneSkies.find((entry) => entry.zone?.id === zone?.id);
  return found ? { state: found.state, season: found.season, climate: found.climate } : zoneWeatherOn({ seed, zone, date });
};
var skyAt = (run, battle, date) => {
  if (battle.climateFor !== battle.place) {
    const [, lat] = battle.place.toLngLat(battle.field.cols / 2, battle.field.rows / 2);
    battle.climateLat = Math.round(lat * 100) / 100;
    battle.climateFor = battle.place;
  }
  const seed = String(run.input?.climateSeed ?? run.seed ?? "");
  const today = zonesToday(run, battle, date, battle.climateLat);
  const parsed = parseGameDate(date);
  const worldOdds = parsed ? WEATHER_ODDS[climateOf(battle.climateLat)][seasonOf(parsed.month, battle.climateLat)] : null;
  const middle = cellAt(battle.field, battle.field.cols / 2, battle.field.rows / 2);
  const there = today && worldOdds ? oddsAt(today, middle, worldOdds) : null;
  const sky = there?.zone ? zoneSkyOn(run, there.zone.zone, date, seed) : weatherOn({ seed, place: battle.name, lat: battle.climateLat, date, odds: there ? there.odds : null });
  if (there?.zone) sky.season = `${there.zone.zone.name ? `${there.zone.zone.name}, ` : ""}${sky.season}`;
  const forced = run.steer?.weather;
  return { sky, today, middle, state: typeof forced === "string" && WEATHER[forced] ? forced : sky.state };
};
var skyOver = (run, battle, day) => {
  const { sky, today, middle, state: state2 } = skyAt(run, battle, run.dateOf(day));
  battle.climateToday = today;
  const local = today ? climateAt(today, middle) : null;
  battle.sky = { ...sky, state: state2, effects: local && local.air !== 1 ? { ...WEATHER[state2], air: WEATHER[state2].air * local.air } : WEATHER[state2] };
  if (!battle.skies) battle.skies = {};
  battle.skies[state2] = (battle.skies[state2] ?? 0) + 1;
  return battle.sky;
};
var harshnessOf = (sky, troop) => sky ? sky.effects.cold + sky.effects.heat + (troop.climate ? troop.climate.cold + troop.climate.heat : 0) : 0;
var weatherLoss = (sky, troop, exposure = null) => {
  if (!sky) return 0;
  const harsh = harshnessOf(sky, troop);
  if (!(harsh > 0)) return 0;
  const short = troop.pocket ? 1 : 1 - troop.supply;
  const unsupplied = short > 0 ? harsh * WEATHER_LOSS * short : 0;
  if (!exposure) return unsupplied;
  const tired = troop.fatigue > 0 ? troop.fatigue < 1 ? troop.fatigue : 1 : 0;
  const lacking = exposure.short > 0 ? exposure.short < 1 ? exposure.short : 1 : 0;
  const exposed = harsh * ATTRITION_WEATHER * (1 + ATTRITION_TIRED * tired) * (troop.dug ? ATTRITION_DUG : 1);
  return (unsupplied + exposed) * (1 + ATTRITION_SHORT * lacking);
};

// src/runtime/fronts/dawn.js
var steered = (run, key, side) => {
  const list2 = run.steer?.readiness?.[key];
  const value = Array.isArray(list2) ? Number(list2[side]) : NaN;
  return Number.isFinite(value) && value >= 0 ? value : 1;
};
var dawnsOn = (run) => anyMechanic(run.mech) || Boolean(run.steer?.readiness);
var dawn = (run, battle, day) => {
  if (!dawnsOn(run)) return;
  if (run.mech.walls) {
    raiseWalls(run, battle, run.dateOf(day));
    battle.kept = keptWith(battle);
  }
  const sky = run.mech.weather ? skyOver(run, battle, day) : null;
  if (!sky) battle.sky = null;
  const pace = sky ? sky.effects.pace : 1;
  const blows = sky ? sky.effects.attack : 1;
  const air = run.mech.air ? skyOfWings(run, battle, day) : null;
  battle.works = run.mech.fatigue ? STRONG_WORKS : null;
  battle.corridors = run.mech.supply === true;
  const counting = run.mech.attrition === true;
  if (counting && !battle.outBy) {
    battle.outBy = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
    battle.harshBy = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
    battle.lostBy = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
  }
  battle.exposure = counting ? [{ short: battle.short?.[0] ?? 0 }, { short: battle.short?.[1] ?? 0 }] : null;
  for (const side of [0, 1]) {
    const punch = steered(run, "punch", side);
    const guard = steered(run, "guard", side);
    const legs = steered(run, "legs", side);
    for (const troop of battle.troops[side]) {
      if (!isLive(troop)) continue;
      const worth = battle.worth ? battle.worth[side][troop.owner] ?? 1 : 1;
      const tired = run.mech.fatigue && troop.fatigue > 0;
      troop.climate = sky && battle.climateToday ? climateAt(battle.climateToday, cellAt(battle.field, troop.x, troop.y)) : null;
      const local = troop.climate;
      if (counting) {
        battle.outBy[side].set(troop.owner, (battle.outBy[side].get(troop.owner) ?? 0) + 1);
        if (sky && harshnessOf(sky, troop) >= ATTRITION_HARSH_FROM) battle.harshBy[side].set(troop.owner, (battle.harshBy[side].get(troop.owner) ?? 0) + 1);
      }
      const still = run.mech.fatigue && troop.still === true ? 1 + STILL_EDGE : 1;
      troop.punch = (tired ? punch * punchLeft(troop.fatigue) : punch) * worth * blows * (air ? air.punch[side] : 1) * (local ? local.attack : 1) * still;
      troop.guard = (tired ? guard * guardLeft(troop.fatigue) : guard) * worth * (air ? air.guard[side] : 1) * still;
      troop.legs = (tired ? legs * legsLeft(troop.fatigue) : legs) * pace * (air ? air.legs[side] : 1) * (local ? local.pace : 1);
    }
  }
};
var markAdvance = (run, battle, day) => {
  for (const side of [0, 1]) {
    for (const troop of battle.troops[side]) {
      if (!isLive(troop)) continue;
      const advanced = troop.walkedToday === true || troop.fought === true;
      troop.still = !advanced;
      if (!run.mech.supply) continue;
      const name = battle.sides[side][troop.owner];
      if (!name) continue;
      const key = String(name).toLowerCase();
      let entry = run.effort.get(key);
      if (!entry) {
        entry = { name: String(name), advanced: 0, troopDays: 0, warDays: 0, lastDay: -1 };
        run.effort.set(key, entry);
      }
      entry.troopDays += 1;
      if (advanced) entry.advanced += 1;
      if (entry.lastDay !== day) {
        entry.lastDay = day;
        entry.warDays += 1;
      }
    }
  }
};
var dusk = (run, battle, day) => {
  if (!anyMechanic(run.mech)) return;
  if (run.mech.air) {
    airStrikes(battle);
    wearWings(run, battle);
  }
  if (run.mech.fatigue) tireDay(run, battle, battle.sky ? { wear: battle.sky.effects.wear, rest: battle.sky.effects.rest } : void 0);
  if (run.mech.fatigue || run.mech.supply) markAdvance(run, battle, day);
  if (run.mech.military) {
    const budget = mendBudget(run, day);
    battle.mendOf = (side, owner) => budget(battle.sides[side][owner]);
  } else battle.mendOf = null;
};

// src/runtime/fronts/muster.js
var musterShare = (run, name, days) => {
  const table = run.musterOf?.(name)?.table;
  if (!Array.isArray(table) || table.length === 0 || !(days >= 0)) return 1;
  const at = Math.floor(days);
  const called = at >= table.length ? 1 : table[at];
  return MUSTER_STANDING_SHARE + (1 - MUSTER_STANDING_SHARE) * called;
};
var levyPending = (levy, side) => (Array.isArray(levy?.[side]) ? levy[side] : []).reduce((sum, entry) => sum + Math.max(0, entry.t - entry.r), 0);
var levyOwed = (levy) => levyPending(levy, 0) + levyPending(levy, 1) > 0;

// src/runtime/fronts/deploy.js
var SWARM = "swarm";
var DEPLOY_REACH_KM = 40;
var DEPLOY_WAY_MOST = MAX_WAY_POINTS * 4;
var DEPLOY_WHY = Object.freeze({
  "reinforce-no-men": "men",
  "reinforce-full": "full",
  "reinforce-no-ground": "ground",
  "reinforce-halted": "halted",
  "side-not-fighting": "side"
});
var WHY_WORDS = Object.values(DEPLOY_WHY);
var clean = (value, most = 200) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, most).trim();
var fold4 = (value) => clean(value).toLowerCase();
var deployCells = (battle, side, member, cells) => {
  const lines = Array.isArray(battle.deploy) && Array.isArray(battle.deploy[side]) ? battle.deploy[side] : [];
  const line = lines.find((entry) => fold4(entry.country) === fold4(member) && entry.form !== SWARM);
  if (!line) return cells;
  const { field, place } = battle;
  const { cols, rows } = field;
  const reach = Math.max(1, Math.round(DEPLOY_REACH_KM / battle.frame.km));
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const take = (x, y) => {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    let best = -1;
    let bestAt = reach * reach + 1;
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const gx = cx + dx;
        const gy = cy + dy;
        const far = dx * dx + dy * dy;
        if (gx < 0 || gy < 0 || gx >= cols || gy >= rows || far >= bestAt) continue;
        const cell = gy * cols + gx;
        if (field.holders[cell] !== side) continue;
        best = cell;
        bestAt = far;
      }
    }
    if (best >= 0 && !seen.has(best)) {
      seen.add(best);
      out.push(best);
    }
  };
  const points = line.way.map(([lng, lat]) => place.toCell(lng, lat));
  for (let at = 1; at < points.length; at += 1) {
    const [ax, ay] = points[at - 1];
    const [bx, by] = points[at];
    const steps = Math.max(1, Math.floor(Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay))) + 1);
    for (let step = at === 1 ? 0 : 1; step <= steps; step += 1) take(ax + (bx - ax) * step / steps, ay + (by - ay) * step / steps);
  }
  return out.length > 0 ? out : cells;
};

// src/runtime/fronts/chronicle.js
var CHRONICLE_KINDS = Object.freeze(["offensive", "counter", "city", "pocket", "siege", "breached", "destroyed", "invaded", "attacked", "landed", "withdrew", "returned", "assault"]);

// src/runtime/fronts/closing.js
var heading = [0, 0];
var liveOrder = (troop) => troop.order && !troop.order.done ? troop.order : null;
var sparedCell = (battle, side, cell) => {
  if (battle.kept[side] && battle.kept[side][cell] === 1) return true;
  const discs = battle.spared[side];
  const x = cell % battle.field.cols + 0.5;
  const y = Math.floor(cell / battle.field.cols) + 0.5;
  for (let at = 0; at < discs.length; at += 3) {
    if ((x - discs[at]) * (x - discs[at]) + (y - discs[at + 1]) * (y - discs[at + 1]) <= discs[at + 2] * discs[at + 2]) return true;
  }
  return false;
};
var booksOf = (battle) => {
  const { size } = battle.field;
  if (battle.close && battle.close.size === size) return battle.close;
  const pair = (Kind) => [new Kind(size), new Kind(size)];
  battle.close = {
    size,
    key: "",
    squeezed: pair(Uint8Array),
    was: pair(Uint8Array),
    prey: pair(Uint8Array),
    toPrey: pair(Int32Array),
    preyNear: [new Int32Array(size).fill(-1), new Int32Array(size).fill(-1)],
    toSupplied: pair(Int32Array),
    pockets: [[], []],
    cut: [false, false],
    grip: new Int32Array(size),
    toTaken: new Int32Array(size),
    part: new Int32Array(size),
    steps: new Int32Array(size),
    label: new Int32Array(size)
  };
  return battle.close;
};
var squeeze = (battle, books, side) => {
  const { field, place } = battle;
  const { cols, rows, size, holders } = field;
  const other = 1 - side;
  const cellKm = battle.frame.km;
  const neck = GRIP_KM * 3 / cellKm;
  const { grip, toTaken, part, steps } = books;
  const fed = battle.fed;
  books.was[side].set(books.squeezed[side]);
  books.squeezed[side].fill(0);
  distanceFrom(cols, rows, (cell) => holders[cell] === other && fed[other][cell] === 1 && books.was[other][cell] === 0, grip);
  distanceFrom(cols, rows, (cell) => holders[cell] === other && battle.homes[cell] !== other, toTaken);
  const fedMine = fed[side];
  const beside = [0, 0, 0, 0];
  const neighbours = (cell) => {
    const col = cell % cols;
    beside[0] = col > 0 ? cell - 1 : -1;
    beside[1] = col < cols - 1 ? cell + 1 : -1;
    beside[2] = cell >= cols ? cell - cols : -1;
    beside[3] = cell + cols < size ? cell + cols : -1;
  };
  part.fill(-1);
  const parts = [];
  const queue = [];
  const stack = [];
  for (let start = 0; start < size; start += 1) {
    if (holders[start] !== side || fedMine[start] !== 1 || grip[start] <= neck || part[start] >= 0) continue;
    const id = parts.length;
    let count = 0;
    part[start] = id;
    stack.push(start);
    while (stack.length) {
      const cell = stack.pop();
      count += 1;
      steps[cell] = 0;
      queue.push(cell);
      neighbours(cell);
      for (let way = 0; way < 4; way += 1) {
        const next = beside[way];
        if (next < 0 || part[next] >= 0 || holders[next] !== side || fedMine[next] !== 1 || grip[next] <= neck) continue;
        part[next] = id;
        stack.push(next);
      }
    }
    parts.push({ id, piece: battle.bodyOf[side][start], count });
  }
  const body = /* @__PURE__ */ new Map();
  for (const entry of parts) if (!body.has(entry.piece) || entry.count > body.get(entry.piece).count) body.set(entry.piece, entry);
  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head];
    neighbours(cell);
    for (let way = 0; way < 4; way += 1) {
      const next = beside[way];
      if (next < 0 || part[next] >= 0 || holders[next] !== side || fedMine[next] !== 1) continue;
      part[next] = part[cell];
      steps[next] = steps[cell] + 1;
      queue.push(next);
    }
  }
  const strand = STRAND_KM / cellKm;
  const hanging = books.label.fill(0);
  let any = false;
  for (const cell of queue) {
    const entry = parts[part[cell]];
    if (body.get(entry.piece) !== entry || grip[cell] <= neck && steps[cell] > strand) {
      hanging[cell] = 1;
      any = true;
    }
  }
  if (!any) return;
  const standing2 = /* @__PURE__ */ new Map();
  for (const troop of battle.troops[side]) {
    if (!isLive(troop)) continue;
    const here = cellAt(field, troop.x, troop.y);
    if (here < 0 || hanging[here] !== 1) continue;
    const order = liveOrder(troop);
    const entry = standing2.get(here) ?? [0, 0];
    entry[order && order.kind !== "breakout" && order.kind !== "fallback" && order.kind !== "withdraw" ? 1 : 0] += 1;
    standing2.set(here, entry);
  }
  const near = SQUEEZED_NEAR_KM * 3 / cellKm;
  for (const start of queue) {
    if (hanging[start] !== 1) continue;
    const cells = [];
    let taken = 0;
    let gripped = 0;
    let holding = 0;
    let attacking = 0;
    let km2 = 0;
    hanging[start] = 2;
    stack.push(start);
    while (stack.length) {
      const cell = stack.pop();
      cells.push(cell);
      const rowKm = place.rowKm[Math.floor(cell / cols)];
      km2 += rowKm * rowKm;
      if (battle.homes[cell] !== side) taken += 1;
      if (toTaken[cell] <= near) gripped += 1;
      const there = standing2.get(cell);
      if (there) {
        holding += there[0];
        attacking += there[1];
      }
      neighbours(cell);
      for (let way = 0; way < 4; way += 1) {
        const next = beside[way];
        if (next < 0 || hanging[next] !== 1) continue;
        hanging[next] = 2;
        stack.push(next);
      }
    }
    if (km2 < SQUEEZED_MIN_KM2 || taken < cells.length * SQUEEZED_TAKEN && gripped < cells.length * SQUEEZED_NEAR) continue;
    if (attacking > 0 && attacking >= holding) continue;
    for (const cell of cells) if (!sparedCell(battle, other, cell)) books.squeezed[side][cell] = 1;
  }
};
var findPrey = (battle) => {
  const { field, place } = battle;
  const { cols, rows, size, holders } = field;
  const books = booksOf(battle);
  if (battle.takenFor !== field || battle.takenTurns !== field.turns) {
    let taken = 0;
    for (let cell = 0; cell < size; cell += 1) if (holders[cell] <= HOLDER_SIDE_B && battle.homes[cell] !== holders[cell] && battle.homes[cell] <= HOLDER_SIDE_B) taken += 1;
    battle.takenCells = taken;
    battle.takenFor = field;
    battle.takenTurns = field.turns;
  }
  const quiet = battle.takenCells === 0 && battle.pockets.length === 0;
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    if (quiet) {
      if (books.key !== "quiet") {
        books.squeezed[side].fill(0);
        books.was[side].fill(0);
      }
    } else squeeze(battle, books, side);
  }
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      const here = isLive(troop) ? cellAt(field, troop.x, troop.y) : -1;
      troop.squeezed = here >= 0 && books.squeezed[side][here] === 1;
      if (troop.squeezed) troop.pocket = true;
    }
  }
  if (quiet && books.key === "quiet") return books;
  books.key = quiet ? "quiet" : "";
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    const other = 1 - side;
    const prey = books.prey[side];
    prey.fill(0);
    let any = false;
    for (let cell = 0; cell < size && !quiet; cell += 1) {
      if (holders[cell] !== other) continue;
      const pocket = battle.pocketOf ? battle.pocketOf[other][cell] : -1;
      if (pocket >= 0 && !battle.pockets[pocket].siege || books.squeezed[other][cell] === 1 && !sparedCell(battle, side, cell)) {
        prey[cell] = 1;
        any = true;
      }
    }
    const label = books.label.fill(-1);
    const pockets = [];
    const stack = [];
    for (let start = 0; start < size && any; start += 1) {
      if (prey[start] !== 1 || label[start] >= 0) continue;
      const pocket = { id: pockets.length, km2: 0, cx: 0, cy: 0, cells: 0, inside: [], held: 0, needed: 0 };
      label[start] = pocket.id;
      stack.push(start);
      while (stack.length) {
        const cell = stack.pop();
        const col = cell % cols;
        const row = (cell - col) / cols;
        pocket.cells += 1;
        pocket.km2 += place.rowKm[row] * place.rowKm[row];
        pocket.cx += col + 0.5;
        pocket.cy += row + 0.5;
        for (const next of [col > 0 ? cell - 1 : -1, col < cols - 1 ? cell + 1 : -1, cell - cols, cell + cols]) {
          if (next < 0 || next >= size || prey[next] !== 1 || label[next] >= 0) continue;
          label[next] = pocket.id;
          stack.push(next);
        }
      }
      pocket.cx /= pocket.cells;
      pocket.cy /= pocket.cells;
      pockets.push(pocket);
    }
    battle.troops[other].forEach((troop, index) => {
      const at = isLive(troop) ? cellAt(field, troop.x, troop.y) : -1;
      if (at < 0 || label[at] < 0) return;
      pockets[label[at]].inside.push(index);
      pockets[label[at]].held += troop.strength;
    });
    for (const pocket of pockets) {
      const rim = 2 * Math.sqrt(Math.PI * pocket.km2);
      pocket.needed = Math.max(CLOSE_LEAST, Math.min(CLOSE_MOST, Math.ceil(rim / CLOSE_RIM_KM) + Math.ceil(pocket.held / CLOSE_STRENGTH)));
    }
    books.pockets[side] = pockets;
    if (pockets.length > 0) nearestOf(cols, rows, label, books.toPrey[side], books.preyNear[side]);
    else {
      books.toPrey[side].fill(FAR_THIRDS);
      books.preyNear[side].fill(-1);
    }
  }
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    books.cut[side] = battle.troops[side].some((troop) => isLive(troop) && troop.pocket);
    if (books.cut[side]) distanceFrom(cols, rows, (cell) => holders[cell] === side && battle.fed[side][cell] === 1 && books.squeezed[side][cell] === 0, books.toSupplied[side]);
  }
  return books;
};
var onSiegeRing = (battle, side, troop) => {
  for (const siege of battle.sieges) {
    if (siege.by !== side) continue;
    const reach = (SIEGE_SPARE_KM + 3 * battle.radiusKm[side]) / battle.place.kmAt(siege.y);
    if ((troop.x - siege.x) * (troop.x - siege.x) + (troop.y - siege.y) * (troop.y - siege.y) <= reach * reach) return true;
  }
  return false;
};
var drawIn = (battle, side, day) => {
  const books = battle.close;
  const { field } = battle;
  const cellKm = battle.frame.km;
  const troops = battle.troops[side];
  for (const pocket of books.pockets[side]) {
    const near = [];
    let already = 0;
    const bearings = [];
    const bearingOf = (troop) => {
      const dx = troop.x - pocket.cx;
      const dy = troop.y - pocket.cy;
      const length = Math.sqrt(dx * dx + dy * dy);
      return length > 0 ? [dx / length, dy / length] : [0, 0];
    };
    troops.forEach((troop, index) => {
      if (!isLive(troop) || troop.kind === KIND_ARTILLERY || troop.pocket) return;
      const cell = cellAt(field, troop.x, troop.y);
      if (cell < 0 || books.preyNear[side][cell] !== pocket.id) return;
      const left = books.toPrey[side][cell] / 3 * cellKm;
      const order = liveOrder(troop);
      if (order && order.kind === "reduce") {
        already += 1;
        bearings.push(bearingOf(troop));
        return;
      }
      if (troop.dug || troop.strength < CLOSE_UNDER_STRENGTH || troop.rested > day) return;
      if (order && (order.kind === "assault" || order.kind === "fallback" || order.kind === "withdraw")) return;
      if (onSiegeRing(battle, side, troop)) return;
      const live = order ? 1 : 0;
      const beside = left <= CLOSE_NEAR_KM[live];
      if (!beside && left > CLOSE_FAR_KM[live]) return;
      const toward2 = left > 0.5 * cellKm && downhill(field, books.toPrey[side], troop.x, troop.y, heading) ? [heading[0], heading[1]] : [troop.hx, troop.hy];
      const facing = toward2[0] * troop.hx + toward2[1] * troop.hy;
      const turn = !order ? 0 : facing >= -0.3 ? 1 : 2;
      if (order && facing < 0.5 && pocket.inside.length === 0) return;
      near.push({ index, troop, toward: toward2, turn, order, bearing: bearingOf(troop), key: (beside ? 0 : 1e6) + left * (turn === 0 ? 0.8 : turn === 1 ? 1 : 1.6) });
    });
    near.sort((a, b) => a.key - b.key || a.index - b.index);
    const apart = CLOSE_APART_COS[Math.max(CLOSE_LEAST, Math.min(CLOSE_MOST, pocket.needed)) - CLOSE_LEAST];
    const fresh = [];
    const crowding = [];
    for (const entry of near) {
      const crowded = bearings.some((taken) => taken[0] * entry.bearing[0] + taken[1] * entry.bearing[1] > apart) || fresh.some((taken) => taken.bearing[0] * entry.bearing[0] + taken.bearing[1] * entry.bearing[1] > apart);
      (crowded ? crowding : fresh).push(entry);
    }
    for (const { troop, toward: toward2, turn, order } of [...fresh, ...crowding]) {
      if (already >= pocket.needed) break;
      troop.order = { kind: "reduce", since: day, day, resume: order, entered: false };
      let hx = turn === 1 ? troop.hx + 2 * toward2[0] : toward2[0];
      let hy = turn === 1 ? troop.hy + 2 * toward2[1] : toward2[1];
      const length = Math.sqrt(hx * hx + hy * hy);
      if (length > 0) {
        hx /= length;
        hy /= length;
        troop.hx = hx;
        troop.hy = hy;
      }
      troop.fallback = null;
      already += 1;
    }
  }
};

// src/runtime/fronts/combat.js
var clampRatio = (value) => value < ATTRITION_RATIO_MIN ? ATTRITION_RATIO_MIN : value > ATTRITION_RATIO_MAX ? ATTRITION_RATIO_MAX : value;
var terrainDefence = (speed) => 1 + Math.min(0.8, Math.max(0, 1 - speed)) * TERRAIN_DEFENCE_GAIN;
var defensivePower = (battle, side, troop, front = true) => troop.strength * TROOP_DEFENCE[troop.kind] * (!front ? 1 : troop.dug ? battle.works ? battle.works.defence : DUG_IN_DEFENCE : 1 + troop.dig) * battle.quality[side] * battle.edge[side].power * troop.supply * (troop.pocket ? POCKET_DEFENCE : 1) * troop.guard;
var offensivePower = (battle, side, troop) => troop.strength * TROOP_ATTACK[troop.kind] * battle.quality[side] * battle.edge[side].power * troop.supply * (troop.pocket ? POCKET_ATTACK : 1) * troop.punch;
var lookOf = (battle) => {
  if (battle.lookFor === battle.place) return battle.look;
  let least = Infinity;
  for (let row = 0; row < battle.place.rowKm.length; row += 1) if (battle.place.rowKm[row] < least) least = battle.place.rowKm[row];
  battle.look = Math.ceil(Math.max(REACH_MIN_CELLS, REACH_KM / least, STEER_PRESS_KM / least, 2 * Math.max(CONTROL_RADIUS_MIN_CELLS, CONTROL_RADIUS_MAX_KM / least)));
  battle.lookFor = battle.place;
  return battle.look;
};
var squaresOf = (battle, troops, wanted) => {
  const { cols, rows } = battle.field;
  const span = lookOf(battle);
  const across = Math.floor(cols / span) + 1;
  const down = Math.floor(rows / span) + 1;
  const heads = new Int32Array(across * down).fill(-1);
  const nexts = new Int32Array(troops.length);
  for (let index = troops.length - 1; index >= 0; index -= 1) {
    const troop = troops[index];
    if (!wanted(troop)) continue;
    const square = Math.min(down - 1, Math.max(0, Math.floor(troop.y / span))) * across + Math.min(across - 1, Math.max(0, Math.floor(troop.x / span)));
    nexts[index] = heads[square];
    heads[square] = index;
  }
  return { troops, heads, nexts, across, down, span };
};
var eachNear = (squares, x, y, visit) => {
  const col = Math.min(squares.across - 1, Math.max(0, Math.floor(x / squares.span)));
  const row = Math.min(squares.down - 1, Math.max(0, Math.floor(y / squares.span)));
  for (let dy = -1; dy <= 1; dy += 1) {
    if (row + dy < 0 || row + dy >= squares.down) continue;
    for (let dx = -1; dx <= 1; dx += 1) {
      if (col + dx < 0 || col + dx >= squares.across) continue;
      for (let at = squares.heads[(row + dy) * squares.across + col + dx]; at >= 0; at = squares.nexts[at]) visit(squares.troops[at], at);
    }
  }
};
var spared = (spare, x, y) => {
  for (let at = 0; at < spare.length; at += 3) {
    const dx = x - spare[at];
    const dy = y - spare[at + 1];
    if (dx * dx + dy * dy <= spare[at + 2] * spare[at + 2]) return true;
  }
  return false;
};
var kernel = (distance, reach) => {
  const left = 1 - distance / reach;
  return left > 0 ? left * left : 0;
};
var stepsToday = (troop) => troop.stepping && isLive(troop);
var ended = [0, 0];
var face = [0, 0];
var steppers = (battle) => {
  const list2 = [];
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    battle.troops[side].forEach((troop, index) => {
      if (!stepsToday(troop)) return;
      troop.entry = { side, index, troop };
      list2.push(troop.entry);
    });
  }
  return list2;
};
var readDefender = (battle, side, troop, attackers, moment) => {
  if (troop.flankMoment === moment) return;
  troop.flankMoment = moment;
  const reach = reachCells(battle.place.kmAt, troop.y);
  if (!downhill(battle.field, battle.toSide[1 - side], troop.x, troop.y, face)) {
    troop.faceX = 0;
    troop.faceY = 0;
    troop.flank = 1;
    return;
  }
  const [faceX, faceY] = face;
  troop.faceX = faceX;
  troop.faceY = faceY;
  let round = 1;
  eachNear(attackers, troop.x, troop.y, (attacker) => {
    const dx = attacker.x - troop.x;
    const dy = attacker.y - troop.y;
    const apart = Math.sqrt(dx * dx + dy * dy);
    if (!(apart > 0) || apart > reach) return;
    const before = (dx * faceX + dy * faceY) / apart;
    if (before < round) round = before;
  });
  troop.flank = round < FLANK_OPPOSITE_COS ? SURROUNDED_DEFENCE : round < FLANK_BEHIND_COS ? FLANKED_DEFENCE : 1;
};
var defenceAgainst = (battle, side, defender, x, y) => {
  const front = (x - defender.x) * defender.faceX + (y - defender.y) * defender.faceY >= 0;
  return defensivePower(battle, side, defender, front) * defender.flank * (defender.walled > 0 ? 1 + WALL_DEFENCE_PER_LEVEL * defender.walled : 1);
};
var stepForward = (battle, paceKm, pace) => {
  const { field, arena, place, claims } = battle;
  const { kmAt } = place;
  const active = steppers(battle);
  const inPlay = (x, y) => x >= 0 && y >= 0 && x < field.cols && y < field.rows && field.play[Math.floor(y) * field.cols + Math.floor(x)] === 1;
  let parts = 1;
  for (const entry of active) {
    const { troop } = entry;
    const cell = Math.max(0, ownCell(field, entry.side, troop.x, troop.y));
    entry.radius = controlRadius(troop, kmAt);
    const spare = battle.spared[entry.side];
    const kept = battle.kept[entry.side];
    entry.forward = (x, y) => inPlay(x, y) && !spared(spare, x, y) && !(kept && kept[Math.floor(y) * field.cols + Math.floor(x)]) && (x - troop.x) * troop.axisX + (y - troop.y) * troop.axisY >= 0;
    entry.dayCells = paceKm[troop.kind] * arena.speed[cell] * troop.supply * pace * troop.drive * troop.paceFactor * battle.edge[entry.side].pace * troop.legs / kmAt(troop.y);
    parts = Math.max(parts, Math.ceil(entry.dayCells / (entry.radius * 0.5)));
  }
  parts = Math.min(SUBSTEPS_MAX, parts);
  const share = ATTRITION / 100 / parts;
  for (let part = 0; part < parts && active.length > 0; part += 1) {
    claims.moment += 1;
    const stepping = [squaresOf(battle, battle.troops[0], stepsToday), squaresOf(battle, battle.troops[1], stepsToday)];
    const standing2 = [squaresOf(battle, battle.troops[0], isLive), squaresOf(battle, battle.troops[1], isLive)];
    for (const entry of active) {
      const { side, troop } = entry;
      const reach = reachCells(kmAt, troop.y);
      let attack = 0;
      eachNear(stepping[side], troop.x, troop.y, (other) => {
        const dx = other.x - troop.x;
        const dy = other.y - troop.y;
        const weight = kernel(Math.sqrt(dx * dx + dy * dy), reach);
        if (weight > 0) attack += offensivePower(battle, side, other) * weight;
      });
      const aheadX = troop.x + troop.gx * entry.radius;
      const aheadY = troop.y + troop.gy * entry.radius;
      let defence = 0;
      let entrenched = 0;
      const sparing = battle.spared[side];
      eachNear(standing2[1 - side], aheadX, aheadY, (enemy) => {
        if (enemy.besieged || spared(sparing, enemy.x, enemy.y)) return;
        const dx = enemy.x - aheadX;
        const dy = enemy.y - aheadY;
        const weight = kernel(Math.sqrt(dx * dx + dy * dy), reach);
        if (!(weight > 0)) return;
        readDefender(battle, 1 - side, enemy, stepping[side], claims.moment);
        const part2 = defenceAgainst(battle, 1 - side, enemy, troop.x, troop.y) * weight;
        defence += part2;
        if (battle.works && (enemy.dug || enemy.dig > 0)) entrenched += part2 * (enemy.dug ? 1 : enemy.dig < battle.works.most ? enemy.dig / battle.works.most : 1);
      });
      const raw = defence;
      if (inPlay(aheadX, aheadY)) defence *= terrainDefence(arena.speed[Math.floor(aheadY) * field.cols + Math.floor(aheadX)]);
      const ratio = defence > 0 ? attack / defence : Infinity;
      const theirs = inPlay(aheadX, aheadY) && field.holders[Math.floor(aheadY) * field.cols + Math.floor(aheadX)] === 1 - side;
      const open = theirs ? Math.min(1, 1 / battle.edge[1 - side].power) : 1;
      const gain = Math.min(open, defence > 0 ? Math.min(1, Math.max(0, GAIN * (ratio - RATIO_NEEDED) / (ratio + RATIO_SOFTNESS))) : 1);
      entry.power = attack;
      entry.fromX = troop.x;
      entry.fromY = troop.y;
      const length = Math.min(entry.dayCells * gain / parts, entry.radius * 0.5);
      const ahead2 = length > 0.5 ? length : 0.5;
      const wall = battle.walls ? wallAhead(battle, side, troop.x + troop.gx * ahead2, troop.y + troop.gy * ahead2) : null;
      entry.length = !wall && length > 0 && stepAlong(troop.x, troop.y, troop.gx, troop.gy, length, entry.forward, ended) ? length : 0;
      entry.toX = entry.length > 0 ? ended[0] : troop.x;
      entry.toY = entry.length > 0 ? ended[1] : troop.y;
      if (wall && attack > 0) {
        wearWall(battle, wall, raw > 0 ? attack / defence : WALL_ODDS, troop.kind === KIND_ARTILLERY, 1 / parts);
        troop.loss += troop.strength * share * ATTACK_COST * (WALL_ASSAULT_COST - 1);
        troop.fought = true;
      }
      if (raw > 0 && attack > 0) {
        const works = battle.works && raw > 0 ? 1 + (battle.works.assault - 1) * (entrenched < raw ? entrenched / raw : 1) : 1;
        troop.loss += troop.strength * share * ATTACK_COST * clampRatio(Math.sqrt(defence / attack)) * works;
        troop.fought = true;
        const theirs2 = share * clampRatio(Math.sqrt(attack / defence));
        eachNear(standing2[1 - side], aheadX, aheadY, (enemy) => {
          if (enemy.besieged || spared(sparing, enemy.x, enemy.y)) return;
          const dx = enemy.x - aheadX;
          const dy = enemy.y - aheadY;
          const weight = kernel(Math.sqrt(dx * dx + dy * dy), reach);
          if (!(weight > 0)) return;
          enemy.loss += enemy.strength * theirs2 * (defenceAgainst(battle, 1 - side, enemy, troop.x, troop.y) * weight / raw) * (troop.reducing && enemy.pocket ? CLOSE_WEAR : 1);
          enemy.engaged = true;
        });
      }
    }
    for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
      const spare = battle.spared[side].length > 0 ? battle.spared[side] : null;
      const keep = battle.kept[side];
      for (const entry of active) {
        if (entry.side !== side || entry.length <= 0) continue;
        const { troop } = entry;
        takeCapsule(field, side, entry.fromX, entry.fromY, entry.toX, entry.toY, entry.radius, entry.radius, {
          claims,
          strength: entry.power,
          painter: troop.owner,
          from: part / parts,
          span: 1 / parts,
          spare,
          keep
        });
        troop.x = entry.toX;
        troop.y = entry.toY;
        troop.movedKm += entry.length * kmAt(troop.y);
        troop.walkedToday = true;
      }
    }
  }
  for (const entry of active) entry.troop.entry = null;
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    const spare = battle.spared[side].length > 0 ? battle.spared[side] : null;
    for (const troop of battle.troops[side]) {
      if (!troop.plant || !isLive(troop)) continue;
      const radius = controlRadius(troop, kmAt);
      takeCapsule(field, side, troop.x, troop.y, troop.x, troop.y, radius, radius, { painter: troop.owner, spare, keep: battle.kept[side] });
      troop.walkedToday = true;
    }
  }
  return active.length > 0 ? parts : 0;
};
var closeDay = (battle) => {
  const { kmAt } = battle.place;
  const standing2 = [squaresOf(battle, battle.troops[0], isLive), squaresOf(battle, battle.troops[1], isLive)];
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      if (!isLive(troop)) continue;
      if (!troop.besieged && !troop.engaged && !troop.walkedToday && troop.loss === 0) {
        const reach = reachCells(kmAt, troop.y);
        let theirs = 0;
        let ours = 0;
        eachNear(standing2[1 - side], troop.x, troop.y, (enemy) => {
          const dx = enemy.x - troop.x;
          const dy = enemy.y - troop.y;
          theirs += enemy.strength * kernel(Math.sqrt(dx * dx + dy * dy), reach);
        });
        if (theirs > 0) {
          eachNear(standing2[side], troop.x, troop.y, (friend) => {
            const dx = friend.x - troop.x;
            const dy = friend.y - troop.y;
            ours += friend.strength * kernel(Math.sqrt(dx * dx + dy * dy), reach);
          });
          troop.loss += troop.strength * (ATTRITION / 100) * QUIET_ATTRITION * clampRatio(theirs / ours);
        }
      }
    }
  }
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      if (!isLive(troop)) continue;
      const wasting = troop.besieged ? SIEGE_LOSS : troop.sealed ? POCKET_LOSS : troop.squeezed ? SQUEEZED_LOSS : 0;
      const weathered = battle.sky ? weatherLoss(battle.sky, troop, battle.exposure ? battle.exposure[side] : null) : 0;
      const wasted = wasting + weathered;
      if (battle.lostBy && wasted > 0) battle.lostBy[side].set(troop.owner, (battle.lostBy[side].get(troop.owner) ?? 0) + (wasted < troop.strength ? wasted : troop.strength));
      troop.strength -= troop.loss * (troop.dug ? battle.works ? battle.works.loss : DUG_IN_LOSS : 1) + wasted;
      if (troop.pocket && !troop.besieged && troop.engaged && troop.strength < GIVES_UP_UNDER) troop.strength = 0;
    }
  }
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      if (troop.strength > 0) {
        const busy = troop.order !== null && !troop.order.done;
        if (troop.dug) troop.dig = 1;
        else if (troop.movedKm > DIG_LOST_KM) troop.dig = 0;
        else if (!busy && troop.dig < (battle.works ? battle.works.most : DIG_MAX_HOLD)) {
          const most = battle.works ? battle.works.most : DIG_MAX_HOLD;
          troop.dig = Math.min(most, troop.dig + (battle.works ? battle.works.perDay : DIG_PER_DAY_HOLD));
        }
        if (!troop.pocket && troop.strength < 100 && battle.pool[side] > 0) {
          const budget = battle.mendOf ? battle.mendOf(side, troop.owner) : null;
          const sent = budget ? Math.min(REINFORCE_PER_DAY * battle.edge[side].mend, 100 - troop.strength, battle.pool[side], budget.left()) : Math.min(REINFORCE_PER_DAY * battle.edge[side].mend, 100 - troop.strength, battle.pool[side]);
          if (budget) budget.spend(sent);
          troop.strength += sent;
          battle.pool[side] -= sent;
          battle.mendedBy[side][troop.owner] = (battle.mendedBy[side][troop.owner] ?? 0) + sent;
        }
      } else {
        troop.strength = 0;
        troop.dig = 0;
        troop.dug = false;
        troop.order = null;
        troop.fallback = null;
      }
      troop.state = troop.strength <= 0 ? STATE_SPENT : troop.pocket ? STATE_ENCIRCLED : troop.walkedToday ? STATE_ADVANCING : troop.dug ? STATE_DUG_IN : STATE_HOLDING;
      troop.stepping = false;
      troop.walkedToday = false;
      troop.movedKm = 0;
      troop.loss = 0;
      troop.engaged = false;
      troop.fought = false;
    }
  }
};

// src/runtime/fronts/sectors.js
var DIAGONAL = 0.7071067811865476;
var AXES = Object.freeze([
  { x: 0, y: 1, high: "north", low: "south", name: "north-south", diagonal: false },
  { x: 1, y: 0, high: "east", low: "west", name: "east-west", diagonal: false },
  { x: DIAGONAL, y: DIAGONAL, high: "northeast", low: "southwest", name: "northeast-southwest", diagonal: true },
  { x: DIAGONAL, y: -DIAGONAL, high: "southeast", low: "northwest", name: "northwest-southeast", diagonal: true }
]);
var COMPASS_WORDS = Object.freeze(["north", "south", "east", "west", "northeast", "southwest", "southeast", "northwest"]);
var fold5 = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
var readSectors = (line) => {
  const { contour, count } = line;
  const spans = AXES.map((axis) => {
    let low = Infinity;
    let high = -Infinity;
    for (let vertex = 0; vertex < count; vertex += 1) {
      const along = contour.x[vertex] * axis.x + contour.y[vertex] * axis.y;
      if (along < low) low = along;
      if (along > high) high = along;
    }
    return count > 0 ? { low, high, extent: high - low } : { low: 0, high: 0, extent: 0 };
  });
  let widest = 0;
  for (let index = 1; index < AXES.length; index += 1) if (spans[index].extent > spans[widest].extent) widest = index;
  const least = spans[widest].extent * SECTOR_AXIS_SHARE;
  const fits = spans.map((span) => span.extent > 0 && span.extent >= least);
  const longest = AXES[widest].diagonal && fits[widest === 2 ? 3 : 2] ? spans[1].extent > spans[0].extent ? 1 : 0 : widest;
  const both = fits[0] && fits[1];
  const names = ["all"];
  const cuts = /* @__PURE__ */ new Map();
  const order = [longest, ...AXES.map((axis, index) => index).filter((index) => index !== longest)];
  for (const index of order) {
    if (!fits[index] || AXES[index].diagonal && !both) continue;
    const axis = AXES[index];
    const { low, extent } = spans[index];
    cuts.set(axis.high, { x: axis.x, y: axis.y, from: low + extent * 2 / 3, to: Infinity });
    cuts.set(axis.low, { x: axis.x, y: axis.y, from: -Infinity, to: low + extent / 3 });
    if (index !== longest) {
      names.push(axis.high, axis.low);
      continue;
    }
    names.push(axis.high, "centre", axis.low);
    cuts.set("centre", { x: axis.x, y: axis.y, from: low + extent / 3, to: low + extent * 2 / 3 });
  }
  return { axis: spans[longest].extent > 0 ? AXES[longest].name : "", names, cuts };
};
var parsePlace = (value) => {
  const text4 = fold5(value);
  const match = /^(city|region)\s*:\s*(.*)$/.exec(text4);
  return match ? { kind: match[1], name: match[2].trim() } : { kind: "", name: text4 };
};
var findPlace = (arena, value) => {
  const { kind, name } = parsePlace(value);
  if (!name) return null;
  if (kind !== "region") {
    const city = arena.cities.find((entry) => fold5(entry.name) === name);
    if (city) return { kind: "city", name: city.name, x: city.x, y: city.y, cell: city.cell };
  }
  if (kind !== "city") {
    for (let index = 1; index < arena.names.length; index += 1) {
      if (fold5(arena.names[index]) === name) return { kind: "region", name: arena.names[index], x: arena.centreX[index], y: arena.centreY[index], region: index };
    }
  }
  return null;
};
var placeText = (place) => `${place.kind}: ${place.name}`;
var describePoint = (arena, x, y) => {
  const { kmAt } = projectorOf(arena.frame);
  let best = null;
  let bestKm = Infinity;
  for (const city of arena.cities) {
    const dx = city.x - x;
    const dy = city.y - y;
    const km = Math.sqrt(dx * dx + dy * dy) * kmAt((city.y + y) / 2);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  if (best) return `city: ${best.name}`;
  if (x >= 0 && y >= 0 && x < arena.cols && y < arena.rows) {
    const region = arena.region[Math.floor(y) * arena.cols + Math.floor(x)];
    if (region > 0 && arena.names[region] !== arena.ids[region]) return `region: ${arena.names[region]}`;
  }
  return "";
};
var WHOLE_LINE = Object.freeze({ kind: "all" });
var nearestVertex = (line, x, y) => {
  const { contour, count } = line;
  let best = -1;
  let bestDistance = Infinity;
  for (let vertex = 0; vertex < count; vertex += 1) {
    const dx = contour.x[vertex] - x;
    const dy = contour.y[vertex] - y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = vertex;
    }
  }
  return best;
};
var resolveSector = (arena, line, sectors, value) => {
  const word = fold5(value);
  if (!word || word === "all") return WHOLE_LINE;
  const name = word === "center" ? "centre" : word;
  const cut = sectors.cuts.get(name);
  if (cut) return { kind: "cut", word: name, ...cut };
  if (name === "centre" || COMPASS_WORDS.includes(name)) return null;
  const place = findPlace(arena, value);
  if (!place) return null;
  const vertex = nearestVertex(line, place.x, place.y);
  if (vertex < 0) return null;
  return { kind: "place", word: placeText(place), px: line.contour.x[vertex], py: line.contour.y[vertex] };
};
var inSector = (sector, x, y, kmAt) => {
  if (sector.kind === "all") return true;
  if (sector.kind === "cut") {
    const along = x * sector.x + y * sector.y;
    return along >= sector.from && along <= sector.to;
  }
  const dx = x - sector.px;
  const dy = y - sector.py;
  return Math.sqrt(dx * dx + dy * dy) * kmAt((y + sector.py) / 2) <= PLACE_SECTOR_KM;
};
var sectorMiddle = (line, sector, kmAt) => {
  const { contour, count } = line;
  let sumX = 0;
  let sumY = 0;
  let inside = 0;
  let allX = 0;
  let allY = 0;
  for (let vertex = 0; vertex < count; vertex += 1) {
    allX += contour.x[vertex];
    allY += contour.y[vertex];
    if (!inSector(sector, contour.x[vertex], contour.y[vertex], kmAt)) continue;
    sumX += contour.x[vertex];
    sumY += contour.y[vertex];
    inside += 1;
  }
  if (inside > 0) return [sumX / inside, sumY / inside];
  return count > 0 ? [allX / count, allY / count] : [0, 0];
};

// src/runtime/fronts/command.js
var DIAGONAL2 = 0.7071067811865476;
var AXES2 = Object.freeze([[0, -1], [1, 0], [DIAGONAL2, -DIAGONAL2], [DIAGONAL2, DIAGONAL2]]);
var ORDINALS = Object.freeze(["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]);
var nearestOnRoute = (points, x, y) => {
  let best = Infinity;
  let at = 0;
  let part = 0;
  for (let index = 0; index + 1 < points.length; index += 1) {
    const [ax, ay] = points[index];
    const dx = points[index + 1][0] - ax;
    const dy = points[index + 1][1] - ay;
    const length = dx * dx + dy * dy;
    const along = length > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
    const off = (x - ax - dx * along) * (x - ax - dx * along) + (y - ay - dy * along) * (y - ay - dy * along);
    if (off < best) {
      best = off;
      at = index;
      part = along;
    }
  }
  return { at, part };
};

// src/runtime/fronts/way.js
var takeOrder = (troop, next) => {
  const busy = troop.order && !troop.order.done && (troop.order.kind === "reduce" || troop.order.kind === "assault") ? troop.order : null;
  if (busy && next) busy.resume = next;
  else troop.order = next;
};
var chanceOf = (battle, ...parts) => hashSeed([battle.seed, battle.name, ...parts].join("|")) % 1e4 / 1e4;
var aim = [0, 0];
var legsOf = (from, points) => {
  const legs = [];
  let [x, y] = from;
  for (const [ox, oy] of points) {
    const dx = ox - x;
    const dy = oy - y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0.01) legs.push({ ax: dx / length, ay: dy / length, ox, oy, length });
    x = ox;
    y = oy;
  }
  return legs;
};
var bendsOf = (field, cells) => {
  const point = (index) => [cells[index] % field.cols + 0.5, Math.floor(cells[index] / field.cols) + 0.5];
  const pulled = [0];
  for (let at = 0; at < cells.length - 1; ) {
    let next = at + 1;
    const [ax, ay] = point(at);
    for (let far = cells.length - 1; far > at + 1; far -= 1) {
      const [bx, by] = point(far);
      if (!clearBetween(field, ax, ay, bx, by)) continue;
      next = far;
      break;
    }
    pulled.push(next);
    at = next;
  }
  if (pulled.length - 1 <= WAY_LEGS_MAX) return pulled.slice(1).map(point);
  const kept = [0, cells.length - 1];
  while (kept.length - 1 < WAY_LEGS_MAX) {
    let worst = WAY_BEND_CELLS;
    let at = -1;
    for (let span = 0; span + 1 < kept.length; span += 1) {
      const [ax, ay] = point(kept[span]);
      const [bx, by] = point(kept[span + 1]);
      const length = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
      if (!(length > 0)) continue;
      for (let index = kept[span] + 1; index < kept[span + 1]; index += 1) {
        const [px, py] = point(index);
        const off = Math.abs((px - ax) * (by - ay) - (py - ay) * (bx - ax)) / length;
        if (off > worst) {
          worst = off;
          at = index;
        }
      }
    }
    if (at < 0) break;
    kept.push(at);
    kept.sort((a, b) => a - b);
  }
  return kept.slice(1).map(point);
};
var standingOf = (battle, side, picked) => {
  const { field } = battle;
  const troops = battle.troops[side];
  const toOther = measure(battle)[1 - side];
  let midX = 0;
  let midY = 0;
  let outX = 0;
  let outY = 0;
  for (const index of picked) {
    midX += troops[index].x / picked.length;
    midY += troops[index].y / picked.length;
    if (downhill(field, toOther, troops[index].x, troops[index].y, aim)) {
      outX += aim[0];
      outY += aim[1];
    }
  }
  if (outwardOf(field, side, midX, midY, OUTWARD_KM / battle.place.kmAt(midY), aim)) return { midX, midY, outX: aim[0], outY: aim[1] };
  const length = Math.sqrt(outX * outX + outY * outY);
  return { midX, midY, outX: length > 0 ? outX / length : side === 0 ? 1 : -1, outY: length > 0 ? outY / length : 0 };
};
var give = (battle, side, picked, { day, word, way, standing: standing2, breadthKm = 0, lagless = false }) => {
  if (picked.length === 0 || way.length === 0) return;
  const { kmAt } = battle.place;
  const troops = battle.troops[side];
  let midX = 0;
  let midY = 0;
  for (const index of picked) {
    midX += troops[index].x / picked.length;
    midY += troops[index].y / picked.length;
  }
  const legs = legsOf([midX, midY], way);
  if (legs.length === 0) return;
  const first = legs[0];
  const km = kmAt(midY);
  const across = (index) => (troops[index].x - midX) * -first.ay + (troops[index].y - midY) * first.ax;
  const ahead2 = (index) => (troops[index].x - midX) * first.ax + (troops[index].y - midY) * first.ay;
  const abreast = picked.slice().sort((a, b) => across(a) - across(b) || a - b);
  const forward = picked.slice().sort((a, b) => (word === "spearhead" ? (troops[b].kind === KIND_ARMOUR) - (troops[a].kind === KIND_ARMOUR) : 0) || ahead2(b) - ahead2(a) || a - b);
  const placeAbreast = new Map(abreast.map((index, rank) => [index, rank]));
  const placeForward = new Map(forward.map((index, rank) => [index, rank]));
  const extent = (across(abreast[abreast.length - 1]) - across(abreast[0])) * km;
  const brush = battle.radiusKm[side];
  let breadth = breadthKm > 0 ? breadthKm : word === "spearhead" ? SPEARHEAD_BREADTH_KM : word === "flank" || word === "encircle" ? COLUMN_BREADTH_KM : Math.max(GROUP_BREADTH_MIN_KM, Math.min(picked.length * brush * GROUP_BREADTH_BRUSHES, extent * GROUP_BREADTH_OF_EXTENT));
  if (word === "blitz") breadth = Math.max(GROUP_BREADTH_MIN_KM, breadth * BLITZ_BREADTH);
  const point = Math.max(2, Math.ceil(picked.length / 3));
  for (const index of picked) {
    const troop = troops[index];
    const share = (placeAbreast.get(index) + 0.5) / picked.length - 0.5;
    const rank = placeForward.get(index);
    let slot = share * breadth;
    let stop = 1;
    if (word === "spearhead") {
      if (rank < point && troop.kind !== KIND_ARTILLERY) {
        slot = share * breadth * POINT_BREADTH;
        stop = 1 - POINT_STOPS_SHORT * chanceOf(battle, "point", side, index);
      } else {
        const back = Math.max(0, rank - point) / Math.max(1, picked.length - point);
        stop = SHOULDER_STOPS[0] + (SHOULDER_STOPS[1] - SHOULDER_STOPS[0]) * (1 - back);
        slot = (share >= 0 ? 1 : -1) * (breadth * SHOULDER_OUT + SHOULDER_OUT_KM[0] + (SHOULDER_OUT_KM[1] - SHOULDER_OUT_KM[0]) * chanceOf(battle, "shoulder", side, index));
      }
    }
    const lag = lagless ? 0 : troop.lag + (troop.dug ? 1 : 0) + (word === "blitz" ? BLITZ_MASS_DAYS : 0);
    troop.dug = false;
    takeOrder(troop, { kind: "way", standing: standing2, word, legs, leg: 0, slot: slot / km, stop, since: day + lag, day });
    troop.fallback = null;
  }
};
var groundAhead = (field, side, x, y, ax, ay, reach) => {
  for (let gone = 0; gone <= reach; gone += 0.5) {
    const cell = cellAt(field, x + ax * gone, y + ay * gone);
    if (cell < 0 || !field.play[cell]) return false;
    if (field.holders[cell] === 1 - side) return true;
  }
  return false;
};
var outFrom = (battle, side, troop) => {
  const { field, place } = battle;
  const reach = OUTWARD_KM / place.kmAt(troop.y);
  if (outwardOf(field, side, troop.x, troop.y, reach, aim) && groundAhead(field, side, troop.x, troop.y, aim[0], aim[1], reach)) return;
  if (downhill(field, measure(battle)[1 - side], troop.x, troop.y, aim)) return;
  if (outwardOf(field, side, troop.x, troop.y, reach, aim)) return;
  aim[0] = troop.hx !== 0 || troop.hy !== 0 ? troop.hx : side === 0 ? 1 : -1;
  aim[1] = troop.hx !== 0 || troop.hy !== 0 ? troop.hy : 0;
};
var farOut = (battle, run, troop) => WAY_DAYS_MIN * Math.max(run.advanceKm[0], run.advanceKm[1], run.advanceKm[2]) * run.pace / battle.place.kmAt(troop.y);
var legOut = (battle, run, troop) => {
  const far = farOut(battle, run, troop);
  return legsOf([troop.x, troop.y], [[troop.x + aim[0] * far, troop.y + aim[1] * far]]);
};
var giveOut = (battle, run, side, picked, { day, word, standing: standing2, lagless = false }) => {
  const troops = battle.troops[side];
  for (const index of picked) {
    const troop = troops[index];
    outFrom(battle, side, troop);
    const legs = legOut(battle, run, troop);
    if (legs.length === 0) continue;
    const lag = lagless ? 0 : troop.lag + (troop.dug ? 1 : 0) + (word === "blitz" ? BLITZ_MASS_DAYS : 0);
    troop.dug = false;
    takeOrder(troop, { kind: "way", standing: standing2, word, legs, leg: 0, slot: 0, stop: 1, since: day + lag, day, own: true });
    troop.fallback = null;
  }
};
var aimOut = (battle, run, side, troop, order) => {
  const leg = order.legs[order.leg];
  if (groundAhead(battle.field, side, troop.x, troop.y, leg.ax, leg.ay, OUT_AHEAD_KM / battle.place.kmAt(troop.y))) {
    const short = farOut(battle, run, troop) - leftOnLeg(leg, troop);
    if (short > 0) {
      leg.ox += leg.ax * short;
      leg.oy += leg.ay * short;
      leg.length += short;
    }
    return;
  }
  outFrom(battle, side, troop);
  const legs = legOut(battle, run, troop);
  if (legs.length === 0) return;
  order.legs = legs;
  order.leg = 0;
  order.slot = 0;
};
var waysFor = (battle, run, side, picked, word, target, days) => {
  const { field, place } = battle;
  const troops = battle.troops[side];
  const { midX, midY, outX, outY } = standingOf(battle, side, picked);
  const km = place.kmAt(midY);
  const paceKm = Math.max(run.advanceKm[0], run.advanceKm[1], run.advanceKm[2]) * run.pace;
  const far = Math.max(WAY_DAYS_MIN, days) * paceKm / km;
  const straight = [[midX + outX * far, midY + outY * far]];
  const facing = { midX, midY, fx: outX, fy: outY };
  if (word === "flank" || word === "encircle") {
    const round = ROUND_KM / km;
    const tx = target ? target.x : midX + outX * round * 2;
    const ty = target ? target.y : midY + outY * round * 2;
    const gap = Math.sqrt((tx - midX) * (tx - midX) + (ty - midY) * (ty - midY));
    const fx = gap > 0 ? (tx - midX) / gap : outX;
    const fy = gap > 0 ? (ty - midY) / gap : outY;
    const arm = (turn) => {
      const lx = -fy * turn;
      const ly = fx * turn;
      const points = [[tx + (lx + fx) * round, ty + (ly + fy) * round], [tx + fx * round, ty + fy * round]];
      if (gap > round * 1.5) points.unshift([tx + (lx - fx) * round, ty + (ly - fy) * round]);
      return points;
    };
    if (word === "encircle") return { ways: [arm(1), arm(-1)], midX, midY, fx, fy };
    const beside = [1, -1].map((turn) => {
      const px = tx + -fy * turn * round;
      const py = ty + fx * turn * round;
      let count = 0;
      for (const enemy of battle.troops[1 - side]) {
        if (isLive(enemy) && (enemy.x - px) * (enemy.x - px) + (enemy.y - py) * (enemy.y - py) <= round * round) count += 1;
      }
      return count;
    });
    return { ways: [arm(beside[1] < beside[0] ? -1 : 1)], midX, midY, fx, fy };
  }
  if (!target) return { ways: [straight], ...facing };
  let from = cellAt(field, midX, midY);
  if (from < 0 || !field.play[from]) from = cellAt(field, troops[picked[0]].x, troops[picked[0]].y);
  let goal = target.kind === "city" ? target.cell : cellAt(field, target.x, target.y);
  if (goal < 0 || !field.play[goal]) goal = -1;
  const cells = from >= 0 && goal >= 0 ? cheapestWay(battle, from, goal) : null;
  return { ways: [cells && cells.length > 1 ? bendsOf(field, cells) : [[target.x, target.y]]], ...facing };
};
var routeChance = (battle, side, index, standing2, what) => hashSeed([battle.name, "route", standing2?.since ?? "", side, index, what].join("|")) % 1e4 / 1e4;
var giveRoute = (battle, side, picked, { day, way, standing: standing2, lagless = false }) => {
  if (picked.length === 0 || way.length === 0) return;
  const { kmAt } = battle.place;
  const troops = battle.troops[side];
  const breadth = Math.max(ROUTE_BREADTH_MIN_KM, Math.sqrt(picked.length) * battle.radiusKm[side] * ROUTE_BREADTH_BRUSHES);
  for (const index of picked) {
    const troop = troops[index];
    let skip = 0;
    if (way.length > 1 && lagless && Number.isInteger(troop.next) && troop.next >= 0) skip = Math.min(troop.next, way.length - 1);
    else if (way.length > 1 && lagless) {
      const { at, part } = nearestOnRoute(way, troop.x, troop.y);
      skip = at === 0 && part === 0 ? 0 : at + 1;
    } else if (way.length > 1) {
      const dx = way[1][0] - way[0][0];
      const dy = way[1][1] - way[0][1];
      const fromX = troop.x - way[0][0];
      const fromY = troop.y - way[0][1];
      skip = fromX * dx + fromY * dy > 0 || Math.sqrt(fromX * fromX + fromY * fromY) * kmAt(troop.y) <= ROUTE_JOIN_KM ? 1 : 0;
    }
    const ahead2 = skip > 0 ? way.slice(skip) : way;
    const legs = legsOf([troop.x, troop.y], ahead2);
    if (legs.length === 0) continue;
    const km = kmAt(troop.y);
    const slot = (routeChance(battle, side, index, standing2, "place") - 0.5) * breadth;
    const last = legs[legs.length - 1];
    const short = ROUTE_STOPS_SHORT_KM * routeChance(battle, side, index, standing2, "stop");
    const stop = 1 - Math.min(ROUTE_STOPS_SHORT_MOST, short / Math.max(1e-6, last.length * km));
    const lag = lagless ? 0 : troop.lag + (troop.dug ? 1 : 0) + Math.floor(ROUTE_SET_OFF_DAYS * routeChance(battle, side, index, standing2, "wait"));
    troop.dug = false;
    takeOrder(troop, { kind: "way", standing: standing2, word: "path", legs, leg: 0, skip: skip + ahead2.length - legs.length, slot: slot / km, stop, since: day + lag, day });
    troop.fallback = null;
  }
};
var leftOnLeg = (leg, troop) => (leg.ox - troop.x) * leg.ax + (leg.oy - troop.y) * leg.ay;

// src/runtime/fronts/move.js
var toward = [0, 0];
var halted = (battle, side, x, y) => {
  for (const halt of battle.haltsToday) if (halt.s === side && inSector(halt.sector, x, y, battle.place.kmAt)) return true;
  return false;
};
var turnTo = (troop, x, y) => {
  const length = Math.sqrt(x * x + y * y);
  if (!(length > 0)) return;
  troop.hx = x / length;
  troop.hy = y / length;
};
var placeBehind = (battle, side, troop, depth) => {
  const { field } = battle;
  const toOther = battle.toSide[1 - side];
  const reach = Math.ceil(FALL_BACK_SEARCH_KM / battle.place.kmAt(troop.y));
  const col0 = Math.floor(troop.x);
  const row0 = Math.floor(troop.y);
  let best = Infinity;
  let found = null;
  for (let row = Math.max(0, row0 - reach); row <= Math.min(field.rows - 1, row0 + reach); row += 1) {
    for (let col = Math.max(0, col0 - reach); col <= Math.min(field.cols - 1, col0 + reach); col += 1) {
      const cell = row * field.cols + col;
      if (field.holders[cell] !== side || toOther[cell] / 3 < depth * HOLD_BACK_TO) continue;
      const distance = (col + 0.5 - troop.x) * (col + 0.5 - troop.x) + (row + 0.5 - troop.y) * (row + 0.5 - troop.y);
      if (distance < best) {
        best = distance;
        found = [col + 0.5, row + 0.5];
      }
    }
  }
  return found;
};
var straightBack = (battle, side, troop, depth) => {
  const { field } = battle;
  const km = battle.place.kmAt(troop.y);
  if (!outwardOf(field, side, troop.x, troop.y, FALL_BACK_FROM_KM / km, toward)) return null;
  const toOther = battle.toSide[1 - side];
  const backX = -toward[0];
  const backY = -toward[1];
  const reach = FALL_BACK_SEARCH_KM / km;
  for (let gone = 0.5; gone <= reach; gone += 0.5) {
    const x = troop.x + backX * gone;
    const y = troop.y + backY * gone;
    const cell = cellAt(field, x, y);
    if (cell < 0 || !field.play[cell]) return null;
    if (field.holders[cell] === side && toOther[cell] / 3 >= depth * HOLD_BACK_TO) return [x, y];
  }
  return null;
};
var retreatBooks = (battle) => {
  const { field } = battle;
  if (battle.retreat && battle.retreat.field === field && battle.retreat.turns === field.turns) return battle.retreat;
  const { cols, rows, size, holders } = field;
  const toSide = measure(battle);
  const books = battle.retreat && battle.retreat.size === size ? battle.retreat : { size, deep: [new Int32Array(size), new Int32Array(size)], taken: [new Int32Array(size), new Int32Array(size)], labels: new Int32Array(size), far: new Int32Array(size) };
  const deepThirds = DEEP_KM / battle.frame.km * 3;
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (let cell = 0; cell < size; cell += 1) books.labels[cell] = holders[cell] === side && toSide[1 - side][cell] >= deepThirds ? cell : -1;
    nearestOf(cols, rows, books.labels, books.far, books.deep[side]);
    distanceFrom(cols, rows, (cell) => holders[cell] === side && battle.homes[cell] !== side, books.taken[side]);
  }
  books.field = field;
  books.turns = field.turns;
  battle.retreat = books;
  return books;
};
var outflanked = (battle, side, x, y) => {
  const { field } = battle;
  const books = retreatBooks(battle);
  const here = cellAt(field, x, y);
  const target = here >= 0 ? books.deep[side][here] : -1;
  if (target < 0) return false;
  const dx = target % field.cols + 0.5 - x;
  const dy = Math.floor(target / field.cols) + 0.5 - y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!(length > 0)) return false;
  toward[0] = dx / length;
  toward[1] = dy / length;
  const km = battle.place.kmAt(y);
  const taken = books.taken[1 - side];
  const least = OUTFLANKED_NECK_KM / km;
  for (let gone = OUTFLANKED_FROM_KM / km; gone <= length; gone += 1) {
    const cell = cellAt(field, x + toward[0] * gone, y + toward[1] * gone);
    if (cell < 0 || field.holders[cell] !== side) return false;
    if (taken[cell] / 3 < Math.max(least, gone * OUTFLANKED_NARROW)) return true;
  }
  return false;
};
var hold = (battle, side, troop, day, date, attackers) => {
  if (troop.pinned >= day - 1) return;
  const { field, arena, place } = battle;
  const { kmAt } = place;
  const other = 1 - side;
  const km = kmAt(troop.y);
  const depth = standOff(troop, kmAt);
  const toOther = battle.toSide[other];
  const onOwn = stands(field, side, troop.x, troop.y);
  const away = onOwn ? awayOf(battle, side, troop.x, troop.y) : 0;
  const order = liveOrder(troop);
  troop.adrift = onOwn || cellsOf(field, battle.toSide[side], troop.x, troop.y) * battle.frame.km <= CONTROL_RADIUS_MAX_KM ? 0 : troop.adrift + 1;
  if (troop.adrift >= ADRIFT_DAYS && !troop.pocket) {
    const at = describePoint(arena, troop.x, troop.y);
    if (at) battle.log.push({ d: date, k: "overrun", s: side, at });
    troop.strength = 0;
    return;
  }
  if (order && (order.kind === "fallback" || order.kind === "withdraw") && onOwn) {
    const leaving = order.kind === "withdraw";
    if (!leaving && order.gone >= FALL_BACK_MAX_KM) return;
    let dx = 0;
    let dy = 0;
    if (order.target) {
      dx = order.target.x - troop.x;
      dy = order.target.y - troop.y;
    } else if (downhill(field, toOther, troop.x, troop.y, toward)) {
      dx = -toward[0];
      dy = -toward[1];
    }
    const gap = Math.sqrt(dx * dx + dy * dy);
    if (!(gap > 0.05)) {
      if (leaving) order.home = true;
      return;
    }
    const step = Math.min(order.target ? gap : Infinity, FALL_BACK_KM_PER_DAY / km);
    for (const share of [1, 0.5, 0.25]) {
      const x = troop.x + dx / gap * step * share;
      const y = troop.y + dy / gap * step * share;
      if (!stands(field, side, x, y)) continue;
      troop.x = x;
      troop.y = y;
      troop.movedKm += step * share * km;
      order.gone += step * share * km;
      turnTo(troop, dx, dy);
      return;
    }
    if (leaving) order.home = true;
    return;
  }
  if (troop.fallback && (Math.abs(troop.fallback[0] - troop.x) < 0.3 && Math.abs(troop.fallback[1] - troop.y) < 0.3 || field.holders[cellAt(field, troop.fallback[0], troop.fallback[1])] !== side)) troop.fallback = null;
  if (!troop.fallback && (!onOwn || away < depth * HOLD_TOO_NEAR)) {
    const nearest2 = placeBehind(battle, side, troop, depth);
    const back = straightBack(battle, side, troop, depth);
    const reach = (place2) => Math.sqrt((place2[0] - troop.x) * (place2[0] - troop.x) + (place2[1] - troop.y) * (place2[1] - troop.y));
    troop.fallback = back && (!nearest2 || reach(back) <= reach(nearest2) * STRAIGHT_BACK_FURTHER + 1) ? back : nearest2;
  }
  if (!onOwn && !troop.fallback && !troop.pocket) {
    troop.stranded += 1;
    if (troop.stranded >= STRANDED_DAYS) {
      const at = describePoint(arena, troop.x, troop.y);
      if (at) battle.log.push({ d: date, k: "overrun", s: side, at });
      troop.strength = 0;
      return;
    }
  } else troop.stranded = 0;
  if (troop.fallback) {
    const dx = troop.fallback[0] - troop.x;
    const dy = troop.fallback[1] - troop.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const step = Math.min(distance, FALL_BACK_PACE_KM / km);
    if (!(distance > 0)) return;
    for (const share of [1, 0.75, 0.5, 0.25]) {
      const x = troop.x + dx / distance * step * share;
      const y = troop.y + dy / distance * step * share;
      const landing = cellAt(field, x, y);
      if (landing < 0 || !field.play[landing]) continue;
      troop.x = x;
      troop.y = y;
      troop.movedKm += step * share * km;
      turnTo(troop, dx, dy);
      return;
    }
    troop.fallback = null;
    return;
  }
  if (troop.pocket || !onOwn) return;
  if (!order && outflanked(battle, side, troop.x, troop.y)) {
    const backX = toward[0];
    const backY = toward[1];
    const step = FALL_BACK_PACE_KM * Math.max(1, battle.pace / FRONT_PACE_SHARE) / km;
    let gone = 0;
    for (const share of [0.25, 0.5, 0.75, 1]) {
      const x = troop.x + backX * step * share;
      const y = troop.y + backY * step * share;
      if (!stands(field, side, x, y)) continue;
      gone = share;
      if (!outflanked(battle, side, x, y)) break;
    }
    troop.gave = day;
    if (!(gone > 0)) return;
    troop.x += backX * step * gone;
    troop.y += backY * step * gone;
    troop.movedKm += step * gone * km;
    turnTo(troop, backX, backY);
    return;
  }
  if (away >= depth * SLIDE_BAND[0] && away <= depth * SLIDE_BAND[1]) {
    if (order || attackers.length === 0) return;
    const hears = SLIDE_HEARS_KM / km;
    let callX = 0;
    let callY = 0;
    let closest = Infinity;
    for (const enemy of attackers) {
      const dx = enemy.x - troop.x;
      const dy = enemy.y - troop.y;
      if (Math.abs(dx) > hears || Math.abs(dy) > hears) continue;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > hears || !(distance > 0)) continue;
      if (distance < closest) closest = distance;
      callX += dx / (distance * distance);
      callY += dy / (distance * distance);
    }
    if (!(closest * km > SLIDE_NEAR_KM && closest * km < SLIDE_FAR_KM)) return;
    if (!downhill(field, toOther, troop.x, troop.y, toward)) return;
    const into = callX * toward[0] + callY * toward[1];
    let slideX = callX - toward[0] * into;
    let slideY = callY - toward[1] * into;
    const length = Math.sqrt(slideX * slideX + slideY * slideY);
    if (!(length > 0)) return;
    slideX /= length;
    slideY /= length;
    if (troop.slid && slideX * troop.hx + slideY * troop.hy <= 0.25) return;
    let goX = troop.slid ? 0.6 * troop.hx + 0.4 * slideX : slideX;
    let goY = troop.slid ? 0.6 * troop.hy + 0.4 * slideY : slideY;
    const going = Math.sqrt(goX * goX + goY * goY);
    goX /= going;
    goY /= going;
    const step = SLIDE_KM / km * troop.drive;
    const landing = cellAt(field, troop.x + goX * step, troop.y + goY * step);
    if (landing < 0 || field.holders[landing] !== side || toOther[landing] / 3 < depth * SLIDE_LEAST_DEPTH) return;
    troop.x += goX * step;
    troop.y += goY * step;
    troop.movedKm += step * km;
    troop.hx = goX;
    troop.hy = goY;
    troop.slid = true;
  } else if (!troop.order && away > depth * COME_UP_FROM && day - troop.gave >= GAVE_GROUND_REST_DAYS) {
    if (!downhill(field, toOther, troop.x, troop.y, toward)) return;
    const upX = toward[0];
    const upY = toward[1];
    const step = Math.min(COME_UP_KM / km, away - depth * COME_UP_TO);
    const landing = cellAt(field, troop.x + upX * step, troop.y + upY * step);
    if (landing < 0 || field.holders[landing] !== side || outflanked(battle, side, troop.x + upX * step, troop.y + upY * step)) return;
    troop.x += upX * step;
    troop.y += upY * step;
    troop.movedKm += step * km;
    troop.hx = upX;
    troop.hy = upY;
  }
};
var endReduce = (troop, day, passed) => {
  const { order } = troop;
  if (passed) troop.rested = day + CLOSE_REST_DAYS;
  if (order.resume && !order.resume.done) troop.order = order.resume;
  else order.done = true;
};
var steer = (battle, run, side, index, troop, order, day, date, squares, weights) => {
  const { field, place } = battle;
  const { kmAt } = place;
  const other = 1 - side;
  const km = kmAt(troop.y);
  const cellKm = battle.frame.km;
  const books = battle.close;
  let ax = troop.hx;
  let ay = troop.hy;
  let slide = 0;
  let closing = false;
  let ranked = false;
  if (order.kind === "breakout") {
    if (!troop.pocket) {
      order.done = true;
      return;
    }
    if (downhill(field, books.toSupplied[side], troop.x, troop.y, toward)) [ax, ay] = toward;
  } else if (order.kind === "assault") {
    const { entry } = order;
    if (entry.unit) {
      entry.x = entry.unit.x;
      entry.y = entry.unit.y;
    }
    const there = cellAt(field, entry.x, entry.y);
    const done = entry.unit ? !isLive(entry.unit) : there >= 0 && field.holders[there] === side;
    if (done || day - entry.day > ASSAULT_DAYS) {
      if (done && !entry.taken) {
        entry.taken = day;
        if (entry.kind !== "city") battle.log.push({ d: date, k: entry.unit ? "destroyed" : "taken", s: side, at: entry.name });
      }
      entry.over = true;
      if (order.resume && !order.resume.done) troop.order = order.resume;
      else order.done = true;
      return;
    }
    const gapX = entry.x - troop.x;
    const gapY = entry.y - troop.y;
    const gap = Math.sqrt(gapX * gapX + gapY * gapY);
    if (gap <= order.ring / km) {
      if (entry.unit && gap < reachCells(kmAt, troop.y)) {
        entry.unit.strength = Math.max(0, entry.unit.strength - ASSAULT_WEAR);
        entry.unit.pinned = day;
      }
      troop.plant = true;
      return;
    }
    ax = gapX / gap;
    ay = gapY / gap;
  } else if (order.kind === "reduce") {
    const here = cellAt(field, troop.x, troop.y);
    const left = here >= 0 ? books.toPrey[side][here] / 3 * cellKm : Infinity;
    const pocket = here >= 0 && books.preyNear[side][here] >= 0 ? books.pockets[side][books.preyNear[side][here]] : null;
    if (!pocket || left > CLOSE_LEAVES_KM[order.resume ? 1 : 0]) {
      endReduce(troop, day, false);
      return;
    }
    if (day - order.day >= CLOSE_DAYS_MOST) {
      endReduce(troop, day, true);
      return;
    }
    const lies = left > 0.5 * cellKm && downhill(field, books.toPrey[side], troop.x, troop.y, toward);
    if (order.entered && lies && toward[0] * troop.hx + toward[1] * troop.hy < 0.1) {
      endReduce(troop, day, true);
      return;
    }
    if (left <= 0.5 * cellKm) order.entered = true;
    if (lies) [ax, ay] = toward;
    closing = true;
  } else if (order.kind === "pursue") {
    if (downhill(field, battle.toSide[other], troop.x, troop.y, toward)) [ax, ay] = toward;
    ranked = true;
  } else {
    let leg = order.legs[order.leg];
    const last = order.leg === order.legs.length - 1;
    if (leftOnLeg(leg, troop) <= (last ? (1 - order.stop) * leg.length : 0)) {
      if (last) {
        order.done = true;
        return;
      }
      order.leg += 1;
      leg = order.legs[order.leg];
    }
    ax = leg.ax;
    ay = leg.ay;
    const across = (troop.x - leg.ox) * -leg.ay + (troop.y - leg.oy) * leg.ax;
    slide = Math.max(-SLOT_SLIDE_MOST, Math.min(SLOT_SLIDE_MOST, (order.slot - across) / (SLOT_SLIDE_KM / km)));
    if (order.word === "blitz") troop.paceFactor = BLITZ_PACE;
    ranked = order.word === "advance" || order.word === "blitz";
  }
  if (ranked && (weights.rank ?? 1) > 0) {
    const free = ANCHOR_FREE_KM / km;
    const ashore = battle.anchors.some((anchor) => anchor.s === side && (anchor.x - troop.x) * (anchor.x - troop.x) + (anchor.y - troop.y) * (anchor.y - troop.y) <= free * free);
    if (!ashore) {
      const held = heldRound(field, side, troop.x, troop.y, SUPPORT_KM / km);
      troop.paceFactor *= Math.max(0, Math.min(1, (held - SUPPORT_NONE) / (SUPPORT_FULL - SUPPORT_NONE)));
    }
  }
  if (order.own && (weights.rank ?? 1) > 0) {
    const within2 = RANK_KM / km;
    const room2 = SPREAD_KM / km;
    let weight = 0;
    let forward = 0;
    let crowd = 0;
    for (const mate of battle.troops[side]) {
      if (mate === troop || !isLive(mate)) continue;
      const dx = mate.x - troop.x;
      const dy = mate.y - troop.y;
      if (Math.abs(dx) >= within2 || Math.abs(dy) >= within2) continue;
      const theirs = liveOrder(mate);
      if (!theirs || !theirs.own) continue;
      const apart = Math.sqrt(dx * dx + dy * dy);
      if (apart >= within2) continue;
      weight += 1 - apart / within2;
      forward += (1 - apart / within2) * (dx * ax + dy * ay);
      if (apart < room2) crowd += (dx * -ay + dy * ax >= 0 ? 1 : -1) * (1 - apart / room2);
    }
    const lead = weight > 0 ? -forward / weight * km : 0;
    if (lead > RANK_SLACK_KM) troop.paceFactor *= Math.max(RANK_LEAST, 1 - (lead - RANK_SLACK_KM) / RANK_BAND_KM);
    if (crowd !== 0) {
      const leg = order.legs[order.leg];
      const across = (troop.x - leg.ox) * -leg.ay + (troop.y - leg.oy) * leg.ax;
      const most2 = SLOT_SLIDE_KM / km;
      order.slot = Math.max(across - most2, Math.min(across + most2, order.slot - Math.max(-1, Math.min(1, crowd)) * (SPREAD_KM_PER_DAY / km)));
    }
  }
  let pressX = 0;
  let pressY = 0;
  const pressing = closing ? 0 : weights.resistance ?? STEER_PRESS;
  if (pressing > 0) {
    const within2 = STEER_PRESS_KM / km;
    eachNear(squares[other], troop.x, troop.y, (enemy) => {
      const dx = enemy.x - troop.x;
      const dy = enemy.y - troop.y;
      const apart = dx * dx + dy * dy;
      if (!(apart > 0) || apart > within2 * within2 || dx * troop.hx + dy * troop.hy <= 0) return;
      pressX -= enemy.strength * dx / apart;
      pressY -= enemy.strength * dy / apart;
    });
    const length2 = Math.sqrt(pressX * pressX + pressY * pressY);
    pressX = length2 > 0 ? pressX / length2 : 0;
    pressY = length2 > 0 ? pressY / length2 : 0;
  }
  const drifting = weights.wander ?? STEER_DRIFT;
  let driftX = 0;
  let driftY = 0;
  if (drifting > 0) {
    const block = Math.floor(day / DRIFT_DAYS);
    const from = hashSeed([battle.seed, battle.name, "drift", side, index, block].join("|")) % 16;
    const to = hashSeed([battle.seed, battle.name, "drift", side, index, block + 1].join("|")) % 16;
    const part = (day - block * DRIFT_DAYS) / DRIFT_DAYS;
    driftX = COMPASS_16[from * 2] + (COMPASS_16[to * 2] - COMPASS_16[from * 2]) * part;
    driftY = COMPASS_16[from * 2 + 1] + (COMPASS_16[to * 2 + 1] - COMPASS_16[from * 2 + 1]) * part;
  }
  let wantX = ax - ay * slide + pressing * pressX + drifting * driftX;
  let wantY = ay + ax * slide + pressing * pressY + drifting * driftY;
  const wanting = Math.sqrt(wantX * wantX + wantY * wantY);
  wantX = wanting > 0 ? wantX / wanting : ax;
  wantY = wanting > 0 ? wantY / wanting : ay;
  const keep = closing ? HEADING_KEPT_CLOSING : HEADING_KEPT;
  const most = closing ? TURN_CLOSING : TURN_COS;
  const mostSin = closing ? TURN_CLOSING : TURN_SIN;
  const fromX = troop.hx;
  const fromY = troop.hy;
  let headX = keep * fromX + (1 - keep) * wantX;
  let headY = keep * fromY + (1 - keep) * wantY;
  let length = Math.sqrt(headX * headX + headY * headY);
  headX = length > 0 ? headX / length : wantX;
  headY = length > 0 ? headY / length : wantY;
  const kept = headX * fromX + headY * fromY;
  if (kept < most) {
    let acrossX = headX - fromX * kept;
    let acrossY = headY - fromY * kept;
    length = Math.sqrt(acrossX * acrossX + acrossY * acrossY);
    acrossX = length > 0 ? acrossX / length : -fromY;
    acrossY = length > 0 ? acrossY / length : fromX;
    headX = most * fromX + mostSin * acrossX;
    headY = most * fromY + mostSin * acrossY;
  }
  const onward = headX * ax + headY * ay;
  if (onward < WAY_LEAST) {
    headX += ax * (WAY_LEAST - onward) * 2;
    headY += ay * (WAY_LEAST - onward) * 2;
    length = Math.sqrt(headX * headX + headY * headY);
    headX = length > 0 ? headX / length : ax;
    headY = length > 0 ? headY / length : ay;
  }
  troop.hx = headX;
  troop.hy = headY;
  troop.axisX = ax;
  troop.axisY = ay;
  const room = controlRadius(troop, kmAt) * ROOM_BRUSHES;
  let apartX = 0;
  let apartY = 0;
  eachNear(squares[side], troop.x, troop.y, (mate) => {
    if (mate === troop) return;
    const dx = troop.x - mate.x;
    const dy = troop.y - mate.y;
    if (Math.abs(dx) > room || Math.abs(dy) > room) return;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (!(distance > 0) || distance >= room) return;
    apartX += dx / distance * (1 - distance / room);
    apartY += dy / distance * (1 - distance / room);
  });
  const paceKm = run.advanceKm[troop.kind] * run.pace * troop.drive * troop.paceFactor;
  const ease = Math.max(-1, Math.min(1, apartX * -headY + apartY * headX)) * Math.min(EASE_KM / Math.max(1, paceKm), EASE_SHARE);
  let goX = headX - headY * ease;
  let goY = headY + headX * ease;
  length = Math.sqrt(goX * goX + goY * goY);
  troop.gx = goX / length;
  troop.gy = goY / length;
  troop.stepping = true;
  troop.reducing = closing;
  if (closing && troop.strength < CLOSE_WORN) {
    order.done = true;
    troop.rested = day + CLOSE_GIVEN_UP_DAYS;
    troop.stepping = false;
  }
};
var moveDay = (battle, run, day) => {
  const { field } = battle;
  battle.pace = run.pace;
  const { kmAt } = battle.place;
  const date = run.dateOf(day);
  const toSide = measure(battle);
  const books = battle.close;
  const cellKm = battle.frame.km;
  const weights = run.steer ?? {};
  const squares = [squaresOf(battle, battle.troops[0], isLive), squaresOf(battle, battle.troops[1], isLive)];
  const walked = [HOLDER_SIDE_A, HOLDER_SIDE_B].map((side) => battle.troops[side].filter((troop) => isLive(troop) && troop.state === STATE_ADVANCING));
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    const other = 1 - side;
    if (!run.braked) drawIn(battle, side, day);
    const falling = battle.views[other].filter((view) => view.word === "fall back");
    battle.troops[side].forEach((troop, index) => {
      troop.stepping = false;
      troop.reducing = false;
      troop.plant = false;
      troop.paceFactor = 1;
      if (!isLive(troop)) return;
      if (troop.hx === 0 && troop.hy === 0 && !downhill(field, toSide[other], troop.x, troop.y, toward)) toward[0] = side === HOLDER_SIDE_A ? 1 : -1;
      if (troop.hx === 0 && troop.hy === 0) [troop.hx, troop.hy] = toward;
      let order = liveOrder(troop);
      if (order && order.standing && (!battle.orders.includes(order.standing) || order.kind === "way" && order.standing.age >= ATTACK_LAPSE_DAYS)) {
        troop.order = null;
        order = null;
      }
      if (troop.pocket && !troop.besieged && !troop.dug && troop.kind !== KIND_ARTILLERY && (!order || order.kind !== "breakout" && order.kind !== "withdraw") && troop.spent <= day && books.cut[side] && cellsOf(field, books.toSupplied[side], troop.x, troop.y) * cellKm < BREAK_OUT_KM) {
        order = { kind: "breakout", since: day, day };
        troop.order = order;
      }
      if (order && order.kind === "breakout" && day - order.day >= BREAK_OUT_DAYS && troop.pocket) {
        order.done = true;
        troop.spent = day + BREAK_OUT_REST_DAYS;
        order = null;
      }
      if (order && order.kind === "breakout" && (!troop.pocket || troop.besieged)) {
        order.done = true;
        order = null;
      }
      if (troop.dug) {
        if (stands(field, side, troop.x, troop.y)) return;
        troop.dug = false;
        troop.dig = 0;
        troop.strength = Math.max(0, troop.strength - THROWN_OUT_LOSS);
        if (!isLive(troop)) return;
      }
      if (!order && !troop.pocket && falling.length > 0) {
        const view = falling.find((entry) => inSector(entry.sector, troop.x, troop.y, kmAt));
        if (view) {
          order = { kind: "pursue", standing: view.order, since: day, day };
          troop.order = order;
        }
      }
      let acts = order && day >= order.since && order.kind !== "fallback" && order.kind !== "withdraw" && (!troop.pocket || order.kind === "breakout") ? order : null;
      if (acts && acts.kind !== "breakout" && (troop.fallback || !stands(field, side, troop.x, troop.y) && cellsOf(field, toSide[side], troop.x, troop.y) * cellKm > troop.radiusKm)) acts = null;
      if (!acts) {
        hold(battle, side, troop, day, date, walked[other]);
        return;
      }
      if (run.braked || halted(battle, side, troop.x, troop.y)) return;
      if (acts.kind === "way" && acts.own) aimOut(battle, run, side, troop, acts);
      if (acts.kind === "way" && acts.standing && acts.standing.chosen) {
        const apart = acts.markDay === void 0 ? Infinity : Math.sqrt((troop.x - acts.markX) * (troop.x - acts.markX) + (troop.y - acts.markY) * (troop.y - acts.markY)) * kmAt(troop.y);
        if (apart > HAND_STALL_KM) {
          acts.markX = troop.x;
          acts.markY = troop.y;
          acts.markDay = day;
        }
      }
      steer(battle, run, side, index, troop, acts, day, date, squares, weights);
    });
  }
};

// src/runtime/fronts/handicap.js
var FAIR_EDGE = DIFFICULTY_EDGES.medium;

// src/runtime/fronts/supply.js
var cellOf = (field, x, y) => x >= 0 && y >= 0 && x < field.cols && y < field.rows ? Math.floor(y) * field.cols + Math.floor(x) : -1;
var nearestOwner = (battle, side) => (cell) => {
  const x = cell % battle.field.cols + 0.5;
  const y = Math.floor(cell / battle.field.cols) + 0.5;
  let best = Infinity;
  let owner = 0;
  for (const troop of battle.troops[side]) {
    if (!isLive(troop)) continue;
    const dx = troop.x - x;
    const dy = troop.y - y;
    if (dx * dx + dy * dy < best) {
      best = dx * dx + dy * dy;
      owner = troop.owner;
    }
  }
  return owner;
};
var homePieces = (battle, side) => {
  battle.homePieces ??= [null, null];
  const known = battle.homePieces[side];
  if (known && known.homeSide === battle.homeSide && known.size === battle.field.size) return known;
  const { field, arena } = battle;
  const { cols, rows, size } = field;
  const piece = new Int32Array(size).fill(-1);
  const queue = new Int32Array(size);
  const home = (index) => field.play[index] === 1 && battle.homeSide[arena.region[index]] === side;
  let count = 0;
  for (let seed = 0; seed < size; seed += 1) {
    if (piece[seed] >= 0 || !home(seed)) continue;
    let head = 0;
    let tail = 0;
    queue[tail] = seed;
    tail += 1;
    piece[seed] = count;
    while (head < tail) {
      const index = queue[head];
      head += 1;
      const col = index % cols;
      const row = (index - col) / cols;
      for (let step = 0; step < 4; step += 1) {
        const next = step === 0 ? row > 0 ? index - cols : -1 : step === 1 ? col > 0 ? index - 1 : -1 : step === 2 ? col < cols - 1 ? index + 1 : -1 : row < rows - 1 ? index + cols : -1;
        if (next < 0 || piece[next] >= 0 || !home(next)) continue;
        piece[next] = count;
        queue[tail] = next;
        tail += 1;
      }
    }
    count += 1;
  }
  battle.homePieces[side] = { homeSide: battle.homeSide, size, piece, count };
  return battle.homePieces[side];
};
var suppliedBodies = (battle, side) => {
  const { field } = battle;
  const { cols, rows, size, holders } = field;
  const bodies = bodiesOf(field, side);
  const pieces = homePieces(battle, side);
  const held = /* @__PURE__ */ new Map();
  const touched = new Uint8Array(bodies.count);
  for (let index = 0; index < size; index += 1) {
    const body = bodies.label[index];
    if (body < 0) continue;
    if (pieces.piece[index] >= 0) {
      const key = body * pieces.count + pieces.piece[index];
      held.set(key, (held.get(key) ?? 0) + 1);
    }
    if (touched[body]) continue;
    const col = index % cols;
    const row = (index - col) / cols;
    const other = 1 - side;
    if (row > 0 && holders[index - cols] === other || col > 0 && holders[index - 1] === other || col < cols - 1 && holders[index + 1] === other || row < rows - 1 && holders[index + cols] === other) touched[body] = 1;
  }
  const mostOf = new Int32Array(bodies.count).fill(-1);
  const mostHeld = new Int32Array(bodies.count);
  const holderOf2 = new Int32Array(pieces.count).fill(-1);
  const heldBy = new Int32Array(pieces.count);
  for (let body = 0; body < bodies.count; body += 1) {
    for (let piece = 0; piece < pieces.count; piece += 1) {
      const cells = held.get(body * pieces.count + piece) ?? 0;
      if (cells > mostHeld[body]) {
        mostHeld[body] = cells;
        mostOf[body] = piece;
      }
    }
  }
  for (let body = 0; body < bodies.count; body += 1) {
    const piece = mostOf[body];
    if (piece >= 0 && mostHeld[body] > heldBy[piece]) {
      heldBy[piece] = mostHeld[body];
      holderOf2[piece] = body;
    }
  }
  const supplied = new Uint8Array(bodies.count);
  for (let piece = 0; piece < pieces.count; piece += 1) if (holderOf2[piece] >= 0) supplied[holderOf2[piece]] = 1;
  for (const anchor of battle.anchors) {
    if (anchor.s !== side) continue;
    const cell = cellOf(field, anchor.x, anchor.y);
    if (cell >= 0 && bodies.label[cell] >= 0) supplied[bodies.label[cell]] = 1;
  }
  if (pieces.count === 0 && !supplied.some((value) => value === 1) && bodies.count > 0) {
    let largest = 0;
    for (let body = 1; body < bodies.count; body += 1) if (bodies.sizes[body] > bodies.sizes[largest]) largest = body;
    supplied[largest] = 1;
  }
  return { bodies, supplied, touched };
};
var findPockets = (battle) => {
  const { field, place } = battle;
  if (battle.pocketTurns === field.turns && battle.pocketSieges === battle.siegeKey && battle.pocketOf) return;
  const before = battle.pocketOf;
  const known = battle.pockets;
  const pockets = [];
  const pocketOf = [new Int32Array(field.size).fill(-1), new Int32Array(field.size).fill(-1)];
  battle.supplied = [null, null];
  battle.bodyOf = [null, null];
  battle.fed = [new Uint8Array(field.size), new Uint8Array(field.size)];
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    const { bodies, supplied, touched } = suppliedBodies(battle, side);
    battle.supplied[side] = supplied;
    battle.bodyOf[side] = bodies.label;
    const pocketOfBody = new Int32Array(bodies.count).fill(-1);
    for (let index = 0; index < field.size; index += 1) {
      const body = bodies.label[index];
      if (body < 0) continue;
      if (supplied[body]) battle.fed[side][index] = 1;
      if (supplied[body] || !touched[body]) continue;
      if (pocketOfBody[body] < 0) {
        pocketOfBody[body] = pockets.length;
        pockets.push({ s: side, cell: index, days: 0, km2: 0, cells: 0, cx: 0, cy: 0, siege: "", told: false });
      }
      const pocket = pockets[pocketOfBody[body]];
      const km = place.rowKm[Math.floor(index / field.cols)];
      pocket.km2 += km * km;
      pocket.cells += 1;
      pocket.cx += index % field.cols + 0.5;
      pocket.cy += Math.floor(index / field.cols) + 0.5;
      pocketOf[side][index] = pocketOfBody[body];
      const was = before ? before[side][index] : known.findIndex((entry) => entry.s === side && entry.cell === index);
      if (was < 0 || !known[was]) continue;
      if (known[was].days > pocket.days) pocket.days = known[was].days;
      if (known[was].told) pocket.told = true;
    }
  }
  for (const pocket of pockets) {
    pocket.cx /= pocket.cells;
    pocket.cy /= pocket.cells;
  }
  for (const siege of battle.sieges) {
    const index = pocketOf[1 - siege.by][siege.cell];
    if (index >= 0 && !pockets[index].siege) pockets[index].siege = siege.at;
  }
  for (const pocket of pockets) if (!pocket.siege) pocket.told = false;
  battle.siegeKept = [null, null];
  if (pockets.some((pocket) => pocket.siege !== "")) {
    for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
      for (let index = 0; index < field.size; index += 1) {
        const pocket = pocketOf[side][index];
        if (pocket < 0 || !pockets[pocket].siege) continue;
        battle.siegeKept[1 - side] ??= new Uint8Array(field.size);
        battle.siegeKept[1 - side][index] = 1;
      }
    }
  }
  battle.kept = keptWith(battle);
  battle.pockets = pockets;
  battle.pocketOf = pocketOf;
  battle.pocketTurns = field.turns;
  battle.pocketSieges = battle.siegeKey;
};
var garrisons = (battle) => {
  const inside = battle.pockets.map(() => []);
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      const cell = ownCell(battle.field, side, troop.x, troop.y);
      if (isLive(troop) && cell >= 0 && battle.pocketOf[side][cell] >= 0) inside[battle.pocketOf[side][cell]].push(troop);
    }
  }
  return inside;
};
var markPockets = (battle) => {
  findPockets(battle);
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      const cell = ownCell(battle.field, side, troop.x, troop.y);
      const pocket = isLive(troop) && cell >= 0 ? battle.pocketOf[side][cell] : -1;
      troop.pocket = pocket >= 0;
      troop.sealed = pocket >= 0;
      troop.besieged = pocket >= 0 && battle.pockets[pocket].siege !== "";
    }
  }
};
var giveUp = (battle, index, date, kind) => {
  const { field, arena } = battle;
  const pocket = battle.pockets[index];
  const cells = [];
  for (let cell = 0; cell < field.size; cell += 1) if (battle.pocketOf[pocket.s][cell] === index) cells.push(cell);
  for (const troop of battle.troops[pocket.s]) {
    const cell = ownCell(field, pocket.s, troop.x, troop.y);
    if (isLive(troop) && cell >= 0 && battle.pocketOf[pocket.s][cell] === index) troop.strength = 0;
  }
  if (cells.length === 0) return;
  takeCells(field, 1 - pocket.s, cells, nearestOwner(battle, 1 - pocket.s));
  const at = kind ? describePoint(arena, pocket.cx, pocket.cy) : "";
  if (at) battle.log.push({ d: date, k: kind, s: pocket.s, at });
};
var canEscape = (battle, side, troop) => {
  const { field } = battle;
  const reach = Math.ceil(OVERRUN_ESCAPE_KM / battle.place.kmAt(troop.y));
  const col0 = Math.floor(troop.x);
  const row0 = Math.floor(troop.y);
  for (let row = Math.max(0, row0 - reach); row <= Math.min(field.rows - 1, row0 + reach); row += 1) {
    for (let col = Math.max(0, col0 - reach); col <= Math.min(field.cols - 1, col0 + reach); col += 1) {
      const cell = row * field.cols + col;
      if (field.holders[cell] !== side || battle.pocketOf[side][cell] >= 0) continue;
      if ((col + 0.5 - troop.x) * (col + 0.5 - troop.x) + (row + 0.5 - troop.y) * (row + 0.5 - troop.y) <= reach * reach) return true;
    }
  }
  return false;
};
var settlePockets = (battle, date) => {
  findPockets(battle);
  const inside = garrisons(battle);
  let any = false;
  for (let index = 0; index < battle.pockets.length; index += 1) {
    const pocket = battle.pockets[index];
    const held = inside[index];
    if (pocket.siege) {
      if (!pocket.told) battle.log.push({ d: date, k: "siege", s: pocket.s, at: pocket.siege });
      pocket.told = true;
      pocket.days += 1;
      if (held.length > 0 && pocket.days < SIEGE_DAYS) continue;
      giveUp(battle, index, date, "pocket");
      any = true;
      continue;
    }
    let overrun = held.length > 0 && pocket.km2 < SCRAP_KM2;
    if (held.length > 0 && !overrun && pocket.km2 < PATCH_MAX_KM2) {
      const within2 = Math.sqrt(pocket.cells / Math.PI) + OVERRUN_WITHIN_KM / battle.place.kmAt(pocket.cy);
      let at = 0;
      for (const troop of battle.troops[1 - pocket.s]) {
        if (!isLive(troop) || !troop.order || troop.order.done || troop.order.kind !== "reduce") continue;
        if ((troop.x - pocket.cx) * (troop.x - pocket.cx) + (troop.y - pocket.cy) * (troop.y - pocket.cy) <= within2 * within2) at += troop.strength;
      }
      overrun = at >= OVERRUN_ODDS * held.reduce((sum, troop) => sum + troop.strength, 0);
    }
    if (overrun) {
      for (const troop of held) {
        troop.strength = canEscape(battle, pocket.s, troop) ? Math.max(0, troop.strength - OVERRUN_LOSS) : 0;
        if (troop.order) troop.order = null;
        troop.fallback = null;
      }
      const cells = [];
      for (let cell = 0; cell < battle.field.size; cell += 1) if (battle.pocketOf[pocket.s][cell] === index) cells.push(cell);
      takeCells(battle.field, 1 - pocket.s, cells, nearestOwner(battle, 1 - pocket.s));
      const at = describePoint(battle.arena, pocket.cx, pocket.cy);
      if (at) battle.log.push({ d: date, k: "overrun", s: pocket.s, at });
      any = true;
      continue;
    }
    if (held.length === 0) {
      if (pocket.km2 >= EMPTY_POCKET_KM2) continue;
      giveUp(battle, index, date, pocket.km2 < PATCH_MAX_KM2 ? "" : "pocket");
      any = true;
      continue;
    }
    pocket.days += 1;
    if (pocket.days < POCKET_DAYS) continue;
    giveUp(battle, index, date, "pocket");
    any = true;
  }
  if (any) findPockets(battle);
  return any;
};
var refreshSupply = (battle, day, era) => {
  const { field, arena } = battle;
  if (battle.supply && (day % SUPPLY_EVERY_DAYS !== 0 || battle.supplyTurns === field.turns)) return;
  findPockets(battle);
  const { cols, rows, size } = field;
  const fullKm = SUPPLY_FULL_KM[era];
  const farKm = fullKm * SUPPLY_FAR_FACTOR;
  const kmEach = arena.frame.km / 5;
  const corridors = battle.corridors === true;
  const ringSize = corridors ? 32 : 8;
  const near = corridors ? new Int32Array(size) : null;
  const nearThirds = CORRIDOR_KM * 3 / arena.frame.km;
  battle.supply = [null, null];
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    const bodies = bodiesOf(field, side);
    const supplied = battle.supplied[side];
    const cost = new Int32Array(size).fill(-1);
    const rounds = Array.from({ length: ringSize }, () => []);
    const mask = ringSize - 1;
    let waiting = 0;
    const reach = (index, value) => {
      if (cost[index] >= 0 && cost[index] <= value) return;
      cost[index] = value;
      rounds[value & mask].push(index);
      waiting += 1;
    };
    if (corridors) distanceFrom(cols, rows, (cell) => field.holders[cell] === 1 - side, near);
    const exposed = (cell) => corridors && near[cell] < nearThirds;
    let homeless = true;
    for (let index = 0; index < size; index += 1) {
      if (field.holders[index] !== side || !supplied[bodies.label[index]] || battle.homeSide[arena.region[index]] !== side) continue;
      reach(index, 0);
      homeless = false;
    }
    for (const anchor of battle.anchors) {
      const cell = cellOf(field, anchor.x, anchor.y);
      if (anchor.s === side && cell >= 0 && field.holders[cell] === side) {
        reach(cell, 0);
        homeless = false;
      }
    }
    if (homeless) {
      for (let index = 0; index < size; index += 1) if (field.holders[index] === side && supplied[bodies.label[index]]) reach(index, 0);
    }
    for (let value = 0; waiting > 0; value += 1) {
      const round = rounds[value & mask];
      for (let position = 0; position < round.length; position += 1) {
        const index = round[position];
        waiting -= 1;
        if (cost[index] !== value) continue;
        const col = index % cols;
        const row = (index - col) / cols;
        for (let dy = -1; dy <= 1; dy += 1) {
          const y = row + dy;
          if (y < 0 || y >= rows) continue;
          for (let dx = -1; dx <= 1; dx += 1) {
            const x = col + dx;
            if (dx === 0 && dy === 0 || x < 0 || x >= cols || field.holders[y * cols + x] !== side) continue;
            const step = dx !== 0 && dy !== 0 ? 7 : 5;
            reach(y * cols + x, value + (exposed(y * cols + x) ? step * CORRIDOR_COST : step));
          }
        }
      }
      round.length = 0;
    }
    const supply = new Float32Array(size);
    for (let index = 0; index < size; index += 1) {
      if (field.holders[index] !== side) continue;
      const km = cost[index] < 0 ? Infinity : cost[index] * kmEach;
      supply[index] = km <= fullKm ? 1 : km >= farKm ? SUPPLY_LEAST : 1 - (1 - SUPPLY_LEAST) * (km - fullKm) / (farKm - fullKm);
    }
    battle.supply[side] = supply;
  }
  battle.supplyTurns = field.turns;
};
var markSupply = (battle) => {
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    const supply = battle.supply?.[side];
    for (const troop of battle.troops[side]) {
      if (troop.pocket) {
        troop.supply = 1;
        continue;
      }
      const cell = ownCell(battle.field, side, troop.x, troop.y);
      const value = supply && cell >= 0 ? supply[cell] : 0;
      if (value > 0) troop.supply = value;
    }
  }
};

// src/runtime/fronts/orders.js
var fold6 = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
var readSieges = (battle) => {
  const { arena, field, place } = battle;
  const sieges = [];
  const spared2 = [[], []];
  for (const order of battle.orders) {
    if (order.order !== "encircle" || !order.objective || order.age >= ATTACK_LAPSE_DAYS) continue;
    const target = findPlace(arena, order.objective);
    const cell = target ? cellAt(field, target.x, target.y) : -1;
    if (cell < 0 || field.holders[cell] === order.s) continue;
    spared2[order.s].push(target.x, target.y, SIEGE_SPARE_KM / place.kmAt(target.y));
    sieges.push({ by: order.s, x: target.x, y: target.y, cell, at: placeText(target) });
  }
  battle.sieges = sieges;
  battle.spared = spared2;
  battle.siegeKey = sieges.map((siege) => `${siege.by}:${siege.cell}`).join(",");
};
var readOrders = (battle, line, sectors) => {
  const { arena, place } = battle;
  const views = [[], []];
  for (const order of battle.orders) {
    if (order.chosen) continue;
    const sector = resolveSector(arena, line, sectors, order.sector) ?? WHOLE_LINE;
    const target = order.objective ? findPlace(arena, order.objective) : null;
    const word = isAttack(order.order) && order.age >= ATTACK_LAPSE_DAYS ? "hold" : order.order;
    views[order.s].push({
      order,
      word,
      sector,
      target,
      age: order.age,
      middle: target && (word === "advance" || word === "blitz") ? sectorMiddle(line, sector, place.kmAt) : null
    });
  }
  battle.views = views;
  battle.haltsToday = battle.halts.map((halt) => ({ s: halt.s, sector: resolveSector(arena, line, sectors, halt.sector) ?? WHOLE_LINE }));
  readSieges(battle);
};
var ageOrders = (battle) => {
  for (const order of battle.orders) {
    order.age += 1;
    if (isAttack(order.order) && order.age >= ATTACK_LAPSE_DAYS) {
      order.order = "hold";
      delete order.objective;
      delete order.way;
      if (order.chosen) order.lapsed = true;
      battle.ordersChanged += 1;
    }
  }
  const standing2 = battle.orders.length;
  battle.orders = battle.orders.filter((order) => !order.lapsed && (order.order !== "assault" || !(order.entry && order.entry.over) && order.age <= ASSAULT_DAYS));
  if (battle.orders.length !== standing2) battle.ordersChanged += 1;
  const before = battle.halts.length;
  for (const halt of battle.halts) halt.days -= 1;
  battle.halts = battle.halts.filter((halt) => halt.days > 0);
  if (battle.halts.length !== before) battle.ordersChanged += 1;
};
var membersIn = (battle, side) => battle.sides[side].map((member, at) => battle.gone[side].has(at) ? "" : fold6(member));
var giverOf = (battle, side, order) => {
  const members = membersIn(battle, side);
  if (members.filter(Boolean).length <= 1) return -1;
  const by = fold6(order?.by);
  return by ? members.indexOf(by) : -1;
};
var takesOrder = (battle, run, order, today) => {
  const side = order.s;
  const giver = giverOf(battle, side, order);
  if (giver < 0) return () => true;
  const members = membersIn(battle, side);
  const lead = members.findIndex(Boolean);
  if (giver !== lead) return (troop) => troop.owner === giver;
  const played = new Set((Array.isArray(run?.input?.players) ? run.input.players : []).map(fold6));
  const own = members.map((member, at) => !member || at === giver ? null : battle.orders.filter((standing2) => standing2.s === side && !standing2.chosen && standing2 !== order && standing2.order !== "assault" && fold6(standing2.by) === member).map((standing2) => resolveSector(battle.arena, today.line, today.sectors, standing2.sector) ?? WHOLE_LINE));
  const { kmAt } = battle.place;
  return (troop) => {
    if (troop.owner === giver) return true;
    const member = members[troop.owner];
    if (!member || played.has(member)) return false;
    return !(own[troop.owner] ?? []).some((sector) => inSector(sector, troop.x, troop.y, kmAt));
  };
};
var assaultTarget = (battle, run, side, objective) => {
  const named = /^\s*(city|structure|unit)\s*:\s*(.*)$/i.exec(String(objective ?? ""));
  const kind = named ? named[1].toLowerCase() : "";
  const wanted = fold6(named ? named[2] : objective);
  if (!wanted) return null;
  if (kind !== "structure" && kind !== "unit") {
    const city = findPlace(battle.arena, `city: ${wanted}`);
    if (city) return { kind: "city", name: placeText(city), x: city.x, y: city.y, unit: null };
  }
  if (kind !== "city" && kind !== "unit") {
    const structures = Array.isArray(run.input?.map?.structures) ? run.input.map.structures : [];
    const found = structures.find((entry) => fold6(entry?.name) === wanted);
    if (found) {
      const [x, y] = battle.place.toCell(Number(found.lng), Number(found.lat));
      if (cellAt(battle.field, x, y) >= 0) return { kind: "structure", name: `structure: ${String(found.name).trim()}`, x, y, unit: null };
    }
  }
  if (kind !== "city" && kind !== "structure") {
    const entry = battle.named.find((formation) => formation.s === 1 - side && fold6(formation.name) === wanted);
    const unit = entry ? battle.troops[entry.s][entry.i] : null;
    if (unit && isLive(unit)) return { kind: "unit", name: `unit: ${entry.name}`, x: unit.x, y: unit.y, unit };
  }
  return null;
};
var assault = (battle, run, order, today) => {
  const side = order.s;
  const { kmAt } = battle.place;
  const target = assaultTarget(battle, run, side, order.objective);
  if (!target) return false;
  const km = kmAt(target.y);
  let held = 0;
  for (const enemy of battle.troops[1 - side]) {
    const dx = enemy.x - target.x;
    const dy = enemy.y - target.y;
    if (isLive(enemy) && Math.sqrt(dx * dx + dy * dy) * km < ASSAULT_DEFENDERS_KM) held += enemy.strength;
  }
  const needed = Math.max(ASSAULT_LEAST, Math.min(ASSAULT_MOST, ASSAULT_BASE + Math.ceil(2 * held / ASSAULT_PER_STRENGTH)));
  const near = [];
  const mine = takesOrder(battle, run, order, today);
  battle.troops[side].forEach((troop, index) => {
    if (!isLive(troop) || troop.dug || troop.pocket || troop.kind === KIND_ARTILLERY || troop.strength < CLOSE_UNDER_STRENGTH || !mine(troop)) return;
    const distance = Math.sqrt((troop.x - target.x) * (troop.x - target.x) + (troop.y - target.y) * (troop.y - target.y)) * km;
    if (distance < ASSAULT_FROM_KM) near.push({ index, troop, distance });
  });
  near.sort((a, b) => a.distance - b.distance || a.index - b.index);
  const entry = { ...target, side, day: today.day - order.age, taken: 0, over: false };
  order.entry = entry;
  for (const { index, troop } of near.slice(0, needed)) {
    const busy = troop.order && !troop.order.done ? troop.order : null;
    const resume = !busy ? null : busy.kind === "reduce" || busy.kind === "assault" ? busy.resume ?? null : busy;
    troop.order = { kind: "assault", standing: order, since: today.day, day: today.day, entry, resume, ring: ASSAULT_RING_KM[0] + (ASSAULT_RING_KM[1] - ASSAULT_RING_KM[0]) * chanceOf(battle, "ring", side, index) };
    troop.fallback = null;
  }
  return true;
};
var assignOrder = (battle, run, order, today, { picked = null, lagless = false } = {}) => {
  const side = order.s;
  const { kmAt } = battle.place;
  const troops = battle.troops[side];
  const word = order.order;
  if (word === "assault") return assault(battle, run, order, today);
  const sector = resolveSector(battle.arena, today.line, today.sectors, order.sector) ?? WHOLE_LINE;
  const group = [];
  const mine = picked ? null : takesOrder(battle, run, order, today);
  troops.forEach((troop, index) => {
    if (isLive(troop) && (picked ? picked.includes(index) : inSector(sector, troop.x, troop.y, kmAt) && mine(troop))) group.push(index);
  });
  if (word === "dig in") {
    for (const index of group) {
      troops[index].order = null;
      troops[index].fallback = null;
      troops[index].dug = true;
      troops[index].dig = 1;
      troops[index].state = STATE_DUG_IN;
    }
  } else if (word === "hold" || word === "land") {
    for (const index of group) {
      takeOrder(troops[index], null);
      if (troops[index].order && troops[index].order.resume) troops[index].order.resume = null;
      if (troops[index].dug) troops[index].state = STATE_HOLDING;
      troops[index].dug = false;
    }
  } else if (word === "withdraw") {
    for (const index of group) {
      if (troops[index].dug) troops[index].state = STATE_HOLDING;
      troops[index].dug = false;
      troops[index].order = { kind: "withdraw", standing: order, since: today.day, day: today.day, gone: 0 };
      troops[index].fallback = null;
    }
  } else if (word === "fall back") {
    const target = order.objective ? findPlace(battle.arena, order.objective) : null;
    for (const index of group) {
      if (troops[index].dug) troops[index].state = STATE_HOLDING;
      troops[index].dug = false;
      troops[index].order = { kind: "fallback", standing: order, target, since: today.day, day: today.day, gone: 0 };
      troops[index].fallback = null;
    }
  } else if (isAttack(word) && group.length > 0 && Array.isArray(order.way) && order.way.length > 0) {
    giveRoute(battle, side, group, { day: today.day, standing: order, lagless, way: order.way.map(([lng, lat]) => battle.place.toCell(lng, lat)) });
    for (const index of group) if (troops[index].state === STATE_DUG_IN) troops[index].state = STATE_HOLDING;
  } else if (isAttack(word) && group.length > 0) {
    const target = order.objective ? findPlace(battle.arena, order.objective) : null;
    const days = Math.max(1, run.days - today.day);
    const how = { day: today.day, word, standing: order, lagless };
    const ranked = word === "advance" || word === "blitz";
    let sent = [];
    let rest = group;
    if (target || !ranked) {
      const [nearX, nearY] = target ? [target.x, target.y] : sectorMiddle(today.line, sector, kmAt);
      const most = THRUST_TROOPS[word] ?? THRUST_TROOPS.advance;
      const count = picked || sector.kind === "place" ? Math.min(most, group.length) : Math.min(most, group.length, Math.max(THRUST_LEAST, Math.ceil(group.length * THRUST_SHARE)));
      const nearest2 = group.filter((index) => !troops[index].pocket).map((index) => {
        const dx = troops[index].x - nearX;
        const dy = troops[index].y - nearY;
        return { index, away: dx * dx + dy * dy, taken: false };
      }).sort((a, b) => a.away - b.away || a.index - b.index);
      const link = THRUST_LINK_KM / kmAt(nearY);
      const body = picked ? nearest2.slice(0, count).map((entry) => entry.index) : [];
      for (let pass = 0, grew = !picked; grew && body.length < count; pass += 1) {
        grew = false;
        for (const entry of nearest2) {
          if (body.length >= count) break;
          if (entry.taken) continue;
          const mine2 = troops[entry.index];
          if (body.length > 0 && !body.some((other) => (troops[other].x - mine2.x) * (troops[other].x - mine2.x) + (troops[other].y - mine2.y) * (troops[other].y - mine2.y) <= link * link)) continue;
          entry.taken = true;
          body.push(entry.index);
          grew = true;
        }
      }
      const going = new Set(body);
      sent = group.filter((index) => going.has(index));
      rest = group.filter((index) => !going.has(index));
    }
    if (sent.length > 0) {
      const { ways, midX, midY, fx, fy } = waysFor(battle, run, side, sent, word, target, days);
      if (ways.length === 2) {
        const across = (index) => (troops[index].x - midX) * -fy + (troops[index].y - midY) * fx;
        const abreast = sent.slice().sort((a, b) => across(b) - across(a) || a - b);
        const half = Math.ceil(abreast.length / 2);
        give(battle, side, abreast.slice(0, half), { ...how, way: ways[0] });
        give(battle, side, abreast.slice(half), { ...how, way: ways[1] });
      } else give(battle, side, sent, { ...how, way: ways[0] });
    }
    if (ranked && rest.length > 0) giveOut(battle, run, side, rest, how);
    for (const index of ranked ? group : sent) if (troops[index].state === STATE_DUG_IN) troops[index].state = STATE_HOLDING;
  }
  return true;
};
var standingOf2 = (battle, troop) => {
  let order = troop.order && !troop.order.done ? troop.order : null;
  if (order && (order.kind === "reduce" || order.kind === "assault" && !battle.orders.includes(order.standing))) order = order.resume && !order.resume.done ? order.resume : null;
  return order && order.standing && battle.orders.includes(order.standing) ? order.standing : null;
};

// src/runtime/fronts/swarms.js
var FRONT_FORM = "front";
var SWARM_FORM = "swarm";
var DEPLOY_FORMS = Object.freeze([FRONT_FORM, SWARM_FORM]);
var inSwarm = (battle, side, troop) => troop.command >= 0 && battle.swarms?.[side]?.has(troop.command) === true;
var swarmMiddles = (battle, side) => {
  const middles = /* @__PURE__ */ new Map();
  if (!battle.swarms?.[side]?.size) return middles;
  for (const troop of battle.troops[side]) {
    if (!isLive(troop) || !inSwarm(battle, side, troop)) continue;
    let middle = middles.get(troop.command);
    if (!middle) {
      middle = { x: 0, y: 0, n: 0, o: troop.owner };
      middles.set(troop.command, middle);
    }
    middle.x += troop.x;
    middle.y += troop.y;
    middle.n += 1;
  }
  for (const middle of middles.values()) {
    middle.x /= middle.n;
    middle.y /= middle.n;
  }
  return middles;
};
var freeCommand = (battle, side) => {
  const used = new Set(battle.swarms[side]);
  let lined = false;
  for (const troop of battle.troops[side]) {
    if (!isLive(troop)) continue;
    if (troop.command >= 0) used.add(troop.command);
    if (!inSwarm(battle, side, troop)) lined = true;
  }
  const start = lined ? FRONT_COMMANDS_MOST : 0;
  for (let step = 0; step < MAX_COMMANDS; step += 1) {
    const command = (start + step) % MAX_COMMANDS;
    if (!used.has(command)) return command;
  }
  return -1;
};
var spacingKm = (battle, side) => (Number(battle.radiusKm?.[side]) > 0 ? battle.radiusKm[side] : CONTROL_RADIUS_MAX_KM) * SWARM_SPACING_BRUSHES;
var halfBlockKm = (battle, side, count) => spacingKm(battle, side) * (Math.ceil(Math.sqrt(Math.max(1, count))) - 1) / 2;
var blockSteps = (count) => {
  const steps = [[0, 0]];
  for (let ring = 1; steps.length < count; ring += 1) {
    const along = (sign) => {
      const out = [0];
      for (let step = 1; step < ring; step += 1) out.push(sign * step, -sign * step);
      out.push(sign * ring);
      return out;
    };
    const up = along(1);
    const down = along(-1);
    for (let at = 0; at < 2 * ring && steps.length < count; at += 1) {
      steps.push([ring, up[at]]);
      if (steps.length < count) steps.push([down[at], ring]);
      if (steps.length < count) steps.push([-ring, down[at]]);
      if (steps.length < count) steps.push([up[at], -ring]);
    }
  }
  return steps.slice(0, count);
};
var nearestOwn = (field, side, x, y, reach) => {
  let best = -1;
  let least = Infinity;
  const col0 = Math.floor(x);
  const row0 = Math.floor(y);
  for (let row = Math.max(0, row0 - reach); row <= Math.min(field.rows - 1, row0 + reach); row += 1) {
    for (let col = Math.max(0, col0 - reach); col <= Math.min(field.cols - 1, col0 + reach); col += 1) {
      const cell = row * field.cols + col;
      if (field.holders[cell] !== side || !field.play[cell]) continue;
      const dx = col + 0.5 - x;
      const dy = row + 0.5 - y;
      const far = dx * dx + dy * dy;
      if (far < least) {
        least = far;
        best = cell;
      }
    }
  }
  return best;
};
var placeBlock = (battle, side, indexes, x, y) => {
  const { field } = battle;
  const step = spacingKm(battle, side) / battle.place.kmAt(y);
  const reach = Math.max(2, Math.ceil(SWARM_PLACE_KM / battle.frame.km));
  const coming = new Set(indexes);
  const others = battle.troops[side].filter((troop, index) => isLive(troop) && !coming.has(index));
  const standsThere = (tx, ty) => others.some((troop) => troop.x > tx - step / 2 && troop.x < tx + step / 2 && troop.y > ty - step / 2 && troop.y < ty + step / 2);
  let steps = blockSteps(indexes.length * 2 + 8);
  let next = 0;
  for (const index of indexes) {
    const troop = battle.troops[side][index];
    let tx = x;
    let ty = y;
    for (; ; ) {
      if (next >= steps.length) steps = blockSteps(steps.length * 2);
      const [across, down] = steps[next];
      next += 1;
      tx = x + across * step;
      ty = y + down * step;
      if (!standsThere(tx, ty) || next > indexes.length * 8 + 64) break;
    }
    if (stands(field, side, tx, ty)) {
      troop.x = tx;
      troop.y = ty;
      continue;
    }
    const cell = nearestOwn(field, side, tx, ty, reach);
    if (cell >= 0) {
      troop.x = cell % field.cols + 0.5;
      troop.y = Math.floor(cell / field.cols) + 0.5;
    } else if (stands(field, side, x, y)) {
      troop.x = x;
      troop.y = y;
    }
  }
};
var rearOf = (battle, side, x, y, rearKm = SWARM_REAR_KM) => {
  const { field } = battle;
  const toOther = measure(battle)[1 - side];
  const cellKm = battle.frame.km;
  const reach = Math.max(2, Math.ceil((SWARM_PLACE_KM + rearKm) / cellKm));
  const wanted = rearKm / cellKm * 3;
  const col0 = Math.floor(x);
  const row0 = Math.floor(y);
  let best = -1;
  let least = Infinity;
  let deepest = -1;
  let deep = -1;
  for (let row = Math.max(0, row0 - reach); row <= Math.min(field.rows - 1, row0 + reach); row += 1) {
    for (let col = Math.max(0, col0 - reach); col <= Math.min(field.cols - 1, col0 + reach); col += 1) {
      const cell2 = row * field.cols + col;
      if (field.holders[cell2] !== side || !field.play[cell2]) continue;
      if (toOther[cell2] > deep) {
        deep = toOther[cell2];
        deepest = cell2;
      }
      if (toOther[cell2] < wanted) continue;
      const dx = col + 0.5 - x;
      const dy = row + 0.5 - y;
      const far = dx * dx + dy * dy;
      if (far < least) {
        least = far;
        best = cell2;
      }
    }
  }
  const cell = best >= 0 ? best : deepest;
  return cell >= 0 ? [cell % field.cols + 0.5, Math.floor(cell / field.cols) + 0.5] : [x, y];
};
var swarmPlaceOf = (battle, side, member) => {
  const lines = Array.isArray(battle.deploy) && Array.isArray(battle.deploy[side]) ? battle.deploy[side] : [];
  const wanted = String(member ?? "").trim().toLowerCase();
  const entry = lines.find((line) => line.form === SWARM_FORM && line.country.toLowerCase() === wanted);
  if (!entry || entry.way.length === 0) return null;
  const [x, y] = battle.place.toCell(entry.way[0][0], entry.way[0][1]);
  const cell = nearestOwn(battle.field, side, x, y, Math.max(2, Math.ceil(SWARM_PLACE_KM / battle.frame.km)));
  return cell >= 0 ? [cell % battle.field.cols + 0.5, Math.floor(cell / battle.field.cols) + 0.5] : null;
};
var gathersInSwarms = (battle, side, member, warfare) => {
  const lines = Array.isArray(battle.deploy) && Array.isArray(battle.deploy[side]) ? battle.deploy[side] : [];
  const wanted = String(member ?? "").trim().toLowerCase();
  const entry = lines.find((line) => line.country.toLowerCase() === wanted);
  return entry ? entry.form === SWARM_FORM : warfare === SWARM_FORM;
};
var gatherNewcomers = (battle, side, owner, first, warfare) => {
  const troops = battle.troops[side];
  const newcomers = [];
  for (let at = first; at < troops.length; at += 1) if (isLive(troops[at]) && troops[at].owner === owner && !(troops[at].command >= 0)) newcomers.push(at);
  const member = battle.sides[side][owner];
  if (newcomers.length === 0 || !battle.swarms || !gathersInSwarms(battle, side, member, warfare)) return 0;
  let place = swarmPlaceOf(battle, side, member);
  if (!place) {
    let x = 0;
    let y = 0;
    for (const index of newcomers) {
      x += troops[index].x / newcomers.length;
      y += troops[index].y / newcomers.length;
    }
    place = rearOf(battle, side, x, y, SWARM_REAR_KM + halfBlockKm(battle, side, newcomers.length));
  }
  const [px, py] = place;
  const km = battle.place.kmAt(py);
  let join = -1;
  let nearest2 = Infinity;
  let anywhere = -1;
  let anywhereFar = Infinity;
  for (const [command2, middle] of swarmMiddles(battle, side)) {
    if (middle.o !== owner) continue;
    const far = Math.sqrt((middle.x - px) * (middle.x - px) + (middle.y - py) * (middle.y - py)) * km;
    if (far <= SWARM_JOIN_KM && far < nearest2) {
      nearest2 = far;
      join = command2;
    }
    if (far < anywhereFar) {
      anywhereFar = far;
      anywhere = command2;
    }
  }
  let command = join;
  if (command < 0) {
    command = freeCommand(battle, side);
    if (command >= 0) battle.swarms[side].add(command);
    else command = anywhere;
  }
  if (command < 0) return 0;
  placeBlock(battle, side, newcomers, px, py);
  for (const index of newcomers) troops[index].command = command;
  return newcomers.length;
};

// src/runtime/fronts/scenarioFronts.js
var SCENARIO_STANCES = Object.freeze(["hold", "dig in", "advance"]);

// src/runtime/fronts/line.js
var measureLine = (field, contour) => {
  if (contour.measured) return contour.measured;
  const { kmAt } = projectorOf(field.arena.frame);
  const count = contour.x.length;
  const km = new Float64Array(count);
  const nx = new Float64Array(count);
  const ny = new Float64Array(count);
  const strand = new Int32Array(count);
  let total = 0;
  for (let index = 0; index < contour.strands.length; index += 1) {
    const { first, count: length, closed } = contour.strands[index];
    const segments = closed ? length : length - 1;
    for (let step = 0; step < length; step += 1) strand[first + step] = index;
    for (let step = 0; step < segments; step += 1) {
      const from = first + step;
      const to = first + (step + 1) % length;
      const dx = contour.x[to] - contour.x[from];
      const dy = contour.y[to] - contour.y[from];
      const cells = Math.sqrt(dx * dx + dy * dy);
      km[from] = total;
      total += cells * kmAt((contour.y[from] + contour.y[to]) / 2);
      if (cells > 0) {
        nx[from] += dy / cells;
        ny[from] -= dx / cells;
        nx[to] += dy / cells;
        ny[to] -= dx / cells;
      }
    }
    if (!closed && length > 0) km[first + length - 1] = total;
  }
  for (let vertex = 0; vertex < count; vertex += 1) {
    const length = Math.sqrt(nx[vertex] * nx[vertex] + ny[vertex] * ny[vertex]);
    if (length > 0) {
      nx[vertex] /= length;
      ny[vertex] /= length;
    }
  }
  contour.measured = { contour, count, km, nx, ny, strand, total };
  return contour.measured;
};

// src/runtime/fronts/battle.js
var fold7 = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
var sideOfName = (battle, name) => {
  const wanted = fold7(name);
  if (!wanted) return -1;
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    if (battle.sides[side].some((member, index) => fold7(member) === wanted && !battle.gone[side].has(index))) return side;
  }
  return -1;
};
var holderOf = (battle, run, id) => {
  const group = run.groupOf(id);
  return group && sideOfName(battle, group) >= 0 ? group : run.controllerOf(id);
};
var readRegions = (battle, run) => {
  const { arena } = battle;
  const count = arena.ids.length;
  const regionSide = new Int8Array(count).fill(-1);
  const homeSide = new Int8Array(count).fill(-1);
  for (let index = 1; index < count; index += 1) {
    const id = arena.ids[index];
    const group = sideOfName(battle, run.groupOf(id));
    regionSide[index] = group >= 0 ? group : sideOfName(battle, run.controllerOf(id));
    homeSide[index] = group >= 0 ? group : sideOfName(battle, run.sovereignOf(id));
    if (!battle.shown.has(id) || regionSide[index] < 0) battle.shown.set(id, holderOf(battle, run, id));
  }
  battle.regionSide = regionSide;
  battle.homeSide = homeSide;
  const homeOfRegion = new Uint8Array(count).fill(2);
  for (let index = 1; index < count; index += 1) {
    const side = sideOfName(battle, battle.shown.get(arena.ids[index]));
    if (side >= 0) homeOfRegion[index] = side;
  }
  battle.homes = Uint8Array.from(arena.region, (region) => homeOfRegion[region]);
  battle.iceSide = iceSides(arena, regionSide);
};
var iceSides = (arena, regionSide) => {
  if (!arena.iced) return null;
  const { cols, rows } = arena;
  const side = new Int8Array(arena.size).fill(-1);
  const queue = [];
  for (let cell = 0; cell < arena.size; cell += 1) {
    if (arena.iced[cell] === 1 || !(arena.speed[cell] > 0)) continue;
    const own = regionSide[arena.region[cell]];
    if (own !== 0 && own !== 1) continue;
    side[cell] = own;
    queue.push(cell);
  }
  for (let at = 0; at < queue.length; at += 1) {
    const cell = queue[at];
    const col = cell % cols;
    const row = (cell - col) / cols;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = col + dx;
      const y = row + dy;
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      const next = y * cols + x;
      if (arena.iced[next] !== 1 || side[next] >= 0) continue;
      side[next] = side[cell];
      queue.push(next);
    }
  }
  return side;
};
var readRegion = (battle, run, id) => {
  const index = battle.arena.indexOf.get(id);
  if (index === void 0 || !battle.regionSide) return;
  const group = sideOfName(battle, run.groupOf(id));
  battle.regionSide[index] = group >= 0 ? group : sideOfName(battle, run.controllerOf(id));
  const home = group >= 0 ? group : sideOfName(battle, run.sovereignOf(id));
  if (home === battle.homeSide[index]) return;
  battle.homeSide = Int8Array.from(battle.homeSide);
  battle.homeSide[index] = home;
};
var memberIndex = (battle, side, name) => {
  const wanted = fold7(name);
  return wanted ? battle.sides[side].findIndex((member) => fold7(member) === wanted) : -1;
};
var paintGround = (battle, run) => {
  const { field, arena } = battle;
  const near = [nearestOwner(battle, HOLDER_SIDE_A), nearestOwner(battle, HOLDER_SIDE_B)];
  const shownAs = [new Int16Array(arena.ids.length).fill(-1), new Int16Array(arena.ids.length).fill(-1)];
  const holder = [new Int16Array(arena.ids.length).fill(-1), new Int16Array(arena.ids.length).fill(-1)];
  for (let region = 1; region < arena.ids.length; region += 1) {
    const id = arena.ids[region];
    for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
      shownAs[side][region] = memberIndex(battle, side, battle.shown.get(id));
      const group = memberIndex(battle, side, run.groupOf(id));
      holder[side][region] = group >= 0 ? group : memberIndex(battle, side, run.controllerOf(id));
    }
  }
  for (let index = 0; index < field.size; index += 1) {
    const side = field.holders[index];
    if (side !== HOLDER_SIDE_A && side !== HOLDER_SIDE_B) continue;
    const region = arena.region[index];
    const known = battle.homes[index] === side ? Math.max(0, shownAs[side][region]) : holder[side][region];
    field.painter[index] = known >= 0 ? known : near[side](index);
  }
};
var lineLength = (battle) => {
  battle.lineKm = measureLine(battle.field, traceContour(battle.field)).total;
  return battle.lineKm;
};
var setRadii = (battle) => {
  lineLength(battle);
  battle.radiusKm = [HOLDER_SIDE_A, HOLDER_SIDE_B].map((side) => sideRadiusKm(battle.lineKm, liveCount(battle.troops[side]) + levyPending(battle.levy, side)));
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) for (const troop of battle.troops[side]) troop.radiusKm = battle.radiusKm[side];
};

// src/runtime/fronts/replay.js
var MAX_TRACK_POINTS = 32;
var TRACK_TOLERANCE = 0.2;
var TRACK_ALONG = 0.3;
var STRENGTH_PER_CELL = 40;
var SAME_PLACE = 1 / 32;
var MAX_REPLAY_CHARS = 12e4;
var MAX_SHOWN_REGIONS = 600;
var MAX_SHOWN_TURNS = 1200;
var DATE_MAX = 40;
var NAME_MAX = 120;
var stateIndex = (value) => {
  if (typeof value === "number") return value >= 0 && value < TROOP_STATES.length ? Math.floor(value) : 0;
  const index = TROOP_STATES.indexOf(String(value ?? ""));
  return index < 0 ? 0 : index;
};
var thinTrack = (samples, tolerance) => {
  const count = samples.length;
  if (count <= 2) return samples.slice();
  const keep = new Uint8Array(count);
  keep[0] = 1;
  keep[count - 1] = 1;
  for (let index = 0; index < count - 1; index += 1) {
    if (samples[index].state !== samples[index + 1].state) keep[index] = 1;
  }
  const spans = [];
  let from = 0;
  for (let index = 1; index < count; index += 1) {
    if (!keep[index]) continue;
    spans.push(from, index);
    from = index;
  }
  while (spans.length) {
    const b = spans.pop();
    const a = spans.pop();
    if (b - a < 2) continue;
    const first = samples[a];
    const last = samples[b];
    const span = last.day - first.day;
    const reach = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
    const wayX = reach > 0 ? (last.x - first.x) / reach : 0;
    const wayY = reach > 0 ? (last.y - first.y) / reach : 0;
    let worst = 0;
    let at = -1;
    for (let index = a + 1; index < b; index += 1) {
      const sample = samples[index];
      const part = span > 0 ? (sample.day - first.day) / span : 0;
      const dx = sample.x - (first.x + (last.x - first.x) * part);
      const dy = sample.y - (first.y + (last.y - first.y) * part);
      const ds = (sample.strength - (first.strength + (last.strength - first.strength) * part)) / STRENGTH_PER_CELL;
      const ahead2 = (dx * wayX + dy * wayY) * TRACK_ALONG;
      const aside = reach > 0 ? dx * -wayY + dy * wayX : Math.sqrt(dx * dx + dy * dy);
      const off = Math.sqrt(ahead2 * ahead2 + aside * aside + ds * ds);
      if (off > worst) {
        worst = off;
        at = index;
      }
    }
    if (worst > tolerance) {
      keep[at] = 1;
      spans.push(a, at, at, b);
    }
  }
  const kept = [];
  for (let index = 0; index < count; index += 1) if (keep[index]) kept.push(samples[index]);
  return kept;
};
var sameStanding = (a, b) => Math.abs(a.x - b.x) < SAME_PLACE && Math.abs(a.y - b.y) < SAME_PLACE && a.state === b.state && Math.abs(a.strength - b.strength) <= 2;
var packTrack = (samples, tolerance) => {
  let slack = tolerance;
  let kept = thinTrack(samples, slack);
  for (let pass = 0; pass < 8 && kept.length > MAX_TRACK_POINTS; pass += 1) {
    slack *= 1.6;
    kept = thinTrack(samples, slack);
  }
  if (kept.length > MAX_TRACK_POINTS) kept = [...kept.slice(0, MAX_TRACK_POINTS - 1), kept[kept.length - 1]];
  while (kept.length >= 2 && sameStanding(kept[kept.length - 1], kept[kept.length - 2])) kept.pop();
  return kept;
};
var memberList = (value) => (Array.isArray(value) ? value : []).map((name) => String(name ?? "").slice(0, NAME_MAX));
var createReplayRecorder = ({ sides = [[], []], cols = 0, rows = 0, from = null } = {}) => {
  const members = [memberList(sides[0]), memberList(sides[1])];
  const names = [...members[0], ...members[1]].slice(0, PAINT_NAMES_MAX);
  const cells = Math.max(0, Math.floor(cols) * Math.floor(rows));
  const painted = from ? from.painted : new Uint8Array(cells);
  let beganStates = from ? from.began : null;
  let began = beganStates ? encodeStates(beganStates) : null;
  const changes = from ? from.changes : [];
  let start = from ? from.start : -1;
  let lastDay = from ? from.lastDay : -1;
  const tracks = from ? from.tracks : [[], []];
  const shownFirst = from ? from.shownFirst : /* @__PURE__ */ new Map();
  const shownNow = from ? from.shownNow : /* @__PURE__ */ new Map();
  const turns = from ? from.turns : [];
  const stateOf = (ground, cell) => {
    const holder = ground.holders[cell];
    if (holder !== HOLDER_SIDE_A && holder !== HOLDER_SIDE_B) return PAINT_WALL;
    const side = holder === HOLDER_SIDE_A ? 0 : 1;
    const own = side === 0 ? PAINT_OWN_A : PAINT_OWN_B;
    if (ground.homes && ground.homes[cell] === holder || members[side].length === 0) return own;
    const painter = Math.min(ground.painters ? ground.painters[cell] : 0, members[side].length - 1);
    const state2 = 1 + (side === 0 ? painter : members[0].length + painter);
    return state2 <= names.length ? state2 : own;
  };
  return {
    // The state at the end of `day` (0 is the state the run began from): each
    // side's troops in the order of their lists, the fallen at strength 0, and
    // the ground: for every cell who holds it (`holders`), which of that
    // side's members took it (`painters`), whose home ground it is (`homes`),
    // and, for a cell that changed hands that day, the part of the day at
    // which it did (`when`, optional). Called in order of day.
    record(day, troops, ground) {
      const at = Math.max(0, Math.min(TRACK_DAY_MAX, Math.floor(Number(day) || 0)));
      if (start < 0) start = at;
      if (ground?.holders && cells > 0) {
        if (began === null) {
          for (let cell = 0; cell < cells; cell += 1) painted[cell] = stateOf(ground, cell);
          beganStates = Uint8Array.from(painted);
          began = encodeStates(painted);
        } else {
          const first = (at - 1) * PAINT_TICKS_PER_DAY;
          const today = [];
          for (let cell = 0; cell < cells; cell += 1) {
            const state2 = stateOf(ground, cell);
            if (state2 === painted[cell]) continue;
            painted[cell] = state2;
            const part = ground.when ? Number(ground.when[cell]) : 1;
            const within2 = Number.isFinite(part) ? Math.max(0, Math.min(1, part)) : 1;
            today.push({ tick: first + Math.round(within2 * PAINT_TICKS_PER_DAY), cell, state: state2 });
          }
          today.sort((a, b) => a.tick - b.tick || a.cell - b.cell);
          for (const change of today) changes.push(change);
        }
      }
      lastDay = at;
      for (let side = 0; side < 2; side += 1) {
        const list2 = Array.isArray(troops?.[side]) ? troops[side] : [];
        const kept = tracks[side];
        for (let index = 0; index < list2.length; index += 1) {
          const troop = list2[index];
          if (!kept[index]) kept[index] = [];
          const samples = kept[index];
          const before = samples[samples.length - 1];
          const strength = Number(troop?.strength) > 0 ? Math.min(100, Number(troop.strength)) : 0;
          if (before ? before.strength <= 0 : strength <= 0) continue;
          samples.push({ day: at, x: Number(troop?.x) || 0, y: Number(troop?.y) || 0, strength, state: stateIndex(troop?.state) });
        }
      }
    },
    // From `day` the map draws a region as `name`'s; before, it drew it as
    // `was`'s. Told on day 0 for every region the last run left drawn as
    // another's than the world says; on the day a region changes hands in
    // name, with the name it is still drawn as (nothing changes on the map,
    // but the map has now to be told what to draw); and on the day it changes
    // hands in full, with the new name and the old.
    shown(day, regionId, name, was = name) {
      const id = String(regionId ?? "").trim().slice(0, NAME_MAX);
      const to = String(name ?? "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
      if (!id || !to) return;
      if (!shownFirst.has(id)) {
        if (shownFirst.size >= MAX_SHOWN_REGIONS) return;
        const from2 = String(was ?? "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX) || to;
        shownFirst.set(id, from2);
        shownNow.set(id, from2);
      }
      if (shownNow.get(id) === to || turns.length >= MAX_SHOWN_TURNS) return;
      turns.push([Math.max(0, Math.min(TRACK_DAY_MAX, Math.floor(Number(day) || 0))), id, to]);
      shownNow.set(id, to);
    },
    // The same recording carried onto a battlefield's larger frame (day.js
    // growFrame), so that its replay goes on from the day it began rather than
    // beginning again from the day the frame grew: a reveal shows the battle at
    // every event of the run, and before the day it grew there was none to show.
    //   cols, rows   the larger frame's
    //   cellOf       a cell of this recorder's grid -> the larger grid's (-1 off it)
    //   pointOf      a point in this grid's cells -> the larger grid's ([x, y])
    //   ground       the ground as it is now, on the larger grid, as record() reads it
    //   day          the day it grew (its changes since this recorder last
    //                recorded are told as that day's)
    // A new recorder; null when there is nothing to carry yet, or the sides have
    // changed since this one began (a member joined): that one begins again.
    carryOnto({ sides: now = [[], []], cols: toCols = 0, rows: toRows = 0, cellOf: cellOf2, pointOf, ground, day = 0 } = {}) {
      if (beganStates === null || typeof cellOf2 !== "function" || typeof pointOf !== "function") return null;
      const same = (a, b) => a.length === b.length && a.every((name, at) => name === b[at]);
      if (!same(members[0], memberList(now[0])) || !same(members[1], memberList(now[1]))) return null;
      const size = Math.max(0, Math.floor(toCols) * Math.floor(toRows));
      const nowStates = new Uint8Array(size);
      for (let cell = 0; cell < size; cell += 1) nowStates[cell] = stateOf(ground, cell);
      const beganThere = Uint8Array.from(nowStates);
      const wasThere = Uint8Array.from(nowStates);
      for (let cell = 0; cell < cells; cell += 1) {
        const there = cellOf2(cell);
        if (there < 0 || there >= size) continue;
        beganThere[there] = beganStates[cell];
        wasThere[there] = painted[cell];
      }
      const carried = [];
      for (const change of changes) {
        const there = cellOf2(change.cell);
        if (there >= 0 && there < size) carried.push({ tick: change.tick, cell: there, state: change.state });
      }
      const tick = Math.max(0, (Math.max(1, Math.floor(Number(day) || 0)) - 1) * PAINT_TICKS_PER_DAY);
      for (let cell = 0; cell < size; cell += 1) if (wasThere[cell] !== nowStates[cell]) carried.push({ tick, cell, state: nowStates[cell] });
      carried.sort((a, b) => a.tick - b.tick || a.cell - b.cell);
      const carryTrack = (samples) => samples.map((sample) => {
        const [x, y] = pointOf(sample.x, sample.y);
        return { ...sample, x, y };
      });
      return createReplayRecorder({
        sides: now,
        cols: toCols,
        rows: toRows,
        from: {
          painted: nowStates,
          began: beganThere,
          changes: carried,
          start,
          lastDay,
          tracks: tracks.map((side) => side.map((samples) => samples ? carryTrack(samples) : samples)),
          shownFirst: new Map(shownFirst),
          shownNow: new Map(shownNow),
          turns: turns.map((turn) => [...turn])
        }
      });
    },
    // The replay to save on the record. `date` is the date of the run's first
    // day and `days` how long the run was.
    finish({ date = "", days } = {}) {
      const total = Math.max(0, Math.min(TRACK_DAY_MAX, Math.floor(Number.isFinite(Number(days)) ? Number(days) : lastDay)));
      const pack = (tolerance2) => tracks.map((side) => {
        const paths = [];
        for (let index = 0; index < side.length; index += 1) paths.push(side[index] ? packTrack(side[index], tolerance2) : []);
        return encodeTracks(paths);
      });
      let tolerance = TRACK_TOLERANCE;
      let texts = pack(tolerance);
      let ground = began ?? "";
      let log = encodePaint(changes);
      const size = () => ground.length + log.length + texts[0].length + texts[1].length;
      for (let pass = 0; pass < 3 && size() > MAX_REPLAY_CHARS; pass += 1) {
        tolerance *= 2;
        texts = pack(tolerance);
      }
      if (size() > MAX_REPLAY_CHARS) {
        ground = encodeStates(painted);
        log = "";
      }
      const end = lastDay < 0 ? 0 : lastDay;
      return {
        d: String(date ?? "").slice(0, DATE_MAX),
        n: Math.max(total, end),
        s: Math.max(0, start),
        e: end,
        t: texts,
        names,
        m: ground,
        p: log,
        ...shownFirst.size > 0 ? { o: [...shownFirst], f: turns.map((turn) => [...turn]) } : {}
      };
    }
  };
};

// src/runtime/fronts/day.js
var REGIONS_NEEDED = /* @__PURE__ */ Symbol("the map's regions are needed");
var say = (battle, day, id, name, was = name) => {
  battle.recorder.shown(day, id, name, was);
  battle.said.push([day, id, name, was]);
};
var startRecorder = (battle, run, day, grown = null) => {
  const { cols, rows } = battle.frame;
  const homes = Uint8Array.from(battle.homes);
  let carried = null;
  if (grown && battle.recorder?.carryOnto && battle.drawnHomes) {
    const was = grown.was;
    const cellOf2 = (cell) => {
      const [x, y] = grown.carry(cell % was.cols + 0.5, Math.floor(cell / was.cols) + 0.5);
      return x >= 0 && y >= 0 && x < cols && y < rows ? Math.floor(y) * cols + Math.floor(x) : -1;
    };
    for (let cell = 0; cell < battle.drawnHomes.length; cell += 1) {
      const there = cellOf2(cell);
      if (there >= 0) homes[there] = battle.drawnHomes[cell];
    }
    carried = battle.recorder.carryOnto({
      sides: battle.sides,
      cols,
      rows,
      cellOf: cellOf2,
      pointOf: grown.carry,
      ground: { holders: battle.field.holders, painters: battle.field.painter, homes },
      day
    });
  }
  battle.recorder = carried ?? createReplayRecorder({ sides: battle.sides, cols, rows });
  battle.drawnHomes = carried ? homes : Uint8Array.from(battle.homes);
  const { arena } = battle;
  for (let region = 1; region < arena.ids.length; region += 1) {
    const id = arena.ids[region];
    const name = battle.shown.get(id) ?? "";
    if (battle.regionSide[region] >= 0 && name && name.toLowerCase() !== holderOf(battle, run, id).toLowerCase()) say(battle, day, id, name);
  }
};
var prepare = (battle, day) => {
  const contour = traceContour(battle.field);
  const line = measureLine(battle.field, contour);
  if (battle.sectorsFor !== contour) {
    battle.sectors = readSectors(line);
    battle.sectorsFor = contour;
  }
  battle.lineKm = line.total;
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    battle.troops[side].forEach((troop, index) => {
      if (troop.drawn) return;
      drawTraits(troop, battle.seed, battle.name, side, index, battle.even);
      troop.radiusKm = battle.radiusKm[side];
    });
  }
  const key = [battle.field.edits, battle.ordersChanged, battle.troops[0].length, liveCount(battle.troops[0]), battle.troops[1].length, liveCount(battle.troops[1]), day].join("|");
  if (battle.planKey !== key) {
    readOrders(battle, line, battle.sectors);
    battle.planKey = key;
  }
  return { day, line, sectors: battle.sectors };
};
var captorOf = (battle, run, region, side) => {
  const { arena, place } = battle;
  const sovereign = String(run.sovereignOf(arena.ids[region]) ?? "").trim().toLowerCase();
  const lawful = battle.sides[side].findIndex((member, index) => !battle.gone[side].has(index) && member.toLowerCase() === sovereign);
  if (lawful >= 0) return battle.sides[side][lawful];
  const near = new Float64Array(battle.sides[side].length);
  for (const troop of battle.troops[side]) {
    if (!isLive(troop) || battle.gone[side].has(troop.owner)) continue;
    const dx = troop.x - arena.centreX[region];
    const dy = troop.y - arena.centreY[region];
    if (Math.sqrt(dx * dx + dy * dy) * place.kmAt(troop.y) <= CAPTOR_WITHIN_KM) near[troop.owner] += troop.strength;
  }
  let best = -1;
  for (let index = 0; index < near.length; index += 1) {
    if (battle.gone[side].has(index)) continue;
    if (best < 0 || near[index] > near[best]) best = index;
  }
  return best >= 0 ? battle.sides[side][best] : "";
};
var mopUp = (battle, run) => {
  const { field, arena, place } = battle;
  if (run.braked) return false;
  const count = arena.ids.length;
  const held = [new Int32Array(count), new Int32Array(count)];
  const area = [new Float64Array(count), new Float64Array(count)];
  for (let index = 0; index < field.size; index += 1) {
    const holder = field.holders[index];
    if (holder !== HOLDER_SIDE_A && holder !== HOLDER_SIDE_B) continue;
    const km = place.rowKm[Math.floor(index / field.cols)];
    held[holder][arena.region[index]] += 1;
    area[holder][arena.region[index]] += km * km;
  }
  const taking = new Int8Array(count).fill(-1);
  const winningBack = [];
  let any = false;
  for (let region = 1; region < count; region += 1) {
    const owner = battle.regionSide[region];
    if (owner < 0) continue;
    const shownSide = sideOfName(battle, battle.shown.get(arena.ids[region]));
    for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
      if (held[1 - side][region] === 0 || !(area[1 - side][region] < PATCH_MAX_KM2)) continue;
      const mine = held[side][region] + (owner === side ? arena.outside[region] : 0);
      if (mine / (arena.cells[region] + arena.outside[region]) < WHOLE_AT) continue;
      taking[region] = side;
      if (side === shownSide) winningBack.push(region);
      any = true;
    }
  }
  if (!any) return false;
  if (winningBack.length > 0) {
    const reach = REACH_KM / battle.frame.km;
    for (const region of winningBack) {
      const side = taking[region];
      for (const troop of battle.troops[1 - side]) {
        if (!isLive(troop)) continue;
        const dx = troop.x - arena.centreX[region];
        const dy = troop.y - arena.centreY[region];
        const span = Math.sqrt(arena.cells[region] / 3) + reach;
        if (dx * dx + dy * dy <= span * span) {
          taking[region] = -1;
          break;
        }
      }
    }
  }
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      if (!isLive(troop) || !stands(field, side, troop.x, troop.y)) continue;
      const region = arena.region[Math.floor(troop.y) * field.cols + Math.floor(troop.x)];
      if (taking[region] === 1 - side) taking[region] = -1;
    }
  }
  const cells = [[], []];
  for (let index = 0; index < field.size; index += 1) {
    const region = arena.region[index];
    const side = taking[region];
    if (side < 0 || field.holders[index] !== 1 - side) continue;
    let spared2 = battle.kept[side] !== null && battle.kept[side][index] === 1;
    const discs = battle.spared[side];
    for (let at = 0; at < discs.length && !spared2; at += 3) {
      const dx = index % field.cols + 0.5 - discs[at];
      const dy = Math.floor(index / field.cols) + 0.5 - discs[at + 1];
      spared2 = dx * dx + dy * dy <= discs[at + 2] * discs[at + 2];
    }
    if (spared2) taking[region] = -2;
    else cells[side].push(index);
  }
  let taken = false;
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    const mine = cells[side].filter((index) => taking[arena.region[index]] === side);
    if (mine.length === 0) continue;
    const painter = /* @__PURE__ */ new Map();
    takeCells(field, side, mine, (index) => {
      const region = arena.region[index];
      if (!painter.has(region)) {
        const name = battle.regionSide[region] === side ? holderOf(battle, run, arena.ids[region]) : captorOf(battle, run, region, side);
        painter.set(region, Math.max(0, memberIndex(battle, side, name)));
      }
      return painter.get(region);
    });
    taken = true;
  }
  return taken;
};
var settleRegions = (battle, run, day) => {
  const { field, arena } = battle;
  if (battle.settledTurns === field.turns) return;
  battle.settledTurns = field.turns;
  const date = run.dateOf(day);
  arena.cities.forEach((city, index) => {
    const holder = field.holders[city.cell];
    const before = battle.cityHolder[index];
    battle.cityHolder[index] = holder;
    if (holder === before || holder !== HOLDER_SIDE_A && holder !== HOLDER_SIDE_B || before !== HOLDER_SIDE_A && before !== HOLDER_SIDE_B) return;
    battle.log.push({ d: date, k: "city", s: holder, at: `city: ${city.name}` });
    battle.citiesTaken[holder].push(city.name);
  });
  const held = [new Int32Array(arena.ids.length), new Int32Array(arena.ids.length)];
  for (let index = 0; index < field.size; index += 1) {
    const holder = field.holders[index];
    if (holder === HOLDER_SIDE_A || holder === HOLDER_SIDE_B) held[holder][arena.region[index]] += 1;
  }
  for (let region = 1; region < arena.ids.length; region += 1) {
    const owner = battle.regionSide[region];
    if (owner < 0 || run.braked) continue;
    const taker = 1 - owner;
    if (held[taker][region] / (arena.cells[region] + arena.outside[region]) <= FLIP_AT) continue;
    if (day - battle.lastFlip[region] < MIN_DAYS_BETWEEN_FLIPS) {
      battle.settledTurns = -1;
      continue;
    }
    const id = arena.ids[region];
    const captor = captorOf(battle, run, region, taker);
    if (!captor) continue;
    const group = run.groupOf(id);
    const controller = run.controllerOf(id);
    const flip = { day, date, battlefield: battle, regionId: id };
    if (run.isGroup(captor)) {
      run.flips.push({ ...flip, from: group && sideOfName(battle, group) === owner ? group : controller, to: captor, kind: "groupTake" });
      run.setGroup(id, captor);
    } else {
      if (group && sideOfName(battle, group) === owner) {
        run.flips.push({ ...flip, from: group, to: captor, kind: "groupRelease" });
        run.setGroup(id, "");
      }
      if (sideOfName(battle, controller) !== taker) {
        run.flips.push({ ...flip, from: controller, to: captor, kind: "control" });
        run.setController(id, captor);
      }
    }
    battle.lastFlip[region] = day;
    if (arena.names[region] !== id) battle.taken[taker].push(arena.names[region]);
    run.regionChanged(id);
    run.spendFlip();
    say(battle, day, id, battle.shown.get(id));
  }
  const member = new Int16Array(arena.ids.length).fill(-1);
  let any = false;
  for (let region = 1; region < arena.ids.length; region += 1) {
    const side = battle.regionSide[region];
    if (side < 0 || arena.cells[region] === 0 || held[side][region] !== arena.cells[region]) continue;
    const id = arena.ids[region];
    const name = holderOf(battle, run, id);
    const was = battle.shown.get(id) ?? "";
    if (!name || was.toLowerCase() === name.toLowerCase()) continue;
    battle.shown.set(id, name);
    member[region] = Math.max(0, memberIndex(battle, side, name));
    any = true;
    say(battle, day, id, name, was);
    if (arena.names[region] !== id) battle.log.push({ d: date, k: "whole", s: side, at: `region: ${arena.names[region]}` });
  }
  if (!any) return;
  for (let index = 0; index < field.size; index += 1) {
    const region = arena.region[index];
    if (member[region] < 0) continue;
    battle.homes[index] = battle.regionSide[region];
    field.painter[index] = member[region];
  }
};
var growWithin = (battle, run) => {
  if (battle.withinFor !== battle.arena) {
    let fastest = 0;
    for (let index = 0; index < battle.arena.size; index += 1) if (battle.arena.speed[index] > fastest) fastest = battle.arena.speed[index];
    let least = Infinity;
    for (let row = 0; row < battle.place.rowKm.length; row += 1) if (battle.place.rowKm[row] < least) least = battle.place.rowKm[row];
    const stepKm = Math.max(run.advanceKm[0], run.advanceKm[1], run.advanceKm[2]) * run.pace * TRAIT_DRIVE[1] * fastest;
    battle.within = Math.max(GROW_WITHIN_CELLS, Math.ceil(stepKm / least) + 2);
    battle.withinFor = battle.arena;
  }
  return battle.within;
};
var edgesToGrow = (battle, within2) => {
  const { field } = battle;
  const { cols, rows, play } = field;
  const contour = traceContour(field);
  const grow = [false, false, false, false];
  const landBy = (from, to, at, upright) => {
    for (let step = Math.max(0, Math.floor(from)); step <= Math.min((upright ? rows : cols) - 1, Math.floor(to)); step += 1) {
      if (play[upright ? step * cols + at : at * cols + step]) return true;
    }
    return false;
  };
  for (let vertex = 0; vertex < contour.x.length; vertex += 1) {
    const x = contour.x[vertex];
    const y = contour.y[vertex];
    const span = within2 + 2;
    if (!grow[0] && x < within2 && landBy(y - span, y + span, 0, true)) grow[0] = true;
    if (!grow[2] && x > cols - within2 && landBy(y - span, y + span, cols - 1, true)) grow[2] = true;
    if (!grow[1] && y < within2 && landBy(x - span, x + span, 0, false)) grow[1] = true;
    if (!grow[3] && y > rows - within2 && landBy(x - span, x + span, rows - 1, false)) grow[3] = true;
  }
  return grow.some(Boolean) ? grow : null;
};
var largerFrame = (frame, grow, map, within2) => {
  const more = Math.max(within2 * 2, Math.round(GROW_KM / frame.km));
  const west = grow[0] ? more : 0;
  const south = grow[1] ? more : 0;
  const cols = frame.cols + west + (grow[2] ? more : 0);
  const rows = frame.rows + south + (grow[3] ? more : 0);
  const y0 = latToY(frame.lat0) - south * frame.cell;
  if (cols <= MAX_GRID_SPAN && rows <= MAX_GRID_SPAN && cols * rows <= MAX_CELLS && y0 > latToY(-85)) {
    return { ...frame, lng0: frame.lng0 - west * frame.cell, lat0: yToLat(y0), cols, rows };
  }
  const bounds = frameBounds(frame);
  const [, lowLat] = projectorOf(frame).toLngLat(0, -south);
  const [, highLat] = projectorOf(frame).toLngLat(0, rows - south);
  return createFrame(
    { west: bounds.west - west * frame.cell, east: bounds.west + (cols - west) * frame.cell, south: lowLat, north: highLat },
    { flat: map.flat === true, scale: map.scale }
  );
};
var carrier = (from, to) => {
  const scale = from.cell / to.cell;
  const apart = from.lng0 + from.cols * from.cell / 2 - (to.lng0 + to.cols * to.cell / 2);
  const shiftX = (from.lng0 - to.lng0 - 360 * Math.round(apart / 360)) / to.cell;
  const shiftY = (latToY(from.lat0) - latToY(to.lat0)) / to.cell;
  return (x, y) => [x * scale + shiftX, y * scale + shiftY];
};
var growIfNeeded = (battle, run, day) => {
  if ((battle.grown ?? 0) >= 6) return false;
  const within2 = growWithin(battle, run);
  const grow = edgesToGrow(battle, within2);
  if (!grow) return false;
  return growFrame(battle, run, day, grow, within2);
};
var growFrame = (battle, run, day, grow, within2, counted = true) => {
  const frame = largerFrame(battle.frame, grow, run.input.map, within2);
  if (!frame || frame.cols === battle.frame.cols && frame.rows === battle.frame.rows && frame.cell === battle.frame.cell) return false;
  const arena = arenaFor(run.input.arenas, run.input.map, frame, run.input.regionTypes);
  if (!arena) throw REGIONS_NEEDED;
  const carry = carrier(battle.frame, frame);
  const was = battle.frame;
  const old = battle.field;
  const before = { arena: battle.arena, lastFlip: battle.lastFlip, startPhi: battle.startPhi, pockets: battle.pockets, cell: battle.frame.cell };
  if (counted) battle.grown = (battle.grown ?? 0) + 1;
  battle.frame = frame;
  battle.arena = arena;
  battle.place = projectorOf(frame);
  readRegions(battle, run);
  battle.field = resampleField(old, arena, battle.regionSide, battle.iceSide);
  const began = resampleField({ ...old, phi: before.startPhi }, arena, battle.regionSide, battle.iceSide);
  battle.startPhi = began.phi;
  battle.startHolders = began.holders;
  const scale = battle.frame.cell !== 0 ? before.cell / battle.frame.cell : 1;
  const moved = /* @__PURE__ */ new Set();
  const carryOrder = (order) => {
    if (!order || moved.has(order)) return;
    moved.add(order);
    if (order.legs && !moved.has(order.legs)) {
      moved.add(order.legs);
      for (const leg of order.legs) {
        [leg.ox, leg.oy] = carry(leg.ox, leg.oy);
        leg.length *= scale;
      }
    }
    if (order.slot !== void 0) order.slot *= scale;
    if (order.entry && !moved.has(order.entry)) {
      moved.add(order.entry);
      [order.entry.x, order.entry.y] = carry(order.entry.x, order.entry.y);
    }
    if (order.target && !moved.has(order.target)) {
      moved.add(order.target);
      order.target = { ...order.target, x: carry(order.target.x, order.target.y)[0], y: carry(order.target.x, order.target.y)[1] };
    }
    carryOrder(order.resume);
  };
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const troop of battle.troops[side]) {
      [troop.x, troop.y] = carry(troop.x, troop.y);
      troop.station = null;
      if (troop.fallback) troop.fallback = carry(troop.fallback[0], troop.fallback[1]);
      carryOrder(troop.order);
    }
  }
  battle.close = null;
  battle.toSide = null;
  battle.measuredFor = null;
  battle.anchors = battle.anchors.map((anchor) => {
    const [x, y] = carry(anchor.x, anchor.y);
    return { s: anchor.s, x, y };
  });
  battle.pockets = before.pockets.map((pocket) => {
    const [x, y] = carry(pocket.cell % old.cols + 0.5, Math.floor(pocket.cell / old.cols) + 0.5);
    return { ...pocket, cell: Math.floor(y) * arena.cols + Math.floor(x) };
  });
  battle.pocketOf = null;
  battle.pocketTurns = -1;
  battle.sieges = [];
  battle.spared = [[], []];
  battle.siegeKey = "";
  battle.supply = null;
  battle.supplyTurns = -1;
  battle.claims = { stamp: new Int32Array(arena.size), power: new Float32Array(arena.size), moment: 0 };
  battle.lastFlip = new Int32Array(arena.ids.length).fill(-1e6);
  for (let region = 1; region < before.arena.ids.length; region += 1) {
    const now = arena.indexOf.get(before.arena.ids[region]);
    if (now !== void 0) battle.lastFlip[now] = before.lastFlip[region];
  }
  battle.cityHolder = Int8Array.from(arena.cities, (city) => battle.field.holders[city.cell]);
  battle.settledTurns = -1;
  battle.planKey = "";
  battle.sectorsFor = null;
  paintGround(battle, run);
  startRecorder(battle, run, day, { was, carry });
  return true;
};
var simulateDay = (battle, run, day) => {
  const date = run.dateOf(day);
  const { line } = prepare(battle, day);
  if (line.count === 0) {
    const held = countHolders(battle.field);
    battle.closing = held[0] === 0 || held[1] === 0 ? "taken" : "apart";
    return 0;
  }
  measure(battle);
  markPockets(battle);
  findPrey(battle);
  markSupply(battle);
  moveDay(battle, run, day);
  const steps = stepForward(battle, run.advanceKm, run.pace);
  settlePockets(battle, date);
  redistance(battle.field);
  dusk(run, battle, day);
  closeDay(battle);
  if (mopUp(battle, run)) redistance(battle.field);
  ageOrders(battle);
  refreshSupply(battle, day, run.era);
  settleRegions(battle, run, day);
  growIfNeeded(battle, run, day);
  return steps;
};

// src/runtime/fronts/staff.js
var COMPASS = Object.freeze([[1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071], [-1, 0], [-0.7071, -0.7071], [0, -1], [0.7071, -0.7071]]);
var STAFF_SIDES = Object.freeze([HOLDER_SIDE_A, HOLDER_SIDE_B]);

// src/runtime/fronts/wayfinder.js
var MEDIA = Object.freeze(["sea", "land", "air"]);
var CANALS = Object.freeze([
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

// src/runtime/fronts/transports.js
var TRANSPORT_ORDERS = Object.freeze({ ship: "sea", rail: "land", airlift: "air" });
var TRANSPORT_STATUSES = Object.freeze(["ordered", "moving", "landed", "lost", "refused", "returned"]);
var TRANSPORT_ENDED = Object.freeze(["landed", "lost", "refused", "returned"]);
var TRANSPORT_SPEED_KM = Object.freeze({ sea: [40, 1400], land: [15, 1600], air: [300, 22e3] });
var TRANSPORT_CAPACITY = Object.freeze([1, 12]);
var CARRIERS = Object.freeze({
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
var INTERCEPT_REACH_KM = Object.freeze({ naval: Object.freeze({ sea: 380, air: 130, land: 0 }), air: Object.freeze({ sea: 900, air: 900, land: 650 }) });
var INTERCEPT_BASE = Object.freeze({ naval: Object.freeze({ sea: 0.26, air: 0.05, land: 0 }), air: Object.freeze({ sea: 0.16, air: 0.22, land: 0.09 }) });
var SHORE_REACH_KM = Object.freeze({ sea: 110, air: 220, land: 45 });
var SHORE_BASE = Object.freeze({ sea: 0.05, air: 0.09, land: 0.04 });
var HIT_SHARE = Object.freeze([0.3, 0.85]);

// src/runtime/fronts/engine.js
var clean2 = (value, max = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max).trim();
var fold8 = (value) => clean2(value).toLowerCase();
var memberList2 = (value) => {
  const members = [];
  for (const entry of Array.isArray(value) ? value : []) {
    const name = clean2(entry);
    if (name && !members.some((member) => fold8(member) === fold8(name)) && members.length < MAX_SIDE_MEMBERS) members.push(name);
  }
  return members;
};
var createRun = (input) => {
  const days = Math.max(0, Math.floor(Number(input?.days) || 0));
  const fromDate = String(input?.fromDate ?? "");
  const dated = addGameDays(fromDate, 0) !== "";
  const era = eraOf(fromDate, Number.isInteger(input?.era) ? input.era : null);
  const controller = /* @__PURE__ */ new Map();
  const group = /* @__PURE__ */ new Map();
  const areas = input?.groupAreas && typeof input.groupAreas === "object" ? input.groupAreas : {};
  const run = {
    input,
    days,
    day: 0,
    steps: 0,
    era,
    // Which of the newer mechanics this run uses (mechanics.js): none unless the input turns them on.
    mech: readMechanics(input?.mechanics),
    // How its wars are fought where nobody chose otherwise (swarms.js; runtime/warSettings.js warfare): along a front
    // unless the input says in swarms.
    warfare: input?.warfare === SWARM_FORM ? SWARM_FORM : "front",
    seed: String(input?.seed ?? ""),
    // How many troops are raised, of the usual (troops.js troopsFactor).
    troops: troopsFactor(input?.troops),
    // The men a formation is (the scenario's where it set them, else its era's), and what each
    // country has been charged and given back this run (manpower.js).
    menEach: Number(input?.menEach) >= 1 ? Math.round(Number(input.menEach)) : menPerFormation(era),
    // The share of a country's people who can fight, where the scenario set it: else MANPOWER_SHARE (manpower.js).
    manpowerShare: Number(input?.manpowerShare) > 0 && Number(input.manpowerShare) <= 100 ? Number(input.manpowerShare) / 100 : 0,
    manpower: /* @__PURE__ */ new Map(),
    // Each country's days of advance this run, for its war resources (dawn.js dusk, runtime/warResources.js).
    effort: /* @__PURE__ */ new Map(),
    pace: Math.min(3, Math.max(0.1, Number(input?.pace) || 1)),
    // The weights that bend a troop's step, for a test or the rig to set aside.
    steer: input?.steering && typeof input.steering === "object" ? input.steering : {},
    advanceKm: [ADVANCE_KM_PER_DAY.infantry[era], ADVANCE_KM_PER_DAY.armor[era], ADVANCE_KM_PER_DAY.artillery[era]],
    overlandKm: [OVERLAND_KM_PER_DAY.infantry[era], OVERLAND_KM_PER_DAY.armor[era], OVERLAND_KM_PER_DAY.artillery[era]],
    battles: [],
    wars: /* @__PURE__ */ new Map(),
    flips: [],
    // The countries troops were sent into during the run, each brought into
    // its war (invadeWhereSent): the caller writes them into the war ledger.
    joins: [],
    // The wars that began during the run because one country sent its troops
    // at another it was at peace with (attackOpensWar): for the ledger too.
    starts: [],
    // The transporters of the world (transports.js), and what became of each
    // during the run, in the order it happened.
    transports: [],
    voyages: [],
    unitChanges: [],
    notes: [],
    taken: /* @__PURE__ */ new Set(),
    cursor: 0,
    flipsLeft: Number.isFinite(input?.flipAllowance) ? Math.max(0, Math.floor(input.flipAllowance)) : Infinity,
    braked: false,
    cache: input?.arenas instanceof Map ? input.arenas : null,
    regionIds: null,
    // A date the calendar cannot read gives every day the run's first date, and its end the last.
    dateOf: (day) => dated ? addGameDays(fromDate, day) : day >= days && input?.toDate ? String(input.toDate) : fromDate,
    controllerOf: (id) => controller.has(id) ? controller.get(id) : clean2(input?.controllerOf?.(id)),
    sovereignOf: (id) => clean2(input?.sovereignOf?.(id)),
    groupOf: (id) => group.has(id) ? group.get(id) : clean2(areas[id]),
    isGroup: (name) => input?.isGroup?.(name) === true,
    strengthOf: (name) => {
      const weight = Number(input?.strengthOf?.(name));
      return weight > 0 && Number.isFinite(weight) ? weight : 1;
    },
    // How short a country is of what comes by sea, 0 to 1 (handicap.js shortEdge): 0 where nobody says.
    shortageOf: (name) => {
      const short = Number(input?.shortageOf?.(name));
      return short > 0 && Number.isFinite(short) ? short > 1 ? 1 : short : 0;
    },
    setController: (id, name) => controller.set(id, clean2(name)),
    setGroup: (id, name) => group.set(id, clean2(name))
  };
  const figures = /* @__PURE__ */ new Map();
  run.militaryOf = (name) => {
    if (!run.mech.military) return MILITARY_NEUTRAL;
    const key = fold8(name);
    if (!figures.has(key)) figures.set(key, readMilitary(input?.militaryOf?.(name)));
    return figures.get(key);
  };
  const curves2 = /* @__PURE__ */ new Map();
  run.musterOf = (name) => {
    if (!run.mech.muster) return null;
    const key = fold8(name);
    if (!curves2.has(key)) {
      const curve = input?.musterOf?.(name);
      curves2.set(key, curve && Array.isArray(curve.table) ? curve : null);
    }
    return curves2.get(key);
  };
  Object.defineProperty(run, "lookups", { value: { controller, group, figures, curves: curves2 } });
  run.regionChanged = (id) => {
    for (const battle of run.battles) {
      if (battle.status === "closed" || !battle.arena.indexOf.has(id)) continue;
      readRegion(battle, run, id);
      battle.planKey = "";
    }
  };
  run.spendFlip = () => {
    run.flipsLeft -= 1;
    if (run.flipsLeft > 0 || run.braked) return;
    run.braked = true;
    run.notes.push({ kind: "tempo" });
  };
  if (run.flipsLeft <= 0) run.braked = true;
  for (const war of Array.isArray(input?.wars) ? input.wars : []) {
    const id = clean2(war?.id);
    if (!id || run.wars.has(id)) continue;
    run.wars.set(id, { id, title: clean2(war.title), status: ["active", "ceasefire", "ended"].includes(war.status) ? war.status : "active", sides: [memberList2(war.sideA), memberList2(war.sideB)], began: clean2(war.startedDate) });
  }
  run.moments = (Array.isArray(input?.moments) ? input.moments : []).filter((moment) => moment && typeof moment === "object").map((moment, index) => ({ moment, index, day: Math.min(days, Math.max(0, Math.floor(Number(moment.day) || 0))) })).sort((a, b) => a.day - b.day || a.index - b.index);
  return run;
};
var putUnderStanding = (run, battle, side, first, today, day) => {
  const standing2 = battle.orders.filter((order) => order.s === side && !order.chosen && order.order !== "assault" && order.order !== "withdraw");
  const under = /* @__PURE__ */ new Map();
  for (let at = first; at < battle.troops[side].length; at += 1) {
    const troop = battle.troops[side][at];
    const fits = (order2) => {
      const stretch = resolveSector(battle.arena, today.line, today.sectors, order2.sector);
      return stretch && stretch.kind !== "all" && inSector(stretch, troop.x, troop.y, battle.place.kmAt);
    };
    const order = standing2.find(fits) ?? standing2.find((entry) => fold8(entry.sector) === "all") ?? null;
    if (order) under.set(order, [...under.get(order) ?? [], at]);
  }
  for (const [order, picked] of under) assignOrder(battle, run, order, { ...today, date: run.dateOf(day), run }, { picked, lagless: true });
};
var musterDay = (run, battle, day) => {
  if (!run.mech.muster || !levyOwed(battle.levy)) return;
  let today = null;
  for (const side of [HOLDER_SIDE_A, HOLDER_SIDE_B]) {
    for (const entry of battle.levy[side]) {
      const member = battle.sides[side][entry.o];
      if (entry.r >= entry.t || !member || battle.gone[side].has(entry.o)) continue;
      const days = diffGameDays(entry.f, run.dateOf(day));
      const share = days === null ? 1 : musterShare(run, member, days);
      const military = run.mech.military;
      const whole = formationsLeft(run, member);
      const part = military ? partLeft(run, member) : 0;
      const due = Math.min(Math.min(entry.t, Math.floor(entry.t * share)) - entry.r, MAX_TROOPS_PER_SIDE - battle.troops[side].length, whole + (part > 0 ? 1 : 0));
      if (due <= 0) continue;
      const contour = traceContour(battle.field);
      const own = side === HOLDER_SIDE_A ? contour.cellA : contour.cellB;
      let cells = [];
      for (let vertex = 0; vertex < own.length; vertex += 1) if (own[vertex] >= 0) cells.push(own[vertex]);
      const home = cells.filter((cell) => {
        const region = battle.arena.region[cell];
        return region > 0 && fold8(holderOf(battle, run, battle.arena.ids[region])) === fold8(member);
      });
      if (home.length > 0) cells = home;
      if (cells.length === 0 && battle.field.holders.indexOf(side) >= 0) cells = [battle.field.holders.indexOf(side)];
      cells = deployCells(battle, side, member, cells);
      if (cells.length === 0) continue;
      today = today ?? prepare(battle, day);
      const kinds = kindsFor(entry.t, run.era, military ? mixOf(run.militaryOf(member)) : null).slice(entry.r, entry.r + due);
      const first = battle.troops[side].length;
      let men = 0;
      for (let index = 0; index < due; index += 1) {
        const cell = cells[Math.min(cells.length - 1, Math.floor((index + 0.5) * cells.length / due))];
        const strength = military && index === due - 1 && due > whole ? Math.round(100 * part) : 100;
        battle.troops[side].push(createTroop({ x: cell % battle.field.cols + 0.5, y: Math.floor(cell / battle.field.cols) + 0.5, kind: kinds[index], owner: entry.o, strength }));
        men += strength / 100 * menOf(run, member);
      }
      draw(run, member, men);
      battle.pool[side] += due * POOL_PER_TROOP * battle.edge[side].reserves;
      entry.r += due;
      gatherNewcomers(battle, side, entry.o, first, run.warfare);
      putUnderStanding(run, battle, side, first, today, day);
      battle.touched = true;
      battle.planKey = "";
    }
  }
  battle.levy = battle.levy.map((list2) => list2.filter((entry) => entry.r < entry.t));
  if (today) setRadii(battle);
};
var REST_KM = 20;
var restAim = [0, 0];
var orderTroopsByMind = (run, battle, side, bodies, day, today, lead) => {
  const date = run.dateOf(day);
  const troops = battle.troops[side];
  const endOf = (order) => !order || order.mark !== MIND_MARK ? "" : Array.isArray(order.way) && order.way.length > 0 ? order.way[order.way.length - 1].join(",") : "out";
  const was = troops.map((troop) => isLive(troop) ? endOf(standingOf2(battle, troop)) : "");
  battle.orders = battle.orders.filter((order) => order.s !== side || order.chosen && order.mark !== MIND_MARK);
  for (const body of bodies) {
    const picked = (Array.isArray(body?.picked) ? body.picked : []).filter((index) => troops[index] && isLive(troops[index]));
    if (picked.length === 0) continue;
    if (body.order === "hold" || body.order === "dig in") {
      assignOrder(battle, run, { s: side, sector: "all", order: body.order, since: date, age: 0 }, { ...today, date, run }, { picked });
      continue;
    }
    if (body.order === "rest") {
      const order2 = { s: side, sector: "all", order: "fall back", since: date, age: 0, chosen: true, mark: MIND_MARK, ...lead ? { by: lead } : {} };
      battle.orders.push(order2);
      for (const index of picked) {
        const troop = troops[index];
        let target = null;
        if (battle.toSide && downhill(battle.field, battle.toSide[1 - side], troop.x, troop.y, restAim)) {
          const cells = REST_KM / battle.place.kmAt(troop.y);
          target = { x: troop.x - restAim[0] * cells, y: troop.y - restAim[1] * cells };
        }
        if (troop.dug) troop.state = STATE_HOLDING;
        troop.dug = false;
        troop.order = { kind: "fallback", standing: order2, target, since: day, day, gone: 0 };
        troop.fallback = null;
      }
      continue;
    }
    const way = Array.isArray(body.way) && body.way.length > 0 ? body.way.map((point) => [Number(point[0]), Number(point[1])]) : null;
    const order = { s: side, sector: "all", order: "advance", since: date, age: 0, chosen: true, mark: MIND_MARK, ...lead ? { by: lead } : {}, ...way ? { way } : {} };
    battle.orders.push(order);
    const end = endOf(order);
    assignOrder(battle, run, order, { ...today, date, run }, { picked, lagless: picked.every((index) => was[index] === end) });
  }
  battle.ordersChanged += 1;
  battle.touched = true;
  battle.planKey = "";
};
var SHARED_BATTLE_KEYS = Object.freeze(["arena", "place", "frame", "recorder", "watch", "startPhi", "startHolders", "mindHomes", "mendOf", "wallsFor", "wallRun"]);
var SILENT_RECORDER = Object.freeze({ record: () => {
}, shown: () => {
}, finish: () => null });
var rehearsal = (run, battle) => {
  const shared = Object.keys(battle).filter((key) => SHARED_BATTLE_KEYS.includes(key) || /(For|Run)$/.test(key));
  const bare = { ...battle };
  for (const key of shared) delete bare[key];
  bare.field = { ...battle.field };
  delete bare.field.arena;
  const copy = structuredClone(bare);
  for (const key of shared) copy[key] = battle[key];
  copy.field.arena = battle.field.arena;
  copy.watch = null;
  copy.recorder = SILENT_RECORDER;
  copy.mendOf = null;
  copy.grown = 6;
  const controllers = /* @__PURE__ */ new Map();
  const groups = /* @__PURE__ */ new Map();
  const stub = Object.create(run);
  Object.assign(stub, {
    battles: [copy],
    flips: [],
    notes: [],
    joins: [],
    starts: [],
    unitChanges: [],
    taken: new Set(run.taken),
    manpower: structuredClone(run.manpower),
    effort: /* @__PURE__ */ new Map(),
    mendLeft: run.mendLeft ? new Map(run.mendLeft) : run.mendLeft,
    wings: run.wings ? new Map([...run.wings].map(([id, wing]) => [id, { ...wing }])) : run.wings,
    airOver: /* @__PURE__ */ new Map(),
    airDay: -1,
    lines: Array.isArray(run.lines) ? structuredClone(run.lines) : run.lines,
    steps: 0,
    braked: false,
    flipsLeft: Infinity,
    controllerOf: (id) => controllers.has(id) ? controllers.get(id) : run.controllerOf(id),
    setController: (id, who) => {
      controllers.set(id, who);
    },
    groupOf: (id) => groups.has(id) ? groups.get(id) : run.groupOf(id),
    setGroup: (id, who) => {
      groups.set(id, who);
    },
    regionChanged: () => {
    },
    spendFlip: () => {
    },
    input: { ...run.input, watch: null, staffPolicy: null }
  });
  if (copy.wallRun) copy.wallRun = stub;
  return { run: stub, battle: copy };
};
var setAirMission = (battle, side, mission) => {
  if (!AIR_MISSIONS.includes(mission)) return;
  battle.airMission = Array.isArray(battle.airMission) ? battle.airMission : ["support", "support"];
  battle.airMission[side] = mission;
};
var rehearseOrders = (rehearsed, side, bodies, day, { air = null } = {}) => {
  const { run, battle } = rehearsed;
  if (typeof air === "string") setAirMission(battle, side, air);
  if (!Array.isArray(bodies) || bodies.length === 0 || liveCount(battle.troops[side]) === 0) return;
  const today = prepare(battle, day);
  const lead = battle.sides[side].find((member, at) => !battle.gone[side].has(at)) ?? "";
  orderTroopsByMind(run, battle, side, bodies, day, today, lead);
};
var rehearseDay = (rehearsed, day, { morning = true } = {}) => {
  const { run, battle } = rehearsed;
  if (battle.status !== "active" || battle.closing) return false;
  if (morning) {
    musterDay(run, battle, day);
    dawn(run, battle, day);
  }
  run.steps += simulateDay(battle, run, day);
  battle.daysRun += 1;
  return !battle.closing;
};
var PLACE_MARK = "\0place";
var RUN_MARK = "\0run";
var REGION_READERS = Object.freeze(["controllerOf", "sovereignOf"]);
var rehearsalBase = (packet) => {
  const missed = { count: 0 };
  const input = { ...packet.input };
  for (const [key, table] of Object.entries(packet.tables ?? {})) {
    input[key] = (asked) => {
      if (table.has(asked)) return table.get(asked);
      missed.count += 1;
      return void 0;
    };
  }
  const run = createRun(input);
  for (const [key, entries] of Object.entries(packet.lookups ?? {})) for (const [asked, value] of entries) run.lookups[key]?.set(asked, value);
  Object.assign(run, packet.books);
  const battle = packet.battle;
  const place = projectorOf(battle.frame);
  for (const key of Object.keys(battle)) {
    if (battle[key] === PLACE_MARK) battle[key] = place;
    else if (battle[key] === RUN_MARK) battle[key] = run;
  }
  run.battles = [battle];
  return { run, battle, missed };
};

// src/runtime/fronts/mind/troops.js
var TROOP_ACTIONS = Object.freeze(["hold", "dig in", "push", "strike", "go round", "take a city", "take a capital", "guard a city", "shore up", "rest", "breach"]);
var TROOP_FEATURE_NAMES = Object.freeze([
  "one",
  "strength",
  "armour",
  "artillery",
  "supply",
  "cut off",
  "dug in",
  "depth behind its line",
  "odds round it",
  "its own round it",
  "theirs round it",
  "strike: how far",
  "strike: odds there",
  "go round: how far",
  "go round: how many there",
  "city: how far",
  "city: worth",
  "city: how held",
  "capital: how far",
  "capital: how held",
  "guard: how far",
  "guard: danger",
  "guard: worth",
  "shore up: how far",
  "shore up: odds there",
  "how far back it stands among its own",
  "attacking now",
  "at a city of its own",
  // Wars and Fronts Pt.2.
  "fatigue",
  "breach: how far",
  "breach: wall's level",
  "today's going",
  "the sky over it",
  "still mustering"
]);
var TROOP_FEATURE_COUNT = TROOP_FEATURE_NAMES.length;

// src/runtime/fronts/mind/planner.js
var EVAL_NAMES = Object.freeze(["ground", "towns", "capitals", "strength", "cut off", "wear", "supply", "in its works"]);
var DEFAULT_EVAL = Object.freeze([0.25, 4, 15, 1, 1.5, -1, 1, 0.3]);
var EXTRA_NAMES = Object.freeze(["nearest enemy: how far", "nearest enemy: dug in", "nearest enemy: strength", "nearest enemy: under way", "nearest enemy: cut off", "how nearly it is surrounded"]);
var NET_FEATURES = TROOP_FEATURE_COUNT + EXTRA_NAMES.length;
var PLAN_NAMES = Object.freeze(["keep", "net", "net, digging in", "net, resting the worn", "push", "dig in", "the weakest place", "the second weakest place", "the third weakest place", "a pincer", "the towns", "everyone on the weakest place", "the walls"]);
var FIRST_PLAN_NAMES = Object.freeze(PLAN_NAMES.slice(0, 11));
var LATE_EVAL_NAMES = Object.freeze(["nearly cut off"]);
var LATE_EVAL = Object.freeze([0]);
var NET_AT = EVAL_NAMES.length;
var LATE_AT = NET_AT + TROOP_ACTIONS.length * (NET_FEATURES + 1);
var PLAN_PARAMS = LATE_AT + LATE_EVAL_NAMES.length;
var SURROUND_KM = 30;
var COMPASS2 = Object.freeze([[1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071], [-1, 0], [-0.7071, -0.7071], [0, -1], [0.7071, -0.7071]]);
var areaOf = /* @__PURE__ */ new WeakMap();
var rowArea = (battle) => {
  let areas = areaOf.get(battle.place);
  if (!areas || areas.length !== battle.field.rows) {
    areas = new Float64Array(battle.field.rows);
    for (let row = 0; row < areas.length; row += 1) {
      const km = battle.place.kmAt(row + 0.5);
      areas[row] = km * km;
    }
    areaOf.set(battle.place, areas);
  }
  return areas;
};
var standing = (battle, side) => {
  const { field } = battle;
  const lawful = battle.homeSide;
  const region = battle.arena?.region;
  const known = Boolean(lawful && region);
  const homeAt = (cell) => lawful[region[cell]];
  const out = new Float64Array(EVAL_NAMES.length);
  if (known) {
    const areas = rowArea(battle);
    let ground = 0;
    for (let cell = 0; cell < field.size; cell += 1) {
      const home = homeAt(cell);
      if (home !== 0 && home !== 1) continue;
      const holder = field.holders[cell];
      if (holder === home) continue;
      const area = areas[Math.floor(cell / field.cols)];
      ground += holder === side ? area : home === side ? -area : 0;
    }
    out[0] = ground / 1e3;
    for (const city of battle.arena?.cities ?? []) {
      const cell = Math.floor(city.y) * field.cols + Math.floor(city.x);
      if (!(cell >= 0 && cell < field.size)) continue;
      const home = homeAt(cell);
      const holder = field.holders[cell];
      if (home !== 0 && home !== 1 || holder === home) continue;
      const sign = holder === side ? 1 : home === side ? -1 : 0;
      if (city.capital) out[2] += sign;
      else out[1] += sign * ((Number(city.population) || 0) >= 1e5 ? 1.5 : 1);
    }
  }
  for (const [who, sign] of [[side, 1], [1 - side, -1]]) {
    let live = 0;
    let strength = 0;
    let cut = 0;
    let worn = 0;
    let fed = 0;
    let dug = 0;
    for (const troop of battle.troops[who]) {
      if (!isLive(troop)) continue;
      live += 1;
      strength += troop.strength / 100;
      if (troop.pocket) cut += troop.strength / 100;
      worn += Number(troop.fatigue) || 0;
      fed += troop.supply === void 0 ? 1 : troop.supply;
      if (troop.dug) dug += 1;
    }
    out[3] += sign * strength;
    out[4] -= sign * cut;
    if (live > 0) {
      out[5] += sign * (worn / live);
      out[6] += sign * (fed / live);
      out[7] += sign * (dug / live);
    }
  }
  return out;
};
var nearlySurrounded = (battle, side) => {
  const { field, place } = battle;
  let sum = 0;
  for (const troop of battle.troops[side]) {
    if (!isLive(troop) || troop.pocket) continue;
    const reach = SURROUND_KM / place.kmAt(troop.y);
    let theirs = 0;
    for (const [cx, cy] of COMPASS2) {
      const x = Math.floor(troop.x + cx * reach);
      const y = Math.floor(troop.y + cy * reach);
      if (x >= 0 && y >= 0 && x < field.cols && y < field.rows && field.holders[y * field.cols + x] === 1 - side) theirs += 1;
    }
    if (theirs > 4) sum += troop.strength / 100 * ((theirs - 4) / 4);
  }
  return sum;
};
var valueOf = (params, battle, side) => {
  const seen = standing(battle, side);
  let value = 0;
  for (let at = 0; at < EVAL_NAMES.length; at += 1) value += params[at] * seen[at];
  const late = params.length > LATE_AT ? params[LATE_AT] : LATE_EVAL[0];
  if (late !== 0) value += late * (nearlySurrounded(battle, 1 - side) - nearlySurrounded(battle, side));
  return value;
};
function* weighSteps(run, battle, side, day, ahead2, params, answers, bodies, air) {
  let worst = Infinity;
  for (const answer of answers) {
    const rehearsed = rehearsal(run, battle);
    if (bodies || air) rehearseOrders(rehearsed, side, bodies ?? [], day, { air });
    if (answer) rehearseOrders(rehearsed, 1 - side, answer, day);
    for (let days = 0; days < ahead2; days += 1) {
      if (!rehearseDay(rehearsed, day + days, { morning: days > 0 })) break;
      yield;
    }
    const value = valueOf(params, rehearsed.battle, side);
    if (value < worst) worst = value;
  }
  return worst;
}
var drain = (steps) => {
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
};
var weighRebuilt = (base, look, job) => {
  const before = base.missed.count;
  const value = drain(weighSteps(base.run, base.battle, look.side, look.day, look.ahead, look.params, look.answers, job?.bodies ?? null, job?.air ?? null));
  return base.missed.count === before ? value : null;
};
var PLAINER_PLANS = Object.freeze([0, 4, 5]);
var PLAINER_PLANNER = Object.freeze({ look: 12, ahead: 2, refine: 0, airControl: false });
var REPLIES = Object.freeze(["carry on", "push", "dig in"]);

// src/runtime/fronts/mind/rehearsers.js
var answerRehearsal = (state2, message) => {
  if (message?.kind === "look") {
    state2.look = { id: message.id, look: message.look, base: null };
    return null;
  }
  if (message?.kind !== "job") return null;
  let value = null;
  const kept = state2.look;
  if (kept && kept.id === message.id) {
    if (kept.base === null) {
      try {
        kept.base = rehearsalBase(kept.look.packet);
      } catch {
        kept.base = false;
      }
    }
    try {
      if (kept.base) value = weighRebuilt(kept.base, kept.look, message.job);
    } catch {
      value = null;
    }
  }
  return { kind: "value", id: message.id, at: message.at, value: typeof value === "number" ? value : null };
};

// src/Game/AI/rehearserWorker.js
var state = { look: null };
self.onmessage = (event) => {
  const reply = answerRehearsal(state, event?.data);
  if (reply) self.postMessage(reply);
};
/*! Open Historia — battlefields and fronts: limits and vocabulary © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the men a country's troops are raised from © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: what attrition took from each country © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — region types in the game © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — unit motion, reach & detection math © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the compact encodings © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the frame a battlefield is laid on © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the ground a frame lies on © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the field, who holds the ground and where the line runs © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the troops © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: troops tire, and recover at rest © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: which newer mechanics a run uses © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: each country's own military figures © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the whole map as a sheet of land and sea © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: air wings over the battlefield © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: how far it is over the ground © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: fortified lines that must be broken through © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a scenario's own climate zones © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: seasons and the day's weather © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a day's morning and evening © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a war's levies come in over weeks © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: where a side's new troops come in © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: what a battlefield's war came to © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: ground to be closed on © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the fight, and the ground it takes © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: sectors and places © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: who commands whom © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: an order as a way to go © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: who goes where © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: what the difficulty weighs © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: supply, patches and pockets © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: orders, and what the story says came of them © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: swarms © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — fronts a scenario begins with © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the line, measured and drawn © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a battlefield while a run works on it © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: what the prompt and the card read © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: where two sides at war touch © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the replay of a run © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: one day on one battlefield © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: troops sent into a country that is not in the war © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the saved record © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a side nobody plays decides for itself © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the way a transporter takes © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: transporters © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: the run © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: what each troop is shown (experiment) © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a staff that looks ahead (experiment) © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — battlefields and fronts: a staff's plans fought on other cores © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — a worker a staff's plans are fought in © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
