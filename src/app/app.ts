import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Raíz del micro front cuando se levanta solo (`ng serve`). Desde el orquestador solo se cargan
 * las rutas expuestas, así que este fondo y margen no aplican allí.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  host: { class: 'block min-h-dvh bg-gris-espacial p-4 sm:p-6' },
  template: '<main><router-outlet /></main>',
})
export class App {}
