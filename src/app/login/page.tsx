'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Checkbox } from '@/components/ui/checkbox';

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  isNotRobot: z.boolean().refine(val => val === true, { message: "Please complete the CAPTCHA." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Separate component that uses useSearchParams
function LoginContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authContextLogin, user, userProfile, loading } = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      isNotRobot: false,
    },
  });

  // Handle redirection after successful login
  useEffect(() => {
    if (user && userProfile && !loading) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      
      // Check if user has admin role
      const isAdmin = userProfile.roles?.includes('admin') || userProfile.roles?.includes('super-admin');
      
      // Redirect based on user role
      if (isAdmin) {
        router.push(redirectUrl.startsWith('/admin') ? redirectUrl : '/admin');
      } else {
        router.push(redirectUrl.startsWith('/admin') ? '/dashboard' : redirectUrl);
      }
    }
  }, [user, userProfile, loading, router, searchParams]);

  async function onSubmit(data: LoginFormValues) {
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    try {
      // Use the auth context login method - it handles everything automatically
      await authContextLogin(data.email, data.password);
      
      toast({
        title: 'Login Successful!',
        description: 'Welcome back! Redirecting...',
      });

      // Note: User profile will be automatically loaded by the auth context
      // We'll handle redirection in a useEffect that watches for auth changes
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (error.code) { // Firebase error codes
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // For newer SDK versions
            errorMessage = "Invalid email or password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Access temporarily disabled due to too many failed login attempts. Please try again later.";
            break;
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled. Please contact support.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again.";
            break;
          default:
            errorMessage = `Login failed: ${error.message}`;
        }
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-xl animate-subtle-appear">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-headline text-primary">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I'm not a robot
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Login
              </Button>
              <div className="flex flex-col gap-2 text-sm text-center text-muted-foreground">
                <p>
                  Don't have an account?{' '}
                  <Link href="/signup" className="font-medium text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
                <p>
                  <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="inline-block mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-headline text-primary">Loading...</CardTitle>
            <CardDescription>
              Please wait while we load the login page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}