import {
  BattingStatLine, FieldingStatLine, Game, Lineup, Opponent, PitchingStatLine, PlayEvent,
  Player, RosterEntry, Season, Team, TeamMembership, User, Venue,
} from '../models';

/**
 * In-memory shape of the whole Phase 1 dataset. Each property maps to one
 * future PostgreSQL table and to one `localStorage` key.
 */
export interface Database {
  users: User[];
  memberships: TeamMembership[];
  teams: Team[];
  venues: Venue[];
  opponents: Opponent[];
  seasons: Season[];
  players: Player[];
  rosterEntries: RosterEntry[];
  games: Game[];
  lineups: Lineup[];
  playEvents: PlayEvent[];
  battingStats: BattingStatLine[];
  pitchingStats: PitchingStatLine[];
  fieldingStats: FieldingStatLine[];
}

export type CollectionName = keyof Database;

export const COLLECTION_NAMES: readonly CollectionName[] = [
  'users', 'memberships', 'teams', 'venues', 'opponents', 'seasons', 'players',
  'rosterEntries', 'games', 'lineups', 'playEvents', 'battingStats',
  'pitchingStats', 'fieldingStats',
];

export function emptyDatabase(): Database {
  return {
    users: [], memberships: [], teams: [], venues: [], opponents: [], seasons: [],
    players: [], rosterEntries: [], games: [], lineups: [], playEvents: [],
    battingStats: [], pitchingStats: [], fieldingStats: [],
  };
}
