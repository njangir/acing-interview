
'use client';

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { PageHeader } from "@/components/core/page-header";
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
import type { Testimonial, Badge as BadgeType, UserProfile, Service, Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, EyeOff, Filter, ShieldAlert, CheckCircle2, PlusCircle, Briefcase, Upload, Users, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';

const ITEMS_PER_PAGE = 7;

const adminTestimonialFormSchema = z.object({
  selectedUserId: z.string({ required_error: "You must select a user." }).min(1, "You must select a user."),
  serviceId: z.string({ required_error: "Please select the service." }),
  story: z.string().min(50, { message: "Testimonial must be at least 50 characters." }).max(1000, { message: "Testimonial cannot exceed 1000 characters." }),
  batch: z.string().optional(),
  submissionStatus: z.enum(['aspirant', 'selected_cleared'], { required_error: "Please select the user's status." }),
  selectedForce: z.enum(['Army', 'Navy', 'Air Force']).optional(),
  interviewLocation: z.string().optional(),
  numberOfAttempts: z.coerce.number().min(1, "Number of attempts must be at least 1.").optional(),
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
  const [allServicesData, setAllServicesData] = useState<Service[]>([]);
  const [allBookingsData, setAllBookingsData] = useState<Booking[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const testimonialsQuery = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
      const servicesQuery = query(collection(db, 'services'), orderBy('name', 'asc'));
      const bookingsQuery = query(collection(db, 'bookings'));
      
      const [testimonialsSnapshot, servicesSnapshot, bookingsSnapshot] = await Promise.all([
        getDocs(testimonialsQuery),
        getDocs(servicesQuery),
        getDocs(bookingsQuery),
      ]);
      
      const fetchedTestimonials = testimonialsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
      } as Testimonial));
      setAllTestimonialsData(fetchedTestimonials);

      setAllServicesData(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      setAllBookingsData(bookingsSnapshot.docs.map(doc => doc.data() as Booking));

    } catch (err) {
      console.error("Error fetching testimonials data:", err);
      setError("Failed to load testimonials data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const selectableUsers = useMemo((): SelectableUser[] => {
    const usersMap = new Map<string, SelectableUser>();
    allBookingsData.forEach(booking => {
      if (booking.userEmail && booking.uid && !usersMap.has(booking.userEmail)) {
        usersMap.set(booking.userEmail, {
          id: booking.uid,
          name: booking.userName,
          email: booking.userEmail,
          avatarUrl: PREDEFINED_AVATARS[0].url,
        });
      }
    });
    return Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allBookingsData]);


  const adminForm = useForm<AdminTestimonialFormValues>({
    resolver: zodResolver(adminTestimonialFormSchema),
    defaultValues: {
      selectedUserId: "",
      serviceId: "",
      story: "",
      batch: "",
      submissionStatus: 'aspirant',
      selectedForce: undefined,
      interviewLocation: "",
      numberOfAttempts: undefined,
      bodyImageUrl: "",
      bodyImageDataAiHint: "",
      approvalStatus: 'approved',
    },
  });

  const watchedSubmissionStatus = useWatch({
    control: adminForm.control,
    name: 'submissionStatus',
  });


  const handleApprovalToggle = async (testimonialId: string, currentStatus: Testimonial['status']) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const testimonialDocRef = doc(db, "testimonials", testimonialId);
      await updateDoc(testimonialDocRef, { status: newStatus, updatedAt: serverTimestamp() });
      
      toast({
        title: "Testimonial Status Updated",
        description: `Testimonial is now ${newStatus}.`,
      });
      await fetchData();
    } catch (err) {
      console.error("Error updating testimonial status:", err);
      toast({ title: "Update Failed", description: "Could not update testimonial status.", variant: "destructive" });
    }
  };

  const handleReject = async (testimonialId: string) => {
    try {
      const testimonialDocRef = doc(db, "testimonials", testimonialId);
      await updateDoc(testimonialDocRef, { status: 'rejected', updatedAt: serverTimestamp() });
      
      toast({
        title: "Testimonial Rejected",
        variant: "destructive"
      });
      await fetchData();
    } catch (err) {
      console.error("Error rejecting testimonial:", err);
      toast({ title: "Rejection Failed", description: "Could not reject testimonial.", variant: "destructive" });
    }
  };

  const allFilteredTestimonials = useMemo(() => {
    let filtered = [...allTestimonialsData]; 
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    return filtered.sort((a,b) => {
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [allTestimonialsData, filterStatus]); 

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
  }, [filterStatus]);

  async function onAdminSubmit(data: AdminTestimonialFormValues) {
    setIsSubmitting(true);
    const selectedService = allServicesData.find(s => s.id === data.serviceId);
    const selectedUser = selectableUsers.find(u => u.id === data.selectedUserId);

    if (!selectedUser) {
        toast({ title: "Error", description: "Selected user could not be found.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }


    const newTestimonialData: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'> = {
      uid: selectedUser.id, 
      name: selectedUser.name,
      userEmail: selectedUser.email,
      batch: data.batch || undefined,
      story: data.story,
      imageUrl: selectedUser.avatarUrl || PREDEFINED_AVATARS[0].url,
      dataAiHint: 'person avatar',
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
        await addDoc(collection(db, "testimonials"), { 
          ...newTestimonialData, 
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp() 
        });

        toast({
          title: "Testimonial Added!",
          description: `Testimonial from ${selectedUser.name} has been successfully added.`,
        });
        setIsCreateModalOpen(false);
        adminForm.reset();
        await fetchData();
    } catch (err) {
        console.error("Error adding testimonial:", err);
        toast({ title: "Creation Failed", description: "Could not add testimonial.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleOpenCreateModal = () => {
    adminForm.reset({ 
        selectedUserId: "", serviceId: "", story: "", batch: "",
        submissionStatus: 'aspirant', selectedForce: undefined, interviewLocation: "", numberOfAttempts: undefined,
        bodyImageUrl: "", bodyImageDataAiHint: "", approvalStatus: 'approved',
    });
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
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="status-filter" className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
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
          {allTestimonialsData.length === 0 && filterStatus === 'all' && ( 
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
                    <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4"/> Select User</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an existing user who has had a booking" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
