import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { TeamContextService } from '../../../core/context/team-context.service';

@Component({
  selector: 'app-team-select-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCardModule],
  template: `
    <div class="team-select">
      <h1>Elige un equipo</h1>
      <p>Tu cuenta pertenece a más de un equipo. Los datos están aislados por equipo.</p>
      <div class="team-select__grid">
        @for (team of teamContext.availableTeams(); track team.id) {
          <mat-card appearance="outlined" class="team-select__card">
            <div class="team-select__badge" [style.background]="team.primaryColor">
              {{ team.abbreviation }}
            </div>
            <h2>{{ team.name }}</h2>
            <p>{{ team.city }} · {{ team.league }}</p>
            <button matButton="filled" (click)="choose(team.id)">Entrar</button>
          </mat-card>
        } @empty {
          <p>No perteneces a ningún equipo todavía.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .team-select {
      max-width: 900px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }
    .team-select__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    .team-select__card {
      padding: 1.25rem;
      text-align: center;
      background: var(--app-color-surface-raised);
    }
    .team-select__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      margin: 0 auto 0.75rem;
      border-radius: var(--app-radius-md);
      font-weight: 900;
      color: #08121a;
    }
  `,
})
export class TeamSelectPage {
  readonly teamContext = inject(TeamContextService);
  private readonly router = inject(Router);

  choose(teamId: string): void {
    this.teamContext.switchTeam(teamId);
    void this.router.navigate(['/app/dashboard']);
  }
}
