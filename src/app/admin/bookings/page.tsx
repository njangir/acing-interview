
'use client';

import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Booking, Service, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, CheckCircle, XCircle, CalendarClock, ShieldCheck, PlusCircle, CalendarIcon, Edit, Filter, InfoIcon, Video, ChevronLeft, ChevronRight, Eye, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Badge as UiBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { db, functions } from '@/lib/firebase';
import { doc, addDoc, updateDoc, serverTimestamp, writeBatch, collection, getDocs, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const processRefund = httpsCallable(functions, 'processRefund');
const getAdminBookingsPageData = httpsCallable(functions, 'getAdminBookingsPageData');

const ITEMS_PER_PAGE = 7;

const createBookingFormSchema = z.object({
  selectedUserId: z.string({ required_error: "You must select a user." }).min(1, "You must select a user."),
  serviceId: z.string({ required_error: "Please select a service." }),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/i, { message: "Invalid time format (e.g., 10:00 AM)." }),
  paymentStatus: z.enum(['paid', 'pay_later_pending'], { required_error: "Please select a payment status." }),
  meetingLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});
type CreateBookingFormValues = z.infer<typeof createBookingFormSchema>;

const editBookingFormSchema = z.object({
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/i, { message: "Invalid time format (e.g., 10:00 AM)." }),
  meetingLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  status: z.enum(['pending_approval', 'accepted', 'scheduled', 'completed', 'cancelled'], { required_error: "Please select a booking status." }),
  paymentStatus: z.enum(['paid', 'pay_later_pending', 'pay_later_unpaid'], { required_error: "Please select a payment status." }),
});
type EditBookingFormValues = z.infer<typeof editBookingFormSchema>;


