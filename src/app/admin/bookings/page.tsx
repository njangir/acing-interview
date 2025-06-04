
'use client';

import { useState, useEffect } from 'react';
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
import { MOCK_BOOKINGS, MOCK_SERVICES } from "@/constants";
import type { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, CheckCircle, XCircle, CalendarClock, ShieldCheck, PlusCircle, CalendarIcon, Edit, Filter, InfoIcon, Video } from 'lucide-react';
import { Badge as UiBadge } from '@/components/ui/badge'; // Renamed to avoid conflict
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import Link from 'next/link';

const createBookingFormSchema = z.object({
  userEmails: z.string().min(1, { message: "At least one email address is required." }),
  userName: z.string().min(2, { message: "User name must be at least 2 characters." }),
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
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);
  const [filterServiceId, setFilterServiceId] = useState<string>('all');

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);


  const createBookingForm = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingFormSchema),
    defaultValues: {
      userEmails: '',
      userName: '',
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
      if (currentStatus === 'upcoming') {
        currentStatus = selectedBookingForEdit.meetingLink ? 'scheduled' : 'accepted';
      }

      editBookingForm.reset({
        date: parse(selectedBookingForEdit.date, 'yyyy-MM-dd', new Date()),
        time: selectedBookingForEdit.time,
        meetingLink: selectedBookingForEdit.meetingLink || '',
        status: currentStatus as EditBookingFormValues['status'],
        paymentStatus: selectedBookingForEdit.paymentStatus,
      });
    }
  }, [selectedBookingForEdit, editBookingForm]);


  const handleAdminAction = (bookingId: string, action: 'accept' | 'cancel' | 'complete' | 'approve_refund') => {
    let message = '';
    let bookingUpdated = false;
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;

    const bookingToUpdate = { ...MOCK_BOOKINGS[bookingIndex] };

    if (action === 'accept') {
      message = `Booking ${bookingId} accepted. User will be notified. Please add meeting link to schedule.`;
      bookingToUpdate.status = 'accepted';
      bookingUpdated = true;
    } else if (action === 'cancel') {
      message = `Booking ${bookingId} cancelled and user notified.`;
      bookingToUpdate.status = 'cancelled';
      bookingUpdated = true;
    } else if (action === 'complete') {
      message = `Booking ${bookingId} marked as completed.`;
      bookingToUpdate.status = 'completed';
      bookingUpdated = true;
    } else if (action === 'approve_refund' && bookingToUpdate.paymentStatus === 'paid' && bookingToUpdate.requestedRefund) {
      message = `Refund for booking ${bookingId} approved. Booking cancelled.`;
      bookingToUpdate.status = 'cancelled';
      bookingToUpdate.paymentStatus = 'pay_later_unpaid';
      bookingToUpdate.requestedRefund = false;
      bookingUpdated = true;
    }

    if (bookingUpdated) {
      MOCK_BOOKINGS[bookingIndex] = bookingToUpdate;
      toast({ title: "Action Successful", description: message });
      setForceUpdate(prev => prev + 1);
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

  function onCreateBookingSubmit(data: CreateBookingFormValues) {
    const selectedService = MOCK_SERVICES.find(s => s.id === data.serviceId);
    if (!selectedService) {
      toast({ title: "Error", description: "Selected service not found.", variant: "destructive" });
      return;
    }

    const emails = data.userEmails.split(',').map(email => email.trim()).filter(email => email);
    if (emails.length === 0) {
        toast({ title: "Error", description: "Please enter at least one valid email.", variant: "destructive" });
        return;
    }

    let bookingsCreatedCount = 0;
    emails.forEach((email, index) => {
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            toast({ title: "Skipped Invalid Email", description: `Skipped "${email}" as it's not a valid email format.`, variant: "destructive" });
            return;
        }
        
        let initialStatus: Booking['status'];
        if (data.paymentStatus === 'paid') {
            initialStatus = data.meetingLink ? 'scheduled' : 'accepted';
        } else {
            initialStatus = 'pending_approval';
        }

        const newBooking: Booking = {
          id: `admin-booking-${Date.now()}-${index}`,
          userName: data.userName,
          userEmail: email,
          serviceId: data.serviceId,
          serviceName: selectedService.name,
          date: format(data.date, 'yyyy-MM-dd'),
          time: data.time,
          paymentStatus: data.paymentStatus,
          status: initialStatus,
          meetingLink: data.meetingLink || (initialStatus === 'scheduled' ? `https://meet.google.com/mock-admin-${Math.random().toString(36).substring(2, 9)}` : ''),
          transactionId: data.paymentStatus === 'paid' ? `admin_txn_${Date.now()}-${index}` : null,
          requestedRefund: false,
        };
        MOCK_BOOKINGS.unshift(newBooking);
        bookingsCreatedCount++;
    });

    if (bookingsCreatedCount > 0) {
        setForceUpdate(prev => prev + 1);
        toast({
          title: `${bookingsCreatedCount > 1 ? 'Group Booking' : 'Booking'} Created`,
          description: `${bookingsCreatedCount} booking(s) for ${data.userName} for ${selectedService.name} has been created.`,
        });
        setIsCreateBookingModalOpen(false);
        createBookingForm.reset();
    }
  }

  function onEditBookingSubmit(data: EditBookingFormValues) {
    if (!selectedBookingForEdit) return;

    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === selectedBookingForEdit.id);
    if (bookingIndex === -1) {
      toast({ title: "Error", description: "Booking not found for update.", variant: "destructive" });
      return;
    }

    const bookingToUpdate = MOCK_BOOKINGS[bookingIndex];
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
    if (data.status === 'upcoming') { 
        newStatus = data.meetingLink ? 'scheduled' : 'accepted';
    }

    const updatedBooking: Booking = {
      ...bookingToUpdate,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      meetingLink: data.meetingLink || '', 
      status: newStatus,
      paymentStatus: data.paymentStatus,
    };

    MOCK_BOOKINGS[bookingIndex] = updatedBooking;
    setForceUpdate(prev => prev + 1);
    toast({
      title: "Booking Updated",
      description: `Booking for ${updatedBooking.userName} has been successfully updated. Status: ${updatedBooking.status}.`,
    });
    setIsEditBookingModalOpen(false);
    setSelectedBookingForEdit(null);
  }

  const getFilteredBookings = () => {
    let bookings = [...MOCK_BOOKINGS].sort((a, b) => {
      if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
      if (b.status === 'pending_approval' && a.status !== 'pending_approval') return 1;
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; 
    });

    if (filterServiceId !== 'all') {
      bookings = bookings.filter(booking => booking.serviceId === filterServiceId);
    }
    return bookings;
  };

  const currentFilteredBookings = getFilteredBookings();


  return (
    <>
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
                    {MOCK_SERVICES.map(service => (
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
          <CardDescription>View and manage all bookings. Showing: {currentFilteredBookings.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking / Txn ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Refund Req.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentFilteredBookings.length > 0 ? currentFilteredBookings.map((booking) => {
                const showAsAddLink = booking.status === 'accepted' && booking.paymentStatus === 'paid' && !booking.meetingLink;
                return (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium text-xs">{booking.id}</div>
                    {booking.paymentStatus === 'paid' && booking.transactionId && (
                        <div className="text-xs text-muted-foreground mt-1">Txn: {booking.transactionId}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.userName}</div>
                    <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                  </TableCell>
                  <TableCell>{booking.serviceName}</TableCell>
                  <TableCell>{new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {booking.time}</TableCell>
                  <TableCell>
                     <UiBadge
                        variant={
                            booking.status === 'pending_approval' ? 'secondary' :
                            booking.status === 'accepted' ? 'outline' :
                            booking.status === 'scheduled' ? 'default' :
                            booking.status === 'completed' ? 'outline' :
                            'destructive'
                        }
                        className={cn(
                            booking.status === 'scheduled' && 'bg-blue-100 text-blue-700',
                            booking.status === 'pending_approval' && 'bg-yellow-100 text-yellow-700',
                            booking.status === 'accepted' && 'bg-orange-100 text-orange-700',
                            booking.status === 'cancelled' && 'bg-red-100 text-red-700 line-through opacity-75'
                        )}
                    >
                        {booking.status.replace('_', ' ').toUpperCase()}
                    </UiBadge>
                  </TableCell>
                   <TableCell>
                     <UiBadge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className={cn(
                        booking.paymentStatus === 'paid' && 'bg-green-100 text-green-700',
                        booking.paymentStatus === 'pay_later_unpaid' && 'bg-gray-100 text-gray-700 line-through opacity-75',
                        booking.paymentStatus === 'pay_later_pending' && 'bg-orange-100 text-orange-700'
                      )}
                     >
                       {booking.paymentStatus.replace('_', ' ').toUpperCase()}
                     </UiBadge>
                   </TableCell>
                   <TableCell>
                    {booking.requestedRefund ? (
                        <UiBadge variant="destructive">YES</UiBadge>
                    ) : (
                        <UiBadge variant="outline">NO</UiBadge>
                    )}
                    {booking.requestedRefund && booking.refundReason && (
                        <p className="text-xs text-muted-foreground mt-1 truncate w-24 hover:w-auto hover:whitespace-normal" title={booking.refundReason}>
                            Reason: {booking.refundReason}
                        </p>
                    )}
                   </TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
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
                          {booking.status === 'pending_approval' && (
                            <DropdownMenuItem onClick={() => handleAdminAction(booking.id, 'accept')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Accept Request
                            </DropdownMenuItem>
                          )}
                           {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.paymentStatus === 'paid' && booking.requestedRefund &&(
                             <DropdownMenuItem onClick={() => handleAdminAction(booking.id, 'approve_refund')} className="text-green-600 hover:!text-green-600">
                                <ShieldCheck className="mr-2 h-4 w-4" /> Approve Refund
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
                  </TableCell>
                </TableRow>
              );
            }) : (
                 <TableRow><TableCell colSpan={8} className="text-center h-24">No bookings found matching the criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

       <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently cancel the booking for {bookingToCancel?.userName} and notify them.
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


      <Dialog open={isEditBookingModalOpen} onOpenChange={(isOpen) => {
        setIsEditBookingModalOpen(isOpen);
        if (!isOpen) setSelectedBookingForEdit(null);
      }}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Edit Booking: {selectedBookingForEdit?.id}</DialogTitle>
                <DialogDesc>
                    Modify details for {selectedBookingForEdit?.userName}'s booking of {selectedBookingForEdit?.serviceName}.
                </DialogDesc>
            </DialogHeader>
            {selectedBookingForEdit && (
              <Form {...editBookingForm}>
                <form onSubmit={editBookingForm.handleSubmit(onEditBookingSubmit)} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <FormItem className="flex flex-col">
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
                      <FormItem>
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
                      <FormItem>
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
                      <FormItem>
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
                      <FormItem>
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
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditBookingModalOpen(false)}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateBookingModalOpen} onOpenChange={(isOpen) => {
        setIsCreateBookingModalOpen(isOpen);
        if (!isOpen) createBookingForm.reset();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDesc>Manually create a booking. For group bookings, enter comma-separated emails.</DialogDesc>
          </DialogHeader>
          <Form {...createBookingForm}>
            <form onSubmit={createBookingForm.handleSubmit(onCreateBookingSubmit)} className="space-y-4 py-4">
              <FormField
                control={createBookingForm.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Name</FormLabel>
                    <FormControl><Input placeholder="Full Name (will be same for all in group)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createBookingForm.control}
                name="userEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Email(s)</FormLabel>
                    <FormControl><Textarea placeholder="user@example.com, another@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createBookingForm.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_SERVICES.map((service) => (
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
                  <FormItem className="flex flex-col">
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
                  <FormItem>
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
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>Meeting Link (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://meet.google.com/..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateBookingModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Booking(s)</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
