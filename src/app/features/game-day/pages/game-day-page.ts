import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import {
  InningHalf, LineupEntry, PLAY_RESULTS, PLAY_RESULT_LABELS, PlayResult,
} from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { GamesFacade } from '../../games/games.facade';
import { PlayersFacade } from '../../players/players.facade';
import { PermissionService } from '../../../core/services/permission.service';
import { LineupBuilder } from '../components/lineup-builder';
import { PlayEditDialog } from '../components/play-edit-dialog';
import { MatDialog } from '@angular/material/dialog';
import { GameDayFacade } from '../game-day.facade';

@Component({
  selector: 'app-game-day-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GameDayFacade],
  imports: [
    MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, RouterLink,
    EmptyState, LineupBuilder,
  ],
  templateUrl: './game-day-page.html',
  styleUrl: './game-day-page.scss',
})
export class GameDayPage {
  readonly facade = inject(GameDayFacade);
  readonly players = inject(PlayersFacade);
  readonly gamesFacade = inject(GamesFacade);
  readonly permissions = inject(PermissionService);
  private readonly dialog = inject(MatDialog);

  readonly id = input.required<string>();

  readonly playResults = PLAY_RESULTS;
  readonly playResultLabels = PLAY_RESULT_LABELS;

  readonly batterId = signal<string>('');
  readonly result = signal<PlayResult>('1B');
  readonly rbi = signal(0);
  readonly runs = signal(0);
  readonly outs = signal(0);

  readonly activePlayers = computed(() =>
    this.players.all().filter((player) => player.status === 'ACTIVE'),
  );

  readonly selectedBatterId = computed(() => this.batterId() || (this.facade.nextBatterId() ?? ''));

  readonly recentPlays = computed(() => [...this.facade.plays()].reverse().slice(0, 8));

  constructor() {
    effect(() => this.facade.load(this.id()));
  }

  playerName(playerId: string): string {
    const player = this.players.byId().get(playerId);
    return player ? `#${player.jerseyNumber} ${player.firstName} ${player.lastName}` : 'Jugador';
  }

  saveLineup(entries: readonly LineupEntry[]): void {
    if (!this.permissions.canManageStats()) {
      return;
    }
    this.facade.saveLineup(entries);
  }

  setHalf(half: InningHalf): void {
    this.facade.setInning(this.facade.inning(), half);
  }

  changeInning(delta: number): void {
    this.facade.setInning(this.facade.inning() + delta, this.facade.half());
  }

  record(): void {
    const playerId = this.selectedBatterId();
    if (!playerId) {
      return;
    }
    this.facade.recordPlay({
      playerId,
      result: this.result(),
      rbi: this.rbi(),
      runsScored: this.runs(),
      outs: this.outs(),
    });
    this.batterId.set('');
    this.rbi.set(0);
    this.runs.set(0);
    this.outs.set(0);
  }

  toNumber(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  editPlay(play: import('../../../data/models').PlayEvent): void {
    if (!this.permissions.canManageStats()) {
      return;
    }
    this.dialog.open(PlayEditDialog, { data: play }).afterClosed().subscribe((patch) => {
      if (patch) {
        this.facade.updatePlay(play.id, patch);
      }
    });
  }
}
