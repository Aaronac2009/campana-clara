import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, cleanup, waitFor } from '@testing-library/react';
import { StoreProvider } from '@/lib/store';
import { afterEach } from 'vitest';
import { StockCatalog } from '@/components/app/StockCatalog';
import { STOCK, searchStock, stockById, stockUrl } from '@/lib/stock';
import { resolveCampaignImage } from '@/lib/campaign-image';
import { DEFAULT_IMAGE } from '@/lib/types';
import { posterLayout } from '@/lib/poster';
import { DEFAULT_PROFILE, demoCampaigns } from '@/lib/demo-data';
import { localize } from '@/lib/i18n';
vi.mock('@/lib/use-i18n', () => ({ useI18n: () => ({ tr: (k: string) => localize('en', k), label: (k: string) => localize('en', k), locale: 'en-US' }) }));
afterEach(cleanup);
describe('visual catalogue', () => {
  it('contains at least 60 actual renderable resources with unique stable ids', () => {
    expect(STOCK.length).toBeGreaterThanOrEqual(60);
    expect(new Set(STOCK.map(s => s.id)).size).toBe(STOCK.length);
    for (const s of STOCK) {
      expect(s.w).toBeGreaterThan(0); expect(s.h).toBeGreaterThan(0);
      expect(stockUrl(s)).toMatch(/^(data:image\/svg\+xml;base64,|\/__l5e\/assets-v1\/)/);
      if (!s.url) { expect(s.svg).toContain('<svg'); expect(s.svg).not.toMatch(/<script|on\w+=|<foreignObject|https?:\/\/(?!www.w3.org)/i); }
    }
  });
  it('has verified CC0 provenance on both integrated photographs', () => {
    const photos = STOCK.filter(s => s.kind === 'photo');
    expect(photos).toHaveLength(2);
    for (const p of photos) { expect(p.license).toBe('CC0 1.0'); expect(p.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/); expect(p.author).toBeTruthy(); expect(p.url).toBeTruthy(); }
  });
  it('searches titles and tags in both languages without accents', () => {
    expect(searchStock('montanas').map(s => s.id)).toContain('visual-valle');
    expect(searchStock('mountain').map(s => s.id)).toContain('photo-lake');
    expect(searchStock('architecture').map(s => s.id)).toContain('photo-city');
    expect(searchStock('', 'Banderas civiles')).toHaveLength(6);
  });
  it('Costa Rica civil flag has 1:1:2:1:1 stripes and no coat of arms', () => {
    const flag = stockById('visual-cr');
    expect(flag?.w).toBe(900); expect(flag?.h).toBe(600);
    expect(flag?.svg).toContain('y="200" width="900" height="200" fill="#ce1126"');
    expect(flag?.svg).not.toMatch(/<image|<text|<circle/);
  });
  it('filters and picks the displayed English resource through real controls', async () => {
    const pick = vi.fn(); render(<StoreProvider><StockCatalog onPick={pick}/></StoreProvider>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search images' }), { target: { value: 'mountain' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Asset type' }), { target: { value: 'photo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Insert · Mountain lake · photograph' }));
    await waitFor(() => expect(pick).toHaveBeenCalledWith(expect.objectContaining({ id: 'photo-lake' })));
    expect(screen.queryByRole('button', { name: /Mexico City/ })).toBeNull();
  });
  it('provides 406 renderable entries, 249 ISO flag references and 93 labelled original aspect variants', () => {
    expect(STOCK).toHaveLength(406);
    expect(STOCK.filter(s => s.kind === 'flag')).toHaveLength(249);
    expect(new Set(STOCK.filter(s => s.kind === 'flag').map(s => s.countryCode)).size).toBe(249);
    expect(STOCK.filter(s => s.id.startsWith('batch-'))).toHaveLength(93);
    expect(new Set(STOCK.filter(s => s.id.startsWith('batch-')).map(s => s.family)).size).toBe(31);
    expect(searchStock('pera').map(s => s.id)).toContain('batch-pear-v');
    expect(searchStock('US').map(s => s.id)).toContain('flag-us');
  });
  it('resolves and inserts original art without altering campaign text', async () => {
    const original = demoCampaigns()[0]; if (!original) throw new Error('Demo missing');
    const selected = { ...original, image: { ...DEFAULT_IMAGE, source: 'stock' as const, ref: 'visual-volcan' } };
    const art = await resolveCampaignImage(selected.image, []);
    expect(art?.href).toMatch(/^data:image\/svg\+xml;base64,/);
    for (const format of ['afiche','cuadrado','fb_h'] as const) { expect(posterLayout(selected, DEFAULT_PROFILE, format, art).svg).toContain('<image href="data:image/svg+xml'); }
    expect(selected.title).toBe(original.title); expect(selected.contentEn).toBe(original.contentEn);
  });
});