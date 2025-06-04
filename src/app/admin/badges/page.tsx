
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_BADGES } from "@/constants";
import type { Badge } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Award as AwardIcon } from 'lucide-react';

const badgeFormSchema = z.object({
  name: z.string().min(3, "Badge name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  force: z.enum(['Air Force', 'Army', 'Navy', 'General'], { required_error: "Please select a force." }),
  rankName: z.string().min(2, "Rank name must be at least 2 characters."),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).or(z.literal('')).optional(),
  dataAiHint: z.string().max(50, "AI hint should be concise.").optional(),
});

type BadgeFormValues = z.infer<typeof badgeFormSchema>;

const defaultPlaceholderImage = "https://placehold.co/100x100.png?text=Badge";

export default function AdminBadgesPage() {
  const { toast } = useToast();
  // Use state for badges to allow for dynamic updates on the page
  const [badges, setBadges] = useState<Badge[]>(MOCK_BADGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);

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
      form.reset({ // Reset to defaults for new badge
        name: '',
        description: '',
        force: 'General',
        rankName: '',
        imageUrl: '',
        dataAiHint: '',
      });
    }
  }, [currentBadge, form, isModalOpen]);


  const handleAddNew = () => {
    setCurrentBadge(null);
    setIsModalOpen(true);
  };

  const handleEdit = (badge: Badge) => {
    setCurrentBadge(badge);
    setIsModalOpen(true);
  };

  const handleDelete = (badgeId: string) => {
    // Simulate deleting from MOCK_BADGES
    const badgeIndex = MOCK_BADGES.findIndex(b => b.id === badgeId);
    if (badgeIndex > -1) {
      MOCK_BADGES.splice(badgeIndex, 1);
    }
    setBadges([...MOCK_BADGES]); // Update state to reflect change
    toast({ title: "Badge Deleted", description: "The badge has been removed." });
  };

  function onSubmit(data: BadgeFormValues) {
    const newBadgeData: Badge = {
      id: currentBadge?.id || `badge-${Date.now()}`,
      ...data,
      imageUrl: data.imageUrl || defaultPlaceholderImage,
      dataAiHint: data.dataAiHint || 'badge icon',
    };

    if (currentBadge) {
      // Update existing badge in MOCK_BADGES
      const badgeIndex = MOCK_BADGES.findIndex(b => b.id === currentBadge.id);
      if (badgeIndex > -1) {
        MOCK_BADGES[badgeIndex] = newBadgeData;
      }
      toast({ title: "Badge Updated", description: `${newBadgeData.name} has been updated.` });
    } else {
      // Add new badge to MOCK_BADGES
      MOCK_BADGES.push(newBadgeData);
      toast({ title: "Badge Added", description: `${newBadgeData.name} has been created.` });
    }
    setBadges([...MOCK_BADGES]); // Update state to reflect changes
    setIsModalOpen(false);
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
          <CardDescription>View and manage all available badges.</CardDescription>
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
              {badges.length > 0 ? badges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <Image 
                        src={badge.imageUrl || defaultPlaceholderImage} 
                        alt={badge.name} 
                        width={40} 
                        height={40} 
                        className="rounded-md border"
                        data-ai-hint={badge.dataAiHint}
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
                          <AlertDialogAction onClick={() => handleDelete(badge.id)} className="bg-destructive hover:bg-destructive/90">
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
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">{currentBadge ? 'Save Changes' : 'Create Badge'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
