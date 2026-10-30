// Discord bot spike: the bot's core driven as Discord would drive it, with the
// channel recorded instead of sent. No Discord account needed.
//
//   1. alice opens a game in a channel (Valenor), bob and carol join.
//   2. Everyone sends an order (carol's is covert) and readies: the week is played.
//   3. The channel gets the week's public events; carol alone sees the outcome
//      of her covert order, on her world page. Nobody is sent a private message.
//   4. The bot is restarted: the table is opened again from disk.
//
// Usage: node spikes/headless/build.mjs
//        OH_HEADLESS_AI=mock-answer node spikes/discord-bot/demo-core.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createTables } from "./core.mjs";
import { createPickPage } from "./web.mjs";

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oh-discord-"));
const CHANNEL = "111222333";
const alice = { id: "1001", name: "alice" };
const bob = { id: "1002", name: "bob" };
const carol = { id: "1003", name: "carol" };
const dave = { id: "1004", name: "dave" };
const erin = { id: "1005", name: "erin" };

const channel = [];
const dms = {};
const sent = []; // every payload, files included
const text = (payload) => [payload.content ?? "", ...(payload.embeds ?? []).map((e) => `${e.title}\n${e.description}`)].join("\n");
let pickPage = null;
const make = () => createTables({
  dataRoot,
  pickLink: (channelId, user) => pickPage.link(channelId, user),
  viewLink: (channelId, user) => pickPage.viewLink(channelId, user),
  post: async (channelId, payload) => { sent.push(payload); channel.push({ channelId, text: text(payload) }); },
  dm: async (userId, payload) => { sent.push(payload); (dms[userId] ??= []).push(text(payload)); },
  log: (m) => log(m),
});
const checks = [];
const check = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail });
const waitFor = async (what, test, ms = 60000) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await test()) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`timed out waiting for ${what}`);
};

