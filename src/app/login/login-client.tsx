
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
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

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginClient() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authContextLogin, loginWithGoogle, resendVerificationEmail, sendPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleRedirect = (isAdmin: boolean) => {
    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    if (isAdmin) {
      router.push(redirectUrl.startsWith('/admin') ? redirectUrl : '/admin');
    } else {
      router.push(redirectUrl.startsWith('/admin') ? '/dashboard' : redirectUrl);
    }
  };

  async function handleResendVerification() {
    setIsLoading(true);
    try {
        await resendVerificationEmail();
        toast({
            title: "Verification Email Sent",
            description: "A new verification link has been sent to your email address.",
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to resend verification email. Please try again later.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const { isAdmin } = await authContextLogin(data.email, data.password);
      toast({ title: 'Login Successful!', description: 'Welcome back! Redirecting...' });
      handleRedirect(isAdmin);
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please check your credentials and try again.";
      if (error.message === 'Email not verified') {
        toast({
          title: "Email Not Verified",
          description: "Please check your inbox and verify your email address before logging in.",
          variant: "destructive",
          action: (
            <Button variant="secondary" size="sm" onClick={handleResendVerification}>
              Resend Email
            </Button>
          ),
        });
      } else if (error.code) { // Firebase error codes
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = "Invalid email or password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
          case 'auth/too-many-requests':
              errorMessage = "Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.";
              break;
          default:
            errorMessage = `An unexpected error occurred. Please try again.`;
        }
        if(error.message !== 'Email not verified') {
            toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
        }
      }
    } finally {
        setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const { isAdmin, isNewUser } = await loginWithGoogle();
      if (isNewUser) {
        toast({ title: 'Welcome!', description: 'Please complete your profile to continue.' });
        router.push('/dashboard/profile?new-user=true');
      } else {
        toast({ title: 'Login Successful!', description: 'Welcome back! Redirecting...' });
        handleRedirect(isAdmin);
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      // Handle specific Google sign-in errors if necessary
      if (error.code === 'auth/popup-closed-by-user') {
        toast({ title: 'Login Cancelled', description: 'You closed the Google sign-in window before completion.', variant: 'default' });
      } else {
        toast({ title: 'Google Login Failed', description: 'Could not sign in with Google. Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const handleForgotPassword = async () => {
    const email = form.getValues('email');
    if (!email) {
      form.setError('email', { type: 'manual', message: 'Please enter your email to reset the password.' });
      return;
    }
    // Clear any previous errors on the email field
    form.clearErrors('email');

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${email}, a password reset link has been sent.`,
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "Could not send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


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
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading} />
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
                    <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 font-normal"
                            onClick={handleForgotPassword}
                            disabled={isLoading || isGoogleLoading}
                            tabIndex={-1}
                        >
                            Forgot Password?
                        </Button>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </CardFooter>
          </form>
        </Form>
        <div className="relative px-6 pb-4">
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
        </div>
        <CardFooter className="flex flex-col gap-4">
             <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
                {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
