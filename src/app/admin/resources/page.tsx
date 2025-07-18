
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resourceService, serviceService } from '@/lib/firebase-services';
import type { Resource, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, FileText, Video, Link as LinkIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialResourceFormState: Omit<Resource, 'id' | 'icon'> = {
  title: '',
  type: 'link',
  url: '',
  description: '',
  serviceCategory: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function AdminResourcesPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<Omit<Resource, 'id' | 'icon'>>(initialResourceFormState);
  const [resourceFile, setResourceFile] = useState<File | null>(null);

  useEffect(() => {
    resourceService.getResources().then(setResources);
    serviceService.getAllServices().then(setServices);
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

  const getIconForType = (type: Resource['type']) => {
    if (type === 'document') return FileText;
    if (type === 'video') return Video;
    return LinkIcon;
  };

  const handleEdit = (resource: Resource) => {
    setCurrentResource(resource);
    setFormData({
      title: resource.title,
      type: resource.type,
      url: resource.url,
      description: resource.description || '',
      serviceCategory: resource.serviceCategory,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    });
    setResourceFile(null);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentResource(null);
    setFormData({ ...initialResourceFormState, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setResourceFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = formData.url;
    if (resourceFile && (formData.type === 'document' || formData.type === 'video')) {
      finalUrl = `https://placehold.co/400x300.png?text=${encodeURIComponent(resourceFile.name.substring(0,15))}`;
    }
    const now = new Date().toISOString();
    const resourceToSave: Omit<Resource, 'id' | 'icon'> = {
      ...formData,
      url: finalUrl,
      createdAt: currentResource?.createdAt || now,
      updatedAt: now,
    };
    try {
      if (currentResource) {
        await resourceService.updateResource(currentResource.id, resourceToSave);
        setResources(prev => prev.map(r => r.id === currentResource.id ? { ...resourceToSave, id: currentResource.id, icon: getIconForType(resourceToSave.type) } : r));
        toast({ title: "Resource Updated", description: `${resourceToSave.title} has been updated.` });
      } else {
        const newId = await resourceService.createResource(resourceToSave);
        setResources(prev => [...prev, { ...resourceToSave, id: newId, icon: getIconForType(resourceToSave.type) }]);
        toast({ title: "Resource Added", description: `${resourceToSave.title} has been added.` });
      }
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Could not save resource.", variant: "destructive" });
    }
  };
  
  const handleDelete = async (resourceId: string) => {
    try {
      await resourceService.deleteResource(resourceId);
      setResources(prev => prev.filter(r => r.id !== resourceId));
      toast({ title: "Resource Deleted", description: `Resource has been deleted.`});
    } catch (err) {
      toast({ title: "Error", description: "Could not delete resource.", variant: "destructive" });
    }
  };

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
                  <TableCell className="capitalize">{resource.type}</TableCell>
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
                            Are you sure you want to delete the resource "{resource.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resource.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                   {currentResource && formData.type === 'document' && !resourceFile && <p className="text-xs text-muted-foreground mt-1">Current file: {formData.url}</p>}
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
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{currentResource ? 'Save Changes' : 'Add Resource'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
