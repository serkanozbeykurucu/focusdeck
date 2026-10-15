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

async function callGemini(prompt: string): Promise<string> {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text?.trim()) {
      throw new Error('Empty response from Gemini');
    }
    return text;
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    if (message.includes('429') || message.toLowerCase().includes('rate')) {
      throw new Error('Gemini rate limit exceeded. Please try again shortly.');
    }
    throw new Error(`Gemini request failed: ${message}`);
  }
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
