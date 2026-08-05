'use client';

import { useEffect, useRef } from 'react';
import { Bot, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat-store';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import Link from 'next/link';

export default function ChatInterface() {
  const { messages, isLoading, resetChat } = useChatStore();
  const { askQuestion } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (question: string) => {
    askQuestion(question);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-16 border-b border-border/80 px-6 flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm flex items-center gap-2">
              PDF Knowledge Base AI
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live RAG
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Powered by Gemini 2.5 Flash & LangGraph</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetChat}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </Button>

          <Link href="/admin/dashboard">
            <Button size="sm" className="rounded-xl text-xs gap-1.5 h-9">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <EmptyState onSelectPrompt={handleSend} />
          ) : (
            messages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                message={msg}
                isLast={index === messages.length - 1}
                onSelectSuggestion={handleSend}
                disabled={isLoading}
              />
            ))
          )}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer / Input */}
      <footer className="p-4 border-t border-border/60 bg-card/30 backdrop-blur-sm shrink-0">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSend} disabled={isLoading} />
          <p className="text-[11px] text-center text-muted-foreground/70 mt-2">
            AI responses are generated directly from administrator-uploaded PDF documents.
          </p>
        </div>
      </footer>
    </div>
  );
}
