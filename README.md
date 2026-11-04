# Campaña Clara Editorial

Aplicación web para planificación, diseño, revisión y organización de campañas institucionales. Proyecto independiente basado en React 19, TypeScript, TanStack Start, Vite, Tailwind CSS y Supabase.

> Este repositorio es una copia de código fuente. No incluye la base de datos, los archivos almacenados en Supabase Storage, usuarios ni secretos.

## Requisitos

- Node.js 22.12 o superior.
- npm 10 o superior.
- Un proyecto Supabase para habilitar autenticación y funciones en la nube.

## Inicio local

1. Clona el repositorio.
2. Copia `.env.example` a `.env`.
3. Completa las variables con los datos del proyecto Supabase.
4. Ejecuta:

```bash
npm install
npm run dev
```

Abre la dirección local que muestre Vite.

## Verificaciones

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

No se debe considerar lista una publicación hasta que los cuatro comandos finalicen correctamente y se hayan probado autenticación, RLS, almacenamiento y flujos principales en un entorno de staging.

## Variables de entorno

- `VITE_SUPABASE_URL`: URL pública del proyecto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: clave publicable del proyecto. Es apta para el navegador siempre que RLS esté correctamente configurado.
- `VITE_SUPABASE_PROJECT_ID`: identificador del proyecto, usado por configuración auxiliar.
- `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`: configuración de servidor.
- `SUPABASE_SERVICE_ROLE_KEY`: secreto exclusivo del servidor; no debe llevar prefijo `VITE_`, ni llegar al navegador, ni subirse al repositorio.

## Estado de independencia

El código fuente se ha separado del ZIP exportado desde Lovable y se ha preparado para versionado seguro. La configuración Vite original todavía utiliza `@lovable.dev/vite-tanstack-config`; reemplazarla exige validar el pipeline de TanStack Start/Nitro con el adaptador de despliegue elegido. No se declara completada esa sustitución hasta que build y despliegue de prueba pasen.

El proyecto utiliza Supabase directamente mediante `@supabase/supabase-js`, por lo que puede conservarse el backend Supabase existente sin depender de Lovable como editor. La disponibilidad de datos cloud depende de mantener ese proyecto Supabase y sus migraciones.

## Documentación

- `INDEPENDENCIA.md`: plan técnico para retirar dependencias operativas de Lovable.
- `docs/security.md`: controles y pendientes de seguridad descritos por el proyecto.
- `docs/operations.md`: migraciones, operación y QA.
- `LOCALIZATION.md`: estrategia de localización y contenido bilingüe.
- `IMAGE_STUDIO.md`: importación y edición de imágenes.


## Editor multicapa (base avanzada)

Se incorporaron módulos nuevos:
- `src/lib/composition.ts`: modelo versionado de lienzo, capas, validación, orden Z, bloqueo, duplicado e historial.
- `src/lib/composition-export.ts`: exportación PNG/JPEG/WebP mediante Canvas, con límites de píxeles y comprobación de recursos.
- `src/lib/editorial-package.ts`: paquete JSON bilingüe para entregar textos y composiciones sin datos de perfil.
- `src/components/app/CampaignComposer.tsx`: componente visual controlado para añadir múltiples imágenes, textos y formas, mover capas, ajustar propiedades y exportar PNG.

**Integración pendiente:** `CampaignComposer` está preparado como componente reutilizable, pero todavía debe conectarse a la ruta de edición de campañas, a persistencia real y a la biblioteca de activos. No se debe anunciar como una funcionalidad desplegada hasta completar esa integración y sus pruebas E2E.
