# Seguridad, roles y gobernanza — decisiones de arquitectura

## Roles recomendados
- `superadmin`: administración global, instituciones, configuración y asignación de administradores.
- `institution_admin`: administra usuarios y campañas de su institución; no puede acceder a otra institución.
- `editor`: crea y edita campañas de su institución.
- `reviewer`: revisa, devuelve con observaciones o aprueba campañas dentro de su ámbito.
- `publisher`: publica o exporta campañas aprobadas.
- `viewer`: lectura y descarga permitida, sin edición.
- `auditor`: consulta registros y versiones, sin modificar campañas.

La cuenta global del propietario debe crearse manualmente mediante un proceso administrativo seguro. Nunca insertar un superadmin predeterminado ni una contraseña compartida en código fuente.

## Reglas no negociables
1. Autenticación real en Supabase Auth; retirar el login de demostración antes de producción.
2. Roles y pertenencia institucional almacenados en tablas protegidas y modificables solo por funciones administrativas de servidor.
3. RLS habilitado en todas las tablas multiusuario y pruebas negativas entre instituciones.
4. No confiar en `user_metadata` editable por el usuario para autorizar acciones.
5. `service_role` exclusivamente en servidor/secret manager, nunca en `VITE_*`.
6. MFA para superadmin y administradores; recuperación de cuenta con verificación.
7. Sesiones revocables, expiración razonable y control de dispositivos cuando corresponda.
8. Storage privado por defecto, políticas por institución, límites de tamaño y MIME real.
9. Auditoría append-only con actor, acción, recurso, institución, fecha, correlación y resultado.
10. Backups automáticos y prueba periódica de restauración.
11. Rate limiting, validación de entrada, CSP, protección de cabeceras, revisión de dependencias y gestión de secretos.
12. Consentimiento/licencia y atribución de cada imagen, logo, escudo o material de terceros.

## Modelo mínimo de datos a implementar
- `institutions(id, name, slug, status, created_at)`
- `profiles(user_id, display_name, status, created_at)`
- `memberships(user_id, institution_id, role, status, created_at)`
- `campaigns(id, institution_id, owner_id, status, version, created_at, updated_at)`
- `campaign_contents(campaign_id, language, title, body_json, editorial_status, reviewed_by, reviewed_at)`
- `campaign_compositions(campaign_id, language, schema_version, composition_json, updated_by, updated_at)`
- `assets(id, institution_id, storage_path, mime, bytes, sha256, alt, license, attribution, approval_status)`
- `campaign_assets(campaign_id, asset_id, layer_id)`
- `reviews(id, campaign_id, language, decision, comment, reviewer_id, created_at)`
- `audit_events(id, institution_id, actor_id, action, target_type, target_id, metadata, created_at)`

No ejecutar migraciones de producción hasta revisar las migraciones existentes y diseñar el plan de compatibilidad. No duplicar tablas si ya existen equivalentes.

## Aprobación editorial
Borrador → En revisión → Observado o Aprobado → Publicado/Archivado.
- El editor no se autoaprueba salvo política institucional explícita.
- Toda aprobación referencia versión de texto, composición, idioma y activos.
- Un cambio posterior invalida la aprobación previa de esa versión.
- El historial debe ser append-only para decisiones; no se presenta un registro local como auditoría inalterable.

## Privacidad y protección de menores
No cargar datos personales sensibles de estudiantes o menores en campañas ni herramientas de IA. Revisar autorizaciones para imágenes identificables, especialmente de menores. Mantener retención mínima y acceso restringido.
