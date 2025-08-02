
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
import { Switch } from "@/components/ui/switch";
import { Badge } from '@/components/ui/badge';
import type { Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { functions } from '@/lib/firebase'; 
import { httpsCallable } from 'firebase/functions';
import { ScrollArea } from '@/components/ui/scroll-area';

const getServices = httpsCallable(functions, 'getServices');
const saveService = httpsCallable(functions, 'saveService');
const deleteService = httpsCallable(functions, 'deleteService');
const toggleServiceBookable = httpsCallable(functions, 'toggleServiceBookable');
const uploadFile = httpsCallable(functions, 'uploadReport'); // Reusing the function

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const initialServiceFormState: Omit<Service, 'id' | 'features'> & { features: string } = {
  name: '',
  description: '',
  price: 0,
  duration: '',
  features: '',
  image: '',
  dataAiHint: '',
  bannerImageUrl: '',
  bannerImageDataAiHint: '',
  defaultForce: 'General',
  isBookable: true,
  hasDetailsPage: false,
  howItWorks: '',
  whatToExpect: '',
  howItWillHelp: '',
};

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Omit<Service, 'id' | 'features'> & { features: string }>(initialServiceFormState);
  
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: any = await getServices();
      setServicesData(result.data.services);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services. Please check your connection or security rules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);


  useEffect(() => {
    if (currentService) {
      setFormData({
        name: currentService.name,
        description: currentService.description,
        price: currentService.price,
        duration: currentService.duration,
        features: currentService.features.join(', '),
        image: currentService.image || '',
        dataAiHint: currentService.dataAiHint || '',
        bannerImageUrl: currentService.bannerImageUrl || '',
        bannerImageDataAiHint: currentService.bannerImageDataAiHint || '',
        defaultForce: currentService.defaultForce || 'General',
        isBookable: currentService.isBookable === undefined ? true : currentService.isBookable,
        hasDetailsPage: currentService.hasDetailsPage || false,
        howItWorks: currentService.howItWorks || '',
        whatToExpect: currentService.whatToExpect || '',
        howItWillHelp: currentService.howItWillHelp || '',
      });
      setThumbnailPreview(currentService.image || null);
      setBannerPreview(currentService.bannerImageUrl || null);
    } else {
      setFormData(initialServiceFormState);
      setThumbnailPreview(null);
      setBannerPreview(null);
    }
    setSelectedThumbnailFile(null); 
    setSelectedBannerFile(null);
  }, [currentService, isModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'thumbnail') {
        setSelectedThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
      } else {
        setSelectedBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
    } else {
       if (type === 'thumbnail') {
        setSelectedThumbnailFile(null);
        setThumbnailPreview(currentService?.image || null);
      } else {
        setSelectedBannerFile(null);
        setBannerPreview(currentService?.bannerImageUrl || null);
      }
    }
  };

  const handleEdit = (service: Service) => {
    setCurrentService(service);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentService(null);
    setIsModalOpen(true);
  };

  const uploadImageViaFunction = async (file: File, folder: string): Promise<string> => {
    const fileDataUrl = await fileToBase64(file);
    const result: any = await uploadFile({
      bookingId: `services_${folder}`, // Generic identifier
      fileName: file.name,
      fileDataUrl: fileDataUrl,
    });

    if (!result.data.success) {
      throw new Error(result.data.error || 'File upload failed on the server.');
    }
    return result.data.downloadUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalThumbnailUrl = formData.image;
    let finalBannerUrl = formData.bannerImageUrl;

    try {
      if (selectedThumbnailFile) {
        console.log("Uploading thumbnail...");
        finalThumbnailUrl = await uploadImageViaFunction(selectedThumbnailFile, 'thumbnails');
      }
      if (selectedBannerFile) {
        console.log("Uploading banner...");
        finalBannerUrl = await uploadImageViaFunction(selectedBannerFile, 'banners');
      }
    } catch (uploadError: any) {
        console.error("Error uploading image:", uploadError);
        toast({ title: "Image Upload Failed", description: uploadError.message || "Could not upload service image.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const serviceToSave: Omit<Service, 'id'> & { id?: string } = {
      ...formData,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      image: finalThumbnailUrl || 'https://placehold.co/600x400.png',
      dataAiHint: formData.dataAiHint || 'service related',
      bannerImageUrl: finalBannerUrl || '',
      bannerImageDataAiHint: formData.bannerImageDataAiHint || '',
      price: Number(formData.price),
      isBookable: formData.isBookable,
      id: currentService?.id
    };

    try {
      await saveService({ service: serviceToSave });
      toast({ title: currentService ? "Service Updated" : "Service Added", description: `${serviceToSave.name} has been saved.` });
      setIsModalOpen(false);
      await fetchServices();
    } catch (dbError) {
      console.error("Error saving service:", dbError);
      toast({ title: "Database Error", description: "Could not save the service. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: string, serviceName: string) => {
    try {
      await deleteService({ serviceId });
      toast({ title: "Service Deleted", description: `Service "${serviceName}" has been deleted.`});
      await fetchServices();
    } catch (dbError) {
      console.error("Error deleting service:", dbError);
      toast({ title: "Delete Failed", description: `Could not delete service "${serviceName}". Please try again.`, variant: "destructive"});
    }
  };

  const handleBookingToggle = async (serviceId: string, serviceName: string, currentIsBookable?: boolean) => {
    const newIsBookable = !(currentIsBookable === undefined ? true : currentIsBookable);
    try {
      await toggleServiceBookable({ serviceId, isBookable: newIsBookable });
      toast({
        title: "Booking Status Updated",
        description: `Bookings for "${serviceName}" are now ${newIsBookable ? 'ENABLED' : 'DISABLED'}.`,
      });
      await fetchServices();
    } catch (dbError) {
      console.error("Error toggling booking status:", dbError);
      toast({ title: "Update Failed", description: `Could not toggle booking status for "${serviceName}".`, variant: "destructive"});
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading services data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Services</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title="Manage Services"
        description="Add new services or edit existing ones offered on your platform."
      />
      <div className="mb-6 text-right">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Existing Services</CardTitle>
          <CardDescription>View, edit, or delete services. There are {servicesData.length} services.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Booking Status</TableHead>
                <TableHead>Toggle Bookings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesData.length > 0 ? servicesData.map((service) => {
                const isBookable = service.isBookable === undefined ? true : service.isBookable;
                return (
                <TableRow key={service.id}>
                  <TableCell>
                    <Image src={service.image || "https://placehold.co/80x60.png"} alt={service.name} width={80} height={60} className="rounded-md object-cover" data-ai-hint={service.dataAiHint || "service"}/>
                  </TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>₹{service.price}</TableCell>
                  <TableCell>
                    <Badge variant={isBookable ? 'default' : 'destructive'} className={isBookable ? 'bg-green-500' : ''}>
                      {isBookable ? 'Open' : 'Closed'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={isBookable}
                      onCheckedChange={() => handleBookingToggle(service.id, service.name, service.isBookable)}
                      aria-label={isBookable ? 'Disable bookings' : 'Enable bookings'}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
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
                            Are you sure you want to delete the service "{service.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(service.id, service.name)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )}) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No services found. Please add a new service.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{currentService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              <DialogDesc>
                {currentService ? `Update details for ${currentService.name}.` : 'Fill in the details for the new service.'}
              </DialogDesc>
            </DialogHeader>
            <div className="p-6">
              <ScrollArea className="max-h-[60vh] pr-6 custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required min="0" />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input id="duration" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="e.g., 60 mins" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="features">Features</Label>
                    <Textarea id="features" name="features" value={formData.features} onChange={handleInputChange} placeholder="Comma-separated, e.g., Feature 1, Feature 2" rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="imageUpload">Thumbnail Image</Label>
                    <Input id="imageUpload" name="imageUpload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'thumbnail')} />
                  </div>
                  {thumbnailPreview && (
                      <div className="flex justify-center">
                          <Image src={thumbnailPreview} alt="Thumbnail preview" width={200} height={150} className="rounded-md object-cover border" />
                      </div>
                  )}
                  <div>
                    <Label htmlFor="dataAiHint">AI Hint for Thumbnail</Label>
                    <Input id="dataAiHint" name="dataAiHint" value={formData.dataAiHint} onChange={handleInputChange} placeholder="e.g., meeting, study" />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isBookable"
                      checked={formData.isBookable}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBookable: checked }))}
                    />
                    <Label htmlFor="isBookable">Bookings Enabled</Label>
                  </div>
                  <div className="space-y-4 rounded-md border p-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="hasDetailsPage"
                          checked={formData.hasDetailsPage}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasDetailsPage: checked }))}
                        />
                        <Label htmlFor="hasDetailsPage" className="font-semibold">Enable "Know More" Details Page</Label>
                      </div>
                      {formData.hasDetailsPage && (
                        <div className="space-y-4 pl-2 pt-2 border-l-2 border-primary/20 ml-2">
                            <div>
                                <Label htmlFor="bannerImageUpload">Details Page Banner Image</Label>
                                <Input id="bannerImageUpload" name="bannerImageUpload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                            </div>
                            {bannerPreview && (
                                <div className="flex justify-center">
                                    <Image src={bannerPreview} alt="Banner preview" width={300} height={150} className="rounded-md object-cover border" />
                                </div>
                            )}
                            <div>
                              <Label htmlFor="bannerImageDataAiHint">AI Hint for Banner</Label>
                              <Input id="bannerImageDataAiHint" name="bannerImageDataAiHint" value={formData.bannerImageDataAiHint} onChange={handleInputChange} placeholder="e.g., professional, interview" />
                            </div>
                            <div>
                                <Label htmlFor="howItWorks">How It Works</Label>
                                <Textarea id="howItWorks" name="howItWorks" value={formData.howItWorks} onChange={handleInputChange} placeholder="Explain the process step-by-step..." rows={4} />
                            </div>
                            <div>
                                <Label htmlFor="whatToExpect">What To Expect</Label>
                                <Textarea id="whatToExpect" name="whatToExpect" value={formData.whatToExpect} onChange={handleInputChange} placeholder="Use bullet points (e.g., - Point 1) for clarity..." rows={4} />
                            </div>
                            <div>
                                <Label htmlFor="howItWillHelp">How It Will Help</Label>
                                <Textarea id="howItWillHelp" name="howItWillHelp" value={formData.howItWillHelp} onChange={handleInputChange} placeholder="Describe the benefits and outcomes..." rows={4} />
                            </div>
                        </div>
                      )}
                  </div>
                </div>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? (currentService ? 'Saving...' : 'Adding...') : (currentService ? 'Save Changes' : 'Add Service')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
