
'use client'; // Required for localStorage and useEffect/useState

import type { Testimonial, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Quote } from 'lucide-react';
import Image from 'next/image'; // For displaying the body image
import { useState, useEffect } from 'react';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | undefined>(testimonial.imageUrl);

  useEffect(() => {
    if (testimonial.userEmail) {
      try {
        const userProfileString = localStorage.getItem(`mockUserProfile_${testimonial.userEmail}`);
        if (userProfileString) {
          const userProfile: UserProfile = JSON.parse(userProfileString);
          if (userProfile.imageUrl) {
            setDisplayAvatarUrl(userProfile.imageUrl);
          }
        }
      } catch (error) {
        console.error("Failed to parse user profile for avatar:", error);
        // Fallback to testimonial. Url is already handled by initial state
      }
    }
  }, [testimonial.userEmail, testimonial.imageUrl]);

  return (
    <Card className="h-full shadow-lg bg-card flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={displayAvatarUrl || `https://placehold.co/100x100.png?text=${testimonial.name.charAt(0)}`} 
            alt={testimonial.name}
            data-ai-hint={testimonial.dataAiHint || 'person'}
          />
          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-headline">{testimonial.name}</CardTitle>
          {testimonial.batch && <CardDescription>{testimonial.batch}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <Quote className="h-6 w-6 text-accent mb-2" />
        <p className="text-sm text-muted-foreground italic">"{testimonial.story}"</p>
        
        {testimonial.bodyImageUrl && (
          <div className="mt-4 relative aspect-video w-full max-w-xs mx-auto rounded-md overflow-hidden border">
            <Image
              src={testimonial.bodyImageUrl}
              alt={`Photo from ${testimonial.name}`}
              fill
              style={{ objectFit: 'contain' }}
              data-ai-hint={testimonial.bodyImageDataAiHint || 'testimonial photo'}
            />
          </div>
        )}
        
        <p className="text-xs text-foreground/60 mt-3">
          Service Taken: {testimonial.serviceTaken}
        </p>
        {testimonial.submissionStatus === 'selected_cleared' && testimonial.selectedForce && (
            <p className="text-xs text-foreground/60">
                Cleared for: {testimonial.selectedForce}
                {testimonial.interviewLocation && ` (SSB: ${testimonial.interviewLocation})`}
                {testimonial.numberOfAttempts && `, Attempt: ${testimonial.numberOfAttempts}`}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
