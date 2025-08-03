
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect, useMemo, useRef } from 'react';

import { PageHeader } from "@/components/core/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MailQuestion, Loader2, Send, PlusCircle, User, Shield, Lock, AlertCircle } from 'lucide-react';
import type { UserMessage } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const newMessageFormSchema = z.object({
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }),
});
type NewMessageFormValues = z.infer<typeof newMessageFormSchema>;

interface Conversation {
  userEmail: string;
  userName: string;
  subject: string;
  lastMessageTimestamp: Date;
  messages: UserMessage[];
  status: UserMessage['status'];
  conversationId: string;
}

export default function ContactSupportPage() {
  const { toast } = useToast();
  const { currentUser, loadingAuth } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  
  const [allMessagesData, setAllMessagesData] = useState<UserMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (loadingAuth || !currentUser) {
      setIsLoading(true);
      return;
    }

    const messagesCol = collection(db, "userMessages");
    const q = query(
        messagesCol,
        where("uid", "==", currentUser.uid),
        orderBy("timestamp", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
        })) as UserMessage[];
        setAllMessagesData(fetchedMessages);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ title: "Error", description: "Could not load your conversations.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, loadingAuth, toast]);
  
  const groupedMessages = useMemo(() => {
    const groups: Record<string, UserMessage[]> = {};
    allMessagesData.forEach(msg => {
        const conversationKey = msg.subject.replace(/^Re: /i, '').trim();
        if (!groups[conversationKey]) {
            groups[conversationKey] = [];
        }
        groups[conversationKey].push(msg);
    });
    return groups;
  }, [allMessagesData]);

  const conversationList = useMemo((): Conversation[] => {
    return Object.entries(groupedMessages).map(([subject, messages]) => {
        const lastMessage = messages[messages.length - 1];
        return {
            conversationId: subject,
            userEmail: messages[0].userEmail,
            userName: messages[0].userName,
            subject: subject,
            lastMessageTimestamp: new Date(lastMessage.timestamp),
            messages,
            status: lastMessage.status,
        };
    }).sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
  }, [groupedMessages]);

  useEffect(() => {
    if (conversationList.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationList[0]);
    }
     if (selectedConversation) {
        const updatedConversation = conversationList.find(c => c.conversationId === selectedConversation.conversationId);
        if (updatedConversation) {
            setSelectedConversation(updatedConversation);
        }
    }
  }, [conversationList, selectedConversation]);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages, replyText]);

  const form = useForm<NewMessageFormValues>({
    resolver: zodResolver(newMessageFormSchema),
    defaultValues: { subject: "", message: "" },
  });

  const handleSendReply = async () => {
    if (!currentUser || !selectedConversation || !replyText.trim()) return;

    setIsSubmitting(true);
    const newMessage: Omit<UserMessage, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'> = {
      uid: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email,
      subject: selectedConversation.subject,
      messageBody: replyText,
      status: 'new',
      senderType: 'user',
    };

    try {
      await addDoc(collection(db, "userMessages"), { ...newMessage, timestamp: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setReplyText('');
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({ title: "Send Failed", description: "Could not send your message.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  async function onNewMessageSubmit(data: NewMessageFormValues) {
    if (!currentUser) return;
    setIsSubmitting(true);

    const newMessageData: Omit<UserMessage, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'> = {
      uid: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email,
      subject: data.subject,
      messageBody: data.message,
      status: 'new',
      senderType: 'user',
    };
    
    try {
      await addDoc(collection(db, "userMessages"), { ...newMessageData, timestamp: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      toast({ title: "Message Sent!", description: "Your new conversation has started." });
      form.reset();
      setIsNewMessageModalOpen(false);
    } catch (error) {
      console.error("Error submitting new message:", error);
      toast({ title: "Submission Failed", description: "Could not start a new conversation.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingAuth || isLoading) {
    return (
        <div className="container py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading your messages...</p>
        </div>
    );
  }

  if (!currentUser) {
     return (
        <div className="container py-12">
            <PageHeader title="Contact Support" description="Please log in to contact support."/>
        </div>
     );
  }


  return (
    <>
      <PageHeader
        title="Contact Support"
        description="View your past conversations or start a new one."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>My Threads</CardTitle>
                <Dialog open={isNewMessageModalOpen} onOpenChange={setIsNewMessageModalOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> New</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Start a New Conversation</DialogTitle>
                            <DialogDescription>Create a new message thread with our support team.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onNewMessageSubmit)} className="space-y-4 py-4">
                                <FormField control={form.control} name="subject" render={({ field }) => (
                                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Question about my booking" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="message" render={({ field }) => (
                                <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea rows={4} placeholder="Describe your query..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsNewMessageModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Start Thread
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <ScrollArea className="flex-grow p-2">
            <div className="space-y-2">
              {conversationList.map((conv) => (
                <button
                    key={conv.conversationId}
                    className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50",
                        selectedConversation?.conversationId === conv.conversationId ? "bg-primary/10 border-primary" : "bg-card"
                    )}
                    onClick={() => setSelectedConversation(conv)}
                >
                    <p className="font-semibold text-sm text-primary truncate">{conv.subject}</p>
                    <p className="text-xs text-muted-foreground">
                        Last activity: {conv.lastMessageTimestamp.toLocaleDateString()}
                    </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>
        
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="font-headline text-lg">{selectedConversation.subject}</CardTitle>
                <CardDescription>
                  Your conversation with the support team.
                </CardDescription>
              </CardHeader>
              <ScrollArea className="flex-grow p-4 bg-muted/20" ref={chatContainerRef}>
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "p-3 rounded-lg max-w-[80%] w-fit text-sm flex flex-col",
                            message.senderType === 'admin' ? "bg-primary text-primary-foreground self-start mr-auto shadow-sm" : "bg-card border self-end ml-auto shadow-sm"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {message.senderType === 'admin' ?
                                <Shield className="h-4 w-4 text-accent" /> :
                                <User className="h-4 w-4 text-muted-foreground" />
                            }
                            <span className="font-semibold text-xs">
                                {message.senderType === 'admin' ? message.adminName || 'Admin' : message.userName}
                            </span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.messageBody}</p>
                        <p className={cn("text-xs mt-2 self-end", message.senderType === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}
                        </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <CardFooter className="pt-4 border-t">
                  {selectedConversation.status === 'closed' ? (
                    <div className="w-full text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-md flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4" /> This conversation has been closed by an admin.
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <Textarea
                        id="reply-text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-grow"
                        disabled={isSubmitting}
                      />
                      <Button type="button" onClick={handleSendReply} disabled={!replyText.trim() || isSubmitting} size="icon">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                      </Button>
                    </div>
                  )}
              </CardFooter>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MailQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Select a conversation to view messages, or start a new one.</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
