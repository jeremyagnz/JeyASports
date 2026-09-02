import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TeamContextService } from '../core/context/team-context.service';

@Component({
  selector: 'app-team-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button matButton [matMenuTriggerFor]="menu" [disabled]="!teamContext.hasMultipleTeams()">
      <span class="switcher__badge" [style.background]="teamContext.activeTeam()?.primaryColor">
        {{ teamContext.activeTeam()?.abbreviation }}
      </span>
      <span class="switcher__name">{{ teamContext.activeTeam()?.name }}</span>
      @if (teamContext.hasMultipleTeams()) {
        <mat-icon iconPositionEnd>expand_more</mat-icon>
      }
    </button>
    <mat-menu #menu="matMenu">
      @for (team of teamContext.availableTeams(); track team.id) {
        <button mat-menu-item (click)="teamContext.switchTeam(team.id)">
          <span class="switcher__badge" [style.background]="team.primaryColor">
            {{ team.abbreviation }}
          </span>
          {{ team.name }}
        </button>
      }
    </mat-menu>
  `,
  styles: `
    .switcher__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.4rem;
      padding: 0.1rem 0.35rem;
      margin-right: 0.5rem;
      border-radius: var(--app-radius-sm);
      font-weight: 800;
      font-size: 0.72rem;
      color: #08121a;
    }
    .switcher__name {
      font-weight: 600;
    }
    @media (max-width: 720px) {
      .switcher__name {
        display: none;
      }
    }
  `,
})
export class TeamSwitcher {
  readonly teamContext = inject(TeamContextService);
}
