import {
  BattingRates, BattingStatLine, FieldingRates, FieldingStatLine, PitchingRates, PitchingStatLine,
} from '../../data/models';

/** Softball regulation length; used to scale ERA and per-game rate stats. */
export const DEFAULT_REGULATION_INNINGS = 7;

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export function plateAppearances(line: BattingStatLine): number {
  return line.ab + line.bb + line.hbp + line.sf + line.sac;
}

export function totalBases(line: BattingStatLine): number {
  const singles = line.h - line.doubles - line.triples - line.hr;
  return singles + line.doubles * 2 + line.triples * 3 + line.hr * 4;
}

export function battingRates(line: BattingStatLine): BattingRates {
  const pa = plateAppearances(line);
  const tb = totalBases(line);
  const avg = ratio(line.h, line.ab);
  const obp = ratio(line.h + line.bb + line.hbp, line.ab + line.bb + line.hbp + line.sf);
  const slg = ratio(tb, line.ab);
  return {
    pa,
    tb,
    avg,
    obp,
    slg,
    ops: obp + slg,
    iso: slg - avg,
    babip: ratio(line.h - line.hr, line.ab - line.so - line.hr + line.sf),
  };
}

/** Innings pitched expressed in the conventional `x.y` notation (y = thirds). */
export function inningsPitched(outs: number): number {
  return Math.floor(outs / 3) + (outs % 3) / 10;
}

export function pitchingRates(
  line: PitchingStatLine,
  regulationInnings = DEFAULT_REGULATION_INNINGS,
): PitchingRates {
  const innings = line.outs / 3;
  const atBatsAgainst = Math.max(0, line.bf - line.bb);
  return {
    ip: inningsPitched(line.outs),
    era: ratio(line.er * regulationInnings, innings),
    whip: ratio(line.bb + line.h, innings),
    kPer7: ratio(line.so * regulationInnings, innings),
    bbPer7: ratio(line.bb * regulationInnings, innings),
    opponentAvg: ratio(line.h, atBatsAgainst),
  };
}

export function fieldingRates(line: FieldingStatLine): FieldingRates {
  const chances = line.po + line.a + line.e;
  return {
    chances,
    fieldingPct: ratio(line.po + line.a, chances),
    inningsPlayed: inningsPitched(line.outsPlayed),
  };
}
