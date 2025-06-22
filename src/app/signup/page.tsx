
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MailCheck, PhoneCall, ShieldCheck, UserCircle, VenetianMask, Binary, Briefcase } from 'lucide-react';
import { PREDEFINED_AVATARS, MOCK_BADGES } from '@/constants';
import { cn } from '@/lib/utils';
import type { Badge, UserProfile } from '@/types'; // Added UserProfile

// PRODUCTION TODO:
// - Import Firebase auth and firestore instances.
// import { auth, db } from '@/lib/firebase'; // Assuming firebase.ts setup
// import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
// import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const MOCK_OTP = "123456"; // Keep for simulation, actual OTP would be managed by backend/Firebase

const signupFormSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, {message: "Phone number must be at least 10 digits"}),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say'], { required_error: "Please select your gender." }),
  targetOrganization: z.enum(['Army', 'Navy', 'Air Force', 'Other'], { required_error: "Please select your target organization." }),
  imageUrl: z.string().optional(), // Will be set by selectedAvatar
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please complete the CAPTCHA." }),
});

const signupFormSchemaWithOtp = signupFormSchemaBase.extend({
  emailOtp: z.string().min(6, { message: "Email OTP must be 6 digits." }).optional(), // Optional as verification happens step-wise
  phoneOtp: z.string().min(6, { message: "Phone OTP must be 6 digits." }).optional(), // Optional
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type SignupFormValues = z.infer<typeof signupFormSchemaWithOtp>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login: authContextLogin } = useAuth(); // Renamed to avoid conflict if using Firebase's login

  const [verificationStep, setVerificationStep] = useState<'details' | 'emailOtp' | 'phoneOtp' | 'verified'>('details');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(PREDEFINED_AVATARS[0].url);


  const form = useForm<SignupFormValues>({
    resolver: zodResolver(verificationStep === 'details' ? signupFormSchemaBase : signupFormSchemaWithOtp),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      gender: undefined,
      targetOrganization: undefined,
      imageUrl: PREDEFINED_AVATARS[0].url,
      isNotRobot: false,
      emailOtp: '',
      phoneOtp: '',
    },
  });

  const handleSendOtp = async (type: 'email' | 'phone') => {
    const emailValue = form.getValues('email');
    const phoneValue = form.getValues('phone');

    if (type === 'email') {
      if (!emailValue || !/^\S+@\S+\.\S+$/.test(emailValue)) {
        form.setError('email', { type: 'manual', message: 'Please enter a valid email to send OTP.' });
        return;
      }
      // PRODUCTION TODO:
      // - For actual email OTP/verification, Firebase sends a verification link.
      // - You might integrate a custom OTP service if needed, or rely on Firebase's email verification flow.
      // - Example: await sendEmailVerification(auth.currentUser); // If user is already partially created.
      setEmailOtpSent(true);
      setVerificationStep('emailOtp');
      toast({ title: 'OTP Sent (Simulated)', description: `For production, email verification link would be sent to ${emailValue}. Mock OTP: ${MOCK_OTP}` });
    } else if (type === 'phone') {
      if (!phoneValue || phoneValue.length < 10) {
         form.setError('phone', { type: 'manual', message: 'Please enter a valid 10-digit phone number to send OTP.' });
        return;
      }
      // PRODUCTION TODO:
      // - Integrate Firebase Phone Authentication (e.g., signInWithPhoneNumber). This involves reCAPTCHA.
      // - This will send a real OTP to the user's phone.
      // - Example: const confirmationResult = await signInWithPhoneNumber(auth, "+91" + phoneValue, appVerifier);
      // - window.confirmationResult = confirmationResult;
      setPhoneOtpSent(true);
      setVerificationStep('phoneOtp');
      toast({ title: 'OTP Sent (Simulated)', description: `OTP has been sent to ${phoneValue}. Mock OTP: ${MOCK_OTP}` });
    }
  };

  const handleVerifyOtp = async (type: 'email' | 'phone') => {
    if (type === 'email') {
      const enteredOtp = form.getValues('emailOtp');
      // PRODUCTION TODO:
      // - For email verification link, user clicks the link, Firebase handles it.
      // - If using custom OTP, verify against your backend.
      if (enteredOtp === MOCK_OTP) { // Mock verification
        setEmailVerified(true);
        toast({ title: 'Email Verified (Simulated)', description: 'Your email has been successfully verified.' });
        if (phoneVerified) setVerificationStep('verified');
        else if (!phoneOtpSent) setVerificationStep('details');
        else setVerificationStep('phoneOtp');
      } else {
        form.setError('emailOtp', { type: 'manual', message: 'Invalid OTP. Please try again.' });
      }
    } else if (type === 'phone') {
      const enteredOtp = form.getValues('phoneOtp');
      // PRODUCTION TODO:
      // - Verify phone OTP using Firebase: await window.confirmationResult.confirm(enteredOtp);
      if (enteredOtp === MOCK_OTP) { // Mock verification
        setPhoneVerified(true);
        toast({ title: 'Phone Verified (Simulated)', description: 'Your phone number has been successfully verified.' });
        if (emailVerified) setVerificationStep('verified');
        else if (!emailOtpSent) setVerificationStep('details');
        else setVerificationStep('emailOtp');
      } else {
        form.setError('phoneOtp', { type: 'manual', message: 'Invalid OTP. Please try again.' });
      }
    }
  };


  async function onSubmit(data: SignupFormValues) {
    if (!emailVerified || !phoneVerified) {
      toast({ title: 'Verification Required', description: 'Please verify both email and phone number.', variant: 'destructive' });
      return;
    }
    
    try {
      // PRODUCTION TODO: Firebase User Creation
      // const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      // const firebaseUser = userCredential.user;
      // if (!firebaseUser) throw new Error("User creation failed.");

      // // Send email verification if not automatically handled or if you want to prompt again
      // // await sendEmailVerification(firebaseUser);
      // // toast({ title: 'Verification Email Sent', description: 'Please check your email to verify your account.' });

      // Simulate Firebase user creation for mock
      const mockFirebaseUser = {
        uid: `mock-uid-${Date.now()}`, // Generate a mock UID
        email: data.email,
        displayName: data.name,
        photoURL: selectedAvatar,
      };
      // END OF PRODUCTION TODO

      const defaultBadge = MOCK_BADGES.find(badge => badge.id === 'commendable_effort');
      const awardedBadgeIds: string[] = [];
      if (defaultBadge) {
        awardedBadgeIds.push(defaultBadge.id);
      }

      const userProfileForDb: UserProfile = {
        uid: mockFirebaseUser.uid, // Use UID from actual Firebase user
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        targetOrganization: data.targetOrganization,
        imageUrl: selectedAvatar,
        awardedBadges: awardedBadgeIds
          .map(id => MOCK_BADGES.find(badge => badge.id === id))
          .filter((badge): badge is Badge => !!badge),
        roles: [], // Default roles, could be ['user']
        createdAt: new Date().toISOString(), // For Firestore, use serverTimestamp()
        updatedAt: new Date().toISOString(), // For Firestore, use serverTimestamp()
      }
      // PRODUCTION TODO: Create User Profile in Firestore
      // const userDocRef = doc(db, "userProfiles", firebaseUser.uid);
      // await setDoc(userDocRef, {
      //   ...userProfileForDb,
      //   createdAt: serverTimestamp(), // Use Firestore server timestamp
      //   updatedAt: serverTimestamp(), // Use Firestore server timestamp
      // });

      // MOCK: Save to localStorage for persistence in prototype
      localStorage.setItem(`mockUserProfile_${data.email}`, JSON.stringify(userProfileForDb));
      // END OF PRODUCTION TODO


      // Update auth context - pass data that matches AuthContextUser structure
      await authContextLogin({
        uid: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        displayName: mockFirebaseUser.displayName,
        photoURL: mockFirebaseUser.photoURL,
      });


      toast({
        title: 'Signup Successful!', // Removed (Mock)
        description: 'Your account has been created. Redirecting to dashboard...',
      });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Signup error:", error);
      // PRODUCTION TODO: Handle Firebase specific errors
      // let errorMessage = "Signup failed. Please try again.";
      // if (error.code) {
      //   switch (error.code) {
      //     case 'auth/email-already-in-use':
      //       errorMessage = "This email address is already in use.";
      //       form.setError("email", { type: "manual", message: errorMessage });
      //       break;
      //     case 'auth/invalid-email':
      //       errorMessage = "Please enter a valid email address.";
      //       form.setError("email", { type: "manual", message: errorMessage });
      //       break;
      //     case 'auth/weak-password':
      //       errorMessage = "Password is too weak. Please choose a stronger password.";
      //       form.setError("password", { type: "manual", message: errorMessage });
      //       break;
      //     default:
      //       errorMessage = `Signup failed: ${error.message}`;
      //   }
      // }
      toast({
        title: 'Signup Failed (Simulated)',
        description: error.message || "An unexpected error occurred.",
        variant: 'destructive',
      });
    }
  }
  
  const disableDetails = emailOtpSent || phoneOtpSent || emailVerified || phoneVerified;
  const disableBasicInfo = verificationStep !== 'details' && (emailVerified || phoneVerified);


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
                          if(!disableBasicInfo) {
                            setSelectedAvatar(avatar.url);
                            form.setValue('imageUrl', avatar.url);
                          }
                      }}
                      className={cn(
                        "rounded-full overflow-hidden border-2 transition-all w-16 h-16",
                        selectedAvatar === avatar.url ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-primary/50",
                        disableBasicInfo && "cursor-not-allowed opacity-70"
                      )}
                      disabled={disableBasicInfo}
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
                      <Input placeholder="Your full name" {...field} disabled={disableBasicInfo} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disableBasicInfo}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disableBasicInfo}>
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
                        <Input type="email" placeholder="you@example.com" {...field} disabled={emailVerified || (verificationStep !== 'details' && verificationStep !== 'emailOtp')} />
                      </FormControl>
                      {!emailVerified && verificationStep === 'details' && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleSendOtp('email')} disabled={emailOtpSent || emailVerified}>
                          Send OTP
                        </Button>
                      )}
                       {emailVerified && <MailCheck className="h-5 w-5 text-green-500" />}
                    </div>
                     {/* PRODUCTION Note: Firebase email verification sends a link, not an OTP to enter here.
                         This UI is for a custom OTP system or demonstration. */}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {emailOtpSent && !emailVerified && verificationStep === 'emailOtp' && (
                <FormField
                  control={form.control}
                  name="emailOtp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email OTP (Simulated - Use {MOCK_OTP})</FormLabel>
                       <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder="Enter 6-digit OTP" {...field} />
                          </FormControl>
                          <Button type="button" size="sm" onClick={() => handleVerifyOtp('email')}>Verify Email</Button>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                     <div className="flex items-center gap-2">
                        <FormControl>
                          <Input type="tel" placeholder="Your 10-digit phone number" {...field} disabled={phoneVerified || (verificationStep !== 'details' && verificationStep !== 'phoneOtp')} />
                        </FormControl>
                        {!phoneVerified && verificationStep === 'details' && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleSendOtp('phone')} disabled={phoneOtpSent || phoneVerified}>
                            Send OTP
                            </Button>
                        )}
                        {phoneVerified && <PhoneCall className="h-5 w-5 text-green-500" />}
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {phoneOtpSent && !phoneVerified && verificationStep === 'phoneOtp' &&(
                 <FormField
                  control={form.control}
                  name="phoneOtp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone OTP (Simulated - Use {MOCK_OTP})</FormLabel>
                       <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder="Enter 6-digit OTP" {...field} />
                          </FormControl>
                          <Button type="button" size="sm" onClick={() => handleVerifyOtp('phone')}>Verify Phone</Button>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="•••••••• (min. 8 characters)" {...field} disabled={disableBasicInfo} />
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={disableBasicInfo} />
                    </FormControl>
                    <FormMessage />
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
                        disabled={disableBasicInfo}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        CAPTCHA <ShieldCheck className="inline h-4 w-4 text-muted-foreground" />
                      </FormLabel>
                      <FormDescription>
                        Please confirm you're not a robot.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!emailVerified || !phoneVerified || !form.formState.isValid || form.formState.isSubmitting}
              >
                Complete Enlistment
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

