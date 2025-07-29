
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Service, Booking } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, XCircle, CreditCard, Info, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import { db, functions } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentOption = 'payNow' | 'payLater';

const createPaymentOrder = httpsCallable(functions, 'createPaymentOrder');
const verifyPayment = httpsCallable(functions, 'verifyPayment');

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParamsHook = useSearchParams(); 
  const serviceId = params.serviceId as string;
  const bookingId = searchParamsHook.get('bookingId');
  const { toast } = useToast();
  const { currentUser, loadingAuth } = useAuth();
  
  const [service, setService] = useState<Service | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('payNow');

  useEffect(() => {
    if (loadingAuth) {
      setIsDataLoading(true);
      return;
    }
    if (!currentUser) {
      setIsDataLoading(false);
      setError("User not authenticated. Please login.");
      router.push(`/login?redirect=/book/${serviceId}/slots`);
      return;
    }

    if (!bookingId) {
        setError("Booking ID is missing. Please start over.");
        setIsDataLoading(false);
        return;
    }

    const loadInitialData = async () => {
      setIsDataLoading(true);
      setError(null);
      try {
        const bookingDocRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingDocRef);

        if (!bookingSnap.exists() || bookingSnap.data().uid !== currentUser.uid) {
            setError("Booking not found or access denied.");
            setIsDataLoading(false);
            return;
        }

        const bookingData = bookingSnap.data() as Booking;
        setBooking(bookingData);

        if(bookingData.paymentStatus === 'paid') {
            setError("This booking has already been paid.");
        }

        const serviceDocRef = doc(db, "services", bookingData.serviceId);
        const serviceSnap = await getDoc(serviceDocRef);
        if (serviceSnap.exists()) {
          setService({ id: serviceSnap.id, ...serviceSnap.data() } as Service);
        } else {
          setError("Service associated with this booking not found.");
          setIsDataLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error loading payment page data:", err);
        setError("Failed to load payment details. Please try again.");
      }
      setIsDataLoading(false);
    };

    loadInitialData();
  }, [serviceId, bookingId, router, currentUser, loadingAuth]);

  const handlePaymentOrConfirmation = async () => {
    setIsLoading(true);
    setError(null);

    if (!service || !booking || !currentUser || !bookingId) {
      setError("Critical booking information is missing. Please start over.");
      setIsLoading(false);
      return;
    }
    
    if (paymentOption === 'payNow') {
      try {
        const orderResponse: any = await createPaymentOrder({
          bookingId: bookingId,
          amount: service.price,
        });

        const { orderId, keyId } = orderResponse.data;

        const options = {
          key: keyId,
          amount: service.price * 100,
          currency: "INR",
          name: "Armed Forces Interview Ace",
          description: `Payment for ${service.name}`,
          image: "/logo.svg", // Add your logo here
          order_id: orderId,
          handler: async function (response: any) {
            try {
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId,
              });
              
              toast({
                title: "Payment Successful!",
                description: "Your booking is confirmed. Admin will provide the meeting link.",
              });
              router.push(`/book/confirmation?bookingId=${bookingId}`);
            } catch (verificationError) {
              console.error("Payment verification failed:", verificationError);
              toast({
                title: "Payment Verification Failed",
                description: "Your payment was processed, but we couldn't verify it. Please contact support with your booking ID.",
                variant: "destructive",
              });
              setError("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            name: currentUser.name,
            email: currentUser.email,
          },
          theme: {
            color: "#0d47a1", // Your primary color
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
            console.error("Razorpay payment failed:", response.error);
            toast({
              title: "Payment Failed",
              description: `Reason: ${response.error.description}`,
              variant: "destructive",
            });
            setError(`Payment failed: ${response.error.reason}. Please try again or choose 'Pay Later'.`);
        });
        rzp.open();
        
      } catch (orderError) {
        console.error("Error creating payment order:", orderError);
        toast({ title: "Could not initiate payment", description: "Failed to create a payment order. Please try again.", variant: "destructive" });
        setError("Could not connect to the payment gateway.");
      }
    } else { // Pay Later
      if(booking.status !== 'pending_payment') {
          setError("Pay Later option is only available for new bookings.");
          setIsLoading(false);
          return;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate short processing
      
      try {
          const bookingDocRef = doc(db, "bookings", bookingId);
          await updateDoc(bookingDocRef, {
            paymentStatus: 'pay_later_pending',
            status: 'pending_approval',
            updatedAt: serverTimestamp(),
          });
          toast({
            title: "Booking Tentatively Confirmed!",
            description: "Your slot is reserved. Payment will be due before the session if approved. Redirecting...",
          });
          router.push(`/book/confirmation?bookingId=${bookingId}`);
      } catch (dbError) {
          console.error("Error updating booking for Pay Later:", dbError);
          setError("Failed to reserve your slot. Please try again.");
      }
    }
    
    setIsLoading(false);
  };

  if (isDataLoading || loadingAuth) {
    return <div className="container py-12"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error && !service && !booking) { // Critical error
     return (
      <div className="container py-12">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} Please start the booking process again.</AlertDescription>
           <Button onClick={() => router.push('/services')} className="mt-4">Go to Services</Button>
        </Alert>
      </div>
    );
  }
  
  if (!service || !booking) { // Should be caught by isDataLoading, but as fallback
    return <div className="container py-12">Loading payment details... Ensure you are logged in and have selected a slot.</div>;
  }
  
  const isExistingBooking = booking.status !== 'pending_payment';

  return (
    <>
      <PageHeader
        title="Complete Your Booking"
        description={`You are booking ${service.name}. Please review and choose your payment option.`}
      />
      <div className="container py-12">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Booking Summary</CardTitle>
            <CardDescription>
              Service: {booking.serviceName} <br />
              Date: {new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <br/>
              Time: {booking.time} <br />
              Name: {booking.userName} <br />
              Email: {booking.userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{service.price}</span>
            </div>

            <RadioGroup 
                onValueChange={(value: PaymentOption) => setPaymentOption(value)} 
                className="space-y-2"
                value={isExistingBooking ? 'payNow' : paymentOption}
            >
              <Label className="font-semibold text-md">Payment Options:</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                <RadioGroupItem 
                    value="payNow" 
                    id="payNow" 
                    disabled={booking.paymentStatus === 'paid'}
                />
                <Label htmlFor="payNow" className="flex-1 cursor-pointer">Pay Now & Confirm Slot</Label>
              </div>
              {!isExistingBooking && (
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="payLater" id="payLater" />
                    <Label htmlFor="payLater" className="flex-1 cursor-pointer">Pay Later (Tentative, Requires Approval)</Label>
                </div>
              )}
            </RadioGroup>

            {paymentOption === 'payLater' && !isExistingBooking && (
              <Alert variant="default" className="bg-accent/10 border-accent/50 text-accent-foreground">
                <Info className="h-4 w-4 !text-accent" />
                <AlertTitle className="!text-accent">Important Notice</AlertTitle>
                <AlertDescription className="!text-accent/80">
                  Slots booked with 'Pay Later' are tentative and require admin approval. If approved, payment will be due before your scheduled session to fully confirm your booking.
                </AlertDescription>
              </Alert>
            )}
            
            {paymentOption === 'payNow' && (
                <div className="text-center pt-4">
                <Image src="https://placehold.co/300x80.png?text=Secure+Payment+via+Razorpay" alt="Pay with Razorpay" width={300} height={80} className="mx-auto rounded border" data-ai-hint="payment gateway razorpay"/>
                </div>
            )}

             {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handlePaymentOrConfirmation} 
              disabled={isLoading || booking.paymentStatus === 'paid'} 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : paymentOption === 'payNow' ? (
                <CreditCard className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Processing...' : 
                paymentOption === 'payNow' ? `Pay ₹${service.price} Securely` : 'Request Booking (Pay Later)'
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
