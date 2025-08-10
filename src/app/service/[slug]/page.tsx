
import { getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Service, Testimonial } from '@/types';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/core/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, BookUser, CheckCircle, HelpCircle, Sparkles, TestTube2, AlertTriangle, MessageSquareQuote } from 'lucide-react';
import { TestimonialCard } from '@/components/core/testimonial-card';
import type { Metadata, ResolvingMetadata } from 'next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string }
}

async function getServiceDetails(slug: string): Promise<Service | null> {
    try {
        const servicesCollectionRef = collection(db, 'services');
        const q = query(servicesCollectionRef, where('slug', '==', slug), limit(1));
        const serviceSnap = await getDocs(q);

        if (!serviceSnap.empty) {
            const doc = serviceSnap.docs[0];
            return { id: doc.id, ...doc.data() } as Service;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching service with slug ${slug}:`, error);
        return null;
    }
}

const FAQ_ITEMS = [
  {
    question: "How do I book this service?",
    answer: "You can book this service by clicking on any of the 'Book Your Session' buttons on this page. You will be taken to a calendar to select an available date and time slot.",
  },
  {
    question: "What happens after I book?",
    answer: "After booking, you will receive a confirmation email. If you've paid, your slot is confirmed. If you chose 'Pay Later', your slot is tentative and requires admin approval. In both cases, a meeting link for the session will be shared with you via email and on your dashboard before the scheduled time.",
  },
  {
    question: "Can I get a refund if I cancel?",
    answer: "Yes, you can request a refund up to 2 hours before your scheduled session time directly from your user dashboard. Please refer to our Terms & Conditions for the full policy.",
  },
  {
    question: "How is the feedback provided?",
    answer: "For mock interviews and similar services, you will receive a detailed PDF feedback report uploaded to your dashboard after the session is marked as complete. You will also receive skill ratings and comments from your mentor.",
  }
];

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const service = await getServiceDetails(params.slug);

  if (!service) {
    return {
      title: 'Service Not Found',
    }
  }
  
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": service.name,
    "name": service.name,
    "description": service.description,
    "image": service.image,
    "provider": {
        "@type": "Organization",
        "name": "Armed Forces Interview Ace"
    },
    "offers": {
        "@type": "Offer",
        "price": service.price,
        "priceCurrency": "INR"
    }
  };
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
        }
    }))
  };

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: service.name,
    description: service.description,
    openGraph: {
      title: service.name,
      description: service.description,
      images: [service.image || 'https://placehold.co/1200x630.png', ...previousImages],
    },
    other: {
        "script-service": {
            type: 'application/ld+json',
            json: serviceSchema
        },
        "script-faq": {
            type: 'application/ld+json',
            json: faqSchema
        },
    }
  }
}

export default async function ServiceDetailsPage({ params }: Props) {
  const { slug } = params;
  const service = await getServiceDetails(params.slug);

  if (!service) {
    console.warn(`Service with slug ${params.slug} not found.`);
    notFound();
  }

  // If the service doesn't have a details page enabled, redirect to booking.
  if (!service.hasDetailsPage) {
    console.log(`Service ${params.slug} does not have a details page enabled. Redirecting to slots.`);
    redirect(`/book/${service.id}/slots`);
  }
  
  let testimonials: Testimonial[] = [];
  try {
    const testimonialsCol = collection(db, 'testimonials');
    const q = query(
      testimonialsCol, 
      where('status', '==', 'approved'), 
      where('serviceId', '==', service.id),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const testimonialSnapshot = await getDocs(q);
    testimonials = testimonialSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as Testimonial;
        });
  } catch (error) {
    console.error(`Error fetching testimonials for service ${service.id}:`, error);
    // Non-critical error, the page can still render without testimonials.
  }

  return (
    <>
      <PageHeader
        title={service.name}
        description={service.description}
      />
      <div className="container pb-12">
        <div className="relative h-64 md:h-96 w-full mb-12 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={service.image || 'https://placehold.co/1200x400.png'}
            alt={service.name}
            fill
            className="object-cover"
            priority
            data-ai-hint={service.dataAiHint || 'service banner'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white max-w-xl">
            <h2 className="text-xl md:text-2xl font-bold">Duration: {service.duration}</h2>
            <p className="text-2xl md:text-3xl font-extrabold text-accent">₹{service.price}</p>
             <Button asChild size="lg" className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                <Link href={`/book/${service.id}/slots`}>Book Your Session Now</Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-12">
                
                {service.detailSections && service.detailSections.map((section, index) => {
                     if (section.type === 'text') {
                        return (
                            <section key={index} className="prose prose-lg dark:prose-invert max-w-none">
                                <h2 className="text-2xl font-bold text-primary mb-4">{section.title}</h2>
                                <ReactMarkdown
                                    components={{
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
                                    alt={section.title || 'Service section image'}
                                    fill
                                    className="object-contain"
                                    data-ai-hint={section.imageHint || 'service content'}
                                    />
                                </div>
                            </section>
                        )
                    }
                    return null;
                })}
                
            </div>

            <aside className="lg:col-span-1 sticky top-24">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary">Service Features</CardTitle>
                        <CardDescription>What's included in this service.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-2 text-muted-foreground">
                            {service.features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircle className="h-5 w-5 mr-3 mt-1 text-accent flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </aside>
        </div>
        
        <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Ready to Take the Next Step?</h2>
            <p className="text-muted-foreground mb-6">Invest in your future and get the expert guidance you need to succeed.</p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Link href={`/book/${service.id}/slots`}>Book Your Session Today</Link>
            </Button>
        </div>

        {testimonials.length > 0 && (
            <div className="mt-20">
                <h2 className="text-3xl font-bold text-center mb-12 font-headline text-primary">
                    Success Stories from this Service
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map(testimonial => (
                        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                    ))}
                </div>
            </div>
        )}
        
        <div className="mt-20 max-w-3xl mx-auto">
             <h2 className="text-3xl font-bold text-center mb-12 font-headline text-primary flex items-center justify-center">
                <MessageSquareQuote className="h-8 w-8 mr-3 text-accent"/>
                Frequently Asked Questions
            </h2>
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {FAQ_ITEMS.map((item, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="text-left hover:text-accent">{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
        </div>

      </div>
    </>
  );
}

// Fallback component for when a service is not found
export function ServiceNotFound() {
    return (
        <div className="container py-12 text-center">
            <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Service Not Found</AlertTitle>
                <AlertDescription>
                    The service you are looking for does not exist or is no longer available.
                </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="mt-6">
                <Link href="/services">View All Services</Link>
            </Button>
        </div>
    );
}
