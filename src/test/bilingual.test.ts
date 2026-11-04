import { describe, it, expect } from 'vitest';
import { generateBilingual } from '@/lib/generator';
import { applyGenerated, missingFields, requiredLangs, contentFor } from '@/lib/campaign-content';
import { approvalBlockers } from '@/lib/rules';
import { demoCampaigns } from '@/lib/demo-data';
import type { Campaign } from '@/lib/types';

const base = (): Campaign => { const { contentEn: _x, ...d } = demoCampaigns()[0]!; return { ...d, reviewer: 'Ana', efemeride: { enabled: false, name: '', date: '', sourceUrl: '', confirmed: false } }; };
const input = { theme: 'Ciberseguridad', campaignType: '', tone: '', audience: 'Estudiantes', efemerideEnabled: false, efemerideName: '' };

describe('bilingual generation', () => {
  it('maps the content language field, independent of UI', () => {
    expect(requiredLangs({ language: 'Español' })).toEqual(['es']);
    expect(requiredLangs({ language: 'Inglés' })).toEqual(['en']);
    expect(requiredLangs({ language: 'Español e inglés' })).toEqual(['es', 'en']);
  });
  it('produces real English, never a copy of Spanish', () => {
    const g = generateBilingual(input);
    expect(g.en.title).toBe('Your digital safety starts with you');
    expect(g.en.title).not.toBe(g.es.title);
    expect(g.en.bullets.some(b => g.es.bullets.includes(b))).toBe(false);
  });
  it('leaves custom free-text titles empty in English (pending translation)', () => {
    const g = generateBilingual({ ...input, theme: 'Feria científica regional' });
    expect(g.en.title).toBe('');
    expect(g.es.title).toBe('Feria científica regional');
  });
  it('"both" fills ES and EN simultaneously', () => {
    const g = generateBilingual(input);
    const c = applyGenerated(base(), g, ['es', 'en'], true);
    expect(missingFields(c, 'es')).toEqual([]);
    expect(missingFields(c, 'en')).toEqual([]);
  });
  it('EN only does not touch Spanish', () => {
    const b = base();
    const c = applyGenerated(b, generateBilingual(input), ['en'], true);
    expect(contentFor(c, 'es')).toEqual(contentFor(b, 'es'));
    expect(contentFor(c, 'en').cta).toBe('Think. Protect. Share with care.');
  });
  it('fill-empty mode keeps human edits', () => {
    const b = { ...base(), contentEn: { title: 'Human title', tagline: '', bullets: [], cta: '', slogan: '' } };
    const c = applyGenerated(b, generateBilingual(input), ['en'], false);
    expect(contentFor(c, 'en').title).toBe('Human title');
    expect(contentFor(c, 'en').tagline).toBe('Small habits that protect the whole community');
  });
});

describe('bilingual approval integrity', () => {
  it('bilingual campaign missing English cannot be approved', () => {
    const c = { ...base(), language: 'Español e inglés' };
    expect(approvalBlockers(c)).toContain('Versión inglesa incompleta: faltan campos esenciales.');
  });
  it('bilingual campaign missing EN CTA only is still blocked', () => {
    const g = generateBilingual(input);
    const c = applyGenerated({ ...base(), language: 'Español e inglés' }, g, ['es', 'en'], true);
    expect(approvalBlockers(c)).toEqual([]);
    expect(approvalBlockers({ ...c, contentEn: { ...c.contentEn!, cta: ' ' } }).length).toBe(1);
  });
  it('Spanish-only campaign does not require English', () => {
    expect(approvalBlockers({ ...base(), language: 'Español' })).toEqual([]);
  });
});
