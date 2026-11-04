# Seguridad, privacidad y riesgos

Se usan como referencia OWASP ASVS 5 / Top 10 y WCAG 2.2 AA. No hay certificación ni aval externo.

## Controles implementados
| Área | Control | Dónde |
|---|---|---|
| Autenticación | Correo y contraseña con confirmación por correo; mínimo 10 caracteres en la app; recuperación por enlace | `login.tsx`, `reset-password.tsx` |
| Sesión | La ruta protegida valida con `getUser()`; cierre de sesión limpia la caché | `_authenticated/route.tsx`, `espacio.tsx` |
| Autorización | RLS en las 10 tablas; los roles salen de `memberships`, nunca del cliente | migraciones `drizzle/migrations/0000–0003` |
| Aislamiento | Toda tabla con `institution_id`; lecturas con `is_member()` | RLS |
| Aprobación | Solo `decide_review()` puede poner aprobado/observado/denegado; bloquea la autorrevisión | trigger `guard_campaign_write` |
| Integridad | Editar una campaña aprobada la devuelve a borrador; versión automática en cada cambio | triggers |
| Auditoría | `audit_log` de solo inserción (UPDATE y DELETE bloqueados por trigger) | trigger `block_audit_mutation` |
| Archivos | Bucket privado, 25 MB, extensiones permitidas, carpeta por institución | políticas `storage.objects` |
| Límites | Tamaños máximos por columna; hasta 5 instituciones creadas por cuenta | CHECK y `create_institution` |
| Errores | Mensajes genéricos al iniciar sesión, sin revelar si el correo existe | `login.tsx` |

## Verificación ejecutada (30-10-2026)
Prueba SQL con 3 cuentas temporales y 2 instituciones, deshecha al final (`docs/rls-isolation.sql`):
- B ve 0 campañas de A, no puede escribir en A, no puede agregarse como admin de A ni revisar campañas de A.
- El editor no puede aprobar. Nadie puede revisar su propia campaña. Denegar sin motivo se rechaza.
- El revisor no puede crear ni editar campañas. El revisor externo aprueba correctamente.
- Se borraron 0 filas de auditoría al intentarlo. Se generaron versiones.
- **Defecto encontrado y corregido:** `has_inst_role` devolvía NULL para personas ajenas y dejaba pasar `add_member_by_email` y `decide_review`. Se corrigió con `coalesce` y se volvió a probar.

## Modelo de amenazas (STRIDE, resumen)
| Amenaza | Mitigación | Estado |
|---|---|---|
| Suplantación | Auth gestionada, confirmación por correo | Hecho. MFA **PENDIENTE** |
| Manipulación del rol desde el cliente | Rol solo en DB, RLS | Hecho |
| Aprobar lo propio | Chequeo en `decide_review` y trigger | Hecho |
| Repudio | Auditoría de solo inserción con actor | Hecho |
| Fuga entre instituciones | RLS por membresía | Hecho y probado |
| Enumeración de correos | `add_member_by_email` solo para admins | Hecho (un admin sí puede saber si un correo existe) |
| Abuso por fuerza bruta | Límites propios de Auth | Sin límite propio de la app (**PENDIENTE**: no hay primitiva estándar) |
| Archivos maliciosos | Extensión permitida, bucket privado | Verificación del contenido real en el servidor **PENDIENTE** |
| Contraseñas filtradas | — | Activar "Password HIBP Check" **PENDIENTE (propietario)** |

## Inventario de datos
| Dato | Dónde | Sensibilidad |
|---|---|---|
| Correo, nombre visible | Auth, `profiles` | Personal: visible solo para quien comparte institución |
| Campañas, revisiones, versiones | Postgres | Institucional |
| Auditoría | Postgres | Institucional, solo admin/revisor |
| Datos del modo local | Navegador de cada persona | No sale del equipo salvo con la copia opcional |
No se deben cargar datos de estudiantes ni documentos sensibles.

## Exposición pública
La web publicada sigue siendo pública. Sin sesión solo da acceso al modo local del propio navegador. Los datos institucionales requieren sesión y membresía. Recomendación: hasta terminar el QA, no invitar a usuarios reales con datos sensibles.
