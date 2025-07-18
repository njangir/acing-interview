
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import Image from 'next/image'; // Import Image component

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PREDEFINED_AVATARS } from '@/constants'; // PREDEFINED_AVATARS for default user image
import type { Testimonial, Service } from '@/types'; // Added Service type
import { Edit2Icon, Award, MapPin, ListChecks, Briefcase, Upload, Loader2 } from 'lucide-react'; // Added Loader2
import { useAuth } from '@/hooks/use-auth';
import { serviceService, testimonialService } from '@/lib/firebase-services';

// PRODUCTION TODO: Import Firebase and Firestore methods
// import { db, storage } from '@/lib/firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const testimonialFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  serviceId: z.string({ required_error: "Please select the service you took." }),
  story: z.string().min(50, { message: "Testimonial must be at least 50 characters." }).max(1000, { message: "Testimonial cannot exceed 1000 characters." }),
  batch: z.string().optional(),
  submissionStatus: z.enum(['aspirant', 'selected_cleared'], { required_error: "Please select your current status." }),
  selectedForce: z.enum(['Army', 'Navy', 'Air Force']).optional(),
  interviewLocation: z.string().optional(),
  numberOfAttempts: z.coerce.number().min(1, "Number of attempts must be at least 1.").optional(),
  bodyImageUrl: z.string().url().optional().or(z.literal('')), // For the uploaded image URL (simulated)
  bodyImageDataAiHint: z.string().max(50, "AI hint should be concise").optional(),
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please confirm you're not a robot." }),
}).superRefine((data, ctx) => {
    if (data.submissionStatus === 'selected_cleared') {
        if (!data.selectedForce) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select the force you were selected for.",
                path: ['selectedForce'],
            });
        }
        if (!data.interviewLocation || data.interviewLocation.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please enter the interview location.",
                path: ['interviewLocation'],
            });
        }
        if (data.numberOfAttempts === undefined || data.numberOfAttempts < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please enter a valid number of attempts (at least 1).",
                path: ['numberOfAttempts'],
            });
        }
    }
});


