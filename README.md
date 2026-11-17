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

## Pantalla `movilizados-cliente`

**Reporte de descuentos y movilizados por cliente** (`features/mobilized`). `Mobilized` solo tiene
las pestañas (tabs de spartan); cada una es una pantalla independiente con sus filtros, consulta y
columnas. La pestaña activa vive en la URL (`?tipo=automaticos`) y al cambiarla se descarta la
consulta de la anterior.

| Pestaña | Periodo | Tabla |
| --- | --- | --- |
| Dtos. personalizados (`PersonalizedDiscounts`) | Calendario libre, máximo 30 días. | Nombre, identificación, fechas del descuento, movilizados, descuentos, tipo, rango y movilizados Inter Pay. |
| Dtos. automáticos (`AutomaticDiscounts`) | "Año" (el actual y los cuatro anteriores; empieza en el del periodo consultado o en el actual) y "Periodo" con los periodos procesados de ese año (`ObtenerPeriodosDescuento?anio=`; sin año no se piden). Cambiar de año borra el periodo. Se consultan y envían las fechas del periodo. | Nombre, identificación, movilizados mes anterior y del periodo elegido, descuentos y rango. |

En ambas: "Nombre del cliente" y "Acciones" fijas; "Enviar" por fila envía el informe de ese
cliente y "Enviar reporte" el de la consulta (con el `tipoInforme` de la pestaña).

Las pantallas de reportes comparten `app-report-filters` (campo de periodo proyectado con
`appReportPeriod`, buscador con input group, "Consultar" y "Enviar reporte"), `injectReportQuery`
(consulta en la URL), `createReportResults` (estados de la tabla, búsqueda y paginador),
`reportColumn` (formato y orden de columnas) y `app-send-report-dialog` (textos configurables).

## API (CajaInter)

La URL base se configura en `src/environments/environment.ts` (`apiUrl`, hasta `/api/CajaInter`)
o con el token `API_BASE_URL`. Las respuestas usan la envoltura `RespuestaGeneral`
(`error`, `mensaje`, `resultado`, `statusCode`, `descripcion`); con `error: true` se muestra `mensaje`.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/Informes/ObtenerInformeDetalladoVentasDescuento?FechaInicio&FechaFin&Cedula&Pagina&CantidadRegistros` | Datos de la tabla. Fechas sin hora (`AAAA-MM-DD`). |
| GET | `/Informes/ObtenerInformeDescuentoCliente?TipoDescuento&FechaInicio&FechaFinal&Cedula&NumeroPagina&TamanoPagina` | Tabla de descuentos y movilizados por cliente. |
| GET | `/Informes/ObtenerPeriodosDescuento?anio` | Periodos procesados de descuentos automáticos del año (obligatorio). |
| POST | `/Informes/ObtenerInformeDescuento` | "Enviar reporte" / "Enviar". Cuerpo: `{ fechaInicio, fechaFinal, tipoInforme, guias: null, cedula }`. Encabezado `IdToken` con el token que el orquestador guarda en `localStorage` (`pf.token`, leído por `core/session/storage.service.ts`). |

> El swagger publica los valores de los enums, no sus nombres. **Por confirmar con el backend**:
>
> - `TipoDescuento` (`descuentos-cliente.model.ts`): 1 = personalizados, 2 = automáticos.
> - `TipoInformeDescuento` (`informe-descuento.model.ts`): 1 = descuentos personalizados,
>   2 = descuentos automáticos, 3 = detalle de ventas con descuento.
> - Automáticos: "Movilizados mes anterior" usa `movilizadosInterPay` y "Movilizados periodo
>   elegido" usa `numeroMovilizados` (`automatic-discounts.columns.ts`).

## Desarrollo

```bash
pnpm install
pnpm start             # http://localhost:4205/ventas-descuento y /movilizados-cliente
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
  shared/        tabla (TanStack), filtros, buscador, paginador, selector de periodo, modal de
                 envío, estados vacío / error y el estado común de los reportes
  features/discount-sales/       ventas con descuento
  features/mobilized/            descuentos y movilizados por cliente
libs/ui/         componentes de spartan.ng (helm) con los ajustes del sistema de diseño
```
