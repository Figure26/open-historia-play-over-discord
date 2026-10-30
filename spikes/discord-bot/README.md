# Discord bot spike

Open Historia shared games played in Discord: one game per channel, on the
headless engine (`spikes/headless`). The bot is `bot.mjs` (discord.js, slash
commands); everything it does is `core.mjs`, which has no Discord in it and is
tested without an account (`demo-core.mjs`).

## Commands

| Command | Who | What |
|---|---|---|
| `/oh new [country] [days] [hours] [name]` | anyone | Open a game in this channel; you lead it: a link to the start page (the scenario, then your country and the difficulty), or name a country to play the default scenario at once |
| `/oh join [country]` | anyone | A link of your own to the country page (or take one by name); up to 8 players |
| `/oh order text` | a player | An order for the coming round (only you see the reply) |
| `/oh ready [value]` | a player | Done for this round; the round is played once everyone is |
| `/oh view` | a player | Your link to the world page (also the **My map** button under each round's planning post) |
| `/oh orders`, `/oh cancel number` | a player | Your orders this round, numbered; take one back |
| `/oh status` | anyone | Date, round, time left, who plays what, who is ready |
| `/oh leave` | a player | Your country goes back to the AI; the lead passes on if it was yours |
| `/oh difficulty level` | the lead | How kindly the world treats the players' orders, from Very Easy to Impossible (the game's own levels) |
| `/oh days days` | the lead | How many game days the next rounds cover: 1 a day, 7 a week (the default), 30 a month, up to 365 |
| `/oh model name` | the lead | The AI the weeks are played on: any model the bot's keys reach, searched as you type (also the model picker on the world page) |
| `/oh gm [text]` | the lead | A Game Master command: something the coming round must make happen, above every rule, for any country (only the lead sees it); alone, lists the commands waiting |
| `/oh start`, `pause`, `resume`, `resolve`, `end` | the lead | The round clock; `end` puts the game aside |

What goes where:

- **The channel:** who joined, each round's planning and deadline, and the
  round's public events.
- **A player's world page:** the events only their government knows of, such
  as the outcome of a covert order, and the letters written to them. The bot
  sends no private messages.

**The start page**: the lead's link from `/oh new` opens on the library's
scenarios (each with its cover and how many polities it has); no game runs
until one is chosen, and a restarted bot keeps the lead waiting there. Then
the country page, with the **difficulty** above it: the game's own six levels,
whose words go into every week's prompt (on Easy "sound orders succeed and
doubtful ones mostly come off", on Very Easy they "succeed, usually in
full"). A table is played for its story, so the lead starts on Easy. The lead
changes it any time with `/oh difficulty`.

