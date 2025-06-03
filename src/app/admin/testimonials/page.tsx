
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MOCK_TESTIMONIALS } from "@/constants";
import type { Testimonial } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, EyeOff } from 'lucide-react';

export default function AdminTestimonialsPage() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(MOCK_TESTIMONIALS);

  const handleApprovalToggle = (testimonialId: string, currentStatus: Testimonial['status']) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    setTestimonials(prev => 
      prev.map(t => t.id === testimonialId ? { ...t, status: newStatus } : t)
    );
    toast({
      title: "Testimonial Status Updated",
      description: `Testimonial ${testimonialId} is now ${newStatus}.`,
    });
    console.log(`Testimonial ${testimonialId} status changed to ${newStatus}`);
  };
  
  const handleReject = (testimonialId: string) => {
     setTestimonials(prev => 
      prev.map(t => t.id === testimonialId ? { ...t, status: 'rejected' } : t)
    );
    toast({
      title: "Testimonial Rejected",
      description: `Testimonial ${testimonialId} has been rejected.`,
      variant: "destructive"
    });
    console.log(`Testimonial ${testimonialId} status changed to rejected`);
  };


  return (
    <>
      <PageHeader
        title="Approve Testimonials"
        description="Review and manage user-submitted testimonials for display on your site."
      />
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Testimonial</TableHead>
                <TableHead>Service Taken</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">{testimonial.name}</TableCell>
                  <TableCell className="max-w-sm truncate">{testimonial.story}</TableCell>
                  <TableCell>{testimonial.serviceTaken}</TableCell>
                  <TableCell>
                    <Badge variant={
                      testimonial.status === 'approved' ? 'default' :
                      testimonial.status === 'pending' ? 'secondary' :
                      'destructive'
                    } className={testimonial.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {testimonial.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                     {testimonial.status !== 'rejected' && (
                        <Switch
                          checked={testimonial.status === 'approved'}
                          onCheckedChange={() => handleApprovalToggle(testimonial.id, testimonial.status)}
                          aria-label={testimonial.status === 'approved' ? 'Mark as Pending' : 'Approve Testimonial'}
                          id={`switch-${testimonial.id}`}
                        />
                     )}
                     {testimonial.status === 'approved' && <Eye className="inline h-5 w-5 text-green-600" />}
                     {testimonial.status === 'pending' && <EyeOff className="inline h-5 w-5 text-yellow-600" />}
                     {testimonial.status !== 'rejected' && testimonial.status !== 'approved' && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleReject(testimonial.id)}>
                            <X className="h-4 w-4 mr-1"/> Reject
                        </Button>
                     )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {testimonials.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No testimonials submitted yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
