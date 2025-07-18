'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
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
import { MailCheck, PhoneCall, ShieldCheck, VenetianMask, Binary, Briefcase } from 'lucide-react';
import { PREDEFINED_AVATARS, MOCK_BADGES } from '@/constants';
import { cn } from '@/lib/utils';
import type { Badge, UserProfile } from '@/types';

// Firebase imports
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Phone verification imports
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const signupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say'], { required_error: "Please select your gender." }),
  targetOrganization: z.enum(['Army', 'Navy', 'Air Force', 'Other'], { required_error: "Please select your target organization." }),
  imageUrl: z.string().optional(),
  phoneOtp: z.string().min(6, { message: "Phone OTP must be 6 digits." }).optional(),
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please complete the CAPTCHA." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

// Declare global variable for confirmation result
declare global {
  interface Window {
    confirmationResult: ConfirmationResult;
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login: authContextLogin } = useAuth();

  const [verificationStep, setVerificationStep] = useState<'details' | 'phoneOtp' | 'verified'>('details');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(PREDEFINED_AVATARS[0].url);
  const [isLoading, setIsLoading] = useState(false);

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
      isNotRobot: false,
      phoneOtp: '',
    },
  });

  const setupRecaptcha = () => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          toast({
            title: 'reCAPTCHA Expired',
            description: 'Please try sending the OTP again.',
            variant: 'destructive',
          });
        }
      });
    }
  };

  const handleSendPhoneOtp = async () => {
    const phoneValue = form.getValues('phone');
    
    if (!phoneValue || phoneValue.length < 10) {
      form.setError('phone', { 
        type: 'manual', 
        message: 'Please enter a valid 10-digit phone number to send OTP.' 
      });
      return;
    }

    setIsLoading(true);
    
    try {
      setupRecaptcha();
      
      // Format phone number with country code
      const formattedPhone = `+91${phoneValue}`;
      
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        window.recaptchaVerifier
      );
      
      window.confirmationResult = confirmationResult;
      setPhoneOtpSent(true);
      setVerificationStep('phoneOtp');
      
      toast({
        title: 'OTP Sent',
        description: `OTP has been sent to ${phoneValue}`,
      });
    } catch (error: any) {
      console.error('Phone OTP send error:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'reCAPTCHA verification failed. Please try again.';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: 'OTP Send Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const enteredOtp = form.getValues('phoneOtp');
    
    if (!enteredOtp || enteredOtp.length !== 6) {
      form.setError('phoneOtp', { 
        type: 'manual', 
        message: 'Please enter a valid 6-digit OTP.' 
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await window.confirmationResult.confirm(enteredOtp);
      setPhoneVerified(true);
      setVerificationStep('verified');
      
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been successfully verified.',
      });
    } catch (error: any) {
      console.error('Phone OTP verification error:', error);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      }
      
      form.setError('phoneOtp', { 
        type: 'manual', 
        message: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async (firebaseUser: User, formData: SignupFormValues) => {
    const defaultBadge = MOCK_BADGES.find((badge: { id: string; }) => badge.id === 'commendable_effort');
    const awardedBadgeIds: string[] = [];
    if (defaultBadge) {
      awardedBadgeIds.push(defaultBadge.id);
    }

    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      targetOrganization: formData.targetOrganization,
      imageUrl: selectedAvatar,
      awardedBadges: awardedBadgeIds
        .map(id => MOCK_BADGES.find((badge: { id: string; }) => badge.id === id))
        .filter((badge): badge is Badge => !!badge),
      roles: ['user'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create user profile in Firestore
    const userDocRef = doc(db, "userProfiles", firebaseUser.uid);
    await setDoc(userDocRef, {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return userProfile;
  };

  async function onSubmit(data: SignupFormValues) {
    if (!phoneVerified) {
      toast({ 
        title: 'Phone Verification Required', 
        description: 'Please verify your phone number first.',
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const firebaseUser = userCredential.user;
      
      if (!firebaseUser) {
        throw new Error("User creation failed.");
      }

      // Send email verification
      await sendEmailVerification(firebaseUser);
      setEmailVerified(true);

      // Create user profile in Firestore
      await createUserProfile(firebaseUser, data);

      // Update auth context
      // await authContextLogin({
      //   uid: firebaseUser.uid,
      //   email: firebaseUser.email,
      //   displayName: firebaseUser.displayName || data.name,
      //   photoURL: firebaseUser.photoURL || selectedAvatar,
      // });

      toast({
        title: 'Signup Successful!',
        description: 'Your account has been created. Please check your email for verification. Redirecting to dashboard...',
      });

      // Clean up reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

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
          case 'auth/operation-not-allowed':
            errorMessage = "Email/password accounts are not enabled. Please contact support.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again.";
            break;
          default:
            errorMessage = `Signup failed: ${error.message}`;
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

  const disableBasicInfo = verificationStep !== 'details' && phoneVerified;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      {/* Hidden reCAPTCHA container */}
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
                        if (!disableBasicInfo) {
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
                        <SelectItem value="Male">
                          <VenetianMask className="inline h-4 w-4 mr-2 text-blue-500"/>Male
                        </SelectItem>
                        <SelectItem value="Female">
                          <VenetianMask className="inline h-4 w-4 mr-2 text-pink-500"/>Female
                        </SelectItem>
                        <SelectItem value="Other">
                          <Binary className="inline h-4 w-4 mr-2 text-purple-500"/>Other
                        </SelectItem>
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
                        <SelectItem value="Army">
                          <Briefcase className="inline h-4 w-4 mr-2 text-green-600"/>Indian Army
                        </SelectItem>
                        <SelectItem value="Navy">
                          <Briefcase className="inline h-4 w-4 mr-2 text-sky-600"/>Indian Navy
                        </SelectItem>
                        <SelectItem value="Air Force">
                          <Briefcase className="inline h-4 w-4 mr-2 text-blue-500"/>Indian Air Force
                        </SelectItem>
                        <SelectItem value="Other">
                          <Briefcase className="inline h-4 w-4 mr-2 text-gray-500"/>Other/Undecided
                        </SelectItem>
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
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                          disabled={disableBasicInfo} 
                        />
                      </FormControl>
                      {emailVerified && <MailCheck className="h-5 w-5 text-green-500" />}
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
                        <Input 
                          type="tel" 
                          placeholder="Your 10-digit phone number" 
                          {...field} 
                          disabled={phoneVerified || verificationStep === 'phoneOtp'} 
                        />
                      </FormControl>
                      {!phoneVerified && verificationStep === 'details' && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSendPhoneOtp} 
                          disabled={phoneOtpSent || phoneVerified || isLoading}
                        >
                          {isLoading ? 'Sending...' : 'Send OTP'}
                        </Button>
                      )}
                      {phoneVerified && <PhoneCall className="h-5 w-5 text-green-500" />}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {phoneOtpSent && !phoneVerified && verificationStep === 'phoneOtp' && (
                <FormField
                  control={form.control}
                  name="phoneOtp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone OTP</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Enter 6-digit OTP" {...field} />
                        </FormControl>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleVerifyPhoneOtp}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Verifying...' : 'Verify'}
                        </Button>
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
                      <Input 
                        type="password" 
                        placeholder="•••••••• (min. 8 characters)" 
                        {...field} 
                        disabled={disableBasicInfo} 
                      />
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
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        disabled={disableBasicInfo} 
                      />
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
                disabled={!phoneVerified || !form.formState.isValid || form.formState.isSubmitting || isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Complete Enlistment'}
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