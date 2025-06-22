
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MOCK_USER_MESSAGES, MOCK_USER_PROFILE_FOR_CONTACT } from "@/constants"; // MOCK_USER_MESSAGES for fallback
import type { UserMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, CornerDownRight, User, Shield, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Badge as UiBadge } from '@/components/ui/badge'; // Renamed to avoid conflict if Badge type is also used
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth'; // For admin user details

// PRODUCTION TODO: Import Firebase and Firestore methods
// import { db } from '@/lib/firebase';
// import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where, writeBatch, getDocs } from 'firebase/firestore';

const ITEMS_PER_PAGE = 5;
// const POLLING_INTERVAL = 5000; // Replaced by Firestore real-time updates recommendation

interface Conversation {
  userEmail: string;
  userName: string;
  subject: string;
  lastMessageTimestamp: Date;
  lastMessageSnippet: string;
  messages: UserMessage[];
  status: UserMessage['status'];
  // Potentially add a unique conversation ID if not just grouping by email/subject
  conversationId?: string; 
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const { currentUser: adminUser } = useAuth();
  
  const [allMessagesData, setAllMessagesData] = useState<UserMessage[]>(MOCK_USER_MESSAGES); // Holds fetched or mock messages
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // PRODUCTION TODO: Fetch messages from Firestore using onSnapshot for real-time updates.
    // This replaces the polling mechanism.
    /*
    const messagesColRef = collection(db, 'userMessages');
    const q = query(messagesColRef, orderBy('timestamp', 'desc')); // Adjust orderBy as needed

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp), // Ensure timestamp is a Date object
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as UserMessage;
      });
      setAllMessagesData(fetchedMessages);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error with real-time messages listener:", err);
      setError("Failed to load messages in real-time. Displaying potentially stale data.");
      setAllMessagesData(MOCK_USER_MESSAGES); // Fallback to mock for UI
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
    */

