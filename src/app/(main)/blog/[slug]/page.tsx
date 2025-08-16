
import { getDocs, collection, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost, BlogPostSection } from '@/types';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { PageHeader } from '@/components/core/page-header';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { BlogContactCta } from '@/components/core/blog-contact-cta';

type Props = {
  params: { slug: string }
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
        const postsCollectionRef = collection(db, 'blogPosts');
        const q = query(postsCollectionRef, where('slug', '==', slug), where('status', '==', 'published'), limit(1));
        const postsSnapshot = await getDocs(q);

        if (postsSnapshot.empty) {
            return null;
        }

        const doc = postsSnapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            publicationDate: data.publicationDate.toDate().toISOString(),
        } as BlogPost;

    } catch (error) {
        console.error(`Error fetching blog post with slug ${slug}:`, error);
        return null;
    }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [post.bannerImageUrl, ...previousImages],
      type: 'article',
      publishedTime: post.publicationDate,
      authors: [post.author],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={post.title}
        description={post.summary}
      />
      <div className="container pb-12">
         <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Published on {new Date(post.publicationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
             <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By {post.author}</span>
            </div>
        </div>
        <div className="relative h-64 md:h-96 w-full mb-12 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={post.bannerImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
            data-ai-hint={post.bannerImageDataAiHint || 'blog post banner'}
          />
        </div>

        <article className="prose prose-lg dark:prose-invert max-w-none mx-auto">
             {post.sections.map((section, index) => {
                if (section.type === 'text') {
                    return (
                        <section key={index} className="mb-8">
                            <ReactMarkdown
                                className="text-foreground/90 space-y-4"
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold font-headline text-primary mt-8 mb-4" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold font-headline text-primary mt-6 mb-3" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold font-headline text-primary mt-4 mb-2" {...props} />,
                                    hr: ({node, ...props}) => <hr className="my-8 border-border" {...props} />,
                                    a: ({node, ...props}) => <a className="text-accent hover:underline" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                }}
                            >
                                {section.content}
                            </ReactMarkdown>
                        </section>
                    )
                }
                if (section.type === 'image') {
                    return (
                         <section key={index} className="mb-8">
                            {section.title && <h2 className="text-2xl font-bold text-primary mb-4">{section.title}</h2>}
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                                <Image
                                src={section.imageUrl}
                                alt={section.title || 'Blog section image'}
                                fill
                                className="object-contain"
                                data-ai-hint={section.imageHint || 'blog content'}
                                />
                            </div>
                        </section>
                    )
                }
             })}
        </article>
        
        <BlogContactCta />

      </div>
    </>
  );
}
