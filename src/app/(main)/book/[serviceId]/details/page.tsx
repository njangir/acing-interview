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
import { XCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  examApplied: z.string().min(2, { message: "Please specify exams applied for." }),
  previousAttempts: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(0).optional()
  ),
});

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  
  const [service, setService] = useState<Service | null>(null);
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      examApplied: "",
      previousAttempts: 0,
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
      // Optionally redirect: router.push(`/book/${serviceId}/slots`);
    }
  }, [serviceId, router]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    localStorage.setItem('userDetails', JSON.stringify(values));
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

  return (
    <>
      <PageHeader
        title={`Your Details for ${service.name}`}
        description="Please provide your information to complete the booking."
      />
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Enter Your Details</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {USER_FORM_FIELDS.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name as keyof z.infer<typeof formSchema>}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          <Input type={field.type} placeholder={field.placeholder} {...formField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
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
