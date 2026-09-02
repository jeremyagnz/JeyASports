import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Opponent } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { GamesFacade } from '../../games/games.facade';
import { TeamSettingsNav } from '../components/team-settings-nav';

@Component({
  selector: 'app-opponents-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    EmptyState, PageHeader, TeamSettingsNav,
  ],
  templateUrl: './opponents-page.html',
  styleUrl: './catalog-page.scss',
})
export class OpponentsPage {
  readonly facade = inject(GamesFacade);
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirm = inject(ConfirmDialogService);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    abbreviation: ['', [Validators.required, Validators.maxLength(5)]],
  });

  add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.facade.createOpponent(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.reset({ name: '', abbreviation: '' });
        this.facade.notifySuccess('Rival agregado.');
      },
      error: (error: unknown) => this.facade.notifyError(error),
    });
  }

  remove(opponent: Opponent): void {
    this.confirm
      .confirm({
        title: 'Eliminar rival',
        message: `Se eliminará "${opponent.name}". Los juegos contra este rival quedarán sin referencia.`,
        confirmLabel: 'Eliminar',
        destructive: true,
      })
      .pipe(switchMap((confirmed) => (confirmed ? this.facade.removeOpponent(opponent.id) : [])))
      .subscribe({
        next: () => this.facade.notifySuccess('Rival eliminado.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
  }
}
