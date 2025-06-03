
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { MOCK_SERVICES, MOCK_TESTIMONIALS, MOCK_USER_PROFILE_FOR_CONTACT } from '@/constants';
import { Edit2Icon, Award } from 'lucide-react';

const testimonialFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email("Please enter a valid email.").optional(), // Keep if prefilled, otherwise require
  serviceId: z.string({ required_error: "Please select the service you took." }),
  story: z.string().min(50, { message: "Testimonial must be at least 50 characters." }).max(1000, { message: "Testimonial cannot exceed 1000 characters." }),
  batch: z.string().optional(),
  submissionStatus: z.enum(['aspirant', 'selected_cleared'], { required_error: "Please select your current status." }),
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please confirm you're not a robot." }),
});

type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export default function SubmitTestimonialPage() {
  const { toast } = useToast();
  const [userProfile] = useState(MOCK_USER_PROFILE_FOR_CONTACT); // Simulate fetching user profile

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      name: userProfile.name || "",
      email: userProfile.email || "",
      serviceId: "",
      story: "",
      batch: "",
      submissionStatus: undefined,
      isNotRobot: false,
    },
  });

   useEffect(() => {
    // Pre-fill name and email if user profile changes (e.g., on initial load)
    form.reset({
        name: userProfile.name || "",
        email: userProfile.email || "",
        serviceId: form.getValues("serviceId"),
        story: form.getValues("story"),
        batch: form.getValues("batch"),
        submissionStatus: form.getValues("submissionStatus"),
        isNotRobot: form.getValues("isNotRobot"),
    });
  }, [userProfile, form]);

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
      status: 'pending' as const, // Testimonials start as pending
      imageUrl: 'https://placehold.co/100x100.png', // Default placeholder
      dataAiHint: 'person'
    };
    
    // Simulate adding to mock data (in real app, this would be an API call)
    MOCK_TESTIMONIALS.push(newTestimonial);
    console.log("Testimonial submitted (simulated backend send):", newTestimonial); 
    
    toast({
      title: "Testimonial Submitted!",
      description: "Thank you for sharing your experience. Your testimonial is pending review.",
    });
    form.reset(); 
  }

  return (
    <>
      <PageHeader
        title="Share Your Success Story"
        description="Help fellow aspirants by sharing your experience with our services."
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
                    <FormLabel>Your Email (Optional)</FormLabel>
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
                      <Input placeholder="e.g., NDA 2023, CDS II 2024" {...field} />
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
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="aspirant" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Still an Aspirant
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
