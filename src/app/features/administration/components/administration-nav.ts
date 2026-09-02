import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Section navigation shared by the administration pages. */
@Component({
  selector: 'app-administration-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="administration__nav">
      <a
        matButton
        routerLink="/app/administration"
        routerLinkActive="is-active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Miembros
      </a>
      <a matButton routerLink="/app/administration/data" routerLinkActive="is-active">Datos</a>
    </nav>
  `,
  styles: `
    .administration__nav {
      display: flex;
      gap: 0.35rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .administration__nav .is-active {
      color: var(--app-color-accent);
    }
  `,
})
export class AdministrationNav {}
