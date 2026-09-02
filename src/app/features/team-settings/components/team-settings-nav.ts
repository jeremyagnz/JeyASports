import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Section navigation shared by the team settings pages. */
@Component({
  selector: 'app-team-settings-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="team-settings__nav">
      <a
        matButton
        routerLink="/app/team-settings"
        routerLinkActive="is-active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Perfil
      </a>
      <a matButton routerLink="/app/team-settings/venues" routerLinkActive="is-active">Sedes</a>
      <a matButton routerLink="/app/team-settings/opponents" routerLinkActive="is-active">Rivales</a>
    </nav>
  `,
  styles: `
    .team-settings__nav {
      display: flex;
      gap: 0.35rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .team-settings__nav .is-active {
      color: var(--app-color-accent);
    }
  `,
})
export class TeamSettingsNav {}
