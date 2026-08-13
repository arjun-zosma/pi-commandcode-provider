import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { MODEL_COSTS } from "../src/pricing.ts"

const CURRENT_PROVIDER_MODELS = [
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-fable-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-haiku-4-5-20251001",
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.3-codex",
  "gpt-5.4-mini",
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4-flash",
  "moonshotai/Kimi-K2.7-Code",
  "moonshotai/Kimi-K2.7-Code-Highspeed",
  "moonshotai/Kimi-K2.6",
  "moonshotai/Kimi-K2.5",
  "zai-org/GLM-5.2",
  "zai-org/GLM-5.2-Fast",
  "zai-org/GLM-5.1",
  "zai-org/GLM-5",
  "MiniMaxAI/MiniMax-M3",
  "MiniMaxAI/MiniMax-M2.7",
  "MiniMaxAI/MiniMax-M2.5",
  "xiaomi/mimo-v2.5-pro",
  "xiaomi/mimo-v2.5",
  "Qwen/Qwen3.6-Max-Preview",
  "Qwen/Qwen3.6-Plus",
  "Qwen/Qwen3.7-Max",
  "Qwen/Qwen3.7-Plus",
  "stepfun/Step-3.7-Flash",
  "stepfun/Step-3.5-Flash",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-flash-lite",
  "sakana/fugu-ultra",
  "nvidia/nemotron-3-ultra-550b-a55b",
]

describe("MODEL_COSTS pricing overlay", () => {
  it("covers the validated Provider API model catalog with non-zero display pricing", () => {
    for (const id of CURRENT_PROVIDER_MODELS) {
      const cost = MODEL_COSTS[id]
      assert.ok(cost, `MODEL_COSTS should include "${id}"`)
      assert.ok(cost.input > 0, `"${id}" input cost should be > 0`)
      assert.ok(cost.output > 0, `"${id}" output cost should be > 0`)
    }
  })

  it("includes known promotional pricing", () => {
    assert.deepEqual(MODEL_COSTS["deepseek/deepseek-v4-pro"], {
      input: 0.435,
      output: 0.87,
      cacheRead: 0.003625,
      cacheWrite: 0,
    })
    assert.deepEqual(MODEL_COSTS["MiniMaxAI/MiniMax-M3"], {
      input: 0.3,
      output: 1.2,
      cacheRead: 0.06,
      cacheWrite: 0,
    })
    assert.deepEqual(MODEL_COSTS["xiaomi/mimo-v2.5"], {
      input: 0.14,
      output: 0.28,
      cacheRead: 0.0028,
      cacheWrite: 0,
    })
  })

  it("has cache pricing for Claude models", () => {
    const claudeModels = ["claude-sonnet-5", "claude-sonnet-4-6", "claude-opus-4-8"]

    for (const id of claudeModels) {
      const cost = MODEL_COSTS[id]
      assert.ok(cost, `MODEL_COSTS should include "${id}"`)
      assert.ok(cost.cacheRead > 0, `"${id}" cacheRead should be > 0`)
      assert.ok(cost.cacheWrite > 0, `"${id}" cacheWrite should be > 0`)
    }
  })
})
