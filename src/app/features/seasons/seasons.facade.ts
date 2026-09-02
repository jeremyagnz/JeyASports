import { Injectable, computed, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { SeasonContextService } from '../../core/context/season-context.service';
import { TeamContextService } from '../../core/context/team-context.service';
import { NotificationService } from '../../core/services/notification.service';
import { CreateDto, Season, UpdateDto } from '../../data/models';
import { SEASON_REPOSITORY } from '../../data/repositories/abstract/tokens';

/** Season administration for the active team. */
@Injectable({ providedIn: 'root' })
export class SeasonsFacade {
  private readonly repository = inject(SEASON_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly seasonContext = inject(SeasonContextService);
  private readonly notifications = inject(NotificationService);

  readonly seasons = this.seasonContext.teamSeasons;
  readonly activeSeasonId = this.seasonContext.activeSeasonId;
  readonly currentSeason = computed(
    () => this.seasons().find((season) => season.isCurrent) ?? null,
  );

  create(dto: Omit<CreateDto<Season>, 'teamId'>): Observable<Season> {
    return this.repository.create({ ...dto, teamId: this.teamContext.requireTeamId() });
  }

  update(id: string, patch: UpdateDto<Season>): Observable<Season> {
    return this.repository.update(id, patch);
  }

  remove(id: string): Observable<void> {
    return this.repository.remove(id);
  }

  /** Only one season per team can be the current one. */
  setCurrent(id: string): Observable<void> {
    const others = this.seasons().filter((season) => season.id !== id && season.isCurrent);
    return forkJoin([
      this.repository.update(id, { isCurrent: true, status: 'ACTIVE' }),
      ...others.map((season) => this.repository.update(season.id, { isCurrent: false })),
    ]).pipe(map(() => undefined));
  }

  select(id: string): void {
    this.seasonContext.selectSeason(id);
  }

  notifySuccess(message: string): void {
    this.notifications.success(message);
  }

  notifyError(error: unknown): void {
    this.notifications.error(error);
  }
}
