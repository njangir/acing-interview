
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MentorProfileData } from '@/types';
import { CheckCircle, Award, MessageSquareHeart, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Metadata } from 'next';

async function getMentorProfile(): Promise<MentorProfileData | null> {
  try {
    const mentorDocRef = doc(db, 'siteProfiles', 'mainMentor'); 
    const mentorDocSnap = await getDoc(mentorDocRef);
    if (mentorDocSnap.exists()) {
      return mentorDocSnap.data() as MentorProfileData;
    }
    return null;
  } catch (err) {
    console.error("Error fetching mentor profile for metadata:", err);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const mentor = await getMentorProfile();

  if (!mentor) {
    return {
      title: "Meet Your Mentor",
      description: "Learn about the expertise and experience of our lead mentor at Armed Forces Interview Ace.",
    }
  }

  return {
    title: `Meet Your Mentor - ${mentor.name}`,
    description: `${mentor.bio.substring(0, 155)}... Learn more about the experience and mentorship philosophy of ${mentor.name}.`,
  }
}

// This is a Server Component, so data fetching can be done directly.
export default async function MentorProfilePage() {
  let mentorProfile: MentorProfileData | null = null;
  let error: string | null = null;

  try {
    const mentorDocRef = doc(db, 'siteProfiles', 'mainMentor'); 
    const mentorDocSnap = await getDoc(mentorDocRef);

    if (mentorDocSnap.exists()) {
      mentorProfile = mentorDocSnap.data() as MentorProfileData;
    } else {
      error = "The mentor profile could not be found. It may not have been configured yet.";
      console.warn("Mentor profile document not found in Firestore at 'siteProfiles/mainMentor'.");
    }
  } catch (err) {
    console.error("Error fetching mentor profile:", err);
    error = "There was an error fetching the mentor's profile. Please try again later.";
  }
  
  if (error || !mentorProfile) {
    return (
      <div className="container py-12">
        <PageHeader title="Meet Your Mentor" description="Learn about the expertise and experience of our mentor." />
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Profile Not Available</AlertTitle>
            <AlertDescription>{error || "Could not load mentor profile."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Meet Your Mentor"
        description={`Learn about the expertise and experience of ${mentorProfile.name}.`}
      />
      <div className="container py-12">
        <Card className="max-w-4xl mx-auto shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-secondary/50 p-6 flex flex-col items-center justify-center">
              <Image
                src={mentorProfile.imageUrl}
                alt={mentorProfile.name}
                width={200}
                height={200}
                className="rounded-full shadow-lg border-4 border-primary mb-4"
                data-ai-hint={mentorProfile.dataAiHint}
              />
              <h2 className="text-2xl font-bold font-headline text-primary text-center">{mentorProfile.name}</h2>
              <p className="text-sm text-muted-foreground text-center">{mentorProfile.title}</p>
            </div>
            <div className="md:w-2/3">
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">About {mentorProfile.name.split(' ')[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {mentorProfile.bio}
                </p>

                <div>
                  <h3 className="text-lg font-semibold font-headline text-primary mb-2 flex items-center">
                    <Award className="mr-2 h-5 w-5 text-accent" />
                    Key Experience & Achievements
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground list-inside">
                    {mentorProfile.experience.map((item, index) => (
                      <li key={index} className="flex">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-accent flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold font-headline text-primary mb-2 flex items-center">
                     <MessageSquareHeart className="mr-2 h-5 w-5 text-accent" />
                    Mentorship Philosophy
                  </h3>
                  <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                    "{mentorProfile.philosophy}"
                  </p>
                </div>
                 <blockquote className="border-l-4 border-accent pl-4 py-2 my-4 bg-secondary/30">
                  <p className="text-md font-medium text-primary/90">
                    {mentorProfile.quote}
                  </p>
                </blockquote>
                <div className="text-center md:text-right pt-4">
                  <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transform hover:scale-105 transition-transform duration-300">
                    <Link href="/services">Book a Session with {mentorProfile.name.split(' ')[0]}</Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
