import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { PermissionService } from '../../../core/services/permission.service';
import { Game } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { formatLongDate } from '../../../shared/utils/date';
import { GameActionsService } from '../game-actions.service';
import { GamesFacade } from '../games.facade';

@Component({
  selector: 'app-game-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, RouterLink, EmptyState,
    PageHeader,
  ],
  templateUrl: './game-list-page.html',
  styleUrl: './game-list-page.scss',
})
export class GameListPage {
  readonly facade = inject(GamesFacade);
  readonly actions = inject(GameActionsService);
  readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);

  /** Most recent first: results are what people look for on this page. */
  readonly games = computed(() => [...this.facade.games()].reverse());

  formatDate(value: string): string {
    return formatLongDate(value);
  }

  scoreline(game: Game): string {
    return game.status === 'FINAL' ? `${game.teamScore} - ${game.opponentScore}` : '-';
  }

  openDetail(game: Game): void {
    void this.router.navigate(['/app/games', game.id]);
  }

  onRowKeydown(event: KeyboardEvent, game: Game): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openDetail(game);
    }
  }
}
