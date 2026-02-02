import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, Mail, MailOpen, Send, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { messageApi, userApi } from '@/lib/api';
import { mockUsers, formatDate } from '@/lib/mock-data';
import type { Message } from '@/types';
import { z } from 'zod';

interface MessageWithSender extends Message {
  sender: { firstName: string; lastName: string; role: string } | null;
  receiver: { firstName: string; lastName: string; role: string } | null;
}

const messageSchema = z.object({
  receiverId: z.string().min(1, 'Please select a recipient'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(100),
  content: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export default function TenantMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithSender | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newMessage, setNewMessage] = useState({
    receiverId: '',
    subject: '',
    content: '',
  });

  // Get landlords and admins for messaging
  const contacts = mockUsers.filter((u) => u.role === 'landlord' || u.role === 'admin');

  useEffect(() => {
    const loadMessages = async () => {
      // Get messages for the current tenant (sent and received)
      const tenantId = user?.id || 'tenant-001';

      try {
        const [msgRes, usersRes] = await Promise.all([
          messageApi.getByUser(tenantId),
          userApi.getAll()
        ]);

        if (msgRes.success && msgRes.data) {
          const myMessages = msgRes.data;
          const users = usersRes.data || [];

          // Map Details
          const enrichedMessages = myMessages.map((msg) => ({
            ...msg,
            sender: users.find((u) => u.id === msg.senderId)
              ? {
                firstName: users.find((u) => u.id === msg.senderId)!.firstName,
                lastName: users.find((u) => u.id === msg.senderId)!.lastName,
                role: users.find((u) => u.id === msg.senderId)!.role,
              }
              : null,
            receiver: users.find((u) => u.id === msg.receiverId)
              ? {
                firstName: users.find((u) => u.id === msg.receiverId)!.firstName,
                lastName: users.find((u) => u.id === msg.receiverId)!.lastName,
                role: users.find((u) => u.id === msg.receiverId)!.role,
              }
              : null,
          })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setMessages(enrichedMessages);
        }
      } catch (error) {
        console.error("Failed to load messages", error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [user]);

  const handleSendMessage = async () => {
    try {
      messageSchema.parse(newMessage);
      setFormErrors({});
      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully.',
      });

      setShowComposeDialog(false);
      setNewMessage({ receiverId: '', subject: '', content: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewMessage = (message: MessageWithSender) => {
    setSelectedMessage(message);
    setShowMessageDialog(true);
  };

  const replyToMessage = (message: MessageWithSender) => {
    const senderId = message.senderId;
    const sender = mockUsers.find((u) => u.id === senderId);

    setNewMessage({
      receiverId: senderId,
      subject: `Re: ${message.subject}`,
      content: '',
    });
    setShowMessageDialog(false);
    setShowComposeDialog(true);
  };

  const tenantId = user?.id || 'tenant-001';
  const unreadCount = messages.filter((m) => m.receiverId === tenantId && !m.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground">
            Communicate with your landlord and administrators
          </p>
        </div>
        <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>
                Send a message to your landlord or administrator.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>To *</Label>
                <Select
                  value={newMessage.receiverId}
                  onValueChange={(v) => setNewMessage({ ...newMessage, receiverId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName} ({contact.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.receiverId && (
                  <p className="text-sm text-destructive">{formErrors.receiverId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Message subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                />
                {formErrors.subject && (
                  <p className="text-sm text-destructive">{formErrors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  placeholder="Type your message..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  rows={5}
                />
                {formErrors.content && (
                  <p className="text-sm text-destructive">{formErrors.content}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isSubmitting} className="gap-2">
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Unread Alert */}
      {unreadCount > 0 && (
        <Card className="border-info bg-info/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-info/10 p-3">
              <Mail className="h-6 w-6 text-info" />
            </div>
            <div>
              <h4 className="font-semibold">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}</h4>
              <p className="text-sm text-muted-foreground">
                Check your inbox to see new messages
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No messages yet</h3>
              <p className="mb-4 text-muted-foreground">
                Start a conversation with your landlord
              </p>
              <Button onClick={() => setShowComposeDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Compose Message
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => {
                const isSent = message.senderId === tenantId;
                const otherParty = isSent ? message.receiver : message.sender;

                return (
                  <div
                    key={message.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${!message.read && !isSent ? 'bg-info/5 border-info/20' : ''
                      }`}
                    onClick={() => viewMessage(message)}
                  >
                    <div className="rounded-full bg-muted p-2">
                      {message.read || isSent ? (
                        <MailOpen className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Mail className="h-5 w-5 text-info" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium">
                          {isSent ? 'To: ' : 'From: '}
                          {otherParty ? `${otherParty.firstName} ${otherParty.lastName}` : 'Unknown'}
                        </span>
                        {otherParty && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {otherParty.role}
                          </Badge>
                        )}
                        {!message.read && !isSent && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="font-medium truncate">{message.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <>
                  {selectedMessage.senderId === tenantId ? 'Sent to ' : 'From '}
                  {selectedMessage.senderId === tenantId
                    ? selectedMessage.receiver
                      ? `${selectedMessage.receiver.firstName} ${selectedMessage.receiver.lastName}`
                      : 'Unknown'
                    : selectedMessage.sender
                      ? `${selectedMessage.sender.firstName} ${selectedMessage.sender.lastName}`
                      : 'Unknown'}
                  {' • '}
                  {selectedMessage && formatDate(selectedMessage.createdAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>

              {selectedMessage.senderId !== tenantId && (
                <Button onClick={() => replyToMessage(selectedMessage)} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Reply
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
