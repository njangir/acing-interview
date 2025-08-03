import { useState, useEffect } from 'react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Declare global variable for confirmation result
declare global {
  interface Window {
    confirmationResult: ConfirmationResult;
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

interface UseRecaptchaOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  size?: 'normal' | 'compact' | 'invisible';
  onVerified?: () => void;
  onExpired?: () => void;
  onError?: (error: any) => void;
}

export function useRecaptcha({
  containerRef,
  size = 'normal',
  onVerified,
  onExpired,
  onError
}: UseRecaptchaOptions) {
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeRecaptcha = () => {
      if (
        typeof window !== 'undefined' &&
        !window.recaptchaVerifier &&
        containerRef.current
      ) {
        if (!auth) {
          console.error('Firebase auth object is undefined! Check your Firebase config and initialization.');
          setIsInitializing(false);
          onError?.(new Error('Firebase auth object is undefined!'));
          toast({
            title: 'reCAPTCHA Error',
            description: 'Firebase auth is not initialized. Please check your environment variables and reload.',
            variant: 'destructive',
          });
          return;
        }
        try {
          console.log('RecaptchaVerifier will use auth:', auth);
          window.recaptchaVerifier = new RecaptchaVerifier(auth, containerRef.current, {
            size,
            callback: () => {
              setRecaptchaReady(true);
              onVerified?.();
              toast({
                title: 'reCAPTCHA Verified',
                description: 'Verification completed successfully.',
              });
            },
            'expired-callback': () => {
              setRecaptchaReady(false);
              onExpired?.();
              toast({
                title: 'reCAPTCHA Expired',
                description: 'Please complete the reCAPTCHA again.',
                variant: 'destructive',
              });
            }
          });

          window.recaptchaVerifier.render().then(() => {
            console.log('reCAPTCHA rendered successfully');
            setIsInitializing(false);
          });
        } catch (error) {
          console.error('Error initializing reCAPTCHA:', error);
          setIsInitializing(false);
          onError?.(error);
          toast({
            title: 'reCAPTCHA Error',
            description: 'Failed to initialize reCAPTCHA. Please refresh the page.',
            variant: 'destructive',
          });
        }
      } else {
        setIsInitializing(false);
      }
    };

    // Wait for DOM to be ready
    if (typeof window !== 'undefined') {
      setTimeout(initializeRecaptcha, 1000);
    }

    // Cleanup function
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (err) {
          // Ignore errors if already destroyed
          console.warn('reCAPTCHA clear error (safe to ignore if destroyed):', err);
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, [containerRef, size]);

  const resetRecaptcha = () => {
    if (window.recaptchaVerifier && containerRef.current) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerRef.current, {
        size,
        callback: () => setRecaptchaReady(true),
        'expired-callback': () => setRecaptchaReady(false)
      });
      window.recaptchaVerifier.render();
    }
  };

  const clearRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }
  };

  return {
    recaptchaReady,
    isInitializing,
    resetRecaptcha,
    clearRecaptcha,
    recaptchaVerifier: window.recaptchaVerifier
  };
} 