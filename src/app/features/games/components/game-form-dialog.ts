import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Game, GameStatus, HomeAway, Opponent, Venue } from '../../../data/models';
import { todayIso } from '../../../shared/utils/date';

export interface GameFormData {
  readonly game: Game | null;
  readonly opponents: readonly Opponent[];
  readonly venues: readonly Venue[];
}

export interface GameFormResult {
  readonly opponentId: string;
  readonly date: string;
  readonly time: string;
  readonly venueId: string | null;
  readonly homeAway: HomeAway;
  readonly status: GameStatus;
  readonly teamScore: number | null;
  readonly opponentScore: number | null;
  readonly notes: string;
}

@Component({
  selector: 'app-game-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './game-form-dialog.html',
  styles: `
    .game-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 1rem;
      min-width: min(520px, 78vw);
    }
    .game-form__full {
      grid-column: 1 / -1;
    }
    @media (max-width: 600px) {
      .game-form {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class GameFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  readonly dialogRef = inject<MatDialogRef<GameFormDialog, GameFormResult>>(MatDialogRef);
  readonly data = inject<GameFormData>(MAT_DIALOG_DATA);

  readonly form = this.formBuilder.nonNullable.group({
    opponentId: [this.data.game?.opponentId ?? '', Validators.required],
    date: [this.data.game?.date ?? todayIso(), Validators.required],
    time: [this.data.game?.time ?? '18:30', Validators.required],
    venueId: [this.data.game?.venueId ?? ''],
    homeAway: [this.data.game?.homeAway ?? ('HOME' as HomeAway), Validators.required],
    status: [this.data.game?.status ?? ('SCHEDULED' as GameStatus), Validators.required],
    teamScore: [this.data.game?.teamScore ?? null],
    opponentScore: [this.data.game?.opponentScore ?? null],
    notes: [this.data.game?.notes ?? ''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const isFinal = value.status === 'FINAL';
    this.dialogRef.close({
      ...value,
      venueId: value.venueId || null,
      teamScore: isFinal ? Number(value.teamScore ?? 0) : null,
      opponentScore: isFinal ? Number(value.opponentScore ?? 0) : null,
    });
  }
}
