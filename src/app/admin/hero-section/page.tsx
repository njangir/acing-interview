
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
import { LayoutDashboard, Loader2, AlertTriangle, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { functions, storage } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HeroSectionData } from '@/types';

const saveHeroSection = httpsCallable(functions, 'saveHeroSection');

const heroSectionSchema = z.object({
  heroTitle: z.string().min(10, "Title must be at least 10 characters."),
  heroSubtitle: z.string().min(20, "Subtitle must be at least 20 characters."),
  heroCtaText: z.string().min(5, "Button text must be at least 5 characters."),
  heroImageUrl: z.string().url("A valid image URL is required.").optional().or(z.literal('')),
  heroDataAiHint: z.string().max(50, "AI hint should be concise.").optional(),
});

type HeroSectionFormValues = z.infer<typeof heroSectionSchema>;

export default function AdminHeroSectionPage() {
  const { toast } = useToast();
  const [heroData, setHeroData] = useState<HeroSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const heroDocRef = doc(db, 'siteContent', 'homePage');

  const form = useForm<HeroSectionFormValues>({
    resolver: zodResolver(heroSectionSchema),
  });

  useEffect(() => {
    const fetchHeroData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const docSnap = await getDoc(heroDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as HeroSectionData;
          setHeroData(data);
          form.reset(data);
          setImagePreview(data.heroImageUrl || null);
        } else {
            const defaultData: HeroSectionData = {
                heroTitle: 'Crack Your SSB Interview with Expert Guidance',
                heroSubtitle: 'Led by a 4-time SSB recommended professional. Get personalized mock interviews, in-depth feedback, and proven strategies to achieve your armed forces dream.',
                heroCtaText: 'Book Your Interview Now',
                heroImageUrl: 'https://placehold.co/600x450.png',
                heroDataAiHint: 'interview coaching',
            };
            setHeroData(defaultData);
            form.reset(defaultData);
            setImagePreview(defaultData.heroImageUrl);
        }
      } catch (err) {
        console.error("Error fetching hero section data:", err);
        setError("Failed to load hero section data. Check Firestore permissions.");
      }
      setIsLoading(false);
    };
    fetchHeroData();
  }, [form, heroDocRef]);

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

  async function onSubmit(data: HeroSectionFormValues) {
    setIsSaving(true);
    let finalImageUrl = heroData?.heroImageUrl || '';

    if (imageFile) {
        try {
            const imageFileName = `hero_section_${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
            const imageRef = storageRef(storage, `site_content/${imageFileName}`);
            await uploadBytes(imageRef, imageFile);
            finalImageUrl = await getDownloadURL(imageRef);
        } catch (uploadError) {
            console.error("Error uploading hero image:", uploadError);
            toast({ title: "Image Upload Failed", description: "Could not upload the new hero image.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
    }

    const dataToSave: HeroSectionData = {
        ...data,
        heroImageUrl: finalImageUrl,
    };
    
    try {
      await saveHeroSection({ heroData: dataToSave });
      setHeroData(dataToSave);
      
      toast({
        title: "Hero Section Updated",
        description: "The homepage hero section has been successfully updated.",
      });
    } catch (err) {
      console.error("Error saving hero section:", err);
      toast({ title: "Save Failed", description: "Could not save hero section data.", variant: "destructive" });
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

  return (
    <>
      <PageHeader
        title="Manage Home Page Hero"
        description="Edit the content of the main hero section on your landing page."
      />
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start gap-4">
          <LayoutDashboard className="h-8 w-8 text-primary flex-shrink-0 mt-1"/>
          <div>
            <CardTitle className="font-headline text-2xl text-primary">
                Hero Section Content
            </CardTitle>
            <CardDescription>Modify all hero details below. Changes are live upon saving.</CardDescription>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="heroTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline / Title</FormLabel>
                    <FormControl><Input placeholder="Hero section main title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heroSubtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl><Textarea rows={4} placeholder="Hero section subtitle or description" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                control={form.control}
                name="heroCtaText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call-to-Action Button Text</FormLabel>
                    <FormControl><Input placeholder="e.g., Book a Session" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormItem>
                  <FormLabel className="flex items-center gap-2"><Upload className="h-4 w-4"/>Hero Image</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>Upload a new image to replace the current one. Recommended size: 600x450px.</FormDescription>
              </FormItem>

              {imagePreview && (
                  <div className="flex justify-center">
                      <Image src={imagePreview} alt="Hero image preview" width={300} height={225} className="rounded-md border object-contain" />
                  </div>
              )}

               <FormField
                control={form.control}
                name="heroDataAiHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image AI Hint (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., interview coaching, indian army" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isSaving ? 'Saving...' : 'Save Hero Section'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
