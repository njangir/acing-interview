
'use client';

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MOCK_TESTIMONIALS, MOCK_BADGES, MOCK_SERVICES, PREDEFINED_AVATARS } from "@/constants";
import type { Testimonial, Badge as BadgeType, UserProfile, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, EyeOff, Filter, ShieldAlert, CheckCircle2, PlusCircle, Briefcase, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const adminTestimonialFormSchema = z.object({
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


export default function AdminTestimonialsPage() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(MOCK_TESTIMONIALS);
  const [filterBadgeId, setFilterBadgeId] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const adminForm = useForm<AdminTestimonialFormValues>({
    resolver: zodResolver(adminTestimonialFormSchema),
    defaultValues: {
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

  const handleApprovalToggle = (testimonialId: string, currentStatus: Testimonial['status']) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    setTestimonials(prev =>
      prev.map(t => t.id === testimonialId ? { ...t, status: newStatus } : t)
    );
    MOCK_TESTIMONIALS.find(t => t.id === testimonialId)!.status = newStatus;
    toast({
      title: "Testimonial Status Updated",
      description: `Testimonial ${testimonialId} is now ${newStatus}.`,
    });
  };

  const handleReject = (testimonialId: string) => {
     setTestimonials(prev =>
      prev.map(t => t.id === testimonialId ? { ...t, status: 'rejected' } : t)
    );
    MOCK_TESTIMONIALS.find(t => t.id === testimonialId)!.status = 'rejected';
    toast({
      title: "Testimonial Rejected",
      description: `Testimonial ${testimonialId} has been rejected.`,
      variant: "destructive"
    });
  };

  const filteredTestimonials = useMemo(() => {
    let filtered = testimonials;
    if (filterBadgeId !== 'all') {
      filtered = filtered.filter(testimonial => {
        if (!testimonial.userEmail) return false;
        const mockUserProfileKey = `mockUserProfile_${testimonial.userEmail}`;
        const storedProfileData = localStorage.getItem(mockUserProfileKey);

        if (storedProfileData) {
          const userProfile: UserProfile = JSON.parse(storedProfileData);
          return userProfile.awardedBadges?.some(badge => badge.id === filterBadgeId);
        }
        return false;
      });
    }
    return filtered.sort((a,b) => {
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [testimonials, filterBadgeId]);

  function onAdminSubmit(data: AdminTestimonialFormValues) {
    const selectedService = MOCK_SERVICES.find(s => s.id === data.serviceId);

    const newTestimonial: Testimonial = {
      id: `testimonial-admin-${Date.now()}`,
      name: data.name,
      userEmail: data.userEmail || undefined,
      batch: data.batch || undefined,
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

    MOCK_TESTIMONIALS.push(newTestimonial);
    setTestimonials(prev => [...prev, newTestimonial]);

    toast({
      title: "Testimonial Added!",
      description: `Testimonial from ${data.name} has been successfully added.`,
    });
    setIsCreateModalOpen(false);
    adminForm.reset();
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
                        {MOCK_BADGES.map((badge: BadgeType) => (
                        <SelectItem key={badge.id} value={badge.id}>
                            {badge.force !== "General" && <span className='text-xs text-muted-foreground mr-1'>[{badge.force}]</span>} {badge.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        <Button onClick={() => { adminForm.reset(); setIsCreateModalOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Testimonial
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Submissions</CardTitle>
          <CardDescription>
            Current count: {filteredTestimonials.length}.
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
              {filteredTestimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">
                    <div>{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.userEmail || 'N/A'}</div>
                    {testimonial.batch && <div className="text-xs text-muted-foreground">Batch: {testimonial.batch}</div>}
                  </TableCell>
                  <TableCell className="max-w-sm text-sm">{testimonial.story}</TableCell>
                  <TableCell className="text-xs">{testimonial.serviceTaken}</TableCell>
                   <TableCell>
                    {testimonial.submissionStatus === 'selected_cleared' ? (
                        <Badge variant="secondary" className="bg-sky-100 text-sky-700"><CheckCircle2 className="mr-1 h-3 w-3"/>Selected/Cleared</Badge>
                    ) : (
                        <Badge variant="outline" className="border-amber-500 text-amber-700"><ShieldAlert className="mr-1 h-3 w-3"/>Aspirant</Badge>
                    )}
                   </TableCell>
                  <TableCell>
                    <Badge variant={
                      testimonial.status === 'approved' ? 'default' :
                      testimonial.status === 'pending' ? 'secondary' :
                      'destructive'
                    } className={testimonial.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {testimonial.status.toUpperCase()}
                    </Badge>
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
               {filteredTestimonials.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No testimonials found matching the current filter.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {testimonials.length === 0 && filterBadgeId === 'all' && (
            <p className="text-center text-muted-foreground py-4">No testimonials submitted yet.</p>
          )}
        </CardContent>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User's Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
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
                    <FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl>
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
                        {MOCK_SERVICES.map(service => (<SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>))}
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
                    <FormControl><Input type="url" placeholder="https://placehold.co/100x100.png" {...field} /></FormControl>
                    {field.value && <Image src={field.value || PREDEFINED_AVATARS[0].url} alt="Profile preview" width={60} height={60} className="mt-2 rounded-full border" />}
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
                     {field.value && <Image src={field.value} alt="Body image preview" width={100} height={75} className="mt-2 rounded-md border object-contain" />}
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
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Testimonial</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}


    