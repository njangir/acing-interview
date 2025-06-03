
import { PageHeader } from "@/components/core/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ADMIN_DASHBOARD_NAV_LINKS } from "@/constants";
import { ArrowRight } from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard Overview"
        description="Welcome to the admin panel. Manage your application's content and operations from here."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ADMIN_DASHBOARD_NAV_LINKS.filter(link => link.href !== '/admin').map((link) => {
          const Icon = link.icon;
          return (
            <Card key={link.href} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium font-headline text-primary">{link.label}</CardTitle>
                <Icon className="h-6 w-6 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription>Manage {link.label.toLowerCase()}.</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={link.href}>
                    Go to {link.label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
