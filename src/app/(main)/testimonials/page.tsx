
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { TestimonialCard } from "@/components/core/testimonial-card";
import type { Testimonial } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const ITEMS_PER_PAGE = 6;

export default function TestimonialsPage() {
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const testimonialsCol = collection(db, 'testimonials');
        const q = query(testimonialsCol, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
        const testimonialSnapshot = await getDocs(q);
        const fetchedTestimonials = testimonialSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          } as Testimonial;
        });
        setAllTestimonials(fetchedTestimonials);

      } catch (err) {
        console.error("Error fetching testimonials:", err);
        setError("Failed to load testimonials. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const totalPages = Math.ceil(allTestimonials.length / ITEMS_PER_PAGE);

  const paginatedTestimonials = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allTestimonials.slice(startIndex, endIndex);
  }, [currentPage, allTestimonials]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Student Success Stories"
          description="Hear from aspirants who have benefited from our mock interviews and guidance."
        />
        <div className="container py-12 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Student Success Stories"
          description="Hear from aspirants who have benefited from our mock interviews and guidance."
        />
        <div className="container py-12">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Testimonials</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Student Success Stories"
        description="Hear from aspirants who have benefited from our mock interviews and guidance."
      />
      <div className="container py-12">
        {allTestimonials.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No success stories have been approved for display yet. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}
