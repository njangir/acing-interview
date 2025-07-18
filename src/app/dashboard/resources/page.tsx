'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { ResourceCard } from "@/components/core/resource-card";
import { resourceService, serviceService } from '@/lib/firebase-services';
import type { Resource as ResourceType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2, AlertTriangle
import { useAuth } from '@/hooks/use-auth'; // To get current user for entitlements

// PRODUCTION TODO:
// - Import Firebase and Firestore methods:
// import { db } from '@/lib/firebase';
// import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Separate component that uses useSearchParams
function ResourcesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('service') || 'all';
  const { user, userProfile, loading } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [allFetchedResources, setAllFetchedResources] = useState<ResourceType[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [userAccessibleServiceIds, setUserAccessibleServiceIds] = useState<string[]>(['general']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all resources
        const resources = await resourceService.getResources();
        setAllFetchedResources(resources);
        // Fetch all services for category labels
        const services = await serviceService.getAllServices();
        setAllServices(services);
        // Determine accessible service IDs
        let accessibleIds: string[] = ['general'];
        if (userProfile && Array.isArray((userProfile as any).purchasedServiceIds)) {
          accessibleIds = [...(userProfile as any).purchasedServiceIds, 'general'];
        }
        setUserAccessibleServiceIds(accessibleIds);
      } catch (err) {
        console.error('Error fetching resources or entitlements:', err);
        setError('Failed to load resources. Please try again later.');
        setAllFetchedResources([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, userProfile, loading]);

  const accessibleResources = useMemo(() => {
    return allFetchedResources.filter(resource =>
      userAccessibleServiceIds.includes(resource.serviceCategory)
    );
  }, [allFetchedResources, userAccessibleServiceIds]);

  const serviceCategories = useMemo(() => {
    const categories = new Set(accessibleResources.map(r => r.serviceCategory));
    return Array.from(categories).map(id => {
      const service = allServices.find((s: any) => s.id === id);
      const label = id === 'general' ? 'General Resources' : service ? service.name : id.charAt(0).toUpperCase() + id.slice(1);
      return { value: id, label: label };
    });
  }, [accessibleResources, allServices]);

  const displayedResources = useMemo(() => {
    if (selectedCategory === 'all') {
      return accessibleResources;
    }
    return accessibleResources.filter(r => r.serviceCategory === selectedCategory);
  }, [selectedCategory, accessibleResources]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="My Resources"
          description="Access documents, videos, and other materials based on your purchased services."
        />
        <div className="container py-12 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error) {
     return (
      <>
        <PageHeader
          title="My Resources"
          description="Access documents, videos, and other materials based on your purchased services."
        />
        <div className="container py-12">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Resources</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (!loading && !user) {
     return (
       <>
        <PageHeader
            title="My Resources"
            description="Access documents, videos, and other materials."
        />
        <div className="container py-8">
             <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertTitle>Login Required</AlertTitle>
                <AlertDescription>
                Please log in to view your accessible resources.
                </AlertDescription>
            </Alert>
        </div>
       </>
    );
  }
  
  if (userAccessibleServiceIds.length === 0 && !isLoading) {
    return (
       <>
        <PageHeader
            title="My Resources"
            description="Access documents, videos, and other materials based on your purchased services."
        />
        <div className="container py-8">
             <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertTitle>No Resources Yet</AlertTitle>
                <AlertDescription>
                You currently do not have access to any specific service resources. General resources may still be available if any.
                </AlertDescription>
            </Alert>
        </div>
       </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Resources"
        description="Access documents, videos, and other materials based on your purchased services."
      />
      <div className="mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Filter by service..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All My Resources</SelectItem>
            {serviceCategories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {displayedResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">
            No resources found for the selected category, or you might not have access to resources for this service yet.
          </p>
        </div>
      )}
    </>
  );
}

// Main component with Suspense boundary
export default function MyResourcesPage() {
  return (
    <Suspense fallback={
      <>
        <PageHeader
          title="My Resources"
          description="Access documents, videos, and other materials based on your purchased services."
        />
        <div className="container py-12 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    }>
      <ResourcesContent />
    </Suspense>
  );
}
