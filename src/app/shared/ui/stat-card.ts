import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Dense metric tile used across the dashboard and player pages. */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card">
      <span class="stat-card__label">{{ label() }}</span>
      <span class="stat-card__value">{{ value() }}</span>
      @if (hint()) {
        <span class="stat-card__hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: `
    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.9rem 1rem;
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-raised);
      border: 1px solid var(--app-color-border);
    }
    .stat-card__label {
      font-size: 0.7rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
      font-weight: 700;
    }
    .stat-card__value {
      font-family: var(--app-font-numeric);
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.1;
    }
    .stat-card__hint {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input('');
}
