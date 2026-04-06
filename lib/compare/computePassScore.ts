import type { Findings } from "@/lib/types/comparison";

const GOAL_PERCENT = 95;

/** Lines that mean “no issue” from our heuristics — do not penalize. */
function isNeutralLine(s: string): boolean {
  return /broadly similar|No major automated|No strong automated|similar between versions/i.test(
    s,
  );
}

function countIssueLines(lines: string[]): number {
  return lines.filter((s) => s.trim().length > 0 && !isNeutralLine(s)).length;
}

export type PassScoreResult = {
  score: number;
  goalPercent: typeof GOAL_PERCENT;
  meetsGoal: boolean;
  issueLineCount: number;
  improvedLineCount: number;
};

/**
 * Heuristic 0–100 score from findings (not ground truth).
 * More non-neutral issue bullets lower the score; “improved” adds a small bonus.
 */
export function computePassScore(findings: Findings): PassScoreResult {
  const issueLineCount =
    countIssueLines(findings.visual) +
    countIssueLines(findings.text) +
    countIssueLines(findings.structural) +
    countIssueLines(findings.missing);

  const improvedLineCount = findings.improved.filter(
    (s) => s.trim().length > 0,
  ).length;

  const penaltyPerLine = 3.2;
  const maxDeduction = 72;
  const rawPenalty = issueLineCount * penaltyPerLine;
  const deduction = Math.min(rawPenalty, maxDeduction);

  const bonusPerImproved = 1.8;
  const maxBonus = 14;
  const bonus = Math.min(improvedLineCount * bonusPerImproved, maxBonus);

  const score = Math.round(
    Math.min(100, Math.max(0, 100 - deduction + bonus)),
  );

  return {
    score,
    goalPercent: GOAL_PERCENT,
    meetsGoal: score >= GOAL_PERCENT,
    issueLineCount,
    improvedLineCount,
  };
}
