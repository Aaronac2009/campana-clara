import { describe, it, expect } from 'vitest';
import { reviewCampaign } from '@/lib/moderation';
import { demoCampaigns } from '@/lib/demo-data';
import { buildBackup, parseBackup, mergeById } from '@/lib/backup';
import type { ReviewEntry, Campaign } from '@/lib/types';
const fixture = demoCampaigns()[0]; if (!fixture) throw new Error('Fixture missing');
const c: Campaign = { ...fixture, status: 'revision' };
const e: ReviewEntry = { id:'r1',at:'2026-10-28T22:00:00Z',decision:'cambios',reviewer:'Ana',comment:'Ampliar el CTA',lang:'es' };
describe('local review decisions', () => {
  it('requests changes separately from denial and keeps all campaign copy', () => {
    const changes = reviewCampaign(c,e); expect(changes.status).toBe('observado'); expect(changes.title).toBe(c.title);
    const denial = reviewCampaign(c,{ ...e,decision:'denegar' }); expect(denial.status).toBe('denegado');expect(denial.reviewHistory?.[0]?.comment).toBe('Ampliar el CTA');
  });
  it('requires a reviewer for every decision', () => { expect(() => reviewCampaign(c,{ ...e,reviewer:'' })).toThrow('Indicá la persona revisora.'); });
  it('requires a reason for changes and denial', () => { for (const decision of ['cambios','denegar'] as const) expect(() => reviewCampaign(c,{ ...e,decision,comment:'' })).toThrow('Indicá un motivo o comentario.'); });
  it('cannot approve an empty English version', () => { expect(() => reviewCampaign(c,{ ...e,decision:'aprobar',lang:'en' })).toThrow('Completar versión inglesa'); });
  it('retains efemeride source safeguards', () => { expect(() => reviewCampaign({ ...c,efemeride:{ ...c.efemeride,enabled:true,sourceUrl:'',confirmed:false } },{ ...e,decision:'aprobar' })).toThrow('URL'); });
  it('approves selected version with dated responsible decision', () => { const out = reviewCampaign(c,{ ...e,decision:'aprobar' });expect(out.status).toBe('aprobado');expect(out.approvalDate).toBe('2026-10-28');expect(out.reviewHistory?.[0]?.lang).toBe('es'); });
  it('prevents duplicate decisions and rejects stale decisions', () => { const out=reviewCampaign(c,e);expect(reviewCampaign(out,e)).toBe(out);expect(() => reviewCampaign(out,{ ...e,id:'r2' })).toThrow('en revisión'); });
  it('does not silently discard history at the backup entry limit', () => { expect(() => reviewCampaign({ ...c,reviewHistory:Array.from({ length:200 },(_,i) => ({ ...e,id:`old-${i}` })) },e)).toThrow('límite'); });
  it('roundtrips decisions and preserves history on legacy merge', () => {
    const reviewed = reviewCampaign(c,{ ...e,decision:'denegar' });
    const backup=parseBackup(JSON.stringify(buildBackup({ campaigns:[reviewed],calendar:[],activity:[],media:[] })));
    expect(backup.campaigns[0]?.reviewHistory).toEqual(reviewed.reviewHistory); expect(backup.campaigns[0]?.status).toBe('denegado');
    expect(mergeById([reviewed],[c]).result[0]?.reviewHistory).toEqual(reviewed.reviewHistory);
  });
  it('rejects duplicated campaigns before importing a backup', () => {
    const backup = buildBackup({ campaigns:[c, { ...c, title:'Duplicate' }],calendar:[],activity:[],media:[] });
    expect(() => parseBackup(JSON.stringify(backup))).toThrow('Una lista tiene un formato inválido.');
  });
  it('rejects duplicated review decision identifiers', () => {
    const backup = buildBackup({ campaigns:[{ ...c, reviewHistory:[e, { ...e, comment:'Duplicate' }] }],calendar:[],activity:[],media:[] });
    expect(() => parseBackup(JSON.stringify(backup))).toThrow('Una lista tiene un formato inválido.');
  });
  it('aborts ambiguous merges without changing the local campaign', () => {
    const local = [{ ...c, reviewHistory:[e] }];
    const previous = structuredClone(local);
    expect(() => mergeById(local,[c, { ...c, title:'Duplicate' }])).toThrow('Una lista tiene un formato inválido.');
    expect(local).toEqual(previous);
  });
});