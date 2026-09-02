import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Venue } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { GamesFacade } from '../../games/games.facade';
import { TeamSettingsNav } from '../components/team-settings-nav';

@Component({
  selector: 'app-venues-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    EmptyState, PageHeader, TeamSettingsNav,
  ],
  templateUrl: './venues-page.html',
  styleUrl: './catalog-page.scss',
})
export class VenuesPage {
  readonly facade = inject(GamesFacade);
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirm = inject(ConfirmDialogService);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    address: [''],
  });

  add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.facade.createVenue(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.reset({ name: '', address: '' });
        this.facade.notifySuccess('Sede agregada.');
      },
      error: (error: unknown) => this.facade.notifyError(error),
    });
  }

  remove(venue: Venue): void {
    this.confirm
      .confirm({
        title: 'Eliminar sede',
        message: `Se eliminará "${venue.name}". Los juegos que la usan quedarán sin sede.`,
        confirmLabel: 'Eliminar',
        destructive: true,
      })
      .pipe(switchMap((confirmed) => (confirmed ? this.facade.removeVenue(venue.id) : [])))
      .subscribe({
        next: () => this.facade.notifySuccess('Sede eliminada.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
  }
}
