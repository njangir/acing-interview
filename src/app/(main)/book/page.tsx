
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_SERVICES } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function BookServiceSelectionPage() {
  return (
    <>
      <PageHeader
        title="Book Your Session"
        description="Select a service below to proceed with booking your mock interview or counselling session."
      />
      <div className="container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_SERVICES.map((service) => (
            <Card key={service.id} className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                {service.image && (
                  <div className="relative h-40 w-full mb-4 rounded-t-lg overflow-hidden">
                    <Image 
                      src={service.image} 
                      alt={service.name} 
                      fill={true}
                      style={{ objectFit: "cover" }}
                      data-ai-hint={service.dataAiHint || 'service related'}
                    />
                  </div>
                )}
                <CardTitle className="font-headline text-xl text-primary">{service.name}</CardTitle>
                <CardDescription className="text-sm h-16 overflow-hidden text-ellipsis">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-2xl font-bold text-primary">₹{service.price}</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href={`/book/${service.id}/slots`}>
                    Select Service <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
