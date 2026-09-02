import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SeasonContextService } from '../core/context/season-context.service';

@Component({
  selector: 'app-season-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    @if (seasonContext.activeSeason(); as season) {
      <button matButton [matMenuTriggerFor]="menu">
        <mat-icon>event</mat-icon>
        {{ season.year }}
        <mat-icon iconPositionEnd>expand_more</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        @for (option of seasonContext.teamSeasons(); track option.id) {
          <button mat-menu-item (click)="seasonContext.selectSeason(option.id)">
            {{ option.name }}
            @if (option.isCurrent) {
              <span class="season-selector__tag">actual</span>
            }
          </button>
        }
      </mat-menu>
    }
  `,
  styles: `
    .season-selector__tag {
      margin-left: 0.4rem;
      font-size: 0.7rem;
      color: var(--app-color-accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
  `,
})
export class SeasonSelector {
  readonly seasonContext = inject(SeasonContextService);
}
