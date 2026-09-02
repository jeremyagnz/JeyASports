import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { TeamRole } from '../../../data/models';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { AdministrationFacade, TeamMember } from '../administration.facade';
import { AdministrationNav } from '../components/administration-nav';
import { MemberFormDialog } from '../components/member-form-dialog';

@Component({
  selector: 'app-members-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, EmptyState, PageHeader, AdministrationNav,
  ],
  templateUrl: './members-page.html',
  styleUrl: './members-page.scss',
})
export class MembersPage {
  readonly facade = inject(AdministrationFacade);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);

  readonly roles: readonly TeamRole[] = ['OWNER', 'ADMIN', 'VIEWER'];

  add(): void {
    this.dialog.open(MemberFormDialog, { data: { roles: this.roles } }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.facade.addMember(result.displayName, result.email, result.role).subscribe({
        next: () => this.facade.notifySuccess('Miembro agregado al equipo.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
    });
  }

  isSelf(member: TeamMember): boolean {
    return member.membership.userId === this.auth.currentUser()?.id;
  }

  changeRole(member: TeamMember, role: TeamRole): void {
    if (role === member.membership.role) {
      return;
    }
    this.facade.updateRole(member.membership.id, role).subscribe({
      next: () => this.facade.notifySuccess('Rol actualizado.'),
      error: (error: unknown) => this.facade.notifyError(error),
    });
  }

  remove(member: TeamMember): void {
    this.confirm
      .confirm({
        title: 'Quitar miembro',
        message: `${member.user?.displayName ?? 'El usuario'} perderá el acceso a este equipo.`,
        confirmLabel: 'Quitar',
        destructive: true,
      })
      .pipe(
        switchMap((confirmed) =>
          confirmed ? this.facade.removeMember(member.membership.id) : [],
        ),
      )
      .subscribe({
        next: () => this.facade.notifySuccess('Miembro eliminado del equipo.'),
        error: (error: unknown) => this.facade.notifyError(error),
      });
  }
}
