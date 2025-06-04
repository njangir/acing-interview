
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_BOOKINGS, MOCK_SERVICES, MOCK_RESOURCES, PREDEFINED_AVATARS } from "@/constants";
import type { Resource as ResourceType, UserProfile, Badge as BadgeType, Booking } from '@/types';
import { BookingCard } from "@/components/core/booking-card";
import Link from "next/link";
import Image from 'next/image';
import { CalendarCheck, BookOpen, Edit, Award, Star, TrendingUp } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { WeeklyScheduleView } from '@/components/core/weekly-schedule-view';
import { UserSkillsChart } from '@/components/core/user-skills-chart';


const getPurchasedServiceIds = (): string[] => {
  return [MOCK_SERVICES[0]?.id, MOCK_SERVICES[1]?.id, 'general'].filter(Boolean) as string[];
};


export default function DashboardOverviewPage() {
  const { currentUser } = useAuth();
  const [latestBadge, setLatestBadge] = useState<BadgeType | null>(null);
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      const mockUserProfileKey = `mockUserProfile_${currentUser.email}`;
      const storedProfile = localStorage.getItem(mockUserProfileKey);
      if (storedProfile) {
        try {
          const parsedProfile: UserProfile = JSON.parse(storedProfile);
          setUserProfileData(parsedProfile); // Store the full profile
          if (parsedProfile.awardedBadges && parsedProfile.awardedBadges.length > 0) {
            setLatestBadge(parsedProfile.awardedBadges[parsedProfile.awardedBadges.length - 1]);
          }
        } catch (error) {
          console.error("Error parsing user profile for badges:", error);
        }
      } else {
        // Fallback to currentUser from auth context if no specific profile in localStorage
         setUserProfileData({
            name: currentUser.name,
            email: currentUser.email,
            phone: '', // Placeholder or fetch if available
            imageUrl: currentUser.imageUrl || PREDEFINED_AVATARS[0].url,
            awardedBadges: []
        });
      }
    }
  }, [currentUser]);

  const userBookings = useMemo(() => {
    if (!currentUser) return [];
    return MOCK_BOOKINGS.filter(b => b.userEmail === currentUser.email);
  }, [currentUser]);

  const upcomingBookings = useMemo(() => {
    return userBookings.filter(b => b.status === 'upcoming' || b.status === 'pending_approval' || b.status === 'scheduled' || b.status === 'accepted');
  }, [userBookings]);
  
  const completedBookingsWithFeedback = useMemo(() => {
    return userBookings.filter(
      (booking): booking is Booking & { detailedFeedback: NonNullable<Booking['detailedFeedback']> } =>
        booking.status === 'completed' && Array.isArray(booking.detailedFeedback) && booking.detailedFeedback.length > 0
    );
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
        title={`Reporting for duty, Officer Candidate ${currentUser?.name?.split(' ')[0] || 'User'}!`}
        description="Review your mission objectives, access training materials, and track your progress."
      />
      <div className="space-y-8">

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow xl:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Briefings</CardTitle>
              <CalendarCheck className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{upcomingBookings.length}</div>
              <p className="text-xs text-muted-foreground">sessions scheduled</p>
            </CardContent>
          </Card>
          <Card className="shadow xl:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Manuals</CardTitle>
              <BookOpen className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{accessibleResourcesCount}</div>
              <p className="text-xs text-muted-foreground">intel resources accessible</p>
            </CardContent>
          </Card>
           <Card className="shadow xl:col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Dossier</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                <Image
                    src={userProfileData?.imageUrl || currentUser?.imageUrl || PREDEFINED_AVATARS[0].url}
                    alt={userProfileData?.name || currentUser?.name || "User Avatar"}
                    width={60}
                    height={60}
                    className="rounded-full mb-2 border-2 border-primary"
                    data-ai-hint="user avatar"
                />
                <p className="text-md font-semibold text-primary">{userProfileData?.name || currentUser?.name || 'User Name'}</p>
               <Link href="/dashboard/profile" className="text-xs text-muted-foreground hover:text-primary flex items-center mt-1">
                Update Dossier <Edit className="ml-1 h-3 w-3"/>
              </Link>
            </CardContent>
          </Card>
          <Card className="shadow xl:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Commendation</CardTitle>
              <Award className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                {latestBadge ? (
                    <>
                        <Image
                            src={latestBadge.imageUrl}
                            alt={latestBadge.name}
                            width={60}
                            height={60}
                            className="rounded-md mb-2 border-2 border-accent"
                            data-ai-hint={latestBadge.dataAiHint}
                        />
                        <p className="text-md font-semibold text-primary truncate max-w-[150px]" title={latestBadge.name}>{latestBadge.name}</p>
                        <Link href="/dashboard/profile" className="text-xs text-muted-foreground hover:text-primary mt-1">
                            View All Commendations
                        </Link>
                    </>
                ) : (
                    <>
                        <Star className="h-10 w-10 text-muted-foreground/50 my-3" />
                        <p className="text-xs text-muted-foreground">No commendations earned yet. Keep it up!</p>
                    </>
                )}
            </CardContent>
          </Card>
        </div>

        {currentUser && (
          <WeeklyScheduleView
            allBookings={MOCK_BOOKINGS}
            currentUserEmail={currentUser.email}
            title="My Weekly Ops Schedule"
          />
        )}

        {currentUser && (
          <div className="mt-8">
            <UserSkillsChart completedBookingsWithFeedback={completedBookingsWithFeedback} />
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4 font-headline text-primary mt-8">Next Debriefing Session</h2>
          {upcomingBookings.length > 0 ? (
            <BookingCard booking={upcomingBookings.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No upcoming debriefings.</p>
                <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/services">Schedule a Session</Link>
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
                <CardTitle className="text-lg font-headline text-primary/90">Access {recentService.name} Intel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access exclusive materials related to your recent training.
                </p>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                        <Link href={`/dashboard/resources?service=${recentService.id}`}>Go to Training Materials</Link>
                    </Button>
                    <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link href={`/book/${recentService.id}/slots`}>Re-engage: {recentService.name}</Link>
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
