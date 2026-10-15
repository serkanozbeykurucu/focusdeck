export const BLOOM_BASED_TEMPLATE = `You are a study assistant. Read the text below and generate {numQuestions} study questions distributed across four cognitive levels from Bloom's taxonomy: 3 at REMEMBERING, 3 at UNDERSTANDING, 2 at APPLYING, 2 at ANALYZING. Label each question with its level in brackets. Format: 'N. [LEVEL] Question? | Answer'. TEXT: {sourceText}`;

export function buildBloomBasedPrompt(sourceText: string, numQuestions: number = 10): string {
  return BLOOM_BASED_TEMPLATE
    .replace(/\{numQuestions\}/g, String(numQuestions))
    .replace('{sourceText}', sourceText);
}
