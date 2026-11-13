import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { provideBrnPopoverDefaultOptions } from '@spartan-ng/brain/popover';
import type { BrnOverlayState } from '@spartan-ng/brain/overlay';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import {
  addDays,
  addMonths,
  compareDays,
  formatLongDay,
  isSameMonth,
  MONTH_NAMES,
  startOfMonth,
  toIsoDate,
} from '../../../core/date/calendar-date';
import { formatPeriodo, MAX_PERIOD_DAYS, type Periodo } from '../../../core/date/periodo';
import { TODAY } from '../../../core/date/today';
import { type GridKeyEvent, MonthGrid } from './month-grid';
import {
  EMPTY_RANGE,
  isDayDisabled,
  maxEndDate,
  type RangeDraft,
  type RangeLimits,
  selectDay,
} from './range-selection';

/** Años hacia atrás que ofrece el selector "Año" (además del actual). */
const YEARS_BACK = 4;

let nextId = 0;

/**
 * "Periodo" del reporte: campo `DD/MM/AAAA – DD/MM/AAAA` que abre un calendario de dos meses.
 *
 * - "Desde" y "Año" eligen el mes de la izquierda; "Hasta" muestra el de la derecha (el siguiente).
 * - El primer clic marca el inicio y el segundo el fin. No se pueden elegir fechas futuras ni
 *   rangos de más de `maxDays` días.
 * - El rango solo se publica (`periodoChange`) al pulsar "Aplicar"; cerrar sin aplicar lo descarta.
 */
