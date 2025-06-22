
'use client';

import type { Booking } from '@/types';
import { useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parse,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface WeeklyScheduleViewProps {
  allBookings: Booking[];
  currentUserEmail?: string; // If provided, filters for this user
  title: string;
  showUserName?: boolean; // For admin view, to show which user booked
}

export function WeeklyScheduleView({
  allBookings,
  currentUserEmail,
  title,
  showUserName = false,
}: WeeklyScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // Monday

  const start = startOfWeek(currentDate, { weekStartsOn });
  const end = endOfWeek(currentDate, { weekStartsOn });
  const daysOfWeek = eachDayOfInterval({ start, end });

  const bookingsToDisplay = currentUserEmail
    ? allBookings.filter((b) => b.userEmail === currentUserEmail)
    : allBookings;

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <CalendarDays className="mr-2 h-6 w-6" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button aria-label="Previous Week" variant="outline" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button aria-label="Next Week" variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Displaying: {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {daysOfWeek.map((day) => {
            const dailyBookings = bookingsToDisplay
              .filter((booking) => {
                const bookingDateObj = parse(booking.date, 'yyyy-MM-dd', new Date());
                return isSameDay(bookingDateObj, day) && (booking.status === 'upcoming' || booking.status === 'pending_approval');
              })
              .sort((a, b) => {
                const parseTime = (timeStr: string) => {
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier === 'PM' && hours < 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0; 
                    return hours * 60 + minutes;
                };
                return parseTime(a.time) - parseTime(b.time);
              });

            return (
              <div key={day.toISOString()} className="bg-background p-2 min-h-[150px] flex flex-col">
                <p className="font-semibold text-xs sm:text-sm text-center mb-2">
                  {format(day, 'EEE')}
                  <span className="block text-xs text-muted-foreground">{format(day, 'd')}</span>
                </p>
                <div className="space-y-1.5 overflow-y-auto flex-grow custom-scrollbar pr-1">
                  {dailyBookings.length > 0 ? (
                    dailyBookings.map((booking) => (
                      <Link 
                        key={booking.id} 
                        href={currentUserEmail ? `/dashboard/bookings` : `/admin/bookings`} 
                        passHref
                        className="block"
                        title={`${booking.time} - ${booking.serviceName}${showUserName ? ` (${booking.userName})` : ''}`}
                      >
                        <div className={`p-1.5 rounded-md text-xs cursor-pointer hover:opacity-80 transition-opacity
                                       ${booking.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                                                                              : 'bg-primary/10 text-primary border border-primary/20'}`}>
                          <p className="font-medium truncate leading-tight">{booking.time}</p>
                          <p className="truncate leading-tight">{booking.serviceName}</p>
                          {showUserName && <p className="text-xs opacity-80 truncate leading-tight">User: {booking.userName}</p>}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center pt-4">No sessions</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
