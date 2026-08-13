/**
 * Command Code provider for pi.
 *
 * Uses the official Command Code Provider API:
 *   https://api.commandcode.ai/provider/v1
 *
 * Authentication (pick one):
 *   1. Run `/login`, then choose browser login or paste a Command Code API key
 *   2. Set COMMANDCODE_API_KEY environment variable
 *   3. Place API key in `~/.commandcode/auth.json` or `~/.pi/agent/auth.json`
 *      as {"apiKey": "user_..."} or {"commandcode": "user_..."}
 *
 * Models are fetched from Command Code's Provider API at startup.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"

import { getConfiguredApiKey } from "./src/api-key.ts"
import {
  DEFAULT_MODELS_URL,
  DEFAULT_PROVIDER_API_BASE,
  baseUrlForModel,
  fetchCommandCodeModels,
} from "./src/models.ts"
import { getApiKey, login, refreshToken } from "./src/oauth.ts"
import { MODEL_COSTS, ZERO_MODEL_COST } from "./src/pricing.ts"

const API_BASE = process.env.COMMANDCODE_API_BASE ?? DEFAULT_PROVIDER_API_BASE
const MODELS_URL = process.env.COMMANDCODE_MODELS_URL ?? DEFAULT_MODELS_URL
const API_KEY_CONFIG = getConfiguredApiKey() ?? "$COMMANDCODE_API_KEY"
const SUPPORTED_INPUTS: ("text" | "image")[] = ["text", "image"]

// Zero data retention is ON by default. Set COMMANDCODE_ZDR=0 to start with it
// disabled, or flip it at runtime with /commandcode-zdr.
let zdrEnabled = process.env.COMMANDCODE_ZDR !== "0"

function commandCodeHeaders(): Record<string, string> | undefined {
  return zdrEnabled ? { "x-cmd-zdr": "1" } : undefined
}

// ---------------------------------------------------------------------------
// Extension entry point
// ---------------------------------------------------------------------------

export default async function (pi: ExtensionAPI) {
  const models = await fetchCommandCodeModels({ url: MODELS_URL })

  const registerProvider = () => {
    const headers = commandCodeHeaders()
    pi.registerProvider("commandcode", {
      name: "Command Code",
      baseUrl: API_BASE,
      apiKey: API_KEY_CONFIG,
      api: "openai-completions",
      headers,
      oauth: {
        name: "Command Code",
        login,
        refreshToken,
        getApiKey,
      },
      models: models.map((model) => ({
        id: model.id,
        name: model.name,
        api: model.api,
        baseUrl: baseUrlForModel(API_BASE, model.api),
        reasoning: model.reasoning,
        input: SUPPORTED_INPUTS,
        cost: MODEL_COSTS[model.id] ?? ZERO_MODEL_COST,
        contextWindow: model.contextWindow,
        maxTokens: model.maxTokens,
        headers,
        compat:
          model.api === "openai-completions"
            ? {
                supportsStore: false,
                supportsDeveloperRole: false,
                maxTokensField: "max_tokens",
              }
            : undefined,
      })),
    })
  }

  registerProvider()

  pi.registerCommand("commandcode-zdr", {
    description: "Toggle zero data retention mode for Command Code",
    handler: (_args, ctx) => {
      zdrEnabled = !zdrEnabled
      registerProvider()
      ctx.ui.notify(
        `Command Code zero data retention: ${zdrEnabled ? "ON" : "OFF"} (x-cmd-zdr: ${zdrEnabled ? "1" : "unset"})`,
        "info",
      )
    },
  })

  pi.on("message_end", (event, ctx) => {
    if (event.message.role !== "assistant") return
    const errorMessage = "errorMessage" in event.message ? event.message.errorMessage : undefined
    if (!errorMessage) return
    if (!/zero.data.retention|cmd_zdr_no_providers|cmd-zdr-no-providers/i.test(errorMessage)) return
    ctx.ui.notify(
      `This Command Code model has no zero-data-retention upstream. Run /commandcode-zdr to disable ZDR for it.`,
      "warning",
    )
  })
}
