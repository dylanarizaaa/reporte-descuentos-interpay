import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';

let nextId = 0;

/**
 * Buscador del sistema de diseño sobre el input group de spartan: lupa a la izquierda y, con
 * texto, un botón para limpiarlo ("Buscar por No. identificación"). Se usa con `formControl`.
 */
@Component({
  selector: 'app-search-field',
  imports: [HlmInputGroupImports, NgIcon],
  providers: [
    provideIcons({ lucideSearch, lucideX }),
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchField), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label [for]="inputId" class="sr-only">{{ label() }}</label>
    <div hlmInputGroup>
      <div hlmInputGroupAddon>
        <ng-icon name="lucideSearch" aria-hidden="true" />
      </div>
      <input
        hlmInputGroupInput
        type="text"
        autocomplete="off"
        [id]="inputId"
        [attr.maxlength]="maxLength()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        [attr.aria-describedby]="disabled() && disabledHint() ? hintId : null"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (value() && !disabled()) {
        <div hlmInputGroupAddon align="inline-end">
          <button
            hlmInputGroupButton
            size="icon-xs"
            type="button"
            class="text-gris-oscuro hover:bg-gris-espacial focus-visible:outline-2 focus-visible:outline-ring"
            [attr.aria-label]="'Limpiar ' + label().toLowerCase()"
            (click)="clear()"
          >
            <ng-icon name="lucideX" size="1.25rem" aria-hidden="true" />
          </button>
        </div>
      }
    </div>
    @if (disabledHint()) {
      <span [id]="hintId" class="sr-only">{{ disabledHint() }}</span>
    }
  `,
})
export class SearchField implements ControlValueAccessor {
  private readonly document = inject(DOCUMENT);

  /** Nombre accesible del campo (la etiqueta no se ve; el placeholder no basta). */
  readonly label = input<string>('Buscar por No. identificación');
  readonly placeholder = input<string>('Buscar por No. identificación');
  readonly maxLength = input<number>(20);
  /** Explicación para lectores de pantalla de por qué el campo está inactivo. */
  readonly disabledHint = input<string>('');

  protected readonly inputId = `app-search-field-${nextId}`;
  protected readonly hintId = `app-search-field-hint-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  /** Borra el texto y devuelve el foco al campo (el botón desaparece). */
  protected clear(): void {
    this.value.set('');
    this.onChange('');
    this.document.getElementById(this.inputId)?.focus();
  }
}
