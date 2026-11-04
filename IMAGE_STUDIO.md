# Estudio de imágenes — prototipo local

## Alcance
La pantalla `/estudio` es accesible desde Inicio y el menú. No hay backend, subidas ni persistencia de imágenes. Archivo original, historial y resultados viven únicamente en memoria del navegador; abandonarlo o recargar los descarta. La exportación utiliza canvas y elimina metadatos. Se usa `react-image-crop` para selección accesible del recorte.

## Formatos y seguridad
- Importación: PNG, JPG/JPEG y WebP estáticos; máximo 12 MiB, 24 millones de píxeles y 8192 píxeles por lado.
- Se verifican firmas binarias, coincidencia del MIME declarado si existe, estructuras PNG, animación APNG/WebP y decodificación nativa. La firma no sustituye a la decodificación.
- Se rechazan SVG, GIF, HEIC, PDF y archivos desconocidos. Nunca se inserta contenido importado como HTML ni se ejecuta markup SVG.
- Exportación: PNG, JPEG opaco (calidad 0.92), WebP si el navegador realmente lo produce, SVG generado como contenedor de un PNG incrustado. No es vectorización.
- Máximo de salida: 4096 × 4096. Originales mayores se ajustan inicialmente a ese límite.
- En móviles, el botón Descargar puede abrir la hoja nativa de compartir/guardar. No se transfiere nada hasta que la persona seleccione un destino.

## Edición y límites
Recorte porcentual sobre el original, giros de 90 grados, volteos en ejes de la imagen, tamaño de salida con proporción opcional, contener/rellenar, margen, fondo transparente/papel/tinta y una línea de texto inferior de hasta 120 caracteres. Texto rasterizado, sin capas. Recorte se selecciona sobre el original, no sobre la composición girada. Las áreas transparentes JPEG se rellenan con el token de papel. No hay animación, filtros, capas, edición vectorial ni guardado de sesión.

Historial máximo de 40 cambios con deshacer/rehacer; restaurar es una operación reversible. Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z y Ctrl/Cmd+Y; Escape cancela recorte. Entradas y flechas del recorte son accesibles por teclado. La comparación muestra ambas imágenes sin modificar el original.

## Comprobaciones
Pruebas automatizadas en `src/test/image-studio.test.ts` cubren firmas/MIME, formatos rechazados, límites, animaciones, error de decodificación, coordenadas de edición, reversión, historial y SVG/fallback seguros. Las pruebas de navegador deben comprobar importación real, exportación descargada, píxeles y vistas de escritorio/móvil; las simulaciones de canvas en pruebas unitarias no sustituyen esa verificación.

No se ha certificado para producción ni se ha publicado. Safari/iOS y dispositivos físicos requieren validación adicional.

## Identidad
Firma exacta: by Gingles · Powered by BDS devs. No se encontró un archivo original del logo de BDS devs en este proyecto; no se creó ni sustituyó ningún logo.