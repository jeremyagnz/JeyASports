import { inningsPitched } from '../../core/domain/stats-calculator';

/** Box-score style rate: `.325` instead of `0.325`. */
export function formatAvg(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return value >= 1 ? value.toFixed(3) : value.toFixed(3).replace(/^0/, '');
}

export function formatRate2(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return '-';
  }
  return value.toFixed(2);
}

export function formatInnings(outs: number | null | undefined): string {
  return outs === null || outs === undefined ? '-' : inningsPitched(outs).toFixed(1);
}
