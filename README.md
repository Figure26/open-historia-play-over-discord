# Open Historia: Play over Discord

Play Open Historia shared games in Discord. Each channel holds one game for up to
8 players, and each player leads a country. Players send orders with slash
commands or from their own world page. The game's own engine plays each round
with the AI model the game's lead picks, and the bot posts the news in the channel.

## Requirements

- **Node.js** 20.19+ or 22.12+
- **A Discord application with a bot.** You need its token and application id.
- **An API key for at least one AI provider:** Anthropic, OpenAI, DeepSeek, Kimi or Gemini
- **Optional:**
  - `rsvg-convert` (from librsvg) draws the event-card pictures posted in the channel. Without it, the news is posted without pictures.
  - ImageMagick (`magick`) turns a scenario's map image into a smaller JPEG. Without it, the original image is used.
- **A way for players to reach port 8787**, for the country and world pages.
  Port forwarding or a tunnel works (see "Letting players in").

## 1. Create the Discord bot

1. Go to the [Discord developer portal](https://discord.com/developers/applications)
   and choose **New Application**.
2. Under **Bot**, choose **Reset Token** and copy the token.
3. Under **General Information**, copy the **Application ID**.
4. Under **OAuth2 → URL Generator**, tick the `bot` and `applications.commands` scopes,
   then the **Send Messages** and **Embed Links** permissions. Open the generated
   link to invite the bot to your server.
5. Copy your server's id: in Discord, turn on Developer Mode, then right-click
   the server and choose **Copy Server ID**.

## 2. Install

```sh
git clone https://github.com/Figure26/open-historia-play-over-discord.git
cd open-historia-play-over-discord
npm install
```

`npm install` also installs discord.js in `spikes/discord-bot/`. Nothing has to be
built: the game engine and the world page's panels come prebuilt.

## 3. The `.env` file

Create a file named `.env` in `spikes/discord-bot/`, one `NAME=value` per line,
with no spaces around `=`:

```ini
# Discord (required)
DISCORD_TOKEN=your-bot-token
DISCORD_APP_ID=your-application-id
DISCORD_GUILD_ID=your-server-id

# Play with a real AI (leave out to play with a fake one)
OH_HEADLESS_AI=live

# At least one AI key
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
KIMI_API_KEY=
GEMINI_API_KEY=

# Optional
OH_HEADLESS_MODEL=gpt-6.1-terra
OH_BOT_PUBLIC_URL=https://your-address.example
OH_BOT_WEB_PORT=8787
OH_BOT_DATA=/path/to/games
```

**Never commit `.env` or share it.** It holds your bot token and API keys.
It is already in `.gitignore`.

| Variable | Required | What it does |
|---|---|---|
| `DISCORD_TOKEN` | yes | The bot's token |
| `DISCORD_APP_ID` | yes | The application id |
| `DISCORD_GUILD_ID` | no | Registers the commands on this server at once. Without it, the commands are global and can take an hour to appear |
| `OH_HEADLESS_AI` | no | `live` plays with a real AI. `mock-answer` uses a free fake model, for testing |
| `*_API_KEY` | at least one | The bot lists every model these keys can reach. The game's lead picks one per game |
| `OH_HEADLESS_MODEL` | no | The model a new game starts on (default `gpt-6.1-terra`) |
| `OH_BOT_PUBLIC_URL` | no | The address players use to reach the bot's pages (default `http://localhost:8787`) |
| `OH_BOT_WEB_PORT` | no | The port of the bot's pages (default `8787`) |
| `OH_BOT_DATA` | no | Where games are saved (default `~/.open-historia-discord`) |

## 4. Run it

```sh
cd spikes/discord-bot
node --env-file=.env bot.mjs
```

Stop it with Ctrl+C. When you start it again, it reopens every game with every
player in their seat.

To try it first without Discord or an AI key, run this from the repository root.
It plays a short game with a fake model in about 10 seconds:

```sh
npm run demo
```

## Letting players in

Players get private links to a country page and a world page, served by the bot
on port 8787. On your own machine, those links work as they are. For anyone
else, make the port reachable and set `OH_BOT_PUBLIC_URL` to the address they use.
For example, with a Cloudflare tunnel:

```sh
cloudflared tunnel --url http://localhost:8787
```

Then put the address it prints in `OH_BOT_PUBLIC_URL` and restart the bot.

## Scenarios and maps

Scenarios are in `server/data/scenarios/`, one folder per scenario. A scenario's
map is part of its folder:

```
server/data/scenarios/<scenario-id>/
  scenario.json      name, description and cover (a folder without this is not listed)
  world.json         the countries, groups and the starting date
  regions.geojson    the map's regions (required: the scenario's own map)
  background.json    the map's background image
  cities.geojson     the cities
  colors.json        the countries' colours
  flags.json         the countries' flags
  tags.json, game.json, prompts.json, storage/
```

**To add a scenario:**

1. Make or open it in Open Historia's map editor.
2. Copy its folder from your Open Historia data folder (`server/data/scenarios/<scenario-id>`)
   into `server/data/scenarios/` here.
3. Add its id to `order` in `server/data/scenario-manifest.json`. That list sets
   the order in which scenarios are offered. Scenarios not in it are listed after.
4. Restart the bot.

**Flags:** put images named after the scenario's countries in a folder (for
example `Assar.png` or `The Blue Armada.jpg`), then run:

```sh
node spikes/discord-bot/import-flags.mjs <scenario-id> <folder>
```

Two fantasy scenarios are included: `new-scenario` and `fantasi-copy`.

## Playing

| Command | Who | What it does |
|---|---|---|
| `/oh new` | anyone | Opens a game in this channel. You lead it |
| `/oh join` | anyone | Gives you a link to pick a country |
| `/oh order text` | a player | Adds an order for the coming round |
| `/oh ready` | a player | Marks you done. The round is played once every player is ready |
| `/oh view` | a player | Gives you your link to the world page |
| `/oh orders`, `/oh cancel number` | a player | Lists your orders, or takes one back |
| `/oh status` | anyone | Shows the date, the round and who is ready |
| `/oh leave` | a player | Hands your country back to the AI |
| `/oh model`, `/oh difficulty`, `/oh days` | the lead | Sets the AI model, the difficulty and the game days per round |
| `/oh gm text` | the lead | Gives a Game Master command for the coming round |
| `/oh start`, `pause`, `resume`, `resolve`, `rewind`, `end` | the lead | Controls the round clock |

The full guide is in `spikes/discord-bot/README.md`. Skip its build steps,
because that is already done here.

## Where things are kept

- **Games** are in `~/.open-historia-discord` (or `OH_BOT_DATA`), one folder per
  channel. Ended games move to `ended/`.
- **The folder layout must stay as it is.** The bot finds the game's server and
  scenarios by these paths (`spikes/`, `server/`, `src/`).
