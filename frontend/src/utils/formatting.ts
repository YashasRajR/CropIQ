export function formatNumber(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// The dataset's yield unit was never confirmed by the data source (see Phase 1
// data quality report), so the backend sends the literal string "unconfirmed"
// as a placeholder. Showing that word next to a number reads as a bug to
// farmers, so we just omit the unit rather than print it.
export function displayUnit(unit?: string): string {
  return !unit || unit === 'unconfirmed' ? '' : unit;
}

export function formatYield(val: number | undefined | null, unit = 'unconfirmed'): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const u = displayUnit(unit);
  return u ? `${formatNumber(val, 2)} ${u}` : formatNumber(val, 2);
}

export function formatDiff(diff: number | undefined | null, unit = 'unconfirmed'): string {
  if (diff === undefined || diff === null || isNaN(diff)) return '—';
  const prefix = diff > 0 ? '+' : '';
  const u = displayUnit(unit);
  return u ? `${prefix}${formatNumber(diff, 2)} ${u}` : `${prefix}${formatNumber(diff, 2)}`;
}

export function formatPercentage(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${formatNumber(val, 1)}%`;
}

export function getRiskColor(level?: string): {
  badge: string;
  text: string;
  bg: string;
  border: string;
  glow: string;
} {
  switch (level?.toUpperCase()) {
    case 'LOW':
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/20',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-900/30',
      };
    case 'MODERATE':
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        text: 'text-amber-400',
        bg: 'bg-amber-950/20',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-900/30',
      };
    case 'HIGH':
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        text: 'text-rose-400',
        bg: 'bg-rose-950/20',
        border: 'border-rose-500/30',
        glow: 'shadow-rose-900/30',
      };
    default:
      return {
        badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        text: 'text-slate-400',
        bg: 'bg-slate-900/40',
        border: 'border-slate-700/50',
        glow: 'shadow-slate-900/20',
      };
  }
}

export function getPriorityBadge(priority?: string): string {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    case 'MEDIUM':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    case 'LOW':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/40';
  }
}

export function getCategoryBadge(category?: string): string {
  switch (category?.toUpperCase()) {
    case 'WATER':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    case 'SOIL':
      return 'bg-amber-600/15 text-amber-200 border-amber-600/30';
    case 'WEATHER':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'CANOPY':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'MONITORING':
      return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
    case 'CROP':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}
