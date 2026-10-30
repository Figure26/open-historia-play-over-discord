// node --test spikes/discord-bot/fronts.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { battlefieldsFor, eventForces, frontLogKeys, frontReport, frontReports } from "./fronts.mjs";

// A battlefield as a week of the front engine leaves it (the shape of a kept game's).
const field = (over = {}) => ({
  name: "Thornwild Forest", warId: "war-a-b", status: "active", sides: [["Mike Kingdom"], ["The Briar Kings"]],
  openedDate: "0354-02-06", asOf: "0354-03-05",
  brief: {
    since: "0354-02-26",
    sectors: [{ name: "northeast", moved: 0 }, { name: "centre", moved: 3 }, { name: "southwest", moved: -2 }, { name: "north", moved: 9 }],
    strength: [{ n: 17, pct: 100, tired: 12, mustering: 4 }, { n: 9, pct: 91 }],
    taken: [["The Deep Thornwild"], []], cities: [["Redmouth"], []], pockets: [],
  },
  log: [
    { d: "0354-02-20", k: "city", s: 0, at: "Wickerby" },
    { d: "0354-03-01", k: "city", s: 0, at: "city: Redmouth", size: 4000 },
    { d: "0354-03-02", k: "siege", s: 1, at: "Garrow's Toll" },
  ],
  chronicle: { strength: [["0354-02-26", 15, 9, 100, 95], ["0354-03-05", 17, 9, 100, 91]] },
  named: [{ s: 0, i: 15, name: "Peace Levy", unitId: "u-levy" }],
  ...over,
});

test("a battlefield's week is told: the line, what was taken, what happened, the strength", () => {
  const report = frontReport(field(), { formatDate: (d) => `[${d}]` });
  assert.equal(report.id, "front-thornwild-forest-03540305");
  assert.equal(report.kind, "front");
  assert.equal(report.battlefield, "Thornwild Forest");
  assert.match(report.title, /Thornwild Forest/);
  // Only the line's own three sectors are told.
  assert.match(report.description, /\*\*Mike Kingdom\*\* advanced 3 km in the centre; /);
  assert.match(report.description, /\*\*The Briar Kings\*\* advanced 2 km in the southwest/);
  assert.doesNotMatch(report.description, /9 km/);
  assert.match(report.description, /took Redmouth and The Deep Thornwild/);
  // The run's happenings, by date, and not the week before's. (A siege's side is the one shut in.)
  assert.match(report.description, /\[0354-03-01\]: Mike Kingdom took Redmouth/);
  assert.match(report.description, /Mike Kingdom shut troops of The Briar Kings in at Garrow's Toll/);
  assert.doesNotMatch(report.description, /Wickerby/);
  assert.match(report.description, /17 formations \(\+2\), 100% strength, 12 exhausted, 4 more mustering/);
  assert.match(report.description, /Fighting there: Peace Levy/);
  assert.equal(report.importance, "major");
});

test("a quiet week on a front is not news", () => {
  const quiet = field({ log: [], brief: { ...field().brief, sectors: [{ name: "centre", moved: 0 }], taken: [[], []], cities: [[], []] } });
  assert.equal(frontReport(quiet), null);
  // ...unless the front opened in it (its first run, the chronicle's first row).
  assert.match(frontReport({ ...quiet, chronicle: { strength: [["0354-03-05", 17, 9, 100, 91]] } }).title, /A front opens/);
  assert.equal(frontReports({ world: { battlefields: [quiet, field()] } }).length, 1);
});

test("an event is matched to the battlefields of its war, or of the sides it names", () => {
  const fields = [field(), field({ name: "Coast", warId: "war-c-d", sides: [["Burgerland"], ["Mike Kingdom"]] })];
  assert.deepEqual(battlefieldsFor({ warId: "war-a-b" }, fields).map((b) => b.name), ["Thornwild Forest"]);
  assert.deepEqual(battlefieldsFor({ combatants: ["Mike Kingdom", "Burgerland"] }, fields).map((b) => b.name), ["Coast"]);
  assert.deepEqual(battlefieldsFor({ battlefield: "Coast", warId: "war-a-b" }, fields).map((b) => b.name), ["Coast"]);
  assert.deepEqual(battlefieldsFor({ combatants: ["Mike Kingdom"] }, fields), []);
});

test("an event's forces: the formations it raised, and those on its battlefield", () => {
  const view = { world: {
    battlefields: [field()],
    units: [
      { id: "u-fleet", name: "Flamebound Fleet", type: "naval", ownerCode: "Ember", strength: 100, posture: "massing", eventId: "e1" },
      { id: "u-levy", name: "Peace Levy", type: "infantry", ownerCode: "Mike Kingdom", strength: 90, status: "transit", committedTo: "Thornwild Forest" },
    ],
  } };
  assert.deepEqual(eventForces(view, { id: "e1" }), ["**Flamebound Fleet** (Ember): fleet, strength 100, massing"]);
  assert.deepEqual(eventForces(view, { id: "e2", warId: "war-a-b" }), ["**Peace Levy** (Mike Kingdom): infantry, strength 90, transit, on Thornwild Forest"]);
  assert.deepEqual(eventForces(view, { id: "front-x", kind: "front", warId: "war-a-b" }), []);
});

test("a happening already told is not told again, though the next run begins on its day", () => {
  const before = field({ asOf: "0354-02-26", brief: { ...field().brief, since: "0354-02-19" }, log: [{ d: "0354-02-26", k: "drafted", s: 0, at: "1 fresh formation" }] });
  const told = new Set(frontLogKeys({ world: { battlefields: [before] } }));
  const after = field({ log: [...before.log, { d: "0354-03-01", k: "city", s: 0, at: "Redmouth" }] });
  const report = frontReport(after, { told });
  assert.doesNotMatch(report.description, /fresh formation/);
  assert.match(report.description, /took Redmouth/);
  assert.equal(report.logKeys.length, 1);
});

test("two battlefields of one war are two reports", () => {
  const reports = frontReports({ world: { battlefields: [field(), field({ name: "Thornwild Coast" })] } });
  assert.equal(reports.length, 2);
  assert.notEqual(reports[0].id, reports[1].id);
});
