// The models a table can be played on, each through the game's own AI
// connections (Game/AI/providerConfig.js), and what the week-7 benchmark showed
// of each: one week of a three-player game (both time-skip calls), the same
// prompt on every model, October 2026. A model is offered only when its
// provider's key is set (the bot's .env); keys never leave this process.
//
// How each one runs in the game, tried with one stat sheet each (October 27):
// GPT-6.1 Terra and GPT-6 Luna refuse tools while reasoning (the game would ask
// each call again without it), so they are asked without it from the start; Kimi K2.6 is asked with its thinking off (it refuses a forced tool
// call while thinking, and fumbled the plain-JSON fallback); DeepSeek refuses a
// forced tool call while thinking too, and answers through the game's plain-JSON
// fallback. The benchmark ran them with their reasoning on, so their figures
// are a guide. Not offered: GPT-6.1 Sol (it cannot turn its reasoning off, and
// the game cannot reach it any other way) and Kimi K3.1 Pro (unproven in the
// game, and this account takes one Kimi request at a time).

export const MODELS = [
  {
    id: "gpt-6.1-terra", provider: "openai", key: "OPENAI_API_KEY", name: "GPT-6.1 Terra",
    params: { reasoning_effort: "none" },
    wait: "about 1 minute a week", cost: "about $0.09 a week",
    good: "The fastest week of all, cheap, and every answer was valid.",
    weak: "Terse: about 90 words an event, so less colour than Claude.",
  },
  {
    id: "claude-sonnet-5-5", provider: "anthropic", key: "ANTHROPIC_API_KEY", name: "Claude Sonnet 5.5",
    wait: "about 2.5 minutes a week", cost: "about $0.54 a week",
    good: "The best storytelling: rich events that follow on from earlier weeks.",
    weak: "The dearest of the fast ones; once put a place in the wrong region.",
  },
  {
    id: "claude-haiku-5-5", provider: "anthropic", key: "ANTHROPIC_API_KEY", name: "Claude Haiku 5.5",
    wait: "about 1.5 minutes a week", cost: "about $0.03 a week",
    good: "Fast and very cheap.",
    weak: "Weak continuity: it loses track of what earlier weeks set in motion.",
  },
  {
    id: "gpt-6-luna", provider: "openai", key: "OPENAI_API_KEY", name: "GPT-6 Luna",
    params: { reasoning_effort: "none" },
    wait: "about 2.5 minutes a week", cost: "about $0.01 a week",
    good: "The cheapest of all, and correct.",
    weak: "Terse, and calls too much \"major\".",
  },
  {
    id: "deepseek-v4-pro", provider: "openai-compatible", endpoint: "https://api.deepseek.com", key: "DEEPSEEK_API_KEY", name: "DeepSeek V4 Pro",
    wait: "about 10 minutes a week", cost: "about $0.10–0.15 a week",
    good: "Good events at a low price.",
    weak: "Slow.",
  },
  {
    id: "deepseek-flash", provider: "openai-compatible", endpoint: "https://api.deepseek.com", key: "DEEPSEEK_API_KEY", name: "DeepSeek Flash",
    wait: "about 4.5 minutes a week", cost: "about $0.03 a week",
    good: "Vivid writing, cheap.",
    weak: "Escalates: it called 9 of 10 events major.",
  },
  {
    id: "kimi-k2.6", provider: "openai-compatible", endpoint: "https://api.moonshot.ai/v1", key: "KIMI_API_KEY", name: "Kimi K2.6",
    params: { thinking: { type: "disabled" } },
    wait: "about 10 minutes a week (measured thinking; it plays without)", cost: "about $0.11–0.18 a week",
    good: "Rich writing.",
    weak: "Slow, and once lost the record of a war; your Kimi account takes one request at a time.",
  },
  {
    id: "gemini-3.8-flash", provider: "gemini", key: "GEMINI_API_KEY", name: "Gemini 3.8 Flash",
    wait: "not measured yet", cost: "free on a key without billing (Google's daily limits)",
    good: "Free to play on.",
    weak: "Not in the week-7 benchmark; the free tier's limits can stop a week. Gemini 4 Argon has no free quota.",
  },
];

