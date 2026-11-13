import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSendHorizontal } from '@ng-icons/lucide';

/**
 * Acción "Enviar ▷" de una fila (columna "Acciones"). El nombre accesible empieza por el texto
 * visible y nombra la fila: "Enviar reporte de Carlos Rodríguez".
 */
@Component({
  selector: 'app-send-cell',
  imports: [NgIcon],
  providers: [provideIcons({ lucideSendHorizontal })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      type="button"
      class="-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 text-base font-semibold text-acento transition-colors hover:text-acento-oscuro focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-75"
      [attr.aria-label]="ariaLabel()"
      (click)="send()()"
      [disabled]="disabled()"
    >
      {{ label() }}
      <ng-icon name="lucideSendHorizontal" size="1.5rem" strokeWidth="1.5" aria-hidden="true" />
    </button>
  `,
})
export class SendCell {
  readonly label = input<string>('Enviar');
  readonly ariaLabel = input.required<string>();
  readonly send = input.required<() => void>();
  public readonly disabled = input<boolean>(true);
}
