import { Fragment } from 'react';

import { Link } from '@/i18n/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumbs" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <li className="text-slate-400">/</li>}
            <li>
              {item.href ? (
                <Link href={item.href} className="text-slate-500 hover:text-[#2386c8]">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-800">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
