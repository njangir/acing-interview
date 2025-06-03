
'use client';

import type { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, DollarSign, AlertTriangle, MessageSquare, RotateCcw, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; 
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BookingCardProps {
  booking: Booking;
  onBookingUpdate?: (updatedBooking: Booking) => void; 
}

export function BookingCard({ booking: initialBooking, onBookingUpdate }: BookingCardProps) {
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isRefundEligible, setIsRefundEligible] = useState(false);

  useEffect(() => {
    setBooking(initialBooking); 
  }, [initialBooking]);

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
      if (ampm === 'AM' && hours === 12) hours = 0; 
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      setIsRefundEligible(bookingDateTime.getTime() - now.getTime() > twoHoursInMs);
    } else {
      setIsRefundEligible(false);
    }
  }, [booking.date, booking.time, booking.status]);

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
      toast({ title: "Feedback Empty", description: "Please enter your feedback before submitting.", variant: "destructive" });
      return;
    }
    console.log("Feedback submitted for booking:", booking.id, "Feedback:", feedbackText);
    toast({
      title: "Feedback Submitted!",
      description: "Thank you for your valuable feedback. It will be reviewed by our team.",
    });
    setIsFeedbackModalOpen(false);
    setFeedbackText('');
  };

  const handleRefundRequestSubmit = () => {
    if (!refundReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for your refund request.", variant: "destructive" });
      return;
    }
    console.log("Refund requested for booking:", booking.id, "Reason:", refundReason);
    
    const updatedBooking: Booking = { ...booking, requestedRefund: true, refundReason };
    setBooking(updatedBooking); 
    if (onBookingUpdate) {
      onBookingUpdate(updatedBooking); 
    }
    
    toast({
      title: "Refund Request Submitted",
      description: `Your request for booking ${booking.serviceName} has been received. Reason: ${refundReason}. Admin will review it.`,
      variant: "default"
    });
    setIsRefundModalOpen(false);
    setRefundReason('');
  };


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg text-primary">{booking.serviceName}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={
                booking.status === 'upcoming' ? 'default' : 
                booking.status === 'completed' ? 'secondary' : 
                booking.status === 'cancelled' ? 'destructive' :
                'outline' 
            }
            className={
                booking.status === 'upcoming' ? 'bg-green-600 text-white' : 
                booking.status === 'pending_approval' ? 'bg-yellow-500 text-black' : 
                booking.status === 'cancelled' ? 'bg-red-600 text-white' : 
                booking.status === 'completed' ? 'bg-gray-500 text-white' : ''
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
        {booking.status === 'upcoming' && isPaid && !booking.requestedRefund && (
          <p className="text-sm text-muted-foreground">
            Your session is confirmed! Meeting link will be active shortly before the session.
          </p>
        )}
        {booking.status === 'upcoming' && booking.requestedRefund && (
          <Alert variant="default" className="mb-3 border-orange-500 text-orange-700 bg-orange-50">
            <AlertTriangle className="h-4 w-4 !text-orange-600"/>
            <AlertTitle className="!text-orange-700">Refund Requested</AlertTitle>
            <AlertDescription className="!text-orange-600">
                Your refund request is pending admin approval. Reason: {booking.refundReason}
            </AlertDescription>
          </Alert>
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
        {booking.status === 'cancelled' && (
            <p className="text-sm text-destructive/80">This booking has been cancelled.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {booking.status === 'upcoming' && isPayLaterPending && (
            <Button asChild variant="default" size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href={`/book/${booking.serviceId}/payment?bookingId=${booking.id}`}> 
                <DollarSign className="mr-2 h-4 w-4" /> Complete Payment
              </Link>
            </Button>
          )}
          {booking.status === 'upcoming' && (
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className={`border-primary text-primary hover:bg-primary/10 ${(!isPaid || booking.requestedRefund) ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={!isPaid || !!booking.requestedRefund}
              title={!isPaid ? "Complete payment to join meeting" : booking.requestedRefund ? "Refund request pending" : "Join Meeting"}
            >
              <a href={(isPaid && !booking.requestedRefund) ? booking.meetingLink : undefined} target="_blank" rel="noopener noreferrer">
                <Video className="mr-2 h-4 w-4" /> Join Meeting
              </a>
            </Button>
          )}
          {booking.status === 'upcoming' && isPaid && isRefundEligible && !booking.requestedRefund && (
            <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
                    <RotateCcw className="mr-2 h-4 w-4" /> Request Refund
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Request Refund</DialogTitle>
                    <DialogDesc>
                        Please provide a reason for your refund request for {booking.serviceName} on {formattedDate}.
                        This action can only be done up to 2 hours before the scheduled time.
                    </DialogDesc>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="refundReason">Reason for Refund (Required)</Label>
                        <Textarea
                            id="refundReason"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="e.g., Unexpected conflict, change of plans..."
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRefundModalOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleRefundRequestSubmit} 
                        disabled={!refundReason.trim()}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Submit Refund Request
                    </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
                  <DialogDesc>
                    How was your session for "{booking.serviceName}" on {formattedDate}?
                  </DialogDesc>
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
         {booking.status !== 'cancelled' && (
            <Button asChild variant="link" size="sm" className="text-primary justify-end mt-2 sm:mt-0">
                <Link href={`/book/${booking.serviceId}/slots`}> 
                Re-book Service
                </Link>
            </Button>
         )}
      </CardFooter>
    </Card>
  );
}
