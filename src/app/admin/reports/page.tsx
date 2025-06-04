
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_BOOKINGS, MOCK_BADGES, MOCK_SERVICES, PREDEFINED_SKILLS, SKILL_RATINGS } from "@/constants";
import type { Booking, Badge as BadgeType, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AwardIcon, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [skillRatingsData, setSkillRatingsData] = useState<Record<string, string>>({});

  const completedBookings = useMemo(() => {
    return MOCK_BOOKINGS.filter(booking => booking.status === 'completed');
  }, []); // MOCK_BOOKINGS is stable for this page load for filtering 'completed'

  const selectedBookingDetails = useMemo(() => {
    return MOCK_BOOKINGS.find(b => b.id === selectedBookingId);
  }, [selectedBookingId]);

  const serviceDetails = useMemo(() => {
    if (!selectedBookingDetails) return null;
    return MOCK_SERVICES.find(s => s.id === selectedBookingDetails.serviceId);
  }, [selectedBookingDetails]);

  const availableBadges = useMemo(() => {
    // MOCK_BADGES might be mutated by another admin page, so this should reflect current state
    if (!serviceDetails || !serviceDetails.defaultForce) return MOCK_BADGES;
    return MOCK_BADGES.filter(badge => badge.force === serviceDetails.defaultForce || badge.force === 'General');
  }, [serviceDetails]);

  useEffect(() => {
    if (selectedBookingDetails?.detailedFeedback) {
      const initialRatings: Record<string, string> = {};
      selectedBookingDetails.detailedFeedback.forEach(fb => {
        initialRatings[fb.skill] = fb.rating;
      });
      setSkillRatingsData(initialRatings);
    } else {
      setSkillRatingsData({});
    }
  }, [selectedBookingDetails]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleSkillRatingChange = (skillName: string, rating: string) => {
    setSkillRatingsData(prev => ({ ...prev, [skillName]: rating }));
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
    const feedbackToSave = PREDEFINED_SKILLS.map(skill => ({
      skill,
      rating: skillRatingsData[skill] || 'Not Rated', // Default if not rated
    }));

    console.log({
      bookingId: selectedBookingId,
      fileName: reportFile.name,
      fileSize: reportFile.size,
      comments,
      assignedBadge: assignedBadge ? assignedBadge.name : 'None',
      detailedFeedback: feedbackToSave,
    });

    // Simulate updating the booking in MOCK_BOOKINGS
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === selectedBookingId);
    if (bookingIndex > -1) {
      MOCK_BOOKINGS[bookingIndex].detailedFeedback = feedbackToSave;
      // Simulate report URL update
      MOCK_BOOKINGS[bookingIndex].reportUrl = `/resources/mock_feedback_${selectedBookingId}.pdf`;
    }

    if (assignedBadge && selectedBookingDetails) {
        const userEmail = selectedBookingDetails.userEmail;
        const mockUserProfileKey = `mockUserProfile_${userEmail}`;
        let userProfile = JSON.parse(localStorage.getItem(mockUserProfileKey) || '{}');
        if (!userProfile.awardedBadges) userProfile.awardedBadges = [];
        if (!userProfile.awardedBadges.find((b: BadgeType) => b.id === assignedBadge.id)) {
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
    setSkillRatingsData({});
    const fileInput = document.getElementById('reportFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <>
      <PageHeader
        title="Upload Feedback Report & Assign Badge"
        description="Upload PDF feedback reports for completed booking sessions, provide skill ratings, and optionally assign an achievement badge."
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Process Completed Session</CardTitle>
          <CardDescription>Select a booking, upload the report, rate skills, and assign a badge if applicable.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bookingSelect">Select Booking</Label>
              <Select value={selectedBookingId} onValueChange={(value) => {setSelectedBookingId(value); setSelectedBadgeId(''); setSkillRatingsData({});}}>
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
            
            {selectedBookingId && (
              <>
                <Card className="p-4 bg-muted/20">
                  <CardTitle className="text-lg mb-3 font-headline text-primary flex items-center">
                    <Star className="mr-2 h-5 w-5 text-accent" /> Skill Ratings
                  </CardTitle>
                  <ScrollArea className="h-[250px] pr-3 custom-scrollbar">
                    <div className="space-y-4">
                    {PREDEFINED_SKILLS.map(skill => (
                      <div key={skill} className="space-y-1">
                        <Label htmlFor={`skill-${skill.replace(/\s+/g, '-')}`}>{skill}</Label>
                        <Select
                          value={skillRatingsData[skill] || ''}
                          onValueChange={(value) => handleSkillRatingChange(skill, value)}
                        >
                          <SelectTrigger id={`skill-${skill.replace(/\s+/g, '-')}`}>
                            <SelectValue placeholder="Rate skill..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_RATINGS.map(rating => (
                              <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    </div>
                  </ScrollArea>
                </Card>

                <div className="space-y-2">
                    <Label htmlFor="comments">Overall Comments (Optional)</Label>
                    <Textarea
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any general comments about the report or session..."
                    />
                </div>
                
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
              </>
            )}

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!selectedBookingId || !reportFile}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Report, Save Feedback & Assign Badge
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
