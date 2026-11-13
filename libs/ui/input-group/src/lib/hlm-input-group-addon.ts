import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputGroupAddonVariants = cva(
  // Íconos de 16px en Gris complementario (p. ej. la lupa del buscador).
  "text-gris-complementario h-auto gap-2 py-1.5 text-sm font-medium [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex cursor-text items-center justify-center select-none",
  {
    variants: {
      align: {
        'inline-start': 'ps-3 has-[>button]:ms-[-0.3rem] has-[>kbd]:ms-[-0.15rem] order-first',
        'inline-end': 'pe-2 has-[>button]:me-[-0.3rem] has-[>kbd]:me-[-0.15rem] order-last',
        'block-start':
          'px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2 order-first w-full justify-start',
        'block-end':
          'px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2 order-last w-full justify-start',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
);

type InputGroupAddonVariants = VariantProps<typeof inputGroupAddonVariants>;

@Directive({
  selector: '[hlmInputGroupAddon],hlm-input-group-addon',
  exportAs: 'hlmInputGroupAddon',
  host: {
    role: 'group',
    'data-slot': 'input-group-addon',
    '[attr.data-align]': 'align()',
  },
})
export class HlmInputGroupAddon {
  public readonly align = input<InputGroupAddonVariants['align']>('inline-start');

  constructor() {
    classes(() => inputGroupAddonVariants({ align: this.align() }));
  }
}
