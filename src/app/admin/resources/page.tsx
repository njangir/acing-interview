
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_RESOURCES, MOCK_SERVICES } from "@/constants";
import type { Resource } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, FileText, Video, Link as LinkIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const initialResourceFormState: Omit<Resource, 'id' | 'icon'> = {
  title: '',
  type: 'link',
  url: '',
  description: '',
  serviceCategory: '',
};

export default function AdminResourcesPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<Omit<Resource, 'id' | 'icon'>>(initialResourceFormState);
  const [resourceFile, setResourceFile] = useState<File | null>(null);

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
      // For file uploads, we might want to set the URL to the file name or a placeholder
      // Actual URL will be determined by upload storage
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate file upload if a file is selected and type is document/video
    if (resourceFile && (formData.type === 'document' || formData.type === 'video')) {
      console.log("Simulating upload of file:", resourceFile.name);
      // In a real app, formData.url would be set to the Stored URL post-upload
    }
    
    const resourceToSave: Resource = {
      ...formData,
      id: currentResource?.id || `res-${Date.now()}`,
      icon: getIconForType(formData.type),
    };

    if (currentResource) {
      setResources(prev => prev.map(r => r.id === currentResource.id ? resourceToSave : r));
      toast({ title: "Resource Updated", description: `${resourceToSave.title} has been updated.` });
    } else {
      setResources(prev => [...prev, resourceToSave]);
      toast({ title: "Resource Added", description: `${resourceToSave.title} has been added.` });
    }
    console.log("Saving resource:", resourceToSave);
    setIsModalOpen(false);
  };
  
  const handleDelete = (resourceId: string) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
    toast({ title: "Resource Deleted", description: `Resource has been deleted.`});
    console.log("Deleting resource:", resourceId);
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
                  <TableCell>{MOCK_SERVICES.find(s => s.id === resource.serviceCategory)?.name || resource.serviceCategory}</TableCell>
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
                    {MOCK_SERVICES.map(service => (
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
