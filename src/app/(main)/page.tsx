
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HomePageServiceList } from '@/components/core/home-page-service-list';
import { HomePageTestimonialList } from '@/components/core/home-page-testimonial-list';
import { CheckCircle, Shield, Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface HeroData {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    heroImageUrl: string;
    heroDataAiHint: string;
}

async function getHeroData(): Promise<HeroData> {
    try {
        const heroDocRef = doc(db, 'siteContent', 'homePage');
        const docSnap = await getDoc(heroDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as HeroData;
        }
    } catch (error) {
        console.error("Error fetching hero data, using fallback.", error);
    }
    // Fallback data if Firestore fetch fails or document doesn't exist
    return {
        heroTitle: 'Crack Your SSB Interview with Expert Guidance',
        heroSubtitle: 'Led by a 4-time SSB recommended professional. Get personalized mock interviews, in-depth feedback, and proven strategies to achieve your armed forces dream.',
        heroCtaText: 'Book Your Interview Now',
        heroImageUrl: 'https://placehold.co/600x450.png',
        heroDataAiHint: 'interview coaching',
    };
}


export const metadata: Metadata = {
  description: 'Achieve your armed forces dream with expert-led SSB mock interviews, personalized feedback, and proven strategies from a 4-time recommended professional.',
};


export default async function HomePage() {
  const heroData = await getHeroData();

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold font-headline animate-subtle-appear" style={{ animationDelay: '0.1s' }}>
              {heroData.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 animate-subtle-appear" style={{ animationDelay: '0.3s' }}>
              {heroData.heroSubtitle}
            </p>
            <div className="animate-subtle-appear" style={{ animationDelay: '0.5s' }}>
              <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Link href="/services">{heroData.heroCtaText}</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block relative animate-subtle-appear group overflow-hidden rounded-lg shadow-2xl" style={{ animationDelay: '0.2s' }}>
            <Image
              src={heroData.heroImageUrl}
              alt="SSB Interview Preparation"
              width={600}
              height={450}
              className="rounded-lg transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={heroData.heroDataAiHint}
              priority
            />
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline text-primary">
            Why Choose Armed Forces Interview Ace?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="h-12 w-12 text-accent" />, title: "Expert Mentorship", description: "Guidance from a professional who has been recommended for SSB 4 times." },
              { icon: <Target className="h-12 w-12 text-accent" />, title: "Realistic Mock Interviews", description: "Experience the actual SSB environment and get tailored feedback." },
              { icon: <CheckCircle className="h-12 w-12 text-accent" />, title: "Proven Success Strategies", description: "Learn techniques that work and boost your confidence." },
            ].map((item, index) => (
              <Card key={index} className="text-center p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2 font-headline text-primary/90">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Now uses the client component */}
      <HomePageServiceList />

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline text-primary">Success Stories</h2>
          <HomePageTestimonialList />
           <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
              <Link href="/testimonials">More Testimonials</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6 font-headline">Ready to Ace Your Interview?</h2>
          <p className="text-lg mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
            Don't leave your dream to chance. Invest in yourself and get the best preparation for your SSB interview.
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Link href="/services">Schedule Your Mock Interview Today</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

    