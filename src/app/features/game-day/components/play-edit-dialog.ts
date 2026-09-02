import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PLAY_RESULTS, PLAY_RESULT_LABELS, PlayEvent, PlayResult } from '../../../data/models';

@Component({
  selector: 'app-play-edit-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Editar jugada</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline">
        <mat-label>Entrada</mat-label>
        <input matInput type="number" min="1" [(ngModel)]="inning" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Resultado</mat-label>
        <mat-select [(ngModel)]="result">
          @for (option of results; track option) {
            <mat-option [value]="option">{{ labels[option] }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Carreras impulsadas</mat-label>
        <input matInput type="number" min="0" [(ngModel)]="rbi" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Carreras anotadas</mat-label>
        <input matInput type="number" min="0" [(ngModel)]="runsScored" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Outs</mat-label>
        <input matInput type="number" min="0" max="3" [(ngModel)]="outs" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" (click)="save()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: `mat-form-field { width: 10rem; margin: 0 0.5rem 0.5rem 0; }`,
})
export class PlayEditDialog {
  private readonly ref = inject(MatDialogRef<PlayEditDialog, Partial<PlayEvent>>);
  readonly data = inject<PlayEvent>(MAT_DIALOG_DATA);
  readonly results = PLAY_RESULTS;
  readonly labels = PLAY_RESULT_LABELS;
  inning = this.data.inning;
  result: PlayResult = this.data.result;
  rbi = this.data.rbi;
  runsScored = this.data.runsScored;
  outs = this.data.outs;

  save(): void {
    this.ref.close({
      inning: Math.max(1, Math.floor(Number(this.inning) || 1)),
      result: this.result,
      rbi: Math.max(0, Number(this.rbi) || 0),
      runsScored: Math.max(0, Number(this.runsScored) || 0),
      outs: Math.min(3, Math.max(0, Number(this.outs) || 0)),
    });
  }
}
