"use client";
import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { ServiceCard } from "@/components/core/service-card";
import type { Service } from '@/types';
import { serviceService } from '@/lib/firebase-services';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    serviceService.getAllServices()
      .then((fetched) => {
        setServices(fetched);
        setIsLoading(false);
      })
      .catch((err) => {
        setError('Failed to load services.');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="container py-12">
        <PageHeader title="Our Services" description="Loading services..." />
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Our Services"
        description="Explore our range of mock interview and counselling services designed to help you succeed in your defence exams."
      />
      <div className="container py-12">
        {error ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : services.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service: Service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No services are currently available. Please check back later.</p>
          </div>
        )}
      </div>
    </>
  );
}
