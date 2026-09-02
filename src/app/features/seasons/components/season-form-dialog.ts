import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Season, SeasonStatus } from '../../../data/models';

export interface SeasonFormResult {
  readonly name: string;
  readonly year: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: SeasonStatus;
  readonly qualifyingPlateAppearances: number;
  readonly qualifyingOuts: number;
}

@Component({
  selector: 'app-season-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './season-form-dialog.html',
  styles: `
    .season-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 1rem;
      min-width: min(480px, 78vw);
    }
    .season-form__full {
      grid-column: 1 / -1;
    }
    @media (max-width: 600px) {
      .season-form {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SeasonFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  readonly dialogRef = inject<MatDialogRef<SeasonFormDialog, SeasonFormResult>>(MatDialogRef);
  readonly season = inject<Season | null>(MAT_DIALOG_DATA);

  readonly form = this.formBuilder.nonNullable.group({
    name: [this.season?.name ?? '', [Validators.required, Validators.maxLength(60)]],
    year: [this.season?.year ?? new Date().getFullYear(), [Validators.required, Validators.min(1900)]],
    startDate: [this.season?.startDate ?? '', Validators.required],
    endDate: [this.season?.endDate ?? '', Validators.required],
    status: [this.season?.status ?? ('UPCOMING' as SeasonStatus), Validators.required],
    qualifyingPlateAppearances: [
      this.season?.qualifyingPlateAppearances ?? 30,
      [Validators.required, Validators.min(0)],
    ],
    qualifyingOuts: [this.season?.qualifyingOuts ?? 30, [Validators.required, Validators.min(0)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      year: Number(value.year),
      qualifyingPlateAppearances: Number(value.qualifyingPlateAppearances),
      qualifyingOuts: Number(value.qualifyingOuts),
    });
  }
}
