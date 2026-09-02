import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { SeasonContextService } from '../../../core/context/season-context.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Player } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { PlayersFacade } from '../players.facade';

@Component({
  selector: 'app-roster-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, EmptyState, PageHeader],
  template: `
    <app-page-header
      eyebrow="Temporada {{ seasonContext.activeSeason()?.year }}"
      title="Roster"
      subtitle="Jugadores inscritos en la temporada activa. El número puede cambiar cada año."
    />

    <div class="roster__columns">
      <section>
        <h2>En el roster ({{ facade.rosterPlayers().length }})</h2>
        @for (row of facade.rosterPlayers(); track row.entry.id) {
          <div class="roster__row">
            <a [routerLink]="['/app/players', row.player.id]">
              <span class="roster__number">#{{ row.entry.jerseyNumber }}</span>
              {{ row.player.firstName }} {{ row.player.lastName }}
            </a>
            <span class="roster__position">{{ row.player.primaryPosition }}</span>
            @if (permissions.canManagePlayers()) {
              <button
                matIconButton
                matTooltip="Quitar del roster"
                (click)="remove(row.entry.id)"
              >
                <mat-icon>remove_circle_outline</mat-icon>
              </button>
            }
          </div>
        } @empty {
          <app-empty-state icon="list" title="Roster vacío" />
        }
      </section>

      <section>
        <h2>Disponibles ({{ facade.availableForRoster().length }})</h2>
        @for (player of facade.availableForRoster(); track player.id) {
          <div class="roster__row">
            <span>
              <span class="roster__number">#{{ player.jerseyNumber }}</span>
              {{ player.firstName }} {{ player.lastName }}
            </span>
            <span class="roster__position">{{ player.primaryPosition }}</span>
            @if (permissions.canManagePlayers()) {
              <button matIconButton matTooltip="Añadir al roster" (click)="add(player)">
                <mat-icon>add_circle_outline</mat-icon>
              </button>
            }
          </div>
        } @empty {
          <app-empty-state icon="check_circle" title="Todos los jugadores están inscritos" />
        }
      </section>
    </div>
  `,
  styles: `
    .roster__columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    h2 {
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
    }
    .roster__row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--app-color-border);
    }
    .roster__row a {
      color: inherit;
      text-decoration: none;
    }
    .roster__number {
      font-family: var(--app-font-numeric);
      font-weight: 800;
      color: var(--app-color-accent);
      margin-right: 0.4rem;
    }
    .roster__position {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class RosterPage {
  readonly facade = inject(PlayersFacade);
  readonly permissions = inject(PermissionService);
  readonly seasonContext = inject(SeasonContextService);

  add(player: Player): void {
    this.facade.addToRoster(player).subscribe({
      next: () => this.facade.notifySuccess('Jugador añadido al roster.'),
      error: (error: unknown) => this.facade.notifyError(error),
    });
  }

  remove(entryId: string): void {
    this.facade.removeFromRoster(entryId).subscribe({
      next: () => this.facade.notifySuccess('Jugador retirado del roster.'),
      error: (error: unknown) => this.facade.notifyError(error),
    });
  }
}
