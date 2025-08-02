
import type { Service } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Info } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const isBookable = service.isBookable === undefined ? true : service.isBookable;

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out">
      <CardHeader>
        {service.image && (
          <div className="relative h-48 w-full mb-4 rounded-t-lg overflow-hidden">
            <Image
              src={service.image}
              alt={service.name}
              fill={true}
              style={{ objectFit: "cover" }}
              data-ai-hint={service.dataAiHint || 'service related'}
            />
             {!isBookable && (
              <Badge variant="destructive" className="absolute top-2 right-2 opacity-90">
                Bookings Closed
              </Badge>
            )}
          </div>
        )}
        <CardTitle className="font-headline text-xl text-primary">{service.name}</CardTitle>
        <CardDescription className="text-sm">{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <h4 className="font-semibold mb-2 text-foreground/80">What's included:</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {service.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-accent" />
              {feature}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-2xl font-bold text-primary">₹{service.price}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        {service.hasDetailsPage && (
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
            <Link href={`/service/${service.id}`}>
              <Info className="mr-2 h-4 w-4"/> Know More
            </Link>
          </Button>
        )}
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isBookable}>
          <Link href={isBookable ? `/book/${service.id}/slots` : '#'}>
            {isBookable ? 'Book Now' : 'Currently Unavailable'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
