'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth'; // This will also need to be updated to use actual Firebase user
import { Checkbox } from '@/components/ui/checkbox';

// TODO: (Backend) Initialize Firebase in a central firebase.ts or similar config file
// import { auth } from '@/lib/firebase'; // Assuming firebase.ts setup
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore'; // To fetch user profile from Firestore

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
  const { login: authContextLogin } = useAuth(); // Renamed to avoid conflict if using Firebase's login
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

    // PRODUCTION TODO: Replace mock login with Firebase Authentication
    try {
      // const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // const firebaseUser = userCredential.user;

      // if (firebaseUser) {
      //   // Fetch user profile from Firestore to get roles (e.g., isAdmin) and other details
      //   // BACKEND API NEEDED: Secure way to get user roles.
      //   // Option 1: Firestore document for user profiles
      //   // const userDocRef = doc(db, "users", firebaseUser.uid);
      //   // const userDocSnap = await getDoc(userDocRef);
      //   // let userData = { email: firebaseUser.email || '', name: firebaseUser.displayName || 'User', isAdmin: false, imageUrl: firebaseUser.photoURL || undefined };

      //   // if (userDocSnap.exists()) {
      //   //   const profileData = userDocSnap.data();
      //   //   userData.name = profileData.name || userData.name;
      //   //   userData.isAdmin = profileData.isAdmin || false;
      //   //   userData.imageUrl = profileData.imageUrl || userData.imageUrl;
      //   //   // Add any other relevant fields from your user profile document
      //   // } else {
      //   //   // Handle case where user exists in Auth but not in Firestore (e.g., create profile doc)
      //   //   console.warn("User profile not found in Firestore, creating basic profile.");
      //   //   // await setDoc(userDocRef, { email: firebaseUser.email, name: firebaseUser.displayName || 'New User', isAdmin: false, createdAt: serverTimestamp() });
      //   // }

      //   // Option 2: Use Firebase Custom Claims for isAdmin (set via backend/Cloud Function)
      //   // const idTokenResult = await firebaseUser.getIdTokenResult();
      //   // const isAdmin = idTokenResult.claims.admin === true;
      //   // userData.isAdmin = isAdmin;

      //   authContextLogin(userData); // Update auth context with real user data

      //   toast({
      //     title: 'Login Successful!',
      //     description: 'Welcome back! Redirecting...',
      //   });

      //   if (userData.isAdmin) {
      //     router.push(redirectUrl.startsWith('/admin') ? redirectUrl : '/admin');
      //   } else {
      //     router.push(redirectUrl.startsWith('/admin') ? '/dashboard' : redirectUrl);
      //   }
      // }
    // MOCK LOGIN LOGIC - REMOVE/REPLACE THIS BLOCK
    // ========================================================================
    if (data.email === 'admin@example.com' && data.password === 'adminpass') {
      await authContextLogin({ 
        uid: 'mock-admin-uid', 
        email: data.email, 
        displayName: 'Admin User', 
        photoURL: 'https://placehold.co/100x100/EBF4FF/76A9FA?text=AU' 
      });
      toast({
        title: 'Admin Login Successful (Mock)',
        description: 'Welcome back, Admin! Redirecting...',
      });
      router.push(redirectUrl.startsWith('/admin') ? redirectUrl : '/admin');
    } else if ((data.email === 'user@example.com' || data.email === 'aspirant@example.com') && data.password === 'userpass') {
       const userName = data.email === 'aspirant@example.com' ? 'Aspirant TestUser' : 'Regular User';
       const imageUrl = data.email === 'aspirant@example.com' ? 'https://placehold.co/100x100/FFF0EB/FA9F76?text=AT' : 'https://placehold.co/100x100/EBFFF2/76FA91?text=RU';
       await authContextLogin({ 
         uid: data.email === 'aspirant@example.com' ? 'mock-aspirant-uid' : 'mock-user-uid', 
         email: data.email, 
         displayName: userName, 
         photoURL: imageUrl 
       });
       toast({
        title: 'Login Successful (Mock)',
        description: 'Welcome back! Redirecting...',
      });
      router.push(redirectUrl.startsWith('/admin') ? '/dashboard' : redirectUrl);
    }
     else {
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Mock users: user@example.com or aspirant@example.com (userpass) or admin@example.com (adminpass)',
        variant: 'destructive',
      });
    }
    // ========================================================================
    // END OF MOCK LOGIN LOGIC

    } catch (error: any) {
      console.error("Login error:", error);
      //   let errorMessage = "Login failed. Please check your credentials and try again.";
      //   if (error.code) { // Firebase error codes
      //     switch (error.code) {
      //       case 'auth/user-not-found':
      //       case 'auth/wrong-password':
      //       case 'auth/invalid-credential': // For newer SDK versions
      //         errorMessage = "Invalid email or password.";
      //         break;
      //       case 'auth/invalid-email':
      //         errorMessage = "Please enter a valid email address.";
      //         break;
      //       case 'auth/too-many-requests':
      //           errorMessage = "Access temporarily disabled due to too many failed login attempts. Please try again later.";
      //           break;
      //       default:
      //         errorMessage = `Login failed: ${error.message}`;
      //     }
      //   }
      // toast({
      //   title: 'Login Failed',
      //   description: errorMessage,
      //   variant: 'destructive',
      // });
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
            {/* PRODUCTION TODO: Remove mock user hint in production */}
            (Mock: user@example.com / userpass OR admin@example.com / adminpass)
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
    