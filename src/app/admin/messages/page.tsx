
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { UserMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, CornerDownRight, User, Shield, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Badge as UiBadge } from '@/components/ui/badge'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

const getMessages = httpsCallable(functions, 'getMessages');
const sendAdminReply = httpsCallable(functions, 'sendAdminReply');
const markMessagesAsRead = httpsCallable(functions, 'markMessagesAsRead');

const ITEMS_PER_PAGE = 5;

interface Conversation {
  userEmail: string;
  userName: string;
  subject: string;
  lastMessageTimestamp: Date;
  lastMessageSnippet: string;
  messages: UserMessage[];
  status: UserMessage['status'];
  conversationId?: string; 
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const { currentUser: adminUser } = useAuth();
  
  const [allMessagesData, setAllMessagesData] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: any = await getMessages();
      const fetchedMessages = result.data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
      }));
      setAllMessagesData(fetchedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please check your connection and Firestore rules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const groupedMessages = useMemo(() => {
    const groups: Record<string, UserMessage[]> = {};
    const sortedMessages = [...allMessagesData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedMessages.forEach(msg => {
        const conversationKey = msg.userEmail + (msg.subject.replace(/^Re: /i, '').trim());
        if (!groups[conversationKey]) {
            groups[conversationKey] = [];
        }
        groups[conversationKey].push(msg);
    });
    return groups;
  }, [allMessagesData]);

  const allConversationList = useMemo((): Conversation[] => {
    return Object.entries(groupedMessages).map(([conversationKey, messages]) => {
        const lastMessage = messages[messages.length - 1];
        let convStatus: UserMessage['status'] = 'read';

        const latestUserMessage = messages.slice().reverse().find(m => m.senderType === 'user');
        if (latestUserMessage) {
            if (latestUserMessage.status === 'new') {
                convStatus = 'new';
            } else {
                const adminRepliedAfter = messages.some(m => m.senderType === 'admin' && new Date(m.timestamp) > new Date(latestUserMessage.timestamp));
                convStatus = adminRepliedAfter ? 'replied' : 'read';
            }
        } else {
            convStatus = 'replied';
        }
        
        return {
            conversationId: conversationKey,
            userEmail: messages[0].userEmail,
            userName: messages[0].userName,
            subject: messages[0].subject.replace(/^Re: /i, '').trim(),
            lastMessageTimestamp: new Date(lastMessage.timestamp),
            lastMessageSnippet: `${lastMessage.senderType === 'admin' ? (lastMessage.adminName || 'Admin') + ': ' : ''}${lastMessage.messageBody.substring(0, 40)}${lastMessage.messageBody.length > 40 ? "..." : ""}`,
            messages,
            status: convStatus,
        };
    }).sort((a,b) => {
        const statusOrder = { new: 0, read: 1, replied: 2, closed: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime();
    });
  }, [groupedMessages]);

  const totalPages = Math.ceil(allConversationList.length / ITEMS_PER_PAGE);

  const paginatedConversationList = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allConversationList.slice(startIndex, endIndex);
  }, [currentPage, allConversationList]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  const handleViewConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setReplyText('');
    setIsModalOpen(true);

    const messageIdsToUpdate = conversation.messages
        .filter(msg => msg.senderType === 'user' && msg.status === 'new')
        .map(msg => msg.id);

    if (messageIdsToUpdate.length > 0) {
        try {
            await markMessagesAsRead({ messageIds: messageIdsToUpdate });
            await fetchMessages(); // Refresh data
            toast({ title: "Conversation Updated", description: "Messages marked as read."});
        } catch (err) {
            console.error("Error marking messages as read:", err);
            toast({ title: "Error", description: "Could not update message statuses.", variant: "destructive" });
        }
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim() || !adminUser) {
      toast({
        title: "Cannot Send",
        description: "Reply text cannot be empty or admin user not found.",
        variant: "destructive",
      });
      return;
    }

    try {
        await sendAdminReply({
            userUid: selectedConversation.messages.find(m => m.senderType === 'user')?.uid || '',
            userName: selectedConversation.userName,
            userEmail: selectedConversation.userEmail,
            subject: selectedConversation.subject,
            messageBody: replyText,
            adminName: adminUser.name || 'Admin Support',
        });
        
        toast({
          title: "Reply Sent",
          description: `Your reply to ${selectedConversation.userName} has been sent.`,
        });
        
        setReplyText('');
        await fetchMessages(); // Refresh data
    } catch (err) {
        console.error("Error sending reply:", err);
        toast({ title: "Send Failed", description: "Could not send reply.", variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <>
        <PageHeader
          title="User Conversations"
          description="View and respond to user inquiries."
        />
        <div className="container py-12 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="User Conversations"
          description="View and respond to user inquiries."
        />
        <div className="container py-12">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Messages</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="User Conversations"
        description="View and respond to user inquiries."
      />
      <Card>
        <CardHeader>
          <CardTitle>Message Threads</CardTitle>
          <CardDescription>
            Showing {paginatedConversationList.length} of {allConversationList.length} conversation(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedConversationList.length > 0 ? (
            <div className="space-y-3">
              {paginatedConversationList.map((conv) => (
                <Card
                    key={conv.conversationId || conv.userEmail + conv.subject}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewConversation(conv)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-md font-headline text-primary">{conv.subject}</CardTitle>
                            <CardDescription className="text-xs">
                                From: {conv.userName} ({conv.userEmail})
                            </CardDescription>
                        </div>
                        <UiBadge variant={
                            conv.status === 'new' ? 'destructive' :
                            conv.status === 'replied' ? 'default' :
                            'secondary'
                        }
                        className={cn(
                            conv.status === 'new' && 'bg-accent text-accent-foreground animate-pulse',
                            conv.status === 'replied' && 'bg-green-100 text-green-700',
                            conv.status === 'read' && 'bg-muted/70 text-muted-foreground'
                        )}
                        >
                        {conv.status.toUpperCase()}
                        </UiBadge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <p className="text-sm text-muted-foreground truncate">
                       {conv.lastMessageSnippet}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        Last update: {conv.lastMessageTimestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} {conv.lastMessageTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No messages yet.</p>
          )}
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

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) setSelectedConversation(null);
      }}>
        <DialogContent className="sm:max-w-2xl h-[calc(100vh-8rem)] md:h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conversation with: {selectedConversation?.userName}</DialogTitle>
            <DialogDesc>
              Subject: {selectedConversation?.subject} ({selectedConversation?.userEmail})
            </DialogDesc>
          </DialogHeader>
          <ScrollArea className="flex-grow p-4 border rounded-md my-4 bg-muted/20 custom-scrollbar">
            <div className="space-y-4">
              {selectedConversation?.messages.map((message) => (
                <div
                    key={message.id}
                    className={cn(
                        "p-3 rounded-lg max-w-[80%] text-sm",
                        message.senderType === 'user' ? "bg-card text-card-foreground self-start mr-auto shadow-sm border" : "bg-primary/90 text-primary-foreground self-end ml-auto shadow-sm"
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {message.senderType === 'user' ?
                            <User className="h-4 w-4 text-primary" /> :
                            <Shield className="h-4 w-4 text-accent" />
                        }
                        <span className="font-semibold text-xs">
                            {message.senderType === 'user' ? message.userName : message.adminName || 'Admin'}
                        </span>
                        <span className="text-xs text-muted-foreground/80">
                            {new Date(message.timestamp).toLocaleTimeString('en-US', { day: 'numeric', month:'short', hour: '2-digit', minute: '2-digit'})}
                        </span>
                    </div>
                  <p className="whitespace-pre-wrap">{message.messageBody}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-auto pt-4 border-t">
            <Label htmlFor="reply-text" className="font-semibold mb-2 block">Your Reply:</Label>
            <Textarea
              id="reply-text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              rows={3}
              className="mb-2"
            />
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                <Button type="button" onClick={handleSendReply} disabled={!replyText.trim()}>
                    <Send className="mr-2 h-4 w-4" /> Send Reply
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    