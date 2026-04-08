'use client';

/**
 * @fileOverview NexScan AI Chat Interface
 * 
 * Conversational interface for the NexScan AI Agent that can:
 * - Extract data from documents
 * - Translate extracted data
 * - Analyze and provide insights
 * - Answer questions about documents
 */

import { useState, useRef, useEffect } from 'react';
import { chatWithAgent } from '@/app/actions';
import type { NexScanAgentOutput } from '@/ai/flows/nexscan-agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Upload, Bot, User } from 'lucide-react';

type Message = {
  role: 'user' | 'agent';
  message: string;
  data?: NexScanAgentOutput;
  timestamp: Date;
};

export function NexScanChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      message: "👋 Hi! I'm NexScan AI. I can help you extract data from documents, translate them, and provide intelligent insights. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setDocumentImage(dataUri);
      
      // Add user message about upload
      const userMessage: Message = {
        role: 'user',
        message: `📎 Uploaded document: ${file.name}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Auto-trigger extraction
      handleSendMessage('Extract data from this document', dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (messageText?: string, imageOverride?: string) => {
    const userMessage = messageText || input.trim();
    if (!userMessage && !imageOverride) return;

    setIsLoading(true);
    
    // Add user message
    if (!messageText) {
      const newMessage: Message = {
        role: 'user',
        message: userMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setInput('');
    }

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        message: m.message,
      }));

      const result = await chatWithAgent({
        userMessage,
        documentImage: imageOverride || documentImage || undefined,
        extractedData: extractedData || undefined,
        conversationHistory,
      });

      if (result.error) {
        const errorMessage: Message = {
          role: 'agent',
          message: `❌ Error: ${result.error}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } else if (result.response) {
        // Update extracted data if available
        if (result.response.extractedData) {
          setExtractedData(result.response.extractedData);
        }
        if (result.response.translatedData) {
          setExtractedData(result.response.translatedData);
        }

        const agentMessage: Message = {
          role: 'agent',
          message: result.response.agentResponse,
          data: result.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'agent',
        message: `❌ An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          NexScan AI Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'agent' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.message}</div>
                  {msg.data?.suggestedActions && msg.data.suggestedActions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.data.suggestedActions.map((action, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleSendMessage(action)}
                        >
                          {action}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
