import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideLoaderCircle, lucideMail } from '@ng-icons/lucide';
import { BrnDialogClose } from '@spartan-ng/brain/dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { finalize, type Observable } from 'rxjs';
import { ApiError } from '../../../core/http/api-response';

/** Textos del modal; cada reporte del diseño usa los suyos. */
export interface SendReportTexts {
  readonly title: string;
  readonly description: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly successTitle: string;
  readonly successDescription: string;
  readonly successCloseLabel: string;
}

/** Textos del "Reporte de ventas con descuento". */
export const DEFAULT_SEND_REPORT_TEXTS: SendReportTexts = {
  title: '¿Enviar el reporte por correo?',
  description: 'En máximo 30 minutos recibirás un enlace de descarga válido por 1 hora.',
  cancelLabel: 'No enviar',
  confirmLabel: 'Enviar',
  successTitle: 'Tu reporte está en camino',
  successDescription: 'Ya puedes cerrar esta ventana y continuar con tu operación.',
  successCloseLabel: 'Cerrar',
};

/** Paso del flujo "Enviar reporte". */
type Paso = 'confirmar' | 'enviado';

let nextId = 0;

/**
 * Flujo "Enviar reporte": confirma el envío, ejecuta `request` (la petición que genera el archivo)
 * y muestra el aviso de envío. Si la solicitud falla, el modal sigue abierto con el error y se
 * puede reintentar.
 *
 * El correo destino lo resuelve el backend con el token de sesión que agrega el orquestador.
 */
@Component({
  selector: 'app-send-report-dialog',
  imports: [BrnDialogClose, HlmAlertDialogImports, HlmButton, NgIcon],
  providers: [provideIcons({ lucideCircleCheck, lucideLoaderCircle, lucideMail })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let textos = texts();
    <hlm-alert-dialog
      [state]="open() ? 'open' : 'closed'"
      [disableClose]="enviando()"
      autoFocus="[data-dialog-primary]"
      (closed)="onClosed()"
    >
      <hlm-alert-dialog-content
        *hlmAlertDialogPortal="let ctx"
        class="flex w-[calc(100vw-2rem)] flex-col items-center gap-6 rounded-card bg-card p-8 text-center ring-0 shadow-capa-1 data-[size=default]:max-w-[25rem] data-[size=default]:sm:max-w-[25rem]"
      >
        @if (paso() === 'confirmar') {
          <ng-icon
            name="lucideMail"
            size="3.25rem"
            strokeWidth="2.25"
            class="text-advertencia"
            aria-hidden="true"
          />
          <div class="flex flex-col gap-4">
            <h2 hlmAlertDialogTitle class="text-lg leading-6">{{ textos.title }}</h2>
            <p hlmAlertDialogDescription class="text-base leading-5 text-gris-medio">
              {{ textos.description }}
            </p>
            @if (error(); as error) {
              <p role="alert" class="text-sm text-destructive">{{ error }}</p>
            }
          </div>
          <div class="grid w-full grid-cols-2 gap-6">
            <button
              hlmAlertDialogCancel
              size="sm"
              class="border-gris-complementario text-base text-foreground"
              [disabled]="enviando()"
            >
              {{ textos.cancelLabel }}
            </button>
            <button
              hlmBtn
              size="sm"
              type="button"
              class="text-base"
              data-dialog-primary
              [disabled]="enviando()"
              (click)="enviar()"
            >
              @if (enviando()) {
                <ng-icon
                  name="lucideLoaderCircle"
                  class="animate-spin"
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                Enviando…
              } @else {
                {{ textos.confirmLabel }}
              }
            </button>
          </div>
        } @else {
          <ng-icon
            name="lucideCircleCheck"
            size="3.25rem"
            strokeWidth="2.25"
            class="text-exito"
            aria-hidden="true"
          />
          <div class="flex flex-col gap-4">
            <h2 hlmAlertDialogTitle class="text-lg leading-6">{{ textos.successTitle }}</h2>
            <p hlmAlertDialogDescription class="text-base leading-5 text-gris-medio">
              {{ textos.successDescription }}
            </p>
          </div>
          <button
            hlmBtn
            brnDialogClose
            size="sm"
            type="button"
            class="w-full text-base"
            [id]="cerrarId"
          >
            {{ textos.successCloseLabel }}
          </button>
        }
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
  `,
})
export class SendReportDialog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  /** Abre o cierra el modal. */
  readonly open = input<boolean>(false);
  /** Petición que genera y envía el reporte; se ejecuta al confirmar. */
  readonly request = input.required<() => Observable<unknown>>();
  readonly texts = input<SendReportTexts>(DEFAULT_SEND_REPORT_TEXTS);

  /** El usuario cerró el modal (cancelar, cerrar o Escape). */
  readonly closed = output<void>();

  protected readonly paso = signal<Paso>('confirmar');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cerrarId = `app-send-report-dialog-cerrar-${nextId++}`;

  protected enviar(): void {
    this.enviando.set(true);
    this.error.set(null);
    this.request()()
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.paso.set('enviado');
          // El botón de confirmar desaparece: el foco pasa al de cierre para no perderse.
          afterNextRender(() => this.document.getElementById(this.cerrarId)?.focus(), {
            injector: this.injector,
          });
        },
        error: (error: unknown) =>
          this.error.set(
            error instanceof ApiError
              ? error.message
              : 'No pudimos enviar el reporte. Inténtalo de nuevo.',
          ),
      });
  }

  protected onClosed(): void {
    // Vuelve al primer paso para el próximo envío.
    this.paso.set('confirmar');
    this.error.set(null);
    this.closed.emit();
  }
}
