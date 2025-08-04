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

export default function ResourcesClient() {
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

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user's accessible service IDs
        const accessibleServiceIds = await getPurchasedServiceIdsForUser(currentUser?.uid);
        setUserAccessibleServiceIds(accessibleServiceIds);

        // Fetch all services
        const servicesCol = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesCol);
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        })) as Service[];
        setAllServices(servicesData);

        // Fetch resources for accessible services
        const resourcesCol = collection(db, "resources");
        const resourcesQuery = query(resourcesCol, where("serviceId", "in", accessibleServiceIds));
        const resourcesSnapshot = await getDocs(resourcesQuery);
        
        const resourcesData = resourcesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        })) as ResourceType[];

        setAllFetchedResources(resourcesData);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Failed to load resources. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, loadingAuth]);

  // Filter resources based on selected category
  const filteredResources = useMemo(() => {
    if (selectedCategory === 'all') {
      return allFetchedResources;
    }
    return allFetchedResources.filter(resource => resource.serviceId === selectedCategory);
  }, [allFetchedResources, selectedCategory]);

  // Get accessible services for the dropdown
  const accessibleServices = useMemo(() => {
    return allServices.filter(service => userAccessibleServiceIds.includes(service.id));
  }, [allServices, userAccessibleServiceIds]);

  if (loadingAuth || isLoading) {
    return (
      <>
        <PageHeader
          title="My Resources"
          description="Access your purchased study materials and resources."
        />
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="My Resources"
          description="Access your purchased study materials and resources."
        />
        <div className="container py-12">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <PageHeader
          title="My Resources"
          description="Access your purchased study materials and resources."
        />
        <div className="container py-12">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>Please log in to access your resources.</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Resources"
        description="Access your purchased study materials and resources."
      />
      
      <div className="container py-12">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {accessibleServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No resources found</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCategory === 'all' 
                ? "You don't have access to any resources yet. Purchase a service to get started."
                : "No resources available for the selected service."
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
