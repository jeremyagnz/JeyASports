import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { provideDataSource } from '../../../core/config/data-source.providers';
import { GAME_REPOSITORY, PLAYER_REPOSITORY } from '../abstract/tokens';
import { DatabaseService } from '../../storage/database.service';

const TEAM_A = 'team-halcones';
const TEAM_B = 'team-centellas';

describe('mock repositories tenant isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideDataSource()] });
    TestBed.inject(DatabaseService).ensureInitialized();
  });

  it('never returns players from another team', async () => {
    const repository = TestBed.inject(PLAYER_REPOSITORY);
    const players = await firstValueFrom(repository.list({ teamId: TEAM_A }));

    expect(players.length).toBeGreaterThan(0);
    expect(players.every((player) => player.teamId === TEAM_A)).toBe(true);
  });

  it('keeps both teams populated with disjoint rosters', async () => {
    const repository = TestBed.inject(PLAYER_REPOSITORY);
    const teamA = await firstValueFrom(repository.list({ teamId: TEAM_A }));
    const teamB = await firstValueFrom(repository.list({ teamId: TEAM_B }));

    expect(teamB.length).toBeGreaterThan(0);
    const idsA = new Set(teamA.map((player) => player.id));
    expect(teamB.some((player) => idsA.has(player.id))).toBe(false);
  });

  it('never returns games from another team', async () => {
    const repository = TestBed.inject(GAME_REPOSITORY);
    const games = await firstValueFrom(repository.list({ teamId: TEAM_B }));

    expect(games.length).toBeGreaterThan(0);
    expect(games.every((game) => game.teamId === TEAM_B)).toBe(true);
  });
});
