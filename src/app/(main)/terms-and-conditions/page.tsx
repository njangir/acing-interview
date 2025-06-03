
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsAndConditionsPage() {
  return (
    <>
      <PageHeader
        title="Terms and Conditions"
        description="Please read these terms and conditions carefully before using our services."
      />
      <div className="container py-12">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Our Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
              <p>Welcome to Armed Forces Interview Ace. These Terms and Conditions govern your use of our website and services. By accessing or using our service, you agree to be bound by these terms.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. Services</h2>
              <p>We offer mock interviews, counselling sessions, and guidance for armed forces aspirants. Service descriptions, durations, and prices are listed on our website and are subject to change.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. Bookings and Payments</h2>
              <p>Bookings must be made through our platform. Payment is required to confirm your slot, unless the "Pay Later" option is chosen. "Pay Later" slots are tentative and may be given to users who pay in advance. Full payment for "Pay Later" slots is due before the session.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Cancellations and Refunds</h2>
              <p>Users can request a refund up to 2 hours before the scheduled session time. No refunds will be issued for cancellations made less than 2 hours before the session or for no-shows. We reserve the right to cancel or reschedule sessions due to unforeseen circumstances, in which case a full refund or rescheduling option will be offered.</p>
            </section>
             <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. User Conduct</h2>
              <p>Users are expected to behave professionally during sessions. Any abusive or inappropriate behavior may result in termination of the session without a refund.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Intellectual Property</h2>
              <p>All content provided on this website and during sessions, including materials and resources, is the intellectual property of Armed Forces Interview Ace and may not be reproduced or distributed without permission.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
              <p>Our services are for guidance and preparation purposes only. We do not guarantee selection into the armed forces. Our liability is limited to the amount paid for the service.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Changes will be effective upon posting to the website. Your continued use of the service after changes constitutes acceptance of the new terms.</p>
            </section>
            <p className="pt-4">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
