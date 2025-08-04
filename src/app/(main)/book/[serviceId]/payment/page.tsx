import { Suspense } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Loader2 } from 'lucide-react';
import PaymentClient from './payment-client';

function LoadingFallback() {
  return (
    <>
      <PageHeader
        title="Complete Your Booking"
        description="Loading payment details..."
      />
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentClient />
    </Suspense>
  );
}