export const getScoreColor = (score: number) => {
  if (score <= 20) return "text-green-600 bg-green-100";
  if (score <= 40) return "text-yellow-600 bg-yellow-100";
  if (score <= 60) return "text-orange-600 bg-orange-100";
  return "text-red-600 bg-red-100";
};
export const getSeverityColor = (severity: "low" | "medium" | "high") => {
  switch (severity) {
    case "low":
      return "text-green-600 bg-green-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "high":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export const getRiskLevelColor = (riskLevel: "low" | "medium" | "high") => {
  switch (riskLevel) {
    case "low":
      return "text-green-600 bg-green-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "high":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};
