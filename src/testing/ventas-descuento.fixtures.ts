import type { RespuestaGeneral } from '../app/core/http/api-response';
import type { InformeDescuentoGenerado } from '../app/core/data-access/informe-descuento.model';
import type {
  VentaDescuento,
  VentasDescuentoPagina,
} from '../app/core/data-access/ventas-descuento.model';

/** Venta de ejemplo con los valores de la primera fila del diseño. */
export function venta(overrides: Partial<VentaDescuento> = {}): VentaDescuento {
  return {
    guia: 'GU2024000',
    valorTransporte: 60000,
    valorSobreflete: 6100,
    valorOtrosServicios: 1500,
    valorComercial: 110500,
    valorTotal: 170000,
    descuentoFlete: 19.5,
    valorDescuentoFlete: 11700,
    descuentoPEC: 5,
    valorDescuentoPEC: 3000,
    valorFinal: 155300,
    factura: 'FE-10021',
    nombreRemitente: 'Laura Gómez',
    cedulaRemitente: '1032456789',
    direccionRemitente: 'Cra 7 # 45-10',
    telefonoRemitente: '3001234567',
    nombreDestinatario: 'Andrés Pérez',
    cedulaDestinatario: '80123456',
    direccionDestinatario: 'Cl 100 # 15-20',
    telefonoDestinatario: '3109876543',
    fecha: '2026-01-23T10:15:00',
    fechaEntrega: '2026-01-25T16:40:00',
    formaPago: 'Contado',
    tipoServicio: 'Mensajería',
    idCentroServicioOrigen: 1201,
    regionalOrigen: 'Bogotá',
    idConvenio: 55,
    contraPago: 'No',
    ...overrides,
  };
}

/** Diez filas como en el diseño (GU2024000 … GU2024009). */
export const VENTAS: readonly VentaDescuento[] = [
  venta(),
  venta({
    guia: 'GU2024001',
    valorTransporte: 78000,
    valorSobreflete: 8000,
    valorOtrosServicios: 1200,
    valorComercial: 140500,
    valorTotal: 190000,
    descuentoFlete: 12.5,
  }),
  venta({
    guia: 'GU2024002',
    valorTransporte: 43000,
    valorSobreflete: 7500,
    valorOtrosServicios: 2100,
    valorComercial: 90500,
    valorTotal: 140000,
    descuentoFlete: 17.8,
  }),
  venta({
    guia: 'GU2024003',
    valorTransporte: 76000,
    valorSobreflete: 4200,
    valorOtrosServicios: 1800,
    valorComercial: 220000,
    valorTotal: 310000,
    descuentoFlete: 14.6,
  }),
  venta({
    guia: 'GU2024004',
    valorTransporte: 24000,
    valorSobreflete: 9300,
    valorOtrosServicios: 1700,
    valorComercial: 320000,
    valorTotal: 360000,
    descuentoFlete: 11.5,
  }),
  venta({
    guia: 'GU2024005',
    valorTransporte: 81000,
    valorSobreflete: 4500,
    valorOtrosServicios: 2000,
    valorComercial: 160000,
    valorTotal: 240000,
    descuentoFlete: 18.8,
  }),
  venta({
    guia: 'GU2024006',
    valorTransporte: 93000,
    valorSobreflete: 7000,
    valorOtrosServicios: 1800,
    valorComercial: 510000,
    valorTotal: 600000,
    descuentoFlete: 16,
  }),
  venta({
    guia: 'GU2024007',
    valorTransporte: 43000,
    valorSobreflete: 8200,
    valorOtrosServicios: 1100,
    valorComercial: 190000,
    valorTotal: 240000,
    descuentoFlete: 16.7,
  }),
  venta({
    guia: 'GU2024008',
    valorTransporte: 43000,
    valorSobreflete: 8200,
    valorOtrosServicios: 1100,
    valorComercial: 190000,
    valorTotal: 240000,
    descuentoFlete: 16.7,
    factura: null,
    telefonoDestinatario: null,
  }),
  venta({
    guia: 'GU2024009',
    valorTransporte: 43000,
    valorSobreflete: 8200,
    valorOtrosServicios: 1100,
    valorComercial: 190000,
    valorTotal: 240000,
    descuentoFlete: 16.7,
    fechaEntrega: null,
  }),
];

export function pagina(
  overrides: Partial<VentasDescuentoPagina> = {},
): RespuestaGeneral<VentasDescuentoPagina> {
  return respuesta({
    paginaActual: 1,
    totalPaginas: 2,
    tamanioPagina: 10,
    totalElementos: 15,
    listaResultado: VENTAS,
    ...overrides,
  });
}

export const PAGINA_VACIA = pagina({ totalPaginas: 0, totalElementos: 0, listaResultado: [] });

export const INFORME_GENERADO = respuesta<InformeDescuentoGenerado>({
  urlDescarga: 'https://archivos.example/informe.xlsx',
  nombreArchivo: 'informe.xlsx',
  fechaExpiracionUtc: '2026-02-23T16:00:00Z',
  correoDestinatario: 'usuario@example.com',
  correoEnviado: true,
});

export function respuesta<T>(resultado: T): RespuestaGeneral<T> {
  return { error: false, mensaje: null, resultado, statusCode: 200, descripcion: null };
}
