
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Resource as ResourceType, UserProfile, Badge as BadgeType, Booking } from '@/types';
import { BookingCard } from "@/components/core/booking-card";
import Link from "next/link";
import Image from 'next/image';
import { CalendarCheck, BookOpen, Edit, Award, Star, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { WeeklyScheduleView } from '@/components/core/weekly-schedule-view';
import { UserSkillsChart } from '@/components/core/user-skills-chart';
import { PREDEFINED_AVATARS } from '@/constants';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';


export default function DashboardOverviewPage() {
  const { currentUser, loadingAuth } = useAuth();
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [accessibleResources, setAccessibleResources] = useState<ResourceType[]>([]);
  const [latestBadge, setLatestBadge] = useState<BadgeType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loadingAuth) {
      setIsLoading(true);
      return;
    }
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch User Profile and Badges
        const profileDocRef = doc(db, "userProfiles", currentUser.uid);
        const profileSnap = await getDoc(profileDocRef);
        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as UserProfile;
          if (profileData.awardedBadgeIds && profileData.awardedBadgeIds.length > 0) {
            const lastBadgeId = profileData.awardedBadgeIds[profileData.awardedBadgeIds.length - 1];
            const badgeDocRef = doc(db, 'badges', lastBadgeId);
            const badgeSnap = await getDoc(badgeDocRef);
            if(badgeSnap.exists()){
                setLatestBadge({ id: badgeSnap.id, ...badgeSnap.data() } as BadgeType);
            }
          }
          setUserProfileData(profileData);
        }

        // Fetch User Bookings
        const bookingsQuery = query(collection(db, 'bookings'), where('uid', '==', currentUser.uid), limit(50));
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookingsData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setUserBookings(bookingsData);

        // Fetch Accessible Resources
        const paidServiceIds = ['general'];
        bookingsData.forEach(booking => {
          if (booking.paymentStatus === 'paid') {
            paidServiceIds.push(booking.serviceId);
          }
        });
        const uniqueServiceIds = [...new Set(paidServiceIds)];

        if (uniqueServiceIds.length > 0) {
          const resourcesQuery = query(collection(db, 'resources'), where('serviceCategory', 'in', uniqueServiceIds));
          const resourcesSnap = await getDocs(resourcesQuery);
          setAccessibleResources(resourcesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceType)));
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, loadingAuth]);


  const upcomingBookings = useMemo(() => {
    return userBookings.filter(b => ['pending_approval', 'accepted', 'scheduled'].includes(b.status));
  }, [userBookings]);
  
  const completedBookingsWithFeedback = useMemo(() => {
    return userBookings.filter(
      (booking): booking is Booking & { detailedFeedback: NonNullable<Booking['detailedFeedback']> } =>
        booking.status === 'completed' && Array.isArray(booking.detailedFeedback) && booking.detailedFeedback.length > 0
    );
  }, [userBookings]);


  if (isLoading || loadingAuth) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            <span className="ml-2">Loading Dashboard...</span>
        </div>
    );
  }

  if (!currentUser) {
    return <div>Please log in to view your dashboard.</div>;
  }

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
              <div className="text-2xl font-bold text-primary">{accessibleResources.length}</div>
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
            allBookings={userBookings}
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
      </div>
    </>
  );
}
