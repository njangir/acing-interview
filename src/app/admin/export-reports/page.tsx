
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking, Service, UserProfile } from '@/types';
import { DownloadCloud, Loader2, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminExportReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [bookingsSnap, servicesSnap, profilesSnap] = await Promise.all([
          getDocs(collection(db, 'bookings')),
          getDocs(collection(db, 'services')),
          getDocs(collection(db, 'userProfiles'))
        ]);
        
        setBookings(bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
        setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
        setUserProfiles(profilesSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));

      } catch (err) {
        console.error("Error fetching data for reports:", err);
        setError("Could not load data required for reports. Please check your connection and Firestore security rules.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const downloadJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSessionSchedules = () => {
    const reportData = bookings.map(booking => ({
      bookingId: booking.id,
      serviceName: booking.serviceName,
      date: booking.date,
      time: booking.time,
      userName: booking.userName,
      userEmail: booking.userEmail,
      meetingLink: booking.meetingLink,
      status: booking.status,
      userFeedback: booking.userFeedback || null,
      detailedMentorFeedback: booking.detailedFeedback || null,
    }));
    downloadJSON(reportData, 'session_schedules_with_feedback_report.json');
  };

  const handleExportSalesReport = () => {
    const reportData = bookings.map(booking => {
      const service = services.find(s => s.id === booking.serviceId);
      return {
        bookingId: booking.id,
        serviceName: booking.serviceName,
        userName: booking.userName,
        userEmail: booking.userEmail,
        date: booking.date,
        time: booking.time,
        pricePaid: booking.paymentStatus === 'paid' ? service?.price || 0 : 0,
        paymentStatus: booking.paymentStatus,
        transactionId: booking.transactionId || 'N/A',
        status: booking.status,
      };
    });
    downloadJSON(reportData, 'sales_report.json');
  };

  const handleExportUserData = () => {
    downloadJSON(userProfiles, 'user_data_report.json');
  };
  
  if (isLoading) {
    return (
      <>
        <PageHeader title="Export Reports" description="Download various reports in JSON format for analysis and record-keeping." />
        <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Loading report data...</p>
        </div>
      </>
    );
  }
  
  if (error) {
     return (
       <>
        <PageHeader title="Export Reports" description="Download various reports in JSON format for analysis and record-keeping." />
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
       </>
    );
  }


  return (
    <>
      <PageHeader
        title="Export Reports"
        description="Download various reports in JSON format for analysis and record-keeping."
      />
      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> Session Schedules</CardTitle>
            <CardDescription>Export a list of all booked sessions with their details and any submitted feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportSessionSchedules} className="w-full">Export Session Schedules (JSON)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> Sales Report</CardTitle>
            <CardDescription>Export a detailed report of sales, including payment status and transaction IDs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportSalesReport} className="w-full">Export Sales Report (JSON)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> User Data Report</CardTitle>
            <CardDescription>Export a list of all user profiles created in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportUserData} className="w-full">Export User Profiles (JSON)</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
