
'use client';

import { useState, useEffect } from 'react';
import { MOCK_SERVICES } from '@/constants';
import { ServiceCard } from '@/components/core/service-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Service } from '@/types';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

export function HomePageServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const servicesCol = collection(db, 'services');
        const q = query(servicesCol, where('isBookable', '==', true), limit(3));
        const servicesSnap = await getDocs(q);
        if (servicesSnap.empty) {
          setServices(MOCK_SERVICES.slice(0, 3));
        } else {
          setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
        }
      } catch (error) {
        console.error("Failed to fetch services for homepage, using fallback.", error);
        setServices(MOCK_SERVICES.slice(0, 3));
      }
      setIsLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <section id="services" className="py-16 bg-secondary">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12 font-headline text-primary">Our Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : (
            services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          )}
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

const CardSkeleton = () => (
  <div className="flex flex-col space-y-3">
    <Skeleton className="h-[225px] w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);
