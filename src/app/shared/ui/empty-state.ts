import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon() }}</mat-icon>
      <p class="empty-state__title">{{ title() }}</p>
      @if (message()) {
        <p class="empty-state__message">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    .empty-state__title {
      margin: 0;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }
    .empty-state__message {
      margin: 0;
      max-width: 32rem;
    }
  `,
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly message = input('');
}
