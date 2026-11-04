<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the image studio isolated from campaign persistence; its files and edit history stay in component memory because imported media must not be stored or uploaded.
- Validate image signatures and decode before canvas use; reject user SVG and animation, and export SVG only as a generated raster wrapper to prevent executable user markup.
- Persist app state under a versioned localStorage key via `migrate()` in the store, leaving the previous key untouched as a backup, so upgrades never lose user data.
- Media library blobs live in IndexedDB (metadata in the store), separate from the image studio, because localStorage is too small and the studio must stay memory-only.
- Backup imports go through `parseBackup` (strict per-field validation, size cap) and merge by id; never replace local data silently.
- UI copy uses typed centralized dictionaries through useI18n/useStore.t; localize is reserved for registered enum labels and validation messages, never user content, so React owns all rendered text without DOM mutation.
- Campaign top-level content stays Spanish for backward compatibility; optional contentEn stores independent English copy, resolved only by campaignForLanguage for previews/exports, so existing campaigns and consumers remain intact.
- Persist local mutations synchronously before reporting success; failed writes keep the previous state and report an error, so storage quotas never masquerade as successful saves.
- Wrap local event mutations with runLocalAction; it handles only LocalSaveError already reported by the store, so failed saves abort success paths without hiding unrelated bugs.
- When merging legacy backups, preserve absent optional language/slogan fields from matching local campaigns; explicit incoming values still apply after confirmation, so older backups cannot erase new-language work accidentally.
- Poster art comes only from `posterLayout` (zones per orientation, shrink-then-hide fitting, escaped text); campaign images are references (stock id or library id), never stored bytes, so localStorage stays small and user SVG is never inlined.
- Theme: `prefs.theme` (system/light/dark) toggles `.dark` tokens in styles.css; THEME_BOOT inline script in __root applies it before paint to avoid a flash.
- Profile logos are accepted only as signature-verified, decodable PNG/JPEG/WebP data URLs (`lib/logo.ts`); artwork ignores any other stored logo.
- Visual catalogue entries keep stable reference IDs, explicit provenance and dimensions; the shared catalogue serves library and picker, while photo exports embed fetched app-asset bytes to avoid remote SVG dependencies.
- Catalogue thumbnails are paginated with indexed bilingual search; favorites and recent reference IDs use existing preferences, never duplicate artwork bytes in local persistence.
- Local review decisions use an atomic store transaction and a validated per-campaign history; require current review status, reviewer and reason for changes/denial to prevent stale or duplicate decisions.
- Multi-institution data lives in Lovable Cloud; authorization is enforced only by RLS and definer functions keyed on `memberships` (roles never come from the client), while `lib/cloud.ts` merely shapes UI, so a tampered client cannot escalate.
- Campaign approval states are set exclusively by `decide_review()` (guard trigger blocks direct writes and self-review), so every approval has a recorded reviewer decision.
- Local mode stays intact; local→cloud copy is opt-in and idempotent via `unique(institution_id, local_id)` and never migrates local approvals.
- Technical documentation lives in `/docs`; it records only implemented behaviour and marks gaps as pending.
