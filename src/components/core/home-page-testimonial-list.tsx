
'use client';

import { useState, useEffect } from 'react';
import { TestimonialCard } from '@/components/core/testimonial-card';
import type { Testimonial } from '@/types';
import { collection, getDocs, limit, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';

export function HomePageTestimonialList() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const testimonialsCol = collection(db, 'testimonials');
        const q = query(testimonialsCol, where('status', '==', 'approved'), orderBy('createdAt', 'desc'), limit(3));
        const testimonialSnapshot = await getDocs(q);
        if (testimonialSnapshot.empty) {
          console.log("No approved testimonials found for homepage.");
        }
        const fetchedTestimonials = testimonialSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          } as Testimonial;
        });
        setTestimonials(fetchedTestimonials);
      } catch (err) {
        console.error("Failed to fetch testimonials for homepage.", err);
        setError("Could not load success stories at this time.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))
      ) : testimonials.length > 0 ? (
        testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))
      ) : (
        <p className="col-span-full text-center text-muted-foreground">
          {error ? error : "No success stories have been shared yet. Check back soon!"}
        </p>
      )}
    </div>
  );
}

const CardSkeleton = () => (
    <Card className="h-full shadow-lg bg-card flex flex-col p-6">
        <div className="flex flex-row items-center gap-4 pb-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
        <div className="flex-grow mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
  </Card>
);
