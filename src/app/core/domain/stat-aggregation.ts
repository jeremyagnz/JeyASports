import { BattingStatLine, FieldingStatLine, PitchingStatLine } from '../../data/models';

const EPOCH = '1970-01-01T00:00:00.000Z';

/**
 * Season totals are always derived from per-game lines, never stored. In
 * Phase 2 these reductions become SQL views; the contract stays identical.
 */
export function sumBatting(
  lines: readonly BattingStatLine[],
  identity: { id: string; teamId: string; seasonId: string; playerId: string },
): BattingStatLine {
  return lines.reduce<BattingStatLine>(
    (total, line) => ({
      ...total,
      gp: total.gp + line.gp,
      ab: total.ab + line.ab,
      r: total.r + line.r,
      h: total.h + line.h,
      doubles: total.doubles + line.doubles,
      triples: total.triples + line.triples,
      hr: total.hr + line.hr,
      rbi: total.rbi + line.rbi,
      bb: total.bb + line.bb,
      so: total.so + line.so,
      hbp: total.hbp + line.hbp,
      sf: total.sf + line.sf,
      sac: total.sac + line.sac,
      sb: total.sb + line.sb,
      cs: total.cs + line.cs,
    }),
    {
      ...identity,
      gameId: null,
      gp: 0, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0,
      bb: 0, so: 0, hbp: 0, sf: 0, sac: 0, sb: 0, cs: 0,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    },
  );
}

export function sumPitching(
  lines: readonly PitchingStatLine[],
  identity: { id: string; teamId: string; seasonId: string; playerId: string },
): PitchingStatLine {
  return lines.reduce<PitchingStatLine>(
    (total, line) => ({
      ...total,
      g: total.g + line.g,
      gs: total.gs + line.gs,
      outs: total.outs + line.outs,
      h: total.h + line.h,
      r: total.r + line.r,
      er: total.er + line.er,
      bb: total.bb + line.bb,
      so: total.so + line.so,
      hr: total.hr + line.hr,
      bf: total.bf + line.bf,
      w: total.w + line.w,
      l: total.l + line.l,
      sv: total.sv + line.sv,
    }),
    {
      ...identity,
      gameId: null,
      g: 0, gs: 0, outs: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, hr: 0, bf: 0,
      w: 0, l: 0, sv: 0,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    },
  );
}

export function sumFielding(
  lines: readonly FieldingStatLine[],
  identity: { id: string; teamId: string; seasonId: string; playerId: string },
): FieldingStatLine {
  const position = lines[0]?.position ?? 'EP';
  return lines.reduce<FieldingStatLine>(
    (total, line) => ({
      ...total,
      g: total.g + line.g,
      outsPlayed: total.outsPlayed + line.outsPlayed,
      po: total.po + line.po,
      a: total.a + line.a,
      e: total.e + line.e,
      dp: total.dp + line.dp,
    }),
    {
      ...identity,
      gameId: null,
      position,
      g: 0, outsPlayed: 0, po: 0, a: 0, e: 0, dp: 0,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    },
  );
}

export function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  items.forEach((item) => {
    const group = key(item);
    const bucket = groups.get(group);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(group, [item]);
    }
  });
  return groups;
}
