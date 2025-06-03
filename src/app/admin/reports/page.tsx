
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_BOOKINGS } from "@/constants";
import type { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');

  const completedBookings = useMemo(() => {
    return MOCK_BOOKINGS.filter(booking => booking.status === 'completed');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !reportFile) {
      toast({
        title: "Missing Information",
        description: "Please select a booking and upload a report file.",
        variant: "destructive",
      });
      return;
    }

    // Simulate file upload and backend processing
    console.log({
      bookingId: selectedBookingId,
      fileName: reportFile.name,
      fileSize: reportFile.size,
      comments,
    });

    toast({
      title: "Report Uploaded",
      description: `Report for booking ID ${selectedBookingId} has been uploaded with comments.`,
    });
    
    // Reset form
    setSelectedBookingId('');
    setReportFile(null);
    setComments('');
    // Clear file input visually (though programmatically clearing value is tricky)
    const fileInput = document.getElementById('reportFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <>
      <PageHeader
        title="Upload Feedback Report"
        description="Upload PDF feedback reports for completed booking sessions."
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Report</CardTitle>
          <CardDescription>Select a completed booking and upload the corresponding PDF report.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bookingSelect">Select Booking</Label>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger id="bookingSelect">
                  <SelectValue placeholder="Choose a completed booking..." />
                </SelectTrigger>
                <SelectContent>
                  {completedBookings.length > 0 ? completedBookings.map(booking => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.userName} - {booking.serviceName} ({new Date(booking.date).toLocaleDateString()})
                    </SelectItem>
                  )) : (
                    <SelectItem value="no-bookings" disabled>No completed bookings available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportFile">Report PDF File</Label>
              <Input id="reportFile" type="file" accept=".pdf" onChange={handleFileChange} required />
              {reportFile && <p className="text-xs text-muted-foreground">Selected: {reportFile.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any relevant comments about the report or session..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!selectedBookingId || !reportFile}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Report
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
