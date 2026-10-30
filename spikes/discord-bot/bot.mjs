// Discord bot spike: Open Historia shared games in Discord channels. One game
// per channel; everything it does is core.mjs's, this only speaks Discord.
//
//   /oh new [country] [days] [hours] [name] open a game here; you lead it (a link to pick your country)
//   /oh join [country]                      a link to the country page (or take one by name)
//   /oh order text                          an order for the coming week (private)
//   /oh ready [value]                       done for this round
//   /oh orders | /oh cancel number          your orders this round; take one back
//   /oh status                              date, round, who plays what, who is ready
//   /oh view                                your link to the world page
//   /oh leave                               give your country back to the AI
//   /oh gm [text]                           the lead as Game Master: a command the round must carry out
//   /oh model name                          the lead's choice of AI (headless/models.mjs)
//   /oh difficulty level                    the lead: how kindly the world treats the players' orders
//   /oh days days                           the lead: how many game days the next rounds cover
//   /oh start | pause | resume | resolve | rewind | end    the lead's controls
//
// Run (fish):
//   cd spikes/discord-bot; npm install
//   node ../headless/build.mjs
//   read -s -x DISCORD_TOKEN; read -s -x ANTHROPIC_API_KEY
//   env DISCORD_APP_ID=... DISCORD_GUILD_ID=... OH_HEADLESS_AI=live node bot.mjs
//
// DISCORD_GUILD_ID registers the commands on that one server at once (global
// commands can take an hour to appear). OH_BOT_DATA is where the games are
// kept (default ~/.open-historia-discord); OH_HEADLESS_AI=mock-answer plays
// with a fake model at no cost.
import os from "node:os";
import path from "node:path";
import { Client, Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import { createTables } from "./core.mjs";
import { listAllModels } from "../headless/models.mjs";
import { createPickPage } from "./web.mjs";

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_APP_ID;
const guildId = process.env.DISCORD_GUILD_ID || "";
if (!token || !appId) {
  // Names only, never a value: which are missing, and what was set that looks like them.
  const missing = [["DISCORD_TOKEN", token], ["DISCORD_APP_ID", appId]].filter(([, value]) => !value).map(([name]) => name);
  const near = Object.keys(process.env).filter((name) => /discord|token|app|client|guild|anthropic/i.test(name) && !missing.includes(name));
  console.error(`Missing: ${missing.join(", ")} (the bot's token and application id, from the Discord developer portal).`);
  console.error(`Set with names like these: ${near.length ? near.join(", ") : "none"}. In .env, one NAME=value a line, no spaces around =.`);
  process.exit(1);
}
const dataRoot = process.env.OH_BOT_DATA || path.join(os.homedir(), ".open-historia-discord");
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const country = (option, required = true) => option.setName("country").setDescription("A country of the game").setRequired(required).setAutocomplete(true);
const command = new SlashCommandBuilder()
  .setName("oh")
  .setDescription("Open Historia: a shared game in this channel")
  .addSubcommand((sub) => sub.setName("new").setDescription("Open a game in this channel; you lead it and get a link to pick your country")
    .addStringOption((o) => country(o, false))
    .addIntegerOption((o) => o.setName("days").setDescription("Game days a round covers (default 7)").setMinValue(1).setMaxValue(365))
    .addIntegerOption((o) => o.setName("hours").setDescription("Hours to send orders before a round is played (default 24)").setMinValue(1).setMaxValue(168))
    .addStringOption((o) => o.setName("name").setDescription("The game's name").setMaxLength(40)))
  .addSubcommand((sub) => sub.setName("join").setDescription("Take a country in this channel's game: you get a link to pick it").addStringOption((o) => country(o, false)))
  .addSubcommand((sub) => sub.setName("order").setDescription("Give your government an order for the coming week (only you see it)")
    .addStringOption((o) => o.setName("text").setDescription("What your government should do").setRequired(true).setMaxLength(1500)))
  .addSubcommand((sub) => sub.setName("orders").setDescription("Your orders this round, numbered (only you see them)"))
  .addSubcommand((sub) => sub.setName("cancel").setDescription("Take back one of your orders this round")
    .addIntegerOption((o) => o.setName("number").setDescription("Its number in /oh orders").setRequired(true).setMinValue(1).setMaxValue(12)))
  .addSubcommand((sub) => sub.setName("ready").setDescription("You are done for this round")
    .addBooleanOption((o) => o.setName("value").setDescription("False to take it back")))
  .addSubcommand((sub) => sub.setName("status").setDescription("The date, the round and who plays what"))
  .addSubcommand((sub) => sub.setName("view").setDescription("Your link to the map and the world as your government knows it"))
  .addSubcommand((sub) => sub.setName("leave").setDescription("Give your country back to the AI"))
  .addSubcommand((sub) => sub.setName("gm").setDescription("Lead: a Game Master command the coming round must carry out, above every rule (only you see it)")
    .addStringOption((o) => o.setName("text").setDescription("What happens, e.g. A plague breaks out in the capital. Leave out to list yours").setMaxLength(1500)))
  .addSubcommand((sub) => sub.setName("difficulty").setDescription("Lead: how kindly the world treats the players' orders")
    .addStringOption((o) => o.setName("level").setDescription("Easier: orders succeed more often").setRequired(true).addChoices(
      { name: "Very Easy: almost everything goes your way", value: "very-easy" },
      { name: "Easy: things usually go your way", value: "easy" },
      { name: "Medium", value: "medium" },
      { name: "Hard", value: "hard" },
      { name: "Very Hard", value: "very-hard" },
      { name: "Impossible", value: "impossible" },
    )))
  .addSubcommand((sub) => sub.setName("days").setDescription("Lead: how many game days the next rounds cover")
    .addIntegerOption((o) => o.setName("days").setDescription("1 is a day, 7 a week, 30 a month, up to 365").setRequired(true).setMinValue(1).setMaxValue(365)))
  .addSubcommand((sub) => sub.setName("model").setDescription("Lead: the AI the weeks are played on (also offered on Ready on the world page)")
    .addStringOption((o) => o.setName("model").setDescription("Its name, e.g. GPT-6.1 Terra, or any model your keys reach").setRequired(true).setMaxLength(100).setAutocomplete(true)))
  .addSubcommand((sub) => sub.setName("start").setDescription("Lead: start the game"))
  .addSubcommand((sub) => sub.setName("pause").setDescription("Lead: pause the round clock"))
  .addSubcommand((sub) => sub.setName("resume").setDescription("Lead: start the round clock again"))
  .addSubcommand((sub) => sub.setName("resolve").setDescription("Lead: play the week now"))
  .addSubcommand((sub) => sub.setName("rewind").setDescription("Lead: take back the last week and play it again"))
  .addSubcommand((sub) => sub.setName("end").setDescription("Lead: end this channel's game"));

const NEEDED_IN_CHANNEL = { "View Channel": PermissionFlagsBits.ViewChannel, "Send Messages": PermissionFlagsBits.SendMessages, "Embed Links": PermissionFlagsBits.EmbedLinks };

// What everyone in the channel should see the answer to; the rest is private.
const PUBLIC_REPLIES = new Set(["status"]);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let pickPage = null;
const tables = createTables({
  dataRoot,
  pickLink: (channelId, user) => pickPage.link(channelId, user),
  viewLink: (channelId, user) => pickPage.viewLink(channelId, user),
  post: async (channelId, payload) => {
    const channel = await client.channels.fetch(channelId);
    await channel?.send(payload);
  },
  log,
});
// The country page /oh join links to. OH_BOT_PUBLIC_URL is the address players
// reach it at (another machine needs this one's address, or a tunnel).
pickPage = createPickPage({ tables, dataRoot, port: Number(process.env.OH_BOT_WEB_PORT || 8787), publicUrl: process.env.OH_BOT_PUBLIC_URL || "", log });
await pickPage.listen();

client.once(Events.ClientReady, async (ready) => {
  const body = [command.toJSON()];
  await new REST().setToken(token).put(guildId ? Routes.applicationGuildCommands(appId, guildId) : Routes.applicationCommands(appId), { body });
  log(`logged in as ${ready.user.tag}; commands registered ${guildId ? `on server ${guildId}` : "globally"}`);
  // Every provider's models, asked now so /oh model's autocomplete has them in time.
  listAllModels().catch(() => {});
  const reopened = await tables.restore();
  log(`games reopened: ${reopened.length ? reopened.join(", ") : "none"} (kept in ${dataRoot})`);
});

// The buttons under a round's planning post: each answers whoever clicks it,
// seen by them alone.
const BUTTONS = { "oh:view": ["view", {}], "oh:ready": ["ready", { value: true }] };

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && BUTTONS[interaction.customId]) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const [command, options] = BUTTONS[interaction.customId];
    const user = { id: interaction.user.id, name: interaction.member?.displayName ?? interaction.user.globalName ?? interaction.user.username };
    try {
      const reply = await tables.handle(command, { channelId: interaction.channelId, user, options });
      await interaction.editReply({ content: reply.content.slice(0, 2000) });
    } catch (error) {
      await interaction.editReply({ content: `Not done: ${String(error?.message || error).slice(0, 1900)}` }).catch(() => {});
    }
    return;
  }
  if (interaction.isAutocomplete()) {
    // The model: every one the bot's keys reach, searched by what is typed.
    if (interaction.options.getFocused(true)?.name === "model") {
      await interaction.respond(await tables.modelChoices(String(interaction.options.getFocused() ?? "")).catch(() => [])).catch(() => {});
      return;
    }
    const typed = String(interaction.options.getFocused() ?? "").toLocaleLowerCase();
    const choices = (await tables.countries(interaction.channelId).catch(() => []))
      .filter((name) => name.toLocaleLowerCase().includes(typed)).slice(0, 25);
    await interaction.respond(choices.map((name) => ({ name, value: name }))).catch(() => {});
    return;
  }
  if (!interaction.isChatInputCommand() || interaction.commandName !== "oh") return;
  const sub = interaction.options.getSubcommand();
  // The game posts its news into the channel itself, so it needs these there
  // (a slash command reaches the bot even where it cannot).
  const lacking = Object.entries(NEEDED_IN_CHANNEL).filter(([, flag]) => interaction.appPermissions && !interaction.appPermissions.has(flag)).map(([name]) => name);
  if (lacking.length) {
    await interaction.reply({ content: `I cannot run a game in this channel: I need ${lacking.join(", ")} here. Add me (or my role) in the channel's Permissions.`, flags: MessageFlags.Ephemeral }).catch(() => {});
    return;
  }
  await interaction.deferReply(PUBLIC_REPLIES.has(sub) ? {} : { flags: MessageFlags.Ephemeral });
  const user = { id: interaction.user.id, name: interaction.member?.displayName ?? interaction.user.globalName ?? interaction.user.username };
  const options = {
    country: interaction.options.getString("country") ?? undefined,
    text: interaction.options.getString("text") ?? undefined,
    name: interaction.options.getString("name") ?? undefined,
    days: interaction.options.getInteger("days") ?? undefined,
    hours: interaction.options.getInteger("hours") ?? undefined,
    value: interaction.options.getBoolean("value") ?? undefined,
    level: interaction.options.getString("level") ?? undefined,
    order: interaction.options.getInteger("number") ?? undefined,
    model: interaction.options.getString("model") ?? undefined,
  };
  try {
    const reply = await tables.handle(sub === "cancel" ? "unorder" : sub, { channelId: interaction.channelId, user, options });
    await interaction.editReply({ content: reply.content.slice(0, 2000) });
  } catch (error) {
    await interaction.editReply({ content: `Not done: ${String(error?.message || error).slice(0, 1900)}` }).catch(() => {});
  }
});

const shutdown = async () => {
  log("stopping; every game is kept");
  await tables.stopAll();
  await pickPage.close();
  await client.destroy();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await client.login(token);
