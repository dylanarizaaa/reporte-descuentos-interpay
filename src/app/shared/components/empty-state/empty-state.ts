import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * "No hay datos" del handoff: ícono `file-search-02` y texto centrado de 14px con 8px de
 * separación. El texto usa Gris medio (y no Gris complementario como el handoff) para cumplir el
 * contraste AA; el ícono es decorativo y sí va en Gris complementario.
 *
 * Cada línea de `lines` es un párrafo corto (el diseño parte la descripción en dos líneas).
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex max-w-md flex-col items-center gap-2 text-center text-sm text-gris-medio' },
  template: `
    <svg
      viewBox="0 0 24 24"
      class="size-7 text-gris-complementario"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M11 22H8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v5" />
      <path d="M8 7h7M8 11h5M8 15h1.5" />
      <circle cx="16.5" cy="17.5" r="2.75" />
      <path d="m18.5 19.5 2.5 2.5" />
    </svg>
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
