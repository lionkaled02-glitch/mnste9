import { SITE_NAME, SITE_URL } from './metadata';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/khadamat',
      'https://facebook.com/khadamat',
      'https://linkedin.com/company/khadamat',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@khadamat.com',
      contactType: 'customer support',
      availableLanguage: ['Arabic', 'English'],
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/ar/projects?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function jobPostingSchema(project: {
  id: number;
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  durationDays: number;
  createdAt: Date;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: project.title,
    description: project.description,
    datePosted: project.createdAt.toISOString(),
    validThrough: new Date(project.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: 'CONTRACTOR',
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'YE',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: Number(project.budgetMin),
        maxValue: Number(project.budgetMax),
        unitText: 'PROJECT',
      },
    },
  };
}
