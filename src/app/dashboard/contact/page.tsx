
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react'; // Added useEffect

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MailQuestion, Loader2 } from 'lucide-react'; // Added Loader2
import { MOCK_USER_MESSAGES } from '@/constants'; // For adding to mock messages
import type { UserMessage } from '@/types';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

// PRODUCTION TODO: Import Firebase and Firestore methods
// import { db } from '@/lib/firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const contactFormSchema = z.object({
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }),
  confirmContact: z.boolean().refine(val => val === true, { message: "Please confirm your contact details." }),
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please complete the CAPTCHA." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactSupportPage() {
  const { toast } = useToast();
  const { currentUser, loadingAuth } = useAuth(); // Get the current logged-in user and loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: "",
      message: "",
      confirmContact: false,
      isNotRobot: false,
    },
  });

  async function onSubmit(data: ContactFormValues) {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const newMessageData: Omit<UserMessage, 'id' | 'createdAt' | 'updatedAt'> = {
      uid: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email,
      subject: data.subject,
      messageBody: data.message,
      timestamp: new Date(), // For Firestore, use serverTimestamp() for 'createdAt'
      status: 'new',
      senderType: 'user',
    };
    
    try {
      // PRODUCTION TODO: Add new message document to Firestore 'userMessages' collection
      // const messagesColRef = collection(db, "userMessages");
      // await addDoc(messagesColRef, {
      //   ...newMessageData,
      //   timestamp: serverTimestamp(), // Use server timestamp for consistent ordering
      //   createdAt: serverTimestamp(),
      //   updatedAt: serverTimestamp(),
      // });

      // MOCK: Add to MOCK_USER_MESSAGES array for prototype
      MOCK_USER_MESSAGES.push({
        ...newMessageData,
        id: `msg-user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as UserMessage);
      console.log("Message submitted (simulated backend send):", newMessageData);
      // END MOCK

      toast({
        title: "Message Sent!",
        description: "Your message has been sent to our support team. We'll get back to you shortly.",
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting message:", error);
      toast({ title: "Submission Failed", description: "Could not send your message. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingAuth) {
    return (
        <div className="container py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading user details...</p>
        </div>
    );
  }

  if (!currentUser) {
     return (
        <div className="container py-12">
            <PageHeader title="Contact Support" description="Please log in to contact support."/>
        </div>
     );
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
                <CardDescription>Fill out the form below. Replies will be sent to: <strong>{currentUser.email}</strong></CardDescription>
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
                        My email (<strong className="text-foreground">{currentUser.email}</strong>) is correct, and I understand replies will be sent here.
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
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}

