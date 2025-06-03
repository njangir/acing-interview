import type { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg text-primary">{booking.serviceName}</CardTitle>
          <Badge variant={booking.status === 'upcoming' ? 'default' : booking.status === 'completed' ? 'secondary' : 'destructive'}
           className={booking.status === 'upcoming' ? 'bg-green-500 text-white' : ''}
          >
            {booking.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" /> {formattedDate} at {booking.time}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {booking.status === 'upcoming' && (
          <p className="text-sm text-muted-foreground">
            Your session is scheduled. Meeting link will be active shortly before the session.
          </p>
        )}
        {booking.status === 'completed' && booking.reportUrl && (
          <p className="text-sm text-muted-foreground">
            Your feedback report is available.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
        {booking.status === 'upcoming' && (
          <Button asChild variant="outline" className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10">
            <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
              <Video className="mr-2 h-4 w-4" /> Join Meeting
            </a>
          </Button>
        )}
        {booking.status === 'completed' && booking.reportUrl && (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={booking.reportUrl} target="_blank">
              <FileText className="mr-2 h-4 w-4" /> Download Report
            </Link>
          </Button>
        )}
         <Button asChild variant="link" className="w-full sm:w-auto text-primary">
            <Link href={`/book?serviceId=${booking.serviceName.toLowerCase().replace(/\s+/g, '-')}&rebook=true`}>
               Re-book Service
            </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
