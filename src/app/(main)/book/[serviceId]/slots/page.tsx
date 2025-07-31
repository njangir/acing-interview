
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Service, Booking } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Ban } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function SlotSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { currentUser, loadingAuth } = useAuth();
  const { toast } = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServiceBookable, setIsServiceBookable] = useState(true);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [firestoreSlots, setFirestoreSlots] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (loadingAuth) {
      setIsLoading(true);
      return;
    }
    if (!currentUser) {
      router.push(`/login?redirect=/book/${serviceId}/slots`);
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch service details
        const serviceDocRef = doc(db, "services", serviceId);
        const serviceSnap = await getDoc(serviceDocRef);
        if (serviceSnap.exists()) {
          const serviceData = serviceSnap.data() as Service;
          setService({ id: serviceSnap.id, ...serviceData });
          setIsServiceBookable(serviceData.isBookable === undefined ? true : serviceData.isBookable);
        } else {
          setError("Service not found.");
          setIsServiceBookable(false);
          setIsLoading(false);
          return;
        }

        // Fetch all availability data
        const availabilityColRef = collection(db, 'globalAvailability');
        const availabilitySnapshot = await getDocs(availabilityColRef);
        const fetchedSlots: Record<string, string[]> = {};
        availabilitySnapshot.forEach(doc => {
          fetchedSlots[doc.id] = doc.data().timeSlots || [];
        });
        setFirestoreSlots(fetchedSlots);

      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load service details or availability. Please try again.");
        setIsServiceBookable(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [serviceId, currentUser, router, loadingAuth]);

  useEffect(() => {
    if (selectedDate && serviceId) { 
      setIsFetchingSlots(true);
      setError(null);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      setAvailableTimes(firestoreSlots[dateString] || []);
      setSelectedTime(null);
      setIsFetchingSlots(false);
    } else {
      setAvailableTimes([]);
      setSelectedTime(null);
    }
  }, [selectedDate, serviceId, firestoreSlots]); 

  const handleProceed = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time slot.");
      return;
    }
    if (!currentUser || !service) {
        router.push(`/login?redirect=/book/${serviceId}/slots`);
        return;
    }
    if (!isServiceBookable) {
        setError("Bookings for this service are currently disabled.");
        return;
    }

    setIsProceeding(true);
    try {
      const newBookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        uid: currentUser.uid,
        serviceId: service.id,
        serviceName: service.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        userName: currentUser.name,
        userEmail: currentUser.email,
        meetingLink: '',
        status: 'pending_payment',
        paymentStatus: 'pay_later_pending', 
        transactionId: null,
        requestedRefund: false,
      };

      const docRef = await addDoc(collection(db, "bookings"), {
        ...newBookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      router.push(`/book/${serviceId}/payment?bookingId=${docRef.id}`);

    } catch (err) {
        console.error("Error creating pending booking:", err);
        toast({
            title: "Booking Error",
            description: "Could not initiate your booking. Please try again.",
            variant: "destructive"
        });
        setIsProceeding(false);
    }
  };

  if (isLoading || loadingAuth) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading slot information...</p>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!service) {
    return <div className="container py-12">Loading service details...</div>;
  }

  if (!isServiceBookable) {
    return (
      <>
        <PageHeader
            title={`Book: ${service.name}`}
            description="Select an available date and time slot for your session."
        />
        <div className="container py-12">
            <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Bookings Closed</AlertTitle>
            <AlertDescription>
                We are sorry, but bookings for "{service.name}" are currently disabled. Please check back later or contact support for more information.
            </AlertDescription>
            </Alert>
             <div className="mt-6 text-center">
                <Button onClick={() => router.push('/services')} variant="outline">View Other Services</Button>
            </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Book: ${service.name}`}
        description="Select an available date and time slot for your session."
      />
      <div className="container py-12">
        {error && !selectedDate && !selectedTime && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Choose Your Slot</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2 text-lg">Select Date:</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  const currentDayStart = new Date();
                  currentDayStart.setHours(0,0,0,0);
                  return date < currentDayStart || (!isFetchingSlots && (!firestoreSlots[dateString] || firestoreSlots[dateString]?.length === 0));
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Select Time:</h3>
              {isFetchingSlots ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Fetching times...</p>
                </div>
              ) : selectedDate && availableTimes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => {setSelectedTime(time); setError(null);}}
                      className={selectedTime === time ? "bg-primary text-primary-foreground" : ""}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{selectedDate ? "No slots available for this date." : "Please select a date to see available times."}</p>
              )}
               {error && (selectedDate || selectedTime) && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <Button
            size="lg"
            onClick={handleProceed}
            disabled={!selectedDate || !selectedTime || isLoading || isFetchingSlots || isProceeding}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {(isLoading || isFetchingSlots || isProceeding) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            {isProceeding ? 'Reserving Slot...' : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
    </>
  );
}

    