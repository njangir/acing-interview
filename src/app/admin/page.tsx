
'use client'; 

import { useState, useEffect } from 'react'; 
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, TrendingUp, MessagesSquare, Star, Loader2, AlertTriangle } from "lucide-react";
import { WeeklyScheduleView } from '@/components/core/weekly-schedule-view';
import type { Booking, Service, UserMessage } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminOverviewPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const queries = [
      { collectionName: 'bookings', setter: setBookings },
      { collectionName: 'services', setter: setServices },
      { collectionName: 'userMessages', setter: setMessages },
    ];
    const unsubs: (() => void)[] = [];
    let active = true;

    Promise.all(queries.map(q => {
      return new Promise<void>((resolve, reject) => {
        const unsub = onSnapshot(
          collection(db, q.collectionName),
          (snapshot) => {
            if (active) {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              q.setter(data as any);
            }
            resolve();
          },
          (err) => {
            console.error(`Error fetching ${q.collectionName}:`, err);
            reject(err);
          }
        );
        unsubs.push(unsub);
      });
    }))
    .then(() => {
      if (active) setIsLoading(false);
    })
    .catch(() => {
      if (active) {
        setError("Failed to load one or more data sources for the dashboard. Please check your connection and security rules.");
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const newBookingRequests = bookings.filter(b => b.status === 'pending_approval').length;
  
  const totalSales = bookings.reduce((acc, booking) => {
    if (booking.paymentStatus === 'paid') {
      const service = services.find(s => s.id === booking.serviceId); 
      if (service) {
        return acc + service.price;
      }
    }
    return acc;
  }, 0);

  const newMessagesCount = messages.filter(m => m.status === 'new' && m.senderType === 'user').length;
  const averageRating = "4.7/5 Stars"; // This remains a placeholder as we don't have a rating system yet.

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
     return (
       <>
        <PageHeader
            title="Admin Dashboard Overview"
            description="Welcome to the admin panel. Get quick insights and manage your application's operations from here."
        />
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
       </>
    );
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
