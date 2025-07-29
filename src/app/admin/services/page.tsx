
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

// PRODUCTION TODO: Import Firebase and Firestore methods
import { db, storage } from '@/lib/firebase'; // Assuming firebase.ts setup
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const initialServiceFormState: Omit<Service, 'id' | 'features'> & { features: string } = {
  name: '',
  description: '',
  price: 0,
  duration: '',
  features: '',
  image: '',
  dataAiHint: '',
  defaultForce: 'General',
  isBookable: true,
};

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [servicesData, setServicesData] = useState<Service[]>([]); // Holds fetched or mock services
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Omit<Service, 'id' | 'features'> & { features: string }>(initialServiceFormState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const servicesColRef = collection(db, 'services');
    const q = query(servicesColRef, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedServices = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            // Ensure timestamp fields are handled if needed, though not directly used in this component's UI
            // createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
            // updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
        } as Service;
      });
      setServicesData(fetchedServices);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error with real-time services listener:", err);
      setError("Failed to load services in real-time. Please check your connection or security rules.");
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
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
        defaultForce: currentService.defaultForce || 'General',
        isBookable: currentService.isBookable === undefined ? true : currentService.isBookable,
      });
      setImagePreview(currentService.image || null);
    } else {
      setFormData(initialServiceFormState);
      setImagePreview(null);
    }
    setSelectedFile(null); // Reset file selection when modal opens/closes or currentService changes
  }, [currentService, isModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      // If file is cleared, revert to currentService's image or null if new
      setImagePreview(currentService?.image || (isModalOpen && !currentService ? null : formData.image || null) );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalImageUrl = formData.image;

    if (selectedFile) {
      try {
        const imageFileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
        const imageRef = storageRef(storage, `services/${imageFileName}`);
        await uploadBytes(imageRef, selectedFile);
        finalImageUrl = await getDownloadURL(imageRef);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast({ title: "Image Upload Failed", description: "Could not upload the service image. Please try again.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }

    const serviceToSave: Omit<Service, 'id'> & { id?: string; createdAt?: any; updatedAt?: any } = {
      ...formData,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      image: finalImageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: formData.dataAiHint || 'service related',
      price: Number(formData.price),
      isBookable: formData.isBookable,
    };

    try {
      if (currentService) {
        const serviceDocRef = doc(db, "services", currentService.id);
        await updateDoc(serviceDocRef, { ...serviceToSave, updatedAt: serverTimestamp() });
        toast({ title: "Service Updated", description: `${serviceToSave.name} has been updated.` });
      } else {
        await addDoc(collection(db, "services"), { ...serviceToSave, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast({ title: "Service Added", description: `${serviceToSave.name} has been added.` });
      }
      setIsModalOpen(false);
    } catch (dbError) {
      console.error("Error saving service to Firestore:", dbError);
      toast({ title: "Database Error", description: "Could not save the service. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: string, serviceName: string) => {
    try {
      const serviceDocRef = doc(db, "services", serviceId);
      await deleteDoc(serviceDocRef);
      toast({ title: "Service Deleted", description: `Service "${serviceName}" has been deleted.`});
    } catch (dbError) {
      console.error("Error deleting service:", dbError);
      toast({ title: "Delete Failed", description: `Could not delete service "${serviceName}". Please try again.`, variant: "destructive"});
    }
  };

  const handleBookingToggle = async (serviceId: string, serviceName: string, currentIsBookable?: boolean) => {
    const newIsBookable = !(currentIsBookable === undefined ? true : currentIsBookable);
    try {
      const serviceDocRef = doc(db, "services", serviceId);
      await updateDoc(serviceDocRef, { isBookable: newIsBookable, updatedAt: serverTimestamp() });
      toast({
        title: "Booking Status Updated",
        description: `Bookings for "${serviceName}" are now ${newIsBookable ? 'ENABLED' : 'DISABLED'}.`,
      });
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
        <DialogContent className="sm:max-w-[625px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{currentService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              <DialogDesc>
                {currentService ? `Update details for ${currentService.name}.` : 'Fill in the details for the new service.'}
              </DialogDesc>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" rows={3} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price (₹)</Label>
                <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} className="col-span-3" required min="0" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">Duration</Label>
                <Input id="duration" name="duration" value={formData.duration} onChange={handleInputChange} className="col-span-3" placeholder="e.g., 60 mins" required />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="features" className="text-right pt-2">Features</Label>
                <Textarea id="features" name="features" value={formData.features} onChange={handleInputChange} className="col-span-3" placeholder="Comma-separated, e.g., Feature 1, Feature 2" rows={3} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUpload" className="text-right">Thumbnail</Label>
                <Input id="imageUpload" name="imageUpload" type="file" accept="image/*" onChange={handleFileChange} className="col-span-3" />
              </div>
              {imagePreview && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-start-2 col-span-3">
                        <Image src={imagePreview} alt="Thumbnail preview" width={200} height={150} className="rounded-md object-cover border" />
                    </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dataAiHint" className="text-right">AI Hint</Label>
                <Input id="dataAiHint" name="dataAiHint" value={formData.dataAiHint} onChange={handleInputChange} className="col-span-3" placeholder="e.g., meeting, study" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isBookable" className="text-right">Bookings Enabled</Label>
                <div className="col-span-3 flex items-center">
                   <Switch
                    id="isBookable"
                    checked={formData.isBookable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBookable: checked }))}
                  />
                </div>
              </div>
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
