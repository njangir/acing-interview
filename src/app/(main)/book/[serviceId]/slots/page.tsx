import { Suspense } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Loader2 } from 'lucide-react';
import SlotsClient from './slots-client';

function LoadingFallback() {
  return (
    <>
      <PageHeader
        title="Select Your Slot"
        description="Choose your preferred date and time for the session."
      />
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </>
  );
}

export default function SlotSelectionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SlotsClient />
    </Suspense>
  );
}
