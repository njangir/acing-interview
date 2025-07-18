
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { MentorProfileData } from '@/types';
import Image from 'next/image';
import { UserCog } from 'lucide-react';
import { mentorProfileService } from '@/lib/firebase-services';

const mentorProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  contactEmail: z.string().email("Invalid email address."),
  contactPhone: z.string().min(10, "Phone number must be at least 10 digits."),
  bio: z.string().min(50, "Bio must be at least 50 characters."),
  // Experience, philosophy, quote could be added here if made editable via more complex fields
});

type MentorProfileFormValues = z.infer<typeof mentorProfileSchema>;

export default function AdminMentorProfilePage() {
  const { toast } = useToast();
  const [editableProfile, setEditableProfile] = useState<MentorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    mentorProfileService.getMentorProfile()
      .then((profile: MentorProfileData | null) => {
        setEditableProfile(profile);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setError('Failed to load mentor profile.');
        setIsLoading(false);
      });
  }, []);

  const form = useForm<MentorProfileFormValues>({
    resolver: zodResolver(mentorProfileSchema),
    defaultValues: editableProfile ? {
      name: editableProfile.name,
      title: editableProfile.title,
      contactEmail: editableProfile.contactEmail,
      contactPhone: editableProfile.contactPhone,
      bio: editableProfile.bio,
    } : {},
    values: editableProfile ? {
      name: editableProfile.name,
      title: editableProfile.title,
      contactEmail: editableProfile.contactEmail,
      contactPhone: editableProfile.contactPhone,
      bio: editableProfile.bio,
    } : undefined,
  });

  async function onSubmit(data: MentorProfileFormValues) {
    if (!editableProfile) return;
    try {
      const updatedProfile: MentorProfileData = {
        ...editableProfile,
        ...data,
      };
      await mentorProfileService.updateMentorProfile(updatedProfile);
      setEditableProfile(updatedProfile);
      toast({
        title: "Mentor Profile Updated",
        description: "The public mentor profile has been successfully updated.",
      });
    } catch (err) {
      toast({ title: "Update Failed", description: "Could not update mentor profile.", variant: "destructive" });
    }
  }

  if (isLoading) {
    return <div className="container py-12 flex justify-center items-center min-h-[300px]"><span>Loading...</span></div>;
  }
  if (error || !editableProfile) {
    return <div className="container py-12 flex justify-center items-center min-h-[300px]"><span>{error || 'Mentor profile not found.'}</span></div>;
  }

  return (
    <>
      <PageHeader
        title="Update Mentor Profile"
        description="Edit the public-facing profile of the mentor."
      />
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-start gap-4">
          <Image
            src={editableProfile.imageUrl}
            alt={editableProfile.name}
            width={80}
            height={80}
            className="rounded-full border-2 border-primary"
            data-ai-hint={editableProfile.dataAiHint}
          />
          <div>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <UserCog className="h-6 w-6 mr-2 text-primary"/> Edit: {editableProfile.name}
            </CardTitle>
            <CardDescription>Modify the contact details and description below.</CardDescription>
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Mentor's full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title / Designation</FormLabel>
                    <FormControl><Input placeholder="Mentor's title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl><Input type="email" placeholder="Mentor's contact email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl><Input type="tel" placeholder="Mentor's contact phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio / Description</FormLabel>
                    <FormControl><Textarea rows={5} placeholder="Mentor's biography" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* For experience, philosophy, quote - these are currently non-editable text for simplicity based on wireframe
                  Could be expanded with more complex form fields (e.g., array inputs for experience) */}
                <div>
                    <FormLabel>Experience (Read-only)</FormLabel>
                    <ul className="list-disc list-inside text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">
                        {editableProfile.experience.map((exp, i) => <li key={i}>{exp}</li>)}
                    </ul>
                </div>
                 <div>
                    <FormLabel>Philosophy (Read-only)</FormLabel>
                    <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md italic">"{editableProfile.philosophy}"</p>
                </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
