import { MetadataRoute } from 'next'
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost, Service } from '@/types';

const SITE_URL = 'https://afinterviewace.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // Dynamic service pages
  const servicesQuery = query(collection(db, 'services'), where('hasDetailsPage', '==', true));
  const servicesSnapshot = await getDocs(servicesQuery);
  const serviceRoutes = servicesSnapshot.docs.map(doc => {
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
  const postRoutes = postsSnapshot.docs.map(doc => {
    const post = doc.data() as BlogPost;
    return {
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  });


  return [...staticRoutes, ...serviceRoutes, ...postRoutes];
}
