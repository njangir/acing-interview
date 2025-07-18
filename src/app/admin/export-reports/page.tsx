
'use client';

import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCloud } from 'lucide-react';
import { bookingService, serviceService } from '@/lib/firebase-services';
import { useEffect, useState } from 'react';

export default function AdminExportReportsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [bookingsData, servicesData] = await Promise.all([
          bookingService.getAllBookings(),
          serviceService.getAllServices(),
        ]);
        setBookings(bookingsData);
        setServices(servicesData);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
    const reportData = bookings.map((booking: any) => ({
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
    const reportData = bookings.map((booking: any) => {
      const service = services.find((s: any) => s.id === booking.serviceId);
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
        userFeedback: booking.userFeedback || null,
        detailedMentorFeedback: booking.detailedFeedback || null,
      };
    });
    downloadJSON(reportData, 'sales_with_feedback_report.json');
  };

  const handleExportUserData = () => {
    const users: Record<string, { userName: string, email: string, bookings: number, firstBookingDate?: string, lastBookingDate?: string }> = {};
    const sortedBookings = [...bookings].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedBookings.forEach(booking => {
      if (!users[booking.userEmail]) {
        users[booking.userEmail] = {
          userName: booking.userName,
          email: booking.userEmail,
          bookings: 0,
          firstBookingDate: booking.date,
          lastBookingDate: booking.date,
        };
      }
      users[booking.userEmail].bookings += 1;
      users[booking.userEmail].lastBookingDate = booking.date;
    });
    downloadJSON(Object.values(users), 'user_data_report.json');
  };

  if (loading) {
    return <div className="container py-12 flex items-center justify-center">Loading reports...</div>;
  }

  return (
    <>
      <PageHeader
        title="Export Reports"
        description="Download various reports in JSON format for analysis and record-keeping. Feedback data is now included."
      />
      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> Session Schedules & Feedback</CardTitle>
            <CardDescription>Export a list of all booked sessions with their details and any submitted feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportSessionSchedules} className="w-full">Export Session Schedules (JSON)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> Sales Report with Feedback</CardTitle>
            <CardDescription>Export a detailed report of sales, including payment status, transaction IDs, and any submitted feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportSalesReport} className="w-full">Export Sales Report (JSON)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> User Data Report</CardTitle>
            <CardDescription>Export a list of users, their contact info, booking count, and first/last booking dates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportUserData} className="w-full">Export User Data (JSON)</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


    