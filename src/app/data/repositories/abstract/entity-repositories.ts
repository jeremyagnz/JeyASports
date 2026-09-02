import { Observable } from 'rxjs';
import {
  BattingStatLine, FieldingStatLine, Game, LeaderBoard, Lineup, Opponent, PitchingStatLine,
  PlayEvent, Player, RosterEntry, Season, StatGroup, Team, TeamMembership, TeamStatLine, User, Venue,
} from '../../models';
import { ReadRepository, TeamScopedRepository, WriteRepository } from './repository';

export interface UserRepository {
  getById(id: string): Observable<User>;
  findByEmail(email: string): Observable<User | null>;
  list(): Observable<readonly User[]>;
  create(dto: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User>;
}

export interface TeamRepository {
  getById(id: string): Observable<Team>;
  listByIds(ids: readonly string[]): Observable<readonly Team[]>;
  update(id: string, patch: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): Observable<Team>;
}

export interface TeamMembershipRepository {
  listByUser(userId: string): Observable<readonly TeamMembership[]>;
  listByTeam(teamId: string): Observable<readonly TeamMembership[]>;
  create(
    dto: Omit<TeamMembership, 'id' | 'createdAt' | 'updatedAt'>,
  ): Observable<TeamMembership>;
  update(
    id: string,
    patch: Partial<Omit<TeamMembership, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Observable<TeamMembership>;
  remove(id: string): Observable<void>;
}

export type SeasonRepository = TeamScopedRepository<Season>;
export type PlayerRepository = TeamScopedRepository<Player>;
export type RosterRepository = TeamScopedRepository<RosterEntry>;
export type OpponentRepository = TeamScopedRepository<Opponent>;
export type VenueRepository = TeamScopedRepository<Venue>;
export type GameRepository = TeamScopedRepository<Game>;
export type PlayEventRepository = TeamScopedRepository<PlayEvent>;
export type BattingStatRepository = TeamScopedRepository<BattingStatLine>;
export type PitchingStatRepository = TeamScopedRepository<PitchingStatLine>;
export type FieldingStatRepository = TeamScopedRepository<FieldingStatLine>;

export interface LineupRepository
  extends ReadRepository<Lineup>, WriteRepository<Lineup> {
  findByGame(teamId: string, gameId: string): Observable<Lineup | null>;
}

export interface StatsQuery {
  readonly teamId: string;
  readonly seasonId: string;
  readonly playerId?: string;
}

/**
 * Aggregations are isolated here on purpose: they are the only queries that do
 * not map to plain CRUD, and in Phase 2 they become PostgreSQL views or RPCs.
 */
export interface StatsQueryRepository {
  battingSeasonTotals(query: StatsQuery): Observable<readonly BattingStatLine[]>;
  pitchingSeasonTotals(query: StatsQuery): Observable<readonly PitchingStatLine[]>;
  fieldingSeasonTotals(query: StatsQuery): Observable<readonly FieldingStatLine[]>;
  teamSeasonTotals(query: StatsQuery): Observable<TeamStatLine>;
  battingGameLog(query: Required<StatsQuery>): Observable<readonly BattingStatLine[]>;
  pitchingGameLog(query: Required<StatsQuery>): Observable<readonly PitchingStatLine[]>;
  fieldingGameLog(query: Required<StatsQuery>): Observable<readonly FieldingStatLine[]>;
  gameBoxScore(
    teamId: string,
    gameId: string,
    group: StatGroup,
  ): Observable<readonly (BattingStatLine | PitchingStatLine | FieldingStatLine)[]>;
  leaders(query: StatsQuery, limit: number): Observable<readonly LeaderBoard[]>;
}
