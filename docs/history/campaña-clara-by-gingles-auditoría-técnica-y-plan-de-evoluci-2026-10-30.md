# Campaña Clara by Gingles: auditoría técnica y plan de evolución

## 1. Estado real comprobado
- 14 páginas: inicio, campañas, crear/editar, biblioteca y detalle, estudio, criterios/revisión, calendario, historial, importar/exportar, perfil y acceso.
- Todo se guarda en el navegador de cada persona (localStorage con versión y migración; archivos en IndexedDB). No hay servidor de datos, cuentas ni almacenamiento compartido.
- El acceso solo navega al inicio: no comprueba nada y ya se presenta como demostración.
- Biblioteca: 406 recursos (155 gráficos SVG originales, 249 láminas de banderas MIT y 2 fotos CC0).
- 102 pruebas en 10 archivos. Las reglas de arquitectura están en AGENTS.md.

## 2. Exposición pública actual (riesgo principal)
- La web publicada no guarda en un servidor nada de lo que escriben las personas. Cada visitante solo ve los datos de su propio navegador. Hoy no hay fuga entre usuarios.
- Riesgos reales: (a) alguien puede creer que el acceso protege algo; (b) en un equipo compartido, cualquiera que use el mismo navegador ve las campañas; (c) los respaldos JSON descargados contienen todo y no van cifrados.
- Recomendación inmediata, antes de usar datos reales: no cargar datos personales ni documentos sensibles; mantener un indicador discreto de piloto; valorar dejar la web publicada visible solo para el espacio de trabajo hasta tener cuentas reales. Es un ajuste de configuración y no cuesta créditos de código.

## 3. Lo que se puede hacer sin servidor (bajo costo)
Cabe en una sola solicitud compacta (unos 3 a 6 créditos):
- Quitar los textos de guía, demo o prueba que no hagan falta, y dejar un único indicador de piloto honesto.
- Pulir espaciados y jerarquía sin cambiar la identidad ni el logo.
- Revisar que todos los textos nuevos de la interfaz tengan su versión EN.

Hay que dividirlo en varias solicitudes (cada una de 5 a 12 créditos):
- Plantillas editables: ampliar `posterLayout` a capas descritas por datos.
- Editor con capas, rotación libre, posición, tamaño, texto y color sobre el SVG del afiche. Se reutilizan `Poster.tsx`, `poster.ts` y `image-studio.ts`.
- Exportación PDF sin dependencias nuevas, generando el PDF en el navegador a partir del raster del afiche. Exportación por lotes ES y EN.
- Historial de versiones local por campaña: una lista de copias limitada, con el mismo patrón que `reviewHistory`.
- Lista de comprobación editorial ampliada (ortografía, fuentes, referencias) como verificación humana. No se afirmará que hay una corrección automática.

## 4. Lo que necesita servidor, cuentas y almacenamiento (Lovable Cloud)
- Autenticación real (correo y contraseña; MFA opcional), recuperación segura y página para restablecer la contraseña.
- Datos y archivos compartidos por institución con aislamiento real, roles, auditoría que no se pueda alterar y respaldos del lado del servidor.
- Biblioteca grande con fotos reales: almacenamiento con límites, verificación del tipo real del archivo y atribución.
- GIF y video corto: es viable en el navegador para piezas sencillas. Los videos pesados necesitarían procesamiento en servidor, que hoy no está aprobado.
- Corrección ortográfica asistida por IA: solo con tu aprobación previa, porque consume uso.

## 5. Esquema multi-institución sugerido
```text
institutions(id, name, type, region, logo_path?, created_at)
memberships(user_id, institution_id, role)          -- roles en tabla aparte
profiles(user_id, display_name, locale, theme)
campaigns(id, institution_id, status, content_es jsonb, content_en jsonb,
          planning jsonb, image_ref, format, created_by, updated_at)
campaign_versions(id, campaign_id, snapshot jsonb, author, created_at)
reviews(id, campaign_id, decision, lang, reviewer, comment, at)
assets(id, institution_id|null, kind, mime, size, w, h, storage_path,
       license, author, source_url, attribution, tags[], created_by)
calendar_entries(id, institution_id, ..., source_org, verified)
audit_log(id, institution_id, actor, action, target, detail, at)  -- solo inserción
```
- Todas las tablas tienen seguridad por fila (RLS) por `institution_id`, mediante funciones de pertenencia y de rol. El rol nunca se guarda en el perfil.
- Archivos: carpetas privadas por institución (`{institution_id}/...`) y enlaces firmados de corta duración.
- Los logos oficiales solo se suben como archivos autorizados al perfil de la institución. Si falta el archivo, queda un espacio vacío configurable.

