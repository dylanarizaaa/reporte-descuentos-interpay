import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { injectQueryParam } from '../../core/routing/route-params';
import { AutomaticDiscounts } from './automatic/automatic-discounts';
import { PersonalizedDiscounts } from './personalized/personalized-discounts';

/** Pestañas del diseño; la activa vive en la URL (`?tipo=automaticos`). */
export const TABS = [
  { id: 'personalizados', label: 'Dtos. personalizados' },
  { id: 'automaticos', label: 'Dtos. automáticos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * "Reporte de descuentos y movilizados por cliente": solo las pestañas. Cada una es una pantalla
 * independiente con sus propios filtros, consulta y columnas:
 *
 * - `app-personalized-discounts`: periodo libre en el calendario.
 * - `app-automatic-discounts`: periodos procesados por el backend.
 *
 * Al cambiar de pestaña se descarta la consulta de la anterior (la URL queda solo con `tipo`).
 */
@Component({
  selector: 'app-mobilized',
  imports: [AutomaticDiscounts, HlmTabsImports, PersonalizedDiscounts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './mobilized.html',
})
export class Mobilized {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly tabs = TABS;
  private readonly tipoParam = injectQueryParam('tipo');
  protected readonly tab = computed<TabId>(
    () => TABS.find((tab) => tab.id === this.tipoParam())?.id ?? TABS[0].id,
  );

  protected cambiarTab(id: string): void {
    if (id === this.tab()) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: id === TABS[0].id ? {} : { tipo: id },
    });
  }
}
