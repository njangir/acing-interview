
'use client';

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { PageHeader } from "@/components/core/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PREDEFINED_AVATARS } from "@/constants";
import type { Testimonial, Badge as BadgeType, UserProfile, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { X, Eye, EyeOff, Filter, ShieldAlert, CheckCircle2, PlusCircle, Briefcase, Upload, Users, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { testimonialService, badgeService, serviceService, userProfileService } from '@/lib/firebase-services';


// PRODUCTION TODO: Import Firebase and Firestore methods
// import { db } from '@/lib/firebase';
// import { collection, doc, addDoc, updateDoc, getDocs, onSnapshot, query, orderBy, where, serverTimestamp } from 'firebase/firestore';

const ITEMS_PER_PAGE = 7;

const adminTestimonialFormSchema = z.object({
  selectedUserId: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  userEmail: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  serviceId: z.string({ required_error: "Please select the service." }),
  story: z.string().min(50, { message: "Testimonial must be at least 50 characters." }).max(1000, { message: "Testimonial cannot exceed 1000 characters." }),
  batch: z.string().optional(),
  submissionStatus: z.enum(['aspirant', 'selected_cleared'], { required_error: "Please select the user's status." }),
  selectedForce: z.enum(['Army', 'Navy', 'Air Force']).optional(),
  interviewLocation: z.string().optional(),
  numberOfAttempts: z.coerce.number().min(1, "Number of attempts must be at least 1.").optional(),
  profileImageUrl: z.string().url("Invalid URL for profile image.").optional().or(z.literal('')),
  profileImageDataAiHint: z.string().max(50, "AI hint should be concise").optional(),
  bodyImageUrl: z.string().url("Invalid URL for body image.").optional().or(z.literal('')),
  bodyImageDataAiHint: z.string().max(50, "AI hint should be concise").optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected'], { required_error: "Please select an approval status." }),
}).superRefine((data, ctx) => {
    if (data.submissionStatus === 'selected_cleared') {
        if (!data.selectedForce) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select the force.", path: ['selectedForce'] });
        }
        if (!data.interviewLocation || data.interviewLocation.trim() === "") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter interview location.", path: ['interviewLocation'] });
        }
        if (data.numberOfAttempts === undefined || data.numberOfAttempts < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter valid number of attempts.", path: ['numberOfAttempts'] });
        }
    }
});

type AdminTestimonialFormValues = z.infer<typeof adminTestimonialFormSchema>;

interface SelectableUser {
  id: string; 
  name: string;
  email: string;
  avatarUrl?: string;
}


