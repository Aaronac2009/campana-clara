# Campaña Clara: imágenes, formatos y composición del arte

## Estado actual (revisado)
- El afiche se dibuja con una única plantilla que pone el texto de arriba hacia abajo con posiciones fijas. No admite imágenes de fondo ni de contenido.
- Hay 5 formatos y todos son cuadrados o verticales (1080×1350, 1080×1920, 1080×1080). No existe ninguno horizontal. "GIF/video" está marcado como planificado.
- El texto largo puede chocar con el bloque del llamado a la acción y con el pie. Nada lo detecta.
- El perfil ya guarda el logo (como imagen local), los colores y el eslogan. No tiene encabezado ni pie configurables.
- La Biblioteca guarda archivos en este navegador y comprueba el tipo real del archivo. No trae ningún recurso de fábrica.
- El editor de campañas está en español aunque la interfaz principal ya tiene ES/EN.

## Qué se construye
1. **"Añadir imagen" en el editor**, con dos pestañas:
   - **Catálogo demo:** unas 12 ilustraciones SVG originales hechas para el proyecto (convivencia, salud, lectura, tecnología, ambiente, deporte, etc.). Cada una tiene miniatura, búsqueda y categorías. Llevan la marca "Ilustración demo original · uso libre en este prototipo". No se usan fotos externas porque su licencia no se puede verificar.
   - **Mis archivos:** elegir desde la Biblioteca o subir un archivo nuevo. Se acepta PNG, JPEG y WebP y se aplica la misma verificación de siempre. SVG no se acepta.
2. **Imagen dentro del arte:** se ve al instante. Se puede cambiar, quitar o elegir el modo de ajuste (contener, cubrir o recortar). También se puede mover el punto focal, cambiar el tamaño del 30% al 100% del área asignada y oscurecer el fondo para que el texto se lea. Los ajustes se guardan por campaña y se conservan al cambiar de formato.
3. **Marca institucional en el Perfil:** logo o escudo (ya existe), encabezado (texto y franja de color), pie (texto, por ejemplo sitio web o contacto) y eslogan. Incluye una vista previa en miniatura del arte. En cada campaña se pueden activar o desactivar el logo, el encabezado, el pie y el eslogan.
4. **Formatos con presets editables**, agrupados en vertical, cuadrado y horizontal. Cada uno muestra sus dimensiones:
   - WhatsApp estado 1080×1920, WhatsApp chat 1080×1080 y 1600×900
   - Instagram/Facebook publicación 1080×1080 y 1080×1350, stories 1080×1920
   - Facebook horizontal 1200×630, pizarra/pantalla 1920×1080
   - Medida personalizada (de 320 a 4000 px)

   Aviso visible: "Medidas de referencia; verificá las especificaciones vigentes de cada plataforma". Cada presentación (vertical, cuadrada u horizontal) tiene su propia distribución, por ejemplo en horizontal la imagen va a un lado y el texto al otro. No se estira ni se rota el mismo diseño.
5. **Ajuste seguro:** el arte calcula cuánto espacio necesita cada bloque. Si el texto no cabe, primero reduce la letra hasta un mínimo legible y después oculta las ideas que sobran. Avisa con "El texto no cabe completo: se ocultaron 2 ideas" para que la persona lo resuelva. El texto nunca se superpone al logo ni al pie.
6. **Editor reorganizado en pestañas:** Plantilla (3 estilos: Editorial, Imagen protagonista, Minimal), Imagen, Texto, Marca (logo, encabezado, pie y eslogan), Colores (los del perfil o propios de la campaña) y Formato. La vista previa, la copia de texto y las descargas en PNG y SVG siguen funcionando, y además se añade JPG.
7. **ES/EN** en todo lo nuevo y en el editor de campañas, usando el diccionario existente.

## Preservación de datos
- La versión de los datos guardados sube y se migra con el mecanismo actual. La copia anterior queda intacta como respaldo. Las campañas antiguas reciben valores por defecto: sin imagen, plantilla Editorial y su formato traducido al preset equivalente.
- Los respaldos (importar y exportar) aceptan los nuevos campos con validación estricta, y los archivos antiguos siguen siendo válidos.
- El Estudio de imágenes no cambia y sigue sin guardar nada.

## Criterios de aceptación
- Elegir una ilustración del catálogo o subir un PNG hace que aparezca en el arte. Se puede cambiar, quitar y ajustar, y los ajustes siguen ahí al recargar.
- Al pasar de vertical a horizontal cambia la distribución y no se pierden ni la imagen ni el texto. El archivo exportado mide lo que dice el preset.
- Con un texto largo aparece el aviso y en el arte no hay texto superpuesto.
- El encabezado, el pie y el eslogan del perfil se ven en la vista previa del perfil y del arte, y se pueden activar o desactivar en cada campaña.
- Las campañas existentes siguen igual después de la actualización.

## Riesgos
- Las imágenes muy grandes hacen que el arte pese más. Se reducen a un máximo de 2400 px al insertarlas.
- El tamaño del texto se calcula de forma aproximada, sin medir la fuente real, así que puede variar un poco según el navegador.
- Al exportar a PNG o JPG, el arte se dibuja sin las fuentes web, igual que hoy.
- Es una fase grande y es la que más créditos puede costar.

## Estimación de créditos
No la puedo garantizar. La estimación conservadora es de **20 a 35 créditos** (de 3 a 5 mensajes de trabajo). Si prefieres limitar el gasto, la propongo en dos partes:
- **Parte A** (unos 12–20): formatos, ajuste seguro, imagen con catálogo y subida.
- **Parte B** (unos 10–15): marca en el perfil, plantillas, pestañas y ES/EN completo.

Me detendré al terminar la Parte A para que la revises.

## Detalles técnicos
- Modificados: `src/lib/types.ts` (FormatPreset, CampaignArt, Profile.header/footer), `src/lib/poster.ts` (layout engine por orientación y plantilla, medición, `fitReport`, `<image>` con preserveAspectRatio/clipPath), `src/components/app/Poster.tsx`, `src/routes/crear.tsx`, `src/routes/perfil.tsx`, `src/lib/store.tsx` (migrate v3), `src/lib/backup.ts`, `src/lib/i18n.ts`, `src/lib/media.ts` (reutilizar sniff para inserción).
- Nuevos: `src/lib/formats.ts` (presets), `src/lib/stock.ts` + `src/assets/stock/*.svg` (SVG generados por nosotros, servidos como `<img>`/data-URL rasterizada, nunca como HTML de usuario), `src/components/app/ImagePicker.tsx`, `src/components/app/ArtControls.tsx`, `STOCK_LICENSE.md`.
- Las imágenes subidas en la campaña se guardan como referencia a la Biblioteca (IndexedDB), no dentro de localStorage, y se convierten a data URL solo para la vista previa y la exportación.
- Pruebas nuevas: `src/test/formats-layout.test.ts` (dimensiones exportadas, distribución por orientación, sin solapamiento y aviso cuando no cabe), `src/test/art-insert.test.ts` (catálogo con búsqueda y categorías, inserción/quitar/cambiar, rechazo de SVG y archivos falsos), `src/test/migration-v3.test.ts` (migración de campañas y perfil, copia anterior intacta, respaldo antiguo válido). Se ejecuta toda la batería existente.
