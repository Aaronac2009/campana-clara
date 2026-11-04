import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Field } from './ui-bits';
import { Poster } from './Poster';
import { useI18n } from '@/lib/use-i18n';
import { newId, runLocalAction, useStore } from '@/lib/store';
import { campaignForLanguage } from '@/lib/campaign-content';
import type { Campaign, Lang, ReviewEntry } from '@/lib/types';

export function ReviewActions({ campaign }: { campaign: Campaign }) {
  const { tr, label } = useI18n(); const { decideReview, profile } = useStore();
  const [decision,setDecision] = useState<ReviewEntry['decision'] | null>(null);
  const [reviewer,setReviewer] = useState(campaign.reviewer);
  const [comment,setComment] = useState(''); const [lang,setLang] = useState<Lang>('es');
  const busy = useRef(false); const [saving,setSaving] = useState(false);
  const titles = { aprobar: 'Aprobar versión seleccionada', cambios: 'Solicitar cambios', denegar: 'Confirmar denegación' } as const;
  const submit = async () => {
    if (!decision || busy.current) return;
    busy.current = true; setSaving(true);
    try {
      const ok = await runLocalAction(() => decideReview(campaign.id, { id: newId(), at: new Date().toISOString(), decision, reviewer, comment, lang }));
      if (ok) { setDecision(null); setComment(''); toast.success(tr('Decisión guardada en este navegador')); }
    } catch (e) { toast.error(label(e instanceof Error ? e.message : 'No se pudo guardar el recurso.')); }
    finally { busy.current = false; setSaving(false); }
  };
  return <>
    <div className="flex flex-wrap gap-2">{(['aprobar','cambios','denegar'] as const).map(d => <Button key={d} size="sm" disabled={campaign.status !== 'revision'} variant={d === 'aprobar' ? 'default' : 'outline'} onClick={() => { setReviewer(campaign.reviewer); setDecision(d); }}>{tr(d === 'aprobar' ? 'Aprobar' : d === 'cambios' ? 'Solicitar cambios' : 'Denegar')}</Button>)}</div>
    <Dialog open={!!decision} onOpenChange={open => { if (!saving && !open) setDecision(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogTitle>{decision ? tr(titles[decision]) : ''}</DialogTitle><DialogDescription>{tr('Esta decisión es local; no representa autorización institucional real.')}{decision === 'denegar' ? ` ${tr('La denegación conserva la campaña y registra el motivo.')}` : ''}</DialogDescription>
      <select className="field" aria-label={tr('Idioma del arte')} value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="es">ES</option><option value="en">EN</option></select>
      {lang === 'en' && !campaign.contentEn?.title && <p className="text-sm text-warn">{tr('Completar versión inglesa')}</p>}
      <div className="mx-auto w-full max-w-48"><Poster campaign={campaignForLanguage(campaign,lang)} profile={profile} format={campaign.format}/></div>
      <Field label={tr('Persona revisora')}><input className="field" maxLength={120} value={reviewer} onChange={e => setReviewer(e.target.value)}/></Field>
      <Field label={tr('Motivo / comentario')}><textarea className="field" maxLength={500} rows={3} value={comment} onChange={e => setComment(e.target.value)}/></Field>
      <Button disabled={saving || !reviewer.trim() || (decision !== 'aprobar' && !comment.trim())} onClick={submit}>{decision ? tr(titles[decision]) : ''}</Button>
    </DialogContent></Dialog>
  </>;
}