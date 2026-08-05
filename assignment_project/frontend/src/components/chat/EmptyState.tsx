'use client';

import { Bot, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const samplePrompts = [
  'What key topics are covered in the uploaded documents?',
  'Summarize the main policies or instructions found in the PDF.',
  'What are the guidelines or requirements mentioned in the document?',
  'What important dates or deadlines are specified?',
];

export default function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-inner"
      >
        <Bot className="w-8 h-8" />
      </motion.div>

      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold tracking-tight mb-2"
      >
        AI Knowledge Base Assistant
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed"
      >
        Ask questions about any uploaded PDF documents. Every answer is grounded directly in the knowledge base with source citations.
      </motion.p>

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 hover:bg-accent/40 transition-all text-xs text-foreground group flex items-start gap-2.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <span className="leading-snug">{prompt}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
