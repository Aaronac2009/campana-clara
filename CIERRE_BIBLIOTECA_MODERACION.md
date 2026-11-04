# Cierre acotado — 28 de octubre de 2026

## Resultado real
- Biblioteca existente conservada: **406 recursos**, todos decodificados en Chromium desde la interfaz, sin entradas vacías: 155 gráficos originales, 249 láminas de banderas MIT y 2 fotografías CC0.
- Los 93 recursos del lote de composiciones son 31 motivos con tres orientaciones; no representan 93 temas diferentes. Las banderas son láminas de referencia, no certificaciones de proporciones ni diseños oficiales vigentes.
- Búsqueda, orientación, favoritos, selección e inserción conservados. No se agregaron recursos artificiales para inflar el total.
- Moderación local comprobada: solicitar cambios, reenviar a revisión, denegar, conservar motivo e historial tras recargar, y aprobar ES. La aprobación EN sin título permanece bloqueada.
- Corrección de cierre: respaldos con identificadores vacíos o duplicados en campañas, calendario, actividad, recursos o decisiones se rechazan antes de combinar datos. La combinación directa también rechaza identificadores ambiguos sin modificar el original.

## Comprobaciones ejecutadas
- `bunx vitest run`: **102 pruebas aprobadas en 10 archivos**, incluidas tres nuevas regresiones sobre duplicación y conservación de datos.
- Registro automático: `build OK`, 2026-10-28T22:25:48Z.
- Navegador: 406 imágenes decodificadas; búsqueda de pera vertical y bandera de Japón; favorito persistido; imagen insertada y borrador guardado.
- Moderación: cambios y denegación persistidos; aprobación ES registrada; EN incompleto bloqueado; sin errores de ejecución en el recorrido.
- Móvil 390×844: biblioteca y revisión en EN/oscuro sin desbordamiento horizontal.
- Exportación de campaña con foto: PNG y JPG de 1080×1350; SVG con fotografía incorporada; cambio de imagen conservó campos; formato horizontal y referencia recuperados al reabrir.
- Respaldo mediante interfaz: descarga, rechazo de archivo duplicado con estado local exactamente intacto, y confirmación de importación válida; sin errores de ejecución.
- Las primeras comprobaciones de descarga se lanzaron antes de completar la carga interactiva/fotográfica y agotaron la espera; se repitieron esperando la carga y funcionaron. No se atribuyó ese resultado a un defecto sin evidencia.

## Archivos de esta corrección
- `src/lib/backup.ts`
- `src/test/moderation.test.ts`
- `roadmap.md`
- Este informe.

## Pendientes y límites
- **3000 no alcanzado: faltan 2594 recursos curados/licenciados.** No hay generación, agente ni lote automático pendiente. Este cierre verifica lo viable ya integrado, no declara completado ese objetivo.
- Moderación exclusivamente local: no autorización institucional real, cuentas compartidas ni auditoría inviolable. No se habilitaron servicios remotos ni se publicó.
- Auditoría exhaustiva de teclado, GIF/video y curación visual individual de cada bandera no realizadas en este cierre.
- Referencia visual y logo original BDS no disponibles; sin sustituciones inventadas. Plantillas adicionales fuera de este cierre.
- Conservados ES/EN, temas, rutas, calendario, perfil, campañas y Estudio de imágenes; sin borrar datos existentes. Las mutaciones de prueba se realizaron en contextos nuevos y aislados del navegador del usuario.
- No se informó costo de créditos para estas operaciones; no se calcula ni se inventa una cifra. Los commits los gestiona la plataforma, sin comandos de escritura de Git.