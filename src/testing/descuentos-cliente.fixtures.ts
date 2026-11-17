import type {
  DescuentoCliente,
  DescuentosClientePagina,
} from '../app/core/data-access/descuentos-cliente.model';
import type { RespuestaGeneral } from '../app/core/http/api-response';
import { respuesta } from './ventas-descuento.fixtures';

/** Cliente con descuento con los valores de la primera fila del diseño. */
export function descuento(overrides: Partial<DescuentoCliente> = {}): DescuentoCliente {
  return {
    idPrepagoCliente: 1,
    nombreCliente: 'Carlos Rodríguez',
    numeroDocumento: '30856789',
    descuentoPagoEnCasa: 4,
    descuentoFlete: 10,
    tipoDescuento: 'Personalizado',
    rangoDescuento: '30 - 50 envíos',
    fechaInicialDescuento: '2026-02-04T00:00:00',
    fechaFinalDescuento: '2026-02-06T00:00:00',
    numeroMovilizados: 35,
    movilizadosInterPay: 20,
    ...overrides,
  };
}

const NOMBRES = [
  'Carlos Rodríguez',
  'María González',
  'Juan Pérez',
  'Ana Martínez',
  'Luis Torres',
  'Patricia Vargas',
  'Jorge Silva',
  'Carmen López',
  'Carmen López',
  'Carmen López',
];
const MOVILIZADOS = [35, 62, 71, 22, 56, 85, 11, 21, 34, 41];

/** Diez clientes como en el diseño. */
export const DESCUENTOS: readonly DescuentoCliente[] = NOMBRES.map((nombre, index) =>
  descuento({
    idPrepagoCliente: index + 1,
    nombreCliente: nombre,
    numeroDocumento: String(30856789 + Math.min(index, 7)),
    fechaInicialDescuento: `2026-02-${String(4 + index).padStart(2, '0')}T00:00:00`,
    fechaFinalDescuento: `2026-02-${String(6 + index).padStart(2, '0')}T00:00:00`,
    numeroMovilizados: MOVILIZADOS[index],
  }),
);

export function paginaDescuentos(
  overrides: Partial<DescuentosClientePagina> = {},
): RespuestaGeneral<DescuentosClientePagina> {
  return respuesta({
    paginaActual: 1,
    totalPaginas: 2,
    tamanioPagina: 10,
    totalElementos: 14,
    listaResultado: DESCUENTOS,
    ...overrides,
  });
}

export const PAGINA_DESCUENTOS_VACIA = paginaDescuentos({
  totalPaginas: 0,
  totalElementos: 0,
  listaResultado: [],
});
