
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
import { PREDEFINED_SKILLS, SKILL_RATINGS } from "@/constants";
import type { Booking, Badge as BadgeType, FeedbackSubmissionHistoryEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AwardIcon, Star, History, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { db, storage, functions } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, query, orderBy, serverTimestamp, arrayUnion, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';

const getAdminReportsPageData = httpsCallable(functions, 'getAdminReportsPageData');

const ITEMS_PER_PAGE_HISTORY = 5;

export default function AdminReportsPage() {
  const { toast } = useToast();
  const { currentUser: adminUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<FeedbackSubmissionHistoryEntry[]>([]);

  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [skillRatingsData, setSkillRatingsData] = useState<Record<string, string>>({});
  
  const [userNameFilter, setUserNameFilter] = useState<string>('');
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result: any = await getAdminReportsPageData();
        const data = result.data;
        
        const historyWithDates = data.history.map((h: any) => ({
            ...h,
            submissionDate: h.submissionDate?._seconds ? new Date(h.submissionDate._seconds * 1000) : new Date()
        }));

        setCompletedBookings(data.completedBookings || []);
        setBadges(data.badges || []);
        setSubmissionHistory(historyWithDates || []);

      } catch (err: any) {
        console.error("Error loading initial data:", err);
        setError(err.message || "Failed to load necessary data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const selectedBookingDetails = useMemo(() => {
    return completedBookings.find(b => b.id === selectedBookingId);
  }, [selectedBookingId, completedBookings]);
  
  const userSpecificHistory = useMemo(() => {
    if (!selectedBookingDetails) return [];
    return submissionHistory.filter(entry => entry.userName === selectedBookingDetails.userName && entry.bookingId !== selectedBookingId);
  }, [selectedBookingDetails, submissionHistory]);

  useEffect(() => {
    if (selectedBookingDetails) {
      const initialRatings: Record<string, string> = {};
      if (selectedBookingDetails.detailedFeedback) {
        selectedBookingDetails.detailedFeedback.forEach(fb => {
          initialRatings[fb.skill] = fb.rating;
        });
      }
      setSkillRatingsData(initialRatings);
      setComments(selectedBookingDetails.userFeedback || '');
    } else {
      setSkillRatingsData({});
      setComments('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !selectedBookingDetails) {
      toast({ title: "Missing Information", description: "Please select a booking.", variant: "destructive" });
      return;
    }
    if (!reportFile && !selectedBookingDetails?.reportUrl) {
      toast({ title: "Missing Report", description: "Please upload a report PDF file or ensure one is already linked.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let finalReportUrl = selectedBookingDetails.reportUrl;

    try {
      if (reportFile) {
        const reportFileName = `feedback_reports/${selectedBookingId}_${Date.now()}_${reportFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const fileRef = storageRef(storage, reportFileName);
        const uploadResult = await uploadBytes(fileRef, reportFile);
        finalReportUrl = await getDownloadURL(uploadResult.ref);
      }

      const feedbackToSave = PREDEFINED_SKILLS.map(skill => ({
        skill,
        rating: skillRatingsData[skill] || 'Satisfactory',
        comments: '', 
      }));

      const bookingDocRef = doc(db, "bookings", selectedBookingId);
      await updateDoc(bookingDocRef, {
        detailedFeedback: feedbackToSave,
        reportUrl: finalReportUrl,
        userFeedback: comments,
        updatedAt: serverTimestamp()
      });
      
      const assignedBadge = badges.find(b => b.id === selectedBadgeId);
      if (assignedBadge && selectedBookingDetails.uid) {
        const userProfileRef = doc(db, "userProfiles", selectedBookingDetails.uid);
        await updateDoc(userProfileRef, { 
            awardedBadgeIds: arrayUnion(assignedBadge.id),
            updatedAt: serverTimestamp() 
        });
      }

      const historyEntry = {
        submissionDate: serverTimestamp(),
        bookingId: selectedBookingId,
        userName: selectedBookingDetails.userName,
        serviceName: selectedBookingDetails.serviceName,
        reportFileName: reportFile ? reportFile.name : (finalReportUrl ? finalReportUrl.split('/').pop()?.split('?')[0].split('%2F').pop() : undefined),
        badgeAssignedName: assignedBadge ? assignedBadge.name : undefined,
        adminUid: adminUser?.uid, 
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "feedbackSubmissions"), historyEntry);
      
      toast({
        title: "Feedback Processed Successfully",
        description: `Details for ${selectedBookingDetails.userName} saved.`,
      });

      // Reset form and refetch data
      setSelectedBookingId('');
      setReportFile(null);
      setComments('');
      setSelectedBadgeId('');
      setSkillRatingsData({});
      const fileInput = document.getElementById('reportFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      const result: any = await getAdminReportsPageData();
      const data = result.data;
      const historyWithDates = data.history.map((h: any) => ({ ...h, submissionDate: h.submissionDate?._seconds ? new Date(h.submissionDate._seconds * 1000) : new Date() }));
      setSubmissionHistory(historyWithDates || []);
      setCompletedBookings(data.completedBookings || []);

    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast({ title: "Submission Failed", description: "Could not save feedback. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubmissionHistory = useMemo(() => {
    let filtered = submissionHistory;
    if (userNameFilter.trim() !== '') {
      filtered = filtered.filter(entry =>
        entry.userName.toLowerCase().includes(userNameFilter.toLowerCase())
      );
    }
    return filtered;
  }, [submissionHistory, userNameFilter]);

  const totalHistoryPages = Math.ceil(filteredSubmissionHistory.length / ITEMS_PER_PAGE_HISTORY);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentHistoryPage - 1) * ITEMS_PER_PAGE_HISTORY;
    const endIndex = startIndex + ITEMS_PER_PAGE_HISTORY;
    return filteredSubmissionHistory.slice(startIndex, endIndex);
  }, [currentHistoryPage, filteredSubmissionHistory]);

  const handlePreviousHistoryPage = () => setCurrentHistoryPage((prev) => Math.max(prev - 1, 1));
  const handleNextHistoryPage = () => setCurrentHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages));

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title="Upload Feedback Report & Assign Badge"
        description="Upload PDF feedback reports for completed booking sessions, provide skill ratings, and optionally assign an achievement badge."
      />
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>Process Completed Session</CardTitle>
            <CardDescription>Select a booking, upload the report, rate skills, and assign a badge if applicable.</CardDescription>
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
                {!reportFile && selectedBookingDetails?.reportUrl && <p className="text-xs text-muted-foreground">Current report: <a href={selectedBookingDetails.reportUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{selectedBookingDetails.reportUrl.split('%2F').pop()?.split('?')[0]}</a> (Upload new to replace)</p>}
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
                                <SelectValue placeholder="Rate skill for this session..." />
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
                        <Label htmlFor="comments">Overall Comments</Label>
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
                            <SelectItem value="">No Badge</SelectItem>
                            {badges.map(badge => (
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
                <Button type="submit" className="w-full" disabled={!selectedBookingId || isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Processing...' : `Save Feedback & ${reportFile ? "Upload Report" : "Update Details"}`}
                </Button>
            </CardFooter>
            </form>
        </Card>

        <div className="lg:col-span-1 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5 text-primary" /> User's Submission History</CardTitle>
                    <CardDescription>{selectedBookingDetails ? `Previous feedback for ${selectedBookingDetails.userName}` : 'Select a booking to see user history'}</CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedBookingDetails ? (
                        userSpecificHistory.length > 0 ? (
                             <ScrollArea className="h-48 pr-3 custom-scrollbar">
                                <div className="space-y-2">
                                {userSpecificHistory.map(entry => (
                                    <div key={entry.id} className="text-xs border-b pb-1">
                                        <p><strong>{entry.serviceName}</strong> on {format(new Date(entry.submissionDate), 'MMM d, yyyy')}</p>
                                        {entry.badgeAssignedName && <p>Badge: {entry.badgeAssignedName}</p>}
                                    </div>
                                ))}
                                </div>
                             </ScrollArea>
                        ) : (<p className="text-sm text-muted-foreground">No prior feedback history for this user.</p>)
                    ) : (<p className="text-sm text-muted-foreground">No user selected.</p>)}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5 text-primary" /> All Submission History</CardTitle>
                <CardDescription>All feedback and report submissions. Showing {paginatedHistory.length} of {filteredSubmissionHistory.length} entries.</CardDescription>
                <Input
                    placeholder="Filter by user name..."
                    value={userNameFilter}
                    onChange={(e) => {
                    setUserNameFilter(e.target.value);
                    setCurrentHistoryPage(1);
                    }}
                    className="mt-2"
                />
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Badge</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paginatedHistory.length > 0 ? paginatedHistory.map((entry) => (
                        <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.userName}</TableCell>
                        <TableCell>{format(new Date(entry.submissionDate), 'dd-MMM-yy')}</TableCell>
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
                    )) : (
                        <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
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
        </div>
      </div>
    </>
  );
}
