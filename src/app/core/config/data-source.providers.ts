import { Provider } from '@angular/core';
import {
  BATTING_STAT_REPOSITORY, FIELDING_STAT_REPOSITORY, GAME_REPOSITORY, LINEUP_REPOSITORY,
  OPPONENT_REPOSITORY, PITCHING_STAT_REPOSITORY, PLAYER_REPOSITORY, PLAY_EVENT_REPOSITORY,
  ROSTER_REPOSITORY, SEASON_REPOSITORY, STATS_QUERY_REPOSITORY, TEAM_MEMBERSHIP_REPOSITORY,
  TEAM_REPOSITORY, USER_REPOSITORY, VENUE_REPOSITORY,
} from '../../data/repositories/abstract/tokens';
import {
  MockBattingStatRepository, MockFieldingStatRepository, MockGameRepository, MockLineupRepository,
  MockOpponentRepository, MockPitchingStatRepository, MockPlayEventRepository, MockPlayerRepository,
  MockRosterRepository, MockSeasonRepository, MockVenueRepository,
} from '../../data/repositories/mock/mock-entity.repositories';
import {
  MockTeamMembershipRepository, MockTeamRepository, MockUserRepository,
} from '../../data/repositories/mock/mock-identity.repositories';
import { MockStatsQueryRepository } from '../../data/repositories/mock/mock-stats-query.repository';
import { environment } from './environment';

const mockProviders: Provider[] = [
  { provide: USER_REPOSITORY, useClass: MockUserRepository },
  { provide: TEAM_REPOSITORY, useClass: MockTeamRepository },
  { provide: TEAM_MEMBERSHIP_REPOSITORY, useClass: MockTeamMembershipRepository },
  { provide: SEASON_REPOSITORY, useClass: MockSeasonRepository },
  { provide: PLAYER_REPOSITORY, useClass: MockPlayerRepository },
  { provide: ROSTER_REPOSITORY, useClass: MockRosterRepository },
  { provide: OPPONENT_REPOSITORY, useClass: MockOpponentRepository },
  { provide: VENUE_REPOSITORY, useClass: MockVenueRepository },
  { provide: GAME_REPOSITORY, useClass: MockGameRepository },
  { provide: LINEUP_REPOSITORY, useClass: MockLineupRepository },
  { provide: PLAY_EVENT_REPOSITORY, useClass: MockPlayEventRepository },
  { provide: BATTING_STAT_REPOSITORY, useClass: MockBattingStatRepository },
  { provide: PITCHING_STAT_REPOSITORY, useClass: MockPitchingStatRepository },
  { provide: FIELDING_STAT_REPOSITORY, useClass: MockFieldingStatRepository },
  { provide: STATS_QUERY_REPOSITORY, useClass: MockStatsQueryRepository },
];

/**
 * Single wiring point for the data layer.
 *
 * Phase 2 adds a `supabaseProviders` array here and selects it through
 * `environment.dataSource`; no facade or component is affected.
 */
export function provideDataSource(): Provider[] {
  switch (environment.dataSource) {
    case 'mock':
    default:
      return mockProviders;
  }
}
