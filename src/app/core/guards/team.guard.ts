import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TeamContextService } from '../context/team-context.service';

/** Blocks tenant routes until an active team is selected. */
export const teamGuard: CanActivateFn = () => {
  const teamContext = inject(TeamContextService);
  const router = inject(Router);
  return teamContext.activeTeamId() ? true : router.createUrlTree(['/select-team']);
};
