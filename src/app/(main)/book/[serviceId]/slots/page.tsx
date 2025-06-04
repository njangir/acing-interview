
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
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
    } else {
      setError("Service not found.");
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
        // This should ideally be caught by the useEffect redirect, but as a safeguard
        router.push(`/login?redirect=/book/${serviceId}/slots`);
        return;
    }

    localStorage.setItem('bookingDetails', JSON.stringify({ 
        serviceId, 
        date: selectedDate.toISOString().split('T')[0], 
        time: selectedTime 
    }));
    
    // Pre-fill userDetails from currentUser for logged-in users
    const userDetailsToStore = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "", // Assuming phone might not always be present in AuthUser
      // examApplied and previousAttempts are skipped as per the new flow
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

  return (
    <>
      <PageHeader
        title={`Book: ${service.name}`}
        description="Select an available date and time slot for your session."
      />
      <div className="container py-12">
        {error && !selectedDate && !selectedTime && ( // Show general error if no selection yet
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
                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) || !AVAILABLE_SLOTS[date.toISOString().split('T')[0]]} // Disable past dates and dates with no slots
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
               {error && (selectedDate || selectedTime) && ( // Show error related to selection
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
