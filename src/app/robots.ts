import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/uploads/'],
      disallow: [
        '/dashboard/',
        '/manager/',
        '/api/',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/teste',
        '/termos-de-uso',
        '/politica-de-privacidade',
        '/contato'
      ],
    },
    sitemap: [
      'https://senraaulasonline.com.br/sitemap.xml',
      'https://senraaulasonline.com.br/news-sitemap.xml'
    ],
  };
}
