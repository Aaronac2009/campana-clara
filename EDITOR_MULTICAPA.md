# Editor multicapa — especificación implementable

## Objetivo
Evolucionar el editor de imagen única a un editor de composición con capas independientes por idioma, manteniendo compatibilidad con campañas anteriores.

## Modelo incluido en esta versión
`src/lib/composition.ts` define un modelo versionado con:
- Lienzo por idioma (ES/EN), dimensiones en píxeles de diseño y fondo.
- Capas de imagen, texto y forma.
- Posición, tamaño, rotación, opacidad, orden Z, visibilidad y bloqueo.
- Metadatos de imagen: texto alternativo, licencia, atribución e ID de activo.
- Normalización de valores, límite de 120 capas, historial undo/redo y validación previa a exportar.
- Conversión inicial de campañas antiguas para no descartar título y bajada.

## Exportación
`src/lib/composition-export.ts` dibuja capas visibles en Canvas y genera PNG/JPEG/WebP. Incluye límites de resolución, verificación de origen de imagen y mensajes de error para CORS o recursos faltantes.

### Limitaciones explícitas
- La interfaz React de selección/arrastre/transformación todavía debe integrarse en una ruta de editor.
- La exportación requiere fuentes de imagen accesibles y CORS habilitado para imágenes HTTPS externas.
- GIF y video no se animan en este exportador; se debe seleccionar un fotograma o usar una etapa de renderizado de video separada.
- PDF, SVG editable y MP4 requieren módulos de exportación adicionales.
- El modelo permite muchas imágenes/capas, pero se limita a 120 por composición para proteger memoria y rendimiento. No existe inserción literalmente ilimitada.
- La compatibilidad de fuentes tipográficas depende de las fuentes disponibles en el navegador o cargadas por la aplicación.

## Interacción UI prevista
1. Barra superior: nombre de campaña, idioma de composición, formato, zoom, guardar, exportar.
2. Panel izquierdo: biblioteca y búsqueda de activos; categorías, licencias, favoritos, arrastrar al lienzo.
3. Centro: lienzo con guías, márgenes seguros, zoom y selección.
4. Panel derecho: propiedades de la capa activa.
5. Panel inferior/lateral: lista de capas con reordenamiento, ocultar, bloquear, duplicar y eliminar.

## Reglas UX
- Atajos: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Delete, Ctrl/Cmd+D, flechas para mover; documentar atajos.
- Arrastre con teclado y controles numéricos para accesibilidad.
- No permitir que capas bloqueadas se transformen.
- Confirmar antes de eliminar varias capas.
- Guardado con indicador “Guardado / Guardando / Error”; no anunciar guardado si falla.
- Recuperación de borrador después de cierre inesperado.
- Previsualización de exportación antes de descargar.
- No incrustar imágenes remotas arbitrarias en SVG ni permitir HTML suministrado por usuario.

## Criterios de aceptación UI
- Crear, seleccionar, arrastrar, redimensionar, rotar y reordenar capas.
- Soportar 30 capas en un equipo de referencia sin bloquear la interfaz.
- Deshacer/rehacer al menos 80 operaciones.
- Exportación idéntica al lienzo al 100% para PNG/JPEG/WebP.
- Mostrar errores accionables por imagen rota, CORS, fuente faltante o exportación demasiado grande.
- Preservar el afiche heredado como alternativa de vista previa hasta completar la migración.

## Persistencia de activos
El componente acepta `onAssetImport(file)` para delegar la carga binaria a Supabase Storage/IndexedDB autorizado y recibir una URL durable. Si no se proporciona, usa data URL local para prototipado; no es adecuado para persistencia a largo plazo con archivos grandes. La aplicación integradora debe proporcionar `onAssetImport` y `onChange` con guardado real, recuperación y control de permisos.
