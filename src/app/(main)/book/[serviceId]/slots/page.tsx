
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { MOCK_SERVICES, AVAILABLE_SLOTS } from "@/constants";
import type { Service } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Ban } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function SlotSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { currentUser } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServiceBookable, setIsServiceBookable] = useState(true);

  useEffect(() => {
    if (currentUser === undefined) { // Auth state still loading
      setIsLoading(true);
      return;
    }
    if (currentUser === null) {
      router.push(`/login?redirect=/book/${serviceId}/slots`);
      return;
    }
    setIsLoading(false);

    const currentService = MOCK_SERVICES.find(s => s.id === serviceId);
    if (currentService) {
      setService(currentService);
      setIsServiceBookable(currentService.isBookable === undefined ? true : currentService.isBookable);
    } else {
      setError("Service not found.");
      setIsServiceBookable(false); // If service not found, it's not bookable
    }
  }, [serviceId, currentUser, router]);

  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setAvailableTimes(AVAILABLE_SLOTS[dateString] || []);
      setSelectedTime(null); // Reset time when date changes
    }
  }, [selectedDate]);

  const handleProceed = () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time slot.");
      return;
    }
    if (!currentUser) {
        router.push(`/login?redirect=/book/${serviceId}/slots`);
        return;
    }
    if (!isServiceBookable) {
        setError("Bookings for this service are currently disabled.");
        return;
    }

    localStorage.setItem('bookingDetails', JSON.stringify({
        serviceId,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime
    }));

    const userDetailsToStore = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "",
    };
    localStorage.setItem('userDetails', JSON.stringify(userDetailsToStore));

    router.push(`/book/${serviceId}/payment`);
  };

  if (isLoading) {
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
                  const dateString = date.toISOString().split('T')[0];
                  const today = new Date();
                  today.setHours(0,0,0,0); // Compare dates only, not time
                  return date < today || !AVAILABLE_SLOTS[dateString] || AVAILABLE_SLOTS[dateString]?.length === 0;
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Select Time:</h3>
              {selectedDate && availableTimes.length > 0 ? (
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
            disabled={!selectedDate || !selectedTime || isLoading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Proceed to Payment
          </Button>
        </div>
      </div>
    </>
  );
}

    