# Campaña Clara: acercar la app a la referencia de 9 vistas

## Diagnóstico (revisado en el proyecto)

- **No pude ver la imagen de referencia.** "Prototipo de Campaña Clara en español.png" no está entre los archivos que puedo abrir. Este plan se basa en tu descripción de las nueve vistas. Si la vuelves a subir, ajustaré el diseño a la imagen antes de empezar la Fase 1.
- Páginas que ya existen: Inicio (KPIs, campañas recientes, acceso al Estudio), Mis campañas (búsqueda + filtro por estado), Crear/editar, Criterios editoriales, Calendario, Perfil y Estudio de imágenes (edición local con historial y comparación).
- Los datos se guardan solo en este navegador. No hay base de datos, inicio de sesión, idiomas ni registro de actividad.
- La firma "by Gingles · Powered by BDS devs" ya aparece en el menú lateral. El logo original de BDS devs sigue sin estar en el proyecto y no se inventará.
- Hay 3 archivos de pruebas: reglas de aprobación, Estudio y navegación.

## Qué se puede hacer ahora y qué necesita servidor

| Vista | Ahora (solo en el navegador) | Necesita servidor e inicio de sesión real |
|---|---|---|
| 1 Inicio de sesión | Pantalla de muestra, claramente marcada como "demo, sin seguridad real" | Cuentas reales, varias instituciones, permisos |
| 2 Dashboard | Más indicadores, actividad reciente, se conserva lo actual | Indicadores compartidos entre usuarios |
| 3 Campañas | Filtros por canal, etiqueta y fecha; orden; búsqueda | — |
| 4 Crear/editar | Nuevos campos: objetivo, canal, fechas inicio/fin, etiquetas (se conserva todo lo actual) | Revisión por varias personas |
| 5 Biblioteca | Imágenes/GIF/video guardados en el navegador, filtros por tipo | Almacenamiento compartido y grande |
| 6 Detalle de recurso | Vista previa, datos del archivo, campaña asociada, etiquetas, acciones | — |
| 7 Importar/exportar | Respaldo en archivo con verificación estricta antes de importar | Sincronización entre equipos |
| 8 Historial | Registro local que se puede exportar (CSV/JSON) | Registro de auditoría que no se pueda alterar |
| 9 Perfil y preferencias | Idioma ES/EN, preferencias de visualización, perfil actual | Preferencias por usuario |

Nota de privacidad: el Estudio de imágenes seguirá sin guardar nada, como ya está acordado. La Biblioteca será otra sección, con aviso visible y un límite de tamaño, y solo guardará en este navegador lo que tú añadas. **Necesito que confirmes esto**, porque cambia la regla "no guardar archivos importados" solo para la Biblioteca.

## Fases

**Fase 0: Base (sin cambios visibles)**
- Copia de seguridad automática y migración de los datos actuales, para que no se pierda ninguna campaña.
- Base de traducción ES/EN.

**Fase 1: Navegación y estructura**
- Menú con las 9 secciones, en móvil y escritorio. Se mantienen Criterios, Calendario y Estudio.
- Pantalla de inicio de sesión de muestra.

**Fase 2: Campañas**
- Campos nuevos en crear/editar y filtros avanzados en el listado. El dashboard se amplía sin perder nada de lo actual.

**Fase 3: Biblioteca y detalle de recurso**
- Subida de imágenes, GIF y video con verificación del tipo real del archivo. Se rechazan SVG y archivos dañados, con límite de tamaño.
- Vista previa, datos, etiquetas, asociación a campañas, enviar al Estudio y eliminar con confirmación.

**Fase 4: Historial e importar/exportar**
- Registro de acciones con filtros y exportación.
- Respaldo completo en JSON. Al importar se valida, se muestra un resumen y se pide confirmar. La opción por defecto combina los datos y nunca reemplaza en silencio.

**Fase 5: Idiomas, accesibilidad y pruebas**
- Todas las pantallas en ES/EN, uso con teclado, contraste y vista móvil.
- Pruebas de: filtros, validación de importación, registro del historial, verificación de archivos, cambio de idioma y migración de datos. Después, recorrido en navegador real.

## Criterios de aceptación
- Las 9 vistas se abren desde el menú en escritorio y móvil, y las secciones actuales siguen funcionando.
- Las campañas existentes sobreviven a la actualización. Los filtros combinados dan los resultados esperados.
- Un archivo de importación inválido o manipulado se rechaza con un mensaje claro y no cambia ningún dato.
- Cada crear, editar, eliminar, importar y exportar queda en el historial y se puede exportar.
- Al cambiar el idioma, toda la interfaz cambia y la elección se recuerda.
- La firma exacta sigue igual. No hay logos oficiales inventados, ni servidor, pagos o publicación.
- Solo daré por pasadas las pruebas que se hayan ejecutado. Nada se marcará como listo para producción.

## Estimación de créditos
No puedo garantizar una cifra exacta: depende de cuántas correcciones haga falta. Estimación conservadora: unos 8 a 15 mensajes de trabajo en total, de 1 a 3 por fase. La Fase 3 (multimedia) y la Fase 5 (traducción completa) son las más caras. Puedes aprobar fase por fase para controlar el gasto.

## Detalles técnicos
- Archivos probables: `src/components/app/AppShell.tsx`, `src/lib/{types,store,demo-data}.ts(x)`, `src/routes/{index,campanas,crear,perfil}.tsx`. Archivos nuevos: `src/routes/{login,biblioteca,biblioteca.$id,importar,historial}.tsx`, `src/lib/{i18n,activity,backup,media}.ts`. Pruebas nuevas en `src/test/`.
- Los archivos multimedia se guardan en IndexedDB y no en localStorage, por el límite de espacio. Los datos guardados llevan número de versión para migrarlos.
- La importación se valida con un esquema estricto, se limita su tamaño y no se ejecuta ningún HTML.
- Las traducciones son un diccionario tipado y el idioma elegido se guarda en el navegador.
