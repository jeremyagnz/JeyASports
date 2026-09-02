import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TeamRole } from '../../data/models';
import { PermissionService } from '../services/permission.service';

/**
 * Phase 1 role gate. It only hides UI; Phase 2 backs it with RLS policies.
 */
export function roleGuard(...roles: readonly TeamRole[]): CanActivateFn {
  return () => {
    const permissions = inject(PermissionService);
    const router = inject(Router);
    return permissions.hasAnyRole(roles) ? true : router.createUrlTree(['/403']);
  };
}
