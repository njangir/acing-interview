
'use client';

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';

import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
import { MoreHorizontal, CheckCircle, XCircle, CalendarClock, ShieldCheck, PlusCircle, CalendarIcon, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';

const createBookingFormSchema = z.object({
  userEmail: z.string().email({ message: "Invalid email address." }),
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
  status: z.enum(['upcoming', 'completed', 'cancelled', 'pending_approval'], { required_error: "Please select a booking status." }),
  paymentStatus: z.enum(['paid', 'pay_later_pending', 'pay_later_unpaid'], { required_error: "Please select a payment status." }),
});
type EditBookingFormValues = z.infer<typeof editBookingFormSchema>;


export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [forceUpdate, setForceUpdate] = useState(0); 
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);

  const createBookingForm = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingFormSchema),
    defaultValues: {
      userEmail: '',
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
      editBookingForm.reset({
        date: parse(selectedBookingForEdit.date, 'yyyy-MM-dd', new Date()),
        time: selectedBookingForEdit.time,
        meetingLink: selectedBookingForEdit.meetingLink || '',
        status: selectedBookingForEdit.status,
        paymentStatus: selectedBookingForEdit.paymentStatus,
      });
    }
  }, [selectedBookingForEdit, editBookingForm]);


  const handleAdminAction = (bookingId: string, action: 'accept' | 'cancel' | 'complete' | 'approve_refund') => {
    let message = '';
    let bookingUpdated = false;
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;
    const bookingToUpdate = MOCK_BOOKINGS[bookingIndex];

    if (action === 'accept') {
      message = `Booking ${bookingId} accepted and user notified.`;
      bookingToUpdate.status = 'upcoming';
      bookingUpdated = true;
    } else if (action === 'cancel') {
      message = `Booking ${bookingId} cancelled and user notified.`;
      bookingToUpdate.status = 'cancelled';
      bookingUpdated = true;
    } else if (action === 'complete') {
      message = `Booking ${bookingId} marked as completed.`;
      bookingToUpdate.status = 'completed';
      bookingUpdated = true;
    } else if (action === 'approve_refund') {
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

  function onCreateBookingSubmit(data: CreateBookingFormValues) {
    const selectedService = MOCK_SERVICES.find(s => s.id === data.serviceId);
    if (!selectedService) {
      toast({ title: "Error", description: "Selected service not found.", variant: "destructive" });
      return;
    }

    const newBooking: Booking = {
      id: `admin-booking-${Date.now()}`,
      userName: data.userName,
      userEmail: data.userEmail,
      serviceId: data.serviceId,
      serviceName: selectedService.name,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      paymentStatus: data.paymentStatus,
      status: data.paymentStatus === 'paid' ? 'upcoming' : 'pending_approval',
      meetingLink: data.meetingLink || `https://meet.google.com/mock-admin-${Math.random().toString(36).substring(2, 9)}`,
      transactionId: data.paymentStatus === 'paid' ? `admin_txn_${Date.now()}` : null,
      requestedRefund: false,
    };

    MOCK_BOOKINGS.unshift(newBooking); 
    setForceUpdate(prev => prev + 1);
    toast({
      title: "Booking Created",
      description: `Booking for ${data.userName} for ${selectedService.name} has been created.`,
    });
    setIsCreateBookingModalOpen(false);
    createBookingForm.reset();
  }

  function onEditBookingSubmit(data: EditBookingFormValues) {
    if (!selectedBookingForEdit) return;

    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === selectedBookingForEdit.id);
    if (bookingIndex === -1) {
      toast({ title: "Error", description: "Booking not found for update.", variant: "destructive" });
      return;
    }

    const updatedBooking: Booking = {
      ...MOCK_BOOKINGS[bookingIndex],
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      meetingLink: data.meetingLink || MOCK_BOOKINGS[bookingIndex].meetingLink, // Keep old if new is empty
      status: data.status,
      paymentStatus: data.paymentStatus,
    };

    MOCK_BOOKINGS[bookingIndex] = updatedBooking;
    setForceUpdate(prev => prev + 1);
    toast({
      title: "Booking Updated",
      description: `Booking for ${updatedBooking.userName} has been successfully updated.`,
    });
    setIsEditBookingModalOpen(false);
    setSelectedBookingForEdit(null);
  }

  const currentBookings = [...MOCK_BOOKINGS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <PageHeader
        title="Manage Booking Requests"
        description="Review, accept, edit, cancel, or create new booking requests."
      />
       <div className="mb-6 text-right">
        <Button onClick={() => setIsCreateBookingModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Booking
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>View and manage all bookings. Current count: {currentBookings.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
              {currentBookings.length > 0 ? currentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.userName}</div>
                    <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                  </TableCell>
                  <TableCell>{booking.serviceName}</TableCell>
                  <TableCell>{new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {booking.time}</TableCell>
                  <TableCell>
                    <Badge variant={
                        booking.status === 'pending_approval' ? 'secondary' : 
                        booking.status === 'upcoming' ? 'default' : 
                        booking.status === 'completed' ? 'outline' : 'destructive'
                    }
                    className={
                        booking.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' : ''
                    }>
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                   <TableCell>
                     <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className={booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                     >
                       {booking.paymentStatus.replace('_', ' ').toUpperCase()}
                     </Badge>
                   </TableCell>
                   <TableCell>
                    {booking.requestedRefund ? (
                        <Badge variant="destructive">YES</Badge>
                    ) : (
                        <Badge variant="outline">NO</Badge>
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
                          <DropdownMenuItem onClick={() => openEditModal(booking)}>
                                <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit / Reschedule
                          </DropdownMenuItem>
                          {booking.status === 'pending_approval' && (
                            <DropdownMenuItem onClick={() => handleAdminAction(booking.id, 'accept')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Accept
                            </DropdownMenuItem>
                          )}
                           {booking.requestedRefund && booking.status === 'upcoming' && booking.paymentStatus === 'paid' && (
                             <DropdownMenuItem onClick={() => handleAdminAction(booking.id, 'approve_refund')} className="text-green-600 hover:!text-green-600">
                                <ShieldCheck className="mr-2 h-4 w-4" /> Approve Refund
                              </DropdownMenuItem>
                           )}
                           {booking.status === 'upcoming' && (
                            <DropdownMenuItem onClick={() => handleAdminAction(booking.id, 'complete')}>
                                Mark as Completed
                            </DropdownMenuItem>
                           )}
                          <DropdownMenuSeparator />
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem 
                                 className={`text-red-600 hover:!text-red-600 ${booking.status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : '' }`}
                                 disabled={booking.status === 'cancelled'}
                                 onSelect={(e) => { if (booking.status === 'cancelled') e.preventDefault();}}
                                >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel Booking
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently cancel the booking for {booking.userName} and notify them.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleAdminAction(booking.id, 'cancel')}>
                                  Confirm Cancellation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow><TableCell colSpan={7} className="text-center h-24">No bookings found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Booking Modal */}
      <Dialog open={isEditBookingModalOpen} onOpenChange={(isOpen) => {
        setIsEditBookingModalOpen(isOpen);
        if (!isOpen) setSelectedBookingForEdit(null); // Clear selected booking on close
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
                            <SelectItem value="upcoming">Upcoming</SelectItem>
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

      {/* Create Booking Modal */}
      <Dialog open={isCreateBookingModalOpen} onOpenChange={(isOpen) => {
        setIsCreateBookingModalOpen(isOpen);
        if (!isOpen) createBookingForm.reset();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDesc>Manually create a booking for a user.</DialogDesc>
          </DialogHeader>
          <Form {...createBookingForm}>
            <form onSubmit={createBookingForm.handleSubmit(onCreateBookingSubmit)} className="space-y-4 py-4">
              <FormField
                control={createBookingForm.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Name</FormLabel>
                    <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createBookingForm.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Email</FormLabel>
                    <FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl>
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
                <Button type="submit">Create Booking</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
