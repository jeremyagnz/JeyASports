import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { LineupEntry, POSITION_LABELS, Player, Position } from '../../../data/models';

interface BuilderRow {
  readonly battingOrder: number;
  playerId: string;
  position: Position;
}

/** Batting order editor: one row per lineup slot, validated before saving. */
@Component({
  selector: 'app-lineup-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  templateUrl: './lineup-builder.html',
  styleUrl: './lineup-builder.scss',
})
export class LineupBuilder {
  readonly players = input.required<readonly Player[]>();
  readonly entries = input.required<readonly LineupEntry[]>();
  readonly slots = input(10);
  readonly save = output<readonly LineupEntry[]>();

  readonly positions = Object.keys(POSITION_LABELS) as Position[];
  readonly positionLabels = POSITION_LABELS;

  private readonly draft = signal<BuilderRow[] | null>(null);

  readonly rows = computed<BuilderRow[]>(() => {
    const current = this.draft();
    if (current) {
      return current;
    }
    const entries = [...this.entries()].sort((a, b) => a.battingOrder - b.battingOrder);
    return Array.from({ length: this.slots() }, (_, index) => {
      const entry = entries[index];
      return {
        battingOrder: index + 1,
        playerId: entry?.playerId ?? '',
        position: entry?.position ?? ('P' as Position),
      };
    });
  });

  readonly duplicatePlayer = computed(() => {
    const used = this.rows()
      .map((row) => row.playerId)
      .filter((playerId) => playerId !== '');
    return new Set(used).size !== used.length;
  });

  readonly incomplete = computed(() => this.rows().some((row) => row.playerId === ''));

  setPlayer(index: number, playerId: string): void {
    this.patch(index, { playerId });
  }

  setPosition(index: number, position: Position): void {
    this.patch(index, { position });
  }

  emitSave(): void {
    if (this.duplicatePlayer() || this.incomplete()) {
      return;
    }
    this.save.emit(
      this.rows().map((row) => ({
        playerId: row.playerId,
        battingOrder: row.battingOrder,
        position: row.position,
        isStarter: true,
        substitutionOf: null,
      })),
    );
  }

  private patch(index: number, patch: Partial<BuilderRow>): void {
    const rows = this.rows().map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : { ...row },
    );
    this.draft.set(rows);
  }
}