    // MOCK: Simulate initial fetch
    setTimeout(() => {
        setAllMessagesData([...MOCK_USER_MESSAGES]); // Use a copy for local state
        setIsLoading(false);
    }, 500);

  }, []); // Empty dependency array for initial fetch / listener setup

  const groupedMessages = useMemo(() => {
    const groups: Record<string, UserMessage[]> = {};
    // Ensure messages are sorted by timestamp if not already by Firestore query
    const sortedMessages = [...allMessagesData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedMessages.forEach(msg => {
        // Define a conversation key, e.g., based on userEmail and original subject
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
        let convStatus: UserMessage['status'] = 'read'; // Default to read

        const latestUserMessage = messages.slice().reverse().find(m => m.senderType === 'user');
        if (latestUserMessage) {
            if (latestUserMessage.status === 'new') {
                convStatus = 'new';
            } else {
                // If latest user message is not 'new', check if admin has replied after it
                const adminRepliedAfter = messages.some(m => m.senderType === 'admin' && new Date(m.timestamp) > new Date(latestUserMessage.timestamp));
                convStatus = adminRepliedAfter ? 'replied' : 'read'; // 'read' if no admin reply after last user message
            }
        } else {
            // If no user messages, it's likely an admin-initiated thread or an anomaly
            convStatus = 'replied'; // Or handle as appropriate
        }
        
        return {
            conversationId: conversationKey, // Use the generated key as an ID
            userEmail: messages[0].userEmail,
            userName: messages[0].userName,
            subject: messages[0].subject.replace(/^Re: /i, '').trim(),
            lastMessageTimestamp: new Date(lastMessage.timestamp),
            lastMessageSnippet: `${lastMessage.senderType === 'admin' ? (lastMessage.adminName || 'Admin') + ': ' : ''}${lastMessage.messageBody.substring(0, 40)}${lastMessage.messageBody.length > 40 ? "..." : ""}`,
            messages,
            status: convStatus,
        };
    }).sort((a,b) => { // Sort by status ('new' first), then by last message time
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

    // PRODUCTION TODO: Mark user messages in this conversation as 'read' in Firestore
    /*
    const batch = writeBatch(db);
    let messagesToUpdate = false;
    conversation.messages.forEach(msg => {
        if (msg.senderType === 'user' && msg.status === 'new') {
            const msgRef = doc(db, "userMessages", msg.id);
            batch.update(msgRef, { status: 'read', updatedAt: serverTimestamp() });
            messagesToUpdate = true;
        }
    });
    if (messagesToUpdate) {
        try {
            await batch.commit();
            // If not using onSnapshot, you might need to manually update local state or re-fetch.
            // For MOCK, we update directly:
             MOCK_USER_MESSAGES.forEach(mockMsg => {
                if (conversation.messages.some(m => m.id === mockMsg.id && m.senderType === 'user' && mockMsg.status === 'new')) {
                    mockMsg.status = 'read';
                    mockMsg.updatedAt = new Date().toISOString();
                }
            });
            setAllMessagesData([...MOCK_USER_MESSAGES]); // Trigger re-memoization
            toast({ title: "Conversation Updated", description: "Messages marked as read."});
        } catch (err) {
            console.error("Error marking messages as read:", err);
            toast({ title: "Error", description: "Could not update message statuses.", variant: "destructive" });
        }
    }
    */
    // MOCK Implementation:
    let updatedInMock = false;
    MOCK_USER_MESSAGES.forEach(msg => {
        if (msg.userEmail === conversation.userEmail && 
            msg.subject.replace(/^Re: /i, '').trim() === conversation.subject &&
            msg.senderType === 'user' && msg.status === 'new') {
            msg.status = 'read';
            msg.updatedAt = new Date().toISOString();
            updatedInMock = true;
        }
    });
    if (updatedInMock) setAllMessagesData([...MOCK_USER_MESSAGES]);
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

    const newAdminMessageData: Omit<UserMessage, 'id' | 'createdAt' | 'updatedAt'> = {
      uid: adminUser.uid, // UID of the admin sending the message
      userName: selectedConversation.userName, // Keep track of user context
      userEmail: selectedConversation.userEmail,
      subject: `Re: ${selectedConversation.subject}`,
      messageBody: replyText,
      timestamp: new Date().toISOString(), // For Firestore, use serverTimestamp() for 'createdAt'
      status: 'replied', // Admin replies are typically 'replied'
      senderType: 'admin',
      adminName: adminUser.name || 'Admin Support',
    };

    try {
        // PRODUCTION TODO: Add newAdminMessageData to 'userMessages' collection in Firestore
        // const docRef = await addDoc(collection(db, "userMessages"), { 
        //   ...newAdminMessageData, 
        //   timestamp: serverTimestamp(), // Use server timestamp for sorting/consistency
        //   createdAt: serverTimestamp(), 
        //   updatedAt: serverTimestamp() 
        // });
        // const newAdminMessageWithId = { ...newAdminMessageData, id: docRef.id, timestamp: new Date() } as UserMessage;

        // MOCK Implementation:
        const newAdminMessageWithId = {
          ...newAdminMessageData,
          id: `msg-admin-${Date.now()}`,
          timestamp: new Date(), // Local date for mock
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as UserMessage;
        MOCK_USER_MESSAGES.push(newAdminMessageWithId);
        
        // PRODUCTION TODO: Update status of user messages in this conversation to 'replied'
        // const userMessagesToUpdateQuery = query(
        //   collection(db, "userMessages"),
        //   where("userEmail", "==", selectedConversation.userEmail),
        //   where("subject", "==", selectedConversation.subject), // Or match by conversationId
        //   where("senderType", "==", "user"),
        //   where("status", "in", ["new", "read"])
        // );
        // const userMessagesSnapshot = await getDocs(userMessagesToUpdateQuery);
        // const batch = writeBatch(db);
        // userMessagesSnapshot.forEach(doc => {
        //   batch.update(doc.ref, { status: 'replied', updatedAt: serverTimestamp() });
        // });
        // await batch.commit();

        // MOCK Implementation for updating user messages status:
        MOCK_USER_MESSAGES.forEach(msg => {
            if (msg.userEmail === selectedConversation.userEmail && 
                msg.subject.replace(/^Re: /i, '').trim() === selectedConversation.subject &&
                msg.senderType === 'user' && (msg.status === 'new' || msg.status === 'read')) {
                msg.status = 'replied';
                msg.updatedAt = new Date().toISOString();
            }
        });
        setAllMessagesData([...MOCK_USER_MESSAGES]); // This will trigger re-memoization
        
        toast({
          title: "Reply Sent",
          description: `Your reply to ${selectedConversation.userName} has been sent.`,
        });
        
        // Optimistically update selectedConversation for UI
        const updatedSelectedConvMessages = [
          ...(selectedConversation.messages || []),
          newAdminMessageWithId
        ].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setSelectedConversation((prev) =>
          prev
            ? {
                ...prev,
                messages: updatedSelectedConvMessages,
                status: "replied", // Conversation status is now 'replied'
                lastMessageTimestamp:
                  typeof newAdminMessageWithId.timestamp === "string"
                    ? new Date(newAdminMessageWithId.timestamp)
                    : newAdminMessageWithId.timestamp,
                lastMessageSnippet: `${
                  newAdminMessageWithId.senderType === "admin"
                    ? (newAdminMessageWithId.adminName || "Admin") + ": "
                    : ""
                }${newAdminMessageWithId.messageBody.substring(0, 40)}${
                  newAdminMessageWithId.messageBody.length > 40 ? "..." : ""
                }`,
              }
            : null
        );
        setReplyText("");
        // If not using onSnapshot, call a re-fetch or rely on local state update
        } catch (error) {
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
                    key={conv.conversationId || conv.userEmail + conv.subject} // Use conversationId if available
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
                            conv.status === 'new' ? 'destructive' : // Destructive for 'new' to catch attention
                            conv.status === 'replied' ? 'default' : // Default for 'replied'
                            'secondary' // Secondary for 'read' or other statuses
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
