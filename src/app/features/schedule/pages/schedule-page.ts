import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { PermissionService } from '../../../core/services/permission.service';
import { Game } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { formatLongDate, monthKey, monthLabel } from '../../../shared/utils/date';
import { GameActionsService } from '../../games/game-actions.service';
import { GamesFacade } from '../../games/games.facade';

type ScheduleFilter = 'all' | 'upcoming' | 'played';

interface ScheduleMonth {
  readonly key: string;
  readonly label: string;
  readonly games: readonly Game[];
}

@Component({
  selector: 'app-schedule-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule, RouterLink, EmptyState,
    PageHeader,
  ],
  templateUrl: './schedule-page.html',
  styleUrl: './schedule-page.scss',
})
export class SchedulePage {
  readonly facade = inject(GamesFacade);
  readonly actions = inject(GameActionsService);
  readonly permissions = inject(PermissionService);

  readonly filter = signal<ScheduleFilter>('all');

  readonly months = computed<readonly ScheduleMonth[]>(() => {
    const games = this.visibleGames();
    const buckets = new Map<string, Game[]>();
    for (const game of games) {
      const key = monthKey(game.date);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(game);
      } else {
        buckets.set(key, [game]);
      }
    }
    return [...buckets.entries()].map(([key, monthGames]) => ({
      key,
      label: monthLabel(key),
      games: monthGames,
    }));
  });

  private readonly visibleGames = computed(() => {
    switch (this.filter()) {
      case 'upcoming':
        return this.facade.upcomingGames();
      case 'played':
        return this.facade.playedGames();
      default:
        return this.facade.games();
    }
  });

  formatDate(value: string): string {
    return formatLongDate(value);
  }

  venueName(game: Game): string {
    return game.venueId ? (this.facade.venueById().get(game.venueId)?.name ?? '-') : 'Por definir';
  }

  setFilter(value: ScheduleFilter): void {
    this.filter.set(value);
  }
}
