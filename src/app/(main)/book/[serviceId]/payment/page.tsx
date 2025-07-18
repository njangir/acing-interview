
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
import { bookingService, serviceService } from '@/lib/firebase-services';

// PRODUCTION TODO: Import Firebase and Firestore methods:
// import { db } from '@/lib/firebase';
// import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, runTransaction } from 'firebase/firestore';
// import { functions } from '@/lib/firebase'; // If using Firebase Functions for backend logic
// import { httpsCallable } from 'firebase/functions';

type PaymentOption = 'payNow' | 'payLater';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParamsHook = useSearchParams(); 
  const serviceId = params.serviceId as string;
  const bookingIdFromQuery = searchParamsHook.get('bookingId'); 
  const { toast } = useToast();
  const { user, loadingAuth } = useAuth(); // Use user and loadingAuth
  
  const [service, setService] = useState<Service | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null); // Slot details from localStorage or query
  const [userDetails, setUserDetails] = useState<any>(null); // User info from localStorage or currentUser
  const [isLoading, setIsLoading] = useState(false); // General loading for page actions
  const [isDataLoading, setIsDataLoading] = useState(true); // Specific for initial data load
  const [error, setError] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('payNow');

  useEffect(() => {
    if (loadingAuth) {
      setIsDataLoading(true);
      return;
    }
    if (!user) {
      setIsDataLoading(false);
      setError("User not authenticated. Please login.");
      // router.push(`/login?redirect=/book/${serviceId}/payment${bookingIdFromQuery ? `?bookingId=${bookingIdFromQuery}` : ''}`);
      return;
    }

    const loadInitialData = async () => {
      setIsDataLoading(true);
      setError(null);
      try {
        // PRODUCTION TODO: Fetch service details from Firestore
        // const serviceDocRef = doc(db, "services", serviceId);
        // const serviceSnap = await getDoc(serviceDocRef);
        // if (serviceSnap.exists()) {
        //   setService({ id: serviceSnap.id, ...serviceSnap.data() } as Service);
        // } else {
        //   setError("Service not found.");
        //   setIsDataLoading(false);
        //   return;
        // }
        const currentService = await serviceService.getServiceById(serviceId);
        if (currentService) {
          setService(currentService);
        } else {
          setError("Service not found.");
          setIsDataLoading(false);
          return;
        }

        if (bookingIdFromQuery) {
          // PRODUCTION TODO: Fetch existing booking from Firestore
          // const bookingDocRef = doc(db, "bookings", bookingIdFromQuery);
          // const bookingSnap = await getDoc(bookingDocRef);
          // if (bookingSnap.exists() && bookingSnap.data().serviceId === serviceId && bookingSnap.data().uid === currentUser.uid) {
          //   const bookingData = bookingSnap.data() as Booking;
          //   setBookingDetails({
          //       date: bookingData.date,
          //       time: bookingData.time,
          //       serviceId: bookingData.serviceId,
          //       serviceName: bookingData.serviceName, // Get from fetched booking
          //       servicePrice: currentService?.price, // Get from fetched service
          //   });
          //   setUserDetails({ 
          //       name: bookingData.userName, // or currentUser.name
          //       email: bookingData.userEmail, // or currentUser.email
          //   });
          //   if(bookingData.paymentStatus === 'paid') {
          //       setError("This booking has already been paid.");
          //   }
          // } else {
          //   setError("Existing booking information not found or does not match. Please try again or start a new booking.");
          //   setIsDataLoading(false);
          //   return;
          // }
          const existingBooking = await bookingService.getBookingById(bookingIdFromQuery);
          if (existingBooking && existingBooking.serviceId === serviceId && existingBooking.userEmail === user.email) {
            setBookingDetails({
                date: existingBooking.date,
                time: existingBooking.time,
                serviceId: existingBooking.serviceId,
                serviceName: existingBooking.serviceName,
                servicePrice: currentService?.price,
            });
            setUserDetails({ 
                name: existingBooking.userName,
                email: existingBooking.userEmail,
            });
            if(existingBooking.paymentStatus === 'paid') {
                setError("This booking has already been paid.");
            }
          } else {
            setError("Existing booking information not found or does not match. Please try again or start a new booking.");
            setIsDataLoading(false); return;
          }
        } else {
            // PRODUCTION TODO: Data passed from previous page (slots) should ideally be through secure means or state,
            // not just localStorage if sensitive. Or, a "pending_payment" booking doc could be created on slot selection.
            const storedBookingDetails = localStorage.getItem('bookingDetails');
            if (storedBookingDetails) {
              setBookingDetails(JSON.parse(storedBookingDetails));
            } else {
              setError("Booking slot information not found.");
              router.push(`/book/${serviceId}/slots`); 
              setIsDataLoading(false); return;
            }
            // User details would primarily come from currentUser context
            setUserDetails({name: user.name, email: user.email});
        }
      } catch (err) {
        console.error("Error loading payment page data:", err);
        setError("Failed to load payment details. Please try again.");
      }
      setIsDataLoading(false);
    };

    loadInitialData();
  }, [serviceId, bookingIdFromQuery, router, user, loadingAuth]);

  const handlePaymentOrConfirmation = async () => {
    setIsLoading(true);
    setError(null);

    if (!service || !bookingDetails || !userDetails || !user) {
      setError("Critical booking information is missing or you are not logged in. Please start over.");
      setIsLoading(false);
      return;
    }
    
    let paymentSuccess = true;
    let newBookingStatus: Booking['status'] = 'pending_approval';
    let newPaymentStatus: Booking['paymentStatus'] = 'pay_later_pending';
    let transactionId: string | null = null;
    let finalMeetingLink: string = ''; // Usually set by admin later

    if (paymentOption === 'payNow') {
      // PRODUCTION TODO: Payment Gateway Integration
      // 1. Call backend API to create a payment order (e.g., /api/payment/create-order)
      //    Payload: { serviceId: service.id, amount: service.price, userId: currentUser.uid, bookingId: bookingIdFromQuery (if exists) }
      //    const createOrder = httpsCallable(functions, 'createPaymentOrder');
      //    const orderResult = await createOrder({ serviceId: service.id, amount: service.price, userId: currentUser.uid, bookingId: bookingIdFromQuery });
      //    const { orderId, gatewayKey } = orderResult.data;

      // 2. Initialize Payment Gateway SDK on client-side with orderId & key
      //    const options = { key: gatewayKey, amount: service.price * 100, currency: "INR", name: "Armed Forces Interview Ace", order_id: orderId,
      //      handler: async (response) => {
      //        // Payment successful, response contains paymentId, orderId, signature
      //        // 3. Call backend API to verify payment and confirm booking (e.g., /api/booking/confirm)
      //        //    Payload: { paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id, signature: response.razorpay_signature, bookingId: bookingIdFromQuery }
      //        //    const confirmBookingCall = httpsCallable(functions, 'confirmBooking');
      //        //    const bookingConfirmationResult = await confirmBookingCall({...});
      //        //    if (bookingConfirmationResult.data.success) {
      //        //       transactionId = bookingConfirmationResult.data.transactionId;
      //        //       newPaymentStatus = 'paid';
      //        //       newBookingStatus = bookingConfirmationResult.data.bookingStatus; // e.g., 'accepted' or 'scheduled'
      //        //       finalMeetingLink = bookingConfirmationResult.data.meetingLink || '';
      //        //       proceedToConfirmationPage(newBookingStatus, newPaymentStatus, transactionId, finalMeetingLink);
      //        //    } else { setError("Failed to confirm booking after payment."); setIsLoading(false); }
      //      },
      //      prefill: { name: userDetails.name, email: userDetails.email },
      //      theme: { color: '#2563EB' } // Your primary color
      //    };
      //    const rzp = new window.Razorpay(options);
      //    rzp.on('payment.failed', (response) => { setError("Payment failed: " + response.error.description); setIsLoading(false); });
      //    rzp.open();
      //    // For simulation, we skip rzp.open() and directly proceed
      //    return; // Actual payment flow would handle the rest via callbacks. This is for demo.

      // MOCK PAYMENT SIMULATION
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      paymentSuccess = Math.random() > 0.1; // 90% success rate

      if (paymentSuccess) {
        transactionId = "mock_txn_" + Date.now();
        newPaymentStatus = 'paid';
        
        if (bookingIdFromQuery) { // Paying for an existing 'pay_later_pending' booking
            // PRODUCTION TODO: Update existing booking in Firestore
            // const bookingDocRef = doc(db, "bookings", bookingIdFromQuery);
            // await updateDoc(bookingDocRef, {
            //   paymentStatus: 'paid',
            //   transactionId: transactionId,
            //   status: MOCK_BOOKINGS.find(b=>b.id===bookingIdFromQuery)?.meetingLink ? 'scheduled' : 'accepted', // Adjust based on if link exists
            //   updatedAt: serverTimestamp()
            // });
            // newBookingStatus = MOCK_BOOKINGS.find(b=>b.id===bookingIdFromQuery)?.meetingLink ? 'scheduled' : 'accepted';
            const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingIdFromQuery);
            if (bookingIndex !== -1) {
                MOCK_BOOKINGS[bookingIndex].paymentStatus = 'paid';
                MOCK_BOOKINGS[bookingIndex].transactionId = transactionId;
                MOCK_BOOKINGS[bookingIndex].status = MOCK_BOOKINGS[bookingIndex].meetingLink ? 'scheduled' : 'accepted';
                newBookingStatus = MOCK_BOOKINGS[bookingIndex].status;
                finalMeetingLink = MOCK_BOOKINGS[bookingIndex].meetingLink || '';
            } else { setError("Could not find the booking to update."); setIsLoading(false); return; }
        } else { // New booking, paid now
            newBookingStatus = 'accepted'; // Admin needs to provide link
        }
        toast({
          title: "Payment Successful!",
          description: newBookingStatus === 'accepted' ? "Your booking is paid. Admin will schedule and provide meeting link." : "Your booking is confirmed. Redirecting...",
        });
      } else {
        setError("Payment failed. Please try again or choose 'Pay Later'.");
        toast({ title: "Payment Failed", description: "There was an issue processing your payment.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    } else { // Pay Later
      if (bookingIdFromQuery) { 
          setError("Pay Later option is not available for existing bookings being paid now.");
          setIsLoading(false);
          return;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate short processing
      newPaymentStatus = 'pay_later_pending';
      newBookingStatus = 'pending_approval';
      toast({
        title: "Booking Tentatively Confirmed!",
        description: "Your slot is reserved. Payment will be due before the session if approved. Redirecting...",
      });
    }

    if (paymentSuccess) { // This means either PayNow was successful or PayLater was chosen
      if (!bookingIdFromQuery) { // If it's a brand new booking, create it in Firestore
        const newBookingId = `booking-${Date.now()}`; // PRODUCTION TODO: Use Firestore auto-generated ID
        // const newBookingRef = doc(collection(db, "bookings")); // Firestore auto-ID
        // const newBookingId = newBookingRef.id;

        const newBookingEntry: Booking = {
          id: newBookingId,
          uid: user.uid, // Link to authenticated user
          serviceName: service.name,
          serviceId: service.id,
          date: bookingDetails.date,
          time: bookingDetails.time,
          userName: userDetails.name,
          userEmail: user.email, // Use authenticated user's email
          meetingLink: finalMeetingLink, 
          status: newBookingStatus,
          paymentStatus: newPaymentStatus,
          transactionId: transactionId,
          requestedRefund: false,
          // createdAt: serverTimestamp(), // Firestore server timestamp
          // updatedAt: serverTimestamp(),
          // For mock:
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // PRODUCTION TODO: await setDoc(newBookingRef, newBookingEntry);
        MOCK_BOOKINGS.push(newBookingEntry); // Mock
      }
      // For existing bookings, Firestore update was handled in 'payNow' block.

      // Store details for confirmation page. PRODUCTION: Could pass bookingId and fetch on confirmation page.
      localStorage.setItem('confirmationDetails', JSON.stringify({
        serviceName: service.name,
        date: bookingDetails.date,
        time: bookingDetails.time,
        userName: userDetails.name,
        meetingLink: finalMeetingLink,
        transactionId: transactionId,
        paymentStatus: newPaymentStatus,
        status: newBookingStatus,
      }));
      router.push(`/book/confirmation`);
    }
    
    setIsLoading(false);
  };

  const proceedToConfirmationPage = (status: Booking['status'], paymentStatus: Booking['paymentStatus'], txnId: string | null, meetingLink: string) => {
    // This function would be called from payment gateway success handler in production
    if (!service || !bookingDetails || !userDetails) return;
    localStorage.setItem('confirmationDetails', JSON.stringify({
        serviceName: service.name,
        date: bookingDetails.date,
        time: bookingDetails.time,
        userName: userDetails.name,
        meetingLink: meetingLink,
        transactionId: txnId,
        paymentStatus: paymentStatus,
        status: status,
      }));
    router.push(`/book/confirmation`);
    setIsLoading(false);
  }


  if (isDataLoading || loadingAuth) {
    return <div className="container py-12"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error && (!service || !bookingDetails)) { // Critical error
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
  
  if (!service || !bookingDetails || !userDetails) { // Should be caught by isDataLoading, but as fallback
    return <div className="container py-12">Loading payment details... Ensure you are logged in and have selected a slot.</div>;
  }
  
  const existingBookingPaid = bookingIdFromQuery && MOCK_BOOKINGS.find(b=>b.id===bookingIdFromQuery)?.paymentStatus === 'paid';


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
              Service: {service.name} <br />
              Date: {new Date(bookingDetails.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <br/>
              Time: {bookingDetails.time} <br />
              Name: {userDetails.name} <br />
              Email: {userDetails.email}
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
                // If paying for an existing booking, 'Pay Now' is the only option.
                // Otherwise, respect the user's choice or default to 'Pay Now'.
                value={bookingIdFromQuery ? 'payNow' : paymentOption} 
            >
              <Label className="font-semibold text-md">Payment Options:</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                <RadioGroupItem 
                    value="payNow" 
                    id="payNow" 
                    disabled={!!existingBookingPaid} // Disable if already paid
                />
                <Label htmlFor="payNow" className="flex-1 cursor-pointer">Pay Now & Confirm Slot</Label>
              </div>
              {!bookingIdFromQuery && ( // 'Pay Later' only for new bookings
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="payLater" id="payLater" />
                    <Label htmlFor="payLater" className="flex-1 cursor-pointer">Pay Later (Tentative, Requires Approval)</Label>
                </div>
              )}
            </RadioGroup>

            {paymentOption === 'payLater' && !bookingIdFromQuery && (
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
                {/* PRODUCTION TODO: Replace with actual payment gateway button/integration (e.g., Razorpay button) */}
                <Image src="https://placehold.co/300x80.png?text=Mock+Payment+Gateway" alt="Mock Payment Gateway" width={300} height={80} className="mx-auto rounded border" data-ai-hint="payment gateway logo"/>
                </div>
            )}

             {error && ( // General error display if not critical
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
              disabled={isLoading || !!existingBookingPaid} 
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
