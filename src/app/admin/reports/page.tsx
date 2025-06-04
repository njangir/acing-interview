
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_BOOKINGS, MOCK_BADGES, MOCK_SERVICES, PREDEFINED_SKILLS, SKILL_RATINGS, SKILL_RATING_VALUES, MAX_SKILL_RATING_VALUE } from "@/constants";
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
  const [currentUserAverageSkills, setCurrentUserAverageSkills] = useState<Record<string, { averageRatingValue: number; ratingCount: number }>>({});

  const completedBookings = useMemo(() => {
    return MOCK_BOOKINGS.filter(booking => booking.status === 'completed');
  }, []);

  const selectedBookingDetails = useMemo(() => {
    return MOCK_BOOKINGS.find(b => b.id === selectedBookingId);
  }, [selectedBookingId]);

  const serviceDetails = useMemo(() => {
    if (!selectedBookingDetails) return null;
    return MOCK_SERVICES.find(s => s.id === selectedBookingDetails.serviceId);
  }, [selectedBookingDetails]);

  const availableBadges = useMemo(() => {
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

    // Calculate current average skills for the selected user
    if (selectedBookingDetails?.userEmail) {
      const userEmail = selectedBookingDetails.userEmail;
      // Consider all bookings of the user that are completed and have feedback,
      // *excluding* the current one IF we are only setting initial values.
      // For displaying context, we want the average *before* this session's potential new feedback.
      const userPreviousCompletedBookingsWithFeedback = MOCK_BOOKINGS.filter(
        b => b.userEmail === userEmail &&
             b.status === 'completed' &&
             b.id !== selectedBookingDetails.id && // Exclude current booking for "prior average"
             b.detailedFeedback && b.detailedFeedback.length > 0
      );

      const averages: Record<string, { totalRating: number; count: number }> = {};
      PREDEFINED_SKILLS.forEach(skill => {
        averages[skill] = { totalRating: 0, count: 0 };
      });

      userPreviousCompletedBookingsWithFeedback.forEach(booking => {
        booking.detailedFeedback?.forEach(fb => {
          if (PREDEFINED_SKILLS.includes(fb.skill) && SKILL_RATING_VALUES[fb.rating]) {
            averages[fb.skill].totalRating += SKILL_RATING_VALUES[fb.rating];
            averages[fb.skill].count++;
          }
        });
      });
      
      // If the current selected booking already has feedback (i.e., admin is viewing/editing it),
      // include its ratings in the "current average" context as well.
      if (selectedBookingDetails.detailedFeedback && selectedBookingDetails.detailedFeedback.length > 0) {
          selectedBookingDetails.detailedFeedback.forEach(fb => {
              if (PREDEFINED_SKILLS.includes(fb.skill) && SKILL_RATING_VALUES[fb.rating]) {
                // This logic can be tricky: if we are "editing" feedback, we want average of others.
                // If viewing before "first submission" for this session, this block shouldn't add.
                // For now, to show "current state", include this session's saved feedback.
                // A more precise "average of OTHERS" would filter out selectedBookingDetails.id always.
                // Let's calculate average of all *other* sessions.
                // The logic above (userPreviousCompletedBookingsWithFeedback) already excludes current one.
              }
          });
      }


      const calculatedAverages: Record<string, { averageRatingValue: number; ratingCount: number }> = {};
      PREDEFINED_SKILLS.forEach(skill => {
        calculatedAverages[skill] = {
          averageRatingValue: averages[skill].count > 0 ? parseFloat((averages[skill].totalRating / averages[skill].count).toFixed(1)) : 0,
          ratingCount: averages[skill].count
        };
      });
      setCurrentUserAverageSkills(calculatedAverages);

    } else {
      setCurrentUserAverageSkills({});
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
    if (!selectedBookingId) {
      toast({
        title: "Missing Information",
        description: "Please select a booking.",
        variant: "destructive",
      });
      return;
    }
     if (!reportFile && !selectedBookingDetails?.reportUrl) { // Require file if no report exists
      toast({
        title: "Missing Report",
        description: "Please upload a report PDF file or ensure one is already linked.",
        variant: "destructive",
      });
      return;
    }


    const assignedBadge = MOCK_BADGES.find(b => b.id === selectedBadgeId);
    const feedbackToSave = PREDEFINED_SKILLS.map(skill => ({
      skill,
      rating: skillRatingsData[skill] || 'Satisfactory', // Default if not rated, or handle as error
      comments: '', // Add UI for per-skill comments if needed
    }));

    console.log({
      bookingId: selectedBookingId,
      fileName: reportFile?.name,
      fileSize: reportFile?.size,
      comments,
      assignedBadge: assignedBadge ? assignedBadge.name : 'None',
      detailedFeedback: feedbackToSave,
    });

    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === selectedBookingId);
    if (bookingIndex > -1) {
      MOCK_BOOKINGS[bookingIndex].detailedFeedback = feedbackToSave;
      if (reportFile) {
        MOCK_BOOKINGS[bookingIndex].reportUrl = `/resources/mock_feedback_${selectedBookingId}_${reportFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}.pdf`;
      }
      MOCK_BOOKINGS[bookingIndex].userFeedback = comments; // Save overall comments
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
      title: "Feedback Processed",
      description: `Feedback for booking ID ${selectedBookingId} has been saved. ${reportFile ? 'Report uploaded.': ''} ${assignedBadge ? `Badge "${assignedBadge.name}" assigned.` : ''}`,
    });
    
    setSelectedBookingId('');
    setReportFile(null);
    setComments('');
    setSelectedBadgeId('');
    setSkillRatingsData({});
    setCurrentUserAverageSkills({});
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
              <Select value={selectedBookingId} onValueChange={(value) => {
                setSelectedBookingId(value); 
                setSelectedBadgeId(''); 
                setSkillRatingsData({});
                setComments(MOCK_BOOKINGS.find(b => b.id === value)?.userFeedback || '');
                setReportFile(null); // Reset file input when booking changes
                const fileInput = document.getElementById('reportFile') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}>
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
              <Input id="reportFile" type="file" accept=".pdf" onChange={handleFileChange} />
              {reportFile && <p className="text-xs text-muted-foreground">Selected: {reportFile.name}</p>}
              {!reportFile && selectedBookingDetails?.reportUrl && <p className="text-xs text-muted-foreground">Current report: <a href={selectedBookingDetails.reportUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{selectedBookingDetails.reportUrl.split('/').pop()}</a> (Upload new to replace)</p>}
            </div>
            
            {selectedBookingId && (
              <>
                <Card className="p-4 bg-muted/20">
                  <CardTitle className="text-lg mb-3 font-headline text-primary flex items-center">
                    <Star className="mr-2 h-5 w-5 text-accent" /> Skill Ratings (for this session)
                  </CardTitle>
                  <ScrollArea className="h-[250px] pr-3 custom-scrollbar">
                    <div className="space-y-4">
                    {PREDEFINED_SKILLS.map(skill => {
                      const currentAvg = currentUserAverageSkills[skill];
                      const avgDisplay = currentAvg && currentAvg.ratingCount > 0
                        ? `(Prior Avg: ${currentAvg.averageRatingValue}/${MAX_SKILL_RATING_VALUE})`
                        : `(No prior ratings)`;
                      
                      return (
                        <div key={skill} className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <Label htmlFor={`skill-${skill.replace(/\s+/g, '-')}`}>{skill}</Label>
                            <span className="text-xs text-muted-foreground ml-2">{avgDisplay}</span>
                          </div>
                          <Select
                            value={skillRatingsData[skill] || ''}
                            onValueChange={(value) => handleSkillRatingChange(skill, value)}
                          >
                            <SelectTrigger id={`skill-${skill.replace(/\s+/g, '-')}`}>
                              <SelectValue placeholder="Rate skill for this session..." />
                            </SelectTrigger>
                            <SelectContent>
                              {SKILL_RATINGS.map(rating => (
                                <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                    </div>
                  </ScrollArea>
                </Card>

                <div className="space-y-2">
                    <Label htmlFor="comments">Overall Comments (for this session)</Label>
                    <Textarea
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any general comments about the report or session..."
                        rows={3}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="badgeSelect">Assign Badge (Optional)</Label>
                    <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                        <SelectTrigger id="badgeSelect">
                        <SelectValue placeholder="Choose a badge to assign..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="">No Badge</SelectItem> {/* Changed placeholder value to empty string */}
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
            <Button type="submit" className="w-full" disabled={!selectedBookingId}>
              <UploadCloud className="mr-2 h-4 w-4" /> Save Feedback & {reportFile ? "Upload Report" : "Update Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

