
import { PageHeader } from "@/components/core/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ)',
  description: 'Find answers to common questions about our SSB mock interviews, counselling, booking process, and payment options for armed forces aspirants.',
};

const FAQ_ITEMS = [
  {
    question: "What is the SSB Interview?",
    answer: "The Services Selection Board (SSB) is an organization that assesses candidates for becoming officers in the Indian Armed Forces. The interview is a comprehensive 5-day process.",
  },
  {
    question: "How can Armed Forces Interview Ace help me?",
    answer: "We provide realistic mock SSB interviews, personalized feedback from experienced mentors (including a 7-time SSB cleared professional), counselling, and guidance to help you understand the process and improve your performance.",
  },
  {
    question: "What services do you offer?",
    answer: "We offer SSB Mock Interviews, Personal Counselling Sessions, AFCAT Exam Guidance, and access to curated resources. Check our Services page for more details.",
  },
  {
    question: "How do I book a session?",
    answer: "You can book a session by navigating to the 'Book Interview' page, selecting your desired service, choosing an available date and time slot, providing your details, and completing the payment (or choosing 'Pay Later' where applicable).",
  },
  {
    question: "What is the 'Pay Later' option?",
    answer: "The 'Pay Later' option allows you to tentatively book a slot. However, these slots are subject to availability and might be allocated to users who pay in advance. Payment will be due before your scheduled session to confirm your participation.",
  },
  {
    question: "How will I receive the meeting link?",
    answer: "Upon successful booking and payment (or confirmation for 'Pay Later'), you will receive an email with the Google Meet/MS Teams link for your session. It will also be available on your user dashboard.",
  },
  {
    question: "Can I reschedule or cancel my booking?",
    answer: "Please refer to our Terms & Conditions for details on rescheduling and cancellation policies. Refund requests can be made up to 2 hours before the scheduled session time via your dashboard.",
  },
];

export default function FAQPage() {
  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about our services and the SSB process."
      />
      <div className="container py-12">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Got Questions?</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left hover:text-accent">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