## 6. Matriz de roles
| Acción | Superadmin | Admin inst. | Editor | Revisor | Lector |
|---|---|---|---|---|---|
| Crear y gestionar instituciones | Sí | No | No | No | No |
| Gestionar miembros y roles | Sí | Su institución | No | No | No |
| Perfil y logo institucional | Sí | Sí | No | No | No |
| Crear y editar campañas | Sí | Sí | Sí | No | No |
| Enviar a revisión | Sí | Sí | Sí | No | No |
| Aprobar, pedir cambios o denegar | Sí | Sí | No | Sí (no lo propio) | No |
| Subir recursos | Sí | Sí | Sí | No | No |
| Ver y exportar | Sí | Sí | Sí | Sí | Sí |
| Ver auditoría | Sí | Su institución | No | Solo lectura | No |

## 7. Migración local sin pérdida
- Nunca se borra localStorage ni IndexedDB. Al iniciar sesión por primera vez se ofrece "Subir mis datos locales a mi institución", con un resumen previo y confirmación.
- Se reutilizan `parseBackup` (validación estricta) y la combinación por id. Cada envío al servidor se puede reintentar y no duplica datos.
- Los datos locales quedan intactos como respaldo. El modo local sigue disponible hasta que decidas retirarlo.

## 8. Biblioteca, atribución y licencias
- Cada recurso guarda licencia, autor, fuente y fecha de verificación (el patrón actual de `stock.ts`).
- Ampliar con lotes curados de fuentes CC0 o de dominio público verificadas a mano. No se inflan cifras y se revisa por lotes, porque cada lote cuesta créditos.
- Ningún escudo, sello ni logo oficial sale del catálogo: solo de archivos que la institución suba con autorización.

## 9. Controles de seguridad (referencia OWASP ASVS / Top 10)
- Validación en el servidor de todo lo que se envía, límites de tamaño, verificación de la firma real del archivo, rechazo de SVG de usuario (ya aplicado en el navegador).
- RLS en todas las tablas, ninguna clave secreta en el navegador, límites de intentos al iniciar sesión, cabeceras de seguridad.
- Minimización de datos: sin datos de estudiantes. Auditoría solo de inserción. Respaldos programados.
- No se afirmará ninguna certificación.

## 10. Fases y costo estimado (conservador, no garantizado)
| Fase | Contenido | Servidor | Créditos aprox. |
|---|---|---|---|
| A | Limpieza de textos de demo, indicador de piloto, pulido y revisión EN | No | 3-6 |
| B | Historial de versiones local y PDF | No | 5-10 |
| C | Plantillas y editor por capas (dividido en 2) | No | 15-25 |
| D | Cloud: cuentas, instituciones, roles, RLS, auditoría | Sí | 15-25 |
| E | Almacenamiento de archivos y migración local al servidor | Sí | 10-20 |
| F | GIF y video corto sencillo en el navegador | No | 8-15 |
| G | Lotes de biblioteca curada (por lote) | No | 3-8 |

Para reservar 100 créditos a producción: hacer A ahora, posponer C y F, y llevar D+E como bloque de producción (unos 25 a 45). No puedo garantizar cifras exactas.

## 11. Pruebas y criterios de aceptación
- Las 102 pruebas actuales siguen pasando en cada fase, y se añaden pruebas de cada regla nueva (permisos por rol, aislamiento, migración sin pérdida, PDF, versiones).
- Con cuentas reales: un usuario de la institución A no puede leer ni escribir datos de B (probado con dos cuentas reales). Un lector no puede editar. Un revisor no puede aprobar su propia campaña.
- La migración conserva todas las campañas, versiones ES/EN y referencias de imagen. Los datos locales siguen intactos.
- Se mantienen la identidad, la firma "by Gingles · Powered by BDS devs", el tema claro/oscuro y ES/EN completos.
- Nada se da por verificado sin haberlo ejecutado.

## Detalles técnicos
- Reutilizables: `store.tsx` (migración y guardado seguro), `backup.ts`, `moderation.ts`, `rules.ts`, `campaign-content.ts`, `poster.ts`/`Poster.tsx`, `media.ts`, `logo.ts`, `StockCatalog.tsx`, `i18n.ts`.
- Con servidor: un adaptador de repositorio detrás del store (local o servidor), lógica en el servidor protegida con autenticación, y las rutas protegidas bajo un área de acceso restringido.
- Dependencias nuevas, solo si se aprueban: ninguna para A y B. Posible codificador de GIF ligero en F.
- Riesgos: el editor por capas es la parte más cara y frágil; la migración necesita confirmación; los lotes de imágenes requieren verificación de licencia uno a uno.
