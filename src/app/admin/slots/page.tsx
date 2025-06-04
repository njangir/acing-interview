
'use client';

import { useState } from 'react';
import { addDays, format, startOfWeek, endOfWeek, nextSaturday, nextSunday, isBefore, startOfToday } from 'date-fns';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AVAILABLE_SLOTS } from '@/constants'; // For simulation
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CalendarCheck, CalendarX } from 'lucide-react';

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

    if (currentTime >= const_endTime || intervalMin <= 0) {
      return []; 
    }

    while (currentTime < const_endTime) {
      slots.push(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      currentTime = new Date(currentTime.getTime() + intervalMin * 60000);
    }
    return slots;
  };

  const handleUpdateAvailability = (dates: Date[], customSlots?: string[], actionType: 'set' | 'clear' = 'set') => {
    if (!dates.length) {
      toast({ title: "No Dates Selected", description: "Please select at least one date.", variant: "destructive" });
      return;
    }

    let slotsToApply: string[] = [];
    if (actionType === 'set') {
      slotsToApply = customSlots || generateTimeSlots(startTime, endTime, interval);
      if (!slotsToApply.length && !customSlots) { 
        toast({ title: "Invalid Time Range or Interval", description: "End time must be after start time, and interval must be positive.", variant: "destructive" });
        return;
      }
    } 

    const updates: Record<string, string[]> = {};
    dates.forEach(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      AVAILABLE_SLOTS[dateString] = slotsToApply; 
      updates[dateString] = slotsToApply;
    });
    
    console.log(`Simulating ${actionType === 'set' ? 'update' : 'clearing'} for AVAILABLE_SLOTS with:`, updates);
    
    toast({
      title: `Availability ${actionType === 'set' ? 'Updated' : 'Cleared'} (Simulated)`,
      description: `Slots for ${dates.length} date(s) have been ${actionType === 'set' ? 'set' : 'cleared'}. In a real app, this would be saved to a backend.`,
    });
    // Force re-render of calendar by changing selectedDate slightly if needed or use a dedicated state
    setSelectedDate(new Date(selectedDate || Date.now())); 
  };

  const handleMakeDateAvailable = () => {
    if (!selectedDate) {
       toast({ title: "No Date Selected", description: "Please select a date from the calendar.", variant: "destructive" });
      return;
    }
    handleUpdateAvailability([selectedDate], undefined, 'set');
  };

  const handleClearSlotsForDate = () => {
    if(!selectedDate) {
      toast({ title: "No Date Selected", description: "Please select a date to clear slots.", variant: "destructive" });
      return;
    }
    handleUpdateAvailability([selectedDate], [], 'clear');
  };
  
  const handleQuickAction = (type: 'nextWeekAvailable' | 'nextWeekendAvailable' | 'nextWeekUnavailable' | 'nextWeekendUnavailable') => {
    const today = new Date();
    const dates: Date[] = [];
    let actionType: 'set' | 'clear' = 'set';
    let slotsDefinition: string[] = [];

    if (type === 'nextWeekAvailable' || type === 'nextWeekUnavailable') {
      let current = startOfWeek(addDays(today, 7), { weekStartsOn: 1 }); 
      const end = endOfWeek(addDays(today, 7), { weekStartsOn: 1 }); 
      while(current <= end) {
        dates.push(new Date(current));
        current = addDays(current, 1);
      }
      actionType = type === 'nextWeekAvailable' ? 'set' : 'clear';
      if (actionType === 'set') {
        slotsDefinition = generateTimeSlots("09:00", "17:00", 60);
      }
    } else if (type === 'nextWeekendAvailable' || type === 'nextWeekendUnavailable') {
        dates.push(nextSaturday(today));
        dates.push(nextSunday(today));
        actionType = type === 'nextWeekendAvailable' ? 'set' : 'clear';
        if (actionType === 'set') {
            slotsDefinition = generateTimeSlots("10:00", "16:00", 60);
        }
    }
    handleUpdateAvailability(dates, actionType === 'set' ? slotsDefinition : [], actionType);
  };

  const todayForCalendar = startOfToday();

  const modifiers = {
    available: (date: Date) => {
      if (isBefore(date, todayForCalendar)) return false;
      const dateString = format(date, 'yyyy-MM-dd');
      return AVAILABLE_SLOTS[dateString] && AVAILABLE_SLOTS[dateString].length > 0;
    },
    unavailable: (date: Date) => {
      if (isBefore(date, todayForCalendar)) return false;
      const dateString = format(date, 'yyyy-MM-dd');
      return !AVAILABLE_SLOTS[dateString] || AVAILABLE_SLOTS[dateString].length === 0;
    }
  };

  const modifiersClassNames = {
    available: 'day-available',
    unavailable: 'day-unavailable',
  };


  return (
    <>
      <PageHeader
        title="Manage Available Slots"
        description="Set the dates and times when users can book sessions, or mark dates as unavailable."
      />
      <Alert className="mb-6 bg-primary/5 text-primary border-primary/20">
        <Info className="h-4 w-4 !text-primary" />
        <AlertTitle>Simulation Notice</AlertTitle>
        <AlertDescription>
          This page simulates updating available slots. Changes directly modify the `AVAILABLE_SLOTS` constant for this session and are reflected in the user's booking calendar. These changes are not permanently stored. Date colors: <span className="font-semibold text-green-600">Green</span> for available, <span className="font-semibold text-red-600">Red</span> for unavailable/no slots (future dates).
        </AlertDescription>
      </Alert>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Manual Slot Configuration</CardTitle>
            <CardDescription>Select a date, define time ranges to add slots, or clear existing slots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="date-picker" className="mb-2 block font-medium">Select Date:</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => isBefore(date, todayForCalendar)}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startTime">Start Time (for setting slots)</Label>
                    <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="endTime">End Time (for setting slots)</Label>
                    <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
            </div>
            <div>
                <Label htmlFor="interval">Slot Interval (minutes, for setting slots)</Label>
                <Input id="interval" type="number" value={interval} onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)} step="15" min="15" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleMakeDateAvailable} disabled={!selectedDate} className="w-full sm:w-auto flex-1">
              <CalendarCheck className="mr-2 h-4 w-4" /> Set Availability
            </Button>
            <Button onClick={handleClearSlotsForDate} disabled={!selectedDate} variant="destructive" className="w-full sm:w-auto flex-1">
              <CalendarX className="mr-2 h-4 w-4" /> Clear Slots
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Rapidly open up or clear common availability patterns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button onClick={() => handleQuickAction('nextWeekAvailable')} variant="outline" className="w-full">
              Make Next 7 Days Available (9am-5pm)
            </Button>
            <Button onClick={() => handleQuickAction('nextWeekendAvailable')} variant="outline" className="w-full">
              Make Next Weekend Available (10am-4pm Sat/Sun)
            </Button>
            <hr/>
            <Button onClick={() => handleQuickAction('nextWeekUnavailable')} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
              Make Next 7 Days Unavailable
            </Button>
            <Button onClick={() => handleQuickAction('nextWeekendUnavailable')} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
              Make Next Weekend Unavailable
            </Button>
          </CardContent>
           <CardFooter>
             <p className="text-xs text-muted-foreground">
                Quick actions will overwrite existing slots for the specified dates with the defined times or clear them entirely.
             </p>
           </CardFooter>
        </Card>
      </div>
    </>
  );
}
