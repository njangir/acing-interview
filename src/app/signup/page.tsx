
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
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );


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
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  async function handleGoogleSignup() {
    setIsGoogleLoading(true);
    try {
      const { isAdmin, isNewUser } = await loginWithGoogle();
      if (isNewUser) {
        toast({ title: 'Welcome!', description: 'Please complete your profile to continue.' });
        router.push('/dashboard/profile?new-user=true');
      } else {
        toast({ title: 'Login Successful!', description: 'Welcome back! Redirecting...' });
        router.push(isAdmin ? '/admin' : '/dashboard');
      }
    } catch (error: any) {
      console.error("Google signup error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast({ title: 'Sign Up Cancelled', description: 'You closed the Google sign-up window before completion.', variant: 'default' });
      } else {
        toast({ title: 'Google Sign Up Failed', description: 'Could not sign up with Google. Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }


  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    // PRODUCTION TODO: Implement a multi-step UI for OTP verification.
    // 1. After form validation, call a function to send OTP.
    //    const verifier = await setupRecaptcha('recaptcha-container');
    //    const confirmationResult = await sendOtp(data.phone, verifier);
    //    // Store confirmationResult in state and show OTP input field.
    // 2. When user submits OTP, call a verification function.
    //    await verifyOtp(confirmationResult, otpFromUser);
    // 3. If OTP is correct, then proceed with the rest of the user creation logic below.
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) throw new Error("User creation failed in Firebase Auth.");

      // Send email verification
      await sendEmailVerification(firebaseUser);
      toast({ title: 'Verification Email Sent', description: 'Please check your email to verify your account.' });

      // The onUserCreate Firebase Function will now handle Firestore profile creation.
      // We no longer need to manually setDoc from the client here.
      
      toast({
        title: 'Account Created!',
        description: 'Please check your inbox to verify your email address before logging in.',
      });
      router.push('/login'); // Redirect to login page after signup

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
       <div id="recaptcha-container"></div>
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
                        (isLoading || isGoogleLoading) && "cursor-not-allowed opacity-70"
                      )}
                      disabled={isLoading || isGoogleLoading}
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
                      <Input placeholder="Your full name" {...field} disabled={isLoading || isGoogleLoading} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isGoogleLoading}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isGoogleLoading}>
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
                        <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading} />
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
                          <Input type="tel" placeholder="Your 10-digit phone number" {...field} disabled={isLoading || isGoogleLoading} />
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
                      <Input type="password" placeholder="•••••••• (min. 8 characters)" {...field} disabled={isLoading || isGoogleLoading} />
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
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
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isLoading ? 'Processing...' : 'Complete Enlistment'}
              </Button>
            </CardFooter>
          </form>
        </Form>

         <div className="relative px-6 pb-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
            </div>
        </div>

        <CardFooter className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
                {isGoogleLoading ? 'Redirecting...' : 'Sign up with Google'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
