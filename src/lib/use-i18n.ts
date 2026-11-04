import { useStore } from './store';
import { localize } from './i18n';

export function useI18n() {
  const { prefs, t } = useStore();
  return { tr: t, label: (s: string) => localize(prefs.lang, s), locale: prefs.lang === 'en' ? 'en-US' : 'es-CR' };
}