type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export default function SubmitTestimonialPage() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [bodyImageFile, setBodyImageFile] = useState<File | null>(null);
  const [bodyImagePreview, setBodyImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      name: "",
      email: "",
      serviceId: "",
      story: "",
      batch: "",
      submissionStatus: undefined,
      selectedForce: undefined,
      interviewLocation: "",
      numberOfAttempts: undefined,
      bodyImageUrl: "",
      bodyImageDataAiHint: "",
      isNotRobot: false,
    },
  });

  useEffect(() => {
    serviceService.getAllServices().then(setAvailableServices);
    if (user) {
        form.reset({
            ...form.getValues(),
            name: user.displayName || user.email || "",
            email: user.email || "",
        });
    }
  }, [user, form]);

  const submissionStatus = useWatch({
    control: form.control,
    name: 'submissionStatus',
  });

  const handleBodyImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBodyImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBodyImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBodyImageFile(null);
      setBodyImagePreview(null);
    }
  };


  async function onSubmit(data: TestimonialFormValues) {
    if (!user) {
      toast({ title: "Authentication Error", description: "Please log in to submit a testimonial.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const selectedService = availableServices.find(s => s.id === data.serviceId);
    let finalBodyImageUrl = data.bodyImageUrl;
    // PRODUCTION TODO: Handle Image Upload to Firebase Storage
    if (bodyImageFile) {
      try {
        // ... image upload logic ...
        finalBodyImageUrl = `https://placehold.co/400x300.png?text=${encodeURIComponent(bodyImageFile.name.substring(0,15))}`;
      } catch (uploadError) {
        console.error("Error uploading body image:", uploadError);
        toast({ title: "Image Upload Failed", description: "Could not upload your image. Please try again or submit without it.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }
    const newTestimonialData: Omit<Testimonial, 'id'> = {
      uid: user.uid,
      name: data.name,
      userEmail: data.email,
      batch: data.batch || undefined,
      story: data.story,
      imageUrl: user.photoURL || PREDEFINED_AVATARS[0].url,
      dataAiHint: 'person avatar',
      serviceTaken: selectedService?.name || 'Unknown Service',
      serviceId: data.serviceId,
      submissionStatus: data.submissionStatus,
      selectedForce: data.submissionStatus === 'selected_cleared' ? data.selectedForce : undefined,
      interviewLocation: data.submissionStatus === 'selected_cleared' ? data.interviewLocation : undefined,
      numberOfAttempts: data.submissionStatus === 'selected_cleared' ? data.numberOfAttempts : undefined,
      bodyImageUrl: finalBodyImageUrl || undefined,
      bodyImageDataAiHint: data.bodyImageDataAiHint || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await testimonialService.createTestimonial(newTestimonialData);
      toast({
        title: "Testimonial Submitted!",
        description: "Thank you for sharing your experience. Your testimonial is pending review.",
      });
      form.reset({
          name: user?.displayName || user?.email || "",
          email: user?.email || "",
          serviceId: "",
          story: "",
          batch: "",
          submissionStatus: undefined,
          selectedForce: undefined,
          interviewLocation: "",
          numberOfAttempts: undefined,
          bodyImageUrl: "",
          bodyImageDataAiHint: "",
          isNotRobot: false,
      });
      setBodyImageFile(null);
      setBodyImagePreview(null);
    } catch (error) {
      console.error("Error submitting testimonial to Firestore:", error);
      toast({ title: "Submission Failed", description: "Could not save your testimonial. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container py-12">
        <PageHeader title="Submit Testimonial" description="Please log in to share your success story."/>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Share Your Success Story"
        description="Help fellow Officer Candidates by sharing your experience with our services."
      />
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Award className="h-10 w-10 text-primary"/>
            <div>
                <CardTitle className="font-headline text-2xl text-primary">Submit Your Testimonial</CardTitle>
                <CardDescription>Your feedback is valuable to us and the community.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email (Optional, for internal reference)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Taken</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the service you availed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableServices.length > 0 ? availableServices.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        )) : <SelectItem value="loading" disabled>Loading services...</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Testimonial</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="Share your experience and how our service helped you..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="batch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Batch/Course (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NDA 150, CDS II 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel htmlFor="bodyImage" className="flex items-center gap-2"><Upload className="h-4 w-4"/>Upload a Photo for Your Testimonial (Optional)</FormLabel>
                <FormControl>
                    <Input id="bodyImage" type="file" accept="image/*" onChange={handleBodyImageChange} />
                </FormControl>
                {bodyImagePreview && (
                    <div className="mt-2">
                        <Image src={bodyImagePreview} alt="Body image preview" width={200} height={150} className="rounded-md border object-contain" data-ai-hint="user testimonial image" />
                    </div>
                )}
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="bodyImageDataAiHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Hint for Your Photo (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., graduation, celebration" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="submissionStatus"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Your Current Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="aspirant" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Still an Aspirant / Preparing
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="selected_cleared" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Selected / Cleared Exam
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submissionStatus === 'selected_cleared' && (
                <Card className="p-4 bg-secondary/30 border-secondary">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-lg font-headline text-primary">Selection Details</CardTitle>
                        <CardDescription>Please provide more information about your selection.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <FormField
                            control={form.control}
                            name="selectedForce"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Selected Force</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Which force were you selected for?" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Army"><Briefcase className="inline h-4 w-4 mr-2 text-green-600"/>Indian Army</SelectItem>
                                    <SelectItem value="Navy"><Briefcase className="inline h-4 w-4 mr-2 text-sky-600"/>Indian Navy</SelectItem>
                                    <SelectItem value="Air Force"><Briefcase className="inline h-4 w-4 mr-2 text-blue-500"/>Indian Air Force</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="interviewLocation"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>SSB Interview Location</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., Bhopal, Allahabad" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="numberOfAttempts"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Number of SSB Attempts (This was attempt no.)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="isNotRobot"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        CAPTCHA
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Edit2Icon className="mr-2 h-4 w-4"/> {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}

