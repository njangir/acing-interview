import { PageHeader } from "@/components/core/page-header";
import { TestimonialCard } from "@/components/core/testimonial-card";
import { MOCK_TESTIMONIALS } from "@/constants";

export default function TestimonialsPage() {
  return (
    <>
      <PageHeader
        title="Student Success Stories"
        description="Hear from aspirants who have benefited from our mock interviews and guidance."
      />
      <div className="container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </>
  );
}
