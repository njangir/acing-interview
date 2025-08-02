
'use client';

import type { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, DollarSign, AlertTriangle, MessageSquare, RotateCcw, Edit2, Star as StarIcon, ClipboardCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking: initialBooking }: BookingCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isRefundEligible, setIsRefundEligible] = useState(false);
  const [isViewFeedbackModalOpen, setIsViewFeedbackModalOpen] = useState(false);


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
    if (booking.status === 'scheduled' || booking.status === 'accepted') {
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

  const handleFeedbackSubmit = async () => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to leave feedback.", variant: "destructive"});
      return;
    }
    if (!feedbackText.trim() && rating === 0) {
      toast({ title: "Feedback Empty", description: "Please provide a rating or a comment before submitting.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const feedbackMessage = `Rating: ${rating > 0 ? `${rating}/5 stars` : 'Not provided'}\n\nComment: ${feedbackText || 'No comment provided.'}`;

      const userMessagesColRef = collection(db, "userMessages");
      await addDoc(userMessagesColRef, {
        uid: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        subject: `Feedback for: ${booking.serviceName} on ${formattedDate}`,
        messageBody: feedbackMessage,
        senderType: 'user',
        status: 'closed', // Create as a closed thread
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Also update the booking to mark that feedback has been left
      const bookingDocRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingDocRef, {
        userFeedback: "submitted", // Use a flag to indicate submission
        rating: rating,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your valuable feedback. It has been sent to the admin.",
      });
      setIsFeedbackModalOpen(false);
      setFeedbackText('');
      setRating(0);
    } catch (error) {
       console.error("Error submitting feedback:", error);
       toast({ title: "Submission Failed", description: "Could not submit your feedback.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefundRequestSubmit = async () => {
    if (!refundReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for your refund request.", variant: "destructive" });
      return;
    }
    
    try {
        const bookingDocRef = doc(db, 'bookings', booking.id);
        await updateDoc(bookingDocRef, {
            requestedRefund: true,
            refundReason: refundReason,
            updatedAt: serverTimestamp(),
        });
        toast({
          title: "Refund Request Submitted",
          description: `Your request for booking ${booking.serviceName} has been received. Admin will review it.`,
        });
        setIsRefundModalOpen(false);
        setRefundReason('');
    } catch(error) {
        console.error("Error submitting refund request:", error);
        toast({ title: "Request Failed", description: "Could not submit your refund request.", variant: "destructive" });
    }
  };


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg text-primary">{booking.serviceName}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={
                booking.status === 'scheduled' || booking.status === 'accepted' ? 'default' :
                booking.status === 'completed' ? 'secondary' :
                booking.status === 'cancelled' ? 'destructive' :
                'outline'
            }
            className={
                (booking.status === 'scheduled' || booking.status === 'accepted') ? 'bg-green-600 text-white' :
                booking.status === 'pending_approval' ? 'bg-yellow-500 text-black' :
                booking.status === 'cancelled' ? 'bg-red-600 text-white' :
                booking.status === 'completed' ? 'bg-gray-500 text-white' : ''
            }>
              {booking.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
             <Badge variant={isPaid ? 'default' : 'secondary'}
              className={isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
            >
              <DollarSign className="mr-1 h-3 w-3" /> {booking.paymentStatus.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

        </div>
        <CardDescription className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" /> {formattedDate} at {booking.time}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(booking.status === 'scheduled' || booking.status === 'accepted') && isPayLaterPending && (
          <div className="flex items-start p-3 mb-3 text-sm rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700">
            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Your payment is pending. Please complete it before the session to confirm your spot and activate the meeting link.</span>
          </div>
        )}
        {booking.status === 'scheduled' && isPaid && !booking.requestedRefund && (
          <p className="text-sm text-muted-foreground">
            Your session is confirmed! Meeting link will be active shortly before the session.
          </p>
        )}
        {booking.status === 'accepted' && isPaid && !booking.requestedRefund && (
          <p className="text-sm text-muted-foreground">
            Payment confirmed! Admin will schedule your session and provide the meeting link soon.
          </p>
        )}
        {(booking.status === 'scheduled' || booking.status === 'accepted') && booking.requestedRefund && (
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
            Your feedback report is available for download. Mentor feedback can be viewed below.
          </p>
        )}
         {booking.status === 'completed' && !booking.reportUrl && (
          <p className="text-sm text-muted-foreground">
            Session completed. Feedback report and detailed mentor feedback will be available soon.
          </p>
        )}
        {booking.status === 'cancelled' && (
            <p className="text-sm text-destructive/80">This booking has been cancelled.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {(booking.status === 'scheduled' || booking.status === 'accepted') && isPayLaterPending && (
            <Button asChild variant="default" size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href={`/book/${booking.serviceId}/payment?bookingId=${booking.id}`}>
                <DollarSign className="mr-2 h-4 w-4" /> Complete Payment
              </Link>
            </Button>
          )}
          {booking.status === 'scheduled' && booking.meetingLink && (
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
          {(booking.status === 'scheduled' || booking.status === 'accepted') && isPaid && isRefundEligible && !booking.requestedRefund && (
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
                <Button variant="outline" size="sm" onClick={() => setIsFeedbackModalOpen(true)} disabled={booking.userFeedback === 'submitted'}>
                  <Edit2 className="mr-2 h-4 w-4" /> {booking.userFeedback === 'submitted' ? 'Feedback Submitted' : 'Leave Feedback'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Feedback</DialogTitle>
                  <DialogDesc>
                    How was your session for "{booking.serviceName}" on {formattedDate}?
                  </DialogDesc>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <Label htmlFor="rating" className="mb-2 block">Your Rating</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={cn("h-6 w-6 cursor-pointer", (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="feedbackText" className="mb-2 block">Your Comments</Label>
                    <Textarea
                      id="feedbackText"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us about your experience..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFeedbackModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleFeedbackSubmit} disabled={(!feedbackText.trim() && rating === 0) || isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Feedback
                  </Button>
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
          {booking.status === 'completed' && booking.detailedFeedback && booking.detailedFeedback.length > 0 && (
            <Dialog open={isViewFeedbackModalOpen} onOpenChange={setIsViewFeedbackModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ClipboardCheck className="mr-2 h-4 w-4" /> View Mentor Feedback
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Mentor Feedback: {booking.serviceName}</DialogTitle>
                  <DialogDesc>
                    Session Date: {formattedDate}
                  </DialogDesc>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-1 pr-3 custom-scrollbar">
                  <div className="space-y-4 py-4">
                    {booking.detailedFeedback.map((fb, index) => (
                      <div key={index} className="border-b pb-2 last:border-b-0">
                        <h4 className="font-semibold text-sm text-primary">{fb.skill}</h4>
                        <p className="text-sm text-foreground">Rating: <span className="font-medium">{fb.rating}</span></p>
                        {fb.comments && (
                          <p className="text-xs text-muted-foreground mt-1">Comments: {fb.comments}</p>
                        )}
                      </div>
                    ))}
                    {booking.detailedFeedback.length === 0 && (
                        <p className="text-sm text-muted-foreground">No detailed skill feedback provided for this session.</p>
                    )}
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsViewFeedbackModalOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

    