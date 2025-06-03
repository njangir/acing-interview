import { PageHeader } from "@/components/core/page-header";
import { ServiceCard } from "@/components/core/service-card";
import { MOCK_SERVICES } from "@/constants";

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="Our Services"
        description="Explore our range of mock interview and counselling services designed to help you succeed in your defence exams."
      />
      <div className="container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </>
  );
}
