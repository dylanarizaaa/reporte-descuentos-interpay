import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Raíz del micro front cuando se levanta solo (`ng serve`). Desde el orquestador solo se cargan
 * las rutas expuestas, así que este fondo y margen no aplican allí.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App { }
