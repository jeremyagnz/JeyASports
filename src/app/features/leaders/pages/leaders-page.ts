import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { SeasonContextService } from '../../../core/context/season-context.service';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { LeaderValuePipe } from '../components/leader-value.pipe';
import { LeadersFacade } from '../leaders.facade';

@Component({
  selector: 'app-leaders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressBarModule, RouterLink, EmptyState, PageHeader, LeaderValuePipe],
  template: `
    <app-page-header
      eyebrow="Temporada {{ seasonContext.activeSeason()?.year }}"
      title="Líderes"
      subtitle="Las categorías de promedio aplican el mínimo de apariciones de la temporada."
    />

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (facade.boards().length === 0 && !facade.loading()) {
      <app-empty-state icon="leaderboard" title="Sin estadísticas todavía" />
    }

    <h2 class="leaders__group">Ofensiva</h2>
    <div class="leaders__grid">
      @for (board of facade.battingBoards(); track board.definition.key) {
        <a class="leader-card" [routerLink]="['/app/leaders', board.definition.key]">
          <p class="leader-card__title">{{ board.definition.label }}</p>
          @for (leader of board.leaders.slice(0, 5); track leader.playerId) {
            <div class="leader-card__row">
              <span class="leader-card__rank">{{ leader.rank }}</span>
              <span class="leader-card__name">{{ leader.playerName }}</span>
              <span class="leader-card__value">
                {{ leader.value | leaderValue: board.definition }}
              </span>
            </div>
          } @empty {
            <p class="leader-card__empty">Nadie califica todavía.</p>
          }
        </a>
      }
    </div>

    <h2 class="leaders__group">Pitcheo</h2>
    <div class="leaders__grid">
      @for (board of facade.pitchingBoards(); track board.definition.key) {
        <a class="leader-card" [routerLink]="['/app/leaders', board.definition.key]">
          <p class="leader-card__title">{{ board.definition.label }}</p>
          @for (leader of board.leaders.slice(0, 5); track leader.playerId) {
            <div class="leader-card__row">
              <span class="leader-card__rank">{{ leader.rank }}</span>
              <span class="leader-card__name">{{ leader.playerName }}</span>
              <span class="leader-card__value">
                {{ leader.value | leaderValue: board.definition }}
              </span>
            </div>
          } @empty {
            <p class="leader-card__empty">Nadie califica todavía.</p>
          }
        </a>
      }
    </div>
  `,
  styleUrl: './leaders-page.scss',
})
export class LeadersPage {
  readonly facade = inject(LeadersFacade);
  readonly seasonContext = inject(SeasonContextService);
}
