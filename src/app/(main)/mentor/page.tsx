
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MENTOR_PROFILE } from "@/constants";
import { CheckCircle, Award, MessageSquareHeart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function MentorProfilePage() {
  return (
    <>
      <PageHeader
        title="Meet Your Mentor"
        description={`Learn about the expertise and experience of ${MENTOR_PROFILE.name}.`}
      />
      <div className="container py-12">
        <Card className="max-w-4xl mx-auto shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-secondary/50 p-6 flex flex-col items-center justify-center">
              <Image
                src={MENTOR_PROFILE.imageUrl}
                alt={MENTOR_PROFILE.name}
                width={200}
                height={200}
                className="rounded-full shadow-lg border-4 border-primary mb-4"
                data-ai-hint={MENTOR_PROFILE.dataAiHint}
              />
              <h2 className="text-2xl font-bold font-headline text-primary text-center">{MENTOR_PROFILE.name}</h2>
              <p className="text-sm text-muted-foreground text-center">{MENTOR_PROFILE.title}</p>
            </div>
            <div className="md:w-2/3">
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">About {MENTOR_PROFILE.name.split(' ')[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground/80 leading-relaxed">
                  {MENTOR_PROFILE.bio}
                </p>

                <div>
                  <h3 className="text-lg font-semibold font-headline text-primary mb-2 flex items-center">
                    <Award className="mr-2 h-5 w-5 text-accent" />
                    Key Experience & Achievements
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground list-inside">
                    {MENTOR_PROFILE.experience.map((item, index) => (
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
                  <p className="text-sm text-muted-foreground italic">
                    "{MENTOR_PROFILE.philosophy}"
                  </p>
                </div>
                 <blockquote className="border-l-4 border-accent pl-4 py-2 my-4 bg-secondary/30">
                  <p className="text-md font-medium text-primary/90">
                    {MENTOR_PROFILE.quote}
                  </p>
                </blockquote>
                <div className="text-center md:text-right pt-4">
                  <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transform hover:scale-105 transition-transform duration-300">
                    <Link href="/services">Book a Session with {MENTOR_PROFILE.name.split(' ')[0]}</Link>
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
