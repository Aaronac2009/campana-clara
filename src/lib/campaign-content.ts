import type { Campaign, CampaignContent, Lang } from './types';

export const emptyContent = (): CampaignContent => ({ title: '', tagline: '', bullets: [], cta: '', slogan: '' });
/** Legacy top-level copy remains the Spanish source of truth. */
export function contentFor(c: Campaign, lang: Lang): CampaignContent {
  return lang === 'es' ? { title: c.title, tagline: c.tagline, bullets: c.bullets, cta: c.cta, slogan: c.slogan ?? '' } : c.contentEn ?? emptyContent();
}
export function editContent(c: Campaign, lang: Lang, patch: Partial<CampaignContent>): Campaign {
  return lang === 'es' ? { ...c, ...patch } : { ...c, contentEn: { ...contentFor(c, 'en'), ...patch } };
}
export function campaignForLanguage(c: Campaign, lang: Lang): Campaign {
  return { ...c, ...contentFor(c, lang), artLang: lang };
}
/** Content languages the campaign commits to, from its "Idioma" field (independent from the UI language). */
export function requiredLangs(c: Pick<Campaign, 'language'>): Lang[] {
  if (c.language === 'Inglés') return ['en'];
  if (c.language === 'Español e inglés') return ['es', 'en'];
  return ['es'];
}
export type EssentialField = 'title' | 'tagline' | 'bullets' | 'cta';
/** Essential fields that are really empty in one language (never inferred from the other language). */
export function missingFields(c: Campaign, lang: Lang): EssentialField[] {
  const x = contentFor(c, lang);
  const out: EssentialField[] = [];
  if (!x.title.trim()) out.push('title');
  if (!x.tagline.trim()) out.push('tagline');
  if (!x.bullets.some(b => b.trim())) out.push('bullets');
  if (!x.cta.trim()) out.push('cta');
  return out;
}
const isBlank = (x: CampaignContent) => !x.title.trim() && !x.tagline.trim() && !x.cta.trim() && !x.bullets.some(b => b.trim());
/**
 * Applies generated copy to the chosen languages. With overwrite=false only empty
 * fields are filled, so human edits survive; with overwrite=true the language is replaced.
 */
export function applyGenerated(c: Campaign, gen: Partial<Record<Lang, Omit<CampaignContent, 'slogan'>>>, langs: Lang[], overwrite: boolean): Campaign {
  let next = c;
  for (const lang of langs) {
    const g = gen[lang]; if (!g) continue;
    const cur = contentFor(next, lang);
    const patch: Partial<CampaignContent> = overwrite || isBlank(cur) ? { title: g.title, tagline: g.tagline, bullets: g.bullets, cta: g.cta } : {
      ...(cur.title.trim() ? {} : { title: g.title }),
      ...(cur.tagline.trim() ? {} : { tagline: g.tagline }),
      ...(cur.bullets.some(b => b.trim()) ? {} : { bullets: g.bullets }),
      ...(cur.cta.trim() ? {} : { cta: g.cta }),
    };
    next = editContent(next, lang, patch);
  }
  return next;
}
export const hasContent = (c: Campaign, lang: Lang) => !isBlank(contentFor(c, lang));
