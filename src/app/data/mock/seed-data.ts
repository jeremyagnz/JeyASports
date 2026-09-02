import { Database, emptyDatabase } from '../storage/database';
import {
  BattingStatLine, FieldingStatLine, Game, Lineup, LineupEntry, Opponent, PitchingStatLine,
  Player, Position, RosterEntry, Season, Team, TeamMembership, User, Venue,
} from '../models';
import { FIRST_NAMES, LAST_NAMES, OPPONENT_NAMES, VENUE_NAMES } from './names';
import { SeededRandom } from './random';

/** Fixed seed: the demo dataset must be identical on every reload. */
const SEED = 20260214;
const EPOCH = '2026-01-05T12:00:00.000Z';
const REGULATION_INNINGS = 7;
const OUTS_PER_GAME = REGULATION_INNINGS * 3;
const GAMES_PER_SEASON = 18;
const PLAYERS_PER_TEAM = 16;

interface TeamBlueprint {
  readonly id: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly city: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly seedOffset: number;
}

const TEAM_BLUEPRINTS: readonly TeamBlueprint[] = [
  {
    id: 'team-halcones',
    name: 'Halcones de Bahía Verde',
    abbreviation: 'HBV',
    city: 'Bahía Verde',
    primaryColor: '#19b8a6',
    secondaryColor: '#0d1b2a',
    seedOffset: 0,
  },
  {
    id: 'team-centellas',
    name: 'Centellas del Puerto',
    abbreviation: 'CDP',
    city: 'Puerto Alto',
    primaryColor: '#f4713b',
    secondaryColor: '#1b1033',
    seedOffset: 977,
  },
];

const FIELD_POSITIONS: readonly Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SF'];

function timestamps(): { createdAt: string; updatedAt: string } {
  return { createdAt: EPOCH, updatedAt: EPOCH };
}

