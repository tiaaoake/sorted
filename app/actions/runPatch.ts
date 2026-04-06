"use server";

import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { comparisonRunSchema } from "@/lib/types/comparison";
import { getRunDir } from "@/lib/storage/paths";

const MAX_APPEND_LEN = 4000;

const runIdSchema = z.string().uuid("Invalid run id");

export type SaveUserPromptAppendResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveUserPromptAppend(
  runId: string,
  text: string,
): Promise<SaveUserPromptAppendResult> {
  const idParsed = runIdSchema.safeParse(runId);
  if (!idParsed.success) {
    return { ok: false, error: "Invalid run id" };
  }
  if (text.length > MAX_APPEND_LEN) {
    return {
      ok: false,
      error: `Custom instructions must be at most ${MAX_APPEND_LEN} characters`,
    };
  }

  const file = path.join(getRunDir(runId), "comparison.json");
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch {
    return { ok: false, error: "Run not found" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid comparison data" };
  }

  const run = comparisonRunSchema.safeParse(parsed);
  if (!run.success) {
    return { ok: false, error: "Could not read comparison run" };
  }

  const next = { ...run.data, userPromptAppend: text };
  await fs.writeFile(file, JSON.stringify(next, null, 2), "utf-8");
  return { ok: true };
}
