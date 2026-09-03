export function scoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-100 text-emerald-700";
  if (score >= 80) return "bg-teal-100 text-teal-700";
  if (score >= 70) return "bg-amber-100 text-amber-700";
  if (score >= 60) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
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
      return "bg-emerald-100 text-emerald-700";
    case "STRONG_MATCH":
      return "bg-teal-100 text-teal-700";
    case "GOOD_MATCH":
      return "bg-blue-100 text-blue-700";
    case "POSSIBLE_MATCH":
      return "bg-amber-100 text-amber-700";
    case "MODERATE_MATCH":
      return "bg-amber-100 text-amber-700";
    case "LOW_MATCH":
      return "bg-orange-100 text-orange-700";
    case "LOW_PRIORITY":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-red-100 text-red-700";
  }
}

export function MatchBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColor(score)}`}>
      {score}%
    </span>
  );
}

export function RecommendationBadge({ recommendation }: { recommendation: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${recommendationColor(recommendation)}`}>
      {recommendationLabel(recommendation)}
    </span>
  );
}
