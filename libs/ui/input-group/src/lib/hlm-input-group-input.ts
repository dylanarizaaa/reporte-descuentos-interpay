import { Directive } from '@angular/core';
import { HlmInput } from '@spartan-ng/helm/input';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: 'input[hlmInputGroupInput]',
  exportAs: 'hlmInputGroupInput',
  hostDirectives: [HlmInput],
  host: { 'data-slot': 'input-group-control' },
})
export class HlmInputGroupInput {
  constructor() {
    classes(
      () =>
        // El borde y el foco los dibuja el grupo; el texto es de 14px con placeholder Gris medio.
        'h-full flex-1 rounded-none border-0 bg-transparent px-0 text-sm text-foreground shadow-none ring-0 placeholder:text-gris-medio focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 data-[matches-spartan-invalid=true]:ring-0 dark:bg-transparent dark:disabled:bg-transparent',
    );
  }
}
