# Reporte de descuentos Inter Pay

Micro front (Angular 21 + Native Federation) con la pantalla **Reporte de ventas con descuento**:
costos y descuentos aplicados a clientes Inter Pay. El orquestador carga las rutas expuestas en
`./Routes` (`src/app/app.routes.ts`, `export default routes`) y agrega el token de sesión a las
peticiones HTTP; este micro front no tiene lógica de autenticación.

## Pantalla `ventas-descuento`

| Elemento | Comportamiento |
| --- | --- |
| Periodo | Calendario de dos meses: "Desde" y "Año" eligen el mes de la izquierda y "Hasta" muestra el siguiente. Primer clic = inicio, segundo = fin. Máximo **30 días** entre inicio y fin y sin fechas futuras. El rango se publica solo con "Aplicar". |
| Buscar por No. identificación | Se habilita cuando la consulta del periodo trae registros (y sigue habilitado mientras haya una búsqueda aplicada). Se envía al pulsar "Consultar" o Enter. |
| Consultar | Activo con un periodo aplicado. Escribe la consulta en la URL: `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&cedula=…&pagina=n`, así que recargar o volver atrás conserva el reporte. |
| Tabla | Columnas del objeto `ResponseInformeDetalladoVentasDescuento`, con "No. de guía" fija al desplazar. El **orden es del cliente** (ordena la página recibida). Estados: inicial, cargando, resultados, sin registros y error con reintento. |
| Paginación | **Del servidor**, 10 registros por página (`Pagina` / `CantidadRegistros`). |
| Enviar reporte | Activo con resultados. Confirma, pide el archivo al backend y muestra "Tu reporte está en camino". El correo destino lo resuelve el backend con el token. |

## API (CajaInter)

La URL base se configura en `src/environments/environment.ts` (`apiBaseUrl`, hasta `/api/CajaInter`)
o con el token `API_BASE_URL`. Las respuestas usan la envoltura `RespuestaGeneral`
(`error`, `mensaje`, `resultado`, `statusCode`, `descripcion`); con `error: true` se muestra `mensaje`.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/Informes/ObtenerInformeDetalladoVentasDescuento?FechaInicio&FechaFin&Cedula&Pagina&CantidadRegistros` | Datos de la tabla. Fechas sin hora (`AAAA-MM-DD`). |
| POST | `/Informes/ObtenerInformeDescuento` | "Enviar reporte". Cuerpo: `{ fechaInicio, fechaFinal, tipoInforme, guias: null, cedula }`. |

> `tipoInforme` usa el valor `2` (`TipoInformeDescuento.VentasDetallado` en
> `ventas-descuento.model.ts`). El swagger no publica los nombres del enum: confirmar con el backend.

## Desarrollo

```bash
pnpm install
pnpm start             # http://localhost:4205/ventas-descuento
pnpm build
```

## Pruebas

Las pruebas unitarias usan [Jest](https://jestjs.io/) con
[jest-preset-angular](https://thymikee.github.io/jest-preset-angular/) (`jest.config.js` y `setup-jest.ts`):

```bash
pnpm test               # todas las pruebas
pnpm test:watch         # modo observación
pnpm test:coverage      # con cobertura en coverage/
```

Solo se ejecutan y miden los `*.spec.ts` de `src/`. Los componentes de spartan.ng en `libs/` quedan
fuera de las pruebas y de la cobertura. Los datos de ejemplo del API están en `src/testing/`.

## Estructura

```
src/app/
  core/          configuración del API, envoltura de respuestas, fechas, formatos y servicios
  shared/        tabla (TanStack), paginador, selector de periodo y estados vacío / error
  features/discount-sales/   pantalla, columnas y modal "Enviar reporte"
libs/ui/         componentes de spartan.ng (helm) con los ajustes del sistema de diseño
```
