'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex gap-3 items-start my-4 max-w-3xl"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-card border border-border/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium mr-2">Searching knowledge base</span>
        <motion.span
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
        <motion.span
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
        <motion.span
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
      </div>
    </motion.div>
  );
}
