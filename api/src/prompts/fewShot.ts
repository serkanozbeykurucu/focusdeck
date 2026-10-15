export const FEW_SHOT_EXAMPLES = `Examples of the expected format:
1. What is the main purpose of a summary? | To condense key points of a longer text into a shorter form.
2. How does practice improve skill? | Repeated deliberate practice strengthens memory and performance.
3. Why is feedback useful when learning? | Feedback highlights errors so the learner can correct them.`;

export const FEW_SHOT_TEMPLATE = `You are a study assistant. Read the text below and generate {numQuestions} study questions based on it. Return the questions as a numbered list from 1 to {numQuestions}, with no extra text. Format each line as 'N. Question? | Answer'.

${FEW_SHOT_EXAMPLES}

TEXT: {sourceText}`;

export function buildFewShotPrompt(sourceText: string, numQuestions: number = 10): string {
  return FEW_SHOT_TEMPLATE
    .replace(/\{numQuestions\}/g, String(numQuestions))
    .replace('{sourceText}', sourceText);
}
