import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrnSelectItem } from '@spartan-ng/brain/select';
import { classes } from '@spartan-ng/helm/utils';

@Component({
  selector: 'hlm-select-item',
  exportAs: 'hlmSelectItem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnSelectItem, inputs: ['id', 'disabled', 'value'] }],
  host: { 'data-slot': 'select-item' },
  template: `<ng-content />`,
})
export class HlmSelectItem {
  constructor() {
    classes(
      () =>
        // Opción de 40px con texto de 16px; resaltada en Gris inicial y la elegida en SemiBold.
        'data-highlighted:bg-gris-inicial aria-selected:font-semibold gap-2 rounded-lg h-10 shrink-0 px-3 text-base text-foreground relative flex w-full cursor-pointer items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:text-gris-complementario [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0',
    );
  }
}
