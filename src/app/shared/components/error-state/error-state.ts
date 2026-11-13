import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideRefreshCw } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

/** Error de carga centrado en el área de la tabla, con reintento. Se anuncia como `role="alert"`. */
@Component({
  selector: 'app-error-state',
  imports: [NgIcon, HlmButton],
  providers: [provideIcons({ lucideCircleAlert, lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'alert',
    class: 'flex max-w-md flex-col items-center gap-4 text-center text-sm',
  },
  template: `
    <ng-icon name="lucideCircleAlert" size="2rem" class="text-destructive" aria-hidden="true" />
    <div class="flex flex-col gap-1">
      <p class="font-semibold text-foreground">{{ title() }}</p>
      <p class="text-gris-medio">{{ description() }}</p>
    </div>
    <button hlmBtn variant="outline" size="sm" type="button" (click)="retry.emit()">
      <ng-icon name="lucideRefreshCw" data-icon="inline-start" aria-hidden="true" />
      {{ retryLabel() }}
    </button>
  `,
})
export class ErrorState {
  readonly title = input<string>('No pudimos cargar la información.');
  readonly description = input<string>('Verifica tu conexión e inténtalo de nuevo.');
  readonly retryLabel = input<string>('Reintentar');

  readonly retry = output<void>();
}
