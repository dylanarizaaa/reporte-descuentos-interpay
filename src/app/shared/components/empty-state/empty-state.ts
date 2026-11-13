import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileSearch } from '@ng-icons/lucide';

/**
 * Mensaje centrado para una tabla sin filas: "Elige un periodo…" o "No se encontraron registros".
 * Cada línea de `lines` es un párrafo corto (el diseño parte la descripción en dos líneas).
 */
@Component({
  selector: 'app-empty-state',
  imports: [NgIcon],
  providers: [provideIcons({ lucideFileSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex max-w-md flex-col items-center gap-2 text-center text-sm text-gris-medio' },
  template: `
    <ng-icon
      name="lucideFileSearch"
      size="2rem"
      strokeWidth="1.5"
      class="mb-1 text-gris-oscuro"
      aria-hidden="true"
    />
    @if (title(); as title) {
      <p class="font-semibold">{{ title }}</p>
    }
    <div>
      @for (line of lines(); track $index) {
        <p>{{ line }}</p>
      }
    </div>
  `,
})
export class EmptyState {
  readonly title = input<string>('');
  readonly lines = input<readonly string[]>([]);
}
