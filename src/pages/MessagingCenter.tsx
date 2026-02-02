import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Send, Paperclip, Search, MoreVertical, 
  Phone, Video, Info, Smile, Image, File, User, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { MessagingService } from '@/lib/freelancing-service';
import type { Conversation, Message, ChatMessage } from '@/types/freelancing';
import { useToast } from '@/hooks/use-toast';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function MessagingCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await MessagingService.getConversations(user!.id);
      setConversations(data);
      
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await MessagingService.getMessages(conversationId);
      setMessages(data as ChatMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const message = await MessagingService.sendMessage(
        selectedConversation.id,
        newMessage.trim()
      );
      
      setMessages(prev => [...prev, message as ChatMessage]);
      setNewMessage('');
      
      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, last_message_at: new Date().toISOString() }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    // This would need to be enhanced to get actual user data
    const otherUserId = conversation.participants.find(id => id !== user?.id);
    return {
      id: otherUserId,
      name: 'Client Name', // Would come from user lookup
      avatar: '',
      isOnline: false
    };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getOtherParticipant(conv).name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground mt-2">
                Communicate with clients and freelancers
              </p>
            </div>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </motion.div>

          {/* Messaging Interface */}
          <motion.div variants={item}>
            <Card className="h-[700px] flex">
              {/* Conversations Sidebar */}
              <div className="w-1/3 border-r flex flex-col">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-4 pt-0">
                    {filteredConversations.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No conversations yet</p>
                        <p className="text-sm">Start a conversation with a client or freelancer</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => {
                        const otherParticipant = getOtherParticipant(conversation);
                        const isSelected = selectedConversation?.id === conversation.id;
                        
                        return (
                          <div
                            key={conversation.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={otherParticipant.avatar} />
                                  <AvatarFallback>
                                    {otherParticipant.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {otherParticipant.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium truncate">{otherParticipant.name}</h4>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageTime(conversation.last_message_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.subject || 'No subject'}
                                </p>
                                {conversation.project_id && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Project Discussion
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getOtherParticipant(selectedConversation).avatar} />
                            <AvatarFallback>
                              {getOtherParticipant(selectedConversation).name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{getOtherParticipant(selectedConversation).name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedConversation.subject || 'No subject'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <Separator />

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No messages yet</p>
                            <p className="text-sm">Start the conversation!</p>
                          </div>
                        ) : (
                          messages.map((message) => {
                            const isOwn = message.sender_id === user?.id;
                            
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                  {!isOwn && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {message.sender_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">
                                        {message.sender_name || 'User'}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div
                                    className={`p-3 rounded-lg ${
                                      isOwn
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {message.attachments.map((attachment: any, index: number) => (
                                          <div key={index} className="flex items-center gap-2 p-2 bg-background/10 rounded">
                                            <File className="h-4 w-4" />
                                            <span className="text-xs">{attachment.filename}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                                    isOwn ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <Clock className="h-3 w-3" />
                                    <span>{formatMessageTime(message.created_at)}</span>
                                    {isOwn && message.is_read && (
                                      <span className="text-primary">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <form onSubmit={sendMessage} className="space-y-3">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Textarea
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage(e);
                                }
                              }}
                              rows={3}
                              className="resize-none"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button type="button" variant="ghost" size="sm">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm">
                              <Image className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm">
                              <Smile className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Press Enter to send, Shift+Enter for new line
                          </div>
                          <Button type="submit" disabled={!newMessage.trim() || sending}>
                            {sending ? 'Sending...' : 'Send'}
                            <Send className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                      <p>Choose a conversation from the sidebar to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}