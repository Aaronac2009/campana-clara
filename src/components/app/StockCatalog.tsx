import { useState, useEffect } from 'react';
import { Search, ArrowUpRight, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useI18n } from '@/lib/use-i18n';
import { runLocalAction, useStore } from '@/lib/store';
import { searchStock, STOCK, STOCK_CATEGORIES, stockUrl, type StockItem } from '@/lib/stock';

export function StockCatalog({ onPick, action = 'Insertar' }: { onPick: (item: StockItem) => void; action?: 'Insertar' | 'Crear campaña con esta imagen' }) {
  const { tr, label, locale } = useI18n();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState('');
  const [orientation, setOrientation] = useState('');
  const [view, setView] = useState('all');
  const [limit, setLimit] = useState(48);
  const [preview, setPreview] = useState<StockItem | null>(null);
  const { prefs, setPrefs } = useStore();
  const favorites = prefs.visualFavorites ?? [];
  const recent = prefs.visualRecent ?? [];
  useEffect(() => setLimit(48), [q, category, kind, orientation, view]);
  const english = locale === 'en-US';
  const title = (s: StockItem) => english ? s.titleEn ?? label(s.title) : s.title;
  const catLabel = (c: string) => english ? STOCK.find(s => s.category === c)?.categoryEn ?? label(c) : c;
  const results = searchStock(q, category).filter(s => (!kind || s.kind === kind) && (!orientation || (s.w === s.h ? 'square' : s.w > s.h ? 'horizontal' : 'vertical') === orientation) && (view === 'all' || (view === 'favorites' ? favorites : recent).includes(s.id)));
  if (view === 'recent') results.sort((a,b) => recent.indexOf(a.id) - recent.indexOf(b.id));
  const pick = (s: StockItem) => void runLocalAction(() => { setPrefs({ visualRecent: [s.id, ...recent.filter(id => id !== s.id)].slice(0,30) }); onPick(s); setPreview(null); });
  const star = (s: StockItem) => void runLocalAction(() => setPrefs({ visualFavorites: favorites.includes(s.id) ? favorites.filter(id => id !== s.id) : [...favorites, s.id] }));
  return <section className="space-y-5" aria-label={tr('Catálogo precargado')}>
    <details className="text-xs text-muted-foreground"><summary className="cursor-pointer font-semibold">{tr('Fuente y licencia')}</summary><p className="mt-2 max-w-3xl">{tr('Catálogo original y dos fotografías CC0. Las fotos se sirven desde los archivos de la aplicación y requieren conexión en la primera carga; tus archivos no se suben.')}</p><p className="mt-2">{tr('Banderas en láminas 4:3 de referencia; verificá diseño vigente y proporción oficial antes de uso institucional.')}</p></details>
    <div className="flex flex-wrap gap-2">{([['all','Todos'],['favorites','Favoritos'],['recent','Recientes']] as const).map(([key,name]) => <Button key={key} size="sm" variant={view === key ? 'default' : 'outline'} aria-pressed={view === key} onClick={() => setView(key)}>{tr(name)}</Button>)}</div>
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_180px]">
      <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><input className="field pl-9" aria-label={tr('Buscar imágenes')} placeholder={tr('Buscar imágenes')} value={q} onChange={e => setQ(e.target.value)}/></label>
      <select className="field" aria-label={tr('Categoría visual')} value={category} onChange={e => setCategory(e.target.value)}><option value="">{tr('Todas')}</option>{STOCK_CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}</select>
      <select className="field" aria-label={tr('Tipo de recurso')} value={kind} onChange={e => setKind(e.target.value)}><option value="">{tr('Todos')}</option><option value="graphic">{tr('Recursos gráficos')}</option><option value="photo">{tr('Fotografías')}</option><option value="flag">{tr('Banderas de referencia')}</option></select>
      <select className="field" aria-label={tr('Orientación del recurso')} value={orientation} onChange={e => setOrientation(e.target.value)}><option value="">{tr('Todas')}</option><option value="horizontal">{tr('Horizontal')}</option><option value="vertical">{label('Vertical')}</option><option value="square">{label('Cuadrado')}</option></select>
    </div>
    <p className="text-xs font-semibold text-muted-foreground" aria-live="polite">{results.length} / {STOCK.length} · {tr('Recursos disponibles')}</p>
    {results.length === 0 && <p className="py-8 text-center text-muted-foreground">{tr('No hay ilustraciones con esa búsqueda.')}</p>}
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {results.slice(0,limit).map(s => <li key={s.id} className="min-w-0 overflow-hidden rounded-md border bg-card">
        <Button variant="ghost" className="h-auto w-full flex-col items-stretch gap-0 overflow-hidden rounded-none p-0 whitespace-normal text-left" aria-label={`${tr(action)} · ${title(s)}`} onClick={() => pick(s)}>
          <AssetImage item={s} title={title(s)}/>
          <span className="block px-3 pt-2 text-xs font-semibold leading-snug">{title(s)}</span>
          <span className="block px-3 py-2 text-[11px] text-muted-foreground">{catLabel(s.category)} · {s.w}×{s.h}<br/>{s.kind === 'photo' ? tr('Fotografía CC0') : s.kind === 'flag' ? `${s.countryCode} · MIT` : tr('Ilustración original')}</span>
        </Button>
        <div className="flex justify-between border-t px-2"><Button variant="ghost" size="icon" aria-label={`${tr('Vista previa del recurso')} · ${title(s)}`} onClick={() => setPreview(s)}><Eye/></Button><Button variant="ghost" size="icon" aria-pressed={favorites.includes(s.id)} aria-label={`${tr(favorites.includes(s.id) ? 'Quitar de favoritos' : 'Añadir a favoritos')} · ${title(s)}`} onClick={() => star(s)}><Star className={favorites.includes(s.id) ? 'fill-gold text-gold' : ''}/></Button></div>
        {s.source?.startsWith('https://') && <a className="mx-3 mb-3 inline-flex items-center gap-1 text-xs text-teal underline" href={s.source} target="_blank" rel="noopener noreferrer">{tr('Fuente y licencia')}<ArrowUpRight className="h-3 w-3"/></a>}
      </li>)}
    </ul>
    {limit < results.length && <Button variant="outline" onClick={() => setLimit(n => n+48)}>{tr('Cargar más')} ({Math.min(48,results.length-limit)})</Button>}
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto">{preview && <><DialogTitle>{title(preview)}</DialogTitle><DialogDescription>{catLabel(preview.category)} · {preview.w}×{preview.h} · {preview.license}</DialogDescription><AssetImage item={preview} title={title(preview)}/><p className="text-xs text-muted-foreground">{preview.author}</p><Button onClick={() => pick(preview)}>{tr(action)}</Button></>}</DialogContent></Dialog>
  </section>;
}

function AssetImage({ item, title }: { item: StockItem; title: string }) {
  const { tr } = useI18n(); const [status,setStatus] = useState('loading');
  return <span className="relative block aspect-[3/2] w-full bg-muted"><img src={stockUrl(item)} alt={title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" onLoad={() => setStatus('ready')} onError={() => setStatus('error')}/>{status !== 'ready' && <span className="absolute inset-0 flex items-center justify-center bg-muted px-2 text-center text-xs text-muted-foreground">{tr(status === 'error' ? 'Recurso no disponible' : 'Cargando imagen…')}</span>}</span>;
}