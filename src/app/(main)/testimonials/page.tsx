
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { TestimonialCard } from "@/components/core/testimonial-card";
import { MOCK_TESTIMONIALS } from "@/constants";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 6; // 2 rows of 3 cards

export default function TestimonialsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const approvedTestimonials = useMemo(() => {
    return MOCK_TESTIMONIALS.filter(testimonial => testimonial.status === 'approved');
  }, []);

  const totalPages = Math.ceil(approvedTestimonials.length / ITEMS_PER_PAGE);

  const paginatedTestimonials = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return approvedTestimonials.slice(startIndex, endIndex);
  }, [currentPage, approvedTestimonials]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <>
      <PageHeader
        title="Student Success Stories"
        description="Hear from aspirants who have benefited from our mock interviews and guidance."
      />
      <div className="container py-12">
        {approvedTestimonials.length > 0 ? (
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
