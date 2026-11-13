import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import type { PeriodoProcesado } from '../../../core/data-access/periodos-descuento.model';
import { isSameDay } from '../../../core/date/calendar-date';
import { formatPeriodo, type Periodo } from '../../../core/date/periodo';

let nextId = 0;

/**
 * "Año" y "Periodo" de los descuentos automáticos: los periodos no se eligen libremente, son los
 * ya procesados que devuelve `ObtenerPeriodosDescuento` para el año elegido.
 *
 * - "Año" lo controla quien usa el componente (`anio` / `anioChange`), porque los periodos se
 *   piden por año.
 * - "Periodo" lista los periodos recibidos en orden cronológico. Cambiar de año borra el periodo.
 */
@Component({
  selector: 'app-processed-period-select',
  imports: [HlmSelectImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-end gap-4' },
  template: `
    <div class="flex w-24 flex-col gap-2">
      <label [for]="ids.anio" class="text-sm leading-5 text-foreground">Año</label>
      <hlm-select
        [value]="anio() ?? undefined"
        [disabled]="anios().length === 0"
        (valueChange)="onYearChange($event)"
      >
        <hlm-select-trigger [buttonId]="ids.anio">
          <hlm-select-value placeholder="AAAA" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          <hlm-select-group>
            @for (year of anios(); track year) {
              <hlm-select-item [value]="year">{{ year }}</hlm-select-item>
            }
          </hlm-select-group>
        </hlm-select-content>
      </hlm-select>
    </div>

    <div class="flex w-full flex-col gap-2 sm:w-[18.875rem]">
      <label [for]="ids.periodo" class="text-sm leading-5 text-foreground">Periodo</label>
      <hlm-select
        [value]="periodoId()"
        [itemToString]="periodoLabel"
        [disabled]="loading() || periodosOrdenados().length === 0"
        (valueChange)="onPeriodChange($event)"
      >
        <hlm-select-trigger [buttonId]="ids.periodo">
          <hlm-select-value [placeholder]="placeholder()" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          <hlm-select-group>
            @for (periodo of periodosOrdenados(); track periodo.id) {
              <hlm-select-item [value]="periodo.id">{{ format(periodo) }}</hlm-select-item>
            }
          </hlm-select-group>
        </hlm-select-content>
      </hlm-select>
    </div>

    @if (error()) {
      <p role="alert" class="basis-full text-sm text-destructive">
        No pudimos cargar los periodos.
        <button
          type="button"
          class="cursor-pointer font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
          (click)="retry.emit()"
        >
          Reintentar
        </button>
      </p>
    }
  `,
})
export class ProcessedPeriodSelect {
  /** Años que se pueden consultar, en el orden en que se muestran. */
  readonly anios = input<readonly number[]>([]);
  /** Año elegido (`null` sin año: no hay periodos que mostrar). */
  readonly anio = input<number | null>(null);
  /** Periodos procesados del año elegido (en cualquier orden). */
  readonly periodos = input<readonly PeriodoProcesado[]>([]);
  /** Periodo elegido. */
  readonly value = input<Periodo | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);

  /** Año elegido por el usuario. */
  readonly anioChange = output<number>();
  /** Periodo elegido, o `null` al cambiar de año. */
  readonly valueChange = output<Periodo | null>();
  readonly retry = output<void>();

  private readonly id = nextId++;
  protected readonly ids = {
    anio: `app-processed-period-select-${this.id}-anio`,
    periodo: `app-processed-period-select-${this.id}-periodo`,
  };

  protected readonly periodosOrdenados = computed(() =>
    [...this.periodos()].sort((a, b) => a.inicio.getTime() - b.inicio.getTime()),
  );

  /** Id del periodo procesado que coincide con el elegido (`undefined` sin coincidencia). */
  protected readonly periodoId = computed(() => {
    const value = this.value();
    return value
      ? this.periodos().find(
          (periodo) => isSameDay(periodo.inicio, value.inicio) && isSameDay(periodo.fin, value.fin),
        )?.id
      : undefined;
  });

  protected readonly placeholder = computed(() => {
    if (this.loading()) {
      return 'Cargando periodos…';
    }
    return this.anio() !== null && this.periodos().length === 0 && !this.error()
      ? 'Sin periodos procesados'
      : 'DD/MM/AAAA – DD/MM/AAAA';
  });

  private readonly labels = computed(
    () => new Map(this.periodos().map((periodo) => [periodo.id, formatPeriodo(periodo)])),
  );

  /** Texto visible del periodo elegido en el disparador. */
  protected readonly periodoLabel = (id: number) => this.labels().get(id) ?? '';

  protected format(periodo: PeriodoProcesado): string {
    return formatPeriodo(periodo);
  }

  protected onYearChange(year: number | null | undefined): void {
    if (typeof year !== 'number' || year === this.anio()) {
      return;
    }
    this.anioChange.emit(year);
    if (this.value()) {
      this.valueChange.emit(null);
    }
  }

  protected onPeriodChange(id: number | null | undefined): void {
    const periodo = this.periodos().find((item) => item.id === id);
    if (periodo) {
      this.valueChange.emit({ inicio: periodo.inicio, fin: periodo.fin });
    }
  }
}
