import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptStrategy, BloomLevel } from '@prisma/client';
import { config } from '../config';
import { buildZeroShotPrompt } from '../prompts/zeroShot';
import { buildFewShotPrompt } from '../prompts/fewShot';
import { buildBloomBasedPrompt } from '../prompts/bloomBased';
import { getCached, setCached, hashCacheKey } from './cacheService';

export interface GeneratedCard {
  question: string;
  answer: string;
  bloomLevel?: BloomLevel;
}

const BLOOM_MAP: Record<string, BloomLevel> = {
  REMEMBERING: BloomLevel.REMEMBERING,
  UNDERSTANDING: BloomLevel.UNDERSTANDING,
  APPLYING: BloomLevel.APPLYING,
  ANALYZING: BloomLevel.ANALYZING,
};

function buildPrompt(sourceText: string, strategy: PromptStrategy, numQuestions: number): string {
  switch (strategy) {
    case PromptStrategy.ZERO_SHOT:
      return buildZeroShotPrompt(sourceText, numQuestions);
    case PromptStrategy.FEW_SHOT:
      return buildFewShotPrompt(sourceText, numQuestions);
    case PromptStrategy.BLOOM_BASED:
      return buildBloomBasedPrompt(sourceText, numQuestions);
    default:
      throw new Error(`Unknown prompt strategy: ${strategy}`);
  }
}

/**
 * Parses lines like:
 *   1. Question? | Answer
 *   1. [REMEMBERING] Question? | Answer
 */
export function parseFlashcardResponse(raw: string): GeneratedCard[] {
  const cards: GeneratedCard[] = [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(
      /^\d+\.\s*(?:\[([A-Z_]+)\]\s*)?(.+?)\s*\|\s*(.+)$/
    );
    if (!match) continue;

    const levelRaw = match[1];
    const question = match[2].trim();
    const answer = match[3].trim();
    if (!question || !answer) continue;

    const bloomLevel = levelRaw ? BLOOM_MAP[levelRaw.toUpperCase()] : undefined;
    cards.push({ question, answer, bloomLevel });
  }

  return cards;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyGeminiError(message: string): 'rate' | 'unavailable' | 'not_found' | 'other' {
  if (/\b429\b/.test(message) || /quota|resource.?exhausted|rate.?limit|too many requests/i.test(message)) {
    return 'rate';
  }
  if (/\b503\b/.test(message) || /high demand|unavailable|try again later/i.test(message)) {
    return 'unavailable';
  }
  if (/\b404\b/.test(message) || /no longer available|not found/i.test(message)) {
    return 'not_found';
  }
  return 'other';
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`[503] Timeout after ${ms}ms waiting for ${label} (high demand / slow)`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function callGeminiOnce(prompt: string, modelName: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const timeoutMs = modelName.includes('lite') ? 20_000 : 35_000;
  const result = await withTimeout(model.generateContent(prompt), timeoutMs, modelName);
  const text = result.response.text();
  if (!text?.trim()) {
    throw new Error('Empty response from Gemini');
  }
  return text;
}

async function callGemini(prompt: string): Promise<string> {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const models = config.geminiModels.length > 0 ? config.geminiModels : ['gemini-3.8-flash'];
  const errors: string[] = [];

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[gemini] model=${modelName} attempt=${attempt}`);
        return await callGeminiOnce(prompt, modelName);
      } catch (err) {
        const message = (err as Error).message ?? String(err);
        console.error(`[gemini] ${modelName} attempt ${attempt}:`, message);
        const kind = classifyGeminiError(message);
        errors.push(`${modelName}#${attempt}: ${message}`);

        if (kind === 'rate') {
          throw new Error(
            `Gemini rate/quota limit hit. Wait a minute and retry. Details: ${message}`
          );
        }

        if (kind === 'unavailable' && attempt < 3) {
          const waitMs = attempt * 2000;
          console.log(`[gemini] 503 high demand — waiting ${waitMs}ms before retry`);
          await sleep(waitMs);
          continue;
        }
        break;
      }
    }
  }

  throw new Error(
    `Gemini request failed after trying models [${models.join(', ')}]. Last errors: ${errors.slice(-3).join(' | ')}`
  );
}

export async function generateFlashcards(
  sourceText: string,
  strategy: PromptStrategy,
  numQuestions: number = 10
): Promise<GeneratedCard[]> {
  if (!sourceText.trim()) {
    throw new Error('Source text is empty');
  }

  const cacheKey = hashCacheKey(sourceText, `${strategy}:${numQuestions}`);
  const cached = await getCached<GeneratedCard[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const prompt = buildPrompt(sourceText, strategy, numQuestions);
  const raw = await callGemini(prompt);
  const cards = parseFlashcardResponse(raw);

  if (cards.length === 0) {
    throw new Error('Failed to parse flashcards from LLM response. Try again.');
  }

  await setCached(cacheKey, cards);
  return cards;
}
