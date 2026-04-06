/** Inserted between generated prompt and reviewer custom instructions when copying. */
export const USER_APPEND_DELIMITER = "\n\nAdditional instructions:\n";

export function buildCombinedPrompt(
  generatedPrompt: string,
  userAppend: string,
): string {
  const gen = generatedPrompt.trimEnd();
  const extra = userAppend.trim();
  if (!extra) return gen;
  return `${gen}${USER_APPEND_DELIMITER}${extra}`;
}
