import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TeamContextService } from '../core/context/team-context.service';
import { Permission, PermissionService } from '../core/services/permission.service';
import { SeasonSelector } from './season-selector';
import { TeamSwitcher } from './team-switcher';
import { UserMenu } from './user-menu';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly permission?: Permission;
}

const NAV_ITEMS: readonly NavItem[] = [
  { path: '/app/dashboard', label: 'Panel', icon: 'space_dashboard' },
  { path: '/app/players', label: 'Jugadoras', icon: 'groups' },
  { path: '/app/stats', label: 'Estadísticas', icon: 'query_stats' },
  { path: '/app/leaders', label: 'Líderes', icon: 'leaderboard' },
  { path: '/app/schedule', label: 'Calendario', icon: 'calendar_month' },
  { path: '/app/games', label: 'Juegos', icon: 'sports_baseball' },
  { path: '/app/seasons', label: 'Temporadas', icon: 'flag', permission: 'seasons.manage' },
  { path: '/app/team-settings', label: 'Equipo', icon: 'settings', permission: 'team.manage' },
  { path: '/app/administration', label: 'Administración', icon: 'admin_panel_settings', permission: 'members.manage' },
];

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule,
    RouterLink, RouterLinkActive, RouterOutlet, SeasonSelector, TeamSwitcher, UserMenu,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly permissions = inject(PermissionService);
  private readonly teamContext = inject(TeamContextService);
  private readonly document = inject(DOCUMENT);

  readonly sidenavOpened = signal(false);

  readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.permission || this.permissions.can(item.permission)),
  );

  constructor() {
    // The active team drives the accent colour of the whole application.
    effect(() => {
      const team = this.teamContext.activeTeam();
      const root = this.document.documentElement;
      if (team) {
        root.style.setProperty('--app-color-accent', team.primaryColor);
        root.style.setProperty('--app-color-accent-strong', team.secondaryColor);
      } else {
        root.style.removeProperty('--app-color-accent');
        root.style.removeProperty('--app-color-accent-strong');
      }
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }
}
