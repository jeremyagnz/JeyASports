import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink],
  template: `
    <div class="status-page">
      <p class="status-page__code">403</p>
      <h1>Sin permisos</h1>
      <p>Tu rol en este equipo no permite ver esta sección.</p>
      <a matButton="filled" routerLink="/app/dashboard">Volver al panel</a>
    </div>
  `,
  styles: `
    .status-page {
      max-width: 480px;
      margin: 0 auto;
      padding: 5rem 1.5rem;
      text-align: center;
    }
    .status-page__code {
      font-family: var(--app-font-numeric);
      font-size: 4rem;
      font-weight: 800;
      color: var(--app-color-accent);
      margin: 0;
    }
  `,
})
export class ForbiddenPage {}