function isoDate(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

/** Spreads a run total across innings so the line score always adds up. */
function distributeRuns(total: number, innings: number, random: SeededRandom): number[] {
  const line = new Array<number>(innings).fill(0);
  for (let scored = 0; scored < total; scored++) {
    line[random.int(0, innings - 1)] += 1;
  }
  return line;
}

export function buildSeedDatabase(): Database {
  const db = emptyDatabase();
  const currentYear = 2026;

  TEAM_BLUEPRINTS.forEach((blueprint, teamIndex) => {
    const random = new SeededRandom(SEED + blueprint.seedOffset);
    const venues = buildVenues(blueprint, random);
    const team: Team = {
      id: blueprint.id,
      name: blueprint.name,
      abbreviation: blueprint.abbreviation,
      city: blueprint.city,
      league: 'Liga Metropolitana de Softbol',
      division: teamIndex === 0 ? 'División Costa' : 'División Sierra',
      primaryColor: blueprint.primaryColor,
      secondaryColor: blueprint.secondaryColor,
      homeVenueId: venues[0].id,
      regulationInnings: REGULATION_INNINGS,
      fieldersPerLineup: 10,
      ...timestamps(),
    };
    db.teams.push(team);
    db.venues.push(...venues);

    const opponents = buildOpponents(blueprint, random);
    db.opponents.push(...opponents);

    const players = buildPlayers(blueprint, random);
    db.players.push(...players);

    const seasons = buildSeasons(blueprint, currentYear);
    db.seasons.push(...seasons);

    seasons.forEach((season) => {
      db.rosterEntries.push(...buildRoster(season, players));
      buildSeasonGames(team, season, players, opponents, venues, random, db);
    });
  });

  buildAccounts(db);
  return db;
}

function buildVenues(blueprint: TeamBlueprint, random: SeededRandom): Venue[] {
  return VENUE_NAMES.slice(0, 2).map((name, index) => ({
    id: `${blueprint.id}-venue-${index + 1}`,
    teamId: blueprint.id,
    name,
    address: `${random.int(10, 320)} Av. Deportiva, ${blueprint.city}`,
    ...timestamps(),
  }));
}

function buildOpponents(blueprint: TeamBlueprint, random: SeededRandom): Opponent[] {
  return random.shuffle(OPPONENT_NAMES).slice(0, 6).map(([name, abbreviation], index) => ({
    id: `${blueprint.id}-opp-${index + 1}`,
    teamId: blueprint.id,
    name,
    abbreviation,
    ...timestamps(),
  }));
}

function buildPlayers(blueprint: TeamBlueprint, random: SeededRandom): Player[] {
  const numbers = random.shuffle(Array.from({ length: 60 }, (_, i) => i + 1)).slice(0, PLAYERS_PER_TEAM);
  // Guarantees a viable roster: enough pitchers, catchers and every field spot.
  const assignments: Position[] = [
    'P', 'P', 'P', 'C', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SF', 'SS', '2B', 'EP',
  ];

  return assignments.map((primaryPosition, index) => {
    const firstName = FIRST_NAMES[(index * 5 + blueprint.seedOffset) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(index * 7 + blueprint.seedOffset) % LAST_NAMES.length];
    const secondary = random
      .shuffle(FIELD_POSITIONS.filter((position) => position !== primaryPosition))
      .slice(0, random.int(0, 2));

    return {
      id: `${blueprint.id}-player-${String(index + 1).padStart(2, '0')}`,
      teamId: blueprint.id,
      firstName,
      lastName,
      jerseyNumber: numbers[index],
      primaryPosition,
      secondaryPositions: secondary,
      bats: random.pick(['R', 'R', 'L', 'S'] as const),
      throws: random.pick(['R', 'R', 'L'] as const),
      birthDate: isoDate(random.int(1993, 2006), random.int(0, 11), random.int(1, 28)),
      heightCm: random.int(155, 188),
      weightKg: random.int(54, 88),
      status: index === PLAYERS_PER_TEAM - 1 ? 'INJURED' : 'ACTIVE',
      bio: `${firstName} ${lastName} juega principalmente como ${primaryPosition} para ${blueprint.name}.`,
      ...timestamps(),
    } satisfies Player;
  });
}

function buildSeasons(blueprint: TeamBlueprint, currentYear: number): Season[] {
  return [currentYear - 1, currentYear].map((year) => ({
    id: `${blueprint.id}-season-${year}`,
    teamId: blueprint.id,
    name: `Temporada ${year}`,
    year,
    startDate: isoDate(year, 2, 1),
    endDate: isoDate(year, 8, 30),
    status: year === currentYear ? 'ACTIVE' : 'COMPLETED',
    isCurrent: year === currentYear,
    qualifyingPlateAppearances: 25,
    qualifyingOuts: 30,
    ...timestamps(),
  } satisfies Season));
}

function buildRoster(season: Season, players: readonly Player[]): RosterEntry[] {
  return players.map((player) => ({
    id: `${season.id}-roster-${player.id}`,
    teamId: season.teamId,
    seasonId: season.id,
    playerId: player.id,
    jerseyNumber: player.jerseyNumber,
    status: player.status,
    ...timestamps(),
  } satisfies RosterEntry));
}

function buildSeasonGames(
  team: Team,
  season: Season,
  players: readonly Player[],
  opponents: readonly Opponent[],
  venues: readonly Venue[],
  random: SeededRandom,
  db: Database,
): void {
  const pitchers = players.filter((player) => player.primaryPosition === 'P');
  const batters = players.filter((player) => player.status !== 'INJURED');
  // The active season is only partially played so the schedule shows upcoming games.
  const playedGames = season.status === 'COMPLETED' ? GAMES_PER_SEASON : 12;

  for (let gameIndex = 0; gameIndex < GAMES_PER_SEASON; gameIndex++) {
    const gameId = `${season.id}-game-${String(gameIndex + 1).padStart(2, '0')}`;
    const date = isoDate(season.year, 2 + Math.floor(gameIndex / 4), 3 + (gameIndex % 4) * 7);
    const homeAway = gameIndex % 2 === 0 ? 'HOME' : 'AWAY';
    const played = gameIndex < playedGames;

    if (!played) {
      db.games.push({
        id: gameId,
        teamId: team.id,
        seasonId: season.id,
        opponentId: opponents[gameIndex % opponents.length].id,
        date,
        time: '18:30',
        venueId: homeAway === 'HOME' ? venues[0].id : null,
        homeAway,
        status: 'SCHEDULED',
        teamScore: null,
        opponentScore: null,
        result: null,
        inningsPlayed: null,
        teamLineScore: [],
        opponentLineScore: [],
        notes: '',
        ...timestamps(),
      } satisfies Game);
      continue;
    }

    const lineupPlayers = random.shuffle(batters).slice(0, 10);
    const batting = lineupPlayers.map((player, orderIndex) =>
      buildBattingLine(team.id, season.id, gameId, player, orderIndex, random),
    );
    const teamScore = batting.reduce((sum, line) => sum + line.r, 0);

    const gamePitchers = random.shuffle(pitchers).slice(0, random.bool(0.65) ? 1 : 2);
    const pitching = buildPitchingLines(team.id, season.id, gameId, gamePitchers, random);
    const opponentScore = pitching.reduce((sum, line) => sum + line.r, 0);

    const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T';
    const decided = pitching.map((line, index) =>
      index === 0
        ? { ...line, w: result === 'W' ? 1 : 0, l: result === 'L' ? 1 : 0 }
        : { ...line, sv: result === 'W' ? 1 : 0 },
    );

    db.battingStats.push(...batting);
    db.pitchingStats.push(...decided);
    db.fieldingStats.push(
      ...buildFieldingLines(team.id, season.id, gameId, lineupPlayers, random),
    );

    const entries: LineupEntry[] = lineupPlayers.map((player, orderIndex) => ({
      playerId: player.id,
      battingOrder: orderIndex + 1,
      position: FIELD_POSITIONS[orderIndex],
      isStarter: true,
      substitutionOf: null,
    }));
    db.lineups.push({
      id: `${gameId}-lineup`,
      teamId: team.id,
      gameId,
      entries,
      ...timestamps(),
    } satisfies Lineup);

    db.games.push({
      id: gameId,
      teamId: team.id,
      seasonId: season.id,
      opponentId: opponents[gameIndex % opponents.length].id,
      date,
      time: '18:30',
      venueId: homeAway === 'HOME' ? venues[0].id : null,
      homeAway,
      status: 'FINAL',
      teamScore,
      opponentScore,
      result,
      inningsPlayed: REGULATION_INNINGS,
      teamLineScore: distributeRuns(teamScore, REGULATION_INNINGS, random),
      opponentLineScore: distributeRuns(opponentScore, REGULATION_INNINGS, random),
      notes: '',
      ...timestamps(),
    } satisfies Game);
  }
}

function buildBattingLine(
  teamId: string,
  seasonId: string,
  gameId: string,
  player: Player,
  orderIndex: number,
  random: SeededRandom,
): BattingStatLine {
  const pa = orderIndex < 4 ? random.int(3, 5) : random.int(2, 4);
  const bb = random.bool(0.22) ? 1 : 0;
  const hbp = random.bool(0.05) ? 1 : 0;
  const sf = random.bool(0.07) ? 1 : 0;
  const sac = random.bool(0.05) ? 1 : 0;
  const ab = Math.max(0, pa - bb - hbp - sf - sac);
  let h = 0;
  for (let i = 0; i < ab; i++) {
    if (random.bool(0.31)) {
      h++;
    }
  }
  const hr = h > 0 && random.bool(0.11) ? 1 : 0;
  const triples = h - hr > 0 && random.bool(0.05) ? 1 : 0;
  const doubles = h - hr - triples > 0 && random.bool(0.24) ? 1 : 0;
  const so = Math.min(ab - h, random.bool(0.28) ? 1 : 0);
  const rbi = hr * random.int(1, 3) + (h - hr > 0 ? random.int(0, 1) : 0) + sf;
  const r = Math.min(h + bb + hbp, hr + (random.bool(0.35) ? 1 : 0));
  const sb = h + bb > 0 && random.bool(0.14) ? 1 : 0;
  const cs = sb === 0 && random.bool(0.05) ? 1 : 0;

  return {
    id: `${gameId}-bat-${player.id}`,
    teamId,
    seasonId,
    gameId,
    playerId: player.id,
    gp: 1,
    ab, r, h, doubles, triples, hr, rbi, bb, so, hbp, sf, sac, sb, cs,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  };
}

function buildPitchingLines(
  teamId: string,
  seasonId: string,
  gameId: string,
  pitchers: readonly Player[],
  random: SeededRandom,
): PitchingStatLine[] {
  const shares = pitchers.length === 1 ? [OUTS_PER_GAME] : [random.int(9, 15), 0];
  if (shares.length === 2) {
    shares[1] = OUTS_PER_GAME - shares[0];
  }

  return pitchers.map((pitcher, index) => {
    const outs = shares[index];
    const innings = outs / 3;
    const h = Math.round(innings * (0.8 + random.next() * 0.9));
    const bb = Math.round(innings * (0.2 + random.next() * 0.5));
    const so = Math.round(innings * (0.5 + random.next() * 1.1));
    const hr = random.bool(0.25) ? 1 : 0;
    const r = Math.max(hr, Math.round(innings * (0.3 + random.next() * 0.9)));
    const er = Math.max(0, r - (random.bool(0.3) ? 1 : 0));

    return {
      id: `${gameId}-pit-${pitcher.id}`,
      teamId,
      seasonId,
      gameId,
      playerId: pitcher.id,
      g: 1,
      gs: index === 0 ? 1 : 0,
      outs, h, r, er, bb, so, hr,
      bf: outs + h + bb,
      w: 0, l: 0, sv: 0,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    } satisfies PitchingStatLine;
  });
}

function buildFieldingLines(
  teamId: string,
  seasonId: string,
  gameId: string,
  lineupPlayers: readonly Player[],
  random: SeededRandom,
): FieldingStatLine[] {
  return lineupPlayers.map((player, index) => {
    const position = FIELD_POSITIONS[index];
    const infield = ['P', 'C', '1B', '2B', '3B', 'SS'].includes(position);
    const po = position === '1B' ? random.int(4, 9) : random.int(0, infield ? 4 : 3);
    const a = infield ? random.int(0, 4) : random.int(0, 1);
    const e = random.bool(0.14) ? 1 : 0;

    return {
      id: `${gameId}-fld-${player.id}`,
      teamId,
      seasonId,
      gameId,
      playerId: player.id,
      position,
      g: 1,
      outsPlayed: OUTS_PER_GAME,
      po, a, e,
      dp: random.bool(0.1) ? 1 : 0,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    } satisfies FieldingStatLine;
  });
}

/**
 * Demo accounts. `multi@jeyasports.dev` belongs to both teams, which is what
 * exercises the team switcher and the tenant isolation rules.
 */
function buildAccounts(db: Database): void {
  const [teamA, teamB] = db.teams;
  const accounts: readonly { id: string; email: string; name: string; memberships: readonly { teamId: string; role: TeamMembership['role'] }[] }[] = [
    { id: 'user-owner-a', email: 'owner@halcones.dev', name: 'Nadia Bravo', memberships: [{ teamId: teamA.id, role: 'OWNER' }] },
    { id: 'user-admin-a', email: 'admin@halcones.dev', name: 'Iván Cepeda', memberships: [{ teamId: teamA.id, role: 'ADMIN' }] },
    { id: 'user-viewer-a', email: 'viewer@halcones.dev', name: 'Lía Moreno', memberships: [{ teamId: teamA.id, role: 'VIEWER' }] },
    { id: 'user-owner-b', email: 'owner@centellas.dev', name: 'Marco Ruiz', memberships: [{ teamId: teamB.id, role: 'OWNER' }] },
    {
      id: 'user-multi',
      email: 'multi@jeyasports.dev',
      name: 'Paz Villalobos',
      memberships: [
        { teamId: teamA.id, role: 'ADMIN' },
        { teamId: teamB.id, role: 'VIEWER' },
      ],
    },
  ];

  accounts.forEach((account) => {
    db.users.push({
      id: account.id,
      email: account.email,
      displayName: account.name,
      ...timestamps(),
    } satisfies User);

    account.memberships.forEach((membership, index) => {
      db.memberships.push({
        id: `${account.id}-membership-${index + 1}`,
        userId: account.id,
        teamId: membership.teamId,
        role: membership.role,
        status: 'ACTIVE',
        joinedAt: EPOCH,
        ...timestamps(),
      } satisfies TeamMembership);
    });
  });
}