export default function AdminBookingsPage() {
  const { toast } = useToast();
  const { currentUser: adminUser } = useAuth(); // Admin user context

  const [allBookingsData, setAllBookingsData] = useState<Booking[]>([]); // Holds fetched or mock bookings
  const [allServicesData, setAllServicesData] = useState<Service[]>([]); // Holds fetched or mock services
  const [allUsersData, setAllUsersData] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);
  const [filterServiceId, setFilterServiceId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToRefund, setBookingToRefund] = useState<Booking | null>(null);
  const [isRefundAlertOpen, setIsRefundAlertOpen] = useState(false);

  const [isViewFeedbackModalOpen, setIsViewFeedbackModalOpen] = useState(false);
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState<Booking | null>(null);

  const [createUserSearch, setCreateUserSearch] = useState('');


  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: any = await getAdminBookingsPageData();
      const data = result.data;
      
      const fetchedBookings = data.bookings.map((b: any) => ({
        ...b,
        createdAt: b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
        updatedAt: b.updatedAt?._seconds ? new Date(b.updatedAt._seconds * 1000).toISOString() : new Date().toISOString(),
      }));

      setAllServicesData(data.services || []);
      setAllBookingsData(fetchedBookings || []);
      setAllUsersData(data.users || []);

    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to load admin data. Please check your connection and security rules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); 


  const createBookingForm = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingFormSchema),
    defaultValues: {
      selectedUserId: undefined,
      serviceId: undefined,
      date: undefined,
      time: '',
      paymentStatus: undefined,
      meetingLink: '',
    },
  });

  const editBookingForm = useForm<EditBookingFormValues>({
    resolver: zodResolver(editBookingFormSchema),
  });

  useEffect(() => {
    if (selectedBookingForEdit) {
      let currentStatus = selectedBookingForEdit.status;
      editBookingForm.reset({
        date: parse(selectedBookingForEdit.date, 'yyyy-MM-dd', new Date()),
        time: selectedBookingForEdit.time,
        meetingLink: selectedBookingForEdit.meetingLink || '',
        status: currentStatus as EditBookingFormValues['status'],
        paymentStatus: selectedBookingForEdit.paymentStatus,
      });
    }
  }, [selectedBookingForEdit, editBookingForm]);


  const handleAdminAction = async (bookingId: string, action: 'accept' | 'cancel' | 'complete' | 'approve_refund') => {
    setIsProcessingAction(bookingId);
    let message = '';
    const bookingDocRef = doc(db, "bookings", bookingId);

    if (action === 'approve_refund') {
      try {
        await processRefund({ bookingId });
        message = `Refund for booking ${bookingId} processed successfully.`;
        toast({ title: "Action Successful", description: message });
      } catch (err: any) {
        console.error(`Error processing refund for booking ${bookingId}:`, err);
        toast({ title: "Refund Failed", description: err.message || "An unknown error occurred.", variant: "destructive" });
      } finally {
        setIsProcessingAction(null);
        await fetchData(); // Refresh data
      }
      return;
    }
    
    const bookingToUpdateSnap = await getDoc(bookingDocRef);
    if (!bookingToUpdateSnap.exists()) {
        toast({ title: "Error", description: "Booking not found.", variant: "destructive"});
        setIsProcessingAction(null);
        return;
    }
    const bookingToUpdate = bookingToUpdateSnap.data() as Booking;

    const updatePayload: Partial<Booking> = {};

    if (action === 'accept') {
      message = `Booking ${bookingId} accepted. User will be notified. Please add meeting link to schedule.`;
      updatePayload.status = 'accepted';
    } else if (action === 'cancel') {
      message = `Booking ${bookingId} cancelled and user notified.`;
      updatePayload.status = 'cancelled';
      if (bookingToUpdate.paymentStatus === 'pay_later_pending') {
          updatePayload.paymentStatus = 'pay_later_unpaid';
      }
    } else if (action === 'complete') {
      message = `Booking ${bookingId} marked as completed.`;
      updatePayload.status = 'completed';
    } 

    try {
        await updateDoc(bookingDocRef, { ...updatePayload, updatedAt: serverTimestamp() });
        toast({ title: "Action Successful", description: message });
    } catch (err) {
        console.error(`Error performing action ${action} on booking ${bookingId}:`, err);
        toast({ title: "Action Failed", description: `Could not perform action: ${action}. Please try again.`, variant: "destructive" });
    } finally {
        setIsProcessingAction(null);
        await fetchData(); // Refresh data
    }
  };

  const openEditModal = (booking: Booking) => {
    setSelectedBookingForEdit(booking);
    setIsEditBookingModalOpen(true);
  }

  const openCancelDialog = (booking: Booking) => {
    if (booking.status !== 'cancelled') {
      setBookingToCancel(booking);
      setIsCancelAlertOpen(true);
    }
  };
  
  const openRefundDialog = (booking: Booking) => {
    if (booking.paymentStatus === 'paid' && booking.requestedRefund) {
      setBookingToRefund(booking);
      setIsRefundAlertOpen(true);
    }
  };

  const openViewFeedbackModal = (booking: Booking) => {
    setSelectedBookingForFeedback(booking);
    setIsViewFeedbackModalOpen(true);
  };

  async function onCreateBookingSubmit(data: CreateBookingFormValues) {
    const selectedService = allServicesData.find(s => s.id === data.serviceId);
    const selectedUser = allUsersData.find(u => u.uid === data.selectedUserId);

    if (!selectedService || !selectedUser) {
      toast({ title: "Error", description: "Selected user or service not found.", variant: "destructive" });
      return;
    }

    let initialStatus: Booking['status'];
    if (data.paymentStatus === 'paid') {
        initialStatus = data.meetingLink ? 'scheduled' : 'accepted';
    } else {
        initialStatus = 'pending_approval';
    }

    const newBookingData = {
      uid: selectedUser.uid,
      userName: selectedUser.name,
      userEmail: selectedUser.email,
      serviceId: data.serviceId,
      serviceName: selectedService.name,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      paymentStatus: data.paymentStatus,
      status: initialStatus,
      meetingLink: data.meetingLink || '',
      transactionId: data.paymentStatus === 'paid' ? `admin_txn_${Date.now()}` : null,
      requestedRefund: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
        await addDoc(collection(db, "bookings"), newBookingData);
        toast({
          title: 'Booking Created',
          description: `Booking for ${selectedUser.name} for ${selectedService.name} has been created.`,
        });
        setIsCreateBookingModalOpen(false);
        createBookingForm.reset();
        setCreateUserSearch('');
        await fetchData(); // Refresh data
    } catch (err) {
        console.error("Error creating booking:", err);
        toast({ title: "Creation Failed", description: "Could not create the booking.", variant: "destructive" });
    }
  }

  async function onEditBookingSubmit(data: EditBookingFormValues) {
    if (!selectedBookingForEdit) return;

    let newStatus = data.status;
    if (data.meetingLink) {
      if (newStatus === 'accepted' || newStatus === 'pending_approval') {
        newStatus = 'scheduled';
      }
    } else {
      if (newStatus === 'scheduled' && data.status !== 'completed' && data.status !== 'cancelled') {
        newStatus = 'accepted';
      }
    }

    const updatePayload = {
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      meetingLink: data.meetingLink || '',
      status: newStatus,
      paymentStatus: data.paymentStatus,
      updatedAt: serverTimestamp(),
    };

    try {
        const bookingDocRef = doc(db, "bookings", selectedBookingForEdit.id);
        await updateDoc(bookingDocRef, updatePayload);
        
        toast({
          title: "Booking Updated",
          description: `Booking for ${selectedBookingForEdit.userName} has been successfully updated. Status: ${newStatus}.`,
        });
        setIsEditBookingModalOpen(false);
        setSelectedBookingForEdit(null);
        await fetchData(); // Refresh data
    } catch (err) {
        console.error("Error updating booking:", selectedBookingForEdit.id, err);
        toast({ title: "Update Failed", description: "Could not update booking. Please try again.", variant: "destructive" });
    }
  }

  const filteredBookings = useMemo(() => {
    let bookings = [...allBookingsData].sort((a, b) => {
      const statusOrder = { pending_approval: 0, accepted: 1, scheduled: 2, completed: 3, cancelled: 4 };
      const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 5;
      const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 5;
      if (statusA !== statusB) return statusA - statusB;
      
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return statusA === 0 ? dateA - dateB : dateB - dateA;
    });

    if (filterServiceId !== 'all') {
      bookings = bookings.filter(booking => booking.serviceId === filterServiceId);
    }
    return bookings;
  }, [allBookingsData, filterServiceId]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, endIndex);
  }, [currentPage, filteredBookings]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filterServiceId]);
  
  const filteredUsersForCreation = useMemo(() => {
    if (!createUserSearch) return allUsersData;
    return allUsersData.filter(user => 
        user.name.toLowerCase().includes(createUserSearch.toLowerCase()) || 
        user.email.toLowerCase().includes(createUserSearch.toLowerCase())
    );
  }, [createUserSearch, allUsersData]);


  if (isLoading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading booking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <PageHeader
        title="Manage Booking Requests"
        description="Review, accept, edit, cancel, or create new booking requests."
      />
       <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filterServiceId} onValueChange={setFilterServiceId}>
                <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Filter by service..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {allServicesData.map(service => (
                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Button onClick={() => setIsCreateBookingModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Booking
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>View and manage all bookings. Showing: {paginatedBookings.length} of {filteredBookings.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Booking & User Info</TableHead>
                <TableHead className="w-[25%]">Service & Schedule</TableHead>
                <TableHead className="w-[25%]">Payment & Refund</TableHead>
                <TableHead className="w-[25%] text-right">Status & Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.length > 0 ? paginatedBookings.map((booking) => {
                const showAsAddLink = booking.status === 'accepted' && booking.paymentStatus === 'paid' && !booking.meetingLink;
                const hasFeedback = booking.status === 'completed' && (booking.detailedFeedback || booking.userFeedback);
                const isActionInProgress = isProcessingAction === booking.id;

                return (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{booking.id}</div>
                    {booking.paymentStatus === 'paid' && booking.transactionId && (
                        <div className="text-xs text-muted-foreground mt-0.5">Txn: {booking.transactionId}</div>
                    )}
                    <div className="font-medium mt-1.5">{booking.userName}</div>
                    <div className="text-xs text-muted-foreground">{booking.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.serviceName}</div>
                    <div className="text-sm text-muted-foreground">
                        {new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-muted-foreground">{booking.time}</div>
                  </TableCell>
                  <TableCell>
                     <UiBadge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className={cn(
                        "mb-1",
                        booking.paymentStatus === 'paid' && 'bg-green-100 text-green-700',
                        booking.paymentStatus === 'pay_later_unpaid' && 'bg-gray-100 text-gray-700 line-through opacity-75',
                        booking.paymentStatus === 'pay_later_pending' && 'bg-orange-100 text-orange-700'
                      )}
                     >
                       {booking.paymentStatus.replace(/_/g, ' ')}
                     </UiBadge>
                    <div>
                        {booking.requestedRefund ? (
                            <UiBadge variant="destructive">REFUND REQ: YES</UiBadge>
                        ) : (
                            <UiBadge variant="outline">REFUND REQ: NO</UiBadge>
                        )}
                        {booking.requestedRefund && booking.refundReason && (
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="text-xs text-muted-foreground mt-1 truncate w-32 hover:w-auto hover:whitespace-normal cursor-help">
                                        Reason: {booking.refundReason}
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>{booking.refundReason}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                   </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                        {isActionInProgress && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        <UiBadge
                            variant={
                                booking.status === 'pending_approval' ? 'secondary' :
                                booking.status === 'accepted' ? 'outline' :
                                booking.status === 'scheduled' ? 'default' :
                                booking.status === 'completed' ? 'outline' :
                                'destructive'
                            }
                            className={cn(
                                "mb-1 block w-fit ml-auto", 
                                booking.status === 'scheduled' && 'bg-blue-100 text-blue-700',
                                booking.status === 'pending_approval' && 'bg-yellow-100 text-yellow-700',
                                booking.status === 'accepted' && 'bg-orange-100 text-orange-700',
                                booking.status === 'cancelled' && 'bg-red-100 text-red-700 line-through opacity-75'
                            )}
                        >
                            {booking.status.replace(/_/g, ' ')}
                        </UiBadge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={isActionInProgress}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {booking.status === 'scheduled' && booking.meetingLink && (
                                    <DropdownMenuItem asChild>
                                        <Link href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                            <Video className="mr-2 h-4 w-4 text-green-500" /> Join Meeting
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                            <DropdownMenuItem
                                onClick={() => openEditModal(booking)}
                                disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                            >
                                {showAsAddLink ? (
                                <Video className="mr-2 h-4 w-4 text-green-500" />
                                ) : (
                                <Edit className="mr-2 h-4 w-4 text-blue-500" />
                                )}
                                {showAsAddLink ? 'Add Meeting Link & Schedule' : 'Edit Details / Reschedule'}
                            </DropdownMenuItem>
                            {hasFeedback && (
                                <DropdownMenuItem onClick={() => openViewFeedbackModal(booking)}>
                                <Eye className="mr-2 h-4 w-4 text-purple-500" /> View Feedback
                                </DropdownMenuItem>
                            )}
                            {booking.status === 'pending_approval' && (
                                <DropdownMenuItem onClick={() => handleAdminAction(booking.id, 'accept')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Accept Request
                                </DropdownMenuItem>
                            )}
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.paymentStatus === 'paid' && booking.requestedRefund &&(
                                <DropdownMenuItem onClick={() => openRefundDialog(booking)} className="text-green-600 hover:!text-green-600">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Process Refund
                                </DropdownMenuItem>
                            )}
                            {(booking.status === 'scheduled' || booking.status === 'accepted') && (
                                <DropdownMenuItem onClick={() => handleAdminAction(booking.id, 'complete')}>
                                <CalendarClock className="mr-2 h-4 w-4 text-purple-500" /> Mark as Completed
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className={cn(
                                    "text-red-600 hover:!text-red-600",
                                    booking.status === 'cancelled' && 'opacity-50 cursor-not-allowed'
                                )}
                                disabled={booking.status === 'cancelled'}
                                onClick={() => openCancelDialog(booking)}
                                onSelect={(e) => { if (booking.status === 'cancelled') e.preventDefault();}}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel Booking
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
                 <TableRow><TableCell colSpan={4} className="text-center h-24">No bookings found matching the criteria.</TableCell></TableRow>
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

       <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently cancel the booking for {bookingToCancel?.userName}. This does not process a refund automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingToCancel(null)}>Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (bookingToCancel) {
                  handleAdminAction(bookingToCancel.id, 'cancel');
                  setBookingToCancel(null);
                }
                setIsCancelAlertOpen(false);
              }}>
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isRefundAlertOpen} onOpenChange={setIsRefundAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund Processing</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to process a refund for {bookingToRefund?.userName} for the service "{bookingToRefund?.serviceName}". This will trigger a transaction via Razorpay and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingToRefund(null)}>Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (bookingToRefund) {
                  handleAdminAction(bookingToRefund.id, 'approve_refund');
                  setBookingToRefund(null);
                }
                setIsRefundAlertOpen(false);
              }}>
              Yes, Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditBookingModalOpen} onOpenChange={(isOpen) => {
        setIsEditBookingModalOpen(isOpen);
        if (!isOpen) setSelectedBookingForEdit(null);
      }}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[calc(100vh-4rem)]">
            <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                <DialogTitle>Edit Booking: {selectedBookingForEdit?.id}</DialogTitle>
                <DialogDesc>
                    Modify details for {selectedBookingForEdit?.userName}'s booking of {selectedBookingForEdit?.serviceName}.
                </DialogDesc>
            </DialogHeader>
            {selectedBookingForEdit && (
              <Form {...editBookingForm}>
                <form
                  onSubmit={editBookingForm.handleSubmit(onEditBookingSubmit)}
                  className="flex-grow overflow-y-auto custom-scrollbar"
                  id="editBookingForm_id"
                >
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FormItem>
                        <FormLabel>User Name</FormLabel>
                        <Input value={selectedBookingForEdit.userName} readOnly disabled className="bg-muted/50" />
                      </FormItem>
                      <FormItem>
                        <FormLabel>User Email</FormLabel>
                        <Input value={selectedBookingForEdit.userEmail} readOnly disabled className="bg-muted/50" />
                      </FormItem>
                    </div>
                    <FormField
                      control={editBookingForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col mb-4">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editBookingForm.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Time</FormLabel>
                          <FormControl><Input placeholder="e.g., 02:00 PM" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editBookingForm.control}
                      name="meetingLink"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Meeting Link</FormLabel>
                          <FormControl><Input type="url" placeholder="https://meet.google.com/..." {...field} /></FormControl>
                          <FormMessage />
                          {selectedBookingForEdit.status === 'accepted' && !field.value && (
                              <p className="text-xs text-orange-600 mt-1">Provide a meeting link to change status to 'Scheduled'.</p>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editBookingForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Booking Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending_approval">Pending Approval</SelectItem>
                              <SelectItem value="accepted">Accepted (Needs Link)</SelectItem>
                              <SelectItem value="scheduled">Scheduled (Link Added)</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editBookingForm.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Payment Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select payment status" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="pay_later_pending">Pay Later Pending</SelectItem>
                              <SelectItem value="pay_later_unpaid">Pay Later Unpaid/Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            )}
            <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsEditBookingModalOpen(false)}>Cancel</Button>
                <Button type="submit" form="editBookingForm_id">Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateBookingModalOpen} onOpenChange={(isOpen) => {
        setIsCreateBookingModalOpen(isOpen);
        if (!isOpen) createBookingForm.reset();
      }}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[calc(100vh-4rem)]">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDesc>Manually create a booking for an existing registered user.</DialogDesc>
          </DialogHeader>
          <Form {...createBookingForm}>
            <form
              onSubmit={createBookingForm.handleSubmit(onCreateBookingSubmit)}
              className="flex-grow overflow-y-auto custom-scrollbar"
              id="createBookingForm_id"
            >
              <div className="p-6 space-y-4">
                  <FormField
                    control={createBookingForm.control}
                    name="selectedUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select User</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a registered user..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <Input 
                                className="m-2 w-[calc(100%-1rem)]" 
                                placeholder="Search user..."
                                value={createUserSearch}
                                onChange={(e) => setCreateUserSearch(e.target.value)}
                            />
                            {filteredUsersForCreation.map((user) => (
                              <SelectItem key={user.uid} value={user.uid}>{user.name} ({user.email})</SelectItem>
                            ))}
                            {filteredUsersForCreation.length === 0 && <p className="p-2 text-xs text-muted-foreground">No users found.</p>}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createBookingForm.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allServicesData.map((service) => (
                              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createBookingForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mb-4">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createBookingForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Time</FormLabel>
                        <FormControl><Input placeholder="e.g., 02:00 PM" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createBookingForm.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Payment Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pay_later_pending">Pay Later Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createBookingForm.control}
                    name="meetingLink"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Meeting Link (Optional)</FormLabel>
                        <FormControl><Input placeholder="https://meet.google.com/..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            </form>
          </Form>
          <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsCreateBookingModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="createBookingForm_id">Create Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewFeedbackModalOpen} onOpenChange={(isOpen) => {
        setIsViewFeedbackModalOpen(isOpen);
        if (!isOpen) setSelectedBookingForFeedback(null);
      }}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[calc(100vh-4rem)]">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>Feedback for Booking: {selectedBookingForFeedback?.id}</DialogTitle>
            <DialogDesc>
              User: {selectedBookingForFeedback?.userName} ({selectedBookingForFeedback?.userEmail}) <br/>
              Service: {selectedBookingForFeedback?.serviceName}
            </DialogDesc>
          </DialogHeader>
          <ScrollArea className="flex-grow overflow-y-auto custom-scrollbar p-6">
            {selectedBookingForFeedback?.userFeedback && (
              <div className="mb-6">
                <h4 className="font-semibold text-md mb-2 text-primary">User's General Comments:</h4>
                <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{selectedBookingForFeedback.userFeedback}</p>
              </div>
            )}
            {selectedBookingForFeedback?.detailedFeedback && selectedBookingForFeedback.detailedFeedback.length > 0 && (
              <div>
                <h4 className="font-semibold text-md mb-3 text-primary">Mentor's Skill Ratings & Comments:</h4>
                <div className="space-y-3">
                  {selectedBookingForFeedback.detailedFeedback.map((fb, index) => (
                    <div key={index} className="border p-3 rounded-md bg-secondary/30">
                      <p className="font-semibold text-sm">{fb.skill}: <span className="font-normal text-primary">{fb.rating}</span></p>
                      {fb.comments && <p className="text-xs text-muted-foreground mt-1">Mentor Notes: {fb.comments}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!selectedBookingForFeedback?.userFeedback && (!selectedBookingForFeedback?.detailedFeedback || selectedBookingForFeedback.detailedFeedback.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No feedback has been recorded for this booking yet.</p>
            )}
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsViewFeedbackModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}
