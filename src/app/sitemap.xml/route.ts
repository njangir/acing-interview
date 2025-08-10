import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost, Service } from '@/types';
import { MetadataRoute } from 'next';

const SITE_URL = 'https://afinterviewace.com';

// This function is now a Next.js Route Handler
export async function GET() {
  // Static pages
  const staticRoutes = [
    '',
    '/services',
    '/mentor',
    '/testimonials',
    '/blog',
    '/faq',
    '/login',
    '/signup',
    '/terms-and-conditions',
    '/privacy-policy',
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  let serviceRoutes: MetadataRoute.Sitemap = [];
  let postRoutes: MetadataRoute.Sitemap = [];

  try {
    // Dynamic service pages
    const servicesQuery = query(collection(db, 'services'), where('hasDetailsPage', '==', true));
    const servicesSnapshot = await getDocs(servicesQuery);
    serviceRoutes = servicesSnapshot.docs.map(doc => {
      const service = doc.data() as Service;
      return {
        url: `${SITE_URL}/service/${service.slug}`,
        lastModified: service.updatedAt ? new Date(service.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    });

    // Dynamic blog post pages
    const postsQuery = query(collection(db, 'blogPosts'), where('status', '==', 'published'));
    const postsSnapshot = await getDocs(postsQuery);
    postRoutes = postsSnapshot.docs.map(doc => {
      const post = doc.data() as BlogPost;
      return {
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    });
  } catch (error) {
      console.error("Error fetching dynamic sitemap data:", error);
      // In case of error, we can return just the static routes so the build doesn't fail.
  }

  const sitemapContent = [...staticRoutes, ...serviceRoutes, ...postRoutes]
    .map(({ url, lastModified, changeFrequency, priority }) => `
      <url>
        <loc>${url}</loc>
        <lastmod>${lastModified}</lastmod>
        <changefreq>${changeFrequency}</changefreq>
        <priority>${priority}</priority>
      </url>
    `.trim())
    .join('');

  return new Response(`
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapContent}
    </urlset>
  `.trim(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
