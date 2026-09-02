import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import {
  BattingStatLine, FieldingStatLine, Game, PitchingStatLine, UpdateDto,
} from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { StatTable } from '../../../shared/ui/stat-table';
import { formatLongDate } from '../../../shared/utils/date';
import { PlayersFacade } from '../../players/players.facade';
import {
  battingColumns, fieldingColumns, pitchingColumns,
} from '../../stats/stat-columns';
import { StatsFacade } from '../../stats/stats.facade';
import { StatEditDialog } from '../../stats/components/stat-edit-dialog';
import { GamesFacade } from '../games.facade';

@Component({
  selector: 'app-game-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatTabsModule, RouterLink, EmptyState, StatTable,
  ],
  templateUrl: './game-detail-page.html',
  styleUrl: './game-detail-page.scss',
})
export class GameDetailPage {
  readonly facade = inject(GamesFacade);
  readonly permissions = inject(PermissionService);
  private readonly statsFacade = inject(StatsFacade);
  private readonly playersFacade = inject(PlayersFacade);
  private readonly dialog = inject(MatDialog);

  readonly id = input.required<string>();

  private readonly id$ = toObservable(this.id);

  readonly game = toSignal<Game | null>(
    this.id$.pipe(switchMap((id) => this.facade.getById(id).pipe(catchError(() => of(null))))),
    { initialValue: null },
  );

  private readonly boxScore = toSignal(
    this.id$.pipe(
      switchMap((id) =>
        combineLatest({
          batting: this.statsFacade.gameBoxScore(id, 'batting'),
          pitching: this.statsFacade.gameBoxScore(id, 'pitching'),
          fielding: this.statsFacade.gameBoxScore(id, 'fielding'),
        }).pipe(catchError(() => of(null))),
      ),
    ),
    { initialValue: null },
  );

  private readonly nameOf = computed(() => {
    const players = this.playersFacade.byId();
    return (playerId: string): string => {
      const player = players.get(playerId);
      return player ? `#${player.jerseyNumber} ${player.firstName} ${player.lastName}` : playerId;
    };
  });

  readonly battingRows = computed(
    () => (this.boxScore()?.batting ?? []) as readonly BattingStatLine[],
  );
  readonly pitchingRows = computed(
    () => (this.boxScore()?.pitching ?? []) as readonly PitchingStatLine[],
  );
  readonly fieldingRows = computed(
    () => (this.boxScore()?.fielding ?? []) as readonly FieldingStatLine[],
  );

  readonly battingColumns = computed(() => battingColumns(this.nameOf()));
  readonly pitchingColumns = computed(() => pitchingColumns(this.nameOf()));
  readonly fieldingColumns = computed(() => fieldingColumns(this.nameOf()));

  readonly innings = computed(() => {
    const game = this.game();
    const length = Math.max(
      game?.teamLineScore.length ?? 0,
      game?.opponentLineScore.length ?? 0,
      7,
    );
    return Array.from({ length }, (_, index) => index);
  });

  formatDate(value: string): string {
    return formatLongDate(value);
  }

  editStats(
    group: 'batting' | 'pitching' | 'fielding',
    row: BattingStatLine | PitchingStatLine | FieldingStatLine,
  ): void {
    if (!this.permissions.canManageStats()) {
      return;
    }
    this.dialog.open(StatEditDialog, {
      data: { group, row: row as unknown as Record<string, unknown> },
    }).afterClosed().subscribe((patch) => {
      if (!patch) {
        return;
      }
      if (group === 'batting') {
        this.statsFacade.updateBatting(row.id, patch as UpdateDto<BattingStatLine>).subscribe();
      } else if (group === 'pitching') {
        this.statsFacade.updatePitching(row.id, patch as UpdateDto<PitchingStatLine>).subscribe();
      } else {
        this.statsFacade.updateFielding(row.id, patch as UpdateDto<FieldingStatLine>).subscribe();
      }
    });
  }

  venueName(game: Game): string {
    return game.venueId ? (this.facade.venueById().get(game.venueId)?.name ?? '-') : 'Por definir';
  }
}
