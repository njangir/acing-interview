
import { PageHeader } from "@/components/core/page-header";
import { TestimonialCard } from "@/components/core/testimonial-card";
import { MOCK_TESTIMONIALS } from "@/constants";

export default function TestimonialsPage() {
  const approvedTestimonials = MOCK_TESTIMONIALS.filter(testimonial => testimonial.status === 'approved');

  return (
    <>
      <PageHeader
        title="Student Success Stories"
        description="Hear from aspirants who have benefited from our mock interviews and guidance."
      />
      <div className="container py-12">
        {approvedTestimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {approvedTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No success stories have been approved for display yet. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}
