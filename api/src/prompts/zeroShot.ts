export const ZERO_SHOT_TEMPLATE = `You are a study assistant. Read the text below and generate {numQuestions} study questions based on it. Return the questions as a numbered list from 1 to {numQuestions}, with no extra text. Format each line as 'N. Question? | Answer'. TEXT: {sourceText}`;

export function buildZeroShotPrompt(sourceText: string, numQuestions: number = 10): string {
  return ZERO_SHOT_TEMPLATE
    .replace(/\{numQuestions\}/g, String(numQuestions))
    .replace('{sourceText}', sourceText);
}
