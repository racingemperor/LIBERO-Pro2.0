// Preserve paper summaries and apply separately dated evaluation updates.
export const baseScore = model => model.baseEvaluation?.rate ?? model.reportedScores?.base ?? model.scores.base;
export const summaryScore = (model, mode) => model.reportedScores?.[mode] ?? model.scores[mode];
export function deltaScore(model, mode) {
  // Perturbation rates have not yet been rerun under this updated BASE protocol.
  if (model.baseEvaluation) return null;
  const reported = model.reportedScores?.[mode]?.delta;
  if (Number.isFinite(reported)) return reported;
  const average = mode === 'overall' ? model.scores.overall : summaryScore(model, mode).average;
  const base = baseScore(model);
  return Number.isFinite(average) && Number.isFinite(base) ? average - base : null;
}
