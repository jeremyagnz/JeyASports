import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { SortDirection } from '../../data/models';

export interface StatColumn<T> {
  readonly key: string;
  readonly label: string;
  readonly tooltip?: string;
  /** Raw value used for sorting. */
  readonly value: (row: T) => number | string;
  /** Formatted value used for display; defaults to the raw value. */
  readonly display?: (row: T) => string;
  readonly sticky?: boolean;
}

/**
 * Dense, sortable statistics table with a frozen first column, the layout
 * convention every box score uses.
 */
@Component({
  selector: 'app-stat-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-table-wrapper">
      <table class="app-stat-table">
        <thead>
          <tr>
            @for (column of columns(); track column.key) {
              <th [title]="column.tooltip ?? column.label" (click)="sortBy(column.key)">
                {{ column.label }}
                @if (sortKey() === column.key) {
                  <span class="stat-table__arrow">{{ sortDirection() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of sortedRows(); track $index) {
            <tr (click)="rowClick.emit(row)" [class.stat-table__row--clickable]="clickable()">
              @for (column of columns(); track column.key) {
                <td>{{ column.display ? column.display(row) : column.value(row) }}</td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columns().length" class="stat-table__empty">
                {{ emptyMessage() }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .stat-table__arrow {
      margin-left: 0.25rem;
      font-size: 0.6rem;
      color: var(--app-color-accent);
    }
    .stat-table__row--clickable {
      cursor: pointer;
    }
    .stat-table__empty {
      text-align: center !important;
      padding: 1.5rem !important;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class StatTable<T> {
  readonly columns = input.required<readonly StatColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly initialSort = input<string | null>(null);
  readonly initialDirection = input<SortDirection>('desc');
  readonly clickable = input(false);
  readonly emptyMessage = input('Sin datos para los filtros seleccionados.');

  readonly rowClick = output<T>();

  private readonly sortKeyState = signal<string | null>(null);
  private readonly sortDirectionState = signal<SortDirection | null>(null);

  readonly sortKey = computed(() => this.sortKeyState() ?? this.initialSort());
  readonly sortDirection = computed(() => this.sortDirectionState() ?? this.initialDirection());

  readonly sortedRows = computed(() => {
    const key = this.sortKey();
    const column = this.columns().find((candidate) => candidate.key === key);
    if (!column) {
      return this.rows();
    }
    const factor = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.rows()].sort((a, b) => {
      const left = column.value(a);
      const right = column.value(b);
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * factor;
      }
      return String(left).localeCompare(String(right)) * factor;
    });
  });

  sortBy(key: string): void {
    if (this.sortKey() === key) {
      this.sortDirectionState.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }
    this.sortKeyState.set(key);
    this.sortDirectionState.set('desc');
  }
}