@Component({
  selector: 'app-period-picker',
  imports: [HlmButton, HlmPopoverImports, HlmSelectImports, MonthGrid, NgIcon],
  providers: [
    provideIcons({ lucideCalendar, lucideChevronLeft, lucideChevronRight }),
    // El rol y el nombre del diálogo los lleva el contenido (`role="dialog"` + `aria-labelledby`).
    provideBrnPopoverDefaultOptions({ role: null }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-2' },
  template: `
    <span [id]="ids.label" class="text-sm leading-5 text-foreground">{{ label() }}</span>

    <hlm-popover
      align="start"
      sideOffset="8"
      [autoFocus]="false"
      [state]="popoverState()"
      (stateChanged)="onStateChange($event)"
    >
      <button
        hlmPopoverTrigger
        type="button"
        class="flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-gris-rafaga bg-card px-3 text-start text-sm transition-colors hover:border-gris-complementario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        [attr.aria-labelledby]="ids.label + ' ' + ids.value"
      >
        <span [id]="ids.value" [class]="periodo() ? 'text-foreground' : 'text-gris-medio'">
          @if (periodo(); as periodo) {
            {{ format(periodo) }}
          } @else {
            <span aria-hidden="true">DD/MM/AAAA – DD/MM/AAAA</span>
            <span class="sr-only">sin seleccionar</span>
          }
        </span>
        <ng-icon
          name="lucideCalendar"
          size="1.5rem"
          class="shrink-0 text-foreground"
          aria-hidden="true"
        />
      </button>

      <!--
        En pantallas bajas el CDK limita la altura del popover al espacio libre: el contenido se
        desplaza dentro (overflow-y-auto) en lugar de salirse de la tarjeta. El mb-2 compensa los
        8px de separación del campo, que el CDK no descuenta de ese espacio.
      -->
      <div
        hlmPopoverContent
        *hlmPopoverPortal="let ctx"
        role="dialog"
        [attr.aria-labelledby]="ids.dialogTitle"
        class="w-[min(40.5rem,calc(100vw-2rem))] mb-2 gap-8 overflow-y-auto overscroll-contain rounded-card border-0 bg-card p-6 shadow-capa-1 ring-0 scrollbar-lista sm:p-8"
      >
        <h2 [id]="ids.dialogTitle" class="sr-only">Elige el periodo del reporte</h2>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div class="flex flex-col gap-2">
            <label [for]="ids.desde" class="text-sm leading-5 text-foreground">Desde</label>
            <hlm-select
              [value]="viewMonth().getMonth()"
              [itemToString]="monthName"
              (valueChange)="onMonthChange($event)"
            >
              <hlm-select-trigger [buttonId]="ids.desde">
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  @for (option of monthOptions(); track option.value) {
                    <hlm-select-item [value]="option.value" [disabled]="option.disabled">
                      {{ option.label }}
                    </hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>

          <div class="flex flex-col gap-2">
            <label [for]="ids.hasta" class="text-sm leading-5 text-foreground">Hasta</label>
            <input
              [id]="ids.hasta"
              type="text"
              disabled
              class="h-10 w-full rounded-lg border border-gris-complementario bg-gris-rafaga px-3 text-base text-gris-oscuro"
              [value]="hastaLabel()"
            />
          </div>

          <div class="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <label [for]="ids.anio" class="text-sm leading-5 text-foreground">Año</label>
            <hlm-select
              class="sm:w-[6.5rem]"
              [value]="viewMonth().getFullYear()"
              (valueChange)="onYearChange($event)"
            >
              <hlm-select-trigger [buttonId]="ids.anio">
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  @for (year of yearOptions(); track year) {
                    <hlm-select-item [value]="year">{{ year }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>
        </div>

        <div
          class="relative grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-0"
        >
          <button
            hlmBtn
            variant="ghost"
            size="icon-sm"
            type="button"
            class="absolute start-0 top-0 data-disabled:opacity-30"
            aria-label="Mes anterior"
            [disabled]="!canGoBack()"
            (click)="shiftView(-1)"
          >
            <ng-icon name="lucideChevronLeft" aria-hidden="true" />
          </button>
          <!-- Único divisor del diseño: entre los dos meses (borde final del primero). -->
          <app-month-grid
            class="sm:border-e sm:border-gris-rafaga sm:pe-4"
            [month]="viewMonth()"
            [draft]="draft()"
            [limits]="limits()"
            [focusDate]="tabbableDate()"
            [previewEnd]="previewEnd()"
            [idPrefix]="ids.grid"
            (daySelected)="onDaySelected($event)"
            (navigate)="onNavigate($event)"
            (focused)="onDayFocus($event)"
            (hovered)="hoveredDate.set($event)"
          />
          <app-month-grid
            class="sm:ps-4"
            [month]="nextMonth()"
            [draft]="draft()"
            [limits]="limits()"
            [focusDate]="tabbableDate()"
            [previewEnd]="previewEnd()"
            [idPrefix]="ids.grid"
            (daySelected)="onDaySelected($event)"
            (navigate)="onNavigate($event)"
            (focused)="onDayFocus($event)"
            (hovered)="hoveredDate.set($event)"
          />
          <button
            hlmBtn
            variant="ghost"
            size="icon-sm"
            type="button"
            class="absolute end-0 top-0 data-disabled:opacity-30"
            aria-label="Mes siguiente"
            [disabled]="!canGoForward()"
            (click)="shiftView(1)"
          >
            <ng-icon name="lucideChevronRight" aria-hidden="true" />
          </button>
        </div>

        <p class="sr-only" aria-live="polite">{{ status() }}</p>

        <div class="flex items-center justify-end gap-6">
          <button
            type="button"
            class="cursor-pointer rounded-sm px-1 text-base font-semibold text-acento transition-colors hover:text-acento-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            (click)="clear()"
          >
            Limpiar
          </button>
          <button
            hlmBtn
            size="sm"
            type="button"
            class="w-[6.5rem] text-base"
            [disabled]="!canApply()"
            (click)="apply()"
          >
            Aplicar
          </button>
        </div>
      </div>
    </hlm-popover>
  `,
})
export class PeriodPicker {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly today = inject(TODAY);

  /** Texto visible del campo. */
  readonly label = input<string>('Periodo');
  /** Periodo aplicado. */
  readonly periodo = input<Periodo | null>(null);
  /** Días máximos entre la fecha inicial y la final. */
  readonly maxDays = input<number>(MAX_PERIOD_DAYS);

  /** Se emite al pulsar "Aplicar" con un rango completo. */
  readonly periodoChange = output<Periodo>();

  private readonly id = nextId++;
  protected readonly ids = {
    label: `app-period-picker-${this.id}-label`,
    value: `app-period-picker-${this.id}-value`,
    dialogTitle: `app-period-picker-${this.id}-title`,
    desde: `app-period-picker-${this.id}-desde`,
    hasta: `app-period-picker-${this.id}-hasta`,
    anio: `app-period-picker-${this.id}-anio`,
    grid: `app-period-picker-${this.id}-dia`,
  };

  protected readonly popoverState = signal<BrnOverlayState | null>(null);
  /** Rango que se está eligiendo; se reinicia al abrir con el periodo aplicado. */
  protected readonly draft = signal<RangeDraft>(EMPTY_RANGE);
  /** Primer día del mes de la izquierda. */
  protected readonly viewMonth = signal<Date>(startOfMonth(this.today()));
  /** Día que recibió el foco por última vez (tabindex itinerante y navegación con teclado). */
  private readonly focusedDate = signal<Date | null>(null);
  protected readonly hoveredDate = signal<Date | null>(null);
  /** Fecha de hoy al abrir el calendario. */
  private readonly todayDate = signal<Date>(this.today());

  protected readonly nextMonth = computed(() => addMonths(this.viewMonth(), 1));
  protected readonly limits = computed<RangeLimits>(() => ({
    today: this.todayDate(),
    maxDays: this.maxDays(),
  }));

  /** Mes más antiguo que se puede mostrar a la izquierda (enero de hace `YEARS_BACK` años). */
  private readonly minViewMonth = computed(
    () => new Date(this.todayDate().getFullYear() - YEARS_BACK, 0, 1),
  );
  /** El mes de la izquierda llega hasta el mes actual. */
  private readonly maxViewMonth = computed(() => startOfMonth(this.todayDate()));

  protected readonly canGoBack = computed(
    () => compareDays(this.viewMonth(), this.minViewMonth()) > 0,
  );
  protected readonly canGoForward = computed(
    () => compareDays(this.viewMonth(), this.maxViewMonth()) < 0,
  );

  protected readonly monthOptions = computed(() => {
    const year = this.viewMonth().getFullYear();
    const max = this.maxViewMonth();
    return MONTH_NAMES.map((label, value) => ({
      label,
      value,
      disabled: compareDays(new Date(year, value, 1), max) > 0,
    }));
  });

  protected readonly yearOptions = computed(() => {
    const current = this.todayDate().getFullYear();
    return Array.from({ length: YEARS_BACK + 1 }, (_, index) => current - YEARS_BACK + index);
  });

  /** "Febrero", o "Enero 2027" si el mes de la derecha es de otro año. */
  protected readonly hastaLabel = computed(() => {
    const next = this.nextMonth();
    const name = MONTH_NAMES[next.getMonth()];
    return next.getFullYear() === this.viewMonth().getFullYear()
      ? name
      : `${name} ${next.getFullYear()}`;
  });

  /** Fin provisional mientras se elige: el día bajo el cursor o, si no hay, el que tiene foco. */
  protected readonly previewEnd = computed(() => {
    const { inicio, fin } = this.draft();
    if (!inicio || fin) {
      return null;
    }
    const candidate = this.hoveredDate() ?? this.focusedDate();
    return candidate && !isDayDisabled(candidate, this.draft(), this.limits()) ? candidate : null;
  });

  /** Único día con `tabindex="0"`: el último con foco, el inicio, hoy o el primero visible. */
  protected readonly tabbableDate = computed(() => {
    const candidates = [this.focusedDate(), this.draft().inicio, this.todayDate()];
    const visible = candidates.find((date) => !!date && this.isVisible(date));
    return visible ?? this.viewMonth();
  });

  protected readonly canApply = computed(() => !!this.draft().inicio && !!this.draft().fin);

  /** Mensaje para lectores de pantalla sobre el paso actual de la selección. */
  protected readonly status = computed(() => {
    const { inicio, fin } = this.draft();
    if (!inicio) {
      return '';
    }
    if (!fin) {
      return `Fecha inicial: ${formatLongDay(inicio)}. Elige la fecha final, hasta el ${formatLongDay(
        maxEndDate(inicio, this.limits()),
      )}.`;
    }
    return `Periodo elegido: del ${formatLongDay(inicio)} al ${formatLongDay(fin)}.`;
  });

  protected format(periodo: Periodo): string {
    return formatPeriodo(periodo);
  }

  protected onStateChange(state: BrnOverlayState): void {
    if (state === 'open' && this.popoverState() !== 'open') {
      this.resetDraft();
      // Como en el patrón "Date Picker Dialog" de ARIA APG, el foco entra en el día elegido (u hoy).
      // Sin desplazar el contenido: en pantallas bajas se sigue viendo la fila Desde / Hasta / Año.
      this.focusDay(this.tabbableDate(), { preventScroll: true });
    }
    this.popoverState.set(state);
  }

  /** Nombre del mes para el valor visible de "Desde". */
  protected readonly monthName = (month: number) => MONTH_NAMES[month] ?? '';

  protected onMonthChange(month: number | null | undefined): void {
    if (typeof month === 'number') {
      this.setView(new Date(this.viewMonth().getFullYear(), month, 1));
    }
  }

  protected onYearChange(year: number | null | undefined): void {
    if (typeof year === 'number') {
      this.setView(new Date(year, this.viewMonth().getMonth(), 1));
    }
  }

  protected shiftView(months: number): void {
    this.setView(addMonths(this.viewMonth(), months));
  }

  protected onDaySelected(day: Date): void {
    this.draft.update((draft) => selectDay(draft, day));
    this.focusedDate.set(day);
  }

  protected onDayFocus(day: Date): void {
    this.focusedDate.set(day);
  }

  protected onNavigate({ day, key }: GridKeyEvent): void {
    const target = navigationTarget(day, key);
    if (!this.isVisible(target)) {
      // Mueve la vista para que el día destino quede en uno de los dos meses.
      this.setView(compareDays(target, this.viewMonth()) < 0 ? target : addMonths(target, -1));
    }
    if (!this.isVisible(target)) {
      return;
    }
    this.focusedDate.set(target);
    this.focusDay(target);
  }

  protected clear(): void {
    this.draft.set(EMPTY_RANGE);
    this.hoveredDate.set(null);
  }

  protected apply(): void {
    const { inicio, fin } = this.draft();
    if (!inicio || !fin) {
      return;
    }
    this.periodoChange.emit({ inicio, fin });
    this.popoverState.set('closed');
  }

  private resetDraft(): void {
    const today = this.today();
    this.todayDate.set(today);
    const periodo = this.periodo();
    this.draft.set(periodo ? { inicio: periodo.inicio, fin: periodo.fin } : EMPTY_RANGE);
    this.hoveredDate.set(null);
    this.focusedDate.set(null);
    // Con periodo, se muestra desde su mes inicial; sin él, el mes anterior y el actual.
    this.viewMonth.set(startOfMonth(periodo ? periodo.inicio : addMonths(today, -1)));
    this.setView(this.viewMonth());
  }

  /** Cambia el mes de la izquierda dentro de los límites. */
  private setView(month: Date): void {
    const first = startOfMonth(month);
    const min = this.minViewMonth();
    const max = this.maxViewMonth();
    this.viewMonth.set(
      compareDays(first, min) < 0 ? min : compareDays(first, max) > 0 ? max : first,
    );
  }

  private isVisible(date: Date): boolean {
    return isSameMonth(date, this.viewMonth()) || isSameMonth(date, this.nextMonth());
  }

  private focusDay(date: Date, options?: FocusOptions): void {
    afterNextRender(
      () => this.document.getElementById(`${this.ids.grid}-${toIsoDate(date)}`)?.focus(options),
      { injector: this.injector },
    );
  }
}

/** Día destino de una tecla de navegación (patrón "Date Picker Dialog" de ARIA APG). */
function navigationTarget(day: Date, key: GridKeyEvent['key']): Date {
  switch (key) {
    case 'ArrowLeft':
      return addDays(day, -1);
    case 'ArrowRight':
      return addDays(day, 1);
    case 'ArrowUp':
      return addDays(day, -7);
    case 'ArrowDown':
      return addDays(day, 7);
    case 'Home':
      return addDays(day, -day.getDay());
    case 'End':
      return addDays(day, 6 - day.getDay());
    case 'PageUp':
    case 'PageDown': {
      const offset = key === 'PageUp' ? -1 : 1;
      const month = addMonths(day, offset);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      return new Date(month.getFullYear(), month.getMonth(), Math.min(day.getDate(), lastDay));
    }
  }
}
