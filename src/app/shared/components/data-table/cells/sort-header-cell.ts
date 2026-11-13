import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { injectTableHeaderContext } from '@tanstack/angular-table';

/**
 * Encabezado ordenable ("Casilla Título" con flechas). Se usa desde una definición de columna:
 *
 * ```ts
 * header: () => flexRenderComponent(SortHeaderCell, { inputs: { label: 'Número de casos' } })
 * ```
 *
 * El estado accesible (`aria-sort`) lo publica `app-data-table` en el `<th>`.
 */
@Component({
  selector: 'app-sort-header-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (canSort()) {
      <button
        type="button"
        class="-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        [class.text-foreground]="direction()"
        (click)="toggle($event)"
      >
        {{ label() }}
        <!-- "ordering" del handoff: 10.67 × 16 con flechas de 6 × 3 en Gris medio. -->
        <svg viewBox="0 0 32 48" class="h-4 w-[0.667rem] shrink-0" aria-hidden="true">
          <path
            d="M16 12 25 21H7z"
            [attr.fill-opacity]="direction() === 'desc' ? 0.3 : 1"
            fill="currentColor"
          />
          <path
            d="M16 36 7 27h18z"
            [attr.fill-opacity]="direction() === 'asc' ? 0.3 : 1"
            fill="currentColor"
          />
        </svg>
      </button>
    } @else {
      {{ label() }}
    }
  `,
})
export class SortHeaderCell {
  private readonly header = injectTableHeaderContext();

  /** Texto visible del encabezado. */
  readonly label = input.required<string>();

  protected readonly canSort = computed(() => this.header().column.getCanSort());
  protected readonly direction = computed(() => this.header().column.getIsSorted());

  protected toggle(event: Event): void {
    this.header().column.getToggleSortingHandler()?.(event);
  }
}
