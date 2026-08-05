'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '@/store/chat-store';
import SourceBadge from './SourceBadge';
import SuggestedQuestions from './SuggestedQuestions';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectSuggestion?: (question: string) => void;
  isLast?: boolean;
  disabled?: boolean;
}

const syntaxTheme = vscDarkPlus as { [key: string]: CSSProperties };

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <SyntaxHighlighter
        style={syntaxTheme}
        language={match[1]}
        PreTag="div"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export default function ChatMessage({
  message,
  onSelectSuggestion,
  isLast,
  disabled,
}: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 my-4 max-w-4xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`group relative max-w-2xl rounded-2xl px-4 py-3.5 shadow-sm text-sm ${
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-card border border-border/80 text-card-foreground rounded-tl-sm'
      }`}>
        {/* Copy button for AI responses */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground transition-all"
            title="Copy answer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Message Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.text}
            </ReactMarkdown>

            {/* Source Citations */}
            <SourceBadge sources={message.sources} />

            {/* Suggested Follow-up Questions */}
            {isLast && onSelectSuggestion && (
              <SuggestedQuestions
                questions={message.suggestedQuestions}
                onSelect={onSelectSuggestion}
                disabled={disabled}
              />
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-1.5 opacity-60 text-right ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
}
