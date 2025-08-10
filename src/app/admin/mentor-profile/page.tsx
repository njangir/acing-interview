'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { MentorProfileData } from '@/types';
import { UserCog, Loader2, AlertTriangle, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { functions, storage } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

const getMentorProfile = httpsCallable(functions, 'getMentorProfile');
const saveMentorProfile = httpsCallable(functions, 'saveMentorProfile');
const uploadFile = httpsCallable(functions, 'uploadFile');

const mentorProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  contactEmail: z.string().email("Invalid email address."),
  contactPhone: z.string().min(10, "Phone number must be at least 10 digits."),
  bio: z.string().min(50, "Bio must be at least 50 characters."),
  philosophy: z.string().min(50, "Philosophy must be at least 50 characters."),
  quote: z.string().min(10, "Quote must be at least 10 characters."),
  experience: z.string().min(20, "Experience must be at least 20 characters.").transform(val => val.split('\n').map(s => s.trim()).filter(Boolean)),
  imageUrl: z.string().url("Image URL is required.").optional().or(z.literal('')),
  dataAiHint: z.string().max(50, "AI hint should be concise").optional(),
});

type MentorProfileFormValues = z.infer<typeof mentorProfileSchema>;

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

export default function AdminMentorProfilePage() {
  const { toast } = useToast();
  const [editableProfile, setEditableProfile] = useState<MentorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<MentorProfileFormValues>({
    resolver: zodResolver(mentorProfileSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result: any = await getMentorProfile();
        const data = result.data.profile;
        if (data) {
          setEditableProfile(data);
          form.reset({
            ...data,
            experience: data.experience.join('\n'),
            dataAiHint: data.dataAiHint || '',
          });
          setImagePreview(data.imageUrl); // Set initial preview
        } else {
          setError("Mentor profile not found. It might need to be created first.");
        }
      } catch (err) {
        console.error("Error fetching mentor profile:", err);
        setError("Failed to load mentor profile data.");
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: MentorProfileFormValues) {
    setIsSaving(true);
    let finalImageUrl = editableProfile?.imageUrl || '';

    if (imageFile) {
        try {
            const fileDataUrl = await fileToBase64(imageFile);
            
            const result: any = await uploadFile({
                fileName: imageFile.name,
                fileDataUrl: fileDataUrl,
                folder: 'mentor_profiles',
                oldFileUrl: editableProfile?.imageUrl?.includes('firebasestorage.googleapis.com') ? editableProfile.imageUrl : undefined,
            });
            
            finalImageUrl = result.data.downloadURL;
        } catch (uploadError) {
            console.error("Error uploading mentor profile image:", uploadError);
            toast({ title: "Image Upload Failed", description: "Could not upload the new profile image.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
    }

    try {
      const profileToSave: MentorProfileData = {
          ...data,
          imageUrl: finalImageUrl,
          dataAiHint: data.dataAiHint || '',
      };
      
      await saveMentorProfile({ profile: profileToSave });
      setEditableProfile(profileToSave);
      
      toast({
        title: "Mentor Profile Updated",
        description: "The public mentor profile has been successfully updated.",
      });
    } catch (err) {
      console.error("Error saving mentor profile:", err);
      toast({ title: "Save Failed", description: "Could not save mentor profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  if (!editableProfile) {
    return <div className="container py-12">No profile data loaded.</div>
  }

  return (
    <>
      <PageHeader
        title="Update Mentor Profile"
        description="Edit the public-facing profile of the mentor."
      />
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start gap-4">
          {imagePreview && (
            <Image
              src={imagePreview}
              alt={editableProfile.name}
              width={80}
              height={80}
              className="rounded-full border-2 border-primary object-cover"
              data-ai-hint={editableProfile.dataAiHint || ''}
            />
          )}
          <div>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <UserCog className="h-6 w-6 mr-2 text-primary"/> Edit: {editableProfile.name}
            </CardTitle>
            <CardDescription>Modify all profile details below. Changes are live upon saving.</CardDescription>
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
               <FormItem>
                  <FormLabel className="flex items-center gap-2"><Upload className="h-4 w-4"/>Profile Image</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>Upload a new image to replace the current one.</FormDescription>
              </FormItem>

               <FormField
                control={form.control}
                name="dataAiHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image AI Hint (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., female mentor portrait" {...field} /></FormControl>
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
                    <FormControl><Textarea rows={6} placeholder="Mentor's biography" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Experience & Achievements</FormLabel>
                    <FormControl><Textarea rows={6} placeholder="Enter each point on a new line..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="philosophy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mentorship Philosophy</FormLabel>
                    <FormControl><Textarea rows={6} placeholder="Mentor's philosophy..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="quote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote</FormLabel>
                    <FormControl><Input placeholder="A short, impactful quote..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
