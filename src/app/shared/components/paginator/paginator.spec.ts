import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Paginator } from './paginator';

@Component({
  imports: [Paginator],
  template: `
    <app-paginator
      [page]="page()"
      [totalPages]="total()"
      [disabled]="disabled()"
      (pageChange)="pedidas.push($event); page.set($event)"
    />
  `,
})
class Host {
  readonly page = signal(2);
  readonly total = signal(5);
  readonly disabled = signal(false);
  readonly pedidas: number[] = [];
}

describe('Paginator', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const input = () => el().querySelector('input')!;
  const anterior = () => el().querySelector<HTMLButtonElement>('[aria-label="Página anterior"]')!;
  const siguiente = () => el().querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')!;

  async function escribir(valor: string, evento: 'change' | 'enter' = 'change'): Promise<void> {
    input().value = valor;
    input().dispatchEvent(new Event('input'));
    input().dispatchEvent(
      evento === 'change' ? new Event('change') : new KeyboardEvent('keydown', { key: 'Enter' }),
    );
    await fixture.whenStable();
  }

  it('muestra la página y el total y navega con las flechas', async () => {
    expect(input().value).toBe('2');
    expect(el().textContent).toContain('de 5');

    anterior().click();
    await fixture.whenStable();
    siguiente().click();
    await fixture.whenStable();
    expect(host.pedidas).toEqual([1, 2]);
  });

  it('desactiva las flechas en los extremos', async () => {
    host.page.set(1);
    await fixture.whenStable();
    expect(anterior().disabled).toBe(true);
    expect(siguiente().disabled).toBe(false);

    host.page.set(5);
    await fixture.whenStable();
    expect(siguiente().disabled).toBe(true);
  });

  it('salta a la página escrita, acotada entre 1 y el total', async () => {
    await escribir('4');
    await escribir('99', 'enter');
    await escribir('0');
    expect(host.pedidas).toEqual([4, 5, 1]);
    expect(input().value).toBe('1');
  });

  it('un valor no numérico o la misma página no piden nada', async () => {
    await escribir('abc');
    expect(input().value).toBe('2');
    await escribir('2');
    expect(host.pedidas).toEqual([]);
  });

  it('inactivo deshabilita el campo y las flechas', async () => {
    host.disabled.set(true);
    await fixture.whenStable();
    expect(input().disabled).toBe(true);
    expect(anterior().disabled).toBe(true);
    expect(siguiente().disabled).toBe(true);

    host.disabled.set(false);
    await fixture.whenStable();
    expect(input().disabled).toBe(false);
  });
});
