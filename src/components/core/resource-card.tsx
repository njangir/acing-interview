
import type { Resource } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = resource.icon || ExternalLink;
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col h-full">
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="p-3 bg-accent/20 rounded-md shrink-0">
          <Icon className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-grow min-w-0"> {/* Allow this div to shrink and wrap content */}
          <CardTitle className="font-headline text-lg text-primary break-words"> {/* Ensure title can wrap */}
            {resource.title}
          </CardTitle>
          {resource.description && (
            <CardDescription className="text-sm mt-1 break-words"> {/* Ensure description can wrap */}
              {resource.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow"> {/* Allow content to push footer down */}
        <p className="text-xs text-muted-foreground">Type: <span className="capitalize">{resource.type}</span></p>
        <p className="text-xs text-muted-foreground">Category: {resource.serviceCategory.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
      </CardContent>
      <CardFooter className="mt-auto"> {/* Ensure footer is at the bottom */}
        <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
          <Link href={resource.url} target={resource.type === 'link' || resource.type === 'video' ? '_blank' : '_self'} download={resource.type === 'document'}>
            {resource.type === 'document' ? <Download className="mr-2 h-4 w-4" /> : <ExternalLink className="mr-2 h-4 w-4" />}
            {resource.type === 'document' ? 'Download' : 'Access Resource'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
