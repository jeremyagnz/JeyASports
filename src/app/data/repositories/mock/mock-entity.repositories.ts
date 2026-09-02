import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  BattingStatLine, FieldingStatLine, Game, Lineup, Opponent, PitchingStatLine, PlayEvent,
  Player, RosterEntry, Season, Venue,
} from '../../models';
import { LineupRepository } from '../abstract/entity-repositories';
import { MockCollectionRepository } from './mock-collection.repository';
import { simulate } from './mock-latency';

@Injectable()
export class MockSeasonRepository extends MockCollectionRepository<Season> {
  constructor() {
    super('seasons', 'season', ['name']);
  }
}

@Injectable()
export class MockPlayerRepository extends MockCollectionRepository<Player> {
  constructor() {
    super('players', 'player', ['firstName', 'lastName']);
  }

  /** Removing a player also removes everything that references it. */
  override remove(id: string): Observable<void> {
    return super.remove(id).pipe(
      map(() => {
        this.database.replace(
          'rosterEntries',
          this.database.select('rosterEntries').filter((entry) => entry.playerId !== id),
        );
        this.database.replace(
          'battingStats',
          this.database.select('battingStats').filter((line) => line.playerId !== id),
        );
        this.database.replace(
          'pitchingStats',
          this.database.select('pitchingStats').filter((line) => line.playerId !== id),
        );
        this.database.replace(
          'fieldingStats',
          this.database.select('fieldingStats').filter((line) => line.playerId !== id),
        );
        this.database.replace(
          'playEvents',
          this.database.select('playEvents').filter((event) => event.playerId !== id),
        );
      }),
    );
  }
}

@Injectable()
export class MockRosterRepository extends MockCollectionRepository<RosterEntry> {
  constructor() {
    super('rosterEntries', 'roster');
  }
}

@Injectable()
export class MockOpponentRepository extends MockCollectionRepository<Opponent> {
  constructor() {
    super('opponents', 'opponent', ['name', 'abbreviation']);
  }
}

@Injectable()
export class MockVenueRepository extends MockCollectionRepository<Venue> {
  constructor() {
    super('venues', 'venue', ['name']);
  }
}

@Injectable()
export class MockGameRepository extends MockCollectionRepository<Game> {
  constructor() {
    super('games', 'game', ['notes']);
  }

  /** Removing a game also removes its lineup, stat lines and play-by-play. */
  override remove(id: string): Observable<void> {
    return super.remove(id).pipe(
      map(() => {
        this.database.replace(
          'lineups',
          this.database.select('lineups').filter((lineup) => lineup.gameId !== id),
        );
        this.database.replace(
          'battingStats',
          this.database.select('battingStats').filter((line) => line.gameId !== id),
        );
        this.database.replace(
          'pitchingStats',
          this.database.select('pitchingStats').filter((line) => line.gameId !== id),
        );
        this.database.replace(
          'fieldingStats',
          this.database.select('fieldingStats').filter((line) => line.gameId !== id),
        );
        this.database.replace(
          'playEvents',
          this.database.select('playEvents').filter((event) => event.gameId !== id),
        );
      }),
    );
  }
}

@Injectable()
export class MockPlayEventRepository extends MockCollectionRepository<PlayEvent> {
  constructor() {
    super('playEvents', 'play');
  }
}

@Injectable()
export class MockBattingStatRepository extends MockCollectionRepository<BattingStatLine> {
  constructor() {
    super('battingStats', 'bat');
  }
}

@Injectable()
export class MockPitchingStatRepository extends MockCollectionRepository<PitchingStatLine> {
  constructor() {
    super('pitchingStats', 'pit');
  }
}

@Injectable()
export class MockFieldingStatRepository extends MockCollectionRepository<FieldingStatLine> {
  constructor() {
    super('fieldingStats', 'fld');
  }
}

@Injectable()
export class MockLineupRepository
  extends MockCollectionRepository<Lineup>
  implements LineupRepository
{
  constructor() {
    super('lineups', 'lineup');
  }

  findByGame(teamId: string, gameId: string): Observable<Lineup | null> {
    return simulate(
      () =>
        this.rows().find((lineup) => lineup.teamId === teamId && lineup.gameId === gameId) ?? null,
    );
  }
}
