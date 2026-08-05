'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuggestedQuestionsProps {
  questions?: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export default function SuggestedQuestions({ questions, onSelect, disabled }: SuggestedQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-border/40">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        Suggested Follow-up Questions
      </div>
      <div className="flex flex-col gap-2">
        {questions.map((q, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => onSelect(q)}
            disabled={disabled}
            className="text-left text-xs px-3.5 py-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/50 hover:bg-accent/50 text-foreground transition-all duration-150 flex items-center justify-between group disabled:opacity-50"
          >
            <span>{q}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
