# Campaña Clara by Gingles: documentación técnica

Estado al 30-10-2026. Solo describe lo implementado; lo pendiente se marca **PENDIENTE**.
Documentos: [arquitectura](#1-arquitectura-c4) · [seguridad](security.md) · [decisiones ADR](adr.md) · [operación, QA y migración](operations.md).

## 1. Arquitectura (C4)
### Contexto
```text
[Equipo editorial] --navegador--> [Campaña Clara (web)] --HTTPS--> [Lovable Cloud: Auth + Postgres + Storage]
                                          \--> almacenamiento local del navegador (modo local, sin cuenta)
```
### Contenedores
| Contenedor | Tecnología | Responsabilidad |
|---|---|---|
| App web | React 19 + TanStack Start (SSR en Workers) | Interfaz ES/EN, editor, biblioteca, Estudio de imágenes |
| Modo local | localStorage versionado + IndexedDB | Campañas, perfil y archivos sin cuenta (modo anterior, se conserva) |
| Auth | Lovable Cloud Auth | Correo/contraseña, confirmación, recuperación |
| Base de datos | Postgres con RLS | Instituciones, membresías, campañas, versiones, revisiones, recursos, plantillas, auditoría |
| Archivos | Bucket privado `institution-assets` | Carpeta por institución `{institution_id}/…`. **PENDIENTE**: interfaz de subida |

### Componentes principales
- `src/routes/login.tsx`, `reset-password.tsx`: acceso, alta, recuperación.
- `src/routes/_authenticated/route.tsx`: protege el subárbol (sin sesión → `/login`).
- `src/routes/_authenticated/espacio.tsx`: instituciones, miembros/roles, campañas compartidas, revisión, migración local y auditoría.
- `src/lib/cloud.ts`: matriz de roles para la interfaz y la conversión local→nube. La autorización real vive en la base de datos.
- Sin cambios: `store.tsx`, `backup.ts`, `moderation.ts` (revisión local), `poster.ts`, `media.ts`, `StockCatalog.tsx`, `ImageStudio.tsx`.

## 2. Casos de uso (UML, resumen)
```text
Visitante ──(crear cuenta / iniciar sesión / recuperar contraseña)
Usuario ───(crear institución) → pasa a admin de esa institución
Admin ─────(agregar miembro por correo, cambiar rol)
Editor ────(copiar campañas locales, enviar a revisión)
Revisor ───(aprobar ES/EN, pedir cambios, denegar) [nunca sobre lo propio]
Admin/Rev ─(ver auditoría)
Lector ────(ver campañas)
```

## 3. Secuencias
**Autenticación**
```text
Usuario→App: correo+contraseña → App→Auth: signInWithPassword → Auth: sesión (JWT)
App→/espacio: beforeLoad getUser() (revalida con Auth) → consultas con JWT → RLS filtra por membresía
```
**Revisión**
```text
Editor: UPDATE status='revision' (trigger permite solo borrador/revision)
Revisor: rpc decide_review(id, decisión, idioma, motivo)
  DB: verifica rol, que no sea creador/último editor, estado 'revision', motivo, título del idioma
  DB: INSERT reviews → UPDATE status → trigger crea versión → trigger escribe audit_log
```

## 4. Modelo entidad-relación
```text
institutions 1─* memberships *─1 auth.users 1─1 profiles
institutions 1─* campaigns 1─* campaign_versions
                 campaigns 1─* reviews
institutions 1─* assets   institutions 1─* templates   institutions 1─* audit_log
platform_admins (superadmin; sin interfaz, se asigna solo por la base de datos)
```
Roles por institución (`app_role`): `admin`, `editor`, `reviewer`, `reader`. El superadmin es una tabla aparte; no hay ninguno creado por defecto.

## 5. Matriz RBAC (aplicada en RLS y funciones)
| Acción | Superadmin | Admin | Editor | Revisor | Lector |
|---|---|---|---|---|---|
| Ver datos de la institución | Sí | Sí | Sí | Sí | Sí |
| Crear/editar campaña | Sí | Sí | Sí | No | No |
| Borrar campaña / recurso | Sí | Sí | No | No | No |
| Aprobar, pedir cambios, denegar | Sí* | Sí* | No | Sí* | No |
| Gestionar miembros | Sí | Sí (no a sí mismo) | No | No | No |
| Ver auditoría | Sí | Sí | No | Sí | No |
| Subir archivos (bucket) | Sí | Sí | Sí | No | No |
\* Nunca sobre una campaña que creó o editó por última vez.
