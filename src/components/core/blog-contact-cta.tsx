'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquarePlus } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export function BlogContactCta() {
  const { currentUser } = useAuth();

  return (
    <Card className="mt-16 bg-secondary/50 border-primary/20">
      <CardContent className="pt-6 text-center">
        {currentUser ? (
          <>
            <h3 className="text-xl font-semibold font-headline text-primary mb-2">Have a Question?</h3>
            <p className="text-muted-foreground mb-4">
              Discuss this post or ask any related queries directly to the mentor.
            </p>
            <Button asChild>
              <Link href="/dashboard/contact">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Contact Mentor for Queries
              </Link>
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold font-headline text-primary mb-2">Join the Discussion</h3>
            <p className="text-muted-foreground mb-4">
              <Link href="/login" className="text-primary underline hover:text-accent">
                Log in
              </Link> or <Link href="/signup" className="text-primary underline hover:text-accent">
                sign up
              </Link> to contact the mentor and ask questions about this post.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
