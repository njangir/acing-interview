
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from "@/components/core/page-header";
import { ServiceCard } from "@/components/core/service-card";
import type { Service } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Explore our range of SSB mock interviews, personal counselling, and AFCAT guidance services designed to help you succeed in your armed forces career.',
};

// This is a Server Component, so data fetching can be done directly.
export default async function ServicesPage() {
  let services: Service[] = [];
  let error: string | null = null;

  try {
    const servicesCollectionRef = collection(db, 'services');
    const q = query(servicesCollectionRef, orderBy('name', 'asc'));
    const servicesSnapshot = await getDocs(q);
    services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (err) {
    console.error("Error fetching services:", err);
    error = "There was an issue loading our services. Please try again later.";
  }

  return (
    <>
      <PageHeader
        title="Our Services"
        description="Explore our range of mock interview and counselling services designed to help you succeed in your defence exams."
      />
      <div className="container py-12">
        {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {services.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No services are currently available. Please check back later.</p>
          </div>
        )}
      </div>
    </>
  );
}
