
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_BOOKINGS, MOCK_BADGES, MOCK_SERVICES } from "@/constants";
import type { Booking, Badge, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AwardIcon } from 'lucide-react';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');

  const completedBookings = useMemo(() => {
    return MOCK_BOOKINGS.filter(booking => booking.status === 'completed');
  }, []);

  const selectedBookingDetails = useMemo(() => {
    return MOCK_BOOKINGS.find(b => b.id === selectedBookingId);
  }, [selectedBookingId]);

  const serviceDetails = useMemo(() => {
    if (!selectedBookingDetails) return null;
    return MOCK_SERVICES.find(s => s.name === selectedBookingDetails.serviceName);
  }, [selectedBookingDetails]);

  const availableBadges = useMemo(() => {
    if (!serviceDetails || !serviceDetails.defaultForce) return MOCK_BADGES;
    return MOCK_BADGES.filter(badge => badge.force === serviceDetails.defaultForce || badge.force === 'General');
  }, [serviceDetails]);

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

    const assignedBadge = MOCK_BADGES.find(b => b.id === selectedBadgeId);

    // Simulate file upload and backend processing
    console.log({
      bookingId: selectedBookingId,
      fileName: reportFile.name,
      fileSize: reportFile.size,
      comments,
      assignedBadge: assignedBadge ? assignedBadge.name : 'None',
    });

    // Simulate updating user profile with badge (in a real app, this is a backend call)
    if (assignedBadge && selectedBookingDetails) {
        // This is a mock update. In a real app, you'd update a user profile in the DB.
        // For demonstration, we'll store this in localStorage to be picked up by the profile page.
        const userEmail = selectedBookingDetails.userEmail;
        const mockUserProfileKey = `mockUserProfile_${userEmail}`;
        let userProfile = JSON.parse(localStorage.getItem(mockUserProfileKey) || '{}');
        if (!userProfile.awardedBadges) userProfile.awardedBadges = [];
        // Avoid duplicate badges for demo
        if (!userProfile.awardedBadges.find((b: Badge) => b.id === assignedBadge.id)) {
            userProfile.awardedBadges.push(assignedBadge);
        }
        localStorage.setItem(mockUserProfileKey, JSON.stringify(userProfile));
        console.log(`Assigned badge "${assignedBadge.name}" to user ${selectedBookingDetails.userName} (simulated)`);
    }
    
    toast({
      title: "Report Uploaded & Feedback Processed",
      description: `Report for booking ID ${selectedBookingId} has been uploaded. ${assignedBadge ? `Badge "${assignedBadge.name}" assigned.` : ''}`,
    });
    
    // Reset form
    setSelectedBookingId('');
    setReportFile(null);
    setComments('');
    setSelectedBadgeId('');
    const fileInput = document.getElementById('reportFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <>
      <PageHeader
        title="Upload Feedback Report & Assign Badge"
        description="Upload PDF feedback reports for completed booking sessions and optionally assign an achievement badge."
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Process Completed Session</CardTitle>
          <CardDescription>Select a booking, upload the report, and assign a badge if applicable.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bookingSelect">Select Booking</Label>
              <Select value={selectedBookingId} onValueChange={(value) => {setSelectedBookingId(value); setSelectedBadgeId('');}}>
                <SelectTrigger id="bookingSelect">
                  <SelectValue placeholder="Choose a completed booking..." />
                </SelectTrigger>
                <SelectContent>
                  {completedBookings.length > 0 ? completedBookings.map(booking => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.userName} - {booking.serviceName} ({new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})
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
            
            {selectedBookingId && (
                <div className="space-y-2">
                <Label htmlFor="badgeSelect">Assign Badge (Optional)</Label>
                <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                    <SelectTrigger id="badgeSelect">
                    <SelectValue placeholder="Choose a badge to assign..." />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="no-badge-placeholder">No Badge</SelectItem>
                    {availableBadges.map(badge => (
                        <SelectItem key={badge.id} value={badge.id}>
                         {badge.force !== "General" && <span className='text-xs text-muted-foreground mr-1'>[{badge.force}]</span>} {badge.name} - {badge.rankName}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            )}

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!selectedBookingId || !reportFile || (selectedBadgeId === "no-badge-placeholder" && !MOCK_BADGES.find(b => b.id === selectedBadgeId))}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Report & Assign Badge
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

