import { approvalBlockers } from './rules';
import { campaignForLanguage } from './campaign-content';
import type { Campaign, ReviewEntry } from './types';

export function reviewCampaign(c: Campaign, entry: ReviewEntry): Campaign {
  if (c.reviewHistory?.some(e => e.id === entry.id)) return c;
  if (c.status !== 'revision') throw new Error('La campaña debe estar en revisión.');
  if ((c.reviewHistory?.length ?? 0) >= 200) throw new Error('Se alcanzó el límite de decisiones; descargá un respaldo.');
  if (!entry.reviewer.trim()) throw new Error('Indicá la persona revisora.');
  if (entry.decision !== 'aprobar' && !entry.comment.trim()) throw new Error('Indicá un motivo o comentario.');
  if (entry.decision === 'aprobar') {
    const blockers = approvalBlockers({ ...c, reviewer: entry.reviewer });
    if (blockers.length) throw new Error(blockers[0]);
    if (!campaignForLanguage(c, entry.lang).title.trim()) throw new Error('Completar versión inglesa');
  }
  const status = entry.decision === 'aprobar' ? 'aprobado' : entry.decision === 'cambios' ? 'observado' : 'denegado';
  return { ...c, status, reviewer: entry.reviewer.trim(), approvalDate: status === 'aprobado' ? entry.at.slice(0,10) : '', reviewHistory: [...(c.reviewHistory ?? []), { ...entry, reviewer: entry.reviewer.trim(), comment: entry.comment.trim() }] };
}