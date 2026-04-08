'use client';

/**
 * @fileOverview Compact Agent Chat Panel
 * 
 * Integrated chat interface for asking questions about extracted data
 */

import { useState, useRef, useEffect } from 'react';
import { chatWithAgent } from '@/app/actions';
import type { NexScanAgentOutput } from '@/ai/flows/nexscan-agent';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, MessageSquare } from 'lucide-react';

type Message = {
  role: 'user' | 'agent';
  message: string;
  data?: NexScanAgentOutput;
  timestamp: Date;
};

interface AgentChatPanelProps {
  extractedData: ExtractDataOutput | null;
  documentImage?: string | null;
}

export function AgentChatPanel({ extractedData, documentImage }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      message: "👋 Hi! I can help you understand the extracted data. Ask me anything about the document!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset chat when new data is extracted
  useEffect(() => {
    if (extractedData) {
      setMessages([
        {
          role: 'agent',
          message: "✅ Data extracted! I can now answer questions about this document. Try asking:\n• 'Analyze this document'\n• 'Is this urgent?'\n• 'What does [field name] mean?'\n• 'Translate to Hindi'",
          timestamp: new Date(),
        },
      ]);
    }
  }, [extractedData]);

  const handleSendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim();
    if (!userMessage) return;

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
        documentImage: documentImage || undefined,
        extractedData: extractedData ? (extractedData as Record<string, string>) : undefined,
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

  const hasData = !!extractedData;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5" />
          Ask AI Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
        <ScrollArea className="flex-1 pr-4 min-h-[300px]" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'agent' && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                  {msg.data?.suggestedActions && msg.data.suggestedActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.data.suggestedActions.map((action, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 text-xs"
                          onClick={() => handleSendMessage(action)}
                        >
                          {action}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1.5" suppressHydrationWarning>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={hasData ? "Ask about the document..." : "Extract data first to ask questions"}
            disabled={isLoading || !hasData}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim() || !hasData}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {!hasData && (
          <p className="text-xs text-muted-foreground text-center">
            Upload and extract a document to start asking questions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
