
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
import { UserCircle, Award, ShieldCheck, Briefcase, Edit } from 'lucide-react';
import type { UserProfile, Badge } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { PREDEFINED_AVATARS } from '@/constants';
import { cn } from '@/lib/utils';


const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  imageUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, login: updateAuthContextUser } = useAuth(); 
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedAvatarForForm, setSelectedAvatarForForm] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (currentUser) {
      const mockUserProfileKey = `mockUserProfile_${currentUser.email}`;
      const storedProfile = localStorage.getItem(mockUserProfileKey);
      if (storedProfile) {
        const parsedProfile: UserProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);
        setSelectedAvatarForForm(parsedProfile.imageUrl || PREDEFINED_AVATARS[0].url);
      } else {
        // Initialize from currentUser if no localStorage profile (e.g., first time after signup)
        const initialProfile: UserProfile = {
          name: currentUser.name,
          email: currentUser.email,
          phone: '', // Or some default
          imageUrl: currentUser.imageUrl || PREDEFINED_AVATARS[0].url,
          awardedBadges: [],
        };
        setUserProfile(initialProfile);
        setSelectedAvatarForForm(initialProfile.imageUrl);
        localStorage.setItem(mockUserProfileKey, JSON.stringify(initialProfile));
      }
    }
  }, [currentUser]);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    // values will be set by useEffect below
  });
  
  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        imageUrl: userProfile.imageUrl,
      });
      setSelectedAvatarForForm(userProfile.imageUrl || PREDEFINED_AVATARS[0].url);
    }
  }, [userProfile, form]);


  function onSubmit(data: ProfileFormValues) {
    if (!userProfile || !currentUser) return;

    const updatedProfileData: UserProfile = {
      ...userProfile,
      name: data.name,
      email: data.email, // Assuming email can be changed, though often it's fixed
      phone: data.phone,
      imageUrl: selectedAvatarForForm,
    };
    
    setUserProfile(updatedProfileData);
    localStorage.setItem(`mockUserProfile_${currentUser.email}`, JSON.stringify(updatedProfileData));

    // Update auth context if primary details like name or image changed
    if (currentUser.name !== updatedProfileData.name || currentUser.imageUrl !== updatedProfileData.imageUrl || currentUser.email !== updatedProfileData.email) {
        updateAuthContextUser({
            ...currentUser,
            name: updatedProfileData.name,
            email: updatedProfileData.email, // update email in auth if it changed
            imageUrl: updatedProfileData.imageUrl,
        });
    }
    
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  }

  if (!userProfile) {
    return <div className="container py-12">Loading profile...</div>;
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
                <Image 
                    src={selectedAvatarForForm || userProfile.imageUrl || PREDEFINED_AVATARS[0].url} 
                    alt={userProfile.name} 
                    width={60} 
                    height={60} 
                    className="rounded-full border-2 border-primary"
                    data-ai-hint="user avatar"
                />
                <div>
                    <CardTitle className="font-headline text-2xl text-primary flex items-center">
                        <Edit className="h-6 w-6 mr-2"/> Edit Profile
                    </CardTitle>
                    <CardDescription>Update your personal details and avatar below.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="mb-6">
                    <FormLabel>Choose Your Avatar</FormLabel>
                    <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {PREDEFINED_AVATARS.map(avatar => (
                        <button
                        key={avatar.id}
                        type="button"
                        onClick={() => {
                            setSelectedAvatarForForm(avatar.url);
                            form.setValue('imageUrl', avatar.url);
                        }}
                        className={cn(
                            "rounded-full overflow-hidden border-2 transition-all w-16 h-16 sm:w-20 sm:h-20",
                            selectedAvatarForForm === avatar.url ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-primary/50"
                        )}
                        aria-label={`Select avatar ${avatar.id}`}
                        >
                        <Image 
                            src={avatar.url} 
                            alt={`Avatar ${avatar.id}`} 
                            width={80} 
                            height={80}
                            className="aspect-square object-cover"
                            data-ai-hint={avatar.hint} 
                        />
                        </button>
                    ))}
                    </div>
                     <FormField control={form.control} name="imageUrl" render={() => <FormMessage />} /> 
                </div>

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
