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
import { CheckCircle, XCircle } from 'lucide-react';

export default function SlotSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentService = MOCK_SERVICES.find(s => s.id === serviceId);
    if (currentService) {
      setService(currentService);
    } else {
      setError("Service not found.");
    }
  }, [serviceId]);

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
    // Store selected slot (e.g., in localStorage or state management) for next step
    localStorage.setItem('bookingDetails', JSON.stringify({ serviceId, date: selectedDate.toISOString().split('T')[0], time: selectedTime }));
    router.push(`/book/${serviceId}/details`);
  };

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
        {error && (
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
            </div>
          </CardContent>
        </Card>
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <Button 
            size="lg" 
            onClick={handleProceed} 
            disabled={!selectedDate || !selectedTime}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Proceed to Details
          </Button>
        </div>
      </div>
    </>
  );
}
