
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';

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
import { MOCK_SERVICES, MOCK_TESTIMONIALS } from '@/constants'; // Removed MOCK_USER_PROFILE_FOR_CONTACT
import { Edit2Icon, Award, MapPin, ListChecks, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; // Added useAuth

const testimonialFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email("Please enter a valid email.").optional(),
  serviceId: z.string({ required_error: "Please select the service you took." }),
  story: z.string().min(50, { message: "Testimonial must be at least 50 characters." }).max(1000, { message: "Testimonial cannot exceed 1000 characters." }),
  batch: z.string().optional(),
  submissionStatus: z.enum(['aspirant', 'selected_cleared'], { required_error: "Please select your current status." }),
  selectedForce: z.enum(['Army', 'Navy', 'Air Force']).optional(),
  interviewLocation: z.string().optional(),
  numberOfAttempts: z.coerce.number().min(1, "Number of attempts must be at least 1.").optional(), // Use coerce for number input
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
  const { currentUser } = useAuth(); // Get currentUser from AuthContext

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
      isNotRobot: false,
    },
  });

   useEffect(() => {
    if (currentUser) {
        form.reset({
            name: currentUser.name || "",
            email: currentUser.email || "",
            // Keep other form values as they might have been partially filled
            serviceId: form.getValues("serviceId"),
            story: form.getValues("story"),
            batch: form.getValues("batch"),
            submissionStatus: form.getValues("submissionStatus"),
            selectedForce: form.getValues("selectedForce"),
            interviewLocation: form.getValues("interviewLocation"),
            numberOfAttempts: form.getValues("numberOfAttempts"),
            isNotRobot: form.getValues("isNotRobot"),
        });
    }
  }, [currentUser, form]);

  const submissionStatus = useWatch({
    control: form.control,
    name: 'submissionStatus',
  });

  function onSubmit(data: TestimonialFormValues) {
    const selectedService = MOCK_SERVICES.find(s => s.id === data.serviceId);
    const newTestimonial = {
      id: `testimonial-${Date.now()}`,
      name: data.name,
      userEmail: data.email,
      batch: data.batch,
      story: data.story,
      serviceTaken: selectedService?.name || 'Unknown Service',
      serviceId: data.serviceId,
      submissionStatus: data.submissionStatus,
      selectedForce: data.submissionStatus === 'selected_cleared' ? data.selectedForce : undefined,
      interviewLocation: data.submissionStatus === 'selected_cleared' ? data.interviewLocation : undefined,
      numberOfAttempts: data.submissionStatus === 'selected_cleared' ? data.numberOfAttempts : undefined,
      status: 'pending' as const,
      imageUrl: 'https://placehold.co/100x100.png',
      dataAiHint: 'person'
    };

    MOCK_TESTIMONIALS.push(newTestimonial);
    console.log("Testimonial submitted (simulated backend send):", newTestimonial);

    toast({
      title: "Testimonial Submitted!",
      description: "Thank you for sharing your experience. Your testimonial is pending review.",
    });
    form.reset({ // Reset with user details but clear other fields
        name: currentUser?.name || "",
        email: currentUser?.email || "",
        serviceId: "",
        story: "",
        batch: "",
        submissionStatus: undefined,
        selectedForce: undefined,
        interviewLocation: "",
        numberOfAttempts: undefined,
        isNotRobot: false,
    });
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the service you availed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_SERVICES.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
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
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Edit2Icon className="mr-2 h-4 w-4"/> Submit Testimonial
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
