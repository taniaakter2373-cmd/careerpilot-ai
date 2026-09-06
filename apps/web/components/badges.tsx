export function scoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  if (score >= 80) return "bg-teal-50 text-teal-700 ring-teal-600/10";
  if (score >= 70) return "bg-amber-50 text-amber-700 ring-amber-600/10";
  if (score >= 60) return "bg-orange-50 text-orange-700 ring-orange-600/10";
  return "bg-red-50 text-red-700 ring-red-600/10";
}

export function recommendationLabel(recommendation: string): string {
  switch (recommendation) {
    case "EXCELLENT_MATCH":
      return "Excellent Match";
    case "STRONG_MATCH":
      return "Strong Match";
    case "GOOD_MATCH":
      return "Good Match";
    case "POSSIBLE_MATCH":
      return "Possible Match";
    case "MODERATE_MATCH":
      return "Moderate Match";
    case "LOW_MATCH":
      return "Low Match";
    case "LOW_PRIORITY":
      return "Low Priority";
    default:
      return "Not Recommended";
  }
}

export function recommendationColor(recommendation: string): string {
  switch (recommendation) {
    case "EXCELLENT_MATCH":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    case "STRONG_MATCH":
      return "bg-teal-50 text-teal-700 ring-teal-600/10";
    case "GOOD_MATCH":
      return "bg-blue-50 text-blue-700 ring-blue-600/10";
    case "POSSIBLE_MATCH":
      return "bg-amber-50 text-amber-700 ring-amber-600/10";
    case "MODERATE_MATCH":
      return "bg-amber-50 text-amber-700 ring-amber-600/10";
    case "LOW_MATCH":
      return "bg-orange-50 text-orange-700 ring-orange-600/10";
    case "LOW_PRIORITY":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-red-50 text-red-700 ring-red-600/10";
  }
}

export function MatchBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${scoreColor(score)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score}%
    </span>
  );
}

export function RecommendationBadge({ recommendation }: { recommendation: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${recommendationColor(recommendation)}`}>
      {recommendationLabel(recommendation)}
    </span>
  );
}
