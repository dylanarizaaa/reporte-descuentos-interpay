/**
 * Metadatos de columna que entiende `app-data-table`. Se declaran en las features de la tabla:
 *
 * ```ts
 * const features = tableFeatures({ ..., columnMeta: {} as DataTableColumnMeta });
 * ```
 */
export interface DataTableColumnMeta {
  /** Clases extra para el `<th>` y los `<td>` de la columna (ancho, alineación). */
  readonly className?: string;
  /** Clases extra solo para los `<td>` (estilo del contenido). */
  readonly cellClassName?: string;
}
