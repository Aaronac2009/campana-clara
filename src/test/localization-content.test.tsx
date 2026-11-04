import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoreProvider, useStore, KEY, KEY_V1, seed, migrate, persistState, applyTheme, runLocalAction, LocalSaveError } from '@/lib/store';
import { DICTS, localize, translate, type TKey } from '@/lib/i18n';
import { campaignForLanguage, contentFor, editContent } from '@/lib/campaign-content';
import { buildBackup, parseBackup, mergeById } from '@/lib/backup';
import { formatDate } from '@/components/app/ui-bits';
import { posterLayout } from '@/lib/poster';
import { DEFAULT_PROFILE, demoCampaigns } from '@/lib/demo-data';

beforeEach(() => { localStorage.clear(); });

describe('explicit localization', () => {
  it('registers both languages for every interface key', () => {
    expect(Object.keys(DICTS.en).sort()).toEqual(Object.keys(DICTS.es).sort());
    for (const key of Object.keys(DICTS.es) as TKey[]) expect(translate('en', key).trim().length).toBeGreaterThan(0);
  });
  it('never translates unregistered user text', () => {
    expect(localize('en', 'Mi institución privada')).toBe('Mi institución privada');
  });
  it('restores the saved language and changes React text without touching input content', async () => {
    function Probe() { const { t, setPrefs } = useStore(); return <><h1>{t('nav.create')}</h1><input aria-label="User text" defaultValue="Guardar borrador" /><button onClick={() => setPrefs({ lang: 'en' })}>EN</button></>; }
    render(<StoreProvider><Probe /></StoreProvider>);
    fireEvent.click(screen.getByText('EN'));
    expect(screen.getByRole('heading').textContent).toBe('Create campaign');
    expect((screen.getByLabelText('User text') as HTMLInputElement).value).toBe('Guardar borrador');
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}').prefs.lang).toBe('en');
  });
  it('reads English from storage on a fresh mount', async () => {
    localStorage.setItem(KEY, JSON.stringify({ ...seed(), prefs: { ...seed().prefs, lang: 'en' } }));
    function Probe() { const { t } = useStore(); return <h1>{t('nav.home')}</h1>; }
    render(<StoreProvider><Probe /></StoreProvider>);
    await waitFor(() => expect(screen.getByRole('heading').textContent).toBe('Home'));
  });
  it('ready exposes restored campaign content even when demo and saved campaign counts match', async () => {
    const saved = seed();
    saved.campaigns = saved.campaigns.map((c, index) => index === 0 ? editContent(c, 'en', { title: 'Saved English version' }) : c);
    localStorage.setItem(KEY, JSON.stringify(saved));
    const observed: string[] = [];
    function Probe() { const { ready, campaigns } = useStore(); if (ready) observed.push(campaigns[0]?.contentEn?.title ?? ''); return null; }
    render(<StoreProvider><Probe /></StoreProvider>);
    await waitFor(() => expect(observed).toContain('Saved English version'));
    expect(observed).not.toContain('');
  });
});

describe('local preferences and preservation', () => {
  it('loads dark preference and keeps v1 backup untouched when preferences change', async () => {
    const old = JSON.stringify({ ...seed(), prefs: { lang: 'en', theme: 'dark' } });
    localStorage.setItem(KEY_V1, old);
    function Probe() { const { prefs, setPrefs } = useStore(); return <button onClick={() => setPrefs({ theme: 'light' })}>{prefs.theme}</button>; }
    render(<StoreProvider><Probe /></StoreProvider>);
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
    fireEvent.click(screen.getByText('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(KEY_V1)).toBe(old);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}').prefs.theme).toBe('light');
  });
  it('respects dark system preference', () => {
    const spy = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    applyTheme('system'); expect(document.documentElement.classList.contains('dark')).toBe(true); spy.mockRestore();
  });
  it('surfaces storage failures instead of pretending to save', () => {
    expect(() => persistState({ setItem: () => { throw new Error('quota'); } }, seed())).toThrow('quota');
  });
  it('does not replace unreadable saved data with demo content', async () => {
    localStorage.setItem(KEY, '{broken');
    function Probe() { const { setPrefs } = useStore(); return <button onClick={() => { try { setPrefs({ lang: 'en' }); } catch { /* expected */ } }}>Change</button>; }
    render(<StoreProvider><Probe /></StoreProvider>);
    fireEvent.click(screen.getByText('Change'));
    expect(localStorage.getItem(KEY)).toBe('{broken');
  });
  it('failed local actions abort before any success callback', async () => {
    const success = vi.fn();
    expect(await runLocalAction(() => { throw new LocalSaveError('quota'); success(); })).toBe(false);
    expect(success).not.toHaveBeenCalled();
  });
  it('does not hide unrelated programming errors', async () => {
    await expect(runLocalAction(() => { throw new Error('unexpected'); })).rejects.toThrow('unexpected');
  });
});

