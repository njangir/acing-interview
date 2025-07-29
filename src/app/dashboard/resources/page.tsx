
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { ResourceCard } from "@/components/core/resource-card";
import type { Resource as ResourceType, Service } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';


const getPurchasedServiceIdsForUser = async (userId: string | undefined): Promise<string[]> => {
  if (!userId) return ['general']; 
  
  const bookingsCol = collection(db, "bookings");
  const q = query(bookingsCol, where("uid", "==", userId), where("paymentStatus", "==", "paid"));
  const bookingsSnapshot = await getDocs(q);
  
  const serviceIds = new Set<string>(['general']); // All users get general resources
  bookingsSnapshot.forEach(doc => {
    serviceIds.add(doc.data().serviceId);
  });
  
  return Array.from(serviceIds);
};

export default function MyResourcesPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('service') || 'all';
  const { currentUser, loadingAuth } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [allFetchedResources, setAllFetchedResources] = useState<ResourceType[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
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
        const [accessibleIds, servicesSnapshot, resourcesSnapshot] = await Promise.all([
          getPurchasedServiceIdsForUser(currentUser?.uid),
          getDocs(collection(db, 'services')),
          getDocs(collection(db, 'resources'))
        ]);
        
        setUserAccessibleServiceIds(accessibleIds);
        
        const fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setAllServices(fetchedServices);

        const fetchedResources = resourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceType));
        setAllFetchedResources(fetchedResources);

      } catch (err) {
        console.error("Error fetching resources or entitlements:", err);
        setError("Failed to load resources. Please try again later.");
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
      const service = allServices.find(s => s.id === id);
      const label = id === 'general' ? 'General Resources' : service ? service.name : id.charAt(0).toUpperCase() + id.slice(1);
      return { value: id, label: label };
    }).sort((a,b) => a.label.localeCompare(b.label));
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
  
  if (userAccessibleServiceIds.length === 1 && userAccessibleServiceIds.includes('general') && !isLoading) {
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
                You currently do not have access to any specific service resources. Book a service to get access to more materials.
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
            No resources found for the selected category.
          </p>
        </div>
      )}
    </>
  );
}
