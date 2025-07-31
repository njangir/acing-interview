
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { UserMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, CornerDownRight, User, Shield, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Lock, Unlock } from 'lucide-react';
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
const toggleMessageThreadStatus = httpsCallable(functions, 'toggleMessageThreadStatus');


const ITEMS_PER_PAGE = 10;

interface Conversation {
  userEmail: string;
  userName: string;
  subject: string;
  lastMessageTimestamp: Date;
  lastMessageSnippet: string;
  messages: UserMessage[];
  status: UserMessage['status'];
  conversationId: string; 
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const { currentUser: adminUser } = useAuth();
  
  const [allMessagesData, setAllMessagesData] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);


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
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedConversation, replyText]);

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
        let convStatus: UserMessage['status'] = lastMessage.status;

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
        const statusOrder: Record<string, number> = { new: 0, read: 1, replied: 2, closed: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
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
    setIsSubmitting(true);
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
        // Optimistically add the new message to the UI
        const optimisticNewMessage: UserMessage = {
          id: `temp_${Date.now()}`,
          uid: selectedConversation.messages.find(m => m.senderType === 'user')?.uid || '',
          userName: adminUser.name,
          userEmail: selectedConversation.userEmail,
          subject: selectedConversation.subject,
          messageBody: replyText,
          timestamp: new Date(),
          status: 'replied',
          senderType: 'admin',
          adminName: adminUser.name,
        };
        setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, optimisticNewMessage], status: 'replied' } : null);
        
        await fetchMessages(); // Refresh data to get real message
    } catch (err) {
        console.error("Error sending reply:", err);
        toast({ title: "Send Failed", description: "Could not send reply.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleToggleThreadLock = async () => {
    if (!selectedConversation) return;
    const newStatus = selectedConversation.status === 'closed' ? 'replied' : 'closed';
    setIsSubmitting(true);
    try {
      await toggleMessageThreadStatus({
        userEmail: selectedConversation.userEmail,
        subject: selectedConversation.subject,
        status: newStatus,
      });
      toast({
        title: "Conversation Updated",
        description: `Thread has been ${newStatus}.`
      });
      setSelectedConversation(prev => prev ? { ...prev, status: newStatus } : null);
      await fetchMessages();
    } catch (err: any) {
      console.error("Error toggling thread status:", err);
      toast({ title: "Update Failed", description: err.message || "Could not update conversation status.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Message Threads</CardTitle>
            <CardDescription>
              Showing {paginatedConversationList.length} of {allConversationList.length} conversation(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto custom-scrollbar p-2">
            {paginatedConversationList.length > 0 ? (
              <div className="space-y-2">
                {paginatedConversationList.map((conv) => (
                  <button
                      key={conv.conversationId}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50",
                        selectedConversation?.conversationId === conv.conversationId ? "bg-primary/10 border-primary" : "bg-card"
                      )}
                      onClick={() => handleViewConversation(conv)}
                  >
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-semibold text-sm text-primary truncate">{conv.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                  {conv.userName}
                              </p>
                          </div>
                          <UiBadge variant={
                              conv.status === 'new' ? 'destructive' :
                              conv.status === 'replied' ? 'default' :
                              conv.status === 'closed' ? 'secondary' :
                              'outline'
                          }
                          className={cn(
                              conv.status === 'new' && 'bg-accent text-accent-foreground animate-pulse',
                              conv.status === 'replied' && 'bg-green-100 text-green-700',
                              conv.status === 'read' && 'bg-muted/70 text-muted-foreground',
                              conv.status === 'closed' && 'bg-gray-200 text-gray-600'
                          )}
                          >
                          {conv.status.toUpperCase()}
                          </UiBadge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                         {conv.lastMessageSnippet}
                      </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No messages yet.</p>
            )}
          </CardContent>
           {totalPages > 1 && (
            <CardFooter className="flex justify-center items-center space-x-4 py-4 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                size="sm"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
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

        <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
                <>
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-headline text-lg">{selectedConversation.subject}</CardTitle>
                            <CardDescription>
                                Conversation with {selectedConversation.userName} ({selectedConversation.userEmail})
                            </CardDescription>
                        </div>
                        <Button
                          variant={selectedConversation.status === 'closed' ? 'secondary' : 'destructive'}
                          size="sm"
                          onClick={handleToggleThreadLock}
                          disabled={isSubmitting}
                          title={selectedConversation.status === 'closed' ? "Re-open this thread" : "Close this thread"}
                        >
                          {selectedConversation.status === 'closed' ? (
                            <Unlock className="mr-2 h-4 w-4" />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" />
                          )}
                          {selectedConversation.status === 'closed' ? 'Re-open' : 'Close Thread'}
                        </Button>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-grow p-4 bg-muted/20" ref={chatContainerRef}>
                    <div className="space-y-4">
                    {selectedConversation.messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "p-3 rounded-lg max-w-[80%] w-fit text-sm flex flex-col",
                                message.senderType === 'user' ? "bg-card text-card-foreground self-start mr-auto shadow-sm border" : "bg-primary text-primary-foreground self-end ml-auto shadow-sm"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {message.senderType === 'user' ?
                                    <User className="h-4 w-4 text-muted-foreground" /> :
                                    <Shield className="h-4 w-4 text-accent" />
                                }
                                <span className="font-semibold text-xs">
                                    {message.senderType === 'user' ? message.userName : message.adminName || 'Admin'}
                                </span>
                            </div>
                            <p className="whitespace-pre-wrap">{message.messageBody}</p>
                            <p className={cn("text-xs mt-2 self-end", message.senderType === 'user' ? 'text-muted-foreground' : 'text-primary-foreground/70')}>
                                {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}
                            </p>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                 <CardFooter className="pt-4 border-t">
                    <div className="w-full">
                        <Label htmlFor="reply-text" className="font-semibold mb-2 block">Your Reply:</Label>
                        <Textarea
                        id="reply-text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={selectedConversation.status === 'closed' ? "This thread is closed. Re-open to reply." : "Type your reply here..."}
                        rows={3}
                        className="mb-2"
                        disabled={isSubmitting || selectedConversation.status === 'closed'}
                        />
                        <div className="text-right">
                          <Button type="button" onClick={handleSendReply} disabled={!replyText.trim() || isSubmitting || selectedConversation.status === 'closed'}>
                              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                              {isSubmitting ? 'Sending...' : 'Send Reply'}
                          </Button>
                        </div>
                    </div>
                 </CardFooter>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Mail className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Select a conversation to view messages.</p>
                </div>
            )}
        </Card>
      </div>
    </>
  );
}

