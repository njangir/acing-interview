
import type { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const formattedDate = new Date(booking.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPaid = booking.paymentStatus === 'paid';
  const isPayLaterPending = booking.paymentStatus === 'pay_later_pending' || booking.paymentStatus === 'pay_later_unpaid';

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg text-primary">{booking.serviceName}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={booking.status === 'upcoming' ? 'default' : booking.status === 'completed' ? 'secondary' : 'destructive'}
            className={booking.status === 'upcoming' ? 'bg-green-600 text-white' : booking.status === 'pending_approval' ? 'bg-yellow-500 text-black' : ''}
            >
              {booking.status.replace('_', ' ').toUpperCase()}
            </Badge>
             <Badge variant={isPaid ? 'default' : 'secondary'}
              className={isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
            >
              <DollarSign className="mr-1 h-3 w-3" /> {booking.paymentStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

        </div>
        <CardDescription className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" /> {formattedDate} at {booking.time}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {booking.status === 'upcoming' && isPayLaterPending && (
          <div className="flex items-start p-3 mb-3 text-sm rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700">
            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Your payment is pending. Please complete it before the session to confirm your spot.</span>
          </div>
        )}
        {booking.status === 'upcoming' && isPaid && (
          <p className="text-sm text-muted-foreground">
            Your session is confirmed! Meeting link will be active shortly before the session.
          </p>
        )}
         {booking.status === 'pending_approval' && (
          <p className="text-sm text-muted-foreground">
            This booking is awaiting admin approval. You will be notified once confirmed.
          </p>
        )}
        {booking.status === 'completed' && booking.reportUrl && (
          <p className="text-sm text-muted-foreground">
            Your feedback report is available.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {booking.status === 'upcoming' && isPayLaterPending && (
            <Button asChild variant="default" size="sm" className="w-full sm:w-auto bg-accent hover:bg-accent/90">
              {/* This would link to a payment page for this specific booking */}
              <Link href={`/book/${booking.id}/pay`}> {/* Assuming a route like this for payment */}
                <DollarSign className="mr-2 h-4 w-4" /> Complete Payment
              </Link>
            </Button>
          )}
          {booking.status === 'upcoming' && (
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className={`w-full sm:w-auto border-primary text-primary hover:bg-primary/10 ${!isPaid ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={!isPaid}
              title={!isPaid ? "Complete payment to join meeting" : "Join Meeting"}
            >
              <a href={isPaid ? booking.meetingLink : undefined} target="_blank" rel="noopener noreferrer">
                <Video className="mr-2 h-4 w-4" /> Join Meeting
              </a>
            </Button>
          )}
          {booking.status === 'completed' && booking.reportUrl && (
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href={booking.reportUrl} target="_blank">
                <FileText className="mr-2 h-4 w-4" /> Download Report
              </Link>
            </Button>
          )}
        </div>
         <Button asChild variant="link" size="sm" className="w-full sm:w-auto text-primary justify-end mt-2 sm:mt-0">
            <Link href={`/book?serviceId=${booking.serviceName.toLowerCase().replace(/\s+/g, '-')}&rebook=true`}>
               Re-book Service
            </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
