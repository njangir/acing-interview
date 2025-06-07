
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MOCK_USER_MESSAGES, MOCK_USER_PROFILE_FOR_CONTACT } from "@/constants";
import type { UserMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, CornerDownRight, User, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Conversation {
  userEmail: string;
  userName: string;
  subject: string;
  lastMessageTimestamp: Date;
  lastMessageSnippet: string;
  messages: UserMessage[];
  status: UserMessage['status'];
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [forceUpdate, setForceUpdate] = useState(0); // To trigger re-calculation of memos
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const groupedMessages = useMemo(() => {
    const groups: Record<string, UserMessage[]> = {};
    const sortedMessages = [...MOCK_USER_MESSAGES].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    sortedMessages.forEach(msg => {
        if (!groups[msg.userEmail]) {
            groups[msg.userEmail] = [];
        }
        groups[msg.userEmail].push(msg);
    });
    return groups;
  }, [forceUpdate]); // Depend on MOCK_USER_MESSAGES via forceUpdate

  const conversationList = useMemo((): Conversation[] => {
    return Object.entries(groupedMessages).map(([userEmail, messages]) => {
        const lastMessage = messages[messages.length - 1];
        let convStatus: UserMessage['status'] = 'read';

        if (lastMessage.senderType === 'user') {
            const adminRepliesExist = messages.some(m => m.senderType === 'admin' && m.timestamp > lastMessage.timestamp);
            if (!adminRepliesExist) {
                convStatus = lastMessage.status; // 'new' or 'read' if user sent last and no newer admin reply
            } else {
                convStatus = 'replied'; // Admin has replied after user's last message
            }
        } else { // Last message is from admin
            convStatus = 'replied';
        }
        
        // If any user message in the thread is 'new' and there's no admin reply *after* it, the conversation is 'new'.
        const latestUserNewMessage = messages.slice().reverse().find(m => m.senderType === 'user' && m.status === 'new');
        if (latestUserNewMessage) {
            const hasAdminRepliedAfterIt = messages.some(m => m.senderType === 'admin' && m.timestamp > latestUserNewMessage.timestamp);
            if (!hasAdminRepliedAfterIt) {
                convStatus = 'new';
            }
        }


        return {
            userEmail,
            userName: messages[0].userName,
            subject: messages[0].subject,
            lastMessageTimestamp: lastMessage.timestamp,
            lastMessageSnippet: `${lastMessage.senderType === 'admin' ? 'Admin: ' : ''}${lastMessage.messageBody.substring(0, 40)}${lastMessage.messageBody.length > 40 ? "..." : ""}`,
            messages,
            status: convStatus,
        };
    }).sort((a,b) => {
        // Prioritize 'new' conversations, then by last message time
        if (a.status === 'new' && b.status !== 'new') return -1;
        if (b.status === 'new' && a.status !== 'new') return 1;
        return b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime();
    });
  }, [groupedMessages]);


  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setReplyText('');
    setIsModalOpen(true);

    // Mark user messages in this conversation as 'read' if they were 'new'
    // and an admin is viewing it
    let updated = false;
    MOCK_USER_MESSAGES.forEach(msg => {
        if (msg.userEmail === conversation.userEmail && msg.senderType === 'user' && msg.status === 'new') {
            msg.status = 'read';
            updated = true;
        }
    });
    if (updated) setForceUpdate(p => p + 1);
  };

  const handleSendReply = () => {
    if (!selectedConversation || !replyText.trim()) {
      toast({
        title: "Cannot Send",
        description: "Reply text cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newAdminMessage: UserMessage = {
      id: `msg-${Date.now()}`,
      userName: selectedConversation.userName, // Keep context of original user
      userEmail: selectedConversation.userEmail,
      subject: `Re: ${selectedConversation.subject}`, // Or maintain original subject
      messageBody: replyText,
      timestamp: new Date(),
      status: 'replied', // This admin message itself is a reply
      senderType: 'admin',
      adminName: 'Admin Support', 
    };

    MOCK_USER_MESSAGES.push(newAdminMessage);
    
    // Mark previous user messages in this conversation as 'replied'
     MOCK_USER_MESSAGES.forEach(msg => {
        if (msg.userEmail === selectedConversation.userEmail && msg.senderType === 'user' && (msg.status === 'new' || msg.status === 'read')) {
            msg.status = 'replied';
        }
    });

    setForceUpdate(p => p + 1); // Trigger re-render and re-calculation of conversation list
    
    toast({
      title: "Reply Sent",
      description: `Your reply to ${selectedConversation.userName} has been sent.`,
    });
    
    // Update selectedConversation with the new message for immediate modal update
    setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newAdminMessage].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()),
        status: 'replied',
        lastMessageTimestamp: newAdminMessage.timestamp,
        lastMessageSnippet: `${newAdminMessage.senderType === 'admin' ? 'Admin: ' : ''}${newAdminMessage.messageBody.substring(0, 40)}${newAdminMessage.messageBody.length > 40 ? "..." : ""}`,
    } : null);
    setReplyText(''); // Clear reply box
  };

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
            Showing {conversationList.length} conversation(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversationList.length > 0 ? (
            <div className="space-y-3">
              {conversationList.map((conv) => (
                <Card 
                    key={conv.userEmail} 
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
                        <Badge variant={
                            conv.status === 'new' ? 'destructive' : 
                            conv.status === 'replied' ? 'default' : 
                            'secondary'
                        }
                        className={cn(
                            conv.status === 'new' && 'bg-accent text-accent-foreground',
                            conv.status === 'replied' && 'bg-green-100 text-green-700'
                        )}
                        >
                        {conv.status.toUpperCase()}
                        </Badge>
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
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) setSelectedConversation(null);
      }}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conversation with: {selectedConversation?.userName}</DialogTitle>
            <DialogDescription>
              Subject: {selectedConversation?.subject} ({selectedConversation?.userEmail})
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow p-4 border rounded-md my-4 bg-muted/20 custom-scrollbar">
            <div className="space-y-4">
              {selectedConversation?.messages.map((message) => (
                <div 
                    key={message.id} 
                    className={cn(
                        "p-3 rounded-lg max-w-[80%]",
                        message.senderType === 'user' ? "bg-primary/10 text-primary-foreground self-start mr-auto" : "bg-secondary text-secondary-foreground self-end ml-auto"
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {message.senderType === 'user' ? 
                            <User className="h-4 w-4 text-primary" /> : 
                            <Shield className="h-4 w-4 text-accent" />
                        }
                        <span className="font-semibold text-sm">
                            {message.senderType === 'user' ? message.userName : message.adminName || 'Admin'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}
                        </span>
                    </div>
                  <p className="text-sm whitespace-pre-wrap">{message.messageBody}</p>
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
              rows={4}
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
