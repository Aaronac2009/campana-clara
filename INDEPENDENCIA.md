# Plan de independencia técnica — Campaña Clara

Fecha de auditoría: 30-10-2026. Base: ZIP exportado desde Lovable, 171 archivos, 2,945,564 bytes.

## 1. Qué contiene realmente el respaldo

- Aplicación React 19 + TypeScript + TanStack Start.
- Vite 8 y Tailwind CSS 4.
- Rutas, componentes, biblioteca visual y estudio de imágenes.
- Traducciones de interfaz español/inglés y modelo `contentEn` para el contenido de campaña.
- Pruebas Vitest.
- Migraciones Drizzle/SQL y configuración Supabase.
- Documentación de seguridad, arquitectura, operación y localización.

## 2. Hallazgos que afectan la independencia

### 2.1 Configuración de compilación ligada a Lovable
`vite.config.ts` importa `@lovable.dev/vite-tanstack-config`. Ese paquete centraliza plugins, alias, configuración SSR/Nitro y algunos ajustes del entorno Lovable. No basta con borrar la dependencia: debe sustituirse por configuración estándar de Vite + TanStack Start + React + Tailwind + Nitro y verificarse con `typecheck`, pruebas, build y despliegue de staging.

### 2.2 Persistencia local y nube
`src/lib/store.tsx` conserva un almacén local versionado en `localStorage`; los archivos binarios de la biblioteca se guardan en IndexedDB. El proyecto también contiene rutas de autenticación y un espacio institucional basado en Supabase. La documentación describe la migración local→nube, pero registra pasos de integración real como pendientes. No asumir que todos los datos del navegador ya están sincronizados.

### 2.3 Editor de campañas limitado a una imagen principal
El tipo `CampaignPlanning` contiene `image?: CampaignImage`; `ImagePicker` entrega una selección por operación y `crear.tsx` asigna el resultado a `campaign.image`. `Poster` y `posterLayout` consumen esa imagen singular. `ImageStudio` es un editor de una imagen, no un editor multicapa de campañas.

**Consecuencia:** la capacidad de insertar varias imágenes, adornos y textos móviles no está implementada en el flujo principal. Debe añadirse un modelo de composición versionado, editor de capas y exportador que respete el modelo anterior.

### 2.4 Credenciales
El ZIP original incluía `.env`. Se excluyó de esta copia preparada para compartir. Se agregó `.env.example` con campos vacíos. Revisar y rotar credenciales si el ZIP original fue compartido públicamente o almacenado en un repositorio accesible a terceros. No publicar claves `service_role`.

## 3. Secuencia de trabajo recomendada

### Fase A — Reproducibilidad
1. Crear repositorio privado en GitHub y subir esta copia saneada.
2. Configurar Node 22.12+.
3. Completar `.env` desde Supabase.
4. Ejecutar `npm install`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
5. Resolver cualquier incompatibilidad del paquete de configuración de Lovable antes de cambiar el runtime.

### Fase B — Independencia de infraestructura
1. Sustituir `@lovable.dev/vite-tanstack-config` por plugins oficiales compatibles.
2. Elegir y configurar el preset/adaptador de TanStack Start para Vercel.
3. Definir variables de entorno separadas para Preview y Production.
4. Configurar dominios, HTTPS, encabezados y políticas de caché.
5. Mantener Supabase como servicio externo independiente; exportar por separado base de datos y Storage.
6. Probar migraciones en un proyecto Supabase de staging antes de producción.

### Fase C — Editor multicapa
Modelo recomendado por campaña y por idioma:
- `compositionVersion`
- `canvas`: width, height, background, safeArea
- `layers[]`: id, type (`image`, `text`, `shape`, `logo`), x, y, width, height, rotation, opacity, zIndex, locked, visible
- `image`: source, assetId, alt, license/attribution
- `text`: content, fontFamily, fontSize, weight, color, align, lineHeight
- `language`: `es` o `en`

Requisitos: inserción múltiple, selección, arrastre, resize, rotación, duplicar, borrar, bloquear, ocultar, orden de capas, undo/redo, guías, snap, guardado, recuperación y exportación PNG/JPG/PDF. Mantener `campaign.image` como fallback para campañas antiguas y migrar sin pérdida.

### Fase D — Bilingüismo integral
Separar idioma de interfaz e idioma del contenido. Validar campos requeridos de cada idioma; no copiar español como traducción inglesa. Cada composición lingüística debe poder editarse y exportarse por separado y en paquete bilingüe.

### Fase E — Seguridad y operación
- Verificar todas las políticas RLS y aislamiento entre instituciones.
- No conceder roles desde el cliente.
- MFA para administradores.
- Confirmación de correo, recuperación y revocación de sesiones.
- Storage privado, límites, inspección de tipo real y metadatos de licencia.
- Backups probados y restauración documentada.
- Auditoría inmutable y pruebas de acceso negativo.
- Revisar CSP, CSRF, cabeceras, dependencias y secretos.

## 4. Criterio de aceptación
No declarar producción hasta completar pruebas automatizadas, pruebas manuales de roles, restauración de backup, exportación real, pruebas ES/EN y despliegue en un entorno de staging. No existe certificación ONU, Microsoft, Apple, OWASP ni aval institucional por el solo hecho de seguir buenas prácticas.

## 5. Respaldo de datos separado
El ZIP del código no incluye:
- filas reales de PostgreSQL/Supabase;
- cuentas de Supabase Auth;
- objetos del bucket `institution-assets`;
- blobs IndexedDB ni `localStorage` de los navegadores de usuarios.

Generar un respaldo SQL y un respaldo independiente de Storage desde Supabase. Exportar los datos locales desde la función de backup de la aplicación, si están presentes en el navegador donde se utilizaron.


## 6. Evolución entregada en esta iteración
Se añadieron un modelo de composición multicapa versionado, un exportador Canvas para PNG/JPEG/WebP, un componente React de edición y un paquete editorial bilingüe JSON. Se añadieron pruebas unitarias para operaciones de capas, historial, validación de licencia/alt y completitud bilingüe.

Verificaciones ejecutadas:
- TypeScript estricto para `types.ts`, `campaign-content.ts`, `composition.ts`, `composition-export.ts` y `editorial-package.ts`: **correcto**.
- ZIP saneado: integridad verificada.
- Suite completa de Vitest, ESLint y build de aplicación: **pendientes**, porque el entorno de trabajo no tiene dependencias instaladas y no se completó la instalación de paquetes.

La interfaz del componente `CampaignComposer` aún requiere integración en el flujo de campaña, persistencia y pruebas de navegador. La exportación PDF/GIF/MP4 no se declara terminada.
