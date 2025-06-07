
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/core/page-header";
import { ResourceCard } from "@/components/core/resource-card";
import { MOCK_RESOURCES, MOCK_SERVICES } from "@/constants";
import type { Resource as ResourceType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen } from 'lucide-react';

// Mock function to simulate fetching user's purchased services
// In a real app, this would come from a backend based on user authentication
const getPurchasedServiceIds = (): string[] => {
  // For demo, assume user has purchased the first two services
  return [MOCK_SERVICES[0].id, MOCK_SERVICES[1].id, 'general'];
};

export default function MyResourcesPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('service') || 'all';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [accessibleResources, setAccessibleResources] = useState<ResourceType[]>([]);

  const purchasedServiceIds = useMemo(() => getPurchasedServiceIds(), []);

  useEffect(() => {
    // Filter resources based on purchased services
    const filtered = MOCK_RESOURCES.filter(resource =>
      purchasedServiceIds.includes(resource.serviceCategory)
    );
    setAccessibleResources(filtered);
  }, [purchasedServiceIds]);

  const serviceCategories = useMemo(() => {
    const categories = new Set(accessibleResources.map(r => r.serviceCategory));
    return Array.from(categories).map(id => {
      const service = MOCK_SERVICES.find(s => s.id === id);
      return { value: id, label: service ? service.name : id.charAt(0).toUpperCase() + id.slice(1) };
    });
  }, [accessibleResources]);

  const displayedResources = useMemo(() => {
    if (selectedCategory === 'all') {
      return accessibleResources;
    }
    return accessibleResources.filter(r => r.serviceCategory === selectedCategory);
  }, [selectedCategory, accessibleResources]);


  if (purchasedServiceIds.length === 0) {
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
                You currently do not have access to any resources. Purchase a service to unlock relevant materials.
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
            <SelectItem value="all">All Resources</SelectItem>
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
            No resources found for the selected category or you might not have purchased the related service.
          </p>
        </div>
      )}
    </>
  );
}

