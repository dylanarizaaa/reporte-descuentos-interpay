import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { SearchField } from './search-field';

@Component({
  imports: [ReactiveFormsModule, SearchField],
  template: `<app-search-field [formControl]="control" disabledHint="Primero consulta" />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
}

describe('SearchField', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const input = () => el().querySelector('input')!;
  const limpiar = () => el().querySelector<HTMLButtonElement>('button');

  it('tiene nombre accesible y sincroniza el valor con el formControl', async () => {
    expect(el().querySelector('label')?.textContent?.trim()).toBe('Buscar por No. identificación');
    expect(input().getAttribute('maxlength')).toBe('20');

    input().value = '123';
    input().dispatchEvent(new Event('input'));
    input().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.control.value).toBe('123');
    expect(host.control.touched).toBe(true);

    host.control.setValue('456');
    await fixture.whenStable();
    expect(input().value).toBe('456');
  });

  it('la X limpia el texto, devuelve el foco y desaparece', async () => {
    host.control.setValue('123');
    await fixture.whenStable();
    expect(limpiar()?.getAttribute('aria-label')).toBe('Limpiar buscar por no. identificación');

    limpiar()!.click();
    await fixture.whenStable();
    expect(host.control.value).toBe('');
    expect(document.activeElement).toBe(input());
    expect(limpiar()).toBeNull();
  });

  it('inactivo explica por qué y no ofrece limpiar', async () => {
    host.control.setValue('123');
    host.control.disable();
    await fixture.whenStable();

    expect(input().disabled).toBe(true);
    expect(limpiar()).toBeNull();
    const hint = el().querySelector(`#${input().getAttribute('aria-describedby')}`);
    expect(hint?.textContent?.trim()).toBe('Primero consulta');
  });

  it('funciona sin formControl y trata null como vacío', async () => {
    const field = TestBed.createComponent(SearchField);
    await field.whenStable();
    const element = field.nativeElement as HTMLElement;
    const instance = field.debugElement.injector.get(SearchField);

    instance.writeValue(null);
    const campo = element.querySelector('input')!;
    campo.value = 'abc';
    campo.dispatchEvent(new Event('input'));
    campo.dispatchEvent(new Event('blur'));
    await field.whenStable();
    expect(element.querySelector('button')).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(SearchField))).not.toBeNull();
  });
});