**Flags**: a polity's flag is the game's own (the scenario's `flags.json`,
polity name -> PNG; a game's own flags.json over it), so the game shows it in
its picker and country panel, and the bot on the country page's cards and
panel and on the world page (the header, beside every polity's name, a
country's panel). To give a scenario flags, put images named after its
polities in a folder ("Assar.png", "The Blue Armada.jpg") and run
`node spikes/discord-bot/import-flags.mjs new-scenario <folder>` with the map
editor closed: each becomes a PNG of at most 256 pixels in flags.json. A game
the bot keeps takes the scenario's flags again when the bot starts.

**The country page** (`web.mjs`): `/oh join` answers privately with a link
that lists the game's countries, the taken ones with who plays them; the one
picked is bound to that Discord account. Players lead countries, not the
scenario's groups. Before the game starts it offers **Create a faction**: a
country of the player's own (the game's faction maker), with a name, colour
and description, landless or holding up to five regions no country holds. The link is signed (it cannot be
changed to pick for someone else) and works for an hour. The bot serves it on
port 8787 (`OH_BOT_WEB_PORT`), and links point at `http://localhost:8787`
unless `OH_BOT_PUBLIC_URL` says where players reach it: for anyone on another
machine, forward the port or run a tunnel, e.g.
`cloudflared tunnel --url http://localhost:8787`, and set `OH_BOT_PUBLIC_URL`
to the address it prints.

**The world page** (`view.mjs`): every round's planning post has a **My map**
button (and **Ready**); clicking it answers that player alone ("Only you can
see this": Discord lets a bot do that only in answer to a click or a command)
with a link of their own to the world as their government knows it: the map
(who holds what, the groups' areas, the cities, the units they can see; pan,
zoom, and click a region, city, unit or polity to read about it), their
country, their orders and projects, the news with its event cards, every
polity's public profile and its relations, their threads, the wars,
agreements, institutions and their intelligence. It is drawn only from that
player's projection of the game (the multiplayer host's own
`projectForViewer`), so it shows nothing they could not see in the game.
It has a chat window: anything written there is an order for the round (as
many as the player likes), each with a button to take it back, and `/ready`,
`/unready`, `/orders`, `/cancel 2`, `/status` and `/help` work as in Discord;
a Ready button and a line with the date, the time left and who is ready stay
above it, refreshed every few seconds. The link lasts a week: anyone holding
it can give that player's orders, so it is only ever shown to them.
**The page keeps up with the game**: when a week has been played and its
news is in, an open world page loads itself again where the player left it
(the map's frame, the tab, an order half written), and a **Next week** window
shows what came in with the week, one event at a time in the order it
happened, with Previous and Next event. The **News tab reads the same way**:
it opens on the first event of the latest week (a round's days before the
game's date) and steps through every event the player's government heard of,
oldest to newest, the map framing each one as its card does; with no week
played yet it begins at the first event of all. The week's events are marked
new there too. A week the lead takes back is said too. The news has the fronts' reports with the events (every week's, kept in
the game's folder as `front-reports.json`), and its cards draw the battlefields
as the channel's do, with each event's forces under it.
`/write Country: message` writes a letter: to another player it is delivered
at once (they read it under Diplomacy on their world page); a government the AI plays answers it when the
week is played, as the time skip reads every conversation of the week.

**The game's own panels** (`panel/`): a country opens the game's **Stats
pane** (Politics, Diplomacy, Economy and Ranking, with its military and
economic cards), and the Diplomacy tab opens the game's **Diplomacy panel**
(conversations, institutions, intelligence). They are the game's own
components (`Game/GameUI/stats.jsx`, `chat.jsx`), built with Vite by
`node panel/build.mjs` and run as a shared game's guest screen runs them: they
read only the player's view (sent a document at a time as it changes,
`/world/view`), and what they do goes to the host as that player's request
(`/world/request`). From the table's game server they may read only the
scenario's own files (its stat sheet, tags, map geometry and tiles); a player's
or the host's documents, and every write, are refused there. Without the build
the page works as before, with its own country view and a note in the
Diplomacy tab. A country with no figures yet has them written when its Economy
tab asks (the game's own reading on the host's key; a few a round per player),
though the table writes every polity's anyway. Institutions' business is
refused, with the reason: this host does not run it. The Stats pane's "See how
it began on the timeline" opens the News tab at that event, as this page has
no timeline.

**The maps** (`map.mjs`) are the scenario's own map image (its background, made
into a JPEG once with ImageMagick's `magick` when it is installed, and served
at `/basemap`) with every region over it, of every type alike - land, coast,
mountain and ocean - filled see-through in its holder's colour at the
scenario's own opacity and outlined in its type's colour; unheld regions are
left clear. Disputed regions (claimed by two or more) are striped in their
claimants' colours, on the world page and on the event cards; the world page
lists them, and a region's panel says who disputes it. Any region of any type
can be part of a faction's area, a group's tile included: a region is in one
group's area at most, so a tile of a group the AI plays passes to the new
faction, and one of a group a player leads cannot be taken.

**The war** on the world page is drawn with the game's own map code
(`spikes/headless/war.mjs` running `Game/Map/frontGeometry.js`,
`frontPaint.js` and `seaBattleFeatures.js` on the player's projection): each
open battlefield's painted ground (who has taken what, as a picture), its
troops as counters and the arrows of their advances, the sea battles (green,
red or amber by how they went for the viewer) and the blockades' rings. A
**War** button hides it; clicking a troop or a sea battle says what it is.

**Event cards** (`map.mjs`): each event is drawn as a snapshot of the map
around the places it names (its regions outlined and named, its cities and
points marked, a country it names edged), on the map everyone can see. The
news in the channel carries them as PNG images (drawn
with `rsvg-convert`; without it the news goes without pictures), and the world
page shows them on its news. A card is drawn once and kept in the game's
folder, so it keeps the borders of its day.

**Battles and armies in the news** (`fronts.mjs`): the game's front engine
fights a war's battles day by day and keeps what happened on the battlefield's
record, not on the timeline. The model's event for a battle names only its war
and a region. So:

- **A battle event's card shows its battlefield**, drawn with the game's own
  front code: the ground each side holds, an arrowhead for each advance, and
  each general's disc with the troops they lead. The card is framed on the
  whole front. It is matched by the event's war, or else by the sides it names.
  Formations standing on that battlefield are drawn there, not as loose units.
- **Each front that saw something in the week gets a report of its own** in
  the channel, with its card: how far each side advanced and where, the towns
  and regions taken, what happened by date (towns stormed, troops cut off or
  besieged, reinforcements), and each side's strength and its change over the
  week. A quiet front is left out, unless it opened that week. Each run of the
  engine is told once, a restarted bot does not tell it again, and `/oh rewind`
  tells the replayed week afresh.
- **An event's embed lists its forces**: the formations it raised or moved,
  and those fighting on its battlefield, with their owner, type, strength and
  posture.

**A country a player founds is theirs**: when a player's order founds a
country and hands it their own land (a group made a state, a realm proclaimed a
kingdom), their seat moves to the new country, with their queued orders and
threads, and the channel is told. The model writes the new country's
government, leader and goals from the story. A `/oh rewind` past that week puts
the seat back.

A round covers 7 game days and stays open for orders for 24 hours by default
(`days`, `hours`; at most a week). It is played early once everyone is ready.

**A player who sends nothing still has a government**: when the round runs out
and a player sent no orders and did not ready up, their country is given one
standing order of its own for the week, to carry on softly as it has been, in
keeping with its character, goals and recent weeks: routine government,
follow-through, measured answers, and nothing bold or binding (no new war,
treaty, ceasefire, cession or change of government). It is a real order, so the
game's guard, which withdraws any choice of a player's country that no order
of theirs stands behind, lets it through. A player who readied up without an
order chose to do nothing, and is left to it.

**Every polity has its economy**: once the game starts, the stat sheet (the
Economy tab's figures) of every polity is written in the background, one at a
time, by the game's own reading; a country founded later gets its own after
the week that founds it, and a kept game fills in what it lacks when reopened.
About a cent each on GPT-6.1 Terra.

**The model** (`../headless/models.mjs`): the lead's world page has a model
picker, a window of its own ("Choose the AI" under the round, and on Ready,
with the model in use picked already, so Ready is one more click). It lists
every chat model each provider whose key is set lists (`ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `KIMI_API_KEY`, `GEMINI_API_KEY`),
asked of the providers themselves and kept ten minutes, searched by name, id
or maker and filtered by maker. The models tried in this game come first,
with what one week cost and took on each in a test game and their strengths
and weaknesses; every other one is marked "not tried here". Only the lead is
sent the list, and the keys never leave the bot. The default is GPT-6.1
Terra, and the choice is kept with the game (a listed model as
`<provider>:<model>`, e.g. `openai:gpt-6-luna-mini`). Each runs through the
game's own connections: GPT-6 Terra and Luna answer without reasoning (they
refuse tools while reasoning, and the game asks again without it), Kimi K2.6
with its thinking off, DeepSeek through the game's plain-JSON answer. A
model not tried here plays on the game's own retries; GPT-6.1 Sol, which
cannot turn reasoning off, will not play.

**The Game Master** (`/oh gm`, or `/gm` in the world page's chat window): the
lead writes what the coming round must make happen ("A plague breaks out in
Valenor's capital"). It is queued like an order, among the lead's own orders
(marked "Game Master:", and taken back the same way), and no one else sees
it. The time skip gets it twice: with the orders, and in a block of its own
at the end of the prompt that puts it above everything else: plausibility,
the difficulty, the scenario's rules and the pace of change. It may decide
for any country, players' included: the engine's guard, which withdraws a
player country's choice that no order of theirs stands behind, counts a
Game Master command as every player's order. A command the model leaves
unanswered carries over to the next round, like any order.

**The advisor**: each player's advisor (named by the week) has a tab of its
own in the world page's Diplomacy panel, next to Contacts: the three orders
to consider from the week just played (a click puts one in the order box)
and, under "In confidence", what the player's government learned in secret.

## Run it

1. In the [Discord developer portal](https://discord.com/developers/applications),
   make an application, add a bot, and copy its **token** and the
   **application id**. Invite it to a server with the `bot` and
   `applications.commands` scopes (permissions: Send Messages, Embed Links).
2. In fish:

```fish
cd spikes/discord-bot; npm install
node ../headless/build.mjs
node panel/build.mjs
read -s -x DISCORD_TOKEN
read -s -x OPENAI_API_KEY   # and/or ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, KIMI_API_KEY, GEMINI_API_KEY
env DISCORD_APP_ID=<application id> DISCORD_GUILD_ID=<your server id> OH_HEADLESS_AI=live node bot.mjs
```

`DISCORD_GUILD_ID` registers the commands on that server at once; without it
they are global and can take an hour to appear. `OH_HEADLESS_AI=mock-answer`
plays with a fake model at no cost. `OH_HEADLESS_MODEL` picks the model a
new game starts on (default `gpt-6.1-terra`; the lead can change it).
The time skip plays with the game's lookup functions (find a region, its
neighbours, who holds what), so the model can find any place on the map, not
only those its summary names; each lookup round sends the prompt again.
`OH_HEADLESS_SAVE_REQUESTS=1` plays a week in one request without them, as the
game's "save requests" setting does.

Games are kept in `~/.open-historia-discord` (`OH_BOT_DATA`), one folder per
channel. Stop the bot with Ctrl+C; started again, it reopens every game with
everyone in their seat. An ended game is moved to `ended/`.

## Test it without Discord

```fish
node ../headless/build.mjs
env OH_HEADLESS_AI=mock-answer node demo-core.mjs
```

Three players open a game, send orders (one covert) and ready; the channel gets
the public news, the covert order's outcome reaches only its player's world page, and
a restarted bot reopens the game. 10 checks.

## Not done

- **No map.** The engine has no map drawing; a picture of the map needs a
  renderer of its own.
- **Not yet run against Discord itself**: no bot token here. `core.mjs` is
  tested; `bot.mjs` only builds its commands (discord.js accepts them).
- **A restart starts the round's planning again** (orders already sent stay
  queued; the round clock is not kept).
- **One AI key pays for every game**, the bot's own.
- **A crashed game is not restarted** until the bot is.
