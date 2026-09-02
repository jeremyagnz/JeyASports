import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { Season } from '../../data/models';
import { SEASON_REPOSITORY } from '../../data/repositories/abstract/tokens';
import { LocalStorageService } from '../../data/storage/local-storage.service';
import { DatabaseService } from '../../data/storage/database.service';
import { TeamContextService } from './team-context.service';

const ACTIVE_SEASON_KEY = 'active-season';

/** Selected season for the active team, persisted between visits. */
@Injectable({ providedIn: 'root' })
export class SeasonContextService {
  private readonly teamContext = inject(TeamContextService);
  private readonly seasons = inject(SEASON_REPOSITORY);
  private readonly storage = inject(LocalStorageService);
  private readonly database = inject(DatabaseService);

  private readonly selectedSeasonId = signal<string | null>(
    this.storage.read<string | null>(ACTIVE_SEASON_KEY, null),
  );

  readonly teamSeasons = toSignal(
    toObservable(
      computed(() => ({ teamId: this.teamContext.activeTeamId(), revision: this.database.revision() })),
    ).pipe(
      switchMap(({ teamId }) =>
        teamId
          ? this.seasons.list({ teamId, sort: { field: 'year', direction: 'desc' } })
          : of<readonly Season[]>([]),
      ),
    ),
    { initialValue: [] as readonly Season[] },
  );

  readonly activeSeason = computed(() => {
    const seasons = this.teamSeasons();
    if (seasons.length === 0) {
      return null;
    }
    return (
      seasons.find((season) => season.id === this.selectedSeasonId()) ??
      seasons.find((season) => season.isCurrent) ??
      seasons[0]
    );
  });

  readonly activeSeasonId = computed(() => this.activeSeason()?.id ?? null);

  constructor() {
    // Keeps the persisted selection valid when the user switches teams.
    effect(() => {
      const active = this.activeSeason();
      if (active && active.id !== this.selectedSeasonId()) {
        this.selectedSeasonId.set(active.id);
        this.storage.write(ACTIVE_SEASON_KEY, active.id);
      }
    });
  }

  selectSeason(seasonId: string): void {
    this.selectedSeasonId.set(seasonId);
    this.storage.write(ACTIVE_SEASON_KEY, seasonId);
  }
}
