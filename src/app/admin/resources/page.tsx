
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Resource, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, FileText, Video, Link as LinkIcon, Loader2, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getIconForResourceType } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { db, storage } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import React from 'react';

const initialResourceFormState: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'icon'> = {
  title: '',
  type: 'link',
  url: '',
  description: '',
  serviceCategory: '',
};

export default function AdminResourcesPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'icon'>>(initialResourceFormState);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resourcesQuery = query(collection(db, 'resources'), orderBy('title', 'asc'));
      const servicesQuery = query(collection(db, 'services'), orderBy('name', 'asc'));
      
      const [resourcesSnapshot, servicesSnapshot] = await Promise.all([
        getDocs(resourcesQuery),
        getDocs(servicesQuery),
      ]);

      const fetchedResources = resourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setResources(fetchedResources);
      
      setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load resources or services data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResourceFile(e.target.files[0]);
      setFormData(prev => ({ ...prev, url: e.target.files![0].name }));
    }
  };

  const handleEdit = (resource: Resource) => {
    setCurrentResource(resource);
    setFormData({
      title: resource.title,
      type: resource.type,
      url: resource.url,
      description: resource.description || '',
      serviceCategory: resource.serviceCategory,
    });
    setResourceFile(null);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentResource(null);
    setFormData(initialResourceFormState);
    setResourceFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalResourceUrl = formData.url;

    if (resourceFile && formData.type === 'document') {
      try {
        const fileRef = storageRef(storage, `resources/${Date.now()}-${resourceFile.name}`);
        await uploadBytes(fileRef, resourceFile);
        finalResourceUrl = await getDownloadURL(fileRef);
      } catch (uploadError) {
        console.error("Error uploading resource file:", uploadError);
        toast({ title: "File Upload Failed", description: "Could not upload the resource file.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }

    const resourceDataToSave = {
      ...formData,
      url: finalResourceUrl,
    };

    try {
        if (currentResource) {
          const resourceDocRef = doc(db, "resources", currentResource.id);
          await updateDoc(resourceDocRef, { ...resourceDataToSave, updatedAt: serverTimestamp() });
          toast({ title: "Resource Updated", description: `${resourceDataToSave.title} has been updated.` });
        } else {
          await addDoc(collection(db, "resources"), { ...resourceDataToSave, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          toast({ title: "Resource Added", description: `${resourceDataToSave.title} has been added.` });
        }
        setIsModalOpen(false);
        await fetchData();
    } catch (dbError) {
        console.error("Error saving resource:", dbError);
        toast({ title: "Database Error", description: "Could not save the resource.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (resource: Resource) => {
    try {
        if (resource.type === 'document' && resource.url.includes('firebasestorage.googleapis.com')) {
            const fileRef = storageRef(storage, resource.url);
            await deleteObject(fileRef);
        }
        
        await deleteDoc(doc(db, "resources", resource.id));
        toast({ title: "Resource Deleted", description: `"${resource.title}" has been deleted.`});
        await fetchData();
    } catch (err) {
        console.error("Error deleting resource:", err);
        toast({ title: "Delete Failed", description: "Could not delete the resource.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="container py-12">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Manage Resources"
        description="Add, edit, or remove learning materials for your users."
      />
      <div className="mb-6 text-right">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Existing Resources</CardTitle>
          <CardDescription>View and manage all available resources. There are {resources.length} resources.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.title}</TableCell>
                  <TableCell className="capitalize flex items-center gap-1">
                    {React.createElement(getIconForResourceType(resource.type), { className: 'h-4 w-4 text-muted-foreground' })}
                    {resource.type}
                  </TableCell>
                  <TableCell>{services.find(s => s.id === resource.serviceCategory)?.name || resource.serviceCategory}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(resource)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the resource "{resource.title}"? This action cannot be undone and may delete the associated file from storage.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resource)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {resources.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No resources found. Add some!</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{currentResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
              <DialogDesc>Fill in the details for the resource.</DialogDesc>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Type</Label>
                <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value as Resource['type'])}>
                  <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="document">Document (PDF)</SelectItem>
                    <SelectItem value="video">Video (URL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'document' ? (
                 <div className="space-y-1">
                  <Label htmlFor="resourceFile">Upload File</Label>
                  <Input id="resourceFile" type="file" accept=".pdf" onChange={handleFileChange} />
                  {resourceFile && <p className="text-xs text-muted-foreground mt-1">Selected: {resourceFile.name}</p>}
                   {currentResource && formData.type === 'document' && !resourceFile && <p className="text-xs text-muted-foreground mt-1">Current file: <a href={formData.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{formData.url.split('?')[0].split('/').pop()}</a></p>}
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" name="url" value={formData.url} onChange={handleInputChange} placeholder={formData.type === 'video' ? "YouTube, Vimeo, etc." : "https://example.com"} required />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="serviceCategory">Link to Service (Category)</Label>
                <Select name="serviceCategory" value={formData.serviceCategory} onValueChange={(value) => handleSelectChange('serviceCategory', value)} required>
                  <SelectTrigger id="serviceCategory"><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isSubmitting ? 'Saving...' : (currentResource ? 'Save Changes' : 'Add Resource')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
