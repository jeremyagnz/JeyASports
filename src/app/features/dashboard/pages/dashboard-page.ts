import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SeasonContextService } from '../../../core/context/season-context.service';
import { TeamContextService } from '../../../core/context/team-context.service';
import { Game } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatCard } from '../../../shared/ui/stat-card';
import { battingRates } from '../../../core/domain/stats-calculator';
import { formatAvg } from '../../../shared/utils/format';
import { formatLongDate } from '../../../shared/utils/date';
import { GamesFacade } from '../../games/games.facade';
import { LeaderValuePipe } from '../../leaders/components/leader-value.pipe';
import { LeadersFacade } from '../../leaders/leaders.facade';
import { StatsFacade } from '../../stats/stats.facade';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, RouterLink, EmptyState, PageHeader, StatCard, LeaderValuePipe,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  readonly games = inject(GamesFacade);
  readonly stats = inject(StatsFacade);
  readonly leaders = inject(LeadersFacade);
  readonly teamContext = inject(TeamContextService);
  readonly seasonContext = inject(SeasonContextService);

  readonly recentGames = computed(() => [...this.games.playedGames()].reverse().slice(0, 5));

  readonly teamAverage = computed(() => {
    const totals = this.stats.teamTotals();
    return totals ? formatAvg(battingRates(totals.batting).avg) : '-';
  });

  readonly runsPerGame = computed(() => {
    const played = this.games.playedGames();
    if (played.length === 0) {
      return '-';
    }
    const runs = played.reduce((total, game) => total + (game.teamScore ?? 0), 0);
    return (runs / played.length).toFixed(1);
  });

  /** Top five hitters by average among qualified players. */
  readonly avgBoard = computed(() => this.leaders.boardFor('AVG'));
  readonly topPerformers = computed(() => this.avgBoard()?.leaders.slice(0, 5) ?? []);

  formatDate(value: string): string {
    return formatLongDate(value);
  }

  scoreline(game: Game): string {
    return `${game.teamScore} - ${game.opponentScore}`;
  }
}
