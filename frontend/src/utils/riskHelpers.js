export const RISK_LEVELS = {
  Safe: {
    label: "Safe",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badgeBg: "bg-emerald-500",
    badgeText: "text-emerald-950",
    dot: "bg-emerald-400",
    hex: "#10b981",
    description: "Geotechnical conditions nominal. Normal slope stability."
  },
  Watch: {
    label: "Watch",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badgeBg: "bg-amber-500",
    badgeText: "text-amber-950",
    dot: "bg-amber-400",
    hex: "#f59e0b",
    description: "Precipitation accumulating. Elevated pore pressure. Monitoring closely."
  },
  Warning: {
    label: "Warning",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    badgeBg: "bg-orange-500",
    badgeText: "text-orange-950",
    dot: "bg-orange-400",
    hex: "#f97316",
    description: "High saturation and shear stress. Actionable hazards identified."
  },
  Critical: {
    label: "Critical",
    bg: "bg-red-500/15",
    border: "border-red-500/50",
    text: "text-red-400",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    dot: "bg-red-500",
    hex: "#ef4444",
    description: "Imminent slope failure detected. Emergency evacuation protocol active."
  }
};

export function getRiskConfig(level) {
  return RISK_LEVELS[level] || RISK_LEVELS.Safe;
}

export function getRiskScoreColor(score) {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 35) return "#f59e0b";
  return "#10b981";
}

export function formatTimestamp(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}

export function formatDateTime(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return isoStr;
  }
}
