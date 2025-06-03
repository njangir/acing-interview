
'use client';

import { useState } from 'react';
import { addDays, format, startOfWeek, endOfWeek, nextSaturday, nextSunday } from 'date-fns';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AVAILABLE_SLOTS } from '@/constants'; // For simulation
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CalendarCheck } from 'lucide-react';

export default function AdminSlotsPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [interval, setIntervalMinutes] = useState<number>(60); // Default 1 hour slots

  const generateTimeSlots = (start: string, end: string, intervalMin: number): string[] => {
    const slots: string[] = [];
    let currentTime = new Date(`1970-01-01T${start}:00`);
    const const_endTime = new Date(`1970-01-01T${end}:00`);

    while (currentTime < const_endTime) {
      slots.push(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      currentTime = new Date(currentTime.getTime() + intervalMin * 60000);
    }
    return slots;
  };

  const handleUpdateAvailability = (dates: Date[], customSlots?: string[]) => {
    if (!dates.length) {
      toast({ title: "No Dates Selected", description: "Please select at least one date.", variant: "destructive" });
      return;
    }

    const newSlotsFromUI = customSlots || generateTimeSlots(startTime, endTime, interval);
    if (!newSlotsFromUI.length) {
      toast({ title: "Invalid Time Range", description: "End time must be after start time.", variant: "destructive" });
      return;
    }

    const updates: Record<string, string[]> = {};
    dates.forEach(date => {
      updates[format(date, 'yyyy-MM-dd')] = newSlotsFromUI;
    });
    
    // Simulate backend update
    console.log("Simulating update for AVAILABLE_SLOTS with:", updates);
    
    toast({
      title: "Availability Updated (Simulated)",
      description: `Slots for ${dates.length} date(s) have been 'updated'. In a real app, this would be saved to a backend.`,
    });
  };

  const handleMakeDateAvailable = () => {
    if (!selectedDate) {
       toast({ title: "No Date Selected", description: "Please select a date from the calendar.", variant: "destructive" });
      return;
    }
    handleUpdateAvailability([selectedDate]);
  };
  
  const handleQuickAction = (type: 'nextWeek' | 'nextWeekend') => {
    const today = new Date();
    const dates: Date[] = [];
    if (type === 'nextWeek') {
      let current = startOfWeek(addDays(today, 7), { weekStartsOn: 1 }); // Next Monday
      const end = endOfWeek(addDays(today, 7), { weekStartsOn: 1 }); // Next Sunday
      while(current <= end) {
        dates.push(new Date(current));
        current = addDays(current, 1);
      }
    } else if (type === 'nextWeekend') {
        dates.push(nextSaturday(today));
        dates.push(nextSunday(today));
    }
    const customSlots = (type === 'nextWeekend') 
        ? generateTimeSlots("10:00", "16:00", 60) // 10am-4pm for weekends
        : generateTimeSlots("09:00", "17:00", 60); // 9am-5pm for weekdays

    handleUpdateAvailability(dates, customSlots);
  };


  return (
    <>
      <PageHeader
        title="Manage Available Slots"
        description="Set the dates and times when users can book sessions."
      />
      <Alert className="mb-6 bg-primary/5 text-primary border-primary/20">
        <Info className="h-4 w-4 !text-primary" />
        <AlertTitle>Simulation Notice</AlertTitle>
        <AlertDescription>
          This page simulates updating available slots. Changes are reflected in the booking calendar for this session only (based on initial constants) and are not permanently stored.
        </AlertDescription>
      </Alert>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Manual Slot Configuration</CardTitle>
            <CardDescription>Select a date, define time ranges, and add slots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="date-picker" className="mb-2 block font-medium">Select Date:</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
            </div>
            <div>
                <Label htmlFor="interval">Slot Interval (minutes)</Label>
                <Input id="interval" type="number" value={interval} onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)} step="15" min="15" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleMakeDateAvailable} disabled={!selectedDate} className="w-full">
              <CalendarCheck className="mr-2 h-4 w-4" /> Set Availability for Selected Date
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Rapidly open up common availability patterns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button onClick={() => handleQuickAction('nextWeek')} variant="outline" className="w-full">
              Make Next 7 Days Available (9am-5pm)
            </Button>
            <Button onClick={() => handleQuickAction('nextWeekend')} variant="outline" className="w-full">
              Make Next Weekend Available (10am-4pm Sat/Sun)
            </Button>
            {/* More quick actions can be added here */}
          </CardContent>
           <CardFooter>
             <p className="text-xs text-muted-foreground">
                Quick actions will overwrite existing slots for the specified dates with the defined times.
             </p>
           </CardFooter>
        </Card>
      </div>
    </>
  );
}
