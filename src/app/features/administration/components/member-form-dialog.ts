import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TeamRole } from '../../../data/models';

export interface MemberFormResult {
  readonly displayName: string;
  readonly email: string;
  readonly role: TeamRole;
}

@Component({
  selector: 'app-member-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Agregar miembro</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="displayName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Correo electrónico</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>El correo es obligatorio</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role">
            @for (role of roles; track role) {
              <mat-option [value]="role">{{ role }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" (click)="submit()">Agregar</button>
    </mat-dialog-actions>
  `,
  styles: `
    form { display: grid; gap: 0.5rem; width: min(420px, 78vw); max-width: 100%; }
    mat-form-field { min-width: 0; }
  `,
})
export class MemberFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ref = inject<MatDialogRef<MemberFormDialog, MemberFormResult>>(MatDialogRef);
  readonly data = inject<{ roles: readonly TeamRole[] }>(MAT_DIALOG_DATA);
  readonly roles = this.data.roles;

  readonly form = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['ADMIN' as TeamRole, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.ref.close(this.form.getRawValue());
  }
}
