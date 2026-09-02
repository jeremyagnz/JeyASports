import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StatGroup } from '../../../data/models';

export interface StatEditData {
  readonly group: StatGroup;
  readonly row: Record<string, unknown>;
}

@Component({
  selector: 'app-stat-edit-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Ajustar estadísticas</h2>
    <mat-dialog-content>
      @for (field of fields; track field) {
        <mat-form-field appearance="outline">
          <mat-label>{{ field }}</mat-label>
          <input matInput type="number" min="0" [ngModel]="value(field)"
            (ngModelChange)="setValue(field, $event)" />
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" (click)="submit()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: `mat-form-field { width: 7rem; margin: 0 0.5rem 0.5rem 0; }`,
})
export class StatEditDialog {
  private readonly ref = inject(MatDialogRef<StatEditDialog, Record<string, number>>);
  readonly data = inject<StatEditData>(MAT_DIALOG_DATA);
  readonly fields = this.data.group === 'batting'
    ? ['gp', 'ab', 'r', 'h', 'doubles', 'triples', 'hr', 'rbi', 'bb', 'so', 'hbp', 'sf', 'sac', 'sb', 'cs']
    : this.data.group === 'pitching'
      ? ['g', 'gs', 'outs', 'h', 'r', 'er', 'bb', 'so', 'hr', 'bf', 'w', 'l', 'sv']
      : ['g', 'outsPlayed', 'po', 'a', 'e', 'dp'];
  private readonly values = new Map(this.fields.map((field) => [field, Number(this.data.row[field] ?? 0)]));

  value(field: string): number {
    return this.values.get(field) ?? 0;
  }

  setValue(field: string, value: number): void {
    this.values.set(field, Math.max(0, Number(value) || 0));
  }

  submit(): void {
    this.ref.close(Object.fromEntries(this.values));
  }
}
