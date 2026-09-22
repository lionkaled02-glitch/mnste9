import { redirect } from 'next/navigation';

/**
 * الصفحة الجذرية / — إعادة توجيه تلقائي إلى /ar
 * يتم التعامل معها في middleware.ts أيضاً
 */
export default function RootPage() {
  redirect('/ar');
}
