import { Suspense } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Loader2 } from 'lucide-react';
import ResourcesClient from './resources-client';

function LoadingFallback() {
  return (
    <>
      <PageHeader
        title="My Resources"
        description="Access your purchased study materials and resources."
      />
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </>
  );
}

export default function MyResourcesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResourcesClient />
    </Suspense>
  );
}
