import { BooleanInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { BrnSelectContent, BrnSelectList } from '@spartan-ng/brain/select';
import { classes, hlm } from '@spartan-ng/helm/utils';
import { HlmSelectScrollDown } from './hlm-select-scroll-down';
import { HlmSelectScrollUp } from './hlm-select-scroll-up';

@Component({
  selector: 'hlm-select-content',
  exportAs: 'hlmSelectContent',
  imports: [HlmSelectScrollUp, HlmSelectScrollDown, BrnSelectList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnSelectContent],
  // La lista se desplaza: debe poder recibir foco con teclado (axe: scrollable-region-focusable).
  // En la práctica el teclado sigue en el disparador (aria-activedescendant) y Tab cierra la lista.
  host: { tabindex: '0' },
  template: `
    @if (showScroll()) {
      <hlm-select-scroll-up />
    }

    <div brnSelectList [class]="_computedListboxClasses()">
      <ng-content />
    </div>

    @if (showScroll()) {
      <hlm-select-scroll-down />
    }
  `,
})
export class HlmSelectContent {
  protected readonly _computedListboxClasses = computed(() => hlm('flex flex-col'));

  public readonly showScroll = input<boolean, BooleanInput>(false, { transform: booleanAttribute });

  constructor() {
    classes(
      () =>
        // Lista desplegable del sistema de diseño: tarjeta blanca redondeada, sombra "1° Capa" y
        // barra de desplazamiento visible (Gris complementario sobre Gris espacial).
        'bg-card text-foreground scrollbar-lista data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-h-[13.5rem] min-w-24 flex-col rounded-xl py-1.5 shadow-capa-1 duration-100 relative flex w-(--brn-select-width) overflow-x-hidden overflow-y-auto',
    );
  }
}
