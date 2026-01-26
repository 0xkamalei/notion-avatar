import { AIGenerationMode } from '@/types/ai';

export interface PricingConfig {
  siteFreeDailyLimit: number;
  creditUsdValue: number;
  profitMultiplier: number;
  inputUsdPer1MTokens: number;
  outputUsdPer1MTokens: number;
  minCreditsPerGeneration: number;
  outputTokensEstimate: number;
}

function clampNumber(value: number, fallback: number) {
  if (Number.isFinite(value)) return value;
  return fallback;
}

export function getPricingConfig(): PricingConfig {
  const siteFreeDailyLimit = clampNumber(
    Number.parseInt(process.env.SITE_FREE_DAILY_LIMIT || '10', 10),
    10,
  );
  const creditUsdValue = clampNumber(
    Number.parseFloat(process.env.CREDIT_USD_VALUE || '0.05'),
    0.05,
  );
  const profitMultiplier = clampNumber(
    Number.parseFloat(process.env.PROFIT_MULTIPLIER || '3'),
    3,
  );
  const inputUsdPer1MTokens = clampNumber(
    Number.parseFloat(process.env.GEMINI_INPUT_USD_PER_1M || '0.35'),
    0.35,
  );
  const outputUsdPer1MTokens = clampNumber(
    Number.parseFloat(process.env.GEMINI_OUTPUT_USD_PER_1M || '0.7'),
    0.7,
  );
  const minCreditsPerGeneration = clampNumber(
    Number.parseInt(process.env.MIN_CREDITS_PER_GENERATION || '1', 10),
    1,
  );
  const outputTokensEstimate = clampNumber(
    Number.parseInt(process.env.AI_OUTPUT_TOKENS_ESTIMATE || '2000', 10),
    2000,
  );

  return {
    siteFreeDailyLimit,
    creditUsdValue,
    profitMultiplier,
    inputUsdPer1MTokens,
    outputUsdPer1MTokens,
    minCreditsPerGeneration,
    outputTokensEstimate,
  };
}

function estimateTokensFromText(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateBytesFromBase64DataUrl(dataUrl: string) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Math.floor((base64.length * 3) / 4);
}

export function estimateGenerationUsage(mode: AIGenerationMode, input: string) {
  const config = getPricingConfig();

  const basePromptTokens = mode === 'text2avatar' ? 700 : 850;

  const inputTokens =
    mode === 'text2avatar' ? estimateTokensFromText(input) : 0;

  const imageTokens =
    mode === 'photo2avatar'
      ? Math.ceil(estimateBytesFromBase64DataUrl(input) / 1024) * 8
      : 0;

  const promptTokens = basePromptTokens + inputTokens + imageTokens;
  const outputTokens = config.outputTokensEstimate;

  const inputCostUsd = (promptTokens / 1_000_000) * config.inputUsdPer1MTokens;
  const outputCostUsd =
    (outputTokens / 1_000_000) * config.outputUsdPer1MTokens;
  const totalCostUsd = inputCostUsd + outputCostUsd;

  const requiredCredits = Math.max(
    config.minCreditsPerGeneration,
    Math.ceil((totalCostUsd * config.profitMultiplier) / config.creditUsdValue),
  );

  return {
    estimatedTokens: promptTokens + outputTokens,
    requiredCredits,
  };
}
