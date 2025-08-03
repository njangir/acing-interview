
import { Suspense } from 'react';
import LoginClient from './login-client';
import { Loader2 } from 'lucide-react';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginClient />
    </Suspense>
  );
}
