import { Injectable } from '@angular/core';
import { BattingStatLine, FieldingStatLine, PitchingStatLine } from '../../data/models';
import { battingRates, fieldingRates, inningsPitched, pitchingRates } from './stats-calculator';

/**
 * Injectable facade over the pure sabermetric helpers, so components and
 * facades can consume them through DI while the maths stays unit-testable
 * without Angular.
 */
@Injectable({ providedIn: 'root' })
export class StatsCalculatorService {
  batting(line: BattingStatLine) {
    return battingRates(line);
  }

  pitching(line: PitchingStatLine, regulationInnings?: number) {
    return pitchingRates(line, regulationInnings);
  }

  fielding(line: FieldingStatLine) {
    return fieldingRates(line);
  }

  inningsPitched(outs: number): number {
    return inningsPitched(outs);
  }
}
