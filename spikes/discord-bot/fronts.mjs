// Discord bot spike: the land war as the week's news. The front engine fights
// a war's battles itself, day by day, and writes what happened on the
// battlefield's record (its brief, its log, its chronicle), not as events on
// the timeline: a battle event the model wrote names its war (warId) and its
// region, and nothing of the front. So each battlefield that saw something in
// the week gets a report of its own, shaped as an event, for the channel and
// for its card.
//
//   frontReports(view, { formatDate, told })
//                                        the reports of a view's battlefields
//                                        (the public's projection), one per
//                                        battlefield per run of the engine
//   frontLogKeys(view)                   a key for every happening on the
//                                        view's battlefields: what is told
//   eventForces(view, event)             the formations an event is about, as
//                                        a line each, for its embed
//
// The words follow the game's own (Game/AI/frontPrompt.js NEWS_WORDS,
// runtime/fronts/brief.js describeSince), written for a player.

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = (value) => (Array.isArray(value) ? value : []);
const fold = (value) => clean(value).toLocaleLowerCase();
const slug = (value) => fold(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "front";
// "city: Redmouth" -> "Redmouth": the brief names a place with its kind.
const place = (value) => clean(value).replace(/^(city|region|town|port|capital):\s*/i, "");

// What a happening of a battlefield's log is in words: `who` leads the side it
// names, `enemy` the other. Who did it to whom is said outright.
const NEWS_WORDS = {
  invaded: (who, at) => `${who} sent its troops into ${at}`,
  offensive: (who, at) => `${who} went over to the attack ${at === "the whole line" ? "along the whole line" : `in the ${at}`}`,
  counter: (who, at, enemy) => `${who} answered ${enemy}'s breakthrough at ${at} with a counter-offensive`,
  withdrew: (who) => `${who} withdrew the last of its troops from the battlefield`,
  returned: (who) => `${who} sent its troops back onto the battlefield`,
  attacked: (who, at) => `${who} attacked ${at}, and the two are at war`,
  landed: (who, at) => `troops of ${who} came ashore at ${at}`,
  reinforced: (who, at) => `${who} was reinforced at ${at}`,
  drafted: (who, at) => `${who} brought up ${at}`,
  city: (who, at) => `${who} took ${at}`,
  taken: (who, at) => `${who} took ${at}`,
  destroyed: (who, at) => `${who} destroyed ${at}`,
  assault: (who, at) => `${who} stormed ${at}`,
  overrun: (who, at, enemy) => `${enemy} overran troops of ${who} near ${at}`,
  pocket: (who, at, enemy) => `${enemy} surrounded troops of ${who} near ${at}, and they surrendered`,
  siege: (who, at, enemy) => `${enemy} shut troops of ${who} in at ${at} and is besieging them`,
  breached: (who, at) => `${who} broke through ${at}`,
};
// The first told when there are many: what changes a war first.
const WEIGHT = { invaded: 9, attacked: 9, landed: 8, withdrew: 7, returned: 7, city: 6, breached: 5, pocket: 5, siege: 5, taken: 4, destroyed: 4, assault: 3, overrun: 3, counter: 2, offensive: 2, reinforced: 1, drafted: 1 };
const NEWS_MOST = 6;

const names = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// A happening of a battlefield's log, as a key of what has been told. A run
// begins on the day the one before ended, so the brief's `since` alone would
// tell that day's happenings twice.
const logKey = (record, e) => `log:${slug(record?.name)}|${clean(e?.d)}|${clean(e?.k)}|${e?.s}|${fold(e?.at)}`;
export const frontLogKeys = (view) => list(view?.world?.battlefields).flatMap((record) => list(record?.log).map((e) => logKey(record, e)));

// One battlefield's report, or null when nothing happened on it in its last
// run (a quiet week is not news). The report is an event: its id is the
// battlefield's and the day its last run ended on, so each run is told once
// (a war's battlefields are run together, and end on the same day). `told`
// holds the happenings already told (frontLogKeys); the report's `logKeys`
// are those it tells.
export const frontReport = (record, { formatDate = (d) => d, told = new Set() } = {}) => {
  if (!record || !Array.isArray(record.sides) || record.status === "standing") return null;
  const brief = record.brief ?? {};
  const lead = [clean(record.sides[0]?.[0]), clean(record.sides[1]?.[0])];
  if (!lead[0] || !lead[1]) return null;
  const since = clean(brief.since);
  const asOf = clean(record.asOf) || since;
  // Opened in its last run: the chronicle has a row a run.
  const opened = list(record.chronicle?.strength).length <= 1;
  const closed = record.status === "closed";
  const frozen = record.status === "frozen";
  const lines = [];

  // How the line moved, a side at a time, by the brief's first three sectors (the line's own).
  const sectors = list(brief.sectors).slice(0, 3);
  const advances = [0, 1].map((side) => sectors.filter((s) => Math.abs(Number(s?.moved) || 0) >= 1 && (s.moved > 0) === (side === 0))
    .map((s) => `${Math.abs(s.moved)} km in the ${s.name}`));
  const moved = advances.some((a) => a.length);
  if (moved) lines.push(`${[0, 1].filter((s) => advances[s].length).map((s) => `**${lead[s]}** advanced ${names(advances[s])}`).join("; ")}.`);

  // What changed hands.
  const gains = [0, 1].map((side) => [...list(brief.cities?.[side]).map(clean), ...list(brief.taken?.[side]).map(clean)].filter(Boolean));
  for (const side of [0, 1]) {
    if (!gains[side].length) continue;
    const shown = gains[side].slice(0, 6);
    lines.push(`**${lead[side]}** took ${names(shown)}${gains[side].length > shown.length ? ` and ${gains[side].length - shown.length} more` : ""}.`);
  }

  // The dated happenings of the run, the weightiest first.
  const seen = new Set();
  const news = list(record.log)
    .filter((e) => (e?.s === 0 || e?.s === 1) && NEWS_WORDS[e.k] && (!since || clean(e.d) >= since) && !told.has(logKey(record, e)) && (clean(e.at) || e.k === "withdrew" || e.k === "returned"))
    .filter((e) => { const key = `${e.d}|${e.k}|${e.s}|${fold(e.at)}`; if (seen.has(key)) return false; seen.add(key); return true; });
  const dated = news.map((entry, index) => ({ entry, index }))
    .sort((a, b) => (WEIGHT[b.entry.k] ?? 0) - (WEIGHT[a.entry.k] ?? 0) || a.index - b.index).slice(0, NEWS_MOST)
    .sort((a, b) => clean(a.entry.d).localeCompare(clean(b.entry.d)) || a.index - b.index)
    .map(({ entry }) => `- ${formatDate(clean(entry.d))}: ${NEWS_WORDS[entry.k](lead[entry.s], place(entry.at), lead[1 - entry.s])}.`);
  if (dated.length) lines.push(dated.join("\n") + (news.length > dated.length ? `\n- and ${plural(news.length - dated.length, "more happening")}.` : ""));

  // Troops cut off or shut in.
  const pockets = list(brief.pockets).slice(0, 3).map((p) => `Troops of **${lead[p.s]}** are ${p.siege ? "besieged" : "cut off"} by ${lead[1 - p.s]} at ${place(p.at)} (${plural(Number(p.days) || 0, "day")}).`);
  lines.push(...pockets);

  // Nothing moved, nothing taken, nothing told: no report, unless the
  // battlefield opened or closed.
  if (!moved && !gains.some((g) => g.length) && !dated.length && !pockets.length && !opened && !closed) return null;

  // Strength, and how it changed over the week (the chronicle keeps a row a run).
  const strength = list(brief.strength);
  if (strength.length === 2) {
    const rows = list(record.chronicle?.strength);
    const before = rows.length > 1 ? rows.at(-2) : null;
    const side = (s) => {
      const now = strength[s] ?? {};
      const was = before ? Number(before[1 + s]) : NaN;
      const change = Number.isFinite(was) && Number.isFinite(Number(now.n)) && now.n !== was ? ` (${now.n > was ? "+" : ""}${now.n - was})` : "";
      const notes = [now.pct !== undefined ? `${now.pct}% strength` : "", now.tired > 0 ? `${now.tired} exhausted` : "", now.mustering > 0 ? `${now.mustering} more mustering` : ""].filter(Boolean);
      return `**${lead[s]}** ${plural(Number(now.n) || 0, "formation")}${change}${notes.length ? `, ${notes.join(", ")}` : ""}`;
    };
    lines.push(`On the field: ${side(0)}; ${side(1)}.`);
  }
  const named = list(record.named).map((n) => clean(n?.name)).filter(Boolean);
  if (named.length) lines.push(`Fighting there: ${names(named)}.`);

  const head = closed ? "The fighting ends" : frozen ? "The front is frozen" : opened ? "A front opens" : moved || gains.some((g) => g.length) ? "The front moves" : "Fighting on the front";
  return {
    id: `front-${slug(record.name)}-${asOf.replace(/[^0-9]/g, "")}`,
    kind: "front",
    title: `${head}: ${clean(record.name)}`,
    description: lines.join("\n"),
    date: asOf,
    importance: opened || closed || gains.some((g) => g.length) || pockets.length ? "major" : "minor",
    warId: clean(record.warId),
    battlefield: clean(record.name),
    combatants: [...list(record.sides[0]), ...list(record.sides[1])].map(clean),
    places: [],
    logKeys: news.map((e) => logKey(record, e)),
  };
};

export const frontReports = (view, options = {}) => list(view?.world?.battlefields).map((record) => frontReport(record, options)).filter(Boolean);

// The battlefields an event is about: the one it names (a front report), the
// ones of the war it names, or else those fought between the sides it names.
// `fields` are the war's drawings (spikes/headless/war.mjs) or the records.
export const battlefieldsFor = (event, fields) => {
  const all = list(fields);
  if (clean(event?.battlefield)) return all.filter((b) => fold(b?.name) === fold(event.battlefield));
  if (clean(event?.warId)) {
    const ofWar = all.filter((b) => clean(b?.warId) === clean(event.warId));
    if (ofWar.length) return ofWar;
  }
  const sides = new Set(list(event?.combatants).map(fold).filter(Boolean));
  if (sides.size < 2) return [];
  return all.filter((b) => list(b?.sides).every((side) => list(side).some((member) => sides.has(fold(member)))));
};

// The formations an event is about, a line each: those it raised or moved
// (unit.eventId), and those fighting on its battlefields.
const TYPE_WORD = { infantry: "infantry", armor: "armour", air: "air wing", naval: "fleet", artillery: "artillery", garrison: "garrison" };
export const eventForces = (view, event) => {
  // A front report already says who fights on its battlefield.
  if (event?.kind === "front") return [];
  const units = list(view?.world?.units);
  const lines = [];
  const seen = new Set();
  const line = (u, where = "") => {
    if (!u || seen.has(clean(u.id))) return;
    seen.add(clean(u.id));
    const bits = [TYPE_WORD[u.type] ?? clean(u.type), Number.isFinite(Number(u.strength)) ? `strength ${u.strength}` : "", clean(u.posture || u.status)].filter(Boolean);
    lines.push(`**${clean(u.name)}** (${clean(u.ownerCode)}): ${bits.join(", ")}${where ? `, ${where}` : ""}`);
  };
  for (const u of units) if (clean(u?.eventId) && clean(u.eventId) === clean(event?.id)) line(u, clean(u.committedTo) ? `on ${clean(u.committedTo)}` : "");
  const fields = battlefieldsFor(event, list(view?.world?.battlefields));
  for (const field of fields) {
    for (const n of list(field.named)) line(units.find((u) => clean(u?.id) === clean(n?.unitId)), `on ${clean(field.name)}`);
  }
  return lines.slice(0, 8);
};
