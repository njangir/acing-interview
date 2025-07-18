
'use client';

import { useState, useEffect } from 'react';
import { serviceService } from '@/lib/firebase-services';
import { ServiceCard } from '@/components/core/service-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Service } from '@/types';

export function HomePageServiceList() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    serviceService.getAllServices().then(all => setServices(all.slice(0, 3)));
  }, []);

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
