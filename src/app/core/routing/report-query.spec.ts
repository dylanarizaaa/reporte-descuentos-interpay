import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { injectReportQuery } from './report-query';

@Component({ template: '' })
class Host {
  readonly query = injectReportQuery();
}

describe('injectReportQuery', () => {
  async function abrir(url: string): Promise<{ host: Host; router: Router }> {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'r', component: Host }])],
    });
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl(url, Host);
    return { host, router: TestBed.inject(Router) };
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve));

  it('lee periodo, cédula y página de la URL', async () => {
    const { host } = await abrir('/r?desde=2026-01-23&hasta=2026-02-10&cedula=%20123%20&pagina=3');

    expect(host.query.periodo()).toEqual({
      inicio: new Date(2026, 0, 23),
      fin: new Date(2026, 1, 10),
    });
    expect(host.query.cedula()).toBe('123');
    expect(host.query.pagina()).toBe(3);
  });

  it('sin parámetros (o con una página inválida) no hay consulta y la página es 1', async () => {
    const { host } = await abrir('/r?pagina=abc');

    expect(host.query.periodo()).toBeNull();
    expect(host.query.cedula()).toBe('');
    expect(host.query.pagina()).toBe(1);
  });

  it('consultar escribe la consulta y vuelve a la página 1; la misma consulta devuelve false', async () => {
    const { host, router } = await abrir('/r?pagina=2');
    const periodo = { inicio: new Date(2026, 0, 1), fin: new Date(2026, 0, 31) };

    expect(host.query.consultar({ periodo, cedula: ' 30856789 ' })).toBe(true);
    await settle();
    expect(router.url).toBe('/r?desde=2026-01-01&hasta=2026-01-31&cedula=30856789');

    expect(host.query.consultar({ periodo, cedula: '30856789' })).toBe(false);

    expect(host.query.consultar({ periodo, cedula: '' })).toBe(true);
    await settle();
    expect(router.url).toBe('/r?desde=2026-01-01&hasta=2026-01-31');
  });

  it('goToPage solo deja `pagina` en la URL desde la página 2', async () => {
    const { host, router } = await abrir('/r?desde=2026-01-01&hasta=2026-01-31');

    host.query.goToPage(3);
    await settle();
    expect(router.url).toBe('/r?desde=2026-01-01&hasta=2026-01-31&pagina=3');

    host.query.goToPage(1);
    await settle();
    expect(router.url).toBe('/r?desde=2026-01-01&hasta=2026-01-31');
  });
});
