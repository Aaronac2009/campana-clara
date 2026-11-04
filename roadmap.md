# Campaña Clara
## Multiusuario (autorizado 2026-10-30)
- [x] Cloud + auth email/contraseña, sesión, cierre, recuperación
- [x] Esquema multi-tenant con RLS y roles (probado en SQL)
- [x] Migración local opt-in idempotente (upsert real en navegador sin probar)
- [x] Revisor no aprueba su propio trabajo (servidor)
- [x] Documentación /docs (C4, ER, RBAC, amenazas, ADR, QA, operación)
- [x] Pruebas de roles/aislamiento y regresión
- [ ] Flujo completo con cuentas confirmadas en navegador (necesita correos reales confirmados)
- [ ] Subida de archivos institucional, edición en nube desde el editor, PDF, MFA
- [ ] Pulido UX editorial (después del núcleo)

- [x] Cierre acotado: 406 recursos decodificados, moderación/recarga y exportaciones comprobadas; respaldo ambiguo rechazado antes de fusionar. Ver CIERRE_BIBLIOTECA_MODERACION.md.
- [x] Lote escalable: 406 entradas cargadas (155 gráficos originales, 249 láminas ISO de banderas, 2 fotos CC0), favoritos/recientes, orientación, preview y pruebas.
- [ ] Objetivo de 3000 recursos: faltan 2594; requiere próximos lotes curados/licenciados, no trabajo automático pendiente.
- [x] Moderación local: decisiones distintas, comentario, versión ES/EN, responsable, historial y regresiones.
- [x] Expandir biblioteca visual: 64 recursos integrados (62 gráficos y 2 fotos CC0), editor, dashboard, 89 pruebas y recorridos reales de carga/exportación/guardado.
- [x] Finish follow-up: studio import/export, remaining dynamic translations, guarded storage errors, legacy-backup language preservation and expanded browser checks.
- [x] Recover and preserve dashboard; exact identity signature kept.
- [x] Local image studio with secure import, editing, history, comparison and export.
- [x] Nine-view navigation: demo login, library + resource detail, import/export, activity log, preferences.
- [x] Campaign planning fields (objective, channel, dates, tags) and combined filters.
- [x] Replace runtime DOM translation with explicit typed UI dictionaries across existing content routes; preserve user copy.
- [x] Visible system/light/dark control; synchronous local save errors; separate ES/EN campaign copy with preview/export and backups.
- [ ] Match layout to the reference image (blocked: image not available in this chat).
- [ ] Original BDS devs logo (blocked: file not provided).
- [ ] Real accounts, multi-institution data, shared storage, tamper-proof audit (needs backend; not authorized).
- [x] Campañas Parte A: presets vertical/cuadrado/horizontal, ajuste seguro, Añadir imagen (catálogo demo + subida)
- [x] Profile header/footer/slogan and per-campaign toggles; ES/EN content tabs and editor localization.
- [ ] Additional campaign templates (not part of this correction).
