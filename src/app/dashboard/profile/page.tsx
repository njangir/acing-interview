
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import Image from 'next/image';

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Award, ShieldCheck, Briefcase } from 'lucide-react';
import type { UserProfile, Badge } from '@/types';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Mock user data - in a real app, this would come from auth/backend
const MOCK_USER_DATA: UserProfile = {
  name: "Aspirant User",
  email: "aspirant@example.com",
  phone: "9876543210",
  awardedBadges: [], // Will be populated from localStorage for demo
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_DATA);

  useEffect(() => {
    // For demo: Try to load awarded badges from localStorage (set by admin page)
    const mockUserProfileKey = `mockUserProfile_${MOCK_USER_DATA.email}`;
    const storedProfile = localStorage.getItem(mockUserProfileKey);
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setUserProfile(prev => ({
        ...prev,
        name: parsedProfile.name || prev.name, // Keep existing form if name not in stored
        email: parsedProfile.email || prev.email,
        phone: parsedProfile.phone || prev.phone,
        awardedBadges: parsedProfile.awardedBadges || []
      }));
    }
  }, []);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: { // Use `values` instead of `defaultValues` to reflect dynamically loaded profile
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
    },
    // defaultValues: MOCK_USER_DATA, // Load user data here
  });
  
  // Update form when userProfile state changes (e.g., badges loaded)
  useEffect(() => {
    form.reset({
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
    });
  }, [userProfile, form]);


  function onSubmit(data: ProfileFormValues) {
    console.log("Profile updated:", data); // Mock API call
    
    // Simulate saving profile and keeping badges
    const updatedProfile = { ...userProfile, ...data };
    setUserProfile(updatedProfile);
    const mockUserProfileKey = `mockUserProfile_${data.email}`;
    localStorage.setItem(mockUserProfileKey, JSON.stringify(updatedProfile));

    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  }

  return (
    <>
      <PageHeader
        title="My Profile & Achievements"
        description="Manage your personal information, account settings, and view your earned badges."
      />
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <UserCircle className="h-12 w-12 text-primary"/>
              <div>
                  <CardTitle className="font-headline text-2xl text-primary">Profile Information</CardTitle>
                  <CardDescription>Update your personal details below.</CardDescription>
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
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Your email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="md:col-span-1 shadow-lg">
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-accent"/>
                    <div>
                        <CardTitle className="font-headline text-xl text-primary">My Badges</CardTitle>
                        <CardDescription>Your earned achievements.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {userProfile.awardedBadges && userProfile.awardedBadges.length > 0 ? (
                    userProfile.awardedBadges.map((badge: Badge) => (
                        <Card key={badge.id} className="p-4 bg-secondary/50 border-border shadow-sm">
                            <div className="flex items-center gap-3">
                                <Image 
                                    src={badge.imageUrl} 
                                    alt={badge.name} 
                                    width={60} 
                                    height={60} 
                                    className="rounded-md border-2 border-accent"
                                    data-ai-hint={badge.dataAiHint}
                                />
                                <div>
                                    <h4 className="font-semibold text-md text-primary">{badge.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {badge.force === 'Air Force' ? <Briefcase className="inline h-3 w-3 mr-1 text-blue-500" /> :
                                         badge.force === 'Army' ? <ShieldCheck className="inline h-3 w-3 mr-1 text-green-500" /> :
                                         badge.force === 'Navy' ? <Anchor className="inline h-3 w-3 mr-1 text-sky-500" /> : null}
                                        {badge.force} - {badge.rankName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No badges earned yet. Keep up the good work!</p>
                )}
            </CardContent>
        </Card>
      </div>
    </>
  );
}

// Dummy Anchor icon if not available in lucide-react, or use a generic one
const Anchor = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/>
  </svg>
);

