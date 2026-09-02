import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button matIconButton [matMenuTriggerFor]="menu" aria-label="Cuenta">
      <mat-icon>account_circle</mat-icon>
    </button>
    <mat-menu #menu="matMenu">
      <div class="user-menu__header">
        <strong>{{ auth.currentUser()?.displayName }}</strong>
        <span>{{ auth.currentUser()?.email }}</span>
        <span class="user-menu__role">{{ auth.activeRole() }}</span>
      </div>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        Cerrar sesión
      </button>
    </mat-menu>
  `,
  styles: `
    .user-menu__header {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--app-color-border);
      font-size: 0.85rem;
    }
    .user-menu__role {
      color: var(--app-color-accent);
      font-weight: 700;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
    }
  `,
})
export class UserMenu {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
