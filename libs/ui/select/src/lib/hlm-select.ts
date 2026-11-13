import { Directive } from '@angular/core';
import {
  BrnPopover,
  provideBrnPopoverConfig,
  provideBrnPopoverDefaultOptions,
} from '@spartan-ng/brain/popover';
import { BrnSelect } from '@spartan-ng/brain/select';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmSelect],hlm-select',
  exportAs: 'hlmSelect',
  providers: [
    provideBrnPopoverConfig({
      align: 'start',
      sideOffset: 6,
    }),
    // El foco se queda en el disparador (aria-activedescendant): la lista no lo recibe al abrir.
    provideBrnPopoverDefaultOptions({ role: null, autoFocus: false }),
  ],
  hostDirectives: [
    {
      directive: BrnSelect,
      inputs: ['disabled', 'value', 'isItemEqualToValue', 'itemToString'],
      outputs: ['valueChange'],
    },
    {
      directive: BrnPopover,
      inputs: [
        'align',
        'closeOnOutsidePointerEvents',
        'sideOffset',
        'state',
        'offsetX',
        'scrollStrategy',
      ],
      outputs: ['stateChanged', 'closed'],
    },
  ],
  host: { 'data-slot': 'select' },
})
export class HlmSelect {
  constructor() {
    classes(() => 'block');
  }
}
