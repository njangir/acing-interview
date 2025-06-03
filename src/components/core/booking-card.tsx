
'use client';

import type { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, DollarSign, AlertTriangle, MessageSquare, RotateCcw, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const { toast } = useToast();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRefundEligible, setIsRefundEligible] = useState(false);

  const formattedDate = new Date(booking.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPaid = booking.paymentStatus === 'paid';
  const isPayLaterPending = booking.paymentStatus === 'pay_later_pending' || booking.paymentStatus === 'pay_later_unpaid';

  useEffect(() => {
    if (booking.status === 'upcoming') {
      const bookingDateTime = new Date(booking.date);
      const [timePart, ampm] = booking.time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0; // Midnight case
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      setIsRefundEligible(bookingDateTime.getTime() - now.getTime() > twoHoursInMs);
    }
  }, [booking.date, booking.time, booking.status]);

  const handleFeedbackSubmit = () => {
    console.log("Feedback submitted for booking:", booking.id, "Feedback:", feedbackText);
    toast({
      title: "Feedback Submitted!",
      description: "Thank you for your valuable feedback.",
    });
    setIsFeedbackModalOpen(false);
    setFeedbackText('');
    // Here you would typically send the feedback to your backend
  };

  const handleRefundRequest = () => {
    console.log("Refund requested for booking:", booking.id);
    toast({
      title: "Refund Request Submitted",
      description: "Your refund request has been received. We will process it shortly.",
      variant: "default"
    });
    // Update booking status or make API call
  };


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg text-primary">{booking.serviceName}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={booking.status === 'upcoming' ? 'default' : booking.status === 'completed' ? 'secondary' : 'destructive'}
            className={
                booking.status === 'upcoming' ? 'bg-green-600 text-white' : 
                booking.status === 'pending_approval' ? 'bg-yellow-500 text-black' : 
                booking.status === 'cancelled' ? 'bg-red-500 text-white' : ''
            }>
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
            <span>Your payment is pending. Please complete it before the session to confirm your spot and activate the meeting link.</span>
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
            Your feedback report is available for download.
          </p>
        )}
         {booking.status === 'completed' && !booking.reportUrl && (
          <p className="text-sm text-muted-foreground">
            Session completed. Feedback report will be available soon.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {booking.status === 'upcoming' && isPayLaterPending && (
            <Button asChild variant="default" size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
              className={`border-primary text-primary hover:bg-primary/10 ${!isPaid ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={!isPaid}
              title={!isPaid ? "Complete payment to join meeting" : "Join Meeting"}
            >
              <a href={isPaid ? booking.meetingLink : undefined} target="_blank" rel="noopener noreferrer">
                <Video className="mr-2 h-4 w-4" /> Join Meeting
              </a>
            </Button>
          )}
          {booking.status === 'upcoming' && isRefundEligible && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
                  <RotateCcw className="mr-2 h-4 w-4" /> Request Refund
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Refund Request</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to request a refund for {booking.serviceName} on {formattedDate}? 
                    This action can only be done up to 2 hours before the scheduled time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRefundRequest} className="bg-destructive hover:bg-destructive/90">
                    Confirm Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {booking.status === 'completed' && (
             <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setIsFeedbackModalOpen(true)}>
                  <Edit2 className="mr-2 h-4 w-4" /> Leave Feedback
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Feedback</DialogTitle>
                  <DialogDescription>
                    How was your session for "{booking.serviceName}" on {formattedDate}?
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="feedbackText" className="sr-only">Your Feedback</Label>
                  <Textarea 
                    id="feedbackText"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={5}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFeedbackModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleFeedbackSubmit} disabled={!feedbackText.trim()}>Submit Feedback</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {booking.status === 'completed' && booking.reportUrl && (
            <Button asChild variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
              <Link href={booking.reportUrl} target="_blank">
                <FileText className="mr-2 h-4 w-4" /> Download Report
              </Link>
            </Button>
          )}
        </div>
         <Button asChild variant="link" size="sm" className="text-primary justify-end mt-2 sm:mt-0">
            <Link href={`/book?serviceId=${booking.serviceName.toLowerCase().replace(/\s+/g, '-')}&rebook=true`}>
               Re-book Service
            </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
