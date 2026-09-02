import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { battingRates } from '../../../core/domain/stats-calculator';
import { BattingStatLine } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { formatAvg } from '../../../shared/utils/format';
import { PlayersFacade } from '../../players/players.facade';
import { StatsFacade } from '../stats.facade';

interface ComparisonRow {
  readonly label: string;
  readonly left: string;
  readonly right: string;
  readonly leftWins: boolean;
  readonly rightWins: boolean;
}

@Component({
  selector: 'app-stat-compare-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, EmptyState, PageHeader],
  template: `
    <app-page-header
      eyebrow="Estadísticas"
      title="Comparar jugadores"
      subtitle="Enfrenta dos líneas ofensivas de la temporada activa."
    />

    <div class="compare__selectors">
      <mat-form-field appearance="outline">
        <mat-label>Jugador A</mat-label>
        <mat-select [ngModel]="leftId()" (ngModelChange)="leftId.set($event)">
          @for (line of facade.batting(); track line.playerId) {
            <mat-option [value]="line.playerId">{{ nameOf(line.playerId) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Jugador B</mat-label>
        <mat-select [ngModel]="rightId()" (ngModelChange)="rightId.set($event)">
          @for (line of facade.batting(); track line.playerId) {
            <mat-option [value]="line.playerId">{{ nameOf(line.playerId) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (rows().length > 0) {
      <div class="app-table-wrapper">
        <table class="app-stat-table compare__table">
          <thead>
            <tr>
              <th>{{ nameOf(leftId()!) }}</th>
              <th class="compare__label">Métrica</th>
              <th>{{ nameOf(rightId()!) }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.label) {
              <tr>
                <td [class.compare__winner]="row.leftWins">{{ row.left }}</td>
                <td class="compare__label">{{ row.label }}</td>
                <td [class.compare__winner]="row.rightWins">{{ row.right }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <app-empty-state
        icon="compare_arrows"
        title="Elige dos jugadores"
        message="Selecciona dos jugadores con estadísticas en la temporada activa."
      />
    }
  `,
  styles: `
    .compare__selectors {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .compare__table {
      min-width: 480px;
    }
    .compare__table th,
    .compare__table td {
      text-align: center;
    }
    .compare__table th:first-child,
    .compare__table td:first-child {
      text-align: center;
      position: static;
    }
    .compare__label {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .compare__winner {
      color: var(--app-color-accent);
      font-weight: 800;
    }
  `,
})
export class StatComparePage {
  readonly facade = inject(StatsFacade);
  private readonly playersFacade = inject(PlayersFacade);

  readonly leftId = signal<string | null>(null);
  readonly rightId = signal<string | null>(null);

  readonly rows = computed<readonly ComparisonRow[]>(() => {
    const left = this.lineFor(this.leftId());
    const right = this.lineFor(this.rightId());
    if (!left || !right) {
      return [];
    }
    const leftRates = battingRates(left);
    const rightRates = battingRates(right);

    return [
      this.row('JJ', left.gp, right.gp),
      this.row('VB', left.ab, right.ab),
      this.row('H', left.h, right.h),
      this.row('HR', left.hr, right.hr),
      this.row('CI', left.rbi, right.rbi),
      this.row('BB', left.bb, right.bb),
      this.row('K', left.so, right.so, true),
      this.row('AVG', leftRates.avg, rightRates.avg, false, formatAvg),
      this.row('OBP', leftRates.obp, rightRates.obp, false, formatAvg),
      this.row('SLG', leftRates.slg, rightRates.slg, false, formatAvg),
      this.row('OPS', leftRates.ops, rightRates.ops, false, formatAvg),
    ];
  });

  nameOf(playerId: string | null): string {
    if (!playerId) {
      return '-';
    }
    const player = this.playersFacade.byId().get(playerId);
    return player ? `${player.firstName} ${player.lastName}` : playerId;
  }

  private lineFor(playerId: string | null): BattingStatLine | null {
    return playerId
      ? (this.facade.batting().find((line) => line.playerId === playerId) ?? null)
      : null;
  }

  private row(
    label: string,
    left: number,
    right: number,
    lowerIsBetter = false,
    format: (value: number) => string = (value) => String(value),
  ): ComparisonRow {
    const leftWins = lowerIsBetter ? left < right : left > right;
    const rightWins = lowerIsBetter ? right < left : right > left;
    return { label, left: format(left), right: format(right), leftWins, rightWins };
  }
}
