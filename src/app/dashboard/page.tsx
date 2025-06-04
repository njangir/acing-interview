
'use client';

import { useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_BOOKINGS, MOCK_SERVICES, MOCK_RESOURCES } from "@/constants";
import type { Resource as ResourceType } from '@/types';
import { BookingCard } from "@/components/core/booking-card";
import Link from "next/link";
import { CalendarCheck, BookOpen, UserCircle, Edit } from "lucide-react";
import { useAuth } from '@/hooks/use-auth'; 
import { WeeklyScheduleView } from '@/components/core/weekly-schedule-view'; // Added import


const getPurchasedServiceIds = (): string[] => {
  return [MOCK_SERVICES[0]?.id, MOCK_SERVICES[1]?.id, 'general'].filter(Boolean) as string[];
};


export default function DashboardOverviewPage() {
  const { currentUser } = useAuth();

  const userBookings = useMemo(() => {
    if (!currentUser) return [];
    return MOCK_BOOKINGS.filter(b => b.userEmail === currentUser.email);
  }, [currentUser]);

  const upcomingBookings = useMemo(() => {
    return userBookings.filter(b => b.status === 'upcoming' || b.status === 'pending_approval');
  }, [userBookings]);

  const recentService = MOCK_SERVICES[0]; 

  const accessibleResourcesCount = useMemo(() => {
    const purchasedServiceIds = getPurchasedServiceIds();
    const filtered = MOCK_RESOURCES.filter(resource =>
      purchasedServiceIds.includes(resource.serviceCategory)
    );
    return filtered.length;
  }, []);


  return (
    <>
      <PageHeader
        title={`Welcome back, ${currentUser?.name?.split(' ')[0] || 'User'}!`}
        description="Manage your bookings, access resources, and track your progress."
      />
      <div className="space-y-8">
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
              <CalendarCheck className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{upcomingBookings.length}</div>
              <p className="text-xs text-muted-foreground">sessions scheduled</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources Available</CardTitle>
              <BookOpen className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{accessibleResourcesCount}</div>
              <p className="text-xs text-muted-foreground">premium resources accessible</p>
            </CardContent>
          </Card>
           <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <UserCircle className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Complete</div>
               <Link href="/dashboard/profile" className="text-xs text-muted-foreground hover:text-primary flex items-center">
                View/Edit Profile <Edit className="ml-1 h-3 w-3"/>
              </Link>
            </CardContent>
          </Card>
        </div>

        {currentUser && (
          <WeeklyScheduleView
            allBookings={MOCK_BOOKINGS}
            currentUserEmail={currentUser.email}
            title="My Weekly Schedule"
          />
        )}

        
        <div>
          <h2 className="text-2xl font-semibold mb-4 font-headline text-primary mt-8">Next Upcoming Session</h2>
          {upcomingBookings.length > 0 ? (
            <BookingCard booking={upcomingBookings.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No upcoming bookings.</p>
                <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/services">Book a New Session</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        
        {recentService && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 font-headline text-primary mt-8">Quick Actions</h2>
            <Card className="shadow">
              <CardHeader>
                <CardTitle className="text-lg font-headline text-primary/90">Explore {recentService.name} Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access exclusive materials related to your recent service.
                </p>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                        <Link href={`/dashboard/resources?service=${recentService.id}`}>Go to Resources</Link>
                    </Button>
                    <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link href={`/book/${recentService.id}/slots`}>Book {recentService.name} Again</Link>
                    </Button>
                 </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
