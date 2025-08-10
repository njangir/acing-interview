'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

import { db, functions } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { format, isBefore, startOfToday } from 'date-fns';
import { httpsCallable } from 'firebase/functions';

const getAvailableSlots = httpsCallable(functions, 'getAvailableSlots');
const getGlobalAvailability = httpsCallable(functions, 'getAvailability');

export default function SlotsClient() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { currentUser, loadingAuth } = useAuth();
  const { toast } = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServiceBookable, setIsServiceBookable] = useState(true);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  
  const [globalSlotsData, setGlobalSlotsData] = useState<Record<string, string[]>>({});

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [serviceSnap, availabilityResult]: [any, any] = await Promise.all([
        getDoc(doc(db, "services", serviceId)),
        getGlobalAvailability()
      ]);

      if (!serviceSnap.exists()) {
        setError("Service not found. Please check the URL and try again.");
        setIsLoading(false);
        return;
      }

      const serviceData = { id: serviceSnap.id, ...serviceSnap.data() } as Service;
      setService(serviceData);
      setIsServiceBookable(serviceData.isBookable !== false);

      if (availabilityResult.data) {
        setGlobalSlotsData(availabilityResult.data.availability || {});
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError("Failed to load service details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (loadingAuth) return;
    if (!currentUser) {
      router.push(`/login?redirect=/book/${serviceId}/slots`);
      return;
    }
    fetchInitialData();
  }, [currentUser, loadingAuth, router, fetchInitialData, serviceId]);

  const fetchAvailableSlots = useCallback(async (date: Date) => {
    if (!service) return;
    
    setIsFetchingSlots(true);
    setError(null);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const result: any = await getAvailableSlots({
        serviceId: service.id,
        dateString: dateString
      });

      if (result.data && result.data.availableSlots) {
        setAvailableTimes(result.data.availableSlots);
      } else {
        setAvailableTimes([]);
      }
    } catch (err: any) {
      console.error("Error fetching available slots:", err);
      setError(err.message || "Failed to load available time slots. Please try again.");
      setAvailableTimes([]);
    } finally {
      setIsFetchingSlots(false);
    }
  }, [service]);

  useEffect(() => {
    if (selectedDate && service) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, service, fetchAvailableSlots]);

  const availableDates = useMemo(() => {
    return Object.keys(globalSlotsData).map(dateStr => new Date(dateStr));
  }, [globalSlotsData]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const proceedToPayment = async () => {
    if (!selectedDate || !selectedTime || !service || !currentUser) {
      toast({
        title: "Incomplete Selection",
        description: "Please select both date and time before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsProceeding(true);
    setError(null);

    try {
      const bookingData: Omit<Booking, 'id'> = {
        uid: currentUser.uid,
        serviceId: service.id,
        serviceName: service.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'pending_payment',
        paymentStatus: 'pay_later_pending',
        userName: currentUser.name || currentUser.email || 'Unknown User',
        userEmail: currentUser.email || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        meetingLink: ''
      };

      const bookingRef = await addDoc(collection(db, "bookings"), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Slot Reserved!",
        description: "Your slot has been temporarily reserved. Please complete payment to confirm.",
      });

      router.push(`/book/${serviceId}/payment?bookingId=${bookingRef.id}`);
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Failed to reserve your slot. Please try again.");
      toast({
        title: "Booking Failed",
        description: "Unable to reserve your slot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProceeding(false);
    }
  };

  if (loadingAuth || isLoading) {
    return (
      <>
        <PageHeader
          title="Select Your Slot"
          description="Choose your preferred date and time for the session."
        />
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <PageHeader
          title="Select Your Slot"
          description="Please log in to book a session."
        />
        <div className="container py-12">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>Please log in to continue with your booking.</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (error && !service) {
    return (
      <>
        <PageHeader
          title="Select Your Slot"
          description="There was an error loading the service details."
        />
        <div className="container py-12">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={() => router.push('/services')} className="mt-4">
              Back to Services
            </Button>
          </Alert>
        </div>
      </>
    );
  }

  if (!service) {
    return (
      <>
        <PageHeader
          title="Select Your Slot"
          description="Loading service details..."
        />
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!isServiceBookable) {
    return (
      <>
        <PageHeader
          title={service.name}
          description="This service is currently not available for booking."
        />
        <div className="container py-12">
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Service Unavailable</AlertTitle>
            <AlertDescription>
              This service is currently not available for booking. Please check back later or contact support.
            </AlertDescription>
            <Button onClick={() => router.push('/services')} className="mt-4">
              Back to Services
            </Button>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Book ${service.name}`}
        description={`Select your preferred date and time. Price: ₹${service.price}`}
      />
      
      <div className="container py-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Calendar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => 
                  isBefore(date, startOfToday()) || 
                  !availableDates.some(availableDate => 
                    format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  )
                }
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Time Slots Section */}
          <Card>
            <CardHeader>
              <CardTitle>Select Time</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <p className="text-muted-foreground">Please select a date first.</p>
              ) : isFetchingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : availableTimes.length === 0 ? (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>No Slots Available</AlertTitle>
                  <AlertDescription>
                    No time slots are available for the selected date. Please choose a different date.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => handleTimeSelect(time)}
                      className="justify-center"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary and Proceed Button */}
        {selectedDate && selectedTime && (
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Service:</strong> {service.name}</p>
              <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Price:</strong> ₹{service.price}</p>
            </CardContent>
            <CardContent>
              <Button 
                onClick={proceedToPayment} 
                disabled={isProceeding}
                className="w-full"
                size="lg"
              >
                {isProceeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="max-w-md mx-auto mt-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}
