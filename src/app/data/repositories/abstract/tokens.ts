import { InjectionToken } from '@angular/core';
import {
  BattingStatRepository, FieldingStatRepository, GameRepository, LineupRepository,
  OpponentRepository, PitchingStatRepository, PlayEventRepository, PlayerRepository,
  RosterRepository, SeasonRepository, StatsQueryRepository, TeamMembershipRepository,
  TeamRepository, UserRepository, VenueRepository,
} from './entity-repositories';

/**
 * Dependency inversion seam. Phase 2 only has to point these tokens at
 * Supabase implementations; nothing above the data layer changes.
 */
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
export const TEAM_REPOSITORY = new InjectionToken<TeamRepository>('TeamRepository');
export const TEAM_MEMBERSHIP_REPOSITORY = new InjectionToken<TeamMembershipRepository>('TeamMembershipRepository');
export const SEASON_REPOSITORY = new InjectionToken<SeasonRepository>('SeasonRepository');
export const PLAYER_REPOSITORY = new InjectionToken<PlayerRepository>('PlayerRepository');
export const ROSTER_REPOSITORY = new InjectionToken<RosterRepository>('RosterRepository');
export const OPPONENT_REPOSITORY = new InjectionToken<OpponentRepository>('OpponentRepository');
export const VENUE_REPOSITORY = new InjectionToken<VenueRepository>('VenueRepository');
export const GAME_REPOSITORY = new InjectionToken<GameRepository>('GameRepository');
export const LINEUP_REPOSITORY = new InjectionToken<LineupRepository>('LineupRepository');
export const PLAY_EVENT_REPOSITORY = new InjectionToken<PlayEventRepository>('PlayEventRepository');
export const BATTING_STAT_REPOSITORY = new InjectionToken<BattingStatRepository>('BattingStatRepository');
export const PITCHING_STAT_REPOSITORY = new InjectionToken<PitchingStatRepository>('PitchingStatRepository');
export const FIELDING_STAT_REPOSITORY = new InjectionToken<FieldingStatRepository>('FieldingStatRepository');
export const STATS_QUERY_REPOSITORY = new InjectionToken<StatsQueryRepository>('StatsQueryRepository');