export default function AdminTestimonialsPage() {
  const { toast } = useToast();
  const [allTestimonialsData, setAllTestimonialsData] = useState<Testimonial[]>([]);
  const [allBadgesData, setAllBadgesData] = useState<BadgeType[]>([]);
  const [allServicesData, setAllServicesData] = useState<Service[]>([]);
  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBadgeId, setFilterBadgeId] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNameEmailEditable, setIsNameEmailEditable] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const [testimonials, badges, services] = await Promise.all([
          testimonialService.getAllTestimonials(),
          badgeService.getAllBadges(),
          serviceService.getAllServices(),
        ]);
        setAllTestimonialsData(testimonials);
        setAllBadgesData(badges);
        setAllServicesData(services);
        setAllUserProfiles([]); // No getAllUserProfiles method, fallback to empty array
      } catch (err) {
        console.error("Error fetching admin testimonials data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);


  const selectableUsers = useMemo((): SelectableUser[] => {
    const usersMap = new Map<string, SelectableUser>();
    allUserProfiles.forEach(profile => {
      if (profile.email && !usersMap.has(profile.email)) {
        usersMap.set(profile.email, {
          id: profile.uid,
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.imageUrl,
        });
      }
    });
    return Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allUserProfiles]);


  const adminForm = useForm<AdminTestimonialFormValues>({
    resolver: zodResolver(adminTestimonialFormSchema),
    defaultValues: {
      selectedUserId: "manual",
      name: "",
      userEmail: "",
      serviceId: "",
      story: "",
      batch: "",
      submissionStatus: 'aspirant',
      selectedForce: undefined,
      interviewLocation: "",
      numberOfAttempts: undefined,
      profileImageUrl: PREDEFINED_AVATARS[0].url,
      profileImageDataAiHint: PREDEFINED_AVATARS[0].hint,
      bodyImageUrl: "",
      bodyImageDataAiHint: "",
      approvalStatus: 'approved',
    },
  });

  const watchedSubmissionStatus = useWatch({
    control: adminForm.control,
    name: 'submissionStatus',
  });
  
  const watchedSelectedUserId = useWatch({
    control: adminForm.control,
    name: 'selectedUserId',
  });

  useEffect(() => {
    if (watchedSelectedUserId && watchedSelectedUserId !== "manual") {
      const selectedUser = selectableUsers.find(u => u.id === watchedSelectedUserId);
      if (selectedUser) {
        adminForm.setValue("name", selectedUser.name);
        adminForm.setValue("userEmail", selectedUser.email);
        adminForm.setValue("profileImageUrl", selectedUser.avatarUrl || PREDEFINED_AVATARS[0].url);
        adminForm.setValue("profileImageDataAiHint", "person avatar");
        setIsNameEmailEditable(false);
      }
    } else {
      if (watchedSelectedUserId === "manual") { 
        adminForm.setValue("name", "");
        adminForm.setValue("userEmail", "");
        adminForm.setValue("profileImageUrl", PREDEFINED_AVATARS[0].url);
      }
      setIsNameEmailEditable(true);
    }
  }, [watchedSelectedUserId, adminForm, selectableUsers]);


  const handleApprovalToggle = async (testimonialId: string, currentStatus: Testimonial['status']) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      // PRODUCTION TODO: Update testimonial status in Firestore
      // const testimonialDocRef = doc(db, "testimonials", testimonialId);
      // await updateDoc(testimonialDocRef, { status: newStatus, updatedAt: serverTimestamp() });
      
      // MOCK:
      const testimonialIndex = allTestimonialsData.findIndex(t => t.id === testimonialId);
      if (testimonialIndex !== -1) {
        allTestimonialsData[testimonialIndex].status = newStatus;
        setAllTestimonialsData([...allTestimonialsData]);
      }
      
      toast({
        title: "Testimonial Status Updated",
        description: `Testimonial ${testimonialId} is now ${newStatus}.`,
      });
    } catch (err) {
      console.error("Error updating testimonial status:", err);
      toast({ title: "Update Failed", description: "Could not update testimonial status.", variant: "destructive" });
    }
  };

  const handleReject = async (testimonialId: string) => {
    try {
      // PRODUCTION TODO: Update testimonial status to 'rejected' in Firestore
      // const testimonialDocRef = doc(db, "testimonials", testimonialId);
      // await updateDoc(testimonialDocRef, { status: 'rejected', updatedAt: serverTimestamp() });

      // MOCK:
      const testimonialIndex = allTestimonialsData.findIndex(t => t.id === testimonialId);
      if (testimonialIndex !== -1) {
        allTestimonialsData[testimonialIndex].status = 'rejected';
        setAllTestimonialsData([...allTestimonialsData]);
      }
      
      toast({
        title: "Testimonial Rejected",
        description: `Testimonial ${testimonialId} has been rejected.`,
        variant: "destructive"
      });
    } catch (err) {
      console.error("Error rejecting testimonial:", err);
      toast({ title: "Rejection Failed", description: "Could not reject testimonial.", variant: "destructive" });
    }
  };

  const allFilteredTestimonials = useMemo(() => {
    let filtered = [...allTestimonialsData]; 
    if (filterBadgeId !== 'all') {
      // PRODUCTION TODO: This filtering logic is based on mock localStorage.
      // In production, if filtering by user badges is needed, it would require:
      // 1. Fetching user profiles that have this badge.
      // 2. Then fetching testimonials for those users.
      // OR, denormalizing some badge info into the testimonial document (less ideal).
      // OR, more complex Firestore queries if testimonials store `uid`.
      console.warn("Filtering by badge is using mock localStorage data and is not production-ready.");
      filtered = filtered.filter(testimonial => {
        if (!testimonial.userEmail) return false;
        const userProfile = allUserProfiles.find(profile => profile.email === testimonial.userEmail);
        return userProfile?.awardedBadges?.some(badge => badge.id === filterBadgeId);
      });
    }
    return filtered.sort((a,b) => {
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [allTestimonialsData, filterBadgeId, allUserProfiles]); 

  const totalPages = Math.ceil(allFilteredTestimonials.length / ITEMS_PER_PAGE);

  const paginatedTestimonials = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allFilteredTestimonials.slice(startIndex, endIndex);
  }, [currentPage, allFilteredTestimonials]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  
  useEffect(() => {
    setCurrentPage(1); 
  }, [filterBadgeId]);

  async function onAdminSubmit(data: AdminTestimonialFormValues) {
    setIsSubmitting(true);
    const selectedService = allServicesData.find(s => s.id === data.serviceId);

    // PRODUCTION TODO: Determine UID if user is selected.
    // This logic needs to be robust. If a user is selected from `selectableUsers`,
    // we need their actual UID from Firestore (not just email which is used as ID in mock).
    // For 'manual' entry without a UID, you might store it as an anonymous testimonial or require admin to find/assign UID.
    let userUid: string | undefined = undefined;
    if (data.selectedUserId && data.selectedUserId !== "manual") {
        // In mock, `selectableUsers.id` is userEmail. In production, it should be UID.
        // For this mock, we'll just log it.
        console.log("Selected user's email (used as ID in mock):", data.selectedUserId);
        // Example: userUid = await getUidForEmail(data.userEmail); // This function would query Firestore
    }

    const newTestimonialData: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'> & { uid?: string } = {
      uid: userUid? userUid : "Anonymous",
      name: data.name,
      userEmail: data.userEmail ? data.userEmail : "",
      batch: data.batch ? data.batch : "",
      story: data.story,
      imageUrl: data.profileImageUrl || PREDEFINED_AVATARS[0].url,
      dataAiHint: data.profileImageDataAiHint || 'person avatar',
      serviceTaken: selectedService?.name || 'Unknown Service',
      serviceId: data.serviceId,
      submissionStatus: data.submissionStatus,
      selectedForce: data.submissionStatus === 'selected_cleared' ? data.selectedForce : undefined,
      interviewLocation: data.submissionStatus === 'selected_cleared' ? data.interviewLocation : undefined,
      numberOfAttempts: data.submissionStatus === 'selected_cleared' ? data.numberOfAttempts : undefined,
      bodyImageUrl: data.bodyImageUrl || undefined,
      bodyImageDataAiHint: data.bodyImageDataAiHint || undefined,
      status: data.approvalStatus,
    };

    try {
        // PRODUCTION TODO: Add new testimonial to Firestore
        // const docRef = await addDoc(collection(db, "testimonials"), { 
        //   ...newTestimonialData, 
        //   createdAt: serverTimestamp(), 
        //   updatedAt: serverTimestamp() 
        // });
        // const newTestimonialWithId = { ...newTestimonialData, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Testimonial;

        // MOCK:
        const newTestimonialWithId = { 
            ...newTestimonialData, 
            id: `testimonial-admin-${Date.now()}`, 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString() 
        } as Testimonial;
        allTestimonialsData.push(newTestimonialWithId); 
        setAllTestimonialsData([...allTestimonialsData]); // If not using onSnapshot

        toast({
          title: "Testimonial Added!",
          description: `Testimonial from ${data.name} has been successfully added.`,
        });
        setIsCreateModalOpen(false);
        adminForm.reset({
            selectedUserId: "manual", name: "", userEmail: "", serviceId: "", story: "", batch: "",
            submissionStatus: 'aspirant', selectedForce: undefined, interviewLocation: "", numberOfAttempts: undefined,
            profileImageUrl: PREDEFINED_AVATARS[0].url, profileImageDataAiHint: PREDEFINED_AVATARS[0].hint,
            bodyImageUrl: "", bodyImageDataAiHint: "", approvalStatus: 'approved',
        });
        setIsNameEmailEditable(true);
    } catch (err) {
        console.error("Error adding testimonial:", err);
        toast({ title: "Creation Failed", description: "Could not add testimonial.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleOpenCreateModal = () => {
    adminForm.reset({ 
        selectedUserId: "manual", name: "", userEmail: "", serviceId: "", story: "", batch: "",
        submissionStatus: 'aspirant', selectedForce: undefined, interviewLocation: "", numberOfAttempts: undefined,
        profileImageUrl: PREDEFINED_AVATARS[0].url, profileImageDataAiHint: PREDEFINED_AVATARS[0].hint,
        bodyImageUrl: "", bodyImageDataAiHint: "", approvalStatus: 'approved',
    });
    setIsNameEmailEditable(true);
    setIsCreateModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading testimonials data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title="Manage Testimonials"
        description="Review, approve, or add user-submitted testimonials for display on your site."
      />
       <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground"/>
                <Select value={filterBadgeId} onValueChange={setFilterBadgeId}>
                    <SelectTrigger id="badge-filter" className="w-full md:w-[300px]">
                        <SelectValue placeholder="Filter by user badge..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users (No Badge Filter)</SelectItem>
                        {allBadgesData.map((badge: BadgeType) => (
                        <SelectItem key={badge.id} value={badge.id}>
                            {badge.force !== "General" && <span className='text-xs text-muted-foreground mr-1'>[{badge.force}]</span>} {badge.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        <Button onClick={handleOpenCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Testimonial
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Submissions</CardTitle>
          <CardDescription>
            Showing {paginatedTestimonials.length} of {allFilteredTestimonials.length} testimonials.
            {filterBadgeId !== 'all' && <span className="block text-xs text-orange-600">Note: Badge filter is currently using mock data and may not reflect live user badge assignments.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Testimonial</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Submission Status</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTestimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        {testimonial.imageUrl && (
                             <Image src={testimonial.imageUrl} alt={testimonial.name} width={32} height={32} className="rounded-full border" data-ai-hint={testimonial.dataAiHint || 'person avatar'}/>
                        )}
                        <div>
                            <div>{testimonial.name}</div>
                            <div className="text-xs text-muted-foreground">{testimonial.userEmail || 'N/A'}</div>
                        </div>
                    </div>
                    {testimonial.batch && <div className="text-xs text-muted-foreground mt-1">Batch: {testimonial.batch}</div>}
                  </TableCell>
                  <TableCell className="max-w-sm text-sm">{testimonial.story}</TableCell>
                  <TableCell className="text-xs">{testimonial.serviceTaken}</TableCell>
                   <TableCell>
                    {testimonial.submissionStatus === 'selected_cleared' ? (
                        <UiBadge variant="secondary" className="bg-sky-100 text-sky-700"><CheckCircle2 className="mr-1 h-3 w-3"/>Selected/Cleared</UiBadge>
                    ) : (
                        <UiBadge variant="outline" className="border-amber-500 text-amber-700"><ShieldAlert className="mr-1 h-3 w-3"/>Aspirant</UiBadge>
                    )}
                   </TableCell>
                  <TableCell>
                    <UiBadge variant={
                      testimonial.status === 'approved' ? 'default' :
                      testimonial.status === 'pending' ? 'secondary' :
                      'destructive'
                    } className={testimonial.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {testimonial.status.toUpperCase()}
                    </UiBadge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                     {testimonial.status !== 'rejected' && (
                        <Switch
                          checked={testimonial.status === 'approved'}
                          onCheckedChange={() => handleApprovalToggle(testimonial.id, testimonial.status)}
                          aria-label={testimonial.status === 'approved' ? 'Mark as Pending' : 'Approve Testimonial'}
                          id={`switch-${testimonial.id}`}
                        />
                     )}
                     {testimonial.status === 'approved' && <Eye className="inline h-5 w-5 text-green-600" />}
                     {testimonial.status === 'pending' && <EyeOff className="inline h-5 w-5 text-yellow-600" />}
                     {testimonial.status !== 'rejected' && testimonial.status !== 'approved' && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleReject(testimonial.id)}>
                            <X className="h-4 w-4 mr-1"/> Reject
                        </Button>
                     )}
                  </TableCell>
                </TableRow>
              ))}
               {paginatedTestimonials.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No testimonials found matching the current filter.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {allTestimonialsData.length === 0 && filterBadgeId === 'all' && ( 
            <p className="text-center text-muted-foreground py-4">No testimonials submitted yet.</p>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-center items-center space-x-4 py-4">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              size="sm"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              size="sm"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={(isOpen) => {
        setIsCreateModalOpen(isOpen);
        if (!isOpen) {
          adminForm.reset({
            selectedUserId: "manual", name: "", userEmail: "", serviceId: "", story: "", batch: "",
            submissionStatus: 'aspirant', selectedForce: undefined, interviewLocation: "", numberOfAttempts: undefined,
            profileImageUrl: PREDEFINED_AVATARS[0].url, profileImageDataAiHint: PREDEFINED_AVATARS[0].hint,
            bodyImageUrl: "", bodyImageDataAiHint: "", approvalStatus: 'approved',
          });
          setIsNameEmailEditable(true);
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Testimonial</DialogTitle>
            <DialogDesc>Manually enter testimonial details received through other channels.</DialogDesc>
          </DialogHeader>
          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-2 custom-scrollbar">
              <FormField
                control={adminForm.control}
                name="selectedUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4"/> Select User (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "manual"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an existing user or enter manually" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">--- Enter Manually / New User ---</SelectItem>
                        {selectableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Image src={user.avatarUrl || PREDEFINED_AVATARS[0].url} alt={user.name} width={20} height={20} className="rounded-full" data-ai-hint="person avatar" />
                              {user.name} ({user.email})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User's Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} disabled={!isNameEmailEditable} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User's Email (Optional)</FormLabel>
                    <FormControl><Input type="email" placeholder="user@example.com" {...field} disabled={!isNameEmailEditable} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={adminForm.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Taken</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {allServicesData.map(service => (<SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonial Story</FormLabel>
                    <FormControl><Textarea rows={4} placeholder="User's testimonial text..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={adminForm.control}
                name="batch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User's Batch/Course (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., NDA 151" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="profileImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Profile Image URL (Optional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://placehold.co/100x100.png" {...field} disabled={!isNameEmailEditable && !!watchedSelectedUserId && watchedSelectedUserId !== 'manual'} /></FormControl>
                    {adminForm.getValues("profileImageUrl") && <Image src={adminForm.getValues("profileImageUrl") || PREDEFINED_AVATARS[0].url} alt="Profile preview" width={60} height={60} className="mt-2 rounded-full border" />}
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={adminForm.control}
                name="profileImageDataAiHint"
                render={({ field }) => (
                  <FormItem><FormLabel>Profile Image AI Hint</FormLabel>
                  <FormControl><Input placeholder="e.g., person avatar" {...field} /></FormControl>
                  <FormMessage /></FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="bodyImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonial Body Image URL (Optional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://placehold.co/400x300.png" {...field} /></FormControl>
                     {adminForm.getValues("bodyImageUrl") && <Image src={adminForm.getValues("bodyImageUrl")!} alt="Body image preview" width={100} height={75} className="mt-2 rounded-md border object-contain" />}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="bodyImageDataAiHint"
                render={({ field }) => (
                  <FormItem><FormLabel>Body Image AI Hint</FormLabel>
                  <FormControl><Input placeholder="e.g., successful candidate" {...field} /></FormControl>
                  <FormMessage /></FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="submissionStatus"
                render={({ field }) => (
                  <FormItem className="space-y-2"><FormLabel>User's Submission Status</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="aspirant" /></FormControl><FormLabel className="font-normal">Aspirant</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="selected_cleared" /></FormControl><FormLabel className="font-normal">Selected/Cleared</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl>
                  <FormMessage /></FormItem>
                )}
              />
              {watchedSubmissionStatus === 'selected_cleared' && (
                <Card className="p-4 bg-muted/50 border-muted">
                    <CardHeader className="p-0 pb-3"><CardTitle className="text-md">Selection Details</CardTitle></CardHeader>
                    <CardContent className="p-0 space-y-3">
                        <FormField control={adminForm.control} name="selectedForce" render={({ field }) => (
                            <FormItem><FormLabel>Selected Force</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select force" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Army"><Briefcase className="inline h-4 w-4 mr-2 text-green-600"/>Army</SelectItem>
                                    <SelectItem value="Navy"><Briefcase className="inline h-4 w-4 mr-2 text-sky-600"/>Navy</SelectItem>
                                    <SelectItem value="Air Force"><Briefcase className="inline h-4 w-4 mr-2 text-blue-500"/>Air Force</SelectItem>
                                </SelectContent></Select><FormMessage />
                            </FormItem> )} />
                        <FormField control={adminForm.control} name="interviewLocation" render={({ field }) => (
                            <FormItem><FormLabel>Interview Location</FormLabel><FormControl><Input placeholder="e.g., Bhopal" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={adminForm.control} name="numberOfAttempts" render={({ field }) => (
                            <FormItem><FormLabel>Number of Attempts</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </CardContent>
                </Card>
              )}
              <FormField
                control={adminForm.control}
                name="approvalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Set approval status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Adding...' : 'Create Testimonial'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
