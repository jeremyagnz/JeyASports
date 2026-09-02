import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { PermissionService } from '../../../core/services/permission.service';
import { POSITIONS, Player, PlayerStatus, Position } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { PlayerAvatar } from '../../../shared/ui/player-avatar';
import { PlayerFormDialog, PlayerFormResult } from '../components/player-form-dialog';
import { PlayersFacade } from '../players.facade';

@Component({
  selector: 'app-player-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatProgressBarModule, MatSelectModule, MatTooltipModule, RouterLink, EmptyState, PageHeader,
    PlayerAvatar,
  ],
  templateUrl: './player-list-page.html',
  styleUrl: './player-list-page.scss',
})
export class PlayerListPage {
  readonly facade = inject(PlayersFacade);
  readonly permissions = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);

  readonly positions = POSITIONS;
  readonly statuses: readonly (PlayerStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'INJURED', 'INACTIVE'];

  onSearch(value: string): void {
    this.facade.search.set(value);
  }

  onStatus(value: PlayerStatus | 'ALL'): void {
    this.facade.statusFilter.set(value);
  }

  onPosition(value: Position | 'ALL'): void {
    this.facade.positionFilter.set(value);
  }

  openCreate(): void {
    this.dialog
      .open<PlayerFormDialog, Player | null, PlayerFormResult>(PlayerFormDialog, { data: null })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.facade.create(result).subscribe({
          next: () => this.facade.notifySuccess('Jugador creado.'),
          error: (error: unknown) => this.facade.notifyError(error),
        });
      });
  }

  openEdit(player: Player): void {
    this.dialog
      .open<PlayerFormDialog, Player | null, PlayerFormResult>(PlayerFormDialog, { data: player })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.facade.update(player.id, result).subscribe({
          next: () => this.facade.notifySuccess('Jugador actualizado.'),
          error: (error: unknown) => this.facade.notifyError(error),
        });
      });
  }

  confirmRemove(player: Player): void {
    this.confirm
      .confirm({
        title: 'Eliminar jugador',
        message: `Se eliminarán también sus estadísticas y su lugar en el roster. ¿Eliminar a ${player.firstName} ${player.lastName}?`,
        confirmLabel: 'Eliminar',
        destructive: true,
      })
      .pipe(switchMap((confirmed) => (confirmed ? this.facade.remove(player.id) : [])))
      .subscribe({
        next: () => this.facade.notifySuccess('Jugador eliminado.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
  }
}
