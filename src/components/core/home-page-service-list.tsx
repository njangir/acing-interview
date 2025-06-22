
'use client';

import { useState, useEffect } from 'react';
import { MOCK_SERVICES } from '@/constants';
import { ServiceCard } from '@/components/core/service-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Service } from '@/types';

export function HomePageServiceList() {
  // Use state to hold services, allowing re-render if MOCK_SERVICES reference or content changes
  // This is a simplified way to try and react to mutations of the MOCK_SERVICES constant
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES.slice(0, 3));

  useEffect(() => {
    // This effect will run on mount and potentially if the component is forced to re-render.
    // In a real app, you'd fetch fresh data or use a proper state management solution.
    // For this mock, we re-set state from the (potentially mutated) MOCK_SERVICES.
    setServices(MOCK_SERVICES.slice(0, 3));
  }, []); // Empty dependency array means it runs once on mount, but MOCK_SERVICES itself is a module-level const.
          // If MOCK_SERVICES is mutated and this component re-renders due to navigation, it *should* pick up the change.

  return (
    <section id="services" className="py-16 bg-secondary">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12 font-headline text-primary">Our Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
            <Link href="/services">View All Services</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
