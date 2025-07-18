
'use client'; 

import { useMemo, useEffect, useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { BellRing, TrendingUp, MessagesSquare, Star } from "lucide-react";
import { WeeklyScheduleView } from '@/components/core/weekly-schedule-view';
import { bookingService, serviceService, messageService } from '@/lib/firebase-services';

export default function AdminOverviewPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [bookingsData, servicesData, messagesData] = await Promise.all([
          bookingService.getAllBookings(),
          serviceService.getAllServices(),
          messageService.getAllMessages(),
        ]);
        setBookings(bookingsData);
        setServices(servicesData);
        setMessages(messagesData);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const newBookingRequests = useMemo(() => bookings.filter((b: any) => b.status === 'pending_approval').length, [bookings]);
  const totalSales = useMemo(() => bookings.reduce((acc: number, booking: any) => {
    if (booking.paymentStatus === 'paid') {
      const service = services.find((s: any) => s.id === booking.serviceId);
      if (service) {
        return acc + service.price;
      }
    }
    return acc;
  }, 0), [bookings, services]);
  const newMessagesCount = useMemo(() => messages.filter((m: any) => m.status === 'new').length, [messages]);
  const averageRating = "4.7/5 Stars";

  if (loading) {
    return <div className="container py-12 flex items-center justify-center">Loading admin dashboard...</div>;
  }

  return (
    <>
      <PageHeader
        title="Admin Dashboard Overview"
        description="Welcome to the admin panel. Get quick insights and manage your application's operations from here."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Booking Requests</CardTitle>
            <BellRing className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{newBookingRequests}</div>
            <p className="text-xs text-muted-foreground">pending approval</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmed Sales</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from paid bookings</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New User Messages</CardTitle>
            <MessagesSquare className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{newMessagesCount}</div>
            <p className="text-xs text-muted-foreground">unread messages</p>
          </CardContent>
        </Card>
        <Card className="shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average User Rating</CardTitle>
            <Star className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{averageRating}</div>
            <p className="text-xs text-muted-foreground">(Placeholder)</p>
          </CardContent>
        </Card>
      </div>
      <WeeklyScheduleView
        allBookings={bookings}
        title="Admin - Weekly Bookings Overview"
        showUserName={true}
      />
    </>
  );
}
