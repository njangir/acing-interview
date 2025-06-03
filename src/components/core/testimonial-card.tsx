import type { Testimonial } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Quote } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full shadow-lg bg-card">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={testimonial.imageUrl || `https://placehold.co/100x100.png?text=${testimonial.name.charAt(0)}`} 
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
      <CardContent>
        <Quote className="h-6 w-6 text-accent mb-2" />
        <p className="text-sm text-muted-foreground italic">"{testimonial.story}"</p>
        <p className="text-xs text-foreground/60 mt-2">Service Taken: {testimonial.serviceTaken}</p>
      </CardContent>
    </Card>
  );
}
