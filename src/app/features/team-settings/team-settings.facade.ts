import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TeamContextService } from '../../core/context/team-context.service';
import { NotificationService } from '../../core/services/notification.service';
import { Team, UpdateDto } from '../../data/models';
import { TEAM_REPOSITORY } from '../../data/repositories/abstract/tokens';

/** Team profile, venues and opponents administration. */
@Injectable({ providedIn: 'root' })
export class TeamSettingsFacade {
  private readonly teams = inject(TEAM_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly notifications = inject(NotificationService);

  readonly team = this.teamContext.activeTeam;

  updateTeam(patch: UpdateDto<Team>): Observable<Team> {
    return this.teams.update(this.teamContext.requireTeamId(), patch);
  }

  notifySuccess(message: string): void {
    this.notifications.success(message);
  }

  notifyError(error: unknown): void {
    this.notifications.error(error);
  }
}
