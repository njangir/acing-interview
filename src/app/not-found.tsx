
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-extrabold text-primary font-headline">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  )
}
