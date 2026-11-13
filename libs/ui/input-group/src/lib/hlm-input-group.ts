import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmInputGroup],hlm-input-group',
  exportAs: 'hlmInputGroup',
  host: {
    'data-slot': 'input-group',
    role: 'group',
  },
})
export class HlmInputGroup {
  constructor() {
    classes(
      () =>
        // "Campos" del sistema de diseño: 40px, borde Gris ráfaga, fondo Blanco digital y Gris inicial
        // cuando está inactivo. El foco del control se marca en todo el grupo.
        'group/input-group relative flex h-10 w-full min-w-0 items-center rounded-lg border border-gris-rafaga bg-card transition-colors outline-none has-[[data-slot=input-group-control]:focus-visible]:outline-2 has-[[data-slot=input-group-control]:focus-visible]:outline-offset-2 has-[[data-slot=input-group-control]:focus-visible]:outline-ring has-[[data-slot=input-group-control]:disabled]:bg-gris-inicial has-[[data-slot][data-matches-spartan-invalid=true]]:border-destructive has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=inline-start]]:[&>input]:ps-2 has-[>[data-align=inline-end]]:[&>input]:pe-1 has-[>textarea]:h-auto',
    );
  }
}
