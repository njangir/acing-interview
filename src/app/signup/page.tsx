
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MailCheck, PhoneCall, ShieldCheck, UserCircle, VenetianMask, Binary, Briefcase, Loader2 } from 'lucide-react';
import { PREDEFINED_AVATARS, MOCK_BADGES } from '@/constants';
import { cn } from '@/lib/utils';
import type { Badge, UserProfile } from '@/types'; 
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


const MOCK_OTP = "123456"; // This is for simulation only and will be removed. Real OTPs are handled by Firebase.

const signupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, {message: "Phone number must be at least 10 digits"}),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say'], { required_error: "Please select your gender." }),
  targetOrganization: z.enum(['Army', 'Navy', 'Air Force', 'Other'], { required_error: "Please select your target organization." }),
  imageUrl: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login: authContextLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(PREDEFINED_AVATARS[0].url);


  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      gender: undefined,
      targetOrganization: undefined,
      imageUrl: PREDEFINED_AVATARS[0].url,
    },
  });


  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) throw new Error("User creation failed in Firebase Auth.");

      // 2. Send email verification
      await sendEmailVerification(firebaseUser);
      toast({ title: 'Verification Email Sent', description: 'Please check your email to verify your account.' });

      const defaultBadge = MOCK_BADGES.find(badge => badge.id === 'commendable_effort');
      const awardedBadgeIds: string[] = [];
      if (defaultBadge) {
        awardedBadgeIds.push(defaultBadge.id);
      }
      
      // 3. Create user profile document in Firestore
      const userProfileForDb: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'uid' | 'awardedBadges'> & { awardedBadgeIds: string[], roles: string[] } = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        targetOrganization: data.targetOrganization,
        imageUrl: selectedAvatar,
        awardedBadgeIds: awardedBadgeIds,
        roles: ['user'], // Default role
      };

      const userDocRef = doc(db, "userProfiles", firebaseUser.uid);
      await setDoc(userDocRef, {
        ...userProfileForDb,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. Log the user in to the application context (this doesn't re-authenticate, just sets context)
      await authContextLogin(firebaseUser.email, data.password);

      toast({
        title: 'Signup Successful!',
        description: 'Your account has been created. Redirecting to dashboard...',
      });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Signup failed. Please try again.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This email address is already in use.";
            form.setError("email", { type: "manual", message: errorMessage });
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            form.setError("email", { type: "manual", message: errorMessage });
            break;
          case 'auth/weak-password':
            errorMessage = "Password is too weak. Please choose a stronger password.";
            form.setError("password", { type: "manual", message: errorMessage });
            break;
          default:
            errorMessage = `An unexpected error occurred. Please try again.`;
        }
      }
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-xl animate-subtle-appear">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-headline text-primary">Enlist Now</CardTitle>
          <CardDescription>
            Join us to start your journey to ace the SSB interview.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="mb-6">
                <FormLabel>Choose Your Avatar</FormLabel>
                <div className="mt-2 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {PREDEFINED_AVATARS.map(avatar => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                          if(!isLoading) {
                            setSelectedAvatar(avatar.url);
                            form.setValue('imageUrl', avatar.url);
                          }
                      }}
                      className={cn(
                        "rounded-full overflow-hidden border-2 transition-all w-16 h-16",
                        selectedAvatar === avatar.url ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-primary/50",
                        isLoading && "cursor-not-allowed opacity-70"
                      )}
                      disabled={isLoading}
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
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} disabled={isLoading} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                    </div>
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
                     <div className="flex items-center gap-2">
                        <FormControl>
                          <Input type="tel" placeholder="Your 10-digit phone number" {...field} disabled={isLoading} />
                        </FormControl>
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="•••••••• (min. 8 characters)" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isLoading ? 'Processing...' : 'Complete Enlistment'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
