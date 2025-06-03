
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_BOOKINGS } from "@/constants"; // Using MOCK_BOOKINGS as it now has user details
import type { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, CheckCircle, XCircle, CalendarClock } from 'lucide-react';

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS.filter(b => b.status === 'pending_approval' || b.status === 'upcoming'));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const handleAction = (bookingId: string, action: 'accept' | 'cancel' | 'complete') => {
    // Simulate backend action
    console.log(`Booking ${bookingId} action: ${action}`);
    let message = '';
    if (action === 'accept') {
      setBookings(prev => prev.map(b => b.id === bookingId ? {...b, status: 'upcoming'} : b));
      message = `Booking ${bookingId} accepted and user notified.`;
    } else if (action === 'cancel') {
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      message = `Booking ${bookingId} cancelled and user notified.`;
    } else if (action === 'complete') {
      setBookings(prev => prev.map(b => b.id === bookingId ? {...b, status: 'completed'} : b));
      message = `Booking ${bookingId} marked as completed.`;
    }
    toast({ title: "Action Successful", description: message });
  };

  const handleRescheduleSubmit = () => {
    if (!selectedBooking || !rescheduleReason) return;
    console.log(`Reschedule booking ${selectedBooking.id}. Reason: ${rescheduleReason}. New date/time would be handled here.`);
    toast({ title: "Reschedule Requested", description: `Reschedule for booking ${selectedBooking.id} initiated. User will be notified. Reason: ${rescheduleReason}` });
    setRescheduleReason('');
    // Close dialog - Dialog state would typically be managed with useState
  };

  return (
    <>
      <PageHeader
        title="Manage Booking Requests"
        description="Review, accept, reschedule, or cancel booking requests."
      />
      <Card>
        <CardHeader>
          <CardTitle>Pending & Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.userName}</div>
                    <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                  </TableCell>
                  <TableCell>{booking.serviceName}</TableCell>
                  <TableCell>{new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {booking.time}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
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
                          <DialogTrigger asChild>
                             <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                                <CalendarClock className="mr-2 h-4 w-4 text-orange-500" /> Reschedule
                              </DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuSeparator />
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem className="text-red-600 hover:!text-red-600">
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
                       {/* Reschedule Dialog Content (shared) */}
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Reschedule Booking</DialogTitle>
                            <DialogDescription>
                              Propose a new date/time or provide a reason for rescheduling for {selectedBooking?.userName}'s booking of {selectedBooking?.serviceName}.
                            </DialogDescription>
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
                            {/* Add date/time pickers here if needed for direct rescheduling */}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => console.log('close dialog')}>Cancel</Button> {/* This should close dialog */}
                            <Button type="submit" onClick={handleRescheduleSubmit}>Request Reschedule</Button>
                          </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {bookings.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No pending or upcoming bookings.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
