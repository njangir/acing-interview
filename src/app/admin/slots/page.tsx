
'use client';

import { useState, useEffect, useMemo } from 'react'; // Added useEffect and useMemo
import { addDays, format, startOfWeek, endOfWeek, nextSaturday, nextSunday, isBefore, startOfToday } from 'date-fns';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AVAILABLE_SLOTS } from '@/constants'; // For simulation & temporary dual update
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CalendarCheck, CalendarX, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2, AlertTriangle

// PRODUCTION TODO: Import Firebase and Firestore methods
// import { db } from '@/lib/firebase';
// import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';

// Structure for slots data fetched from/sent to Firestore
type FirestoreSlotsData = Record<string, string[]>;

export default function AdminSlotsPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [interval, setIntervalMinutes] = useState<number>(60);

  const [firestoreSlotsData, setFirestoreSlotsData] = useState<FirestoreSlotsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // PRODUCTION TODO: Fetch all (or a relevant range of) slot data from Firestore
        // Example: Assuming a collection 'globalAvailability' where doc ID is 'YYYY-MM-DD'
        // const availabilityColRef = collection(db, 'globalAvailability');
        // const snapshot = await getDocs(availabilityColRef);
        // const fetchedData: FirestoreSlotsData = {};
        // snapshot.forEach(doc => {
        //   fetchedData[doc.id] = doc.data().timeSlots || [];
        // });
        // setFirestoreSlotsData(fetchedData);

        // MOCK: Simulate fetch by using a copy of AVAILABLE_SLOTS
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        setFirestoreSlotsData({ ...AVAILABLE_SLOTS }); // Initialize with current mock state for demo

      } catch (err) {
        console.error("Error fetching availability data:", err);
        setError("Failed to load availability data. Please try again.");
        // Fallback to mock if fetch fails, to keep UI somewhat functional
        setFirestoreSlotsData({ ...AVAILABLE_SLOTS });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailability();
  }, []);


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

  const handleUpdateAvailability = async (dates: Date[], customSlots?: string[], actionType: 'set' | 'clear' = 'set') => {
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

    // To reflect changes immediately in UI
    const updatedFirestoreSlots: FirestoreSlotsData = { ...firestoreSlotsData };

    try {
      // PRODUCTION TODO: Batch write to Firestore
      // const batch = writeBatch(db);
      for (const date of dates) {
        const dateString = format(date, 'yyyy-MM-dd');
        // PRODUCTION TODO: Update Firestore document for this dateString
        // Example: const docRef = doc(db, 'globalAvailability', dateString);
        // batch.set(docRef, { timeSlots: slotsToApply });

        // MOCK: Update local state for Firestore simulation
        updatedFirestoreSlots[dateString] = slotsToApply;
        // MOCK: Also update the global AVAILABLE_SLOTS for other parts of the prototype
        AVAILABLE_SLOTS[dateString] = slotsToApply;
      }
      // PRODUCTION TODO: await batch.commit();

      setFirestoreSlotsData(updatedFirestoreSlots); // Update local state to re-render calendar

      toast({
        title: `Availability ${actionType === 'set' ? 'Updated' : 'Cleared'} (Simulated Firestore & Mock)`,
        description: `Slots for ${dates.length} date(s) have been ${actionType === 'set' ? 'set' : 'cleared'}.`,
      });
      // Force re-render of calendar by changing selectedDate slightly if needed or use a dedicated state
      setSelectedDate(new Date(selectedDate || Date.now()));

    } catch (err) {
        console.error("Error updating availability in Firestore:", err);
        toast({ title: "Update Failed", description: "Could not save availability changes.", variant: "destructive"});
    }
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

  // Calendar modifiers will now use firestoreSlotsData
  const modifiers = useMemo(() => ({
    available: (date: Date) => {
      if (isBefore(date, todayForCalendar)) return false;
      const dateString = format(date, 'yyyy-MM-dd');
      return firestoreSlotsData[dateString] && firestoreSlotsData[dateString].length > 0;
    },
    unavailable: (date: Date) => {
      if (isBefore(date, todayForCalendar)) return false;
      const dateString = format(date, 'yyyy-MM-dd');
      return !firestoreSlotsData[dateString] || firestoreSlotsData[dateString].length === 0;
    }
  }), [firestoreSlotsData, todayForCalendar]);

  const modifiersClassNames = {
    available: 'day-available',
    unavailable: 'day-unavailable',
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Manage Available Slots"
          description="Set the dates and times when users can book sessions, or mark dates as unavailable."
        />
        <div className="container py-12 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2">Loading availability data...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Manage Available Slots"
          description="Set the dates and times when users can book sessions, or mark dates as unavailable."
        />
        <div className="container py-12">
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Availability</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Manage Available Slots"
        description="Set the dates and times when users can book sessions, or mark dates as unavailable."
      />
      <Alert className="mb-6 bg-primary/5 text-primary border-primary/20">
        <Info className="h-4 w-4 !text-primary" />
        <AlertTitle>PRODUCTION TODO & Simulation Notice</AlertTitle>
        <AlertDescription>
          This page demonstrates managing global availability. For production, consider if slots should be per-service (requiring a service selector and more complex Firestore structure, e.g., `serviceAvailabilities/{serviceId}/{dateString}`).
          Changes here simulate saving to Firestore and also update the `AVAILABLE_SLOTS` mock constant for prototype-wide reflection.
          Date colors: <span className="font-semibold text-green-600">Green</span> for available, <span className="font-semibold text-red-600">Red</span> for unavailable/no slots (future dates).
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
                className="rounded-md border max-w-xs mx-auto"
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

    
