import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  formatLongDay,
  isSameDay,
  isSameMonth,
  MONTH_NAMES,
  monthWeeks,
  toIsoDate,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT_NAMES,
} from '../../../core/date/calendar-date';
import {
  dayRangeState,
  type DayRangeState,
  isDayDisabled,
  type RangeDraft,
  type RangeLimits,
} from './range-selection';

/** Teclas de navegación de la grilla (patrón "Date Picker Dialog" de ARIA APG). */
export type GridKey =
  'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End' | 'PageUp' | 'PageDown';

const GRID_KEYS = new Set<string>([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

export interface GridKeyEvent {
  readonly day: Date;
  readonly key: GridKey;
  readonly shiftKey: boolean;
}

interface DayCell {
  readonly date: Date;
  readonly iso: string;
  readonly inMonth: boolean;
  readonly label: string;
  readonly disabled: boolean;
  readonly state: DayRangeState;
  readonly tabbable: boolean;
}

/** Clases del círculo de cada día según su estado en el rango. */
const DAY_CLASS: Readonly<Record<DayRangeState, string>> = {
  selected: 'bg-acento text-blanco-digital',
  inside: 'bg-badge-info text-foreground',
  none: 'text-foreground hover:bg-gris-espacial',
};

/**
 * Un mes del selector de periodo como grilla accesible (`role="grid"`). No guarda estado: el
 * rango, el día con foco y los límites los maneja `app-period-picker`.
 */
@Component({
  selector: 'app-month-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  template: `
    <h3 [id]="headingId()" class="text-center text-base leading-6 font-semibold text-foreground">
      {{ monthName() }}<span class="sr-only"> {{ month().getFullYear() }}</span>
    </h3>
    <table role="grid" class="w-full border-collapse" [attr.aria-labelledby]="headingId()">
      <thead>
        <tr>
          @for (weekday of weekdays; track weekday.short) {
            <th
              scope="col"
              class="pb-3 text-center text-xs font-normal text-gris-medio"
              [attr.abbr]="weekday.long"
            >
              {{ weekday.short }}
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (week of weeks(); track $index) {
          <tr>
            @for (day of week; track day.iso) {
              @if (day.inMonth) {
                <td
                  role="gridcell"
                  class="p-0 text-center"
                  [attr.aria-selected]="day.state !== 'none'"
                >
                  <button
                    type="button"
                    class="mx-auto my-0.5 flex size-[2.375rem] cursor-pointer items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:cursor-default aria-disabled:text-gris-complementario aria-disabled:hover:bg-transparent"
                    [class]="dayClass(day)"
                    [id]="dayId(day)"
                    [attr.data-date]="day.iso"
                    [attr.tabindex]="day.tabbable ? 0 : -1"
                    [attr.aria-label]="day.label"
                    [attr.aria-disabled]="day.disabled || null"
                    [attr.aria-current]="day.iso === todayIso() ? 'date' : null"
                    (click)="onSelect(day)"
                    (keydown)="onKeydown($event, day)"
                    (focus)="focused.emit(day.date)"
                    (mouseenter)="hovered.emit(day.date)"
                    (mouseleave)="hovered.emit(null)"
                  >
                    {{ day.date.getDate() }}
                  </button>
                </td>
              } @else {
                <!-- Días de los meses vecinos: solo completan la semana, no se pueden elegir. -->
                <td class="p-0 text-center text-sm text-gris-medio">
                  <span
                    class="mx-auto my-0.5 flex size-[2.375rem] items-center justify-center"
                    aria-hidden="true"
                  >
                    {{ day.date.getDate() }}
                  </span>
                </td>
              }
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class MonthGrid {
  /** Primer día del mes que se muestra. */
  readonly month = input.required<Date>();
  readonly draft = input.required<RangeDraft>();
  readonly limits = input.required<RangeLimits>();
  /** Día que recibe el foco con Tab (tabindex itinerante); `null` si está en el otro mes. */
  readonly focusDate = input<Date | null>(null);
  /** Día bajo el cursor o con foco para la vista previa del rango. */
  readonly previewEnd = input<Date | null>(null);
  /** Prefijo de los ids de los días (`<prefijo>-AAAA-MM-DD`) para mover el foco entre meses. */
  readonly idPrefix = input.required<string>();

  readonly daySelected = output<Date>();
  readonly navigate = output<GridKeyEvent>();
  readonly focused = output<Date>();
  readonly hovered = output<Date | null>();

  protected readonly weekdays = WEEKDAY_SHORT_NAMES.map((short, index) => ({
    short,
    long: WEEKDAY_NAMES[index],
  }));

  protected readonly headingId = computed(
    () => `${this.idPrefix()}-mes-${toIsoDate(this.month())}`,
  );
  protected readonly monthName = computed(() => MONTH_NAMES[this.month().getMonth()]);
  protected readonly todayIso = computed(() => toIsoDate(this.limits().today));

  protected readonly weeks = computed<DayCell[][]>(() => {
    const month = this.month();
    const draft = this.draft();
    const limits = this.limits();
    const focusDate = this.focusDate();
    const previewEnd = this.previewEnd();
    return monthWeeks(month).map((week) =>
      week.map((date) => {
        const inMonth = isSameMonth(date, month);
        return {
          date,
          iso: toIsoDate(date),
          inMonth,
          label: formatLongDay(date),
          disabled: isDayDisabled(date, draft, limits),
          state: inMonth ? dayRangeState(date, draft, previewEnd) : 'none',
          tabbable: inMonth && isSameDay(date, focusDate),
        };
      }),
    );
  });

  protected dayId(day: DayCell): string {
    return `${this.idPrefix()}-${day.iso}`;
  }

  protected dayClass(day: DayCell): string {
    return day.disabled && day.state === 'none' ? '' : DAY_CLASS[day.state];
  }

  protected onSelect(day: DayCell): void {
    if (!day.disabled) {
      this.daySelected.emit(day.date);
    }
  }

  protected onKeydown(event: KeyboardEvent, day: DayCell): void {
    if (!GRID_KEYS.has(event.key)) {
      return;
    }
    event.preventDefault();
    this.navigate.emit({ day: day.date, key: event.key as GridKey, shiftKey: event.shiftKey });
  }
}
