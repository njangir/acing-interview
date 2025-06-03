
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MailQuestion } from 'lucide-react';
import { MOCK_USER_PROFILE_FOR_CONTACT } from '@/constants';
import type { UserMessage } from '@/types';

const contactFormSchema = z.object({
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }),
  confirmContact: z.boolean().refine(val => val === true, { message: "Please confirm your contact details." }),
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please complete the CAPTCHA." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactSupportPage() {
  const { toast } = useToast();
  const [userProfile] = useState(MOCK_USER_PROFILE_FOR_CONTACT); // Simulate fetching user profile

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: "",
      message: "",
      confirmContact: false,
      isNotRobot: false,
    },
  });

  function onSubmit(data: ContactFormValues) {
    const newMessage: Omit<UserMessage, 'id' | 'timestamp' | 'status'> = { // Data to be sent to backend
      userName: userProfile.name, 
      userEmail: userProfile.email, 
      subject: data.subject,
      messageBody: data.message,
    };
    
    console.log("Message submitted (simulated backend send):", newMessage); 
    toast({
      title: "Message Sent!",
      description: "Your message has been sent to our support team. We'll get back to you shortly.",
    });
    form.reset(); 
  }

  return (
    <>
      <PageHeader
        title="Contact Support"
        description="Have a question or need assistance? Send us a message."
      />
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <MailQuestion className="h-10 w-10 text-primary"/>
            <div>
                <CardTitle className="font-headline text-2xl text-primary">Send a Message</CardTitle>
                <CardDescription>Fill out the form below. Replies will be sent to: <strong>{userProfile.email}</strong></CardDescription>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Question about SSB Mock Interview" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="Please describe your query in detail..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmContact"
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
                        Confirm Contact Information
                      </FormLabel>
                      <FormDescription>
                        My email (<strong className="text-foreground">{userProfile.email}</strong>) is correct, and I understand replies will be sent here.
                      </FormDescription>
                      <FormMessage />
                    </div>
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
                      <FormDescription>
                        Please tick this box to confirm you're not a robot.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Send Message</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
