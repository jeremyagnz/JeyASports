import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { StatGroup } from '../../../data/models';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatCard } from '../../../shared/ui/stat-card';
import { StatTable } from '../../../shared/ui/stat-table';
import { downloadFile, toCsv } from '../../../shared/utils/csv';
import { PlayersFacade } from '../../players/players.facade';
import { battingColumns, fieldingColumns, pitchingColumns } from '../stat-columns';
import { StatsFacade } from '../stats.facade';
import { battingRates } from '../../../core/domain/stats-calculator';
import { formatAvg } from '../../../shared/utils/format';

@Component({
  selector: 'app-team-stats-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatProgressBarModule, MatTabsModule, PageHeader, StatCard,
    StatTable,
  ],
  templateUrl: './team-stats-page.html',
  styles: `
    .stats__summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
  `,
})
export class TeamStatsPage {
  readonly facade = inject(StatsFacade);
  private readonly playersFacade = inject(PlayersFacade);
  private readonly router = inject(Router);

  private readonly nameOf = computed(() => {
    const players = this.playersFacade.byId();
    return (playerId: string): string => {
      const player = players.get(playerId);
      return player ? `#${player.jerseyNumber} ${player.firstName} ${player.lastName}` : playerId;
    };
  });

  readonly battingColumns = computed(() => battingColumns(this.nameOf()));
  readonly pitchingColumns = computed(() => pitchingColumns(this.nameOf()));
  readonly fieldingColumns = computed(() => fieldingColumns(this.nameOf()));

  readonly teamRates = computed(() => {
    const totals = this.facade.teamTotals();
    return totals ? battingRates(totals.batting) : null;
  });

  readonly teamAverage = computed(() => formatAvg(this.teamRates()?.avg ?? null));
  readonly teamOps = computed(() => formatAvg(this.teamRates()?.ops ?? null));

  onTabChange(index: number): void {
    const groups: StatGroup[] = ['batting', 'pitching', 'fielding'];
    this.facade.group.set(groups[index] ?? 'batting');
  }

  compare(): void {
    void this.router.navigate(['/app/stats/compare']);
  }

  exportCsv(): void {
    const columns = this.battingColumns();
    const csv = toCsv(
      columns.map((column) => column.label),
      this.facade
        .batting()
        .map((row) => columns.map((column) => column.display?.(row) ?? column.value(row))),
    );
    downloadFile('estadisticas-bateo.csv', csv, 'text/csv');
  }
}
