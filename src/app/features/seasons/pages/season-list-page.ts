import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { switchMap } from 'rxjs';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Season } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { formatLongDate } from '../../../shared/utils/date';
import { SeasonFormDialog, SeasonFormResult } from '../components/season-form-dialog';
import { SeasonsFacade } from '../seasons.facade';

@Component({
  selector: 'app-season-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, EmptyState, PageHeader],
  templateUrl: './season-list-page.html',
  styleUrl: './season-list-page.scss',
})
export class SeasonListPage {
  readonly facade = inject(SeasonsFacade);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmDialogService);

  formatDate(value: string): string {
    return formatLongDate(value);
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(season: Season): void {
    this.openDialog(season);
  }

  setCurrent(season: Season): void {
    this.facade.setCurrent(season.id).subscribe({
      next: () => {
        this.facade.select(season.id);
        this.facade.notifySuccess('Temporada actual actualizada.');
      },
      error: (error: unknown) => this.facade.notifyError(error),
    });
  }

  remove(season: Season): void {
    this.confirm
      .confirm({
        title: 'Eliminar temporada',
        message: `Se eliminará "${season.name}". Los juegos y estadísticas asociados quedarán sin temporada.`,
        confirmLabel: 'Eliminar',
        destructive: true,
      })
      .pipe(switchMap((confirmed) => (confirmed ? this.facade.remove(season.id) : [])))
      .subscribe({
        next: () => this.facade.notifySuccess('Temporada eliminada.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
  }

  private openDialog(season: Season | null): void {
    this.dialog
      .open<SeasonFormDialog, Season | null, SeasonFormResult>(SeasonFormDialog, { data: season })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        const request = season
          ? this.facade.update(season.id, result)
          : this.facade.create({ ...result, isCurrent: false });
        request.subscribe({
          next: () => this.facade.notifySuccess(season ? 'Temporada actualizada.' : 'Temporada creada.'),
          error: (error: unknown) => this.facade.notifyError(error),
        });
      });
  }
}
