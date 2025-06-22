'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { ResourceCard } from "@/components/core/resource-card";
import { MOCK_RESOURCES, MOCK_SERVICES } from "@/constants";
import type { Resource as ResourceType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2, AlertTriangle
import { useAuth } from '@/hooks/use-auth'; // To get current user for entitlements

// PRODUCTION TODO:
// - Import Firebase and Firestore methods:
// import { db } from '@/lib/firebase';
// import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Mock function to simulate fetching user's purchased services
// In a real app, this would come from a backend based on user authentication and their purchases.
// For example, fetch user's profile which contains a list of purchasedServiceIds or query bookings.
const getPurchasedServiceIdsForUser = async (userId: string | undefined): Promise<string[]> => {
  if (!userId) return ['general']; // Default for non-logged-in or if UID is missing
  // Simulate fetching user's purchased services.
  // In a real app:
  // 1. Fetch user's profile from Firestore: `doc(db, "userProfiles", userId)`
  // 2. Extract an array like `userProfile.purchasedServiceIds`
  // OR
  // 1. Fetch user's paid bookings: `query(collection(db, "bookings"), where("uid", "==", userId), where("paymentStatus", "==", "paid"))`
  // 2. Map these bookings to a unique set of `serviceId`s.
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate async fetch
  // For this mock, let's assume the user has purchased the first two mock services, plus 'general' resources
  return [MOCK_SERVICES[0]?.id, MOCK_SERVICES[1]?.id, 'general'].filter(Boolean) as string[];
};

// Separate component that uses useSearchParams
function ResourcesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('service') || 'all';
  const { currentUser, loadingAuth } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [allFetchedResources, setAllFetchedResources] = useState<ResourceType[]>([]);
  const [userAccessibleServiceIds, setUserAccessibleServiceIds] = useState<string[]>(['general']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadingAuth) {
        setIsLoading(true);
        return;
    }

    const fetchUserEntitlementsAndResources = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const accessibleIds = await getPurchasedServiceIdsForUser(currentUser?.uid);
        setUserAccessibleServiceIds(accessibleIds);

        // PRODUCTION TODO: Fetch resources from Firestore
        // const resourcesCol = collection(db, 'resources');
        // Let's assume you want to fetch all resources for simplicity here,
        // or you could query based on accessibleIds directly if your data structure supports it
        // (e.g., where('serviceCategory', 'in', accessibleIds) - requires an index).
        // const resourceSnapshot = await getDocs(resourcesCol);
        // const fetchedResources = resourceSnapshot.docs.map(doc => {
        //   const data = doc.data();
        //   return {
        //     id: doc.id,
        //     ...data,
        //     // Ensure timestamp fields are handled correctly if they exist
        //     // createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        //     // updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        //   } as ResourceType;
        // });
        // setAllFetchedResources(fetchedResources);

        // Simulate API call delay for fetching resources
        await new Promise(resolve => setTimeout(resolve, 700));
        setAllFetchedResources(MOCK_RESOURCES); // Use mock data for now

      } catch (err) {
        console.error("Error fetching resources or entitlements:", err);
        setError("Failed to load resources. Please try again later.");
        setAllFetchedResources(MOCK_RESOURCES); // Fallback to mock on error for demo
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserEntitlementsAndResources();
  }, [currentUser, loadingAuth]);

  const accessibleResources = useMemo(() => {
    return allFetchedResources.filter(resource =>
      userAccessibleServiceIds.includes(resource.serviceCategory)
    );
  }, [allFetchedResources, userAccessibleServiceIds]);

  const serviceCategories = useMemo(() => {
    const categories = new Set(accessibleResources.map(r => r.serviceCategory));
    return Array.from(categories).map(id => {
      const service = MOCK_SERVICES.find(s => s.id === id);
      // Handle "general" category label
      const label = id === 'general' ? 'General Resources' : service ? service.name : id.charAt(0).toUpperCase() + id.slice(1);
      return { value: id, label: label };
    });
  }, [accessibleResources]);

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

  if (!loadingAuth && !currentUser) {
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
  
  if (userAccessibleServiceIds.length === 0 && !isLoading) { // Check after loading and if not general access
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
