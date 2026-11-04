# Bilingüismo y exportación de campañas

## Dos idiomas, dos responsabilidades
El idioma de la interfaz y el idioma del contenido son independientes. Cambiar la interfaz a inglés no traduce automáticamente una campaña. El contenido inglés debe existir y ser revisado editorialmente.

## Estado actual del modelo
- `Campaign.title`, `tagline`, `bullets`, `cta` y `slogan` son la fuente española heredada.
- `Campaign.contentEn` guarda el contenido inglés.
- `campaign-content.ts` evita completar inglés copiando español.
- `requiredLangs`, `missingFields` y `applyGenerated` permiten identificar campos incompletos.
- `bilingualReadiness` en `composition.ts` añade una validación compacta para campañas bilingües.

## Flujo editorial recomendado
1. Redactar el original en el idioma de origen.
2. Crear la versión del segundo idioma, sin traducción automática silenciosa.
3. Revisar sentido, terminología institucional, tono, ortografía y gramática.
4. Verificar nombres oficiales, leyes, fechas, cifras y fuentes en ambos idiomas.
5. Aprobar contenido por idioma.
6. Diseñar composición independiente para ES y EN; las diferencias de longitud no deben deformar el diseño.
7. Exportar español, inglés o paquete bilingüe.
8. Registrar responsable, fecha y versión editorial.

## Reglas de traducción
- Mantener nombres oficiales en su idioma institucional y añadir traducción explicativa cuando ayude.
- No traducir nombres de leyes, órganos, instituciones o programas de forma que cambie su identidad jurídica.
- Revisar números, fechas, moneda, teléfonos, enlaces y siglas.
- Evitar traducción literal de modismos, slogans y llamadas a la acción.
- No marcar “bilingüe completo” mientras falte título, bajada, al menos un punto informativo o CTA en cualquiera de los idiomas requeridos.

## Exportación
El editor multicapa exporta composiciones a PNG/JPEG/WebP. Para el paquete editorial se recomienda incluir:
- imagen ES;
- imagen EN;
- JSON con metadatos, textos y fuentes;
- registro de revisión y atribuciones de recursos.
PDF multipágina, GIF y MP4 quedan como adaptadores de exportación siguientes; no deben anunciarse como terminados antes de tener pruebas de renderizado.
