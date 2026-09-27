import { getLocale } from 'next-intl/server';

import { LocalizedNotFound } from '@/components/ui/localized-not-found';

export default async function NotFound() {
  const locale = await getLocale();
  return <LocalizedNotFound locale={locale} />;
}
