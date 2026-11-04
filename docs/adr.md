# Decisiones de arquitectura (ADR)

1. **Lovable Cloud para auth, base de datos y archivos.** No requiere cuentas externas ni claves de pago.
2. **Autorización en la base de datos (RLS + funciones definer), no en la interfaz.** La interfaz puede ser manipulada; `cloud.ts` solo decide qué botones mostrar.
3. **Roles por institución en `memberships`; superadmin en `platform_admins`.** Evita escalar privilegios desde el perfil. No hay superadmin por defecto.
4. **Las decisiones de aprobación solo pasan por `decide_review()`.** Así no hay aprobación sin registro, ni autorrevisión.
5. **Modo local conservado y migración opcional e idempotente** (`unique(institution_id, local_id)` + `ignoreDuplicates`). Nunca se borra localStorage/IndexedDB.
6. **Las aprobaciones locales no se migran.** No tienen una identidad verificable detrás.
7. **Contenido ES y EN en columnas separadas** (`title_es/en`, `content_es/en`). No hay traducción automática.
8. **Auditoría de solo inserción escrita por triggers.** Los clientes no tienen permiso de INSERT directo.
