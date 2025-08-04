'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Award, ShieldCheck, Briefcase, Edit, Anchor as AnchorIconLucide, VenetianMask, Binary, Loader2 } from 'lucide-react'; 
import type { UserProfile, Badge } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { PREDEFINED_AVATARS } from '@/constants';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// PRODUCTION TODO: Import Firebase and Firestore methods
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).or(z.literal('')),
  imageUrl: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  targetOrganization: z.enum(['Army', 'Navy', 'Air Force', 'Other']).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileClient() {
  const { toast } = useToast();
  const { currentUser, loadingAuth } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedAvatarForForm, setSelectedAvatarForForm] = useState<string | undefined>(undefined);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new-user') === 'true';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      imageUrl: '',
      gender: undefined,
      targetOrganization: undefined,
    },
  });

  // Load user profile data
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingProfile(false);
      return;
    }

    const loadUserProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setUserProfile(profileData);
          
          // Update form with existing data
          form.reset({
            name: profileData.name || '',
            email: profileData.email || currentUser.email || '',
            phone: profileData.phone || '',
            imageUrl: profileData.imageUrl || '',
            gender: profileData.gender,
            targetOrganization: profileData.targetOrganization,
          });
          
          setSelectedAvatarForForm(profileData.imageUrl);
        } else {
          // New user - set email from auth
          form.reset({
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            phone: '',
            imageUrl: '',
            gender: undefined,
            targetOrganization: undefined,
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [currentUser, form, toast]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const profileData: UserProfile = {
        uid: currentUser.uid,
        name: values.name,
        email: values.email,
        phone: values.phone || '',
        imageUrl: selectedAvatarForForm || values.imageUrl || '',
        gender: values.gender,
        targetOrganization: values.targetOrganization,
        createdAt: userProfile?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
        ...(userProfile ? {} : { createdAt: serverTimestamp() })
      }, { merge: true });

      setUserProfile(profileData);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      if (isNewUser) {
        // Redirect to dashboard after successful profile creation
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingAuth || isLoadingProfile) {
    return (
      <>
        <PageHeader
          title="Profile"
          description="Manage your account information and preferences."
        />
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <PageHeader
          title="Profile"
          description="Manage your account information and preferences."
        />
        <div className="container py-12">
          <Alert>
            <UserCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>Please log in to access your profile.</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isNewUser ? "Complete Your Profile" : "Profile"}
        description={isNewUser ? "Please complete your profile to get started." : "Manage your account information and preferences."}
      />
      
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Avatar Selection */}
                  <div className="space-y-4">
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {PREDEFINED_AVATARS.map((avatar) => (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setSelectedAvatarForForm(avatar.url)}
                          className={cn(
                            "relative aspect-square rounded-full border-2 transition-all hover:scale-105",
                            selectedAvatarForForm === avatar.url
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-muted-foreground/20 hover:border-primary/50"
                          )}
                        >
                          <Image
                            src={avatar.url}
                            alt={avatar.hint}
                            fill
                            className="rounded-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} disabled />
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
                            <Input placeholder="Enter your phone number" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
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
                        <FormItem className="md:col-span-2">
                          <FormLabel>Target Organization</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target organization" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Army">Army</SelectItem>
                              <SelectItem value="Navy">Navy</SelectItem>
                              <SelectItem value="Air Force">Air Force</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isNewUser ? "Complete Profile" : "Update Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Badges Section */}
          {userProfile?.awardedBadges && userProfile.awardedBadges.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Badges
                </CardTitle>
                <CardDescription>
                  Achievements and certifications you've earned.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userProfile.awardedBadges.map((badge, index) => (
                    <div key={badge.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {badge.imageUrl ? (
                          <img 
                            src={badge.imageUrl} 
                            alt={badge.name}
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <Award className="h-8 w-8 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{badge.name}</h4>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{badge.force} - {badge.rankName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
