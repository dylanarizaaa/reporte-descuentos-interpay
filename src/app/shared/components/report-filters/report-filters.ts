import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSendHorizontal } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import type { Periodo } from '../../../core/date/periodo';
import type { ConsultaReporte } from '../../../core/routing/report-query';
import { SearchField } from '../search-field/search-field';

/**
 * Filtros de los reportes: el campo de periodo de cada pantalla (contenido proyectado con
 * `appReportPeriod`), "Buscar por No. identificación", "Consultar" y, a la derecha,
 * "Enviar reporte".
 *
 * - "Consultar" se activa con un periodo elegido y emite el periodo y la búsqueda (Enter en el
 *   buscador también consulta).
 * - El buscador refleja la cédula consultada y solo se habilita con `busquedaHabilitada`.
 *
 * ```html
 * <app-report-filters [periodo]="periodoElegido()" …>
 *   <app-period-picker appReportPeriod … />
 * </app-report-filters>
 * ```
 */
@Component({
  selector: 'app-report-filters',
  imports: [HlmButton, NgIcon, ReactiveFormsModule, SearchField],
  providers: [provideIcons({ lucideSendHorizontal })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-end gap-4' },
  template: `
    <form
      class="flex flex-wrap items-end gap-4"
      aria-label="Filtros del reporte"
      (submit)="onSubmit($event)"
    >
      <ng-content select="[appReportPeriod]" />

      <app-search-field
        class="w-full sm:w-[17.5rem]"
        disabledHint="Disponible cuando la consulta del periodo trae registros."
        [formControl]="busqueda"
      />

      <button
        hlmBtn
        size="sm"
        type="submit"
        class="w-full text-base sm:w-[7.75rem]"
        [disabled]="!periodo()"
      >
        Consultar
      </button>
    </form>

    <button
      type="button"
      class="ms-auto inline-flex h-10 cursor-pointer items-center gap-1 rounded-lg px-1 text-base font-semibold text-acento transition-colors hover:text-acento-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:text-disabled"
      [disabled]="!envioHabilitado()"
      (click)="enviar.emit()"
    >
      Enviar reporte
      <ng-icon name="lucideSendHorizontal" size="1.5rem" strokeWidth="1.5" aria-hidden="true" />
    </button>
  `,
})
export class ReportFilters {
  /** Periodo elegido en el campo proyectado (aún sin consultar); sin él no se puede consultar. */
  readonly periodo = input<Periodo | null>(null);
  /** No. de identificación consultado. */
  readonly cedula = input<string>('');
  readonly busquedaHabilitada = input<boolean>(false);
  /** "Enviar reporte" activo (hay resultados). */
  readonly envioHabilitado = input<boolean>(false);

  readonly consultar = output<ConsultaReporte>();
  readonly enviar = output<void>();

  protected readonly busqueda = new FormControl('', { nonNullable: true });

  constructor() {
    // El buscador refleja la cédula de la URL y se habilita solo con registros.
    effect(() => this.busqueda.setValue(this.cedula(), { emitEvent: false }));
    effect(() => {
      if (this.busquedaHabilitada()) {
        this.busqueda.enable({ emitEvent: false });
      } else {
        this.busqueda.disable({ emitEvent: false });
      }
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const periodo = this.periodo();
    if (!periodo) {
      return;
    }
    this.consultar.emit({
      periodo,
      cedula: this.busqueda.enabled ? this.busqueda.value.trim() : '',
    });
  }
}
