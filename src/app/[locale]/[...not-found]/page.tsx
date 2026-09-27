import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface CatchAllNotFoundPageProps {
  params: Promise<{ locale: string; 'not-found': string[] }>;
}

export async function generateMetadata({ params }: CatchAllNotFoundPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale === 'en';

  return {
    title: isEnglish ? 'Page not found | Khadamat' : 'الصفحة غير موجودة | خدمات',
    description: isEnglish
      ? 'The link you are looking for is invalid or has been removed.'
      : 'الرابط الذي تبحث عنه غير صحيح أو تم حذفه.',
  };
}

export default function CatchAllNotFoundPage() {
  notFound();
}
