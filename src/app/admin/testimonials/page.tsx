
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MOCK_TESTIMONIALS, MOCK_BADGES } from "@/constants";
import type { Testimonial, Badge as BadgeType, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, EyeOff, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

export default function AdminTestimonialsPage() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(MOCK_TESTIMONIALS);
  const [filterBadgeId, setFilterBadgeId] = useState<string>('all');

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

  const filteredTestimonials = useMemo(() => {
    if (filterBadgeId === 'all') {
      return testimonials;
    }
    return testimonials.filter(testimonial => {
      if (!testimonial.userEmail) return false;
      
      // Simulate fetching user profile and their badges based on email
      // In a real app, this would be an API call or a more robust lookup.
      // For this demo, we'll check against the localStorage pattern used in profile page.
      const mockUserProfileKey = `mockUserProfile_${testimonial.userEmail}`;
      const storedProfileData = localStorage.getItem(mockUserProfileKey);
      
      if (storedProfileData) {
        const userProfile: UserProfile = JSON.parse(storedProfileData);
        return userProfile.awardedBadges?.some(badge => badge.id === filterBadgeId);
      }
      return false;
    });
  }, [testimonials, filterBadgeId]);


  return (
    <>
      <PageHeader
        title="Approve Testimonials"
        description="Review and manage user-submitted testimonials for display on your site."
      />
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Submissions</CardTitle>
          <CardDescription>
            Filter testimonials by awarded badges to evaluate relevance and user progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="badge-filter" className="text-sm font-medium">Filter by Badge:</Label>
            <div className="flex items-center gap-2 mt-1">
                <Filter className="h-5 w-5 text-muted-foreground"/>
                <Select value={filterBadgeId} onValueChange={setFilterBadgeId}>
                    <SelectTrigger id="badge-filter" className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select a badge to filter..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Badges</SelectItem>
                        {MOCK_BADGES.map((badge: BadgeType) => (
                        <SelectItem key={badge.id} value={badge.id}>
                            {badge.force !== "General" && <span className='text-xs text-muted-foreground mr-1'>[{badge.force}]</span>} {badge.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>

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
              {filteredTestimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">
                    <div>{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.userEmail || 'N/A'}</div>
                  </TableCell>
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
               {filteredTestimonials.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        No testimonials found matching the current filter.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {testimonials.length === 0 && filterBadgeId === 'all' && ( // Only show if no testimonials at all
            <p className="text-center text-muted-foreground py-4">No testimonials submitted yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
