import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { Component, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton, HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { classes, provideSpartanHlm } from '@spartan-ng/helm/utils';

/**
 * Piezas de spartan.ng (`libs/ui`) que las pantallas aún no usan pero forman parte de los
 * componentes instalados: se verifica que pinten su `data-slot` y sus clases base.
 */
@Component({
  imports: [
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmInputGroupImports,
    HlmPopoverImports,
    HlmSelectImports,
    HlmTableImports,
    HlmTextareaImports,
  ],
  template: `
    <div hlmAlertDialogHeader>
      <div hlmAlertDialogMedia>i</div>
    </div>
    <div hlmAlertDialogFooter>
      <button hlmAlertDialogAction type="submit">Enviar</button>
    </div>

    <div hlmInputGroup>
      <span hlmInputGroupText>$</span>
      <textarea hlmInputGroupTextarea aria-label="Nota"></textarea>
    </div>
    <textarea hlmTextarea aria-label="Comentario"></textarea>

    <div hlmPopoverHeader>
      <p hlmPopoverTitle>Título</p>
      <p hlmPopoverDescription>Descripción</p>
    </div>

    <div hlmSelectLabel>Grupo</div>
    <div hlmSelectSeparator></div>
    <div hlmSelectValuesContent>Valores</div>

    <table hlmTable>
      <caption hlmCaption>
        Totales
      </caption>
      <tfoot hlmTFoot>
        <tr hlmTr>
          <td hlmTd>1</td>
        </tr>
      </tfoot>
    </table>

    <button hlmBtn #extra>Extra</button>
  `,
})
class PiezasHost {
  readonly boton = viewChild.required('extra', { read: HlmButton });
}

/** Select múltiple con placeholder, flechas de desplazamiento y `aria-invalid` manual. */
@Component({
  imports: [HlmSelectImports],
  template: `
    <hlm-select-multiple [(value)]="valores" aria-label="Meses">
      <hlm-select-trigger [aria-invalid]="invalido()" buttonId="meses">
        <span hlmSelectPlaceholder>Elige meses</span>
        <hlm-select-values />
      </hlm-select-trigger>
      <hlm-select-content *hlmSelectPortal>
        <hlm-select-scroll-up />
        <hlm-select-item value="ene">Enero</hlm-select-item>
        <hlm-select-item value="feb">Febrero</hlm-select-item>
        <hlm-select-scroll-down />
      </hlm-select-content>
    </hlm-select-multiple>
  `,
})
class SelectMultipleHost {
  readonly valores = signal<string[]>([]);
  readonly invalido = signal<boolean | string | undefined>(undefined);
}

/** Pestañas con la lista paginada (flechas cuando no caben). */
@Component({
  imports: [HlmTabsImports],
  template: `
    <div hlmTabs tab="uno">
      <hlm-paginated-tabs-list tabListClass="w-fit" paginationButtonClass="size-8">
        <button hlmTabsTrigger="uno">Uno</button>
        <button hlmTabsTrigger="dos">Dos</button>
      </hlm-paginated-tabs-list>
      <div hlmTabsContent="uno">Contenido uno</div>
      <div hlmTabsContent="dos">Contenido dos</div>
    </div>
  `,
})
class PaginatedTabsHost {}

/** Elemento con una transición propia: `classes()` la suspende y luego la restaura. */
@Component({
  selector: 'app-con-transicion',
  template: '',
  host: { style: 'transition: opacity 1s' },
})
class ConTransicion {
  constructor() {
    classes(() => 'block');
  }
}

@Component({
  imports: [ConTransicion],
  template: `<app-con-transicion class="externa" />`,
})
class TransicionHost {}

async function render<T>(component: new () => T): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe('Componentes de spartan.ng', () => {
  it('pintan el slot y las clases base de las piezas de diálogo, campos, popover, select y tabla', async () => {
    const fixture = await render(PiezasHost);
    const el = fixture.nativeElement as HTMLElement;

    for (const name of [
      'alert-dialog-header',
      'alert-dialog-media',
      'alert-dialog-footer',
      'alert-dialog-action',
      'popover-header',
      'popover-title',
      'popover-description',
      'select-label',
      'select-separator',
      'table-footer',
      'table-caption',
    ]) {
      // El nombre va en la aserción para saber qué pieza falló.
      expect([name, Boolean(slot(el, name)?.className)]).toEqual([name, true]);
    }

    expect(slot(el, 'alert-dialog-action')?.getAttribute('type')).toBe('submit');
    expect(el.querySelector('[hlmSelectValuesContent]')?.className).toBe('gap-2 flex');
    expect(el.querySelector('[hlmInputGroupText]')?.className).toContain('text-muted-foreground');
    expect(el.querySelector('textarea[hlmInputGroupTextarea]')?.className).toContain('resize-none');
    expect(el.querySelector('textarea[hlmTextarea]')?.className).toContain('border-input');
  });

  it('el botón acepta clases adicionales', async () => {
    const fixture = await render(PiezasHost);
    fixture.componentInstance.boton().setClass('clase-extra');
    TestBed.tick();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button[hlmBtn]')?.classList,
    ).toContain('clase-extra');
  });

  it('el select múltiple muestra el placeholder y respeta aria-invalid', async () => {
    const fixture = await render(SelectMultipleHost);
    const el = fixture.nativeElement as HTMLElement;
    const trigger = () => el.querySelector<HTMLButtonElement>('#meses')!;

    expect(slot(el, 'select')?.classList).toContain('block');
    expect(el.textContent).toContain('Elige meses');
    expect(trigger().hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.invalido.set('true');
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.invalido.set('');
    await fixture.whenStable();
    expect(trigger().hasAttribute('aria-invalid')).toBe(false);

    trigger().click();
    await fixture.whenStable();
    expect(document.querySelector('hlm-select-scroll-up')?.className).toContain('sticky');
    expect(document.querySelector('hlm-select-scroll-down')?.className).toContain('sticky');
  });

  it('la lista de pestañas paginada oculta las flechas si las pestañas caben', async () => {
    const fixture = await render(PaginatedTabsHost);
    const el = fixture.nativeElement as HTMLElement;
    const flechas = [...el.querySelectorAll<HTMLButtonElement>('[data-pagination]')];

    expect(slot(el, 'tabs-paginated-list')?.className).toContain('overflow-hidden');
    expect(el.querySelector('[role=tablist] > div')?.className).toContain('w-fit');
    expect(flechas).toHaveLength(2);
    expect(flechas.every((flecha) => flecha.classList.contains('hidden'))).toBe(true);
    expect(flechas[0].className).toContain('size-8');

    const [, dos] = el.querySelectorAll<HTMLButtonElement>('[hlmTabsTrigger]');
    dos.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    dos.click();
    await fixture.whenStable();
    expect(dos.getAttribute('aria-selected')).toBe('true');
  });

  it('classes() restaura la transición propia y conserva las clases añadidas desde fuera', async () => {
    const fixture = await render(TransicionHost);
    const elemento = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'app-con-transicion',
    )!;

    expect(elemento.classList).toContain('block');
    expect(elemento.classList).toContain('externa');
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(elemento.style.getPropertyValue('transition')).toBe('opacity 1s');

    elemento.classList.add('agregada');
    await new Promise((resolve) => setTimeout(resolve));
    expect(elemento.classList).toContain('agregada');
    expect(elemento.classList).toContain('block');
  });

  it('classes() restaura la transición si el elemento se destruye antes de pintarse', async () => {
    // Destruido antes de escribir sus clases: la transición sigue suspendida y se restaura.
    const sinPintar = TestBed.createComponent(TransicionHost);
    const elemento = (sinPintar.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'app-con-transicion',
    )!;
    expect(elemento.style.getPropertyValue('transition')).toBe('none');
    sinPintar.destroy();
    expect(elemento.style.getPropertyValue('transition')).toBe('opacity 1s');

    // Destruido con la restauración pendiente para el siguiente cuadro: se cancela.
    const cancelar = jest.spyOn(globalThis, 'cancelAnimationFrame');
    const pintado = await render(TransicionHost);
    pintado.destroy();
    expect(cancelar).toHaveBeenCalled();
    cancelar.mockRestore();
  });

  it('classes() no suspende transiciones fuera del navegador', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const fixture = await render(TransicionHost);
    const elemento = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'app-con-transicion',
    )!;

    expect(elemento.classList).toContain('block');
    expect(elemento.style.getPropertyValue('transition')).toBe('opacity 1s');
  });

  it('provideSpartanHlm desactiva el modo popover del overlay de CDK', () => {
    TestBed.configureTestingModule({ providers: [provideSpartanHlm()] });

    expect(TestBed.inject(OVERLAY_DEFAULT_CONFIG)).toEqual({ usePopover: false });
  });
});