describe('independent campaign languages', () => {
  const legacy = () => { const c = demoCampaigns()[0]; if (!c) throw new Error('missing fixture'); return c; };
  it('keeps legacy content as Spanish and starts English empty', () => {
    const c = legacy(); const restored = migrate({ campaigns: [c] }).campaigns[0];
    if (!restored) throw new Error('missing campaign');
    expect(contentFor(restored, 'es').title).toBe(c.title);
    expect(contentFor(restored, 'en')).toEqual({ title: '', tagline: '', bullets: [], cta: '', slogan: '' });
  });
  it('editing English does not overwrite Spanish, images or format', () => {
    const c = { ...legacy(), format: 'fb_h' as const };
    const next = editContent(c, 'en', { title: 'Respect matters', tagline: 'Our community', bullets: ['Listen'], cta: 'Join', slogan: 'Together' });
    expect(next.title).toBe(c.title); expect(next.format).toBe('fb_h');
    expect(contentFor(next, 'en').title).toBe('Respect matters');
  });
  it('backup round trips both versions and export renders only selected copy', () => {
    const c = editContent(legacy(), 'en', { title: 'Respect matters', cta: 'Join', slogan: 'Together' });
    const backup = parseBackup(JSON.stringify(buildBackup({ campaigns: [c], calendar: [], media: [], activity: [], profile: DEFAULT_PROFILE })));
    const restored = backup.campaigns[0]; if (!restored) throw new Error('missing campaign');
    expect(restored.contentEn).toEqual(c.contentEn);
    const svg = posterLayout(campaignForLanguage(restored, 'en'), DEFAULT_PROFILE, 'fb_h').svg;
    expect(svg).toContain('Respect matters'); expect(svg).not.toContain(c.title);
    expect(posterLayout(campaignForLanguage(restored, 'es'), DEFAULT_PROFILE, 'fb_h').svg).not.toContain('Respect matters');
  });
  it('rejects malformed English fields in imported backups', () => {
    const b = buildBackup({ campaigns: [legacy()], calendar: [], media: [], activity: [] });
    const raw = JSON.parse(JSON.stringify(b)); raw.campaigns[0].contentEn = { title: 42 };
    expect(() => parseBackup(JSON.stringify(raw))).toThrow();
  });
  it('older backups do not erase an existing English version or campaign slogan', () => {
    const local = { ...editContent(legacy(), 'en', { title: 'Keep English' }), slogan: 'Keep Spanish slogan' };
    const b = parseBackup(JSON.stringify(buildBackup({ campaigns: [legacy()], calendar: [], media: [], activity: [] })));
    const result = mergeById([local], b.campaigns).result[0];
    expect(result?.contentEn?.title).toBe('Keep English');
    expect(result?.slogan).toBe('Keep Spanish slogan');
  });
  it('an explicitly empty incoming English version is not silently substituted', () => {
    const local = editContent(legacy(), 'en', { title: 'Original' });
    const incoming = editContent(legacy(), 'en', { title: '' });
    expect(mergeById([local], [incoming]).result[0]?.contentEn?.title).toBe('');
  });
});

describe('safe localized dates', () => {
  it('formats a real date in each locale', () => {
    expect(formatDate('2026-10-28', 'en-US')).toBe('October 28, 2026');
    expect(formatDate('2026-10-28', 'es-CR')).toBe('28 de octubre de 2026');
  });
  it('reports impossible or malformed dates without crashing or silently rolling forward', () => {
    expect(formatDate('2026-02-30', 'en-US')).toBe('Invalid date');
    expect(formatDate('garbage', 'es-CR')).toBe('Fecha no válida');
  });
});