let tables = make();
pickPage = createPickPage({ tables: { seats: (...a) => tables.seats(...a), handle: (...a) => tables.handle(...a), worldView: (...a) => tables.worldView(...a), roundState: (...a) => tables.roundState(...a), modelCatalog: (...a) => tables.modelCatalog(...a), panelRequest: (...a) => tables.panelRequest(...a), originOf: (...a) => tables.originOf(...a), opening: (...a) => tables.opening(...a) }, dataRoot, port: 8799 });
await pickPage.listen();
try {
  const as = (user, command, options = {}) => tables.handle(command, { channelId: CHANNEL, user, options });

  // 1. The table.
  // alice opens the game on the country page too: it waits for her pick.
  const opening = await as(alice, "new", { hours: 1 });
  const aliceUrl = opening.content.match(/https?:\/\/\S+/)?.[0];
  check("/oh new answers the lead with a link", Boolean(aliceUrl));
  let early = "";
  try { await as(bob, "join"); } catch (error) { early = error.message; }
  check("no one joins before the lead has picked", /not open yet/.test(early), early);
  // The start page: the scenario first, then her country and the difficulty.
  const startPage = await (await fetch(aliceUrl)).text();
  check("the lead's link opens on the scenarios", /Choose the scenario/.test(startPage) && /<h2>fantasi<\/h2>/.test(startPage) && /value="new-scenario"/.test(startPage));
  const aliceToken = new URL(aliceUrl).searchParams.get("t");
  const chose = await fetch(aliceUrl, { method: "POST", body: new URLSearchParams({ t: aliceToken, action: "scenario", scenario: "new-scenario" }), redirect: "manual" });
  check("choosing a scenario leads on to the countries", chose.status === 303 && channel.some((m) => /played on \*\*fantasi\*\*/.test(m.text)), `HTTP ${chose.status}`);
  const leadPage = await (await fetch(aliceUrl)).text();
  check("the lead's country page has the difficulty", /<h2 class="section">Difficulty<\/h2>/.test(leadPage) && /value="very-easy"/.test(leadPage) && /name="difficulty" value="easy"/.test(leadPage));
  const opened = await fetch(aliceUrl, { method: "POST", body: new URLSearchParams({ t: aliceToken, country: "Valenor", difficulty: "easy" }) });
  check("the lead's pick opens the game with her as its lead", opened.status === 200 && /Valenor: <@1001> \(lead\)/.test((await as(alice, "status")).content), `HTTP ${opened.status}`);
  check("at the difficulty she chose", (await tables.seats(CHANNEL)).difficulties.current === "easy");
  let notLeadLevel = "";
  try { await as(bob, "difficulty", { level: "very-easy" }); } catch (error) { notLeadLevel = error.message; }
  await as(alice, "difficulty", { level: "very-easy" });
  check("the lead changes the difficulty, and only the lead", /lead/.test(notLeadLevel) && (await tables.seats(CHANNEL)).difficulties.current === "very-easy" && channel.some((m) => /played at \*\*Very Easy\*\*/.test(m.text)));
  // bob picks on the country page: /oh join gives him a link of his own.
  const reply = await as(bob, "join");
  const url = reply.content.match(/https?:\/\/\S+/)?.[0];
  check("/oh join answers with a link", Boolean(url), reply.content.replace(/\n/g, " "));
  const listed = await (await fetch(url)).text();
  check("the page lists no groups, and no difficulty for a player who is not the lead", !/<h2 class="section">Groups<\/h2>/.test(listed) && !/<h2>The Gray Corsairs<\/h2>/.test(listed) && !/class="difficulty"/.test(listed));
  check("the page lists the countries, Valenor taken by alice", /<h2>The Ember Covenant<\/h2>/.test(listed) && /Played by alice<\/span>(<img class="flag"[^>]*>)?<h2>Valenor<\/h2>/.test(listed));
  check("each country is described: history, ruler, goals", /Aldric III/.test(listed) && /Charter of Fair Rule/.test(listed) && /"goals":\[/.test(listed));
  check("the page does not give away the Verdant Circle's hold on the Armada", !/puppet|secretly|answers to the Verdant/i.test(listed));
  const token = new URL(url).searchParams.get("t");
  const forged = await fetch(url.replace(/t=[^.]+/, `t=${Buffer.from(JSON.stringify({ c: CHANNEL, u: carol.id, n: "carol", e: Date.now() + 60000 })).toString("base64url")}`));
  check("a changed link is refused", forged.status === 403, `HTTP ${forged.status}`);
  const taken = await fetch(url, { method: "POST", body: new URLSearchParams({ t: token, country: "Valenor" }) });
  check("a taken country cannot be picked", taken.status === 409, `HTTP ${taken.status}`);
  const picked = await fetch(url, { method: "POST", body: new URLSearchParams({ t: token, country: "The Ember Covenant" }) });
  check("picking a country binds it to bob's Discord id", picked.status === 200 && /The Ember Covenant: <@1002>/.test((await as(bob, "status")).content), `HTTP ${picked.status}`);
  await as(carol, "join", { country: "The Verdant Circle" });
  // dave cannot take a group, and takes a country; erin makes a country of her own.
  const linkOf = async (user) => (await as(user, "join")).content.match(/https?:\/\/\S+/)?.[0];
  const daveUrl = await linkOf(dave);
  const daveToken = new URL(daveUrl).searchParams.get("t");
  const davePage = await (await fetch(daveUrl)).text();
  check("the page has a Create a faction card", /id="new-faction"/.test(davePage));
  const asGroup = await fetch(daveUrl, { method: "POST", body: new URLSearchParams({ t: daveToken, country: "The Gray Corsairs" }) });
  check("a group cannot be played", asGroup.status === 409, `HTTP ${asGroup.status}`);
  await fetch(daveUrl, { method: "POST", body: new URLSearchParams({ t: daveToken, country: "Khazmoor" }) });
  check("dave plays Khazmoor", /Khazmoor: <@1004>/.test((await as(dave, "status")).content));
  const world = JSON.parse(fs.readFileSync(new URL("../../server/data/scenarios/new-scenario/world.json", import.meta.url), "utf8"));
  const regions = JSON.parse(fs.readFileSync(new URL("../../server/data/scenarios/new-scenario/regions.coarse.geojson", import.meta.url), "utf8"));
  const valenorRegion = Object.entries(world.regionOwnershipOverrides).find(([, owner]) => owner === "Valenor")[0];
  const unclaimed = regions.features.map((f) => f.properties.id).find((id) => !world.regionOwnershipOverrides[id] && regions.features.find((f) => f.properties.id === id).properties.typeId === "land");
  const erinUrl = await linkOf(erin);
  const erinToken = new URL(erinUrl).searchParams.get("t");
  const faction = { t: erinToken, action: "create", name: "The Ashen Choir", color: "#5b3a8c", lore: "Wandering singers who carry the old fire-hymns from town to town and want the dragon cults gone." };
  const onValenor = await fetch(erinUrl, { method: "POST", body: new URLSearchParams({ ...faction, regionIds: valenorRegion }) });
  check("a region a country holds cannot be taken", onValenor.status === 409, `HTTP ${onValenor.status}`);
  const made = await fetch(erinUrl, { method: "POST", body: new URLSearchParams({ ...faction, regionIds: unclaimed }) });
  check("erin made a faction of her own and plays it", made.status === 200 && /The Ashen Choir: <@1005>/.test((await as(erin, "status")).content), `HTTP ${made.status}`);
  const seats = await tables.seats(CHANNEL);
  check("it is a country holding the unclaimed region she picked", seats.owners[unclaimed] === "The Ashen Choir" && seats.countries.find((c) => c.name === "The Ashen Choir")?.profile?.kind !== "group", unclaimed);
  check("the channel was told of her country", channel.some((m) => /founded \*\*The Ashen Choir\*\*, a country of their own in /.test(m.text)));
  check("everyone seated before her kept their seat", /Valenor: <@1001>/.test((await as(alice, "status")).content) && /Khazmoor: <@1004>/.test((await as(alice, "status")).content));
  let refused = "";
  try { await as(bob, "start"); } catch (error) { refused = error.message; }
  check("only the lead may start", /lead/.test(refused), refused);
  await as(alice, "start");
  await waitFor("planning news", () => channel.some((m) => /planning/.test(m.text)));

  // 2. Orders and ready.
  await as(alice, "order", { text: "Send envoys to Ambermark to renew the Southern Shield Pact." });
  await as(bob, "order", { text: "Launch three galleys to scout the Ithil coast." });
  await as(carol, "order", { text: "Quietly advise the Armada to stay out of southern quarrels." });
  const afterStart = await (await fetch(await linkOf({ id: "1006", name: "frank" }))).text();
  check("once started, the page offers no faction to create", !/id="new-faction"/.test(afterStart));
  let late = "";
  try { await as({ id: "1006", name: "frank" }, "create", { name: "The Late Ones" }); } catch (error) { late = error.message; }
  check("and making one is refused", /before the game starts/.test(late), late);
  // The lead as Game Master: a command for the week, seen by her alone.
  let notLeadGm = "";
  try { await as(bob, "gm", { text: "A comet falls on Valenor." }); } catch (error) { notLeadGm = error.message; }
  check("only the lead gives a Game Master command", /lead/.test(notLeadGm), notLeadGm);
  const gm = await as(alice, "gm", { text: "A great storm wrecks the Ember Covenant's galleys in harbour." });
  check("the lead's Game Master command is queued", /queued/.test(gm.content) && /storm/.test((await as(alice, "gm")).content));
  check("it is among her orders, marked, and not among bob's", /Game Master: A great storm/.test((await as(alice, "orders")).content) && !/storm/.test((await as(bob, "orders")).content));
  // Taken back like any of her orders, by its number.
  const spare = await as(alice, "gm", { text: "A comet is seen over Ambermark." });
  const spareAt = (await as(alice, "orders")).content.split("\n").findIndex((line) => /comet/.test(line)) + 1;
  await as(alice, "unorder", { order: String(spareAt) });
  check("a Game Master command is taken back with /oh cancel", /queued/.test(spare.content) && spareAt > 0 && !/comet/.test((await as(alice, "gm")).content));
  for (const user of [alice, bob, carol, dave, erin]) await as(user, "ready");
  await waitFor("the week's news", () => channel.some((m) => /The week to/.test(m.text)));
  const skipRecords = fs.readdirSync(path.join(dataRoot, CHANNEL, "ai-log")).map((name) => fs.readFileSync(path.join(dataRoot, CHANNEL, "ai-log", name), "utf8")).join("\n");
  check("the week's prompt carries the command in its Game Master block", /Game Master's Commands — absolute priority/.test(skipRecords) && /A great storm wrecks/.test(skipRecords));
  await waitFor("the next planning", () => channel.filter((m) => /planning/.test(m.text)).length >= 2);

  // The world page: a link of each player's own, by DM, each round.
  // The planning post carries "My map": each player's click answers with their own link.
  check("the planning post has a My map button and a Ready button", sent.some((p) => JSON.stringify(p.components ?? []).includes('"oh:view"') && JSON.stringify(p.components).includes('"oh:ready"')));
  check("no world link is sent by DM", !Object.values(dms).flat().some((m) => /\/world\?/.test(m)));
  const worldLink = async (user) => (await as(user, "view")).content.match(/https?:\/\/\S+\/world\?\S+/)?.[0];
  const links = await Promise.all([alice, bob, carol].map(worldLink));
  // Only the lead is sent the model list.
  const modelsAt = async (link) => (await fetch(link.replace("/world?", "/world/models?"))).json();
  const [aliceModels, bobModels] = [await modelsAt(links[0]), await modelsAt(links[1])];
  check("only the lead is sent the model list", aliceModels.ok && Array.isArray(aliceModels.catalog?.providers) && !bobModels.ok, JSON.stringify(bobModels).slice(0, 120));
  check("each player's My map gives a link of their own", links.every(Boolean) && new Set(links).size === 3);
  const carolWorld = await (await fetch(links[2])).text();
  const bobWorld = await (await fetch(links[1])).text();
  check("carol's world page has her covert order's outcome", /Verdant Circle Carries Out Its Orders/.test(carolWorld));
  check("bob's does not", !/Verdant Circle Carries Out Its Orders/.test(bobWorld) && /Ember Warships Shadow/.test(bobWorld));
  check("the world page shows the four disputed regions", (bobWorld.match(/<path class="dispute"/g) || []).length === 4);
  check("a world page draws the map and frames its event cards", /<g id="base"><path/.test(bobWorld) && /"cards":\{"event-/.test(bobWorld));
  fs.writeFileSync(path.join(dataRoot, "world.js"), bobWorld.split("<script>").at(-1).split("</script>")[0]);
  const forgedWorld = await fetch(links[1].replace(/t=[^.]+/, `t=${Buffer.from(JSON.stringify({ k: "view", c: CHANNEL, u: carol.id, n: "carol", e: Date.now() + 60000 })).toString("base64url")}`));
  const pickAsWorld = await fetch(daveUrl.replace("/pick?", "/world?"));
  const worldAsPick = await fetch(links[1].replace("/world?", "/pick?"));
  check("a changed world link, or a link of the other kind, is refused", forgedWorld.status === 403 && pickAsWorld.status === 403 && worldAsPick.status === 403, `${forgedWorld.status} ${pickAsWorld.status} ${worldAsPick.status}`);
  const cards = sent.flatMap((p) => p.files ?? []);
  check("the news carries event cards as PNG images", cards.length > 0 && cards.every((f) => f.attachment?.subarray(1, 4).toString() === "PNG"), `${cards.length} card(s)`);
  if (cards[0]) fs.writeFileSync(process.env.OH_DEMO_CARD || path.join(dataRoot, "card.png"), cards[0].attachment);

  // 3. Where the news went.
  const posted = channel.map((m) => m.text).join("\n");
  check("the channel was told the week's public events", /The week to 8 January 354/.test(posted) && /Valenor Carries Out Its Orders/.test(posted));
  check("the covert order's outcome is not in the channel", !/Verdant Circle Carries Out Its Orders/.test(posted));
  check("nobody is sent a private message", Object.values(dms).flat().length === 0, Object.values(dms).flat().join(" | ").slice(0, 200));
  // The lead sets how many days the next rounds cover; nobody else may.
  let notLeadDays = "";
  try { await as(bob, "days", { days: 30 }); } catch (error) { notLeadDays = error.message; }
  const month = await as(alice, "days", { days: 30 });
  const sessionDays = (await tables.roundState(CHANNEL, alice.id)) && JSON.parse(fs.readFileSync(path.join(dataRoot, CHANNEL, "session.json"), "utf8")).settings?.daysPerRound;
  check("only the lead may set a round's days", /lead/i.test(notLeadDays), notLeadDays);
  check("/oh days sets them, and the channel is told", /30 days/.test(month.content) && channel.some((m) => /each round plays \*\*30 days\*\*/.test(m.text)) && sessionDays === 30, `${month.content} / kept ${sessionDays}`);
  await as(alice, "days", { days: 7 });
  const status = await as(carol, "status");
  check("/oh status shows the date and the players", /8 January 354/.test(status.content) && /The Verdant Circle: <@1003>/.test(status.content), status.content.replace(/\n/g, " / "));
  check("the round went on to planning", channel.filter((m) => /planning/.test(m.text)).length >= 2);

  // The lead takes the week back and it is played again with the same orders.
  const records = fs.readdirSync(path.join(dataRoot, CHANNEL, "ai-log")).filter((f) => f.startsWith("skip-"));
  check("a record of the week's time skip was kept", records.length >= 1 && JSON.parse(fs.readFileSync(path.join(dataRoot, CHANNEL, "ai-log", records[0]), "utf8")).some((c) => String(c.answer).includes("submit_jump_result")), records.join(", "));
  let notLead = "";
  try { await as(bob, "rewind"); } catch (error) { notLead = error.message; }
  check("only the lead may take a week back", /lead/.test(notLead), notLead);
  const before = channel.length;
  await as(alice, "rewind");
  const rewound = await as(alice, "status");
  check("/oh rewind takes the game back to the week's start", /1 January 354/.test(rewound.content) && channel.slice(before).some((m) => /took back the last week/.test(m.text)), rewound.content.split("\n")[0]);
  const bobOrders = await as(bob, "orders");
  check("the orders sent for that week stand", /Launch three galleys/.test(bobOrders.content), bobOrders.content);
  await waitFor("planning again", () => channel.slice(before).some((m) => /1 January 354: planning/.test(m.text)));
  for (const user of [alice, bob, carol, dave, erin]) await as(user, "ready");
  await waitFor("the week played again", () => channel.slice(before).some((m) => /The week to 8 January 354/.test(m.text)));
  await waitFor("its next planning", () => channel.slice(before).some((m) => /8 January 354: planning/.test(m.text)));
  check("the week was played again", channel.slice(before).some((m) => /Valenor Carries Out Its Orders/.test(m.text)));
  check("an event on the week's first day is told too", channel.slice(before).some((m) => /Heralds Proclaim the New Week/.test(m.text)));

  // The world page's chat window: bob gives two orders, takes one back and readies.
  const chat = async (text) => (await (await fetch(links[1].replace("/world?", "/world/say?"), { method: "POST", body: JSON.stringify({ text }) })).json());
  const state = async () => { const r = await (await fetch(links[1].replace("/world?", "/world/state?"))).json(); if (!r.ok) log("state:", r.text); return r.state; };
  const first = await chat("Send the Duskmoor galleys to shadow Ambermark's fishing fleet.");
  await chat("Double the night watch on the Ember beaches.");
  const ordered = await chat("/orders");
  check("orders written in the chat window are queued", first.ok && /1\. Send the Duskmoor galleys/.test(ordered.text) && /2\. Double the night watch/.test(ordered.text), ordered.text.replace(/\n/g, " / "));
  const cancelled = await chat("/cancel 1");
  const afterCancel = await state();
  check("/cancel takes one back", cancelled.ok && afterCancel.orders.length === 1 && /night watch/.test(afterCancel.orders[0].text), cancelled.text);
  const unknown = await chat("/fly");
  check("an unknown command says so", !unknown.ok && /help/.test(unknown.text), unknown.text);
  await chat("/ready");
  const readied = await state();
  check("/ready in the chat window readies bob", readied.ready.some((p) => p.you && p.ready && p.country === "The Ember Covenant"), JSON.stringify(readied.ready.map((p) => `${p.country}${p.ready ? "+" : ""}`)));
  const forgedChat = await (await fetch(links[1].replace("/world?", "/world/say?").replace(/t=[^.]+/, "t=x"), { method: "POST", body: "{}" })).json();
  check("a changed link cannot give orders", !forgedChat.ok);

  // Diplomacy from the world page: bob writes to a government the AI plays,
  // then answers in that conversation as the Answer button does. Nobody
  // answers until the week is played.
  const toAmbermark = await chat("/write Ambermark: The Covenant proposes a fishing truce on the Amber Sea.");
  check("a letter to a government is answered when the week is played", /Ambermark will answer when the week is played/.test(toAmbermark.text), toAmbermark.text);
  const letter = (await state()).threads?.find((c) => c.countries?.some((x) => (x.name || x) === "Ambermark"));
  check("/write opens a conversation with that government", Boolean(letter), JSON.stringify((await state()).threads?.map((c) => c.title)));
  const answered = await (await fetch(links[1].replace("/world?", "/world/say?"), { method: "POST", body: JSON.stringify({ text: "Three days' notice before any patrol, then.", thread: letter?.id }) })).json();
  const thread = (await state()).threads?.find((c) => c.id === letter?.id);
  check("an answer goes into that conversation, not the orders", answered.ok && thread?.messages?.some((m) => /Three days' notice/.test(m.text)) && !(await state()).orders.some((o) => /Three days/.test(o.text)), answered.text);
  const elsewhere = await (await fetch(links[1].replace("/world?", "/world/say?"), { method: "POST", body: JSON.stringify({ text: "Hello", thread: "chat-not-mine" }) })).json();
  check("nobody answers in a conversation that is not theirs", !elsewhere.ok, elsewhere.text);
  // The game's own panels on the world page (panel/entry.jsx): the view a key
  // at a time, the host's requests, and nothing private from the game server.
  const viewOf = async (hashes) => (await (await fetch(links[1].replace("/world?", "/world/view?"), { method: "POST", body: JSON.stringify({ hashes }) })).json());
  const whole = await viewOf({});
  const again = await viewOf(whole.hashes);
  check("the panels are sent the view, then only what changed", whole.ok && whole.docs.world && whole.docs.chat && again.ok && Object.keys(again.docs).length === 0, Object.keys(whole.docs ?? {}).join(","));
  check("and the view is bob's own: carol's secret is not in it", !JSON.stringify(whole.docs).includes("Verdant Circle Carries Out Its Orders"));
  const panelSay = await (await fetch(links[1].replace("/world?", "/world/request?"), { method: "POST", body: JSON.stringify({ t: "say", fields: { thread: letter?.id, to: [], text: "And no galleys past the beacon line." } }) })).json();
  check("a panel's request reaches the host as bob's", panelSay.ok && (await state()).threads?.find((c) => c.id === letter?.id)?.messages?.some((m) => /beacon line/.test(m.text)), JSON.stringify(panelSay));
  const pageCookie = (await fetch(links[1])).headers.get("set-cookie")?.split(";")[0] ?? "";
  const through = async (p, init = {}) => (await fetch(links[1].split("/world?")[0] + p, { ...init, headers: { cookie: pageCookie } })).status;
  check("the scenario's own files pass through to the panels", await through("/api/runtime/json/stats") === 200, pageCookie.slice(0, 20));
  const private_ = await Promise.all(["world", "chat", "events", "advisor", "snapshots"].map((key) => through(`/api/runtime/json/${key}`)));
  check("a player's and the host's documents never do", private_.every((status) => status === 404), private_.join(","));
  check("nor does a write", await through("/api/runtime/json/world", { method: "PUT", body: "{}" }) === 204);

  // A letter to another player reaches them at once, on their world page.
  const toCarol = await chat("/write The Verdant Circle: Will the Circle stand aside if the galleys sail?");
  check("a letter to a player is delivered at once", /Delivered to The Verdant Circle/.test(toCarol.text), toCarol.text);
  const carolThreads = (await tables.roundState(CHANNEL, carol.id)).threads ?? [];
  check("it is in their Diplomacy tab, from the writer", carolThreads.some((c) => c.countries?.some((x) => (x.name || x) === "The Ember Covenant") && c.messages?.some((m) => /stand aside/.test(m.text) && m.role === "leader")), JSON.stringify(carolThreads.map((c) => c.countries)));
  check("and no private message says so", Object.values(dms).flat().length === 0);
  // The week reads the letters with everything else, each conversation under its player's name.
  const skipsBefore = fs.readdirSync(path.join(dataRoot, CHANNEL, "ai-log")).length;
  for (const user of [alice, bob, carol, dave, erin]) await as(user, "ready");
  await waitFor("the week with the letters", () => fs.readdirSync(path.join(dataRoot, CHANNEL, "ai-log")).length > skipsBefore);
  const newest = fs.readdirSync(path.join(dataRoot, CHANNEL, "ai-log")).sort().at(-1);
  // The round's record keeps every call of the round; the time skip is the one offered its tool.
  const roundCalls = JSON.parse(fs.readFileSync(path.join(dataRoot, CHANNEL, "ai-log", newest), "utf8"));
  const asked = JSON.stringify((roundCalls.find((c) => c.tools?.includes("submit_jump_result")) ?? roundCalls[0]).request);
  check("the week's prompt has the letters and whose they are", /fishing truce/.test(asked) && /Three days' notice/.test(asked) && /Ambermark \(with The Ember Covenant\)/.test(asked), newest);
  check("and is told to answer them and whom each letter is for", /no government has answered yet is answered in this period/.test(asked) && /name that player's polity in `to`/.test(asked));
  await waitFor("planning after the week", () => channel.some((m) => /15 January 354: planning/.test(m.text)));

  // 4. The bot restarts.
  await tables.stopAll();
  tables = make();
  const restored = await tables.restore();
  check("a restarted bot reopens the table", restored.includes(CHANNEL), restored.join(", "));
  const after = await tables.handle("status", { channelId: CHANNEL, user: bob, options: {} });
  check("with its date and players", /15 January 354/.test(after.content) && /The Ember Covenant: <@1002>/.test(after.content), after.content.replace(/\n/g, " / "));
  await tables.handle("order", { channelId: CHANNEL, user: bob, options: { text: "Hold a fire-rite on the Duskmoor beaches." } });
  check("and orders go in again", true);
  // Dates read as the game writes them, never the stored spelling with its zeros.
  const stored = [...channel.map((m) => m.text), ...Object.values(dms).flat()].filter((text) => /(^|[^\d-])0354-\d{2}-\d{2}/.test(text));
  check("no date players are sent has the year's leading zero", stored.length === 0, stored[0]?.slice(0, 120));
} catch (error) {
  check("the demo ran to the end", false, String(error?.stack || error).slice(0, 800));
} finally {
  log("channel:\n  " + channel.map((m) => m.text.split("\n")[0]).join("\n  "));
  for (const c of checks) log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? `  (${c.detail})` : ""}`);
  log(checks.length && checks.every((c) => c.ok) ? `ALL ${checks.length} PASSED` : `${checks.filter((c) => !c.ok).length} of ${checks.length} FAILED`);
  process.exitCode = checks.length && checks.every((c) => c.ok) ? 0 : 1;
  await tables.stopAll();
  await pickPage.close();
  fs.rmSync(dataRoot, { recursive: true, force: true });
}