export const DEFAULT_MODEL = "gpt-6.1-terra";

// Every provider a key reaches, as the game's Settings -> AI connects to it
// (a provider and its key), and where it lists its models. Besides the models
// above, the lead may pick any model a provider lists, by "<provider>:<model>"
// (e.g. "openai:gpt-6-luna-mini"): not tried in this game, it plays with the
// game's own retries (a model that refuses tools while reasoning is asked
// again without it).
export const PROVIDERS = [
  { id: "openai", provider: "openai", key: "OPENAI_API_KEY", label: "OpenAI", list: "https://api.openai.com/v1/models" },
  { id: "anthropic", provider: "anthropic", key: "ANTHROPIC_API_KEY", label: "Anthropic", list: "https://api.anthropic.com/v1/models?limit=1000" },
  { id: "gemini", provider: "gemini", key: "GEMINI_API_KEY", label: "Google Gemini", list: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000" },
  { id: "deepseek", provider: "openai-compatible", endpoint: "https://api.deepseek.com", key: "DEEPSEEK_API_KEY", label: "DeepSeek", list: "https://api.deepseek.com/models" },
  { id: "kimi", provider: "openai-compatible", endpoint: "https://api.moonshot.ai/v1", key: "KIMI_API_KEY", label: "Kimi (Moonshot)", list: "https://api.moonshot.ai/v1/models" },
];

const keyOf = (model, env) => String(env[model.key] ?? "").trim();

// The models whose key is set, in the list's order.
export const availableModels = (env = process.env) => MODELS.filter((model) => keyOf(model, env));

// The providers whose key is set.
export const availableProviders = (env = process.env) => PROVIDERS.filter((provider) => keyOf(provider, env));

// The providers whose key is not set, by name and the key they want (never a key).
export const unkeyedProviders = (env = process.env) => PROVIDERS.filter((provider) => !keyOf(provider, env)).map(({ label, key }) => ({ label, key }));

// A model a provider lists, by "<provider>:<model>", or null for none of
// them (or a provider with no key).
const listedModel = (id, env) => {
  const [, providerId = "", model = ""] = String(id ?? "").match(/^([a-z]+):(.+)$/) ?? [];
  const provider = availableProviders(env).find((entry) => entry.id === providerId);
  if (!provider || !model.trim()) return null;
  const curated = MODELS.find((entry) => entry.provider === provider.provider && entry.key === provider.key && entry.id === model.trim());
  if (curated) return curated;
  return { id: `${provider.id}:${model.trim()}`, model: model.trim(), provider: provider.provider, key: provider.key, endpoint: provider.endpoint ?? "", name: model.trim(), listed: true, providerLabel: provider.label };
};

// The model a table plays on: its own choice while that is still offered, else
// the default, else the first one offered.
export const modelFor = (id, env = process.env) => {
  const offered = availableModels(env);
  return offered.find((model) => model.id === id) ?? listedModel(id, env) ?? offered.find((model) => model.id === DEFAULT_MODEL) ?? offered[0] ?? null;
};

// Whether a model is one the lead may choose: one above, or one a provider
// whose key is set may list.
export const isOffered = (id, env = process.env) => availableModels(env).some((model) => model.id === id) || Boolean(listedModel(id, env));

// The game's AI settings (providerConfig.js ai_connections, ai_fallback_list)
// for one model: a connection for each provider whose key is set, and the
// model as the only entry of the list.
export const aiStorageFor = (id, env = process.env, customParams = "") => {
  const connections = availableProviders(env).map((provider) => ({
    id: `conn_${provider.provider}_${provider.key}`, provider: provider.provider, name: provider.provider, apiKey: keyOf(provider, env), endpoint: provider.endpoint ?? "", customParams,
  }));
  const model = modelFor(id, env);
  const entries = model ? [{ id: `entry_${model.id}`, connectionId: `conn_${model.provider}_${model.key}`, model: model.model ?? model.id, customParamsOverride: model.params ? JSON.stringify(model.params) : "", structuredMode: "auto" }] : [];
  return { ai_connections: connections, ai_fallback_list: entries };
};

// What a model a provider lists is not: a model for pictures, sound,
// embeddings or moderation (the game's own hints, AI/main.jsx NON_CHAT_MODEL_HINTS).
const NOT_CHAT = /embed|moderation|whisper|tts|transcribe|speech|audio|realtime|image|dall-e|davinci|babbage|rerank|search|computer-use|sora|veo|imagen|aqa/i;

const providerHeaders = (provider, key) => (provider.id === "anthropic"
  ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
  : provider.id === "gemini" ? { "x-goog-api-key": key } : { authorization: `Bearer ${key}` });

// One provider's chat models, newest first where it says when: [{ id, model, name }].
const fetchProviderModels = async (provider, env, fetchImpl) => {
  const response = await fetchImpl(provider.list, { headers: providerHeaders(provider, keyOf(provider, env)), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const rows = provider.id === "gemini"
    ? (data?.models ?? []).filter((m) => (m?.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m) => ({ model: String(m.name ?? "").replace(/^models\//, ""), name: String(m.displayName ?? ""), at: 0 }))
    : (data?.data ?? []).map((m) => ({ model: String(m?.id ?? ""), name: String(m?.display_name ?? ""), at: Number(m?.created) || Date.parse(m?.created_at ?? "") / 1000 || 0 }));
  // A dated snapshot ("gpt-5.4-2026-03-05") is left out where its own name is
  // listed too; it is still accepted by its id.
  const names = new Set(rows.map((row) => row.model));
  const snapshotOfListed = (model) => names.has(model.replace(/-(\d{4}-\d{2}-\d{2}|\d{8})$/, "")) && /-(\d{4}-\d{2}-\d{2}|\d{8})$/.test(model);
  const seen = new Set();
  return rows.filter((row) => row.model && !NOT_CHAT.test(row.model) && !snapshotOfListed(row.model) && !seen.has(row.model) && seen.add(row.model))
    .sort((a, b) => b.at - a.at || a.model.localeCompare(b.model))
    .map((row) => ({ id: `${provider.id}:${row.model}`, model: row.model, name: row.name && row.name !== row.model ? row.name : row.model, ...(WONT_PLAY.has(row.model) ? { wontPlay: true } : {}) }));
};

// Every chat model each provider with a key lists, asked of the providers
// themselves and kept for a few minutes: [{ id, label, models, error }]. The
// keys never leave this process.
const CATALOG_MS = 10 * 60 * 1000;
let catalog = null;
export const listAllModels = async ({ env = process.env, fetchImpl = fetch, fresh = false } = {}) => {
  if (!fresh && catalog && Date.now() - catalog.at < CATALOG_MS) return catalog.providers;
  const providers = await Promise.all(availableProviders(env).map(async (provider) => {
    try {
      return { id: provider.id, label: provider.label, models: await fetchProviderModels(provider, env, fetchImpl), error: "" };
    } catch (error) {
      return { id: provider.id, label: provider.label, models: [], error: `Its models could not be listed (${String(error?.message || error).slice(0, 120)}).` };
    }
  }));
  catalog = { at: Date.now(), providers };
  return providers;
};

// Models a provider lists that cannot play a week here (GPT-6.1 Sol cannot turn
// its reasoning off, and the game cannot reach it any other way).
export const WONT_PLAY = new Set(["gpt-6.1-sol"]);

// A model's name as players read it: a model above by its own, any other by its id.
export const modelName = (id, env = process.env) => {
  const model = MODELS.find((entry) => entry.id === id) ?? listedModel(id, env);
  return model ? (model.listed ? `${model.name} (${model.providerLabel})` : model.name) : String(id ?? "");
};
