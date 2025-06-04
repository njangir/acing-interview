
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { PageHeader } from '@/components/core/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MOCK_SERVICES, USER_FORM_FIELDS } from '@/constants';
import type { Service } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, MailCheck, PhoneCall } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MOCK_OTP = "123456"; // For simulation

const formSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  examApplied: z.string().min(2, { message: "Please specify exams applied for." }),
  previousAttempts: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(0).optional()
  ),
});

const formSchemaWithOtp = formSchemaBase.extend({
  emailOtp: z.string().min(6, { message: "Email OTP must be 6 digits." }),
  phoneOtp: z.string().min(6, { message: "Phone OTP must be 6 digits." }),
});

type FormValues = z.infer<typeof formSchemaWithOtp>;


export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { toast } = useToast();
  
  const [service, setService] = useState<Service | null>(null);
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'details' | 'emailOtp' | 'phoneOtp' | 'verified'>('details');


  const form = useForm<FormValues>({
    resolver: zodResolver(verificationStep === 'details' ? formSchemaBase : formSchemaWithOtp),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      examApplied: "",
      previousAttempts: 0,
      emailOtp: "",
      phoneOtp: "",
    },
  });

  useEffect(() => {
    const currentService = MOCK_SERVICES.find(s => s.id === serviceId);
    if (currentService) {
      setService(currentService);
    } else {
      setError("Service not found.");
    }

    const storedDetails = localStorage.getItem('bookingDetails');
    if (storedDetails) {
      setBookingInfo(JSON.parse(storedDetails));
    } else {
      setError("Booking slot information not found. Please select a slot first.");
    }
  }, [serviceId]);

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


  function onSubmit(values: FormValues) {
    if (!emailVerified || !phoneVerified) {
      toast({ title: 'Verification Required', description: 'Please verify both email and phone number.', variant: 'destructive' });
      return;
    }
    // Exclude OTP fields from being stored
    const { emailOtp, phoneOtp, ...userDetailsToStore } = values;
    localStorage.setItem('userDetails', JSON.stringify(userDetailsToStore));
    router.push(`/book/${serviceId}/payment`);
  }

  if (error && (!service || !bookingInfo)) {
     return (
      <div className="container py-12">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} Please try selecting service and slot again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!service || !bookingInfo) {
    return <div className="container py-12">Loading details...</div>;
  }
  
  const disableDetails = emailOtpSent || phoneOtpSent;


  return (
    <>
      <PageHeader
        title={`Your Details for ${service.name}`}
        description="Please provide your information and verify email/phone to complete the booking."
      />
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Enter Your Details</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {USER_FORM_FIELDS.map((fieldConfig) => {
                  const fieldName = fieldConfig.name as keyof FormValues;
                  return (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName}
                      render={({ field: formFieldRender }) => (
                        <FormItem>
                          <FormLabel>{fieldConfig.label}</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input 
                                type={fieldConfig.type} 
                                placeholder={fieldConfig.placeholder} 
                                {...formFieldRender} 
                                disabled={
                                  (fieldName === 'email' && (emailVerified || (disableDetails && !emailOtpSent))) ||
                                  (fieldName === 'phone' && (phoneVerified || (disableDetails && !phoneOtpSent))) ||
                                  (disableDetails && fieldName !== 'email' && fieldName !== 'phone' && fieldName !== 'emailOtp' && fieldName !== 'phoneOtp')
                                }
                              />
                            </FormControl>
                            {fieldName === 'email' && !emailVerified && !emailOtpSent && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleSendOtp('email')} disabled={emailOtpSent}>
                                Send OTP
                              </Button>
                            )}
                            {fieldName === 'email' && emailVerified && <MailCheck className="h-5 w-5 text-green-500" />}
                            {fieldName === 'phone' && !phoneVerified && !phoneOtpSent && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleSendOtp('phone')} disabled={phoneOtpSent}>
                                Send OTP
                              </Button>
                            )}
                             {fieldName === 'phone' && phoneVerified && <PhoneCall className="h-5 w-5 text-green-500" />}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}

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
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={!emailVerified || !phoneVerified || !form.formState.isValid}
                >
                  Proceed to Payment
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </>
  );
}
