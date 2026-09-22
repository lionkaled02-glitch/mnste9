/**
 * خدمات — Navigation helpers من next-intl
 * يوفر Link مترجم يضيف بادئة اللغة تلقائياً
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
