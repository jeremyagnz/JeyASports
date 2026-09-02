import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { LeaderValuePipe } from '../components/leader-value.pipe';
import { LeadersFacade } from '../leaders.facade';

@Component({
  selector: 'app-leader-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, RouterLink, EmptyState, PageHeader, LeaderValuePipe],
  template: `
    <a matButton routerLink="/app/leaders">
      <mat-icon>arrow_back</mat-icon>
      Líderes
    </a>

    @if (board(); as board) {
      <app-page-header eyebrow="Líderes" [title]="board.definition.label" />
      <div class="app-table-wrapper">
        <table class="app-stat-table">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>#</th>
              <th>{{ board.definition.label }}</th>
            </tr>
          </thead>
          <tbody>
            @for (leader of board.leaders; track leader.playerId) {
              <tr>
                <td>{{ leader.rank }}. {{ leader.playerName }}</td>
                <td>{{ leader.jerseyNumber }}</td>
                <td>{{ leader.value | leaderValue: board.definition }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <app-empty-state icon="leaderboard" title="Categoría no disponible" />
    }
  `,
})
export class LeaderDetailPage {
  private readonly facade = inject(LeadersFacade);

  readonly category = input.required<string>();

  readonly board = computed(() => this.facade.boardFor(this.category()));
}
