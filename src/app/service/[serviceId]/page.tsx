
import { getDoc, getDocs, doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Service, Testimonial } from '@/types';
import { notFound, redirect } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/core/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, BookUser, CheckCircle, HelpCircle, Sparkles, Testtube2, AlertTriangle } from 'lucide-react';
import { TestimonialCard } from '@/components/core/testimonial-card';
import type { Metadata, ResolvingMetadata } from 'next';


type Props = {
  params: { serviceId: string }
}

async function getServiceDetails(serviceId: string): Promise<Service | null> {
    try {
        const serviceDocRef = doc(db, 'services', serviceId);
        const serviceSnap = await getDoc(serviceDocRef);

        if (serviceSnap.exists()) {
            return { id: serviceSnap.id, ...serviceSnap.data() } as Service;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching service ${serviceId}:`, error);
        return null;
    }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const service = await getServiceDetails(params.serviceId);

  if (!service) {
    return {
      title: 'Service Not Found',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: service.name,
    description: service.description,
    openGraph: {
      title: service.name,
      description: service.description,
      images: [service.bannerImageUrl || service.image || 'https://placehold.co/1200x630.png', ...previousImages],
    },
  }
}

export default async function ServiceDetailsPage({ params }: Props) {
  const { serviceId } = params;
  const service = await getServiceDetails(serviceId);

  if (!service) {
    console.warn(`Service with ID ${serviceId} not found.`);
    notFound();
  }

  // If the service doesn't have a details page enabled, redirect to booking.
  if (!service.hasDetailsPage) {
    console.log(`Service ${serviceId} does not have a details page enabled. Redirecting to slots.`);
    redirect(`/book/${serviceId}/slots`);
  }
  
  let testimonials: Testimonial[] = [];
  try {
    const testimonialsCol = collection(db, 'testimonials');
    const q = query(
      testimonialsCol, 
      where('status', '==', 'approved'), 
      where('serviceId', '==', serviceId),
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
    console.error(`Error fetching testimonials for service ${serviceId}:`, error);
    // Non-critical error, the page can still render without testimonials.
  }

  const whatToExpectItems = service.whatToExpect?.split('-').map(item => item.trim()).filter(item => item) || [];
  const howItWillHelpItems = service.howItWillHelp?.split('-').map(item => item.trim()).filter(item => item) || [];


  return (
    <>
      <PageHeader
        title={service.name}
        description={service.description}
      />
      <div className="container pb-12">
        <div className="relative h-64 md:h-96 w-full mb-12 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={service.bannerImageUrl || service.image || 'https://placehold.co/1200x400.png'}
            alt={service.name}
            fill
            className="object-cover"
            priority
            data-ai-hint={service.bannerImageDataAiHint || service.dataAiHint || 'service banner'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-2xl font-bold">Duration: {service.duration}</h2>
            <p className="text-3xl font-extrabold text-accent">₹{service.price}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-12">
                
                <Section icon={HelpCircle} title="How It Works">
                    <p className="text-muted-foreground whitespace-pre-wrap">{service.howItWorks}</p>
                    <div className="flex justify-center mt-6">
                        <Image src="https://placehold.co/500x300.png" alt="How it works illustration" width={500} height={300} className="rounded-lg border" data-ai-hint="process illustration"/>
                    </div>
                </Section>
                
                <Section icon={Testtube2} title="What to Expect">
                    <ul className="space-y-2 text-muted-foreground">
                        {whatToExpectItems.map((item, index) => (
                            <li key={index} className="flex items-start">
                                <CheckCircle className="h-5 w-5 mr-3 mt-1 text-green-500 flex-shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                     {whatToExpectItems.length === 0 && <p className="text-muted-foreground">Detailed expectations will be provided upon booking.</p>}
                </Section>

                <Section icon={Sparkles} title="How It Will Help">
                    <ul className="space-y-2 text-muted-foreground">
                        {howItWillHelpItems.map((item, index) => (
                            <li key={index} className="flex items-start">
                                <CheckCircle className="h-5 w-5 mr-3 mt-1 text-green-500 flex-shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                     {howItWillHelpItems.length === 0 && <p className="text-muted-foreground">This service is designed to provide targeted improvements for your interview performance.</p>}
                </Section>

            </div>

            <aside className="lg:col-span-1 sticky top-24">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary">Ready to Begin?</CardTitle>
                        <CardDescription>Take the next step in your preparation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Link href={`/book/${service.id}/slots`}>Book Your Session Now</Link>
                        </Button>
                    </CardContent>
                </Card>
            </aside>
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

      </div>
    </>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) {
    return (
        <section>
            <h3 className="text-2xl font-bold font-headline text-primary mb-4 flex items-center">
                <Icon className="h-7 w-7 mr-3 text-accent" />
                {title}
            </h3>
            {children}
        </section>
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
