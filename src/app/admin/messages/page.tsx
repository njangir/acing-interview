
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MOCK_USER_MESSAGES } from "@/constants";
import type { UserMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, MailCheck, MailWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<UserMessage[]>(MOCK_USER_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState<UserMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const handleViewReply = (message: UserMessage) => {
    setSelectedMessage(message);
    setReplyText(''); // Clear previous reply text
    // If message is 'new', mark as 'read' (simulated)
    if (message.status === 'new') {
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'read' } : m));
    }
    setIsReplyModalOpen(true);
  };

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) {
      toast({
        title: "Cannot Send",
        description: "Reply text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    // Simulate sending reply
    console.log(`Replying to message ID ${selectedMessage.id} from ${selectedMessage.userEmail} with: ${replyText}`);
    setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, status: 'replied' } : m));
    
    toast({
      title: "Reply Sent (Simulated)",
      description: `Your reply to ${selectedMessage.userName} has been 'sent'.`,
    });
    setIsReplyModalOpen(false);
    setSelectedMessage(null);
  };

  return (
    <>
      <PageHeader
        title="User Messages"
        description="View and respond to messages submitted by users."
      />
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Showing {messages.length} message(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length > 0 ? messages.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div className="font-medium">{message.userName}</div>
                    <div className="text-xs text-muted-foreground">{message.userEmail}</div>
                  </TableCell>
                  <TableCell>{message.subject}</TableCell>
                  <TableCell>{message.timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}</TableCell>
                  <TableCell>
                    <Badge variant={
                        message.status === 'new' ? 'destructive' : 
                        message.status === 'read' ? 'secondary' : 
                        'default'
                    }
                    className={message.status === 'replied' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {message.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewReply(message)}>
                      <Eye className="mr-2 h-4 w-4" /> View / Reply
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">No messages yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Message from: {selectedMessage?.userName}</DialogTitle>
            <DialogDescription>
              Subject: {selectedMessage?.subject} <br/>
              Received: {selectedMessage?.timestamp.toLocaleString('en-GB')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="message-body" className="font-semibold">Message:</Label>
                <div className="p-3 border rounded-md bg-secondary/30 text-sm max-h-48 overflow-y-auto">
                    {selectedMessage?.messageBody}
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-text" className="font-semibold">Your Reply:</Label>
              <Textarea
                id="reply-text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                rows={5}
                disabled={selectedMessage?.status === 'replied'}
              />
               {selectedMessage?.status === 'replied' && (
                <p className="text-xs text-green-600 flex items-center"><MailCheck className="h-4 w-4 mr-1"/> You have already replied to this message.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReplyModalOpen(false)}>Close</Button>
            {selectedMessage?.status !== 'replied' && (
              <Button type="button" onClick={handleSendReply} disabled={!replyText.trim()}>
                <Send className="mr-2 h-4 w-4" /> Send Reply
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
