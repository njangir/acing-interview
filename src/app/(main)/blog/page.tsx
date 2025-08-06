
import { getDocs, collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost } from '@/types';
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read articles, tips, and insights on how to prepare for your armed forces interview and succeed in your career.',
};

async function getBlogPosts(): Promise<{ posts: BlogPost[], error: string | null }> {
  try {
    const postsCollectionRef = collection(db, 'blogPosts');
    const q = query(postsCollectionRef, where('status', '==', 'published'), orderBy('publicationDate', 'desc'));
    const postsSnapshot = await getDocs(q);
    const posts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            publicationDate: data.publicationDate.toDate().toISOString(),
        } as BlogPost;
    });
    return { posts, error: null };
  } catch (err) {
    console.error("Error fetching blog posts:", err);
    return { posts: [], error: "There was an issue loading the blog posts. Please try again later." };
  }
}

export default async function BlogIndexPage() {
  const { posts, error } = await getBlogPosts();

  return (
    <>
      <PageHeader
        title="Armed Forces Career Blog"
        description="Articles, tips, and insights on preparing for your interview and succeeding in your career."
      />
      <div className="container py-12">
        {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-48 w-full">
                    <Image
                      src={post.bannerImageUrl || 'https://placehold.co/600x400.png'}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={post.bannerImageDataAiHint || 'blog post banner'}
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary group-hover:text-accent transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      By {post.author} on {new Date(post.publicationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.summary}</p>
                  </CardContent>
                   <CardContent>
                        <span className="text-sm font-semibold text-accent group-hover:underline">
                            Read More <ArrowRight className="inline-block h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                    </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No blog posts have been published yet. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}
