import type { Findings, PageData } from "@/lib/types/comparison";
import { buildLlmUserBrief } from "./buildPrompt";
import { templatePrompt } from "./promptTemplates";

export type PromptService = {
  generate(
    findings: Findings,
    current: PageData,
    next: PageData,
  ): Promise<string>;
};

const SYSTEM = `You write concise update prompts for a website generator tool.
Output a single short paragraph (3-6 sentences). No markdown, no bullet list.
Goals: preserve what matters from the original (brand, nav including dropdowns/submenus if present, imagery, trust, local/service specificity, sliders if any).
For colour: when the user lists sampled hex (or similar) values, treat those as exact anchors; tell the builder to align the rest of the palette (neutrals, borders, hovers, gradients) with the original URL provided, not guesses.
If the header chrome pattern flips (dark bar vs light bar), call out keeping strong text/CTA contrast (aim for WCAG-like legibility) and matching the original intent unless rebranding.
Restore missing important elements. Keep genuine improvements from the new version (spacing, clarity).
Be actionable and specific using the evidence provided.`;

async function callOpenAI(userContent: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty OpenAI response");
  return text;
}

export function createPromptService(): PromptService {
  return {
    async generate(findings, current, next) {
      const brief = buildLlmUserBrief(findings, current, next);
      if (process.env.OPENAI_API_KEY) {
        try {
          return await callOpenAI(brief);
        } catch {
          return templatePrompt(findings, current);
        }
      }
      return templatePrompt(findings, current);
    },
  };
}
