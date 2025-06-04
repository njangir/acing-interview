
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';

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

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); 
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      isNotRobot: false,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    if (data.email === 'admin@example.com' && data.password === 'adminpass') { // Simple admin check
      login({ email: data.email, name: 'Admin User', isAdmin: true });
      toast({
        title: 'Admin Login Successful (Mock)',
        description: 'Welcome back, Admin! Redirecting...',
      });
      router.push(redirectUrl.startsWith('/admin') ? redirectUrl : '/admin');
    } else if ((data.email === 'user@example.com' || data.email === 'aspirant@example.com') && data.password === 'userpass') { // Regular user or aspirant
       const userName = data.email === 'aspirant@example.com' ? 'Aspirant TestUser' : 'Regular User';
       login({ email: data.email, name: userName, isAdmin: false });
       toast({
        title: 'Login Successful (Mock)',
        description: 'Welcome back! Redirecting...',
      });
      // Prevent non-admin to admin redirect, allow aspirant to go to dashboard (or original redirect)
      router.push(redirectUrl.startsWith('/admin') ? '/dashboard' : redirectUrl);
    }
     else {
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Mock users: user@example.com or aspirant@example.com (userpass) or admin@example.com (adminpass)',
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
            Enter your credentials to access your account. <br/>
            (Try user@example.com, aspirant@example.com / userpass OR admin@example.com / adminpass)
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
                        CAPTCHA
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
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
