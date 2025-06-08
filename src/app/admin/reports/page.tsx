
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge as UiBadge } from '@/components/ui/badge';
import { MOCK_BOOKINGS, MOCK_BADGES, MOCK_SERVICES, PREDEFINED_SKILLS, SKILL_RATINGS, SKILL_RATING_VALUES, MAX_SKILL_RATING_VALUE, MOCK_SUBMISSION_HISTORY } from "@/constants";
import type { Booking, Badge as BadgeType, Service, FeedbackSubmissionHistoryEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AwardIcon, Star, History, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const ITEMS_PER_PAGE_HISTORY = 5;

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [skillRatingsData, setSkillRatingsData] = useState<Record<string, string>>({});
  const [currentUserAverageSkills, setCurrentUserAverageSkills] = useState<Record<string, { averageRatingValue: number; ratingCount: number }>>({});

  const [userNameFilter, setUserNameFilter] = useState<string>('');
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);

  // This state will hold the full history and update when MOCK_SUBMISSION_HISTORY changes
  const [fullSubmissionHistory, setFullSubmissionHistory] = useState<FeedbackSubmissionHistoryEntry[]>([]);

  useEffect(() => {
    // Initialize or update fullSubmissionHistory when MOCK_SUBMISSION_HISTORY might change
    // Sort by most recent submission first
    setFullSubmissionHistory([...MOCK_SUBMISSION_HISTORY].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()));
  }, []); // Re-run if MOCK_SUBMISSION_HISTORY reference changes (though it's a const, direct mutation happens)

  const filteredSubmissionHistory = useMemo(() => {
    let filtered = fullSubmissionHistory;
    if (userNameFilter.trim() !== '') {
      filtered = filtered.filter(entry =>
        entry.userName.toLowerCase().includes(userNameFilter.toLowerCase())
      );
    }
    return filtered;
  }, [fullSubmissionHistory, userNameFilter]);


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

    if (selectedBookingDetails?.userEmail) {
      const userEmail = selectedBookingDetails.userEmail;
      const userPreviousCompletedBookingsWithFeedback = MOCK_BOOKINGS.filter(
        b => b.userEmail === userEmail &&
             b.status === 'completed' &&
             b.id !== selectedBookingDetails.id &&
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
    if (!selectedBookingId || !selectedBookingDetails) {
      toast({
        title: "Missing Information",
        description: "Please select a booking.",
        variant: "destructive",
      });
      return;
    }
     if (!reportFile && !selectedBookingDetails?.reportUrl) {
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
      rating: skillRatingsData[skill] || 'Satisfactory', // Default if not rated
      comments: '', // Comments not implemented in this form, but part of type
    }));

    let newReportUrl = selectedBookingDetails.reportUrl;
    if (reportFile) {
      // Simulate a file URL, in a real app this would be an actual URL from a storage service
      newReportUrl = `/resources/mock_feedback_${selectedBookingId}_${reportFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}.pdf`;
    }

    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === selectedBookingId);
    if (bookingIndex > -1) {
      MOCK_BOOKINGS[bookingIndex].detailedFeedback = feedbackToSave;
      if (reportFile) { // Only update if new file is uploaded
         MOCK_BOOKINGS[bookingIndex].reportUrl = newReportUrl;
      }
      MOCK_BOOKINGS[bookingIndex].userFeedback = comments; // Save overall comments
    }

    if (assignedBadge && selectedBookingDetails) {
        const userEmail = selectedBookingDetails.userEmail;
        // Simulate saving awarded badge to user profile (e.g., in localStorage for this mock)
        const mockUserProfileKey = `mockUserProfile_${userEmail}`;
        let userProfile = JSON.parse(localStorage.getItem(mockUserProfileKey) || '{}');
        if (!userProfile.awardedBadges) userProfile.awardedBadges = [];
        // Add badge if not already present
        if (!userProfile.awardedBadges.find((b: BadgeType) => b.id === assignedBadge.id)) {
            userProfile.awardedBadges.push(assignedBadge);
        }
        localStorage.setItem(mockUserProfileKey, JSON.stringify(userProfile));
    }

    const historyEntry: FeedbackSubmissionHistoryEntry = {
      id: `hist-${Date.now()}`,
      submissionDate: new Date().toISOString(),
      bookingId: selectedBookingId,
      userName: selectedBookingDetails.userName,
      serviceName: selectedBookingDetails.serviceName,
      reportFileName: reportFile ? reportFile.name : (selectedBookingDetails.reportUrl ? selectedBookingDetails.reportUrl.split('/').pop() : undefined),
      badgeAssignedName: assignedBadge ? assignedBadge.name : undefined,
    };
    MOCK_SUBMISSION_HISTORY.unshift(historyEntry); // Add to the beginning for most recent first
    setFullSubmissionHistory([...MOCK_SUBMISSION_HISTORY].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())); // Re-sort and update state
    setCurrentHistoryPage(1); // Reset to first page after new submission

    toast({
      title: "Feedback Processed",
      description: `Feedback for booking ID ${selectedBookingId} has been saved. ${reportFile ? 'Report uploaded.': ''} ${assignedBadge ? `Badge "${assignedBadge.name}" assigned.` : ''}`,
    });

    // Reset form fields
    setSelectedBookingId('');
    setReportFile(null);
    setComments('');
    setSelectedBadgeId('');
    setSkillRatingsData({});
    setCurrentUserAverageSkills({});
    const fileInput = document.getElementById('reportFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Pagination for Submission History
  const totalHistoryPages = Math.ceil(filteredSubmissionHistory.length / ITEMS_PER_PAGE_HISTORY);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentHistoryPage - 1) * ITEMS_PER_PAGE_HISTORY;
    const endIndex = startIndex + ITEMS_PER_PAGE_HISTORY;
    return filteredSubmissionHistory.slice(startIndex, endIndex);
  }, [currentHistoryPage, filteredSubmissionHistory]);

  const handlePreviousHistoryPage = () => {
    setCurrentHistoryPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextHistoryPage = () => {
    setCurrentHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages));
  };


  return (
    <>
      <PageHeader
        title="Upload Feedback Report &amp; Assign Badge"
        description="Upload PDF feedback reports for completed booking sessions, provide skill ratings, and optionally assign an achievement badge."
      />
      <Card className="max-w-2xl mx-auto mb-8">
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
                setSelectedBadgeId(''); // Reset badge selection when booking changes
                setSkillRatingsData({}); // Reset skill ratings
                // Load existing comments if any
                setComments(MOCK_BOOKINGS.find(b => b.id === value)?.userFeedback || '');
                setReportFile(null); // Reset file input state
                // Clear the actual file input field
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
                        <SelectItem value="no-badge">No Badge</SelectItem>
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
              <UploadCloud className="mr-2 h-4 w-4" /> Save Feedback &amp; {reportFile ? "Upload Report" : "Update Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5 text-primary" /> Submission History</CardTitle>
          <CardDescription>History of all feedback and report submissions. Showing {paginatedHistory.length} of {filteredSubmissionHistory.length} entries.</CardDescription>
           <Input
            placeholder="Filter by user name..."
            value={userNameFilter}
            onChange={(e) => {
              setUserNameFilter(e.target.value);
              setCurrentHistoryPage(1); // Reset to first page on filter change
            }}
            className="mt-2 max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted On</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Report File</TableHead>
                <TableHead>Badge Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHistory.length > 0 ? paginatedHistory.map((entry) => {
                const bookingForLink = MOCK_BOOKINGS.find(b => b.id === entry.bookingId);
                return (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.submissionDate), 'MMM d, yyyy - h:mm a')}</TableCell>
                  <TableCell>{entry.bookingId}</TableCell>
                  <TableCell>{entry.userName}</TableCell>
                  <TableCell>{entry.serviceName}</TableCell>
                  <TableCell>
                    {entry.reportFileName && bookingForLink?.reportUrl ? (
                      <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs">
                        <a href={bookingForLink.reportUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-xs">
                          <FileSpreadsheet className="h-3 w-3 flex-shrink-0"/> {entry.reportFileName}
                        </a>
                      </Button>
                    ) : entry.reportFileName ? (
                        <UiBadge variant="secondary" className="flex items-center gap-1 max-w-[150px] sm:max-w-xs truncate">
                            <FileSpreadsheet className="h-3 w-3 flex-shrink-0"/> {entry.reportFileName} (No Link)
                        </UiBadge>
                    ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.badgeAssignedName ? (
                        <UiBadge variant="outline" className="text-accent-foreground border-accent flex items-center gap-1">
                            <AwardIcon className="h-3 w-3"/>{entry.badgeAssignedName}
                        </UiBadge>
                    ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                </TableRow>
              )}) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    {userNameFilter ? "No submissions match your filter." : "No submission history found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalHistoryPages > 1 && (
          <CardFooter className="flex justify-center items-center space-x-4 py-4">
            <Button
              variant="outline"
              onClick={handlePreviousHistoryPage}
              disabled={currentHistoryPage === 1}
              size="sm"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentHistoryPage} of {totalHistoryPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextHistoryPage}
              disabled={currentHistoryPage === totalHistoryPages}
              size="sm"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}

    