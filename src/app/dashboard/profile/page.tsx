import { Suspense } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Loader2 } from 'lucide-react';
import ProfileClient from './profile-client';

function LoadingFallback() {
  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your account information and preferences."
      />
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProfileClient />
    </Suspense>
  );
}
