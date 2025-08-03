
import { Suspense } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Loader2 } from 'lucide-react';
import ConfirmationClientPage from './confirmation-client-page';

function LoadingFallback() {
  return (
    <>
      <PageHeader
        title="Loading Confirmation..."
        description="Please wait while we retrieve your booking details."
      />
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmationClientPage />
    </Suspense>
  );
}
