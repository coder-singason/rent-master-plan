import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { messageApi, userApi } from '@/lib/api';
import { formatDate } from '@/lib/mock-data';
import type { Message, User } from '@/types';
import { Plus, Search, Mail, MailOpen, Send, Inbox, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function MessagesManagement() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [composeData, setComposeData] = useState({
    receiverId: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [messagesRes, usersRes] = await Promise.all([
        messageApi.getAll(),
        userApi.getAll(),
      ]);
      if (messagesRes.success) setMessages(messagesRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const filteredMessages = messages.filter((message) => {
    const sender = getUser(message.senderId);
    const receiver = getUser(message.receiverId);
    return (
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sender?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sender?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receiver?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receiver?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      await messageApi.update(message.id, { read: true });
      setMessages(messages.map((m) => (m.id === message.id ? { ...m, read: true } : m)));
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser) return;

    const response = await messageApi.create({
      senderId: currentUser.id,
      receiverId: composeData.receiverId,
      subject: composeData.subject,
      content: composeData.content,
      read: false,
    });

    if (response.success) {
      setMessages([response.data, ...messages]);
      toast({ title: 'Message sent', description: 'Your message has been sent successfully.' });
      setIsComposeDialogOpen(false);
      setComposeData({ receiverId: '', subject: '', content: '' });
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">System-wide messaging center</p>
        </div>
        <Button onClick={() => setIsComposeDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-primary">{unreadCount}</p>
              </div>
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredMessages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No messages found</div>
              ) : (
                filteredMessages.map((message) => {
                  const sender = getUser(message.senderId);
                  const isSelected = selectedMessage?.id === message.id;
                  return (
                    <button
                      key={message.id}
                      onClick={() => handleSelectMessage(message)}
                      className={`w-full border-b p-4 text-left transition-colors hover:bg-muted/50 ${
                        isSelected ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {message.read ? (
                          <MailOpen className="mt-1 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="mt-1 h-4 w-4 text-primary" />
                        )}
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className={`truncate text-sm ${!message.read ? 'font-semibold' : 'font-medium'}`}>
                              {sender?.firstName} {sender?.lastName}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className={`truncate text-sm ${!message.read ? 'font-medium' : ''}`}>
                            {message.subject}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{message.content}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {selectedMessage ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedMessage.subject}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        From: {getUser(selectedMessage.senderId)?.firstName}{' '}
                        {getUser(selectedMessage.senderId)?.lastName}
                      </span>
                      <span>•</span>
                      <span>
                        To: {getUser(selectedMessage.receiverId)?.firstName}{' '}
                        {getUser(selectedMessage.receiverId)?.lastName}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(selectedMessage.createdAt)}
                    </p>
                  </div>
                  <Badge variant={selectedMessage.read ? 'secondary' : 'default'}>
                    {selectedMessage.read ? 'Read' : 'Unread'}
                  </Badge>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setComposeData({
                        receiverId: selectedMessage.senderId,
                        subject: `Re: ${selectedMessage.subject}`,
                        content: '',
                      });
                      setIsComposeDialogOpen(true);
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Reply
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Inbox className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Select a message to view</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a message to a user in the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="receiver">To</Label>
              <Select
                value={composeData.receiverId}
                onValueChange={(value) => setComposeData({ ...composeData, receiverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== currentUser?.id)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder="Message subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={composeData.content}
                onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                placeholder="Type your message..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!composeData.receiverId || !composeData.subject || !composeData.content}
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
