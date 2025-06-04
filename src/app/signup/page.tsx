
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
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MailCheck, PhoneCall, ShieldCheck, UserCircle } from 'lucide-react';
import { PREDEFINED_AVATARS, MOCK_BADGES } from '@/constants';
import { cn } from '@/lib/utils';
import type { Badge } from '@/types';

const MOCK_OTP = "123456"; 

const signupFormSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, {message: "Phone number must be at least 10 digits"}),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  imageUrl: z.string().optional(), // For selected avatar
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please complete the CAPTCHA." }),
});

const signupFormSchemaWithOtp = signupFormSchemaBase.extend({
  emailOtp: z.string().min(6, { message: "Email OTP must be 6 digits." }),
  phoneOtp: z.string().min(6, { message: "Phone OTP must be 6 digits." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type SignupFormValues = z.infer<typeof signupFormSchemaWithOtp>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

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
      imageUrl: PREDEFINED_AVATARS[0].url,
      isNotRobot: false,
      emailOtp: '',
      phoneOtp: '',
    },
  });

  const handleSendOtp = (type: 'email' | 'phone') => {
    const emailValue = form.getValues('email');
    const phoneValue = form.getValues('phone');

    if (type === 'email') {
      if (!emailValue || !/^\S+@\S+\.\S+$/.test(emailValue)) {
        form.setError('email', { type: 'manual', message: 'Please enter a valid email to send OTP.' });
        return;
      }
      setEmailOtpSent(true);
      setVerificationStep('emailOtp');
      toast({ title: 'OTP Sent', description: `OTP has been sent to ${emailValue} (Simulated: ${MOCK_OTP})` });
    } else if (type === 'phone') {
      if (!phoneValue || phoneValue.length < 10) {
         form.setError('phone', { type: 'manual', message: 'Please enter a valid 10-digit phone number to send OTP.' });
        return;
      }
      setPhoneOtpSent(true);
      setVerificationStep('phoneOtp');
      toast({ title: 'OTP Sent', description: `OTP has been sent to ${phoneValue} (Simulated: ${MOCK_OTP})` });
    }
  };

  const handleVerifyOtp = (type: 'email' | 'phone') => {
    if (type === 'email') {
      const enteredOtp = form.getValues('emailOtp');
      if (enteredOtp === MOCK_OTP) {
        setEmailVerified(true);
        toast({ title: 'Email Verified', description: 'Your email has been successfully verified.' });
        if (phoneVerified) setVerificationStep('verified');
        else setVerificationStep('phoneOtp'); 
      } else {
        form.setError('emailOtp', { type: 'manual', message: 'Invalid OTP. Please try again.' });
      }
    } else if (type === 'phone') {
      const enteredOtp = form.getValues('phoneOtp');
      if (enteredOtp === MOCK_OTP) {
        setPhoneVerified(true);
        toast({ title: 'Phone Verified', description: 'Your phone number has been successfully verified.' });
        if (emailVerified) setVerificationStep('verified');
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
    
    const defaultBadge = MOCK_BADGES.find(badge => badge.id === 'commendable_effort');
    const awardedBadges: Badge[] = [];
    if (defaultBadge) {
      awardedBadges.push(defaultBadge);
    }

    // Store profile details in localStorage for demo persistence
    const userProfileData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        imageUrl: selectedAvatar,
        awardedBadges: awardedBadges,
    };
    localStorage.setItem(`mockUserProfile_${data.email}`, JSON.stringify(userProfileData));

    login({email: data.email, name: data.name, isAdmin: false, imageUrl: selectedAvatar }); 

    toast({
      title: 'Signup Successful (Mock)',
      description: 'Your account has been created. Redirecting to dashboard...',
    });
    router.push('/dashboard');
  }
  
  const disableDetails = emailOtpSent || phoneOtpSent;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-xl animate-subtle-appear">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-headline text-primary">Create an Account</CardTitle>
          <CardDescription>
            Join us to start your journey to ace the SSB interview.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="mb-6">
                <FormLabel>Choose Your Avatar</FormLabel>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PREDEFINED_AVATARS.map(avatar => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                          if(!disableDetails) {
                            setSelectedAvatar(avatar.url);
                            form.setValue('imageUrl', avatar.url);
                          }
                      }}
                      className={cn(
                        "rounded-full overflow-hidden border-2 transition-all",
                        selectedAvatar === avatar.url ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-primary/50",
                        disableDetails && "cursor-not-allowed opacity-70"
                      )}
                      disabled={disableDetails}
                      aria-label={`Select avatar ${avatar.id}`}
                    >
                      <Image 
                        src={avatar.url} 
                        alt={`Avatar ${avatar.id}`} 
                        width={60} 
                        height={60}
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
                      <Input placeholder="Your full name" {...field} disabled={disableDetails} />
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
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} disabled={emailVerified || disableDetails && !emailOtpSent} />
                      </FormControl>
                      {!emailVerified && !emailOtpSent && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleSendOtp('email')} disabled={emailOtpSent}>
                          Send OTP
                        </Button>
                      )}
                       {emailVerified && <MailCheck className="h-5 w-5 text-green-500" />}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {emailOtpSent && !emailVerified && (
                <FormField
                  control={form.control}
                  name="emailOtp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email OTP</FormLabel>
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
                          <Input type="tel" placeholder="Your 10-digit phone number" {...field} disabled={phoneVerified || disableDetails && !phoneOtpSent} />
                        </FormControl>
                        {!phoneVerified && !phoneOtpSent && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleSendOtp('phone')} disabled={phoneOtpSent}>
                            Send OTP
                            </Button>
                        )}
                        {phoneVerified && <PhoneCall className="h-5 w-5 text-green-500" />}
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {phoneOtpSent && !phoneVerified && (
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={disableDetails} />
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={disableDetails} />
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
                        disabled={disableDetails}
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
                disabled={!emailVerified || !phoneVerified || !form.formState.isValid}
              >
                Sign Up
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

