
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming you have a firebase.ts config file
import { PageHeader } from "@/components/core/page-header";
import { ServiceCard } from "@/components/core/service-card";
import { MOCK_SERVICES } from "@/constants"; // Keep for now for UI rendering during transition
import type { Service } from '@/types';

// This is a Server Component, so data fetching can be done directly.
export default async function ServicesPage() {
  let services: Service[] = [];

  // PRODUCTION TODO: Replace MOCK_SERVICES with actual Firestore data fetching.
  try {
    const servicesCollectionRef = collection(db, 'services');
    // Example: Query services and order them, e.g., by a 'order' field or 'name'
    const q = query(servicesCollectionRef, orderBy('name', 'asc'));
    const servicesSnapshot = await getDocs(q); // or await getDocs(q);
    services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure timestamp fields are handled correctly if they exist (e.g., toDate().toISOString())
    })) as Service[];
  } catch (error) {
    console.error("Error fetching services:", error);
    // Optionally, render an error message or fallback UI
    // For now, it will fall back to MOCK_SERVICES if fetching fails or is commented out.
  }

  // Fallback to mock data if services array is empty (e.g., Firestore fetch failed or is commented out)
  if (services.length === 0) {
    services = MOCK_SERVICES; // Using mock data for UI consistency during refactor
  }

  return (
    <>
      <PageHeader
        title="Our Services"
        description="Explore our range of mock interview and counselling services designed to help you succeed in your defence exams."
      />
      <div className="container py-12">
        {services.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No services are currently available. Please check back later.</p>
            {/* PRODUCTION TODO: Add a more user-friendly error message or a link to contact support if fetching fails */}
          </div>
        )}
      </div>
    </>
  );
}
