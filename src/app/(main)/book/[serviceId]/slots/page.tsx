
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Service } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Ban } from 'lucide-react';
import { availabilityService } from '@/lib/firebase-services';
import { useAuth } from '@/hooks/use-auth';

// PRODUCTION TODO: Import Firebase and Firestore methods:
// import { db } from '@/lib/firebase';
// import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
// import { format } from 'date-fns'; // For formatting dates for Firestore queries

export default function SlotSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { user, loading } = useAuth(); // Added loadingAuth

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Used for initial service load and slot fetching
  const [isServiceBookable, setIsServiceBookable] = useState(true);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      router.push(`/login?redirect=/book/${serviceId}/slots`);
      return;
    }

    const fetchServiceDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // PRODUCTION TODO: Fetch service details from Firestore
        // const serviceDocRef = doc(db, "services", serviceId);
        // const serviceSnap = await getDoc(serviceDocRef);
        // if (serviceSnap.exists()) {
        //   const serviceData = serviceSnap.data() as Service;
        //   setService(serviceData);
        //   setIsServiceBookable(serviceData.isBookable === undefined ? true : serviceData.isBookable);
        // } else {
        //   setError("Service not found.");
        //   setIsServiceBookable(false);
        // }

        // MOCK IMPLEMENTATION:
        const currentService = MOCK_SERVICES.find(s => s.id === serviceId);
        if (currentService) {
          setService(currentService);
          setIsServiceBookable(currentService.isBookable === undefined ? true : currentService.isBookable);
        } else {
          setError("Service not found.");
          setIsServiceBookable(false);
        }
      } catch (err) {
        console.error("Error fetching service details:", err);
        setError("Failed to load service details. Please try again.");
        setIsServiceBookable(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId, user, router, loading]);

  // Memoize the stringified version of slots for the selected date to use as a dependency
  // For production, this logic will depend on how slots are fetched and stored in state.
  const stringifiedSlotsForSelectedDate = useState(() => {
    if (!selectedDate) return '[]';
    const dateString = selectedDate.toISOString().split('T')[0];
    // MOCK: Directly access AVAILABLE_SLOTS
    return JSON.stringify(AVAILABLE_SLOTS[dateString] || []);
  });


  useEffect(() => {
    if (selectedDate && serviceId) { // Ensure serviceId is available
      setIsFetchingSlots(true);
      setError(null); // Clear previous slot errors

      const fetchSlotsForDate = async () => {
        try {
          const dateString = selectedDate.toISOString().split('T')[0];
          // PRODUCTION TODO: Fetch available slots from Firestore for the given serviceId and dateString
          // Example:
          // const slotsQuery = query(
          //   collection(db, "serviceAvailability"),
          //   where("serviceId", "==", serviceId),
          //   where("date", "==", dateString)
          // );
          // const slotsSnapshot = await getDocs(slotsQuery);
          // if (!slotsSnapshot.empty) {
          //   const slotsData = slotsSnapshot.docs[0].data(); // Assuming one doc per service per day
          //   setAvailableTimes(slotsData.timeSlots || []);
          // } else {
          //   setAvailableTimes([]);
          // }

          // MOCK IMPLEMENTATION:
          await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
          setAvailableTimes(AVAILABLE_SLOTS[dateString] || []);

        } catch (err) {
          console.error("Error fetching slots for date:", err);
          setError("Failed to load available slots for this date. Please try another date.");
          setAvailableTimes([]);
        } finally {
          setIsFetchingSlots(false);
          setSelectedTime(null); // Reset time when date changes or its slots change
        }
      };
      fetchSlotsForDate();
    } else {
      setAvailableTimes([]);
      setSelectedTime(null);
      setIsFetchingSlots(false);
    }
    // stringifiedSlotsForSelectedDate can be removed if directly fetching from Firestore
  }, [selectedDate, serviceId]); // Removed stringifiedSlotsForSelectedDate if direct fetch

  const handleProceed = () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time slot.");
      return;
    }
    if (!user) {
        router.push(`/login?redirect=/book/${serviceId}/slots`);
        return;
    }
    if (!isServiceBookable) {
        setError("Bookings for this service are currently disabled.");
        return;
    }

    // PRODUCTION TODO:
    // The data stored in localStorage is for passing to the next page (payment/confirmation).
    // In a production scenario:
    // 1. This data might be used to create an initial "pending" booking document in Firestore
    //    before redirecting to payment. This can reserve the slot temporarily.
    // 2. OR, this data is passed to the payment page, and the booking document in Firestore
    //    is created *after* successful payment or when "Pay Later" is chosen on the payment page.
    //    This avoids orphaned "pending" bookings if the user abandons the payment process.
    // For now, localStorage is used for simplicity in the prototype flow.

    localStorage.setItem('bookingDetails', JSON.stringify({
        serviceId,
        serviceName: service?.name, // Include service name for display on next page
        servicePrice: service?.price, // Include price for display
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime
    }));

    const userDetailsToStore = {
      name: user.name,
      email: user.email,
      // phone: user.phone || "", // If phone is part of AuthUser/UserProfile
    };
    localStorage.setItem('userDetails', JSON.stringify(userDetailsToStore));

    router.push(`/book/${serviceId}/payment`);
  };

  if (isLoading || loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading slot information...</p>
      </div>
    );
  }

  if (error && !service) { // Critical error if service details couldn't load
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

  if (!service) { // Should be caught by isLoading, but as a fallback
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
        {error && !selectedDate && !selectedTime && ( // General error display
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
                  const dateString = date.toISOString().split('T')[0];
                  const currentDayStart = new Date();
                  currentDayStart.setHours(0,0,0,0);
                  // PRODUCTION: The disabled logic will depend on how slots are fetched.
                  // If AVAILABLE_SLOTS is replaced by a dynamic fetch, this needs to check
                  // the fetched data or rely on the server to not send unbookable dates/slots.
                  // For mock, it still uses AVAILABLE_SLOTS.
                  return date < currentDayStart || (!isFetchingSlots && (!AVAILABLE_SLOTS[dateString] || AVAILABLE_SLOTS[dateString]?.length === 0));
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
                      onClick={() => {setSelectedTime(time); setError(null);}} // Clear general errors when a time is selected
                      className={selectedTime === time ? "bg-primary text-primary-foreground" : ""}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{selectedDate ? "No slots available for this date." : "Please select a date to see available times."}</p>
              )}
               {error && (selectedDate || selectedTime) && ( // Display slot-specific errors here
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
            disabled={!selectedDate || !selectedTime || isLoading || isFetchingSlots}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {(isLoading || isFetchingSlots) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Proceed to Payment
          </Button>
        </div>
      </div>
    </>
  );
}
