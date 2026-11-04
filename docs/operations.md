# Operación, migración, QA y administración

## Plan de migración y vuelta atrás
- Migraciones aplicadas: `drizzle/migrations/0000` (esquema, RLS, funciones), `0001` (bucket y auditoría de instituciones), `0002` (auditoría genérica), `0003` (corrección de `has_inst_role`).
- La copia local→institución es opcional, se puede repetir y no sobrescribe. Vuelta atrás: el modo local sigue intacto; las campañas copiadas puede borrarlas un admin.
- Antes de cambiar el esquema: exportar un respaldo JSON desde "Importar / exportar".

## Manual de administración
1. Crear cuenta en **Acceso** y confirmar el correo.
2. En **Espacio institucional**, crear la institución. Quien la crea pasa a ser admin.
3. Cada persona crea su cuenta; el admin la agrega con su correo y le asigna un rol.
4. Editores: "Copiar a la institución" y luego "Enviar a revisión". Revisores: aprobar ES/EN, pedir cambios o denegar.
5. Superadmin: no tiene interfaz. Solo se asigna insertando a la persona en `platform_admins` desde la base de datos.

## Despliegue
Publicar lo decide el propietario (no se publicó). Antes de hacerlo:
- Activar "Password HIBP Check" (More → Users → Auth settings → Email).
- Comprobar las URL de redirección para `/reset-password`.

## Plan de QA y trazabilidad
| Requisito | Prueba | Resultado (30-10-2026) |
|---|---|---|
| Aislamiento entre instituciones | `docs/rls-isolation.sql` | Pasó tras corregir `has_inst_role` |
| Sin autorrevisión | SQL y `src/test/cloud.test.ts` | Pasó |
| El editor no aprueba | SQL (trigger) | Pasó |
| Auditoría inalterable | SQL | Pasó (0 filas borradas) |
| Matriz de roles en la interfaz | `cloud.test.ts` | Pasó |
| Migración sin pérdida ni duplicados | `cloud.test.ts` (local_id, sin mutación, ES/EN separados) | Pasó; el upsert real en el navegador **PENDIENTE** |
| Ruta protegida | Playwright: `/espacio` sin sesión → `/login` | Pasó |
| Error de acceso genérico | Playwright | Pasó |
| Regresión existente | `bunx vitest run` (102 anteriores + 11 nuevas) | Pasó |
| Flujo completo con cuentas confirmadas en el navegador | — | **PENDIENTE** (requiere confirmar correos) |

## Pendiente
MFA, subida de archivos a la institución con verificación del contenido real, editar en la nube desde el editor actual, plantillas en la nube, historial de versiones visible, exportación PDF, GIF/video, superadmin con interfaz, límites propios de intentos.

## Bilingual content (ES/EN) — implemented
- The campaign "Idioma del contenido" field (Español / English / Español e inglés) decides which content versions are generated and required; the UI language never does.
- Local generator ships hand-written English for each template; user free text (custom theme, commemoration name) is left empty in EN and shown as "Pendiente de traducción". No machine translation, no ES→EN copying.
- Regenerating with existing text asks to replace or fill empty fields only (human edits kept).
- Editor shows an ES/EN comparison table, per-language generation, and a bilingual PNG package export.
- Approval (local) is blocked when a required language lacks title, message, body or CTA. Tests: `src/test/bilingual.test.ts` (9).
- Pending: cloud `decide_review()` still checks only the title of the approved language; legal/normative source registry, layered editorial findings, PDF export and institutional collections (C/D) not yet implemented; no official logos added.
