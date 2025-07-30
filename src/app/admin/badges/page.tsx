
'use client';

import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Badge } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Award as AwardIcon, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';

const ITEMS_PER_PAGE = 7;

const badgeFormSchema = z.object({
  name: z.string().min(3, "Badge name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  force: z.enum(['Air Force', 'Army', 'Navy', 'General'], { required_error: "Please select a force." }),
  rankName: z.string().min(2, "Rank name must be at least 2 characters."),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).or(z.literal('')).optional(),
  dataAiHint: z.string().max(50, "AI hint should be concise.").optional(),
});

type BadgeFormValues = z.infer<typeof badgeFormSchema>;

const defaultPlaceholderImage = "https://placehold.co/100x100.png";

export default function AdminBadgesPage() {
  const { toast } = useToast();
  const [allBadgesData, setAllBadgesData] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      force: 'General',
      rankName: '',
      imageUrl: '',
      dataAiHint: '',
    },
  });

  const fetchBadges = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const badgesColRef = collection(db, 'badges');
      const q = query(badgesColRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedBadges = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Badge));
      setAllBadgesData(fetchedBadges);
    } catch (err) {
      console.error("Error fetching badges:", err);
      setError("Failed to load badges. Please check your connection and Firestore rules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  useEffect(() => {
    if (currentBadge) {
      form.reset({
        name: currentBadge.name,
        description: currentBadge.description,
        force: currentBadge.force,
        rankName: currentBadge.rankName,
        imageUrl: currentBadge.imageUrl,
        dataAiHint: currentBadge.dataAiHint,
      });
    } else {
      form.reset({
        name: '', description: '', force: 'General', rankName: '', imageUrl: '', dataAiHint: '',
      });
    }
  }, [currentBadge, form, isModalOpen]);

  const totalPages = Math.ceil(allBadgesData.length / ITEMS_PER_PAGE);

  const paginatedBadges = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allBadgesData.slice(startIndex, endIndex);
  }, [currentPage, allBadgesData]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleAddNew = () => {
    setCurrentBadge(null);
    setIsModalOpen(true);
  };

  const handleEdit = (badge: Badge) => {
    setCurrentBadge(badge);
    setIsModalOpen(true);
  };

  const handleDelete = async (badgeId: string, badgeName: string) => {
    try {
      const badgeDocRef = doc(db, "badges", badgeId);
      await deleteDoc(badgeDocRef);
      toast({ title: "Badge Deleted", description: `Badge "${badgeName}" has been removed.` });
      // Refresh data
      await fetchBadges();
      // Pagination adjustment logic
      const newTotalPages = Math.ceil((allBadgesData.length - 1) / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
      }
    } catch (err) {
      console.error("Error deleting badge:", err);
      toast({ title: "Delete Failed", description: `Could not delete badge "${badgeName}".`, variant: "destructive"});
    }
  };

  async function onSubmit(data: BadgeFormValues) {
    setIsSubmitting(true);
    const badgeDataToSave: Omit<Badge, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      imageUrl: data.imageUrl || defaultPlaceholderImage,
      dataAiHint: data.dataAiHint || 'badge icon',
    };

    try {
      if (currentBadge) {
        const badgeDocRef = doc(db, "badges", currentBadge.id);
        await updateDoc(badgeDocRef, { ...badgeDataToSave, updatedAt: serverTimestamp() });
        toast({ title: "Badge Updated", description: `${data.name} has been updated.` });
      } else {
        await addDoc(collection(db, "badges"), { ...badgeDataToSave, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast({ title: "Badge Added", description: `${data.name} has been created.` });
      }
      setIsModalOpen(false);
      await fetchBadges();
    } catch (err) {
      console.error("Error saving badge:", err);
      toast({ title: "Save Failed", description: "Could not save badge details.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading badges...</p>
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
        title="Manage Badges"
        description="Create, edit, or remove achievement badges for users."
      />
      <div className="mb-6 text-right">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Badge
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Badges</CardTitle>
          <CardDescription>View and manage all available badges. Showing {paginatedBadges.length} of {allBadgesData.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Force</TableHead>
                <TableHead>Rank Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBadges.length > 0 ? paginatedBadges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <Image
                        src={badge.imageUrl || defaultPlaceholderImage}
                        alt={badge.name}
                        width={40}
                        height={40}
                        className="rounded-md border"
                        data-ai-hint={badge.dataAiHint || 'badge icon'}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{badge.name}</TableCell>
                  <TableCell>{badge.force}</TableCell>
                  <TableCell>{badge.rankName}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(badge)}>
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
                            Are you sure you want to delete the badge "{badge.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(badge.id, badge.name)} className="bg-destructive hover:bg-destructive/90">
                            Delete Badge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">No badges created yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-center items-center space-x-4 py-4">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              size="sm"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              size="sm"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <AwardIcon className="h-6 w-6 text-primary" />
                {currentBadge ? 'Edit Badge' : 'Add New Badge'}
            </DialogTitle>
            <DialogDesc>
              {currentBadge ? `Modify details for ${currentBadge.name}.` : 'Fill in the details for the new badge.'}
            </DialogDesc>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Pilot Aspirant" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe what this badge represents..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="force"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Force</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a force" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Air Force">Air Force</SelectItem>
                        <SelectItem value="Army">Army</SelectItem>
                        <SelectItem value="Navy">Navy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rank Name / Title on Badge</FormLabel>
                    <FormControl><Input placeholder="e.g., Officer Candidate" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://placehold.co/100x100.png" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataAiHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image AI Hint (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., pilot badge, star award" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentBadge ? 'Save Changes' : 'Create Badge'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
    
