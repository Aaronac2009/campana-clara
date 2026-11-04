# Lista de verificación de salida — Campaña Clara

## Antes de cualquier despliegue
- [ ] Instalar dependencias con lockfile y versión de Node fijada.
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Revisar `npm audit` y actualizar dependencias con pruebas de regresión.
- [ ] Confirmar que no hay `.env`, tokens, service-role keys ni credenciales en el repositorio.
- [ ] Confirmar que el login demo está deshabilitado en producción.
- [ ] Confirmar RLS en todas las tablas y pruebas de acceso cruzado entre instituciones.
- [ ] Confirmar políticas privadas de Storage y autorización por institución.
- [ ] Probar recuperación de contraseña, MFA administrativo y revocación de sesión.
- [ ] Probar respaldo y restauración de PostgreSQL y Storage.
- [ ] Probar importación/exportación de campañas antiguas sin pérdida.
- [ ] Probar cada flujo en español e inglés, incluyendo validación de contenido.
- [ ] Probar editor con múltiples imágenes, capas bloqueadas, orden Z, undo/redo y recuperación.
- [ ] Probar exportación PNG/JPEG/WebP, imágenes con CORS, imágenes faltantes y resolución máxima.
- [ ] Verificar licencias, atribuciones y autorización de logos/escudos.
- [ ] Probar accesibilidad por teclado, contraste, foco visible y lector de pantalla.
- [ ] Ejecutar pruebas E2E en navegadores Chromium, Firefox y WebKit.
- [ ] Verificar despliegue Preview en Vercel antes de producción.
- [ ] Tener rollback documentado y responsable de aprobación.

## Criterio de liberación
No se libera si hay fallos críticos/altos, pérdida de datos, acceso no autorizado, campañas aprobadas con contenido bilingüe incompleto o recursos visuales sin derechos confirmados.
