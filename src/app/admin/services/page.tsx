
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
import { MOCK_SERVICES } from "@/constants";
import type { Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from 'next/image';


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
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Omit<Service, 'id' | 'features'> & { features: string }>(initialServiceFormState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


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
    setSelectedFile(null);
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
      setImagePreview(currentService?.image || null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = formData.image;
    if (selectedFile) {
      imageUrl = `https://placehold.co/600x400.png?text=New+${selectedFile.name.substring(0,10)}`;
      console.log("Simulating upload of:", selectedFile.name);
    }


    const serviceToSave: Service = {
      ...formData,
      id: currentService?.id || `service-${Date.now()}`,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      image: imageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: formData.dataAiHint || 'service related',
      price: Number(formData.price),
      isBookable: formData.isBookable,
    };

    if (currentService) {
      setServices(prev => prev.map(s => s.id === currentService.id ? serviceToSave : s));
      MOCK_SERVICES[MOCK_SERVICES.findIndex(s => s.id === currentService.id)] = serviceToSave; // Update mock
      toast({ title: "Service Updated", description: `${serviceToSave.name} has been updated.` });
    } else {
      setServices(prev => [...prev, serviceToSave]);
      MOCK_SERVICES.push(serviceToSave); // Update mock
      toast({ title: "Service Added", description: `${serviceToSave.name} has been added.` });
    }
    console.log("Saving service (simulated):", serviceToSave);
    setIsModalOpen(false);
  };

  const handleDelete = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId); // Update mock
    if (serviceIndex > -1) MOCK_SERVICES.splice(serviceIndex, 1);
    toast({ title: "Service Deleted", description: `Service has been deleted.`});
    console.log("Deleting service:", serviceId);
  };

  const handleBookingToggle = (serviceId: string, currentIsBookable?: boolean) => {
    const newIsBookable = !(currentIsBookable === undefined ? true : currentIsBookable);
    const updatedServices = services.map(s =>
      s.id === serviceId ? { ...s, isBookable: newIsBookable } : s
    );
    setServices(updatedServices);
    const mockServiceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);
    if (mockServiceIndex > -1) {
      MOCK_SERVICES[mockServiceIndex].isBookable = newIsBookable;
    }
    toast({
      title: "Booking Status Updated",
      description: `Bookings for this service are now ${newIsBookable ? 'ENABLED' : 'DISABLED'}.`,
    });
  };

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
              {services.map((service) => {
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
                      onCheckedChange={() => handleBookingToggle(service.id, service.isBookable)}
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
                          <AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
          {services.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No services found. Add one!</p>
          )}
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price (₹)</Label>
                <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">Duration</Label>
                <Input id="duration" name="duration" value={formData.duration} onChange={handleInputChange} className="col-span-3" placeholder="e.g., 60 mins" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="features" className="text-right">Features</Label>
                <Textarea id="features" name="features" value={formData.features} onChange={handleInputChange} className="col-span-3" placeholder="Comma-separated, e.g., Feature 1, Feature 2" />
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
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{currentService ? 'Save Changes' : 'Add Service'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
