import { describe, expect, it } from 'vitest';
import { BattingStatLine, FieldingStatLine, PitchingStatLine } from '../../data/models';
import {
  battingRates, fieldingRates, inningsPitched, pitchingRates, plateAppearances, totalBases,
} from './stats-calculator';

const batting: BattingStatLine = {
  id: 'b1',
  teamId: 'team-a',
  seasonId: 'season-1',
  gameId: null,
  playerId: 'p1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  gp: 10,
  ab: 40,
  r: 8,
  h: 14,
  doubles: 3,
  triples: 1,
  hr: 2,
  rbi: 11,
  bb: 6,
  so: 7,
  hbp: 1,
  sf: 2,
  sac: 1,
  sb: 3,
  cs: 1,
};

const pitching: PitchingStatLine = {
  id: 'p1',
  teamId: 'team-a',
  seasonId: 'season-1',
  gameId: null,
  playerId: 'p1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  g: 5,
  gs: 4,
  outs: 63,
  h: 20,
  r: 12,
  er: 9,
  bb: 5,
  so: 18,
  hr: 1,
  bf: 95,
  w: 3,
  l: 1,
  sv: 0,
};

const fielding: FieldingStatLine = {
  id: 'f1',
  teamId: 'team-a',
  seasonId: 'season-1',
  gameId: null,
  playerId: 'p1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  position: 'SS',
  g: 10,
  outsPlayed: 180,
  po: 15,
  a: 30,
  e: 5,
  dp: 2,
};

describe('stats calculator', () => {
  it('counts plate appearances without sacrifices being at bats', () => {
    expect(plateAppearances(batting)).toBe(50);
  });

  it('computes total bases from the hit breakdown', () => {
    // 8 singles + 3 doubles + 1 triple + 2 home runs
    expect(totalBases(batting)).toBe(8 + 6 + 3 + 8);
  });

  it('derives batting rate stats', () => {
    const rates = battingRates(batting);
    expect(rates.avg).toBeCloseTo(0.35, 5);
    expect(rates.obp).toBeCloseTo(21 / 49, 5);
    expect(rates.slg).toBeCloseTo(25 / 40, 5);
    expect(rates.ops).toBeCloseTo(rates.obp + rates.slg, 10);
    expect(rates.iso).toBeCloseTo(rates.slg - rates.avg, 10);
  });

  it('returns zero instead of dividing by zero', () => {
    const empty = { ...batting, ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, sac: 0 };
    const rates = battingRates(empty);
    expect(rates.avg).toBe(0);
    expect(rates.obp).toBe(0);
    expect(rates.slg).toBe(0);
  });

  it('expresses innings pitched in thirds', () => {
    expect(inningsPitched(0)).toBe(0);
    expect(inningsPitched(1)).toBeCloseTo(0.1, 5);
    expect(inningsPitched(2)).toBeCloseTo(0.2, 5);
    expect(inningsPitched(3)).toBe(1);
    expect(inningsPitched(20)).toBeCloseTo(6.2, 5);
  });

  it('scales ERA to the softball regulation length', () => {
    const rates = pitchingRates(pitching);
    expect(rates.ip).toBeCloseTo(21, 5);
    expect(rates.era).toBeCloseTo(3, 5);
    expect(rates.whip).toBeCloseTo(25 / 21, 5);
    expect(pitchingRates(pitching, 9).era).toBeCloseTo(9 * 9 / 21, 5);
  });

  it('computes fielding percentage over total chances', () => {
    const rates = fieldingRates(fielding);
    expect(rates.chances).toBe(50);
    expect(rates.fieldingPct).toBeCloseTo(0.9, 5);
    expect(rates.inningsPlayed).toBe(60);
  });
});
