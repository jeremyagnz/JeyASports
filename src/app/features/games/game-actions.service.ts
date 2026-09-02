import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { switchMap } from 'rxjs';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { Game, GameResult, UpdateDto } from '../../data/models';
import { GameFormData, GameFormDialog, GameFormResult } from './components/game-form-dialog';
import { GamesFacade } from './games.facade';

/** Shared create/edit/delete flow reused by the games and schedule features. */
@Injectable({ providedIn: 'root' })
export class GameActionsService {
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly facade = inject(GamesFacade);

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(game: Game): void {
    this.openDialog(game);
  }

  confirmRemove(game: Game): void {
    this.confirm
      .confirm({
        title: 'Eliminar juego',
        message:
          'Se eliminarán también el lineup, las estadísticas y las jugadas asociadas a este juego.',
        confirmLabel: 'Eliminar',
        destructive: true,
      })
      .pipe(switchMap((confirmed) => (confirmed ? this.facade.remove(game.id) : [])))
      .subscribe({
        next: () => this.facade.notifySuccess('Juego eliminado.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
  }

  private openDialog(game: Game | null): void {
    this.dialog
      .open<GameFormDialog, GameFormData, GameFormResult>(GameFormDialog, {
        data: { game, opponents: this.facade.opponents(), venues: this.facade.venues() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        const patch = this.toPatch(result);
        const request = game
          ? this.facade.update(game.id, patch)
          : this.facade.create({
              ...patch,
              result: patch.result ?? null,
              inningsPlayed: patch.inningsPlayed ?? null,
              teamLineScore: [],
              opponentLineScore: [],
            } as Parameters<GamesFacade['create']>[0]);
        request.subscribe({
          next: () => this.facade.notifySuccess(game ? 'Juego actualizado.' : 'Juego creado.'),
          error: (error: unknown) => this.facade.notifyError(error),
        });
      });
  }

  /** Derives the result from the score so it can never contradict it. */
  private toPatch(result: GameFormResult): UpdateDto<Game> {
    const isFinal = result.status === 'FINAL';
    const teamScore = isFinal ? (result.teamScore ?? 0) : null;
    const opponentScore = isFinal ? (result.opponentScore ?? 0) : null;
    let outcome: GameResult | null = null;
    if (teamScore !== null && opponentScore !== null) {
      outcome = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T';
    }
    return {
      opponentId: result.opponentId,
      date: result.date,
      time: result.time,
      venueId: result.venueId,
      homeAway: result.homeAway,
      status: result.status,
      teamScore,
      opponentScore,
      result: outcome,
      notes: result.notes,
    };
  }
}
