
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_BOOKINGS } from "@/constants"; 
import type { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, CheckCircle, XCircle, CalendarClock, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminBookingsPage() {
  const { toast } = useToast();
  // We will use MOCK_BOOKINGS directly in the render.
  // This state is to force re-render after an admin action.
  const [, setForceUpdate] = useState(0); 

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const handleAction = (bookingId: string, action: 'accept' | 'cancel' | 'complete' | 'approve_refund') => {
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
      bookingToUpdate.paymentStatus = 'pay_later_unpaid'; // Or a dedicated 'refunded' status
      bookingToUpdate.requestedRefund = false; 
      bookingUpdated = true;
    }
    
    if (bookingUpdated) {
      MOCK_BOOKINGS[bookingIndex] = bookingToUpdate;
      toast({ title: "Action Successful", description: message });
      setForceUpdate(prev => prev + 1); // Force re-render
    }
  };

  const handleRescheduleSubmit = () => {
    if (!selectedBooking || !rescheduleReason) return;
    // Simulate reschedule logic
    console.log(`Reschedule booking ${selectedBooking.id}. Reason: ${rescheduleReason}. New date/time would be handled here.`);
    toast({ title: "Reschedule Requested", description: `Reschedule for booking ${selectedBooking.id} initiated. User will be notified. Reason: ${rescheduleReason}` });
    setRescheduleReason('');
    setIsRescheduleModalOpen(false);
    // Potentially update MOCK_BOOKINGS and setForceUpdate if reschedule changes status/data
  };
  
  const openRescheduleModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsRescheduleModalOpen(true);
  }

  // Render directly from MOCK_BOOKINGS to always get the latest data
  const currentBookings = [...MOCK_BOOKINGS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <>
      <PageHeader
        title="Manage Booking Requests"
        description="Review, accept, reschedule, or cancel booking requests."
      />
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
                          {booking.status === 'pending_approval' && (
                            <DropdownMenuItem onClick={() => handleAction(booking.id, 'accept')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Accept
                            </DropdownMenuItem>
                          )}
                           <DropdownMenuItem onClick={() => openRescheduleModal(booking)}>
                                <CalendarClock className="mr-2 h-4 w-4 text-orange-500" /> Reschedule
                            </DropdownMenuItem>
                           {booking.requestedRefund && booking.status === 'upcoming' && booking.paymentStatus === 'paid' && (
                             <DropdownMenuItem onClick={() => handleAction(booking.id, 'approve_refund')} className="text-green-600 hover:!text-green-600">
                                <ShieldCheck className="mr-2 h-4 w-4" /> Approve Refund
                              </DropdownMenuItem>
                           )}
                          <DropdownMenuSeparator />
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem 
                                 className={`text-red-600 hover:!text-red-600 ${booking.status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : '' }`}
                                 disabled={booking.status === 'cancelled'}
                                 onSelect={(e) => { if (booking.status === 'cancelled') e.preventDefault();}} // Prevent opening if cancelled
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
                                  onClick={() => handleAction(booking.id, 'cancel')}>
                                  Confirm Cancellation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                           {booking.status === 'upcoming' && (
                            <DropdownMenuItem onClick={() => handleAction(booking.id, 'complete')}>
                                Mark as Completed
                            </DropdownMenuItem>
                           )}
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
      
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Reschedule Booking</DialogTitle>
                <DialogDesc>
                    Propose a new date/time or provide a reason for rescheduling for {selectedBooking?.userName}'s booking of {selectedBooking?.serviceName}.
                </DialogDesc>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reschedule-reason" className="text-right">
                    Reason
                    </Label>
                    <Textarea
                    id="reschedule-reason"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="col-span-3"
                    placeholder="Reason for rescheduling (e.g., mentor unavailability, propose new slots)"
                    />
                </div>
                {/* Add fields for new date/time selection here if implementing full reschedule */}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleRescheduleSubmit}>Request Reschedule</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
