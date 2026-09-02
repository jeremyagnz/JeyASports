import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CreateDto, POSITIONS, POSITION_LABELS, Player, Position } from '../../../data/models';

export type PlayerFormResult = Omit<CreateDto<Player>, 'teamId'>;

@Component({
  selector: 'app-player-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './player-form-dialog.html',
  styles: `
    .player-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 1rem;
      min-width: min(560px, 78vw);
    }
    .player-form__full {
      grid-column: 1 / -1;
    }
    @media (max-width: 600px) {
      .player-form {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class PlayerFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  readonly dialogRef = inject<MatDialogRef<PlayerFormDialog, PlayerFormResult>>(MatDialogRef);
  readonly player = inject<Player | null>(MAT_DIALOG_DATA);

  readonly positions = POSITIONS;
  readonly positionLabels = POSITION_LABELS;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: [this.player?.firstName ?? '', [Validators.required, Validators.maxLength(40)]],
    lastName: [this.player?.lastName ?? '', [Validators.required, Validators.maxLength(40)]],
    jerseyNumber: [
      this.player?.jerseyNumber ?? 0,
      [Validators.required, Validators.min(0), Validators.max(99)],
    ],
    primaryPosition: [this.player?.primaryPosition ?? ('P' as Position), Validators.required],
    secondaryPositions: [[...(this.player?.secondaryPositions ?? [])] as Position[]],
    bats: [this.player?.bats ?? ('R' as const), Validators.required],
    throws: [this.player?.throws ?? ('R' as const), Validators.required],
    birthDate: [this.player?.birthDate ?? '2000-01-01', Validators.required],
    heightCm: [this.player?.heightCm ?? 170, [Validators.min(120), Validators.max(220)]],
    weightKg: [this.player?.weightKg ?? 65, [Validators.min(30), Validators.max(160)]],
    status: [this.player?.status ?? ('ACTIVE' as const), Validators.required],
    bio: [this.player?.bio ?? ''],
    photoUrl: [this.player?.photoUrl ?? ''],
  });

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.form.controls.photoUrl.setValue(String(reader.result));
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      jerseyNumber: Number(value.jerseyNumber),
      heightCm: Number(value.heightCm),
      weightKg: Number(value.weightKg),
      secondaryPositions: value.secondaryPositions,
      photoUrl: value.photoUrl || undefined,
    });
  }
}
