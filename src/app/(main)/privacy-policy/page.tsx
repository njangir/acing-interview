
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="Your privacy is important to us. This policy explains how we collect, use, and protect your personal information."
      />
      <div className="container py-12">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Our Commitment to Your Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Information We Collect</h2>
              <p>We collect personal information you provide when you register, book a service, or communicate with us. This may include your name, email address, phone number, and details related to your defence exam preparations.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
              <p>Your information is used to: provide and manage our services; process payments; communicate with you about your bookings and our services; personalize your experience; and improve our offerings.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. Information Sharing</h2>
              <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except to trusted third parties who assist us in operating our website or conducting our business (e.g., payment processors), so long as those parties agree to keep this information confidential. We may also release information when its release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property, or safety.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Data Security</h2>
              <p>We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Cookies</h2>
              <p>Our website may use "cookies" to enhance user experience. You can choose to disable cookies through your browser settings, though some site features may not function properly.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal information. Please contact us to make such requests.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
            </section>
            <p className="pt-4">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
