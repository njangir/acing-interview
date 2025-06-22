
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Award, ShieldCheck, Briefcase, Edit, Anchor as AnchorIconLucide, VenetianMask, Binary, Loader2 } from 'lucide-react'; // Added Loader2
import type { UserProfile, Badge } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { PREDEFINED_AVATARS } from '@/constants';
import { cn } from '@/lib/utils';

// PRODUCTION TODO: Import Firebase and Firestore methods
// import { db } from '@/lib/firebase';
// import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).or(z.literal('')),
  imageUrl: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  targetOrganization: z.enum(['Army', 'Navy', 'Air Force', 'Other']).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, login: updateAuthContextUser, loadingAuth } = useAuth(); // updateAuthContextUser can be used if login function in useAuth handles updates
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedAvatarForForm, setSelectedAvatarForForm] = useState<string | undefined>(undefined);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      imageUrl: PREDEFINED_AVATARS[0].url,
      gender: undefined,
      targetOrganization: undefined,
    },
  });

  useEffect(() => {
    if (loadingAuth) {
      setIsLoadingProfile(true);
      return;
    }
    if (!currentUser) {
      setIsLoadingProfile(false);
      // Optionally redirect to login if no user
      // router.push('/login?redirect=/dashboard/profile');
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        // PRODUCTION TODO: Fetch UserProfile from Firestore
        // const userDocRef = doc(db, "userProfiles", currentUser.uid);
        // const userDocSnap = await getDoc(userDocRef);
        // let loadedProfileData: UserProfile;

        // if (userDocSnap.exists()) {
        //   loadedProfileData = userDocSnap.data() as UserProfile;
        //   // Ensure awardedBadges is an array (Firestore might return undefined if field doesn't exist)
        //   loadedProfileData.awardedBadges = loadedProfileData.awardedBadges || [];
        // } else {
        //   // Profile doesn't exist, create a default one (or redirect to a setup page)
        //   console.warn(`Profile not found for user ${currentUser.uid}, creating default.`);
        //   loadedProfileData = {
        //     uid: currentUser.uid,
        //     name: currentUser.name,
        //     email: currentUser.email,
        //     phone: '',
        //     imageUrl: currentUser.imageUrl || PREDEFINED_AVATARS[0].url,
        //     awardedBadges: [], // Or assign default badges
        //     gender: undefined,
        //     targetOrganization: undefined,
        //     createdAt: new Date().toISOString(), // For Firestore, use serverTimestamp() on creation
        //     updatedAt: new Date().toISOString(), // For Firestore, use serverTimestamp() on creation
        //   };
        //   // Optionally save this new default profile to Firestore
        //   // await setDoc(userDocRef, { ...loadedProfileData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        // }

        // MOCK: Using localStorage as a stand-in for Firestore
        const mockUserProfileKey = `mockUserProfile_${currentUser.email}`;
        const storedProfile = localStorage.getItem(mockUserProfileKey);
        let loadedProfileData: UserProfile;

        if (storedProfile) {
          loadedProfileData = JSON.parse(storedProfile);
          // Ensure awardedBadges is an array
          loadedProfileData.awardedBadges = loadedProfileData.awardedBadges || [];
        } else {
          // Fallback if no profile in localStorage, create a basic one from auth context
          loadedProfileData = {
            uid: currentUser.uid,
            name: currentUser.name,
            email: currentUser.email,
            phone: '',
            imageUrl: currentUser.imageUrl || PREDEFINED_AVATARS[0].url,
            awardedBadges: [], // PRODUCTION: Could assign a default "Welcome" badge here
            gender: undefined,
            targetOrganization: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(mockUserProfileKey, JSON.stringify(loadedProfileData));
        }
        // END MOCK

        setUserProfile(loadedProfileData);
        form.reset({
          name: loadedProfileData.name,
          email: loadedProfileData.email,
          phone: loadedProfileData.phone || '',
          imageUrl: loadedProfileData.imageUrl || PREDEFINED_AVATARS[0].url,
          gender: loadedProfileData.gender,
          targetOrganization: loadedProfileData.targetOrganization,
        });
        setSelectedAvatarForForm(loadedProfileData.imageUrl || PREDEFINED_AVATARS[0].url);

      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({ title: "Error", description: "Could not load your profile. Please try again.", variant: "destructive" });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, form, toast, loadingAuth]);

  async function onSubmit(data: ProfileFormValues) {
    if (!userProfile || !currentUser) {
        toast({ title: "Error", description: "User session not found. Please re-login.", variant: "destructive" });
        return;
    }

    setIsSaving(true);

    const updatedProfileData: UserProfile = {
      ...userProfile, // Preserve awardedBadges, uid, createdAt and other non-form fields
      name: data.name,
      // email: data.email, // Email generally shouldn't be changed by user directly this way, handle separately if needed
      phone: data.phone,
      imageUrl: selectedAvatarForForm,
      gender: data.gender,
      targetOrganization: data.targetOrganization,
      updatedAt: new Date().toISOString(), // For Firestore, use serverTimestamp()
    };

    try {
      // PRODUCTION TODO: Save updatedProfileData to Firestore
      // const userDocRef = doc(db, "userProfiles", currentUser.uid);
      // await setDoc(userDocRef, { ...updatedProfileData, updatedAt: serverTimestamp() }, { merge: true }); // Use merge:true to avoid overwriting fields not in form

      // MOCK: Save to localStorage
      localStorage.setItem(`mockUserProfile_${currentUser.email}`, JSON.stringify(updatedProfileData));
      // END MOCK

      setUserProfile(updatedProfileData); // Update local state

      // Update AuthContext if core identifiable info changed
      if (currentUser.name !== updatedProfileData.name || currentUser.imageUrl !== updatedProfileData.imageUrl) {
          // The login function in useAuth needs to be able to handle partial updates or fetch fresh profile for context
          // For this mock, we assume `updateAuthContextUser` (which is `login` from context) can take the new minimal data.
          // In a real app, after updating Firestore, you might re-fetch the minimal user data for the auth context
          // or rely on an onSnapshot listener if you have one for the user profile.
          await updateAuthContextUser({
            ...currentUser, // Pass existing UID, email, isAdmin
            displayName: updatedProfileData.name,
            photoURL: updatedProfileData.imageUrl,
          });
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
        console.error("Error saving profile:", error);
        toast({ title: "Save Failed", description: "Could not save your profile. Please try again.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  if (isLoadingProfile || loadingAuth) {
    return (
        <div className="container py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading your dossier...</p>
        </div>
    );
  }

  if (!userProfile) {
    return <div className="container py-12">User profile could not be loaded. Please ensure you are logged in.</div>;
  }

  return (
    <>
      <PageHeader
        title="My Dossier & Commendations"
        description="Manage your personal information, operational preferences, and view your earned badges."
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
                        <Edit className="h-6 w-6 mr-2"/> Edit Dossier
                    </CardTitle>
                    <CardDescription>Update your personal details and preferences below.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="mb-6">
                    <FormLabel>Choose Your Avatar</FormLabel>
                    <div className="mt-2 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                    {PREDEFINED_AVATARS.map(avatar => (
                        <button
                        key={avatar.id}
                        type="button"
                        onClick={() => {
                            setSelectedAvatarForForm(avatar.url);
                            form.setValue('imageUrl', avatar.url); // Keep form in sync if needed, though selectedAvatarForForm is primary for saving
                        }}
                        className={cn(
                            "rounded-full overflow-hidden border-2 transition-all w-16 h-16",
                            selectedAvatarForForm === avatar.url ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-primary/50"
                        )}
                        aria-label={`Select avatar ${avatar.id}`}
                        >
                        <Image
                            src={avatar.url}
                            alt={`Avatar ${avatar.id}`}
                            width={64}
                            height={64}
                            className="aspect-square object-cover"
                            data-ai-hint={avatar.hint}
                        />
                        </button>
                    ))}
                    </div>
                     {/* This FormField is for potential error messages related to imageUrl if direct input was allowed */}
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
                      <FormLabel>Email Address (Cannot be changed here)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Your email address" {...field} readOnly disabled className="bg-muted/50"/>
                      </FormControl>
                      <FormMessage />
                      {/* PRODUCTION TODO: Add note or link on how to change email if supported via a secure process */}
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
                <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Male"><VenetianMask className="inline h-4 w-4 mr-2 text-blue-500"/>Male</SelectItem>
                            <SelectItem value="Female"><VenetianMask className="inline h-4 w-4 mr-2 text-pink-500"/>Female</SelectItem>
                            <SelectItem value="Other"><Binary className="inline h-4 w-4 mr-2 text-purple-500"/>Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="targetOrganization"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Organization</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select your target organization" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Army"><Briefcase className="inline h-4 w-4 mr-2 text-green-600"/>Indian Army</SelectItem>
                            <SelectItem value="Navy"><Briefcase className="inline h-4 w-4 mr-2 text-sky-600"/>Indian Navy</SelectItem>
                            <SelectItem value="Air Force"><Briefcase className="inline h-4 w-4 mr-2 text-blue-500"/>Indian Air Force</SelectItem>
                            <SelectItem value="Other"><Briefcase className="inline h-4 w-4 mr-2 text-gray-500"/>Other/Undecided</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="md:col-span-1 shadow-lg">
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-accent"/>
                    <div>
                        <CardTitle className="font-headline text-xl text-primary">My Commendations</CardTitle>
                        <CardDescription>Your earned achievements.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* PRODUCTION TODO: If awardedBadges stores only IDs, you'd fetch badge details here. */}
                {/* For now, assuming full Badge objects are in userProfile.awardedBadges. */}
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
                                         badge.force === 'Navy' ? <AnchorIconLucide className="inline h-3 w-3 mr-1 text-sky-500" /> : null}
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