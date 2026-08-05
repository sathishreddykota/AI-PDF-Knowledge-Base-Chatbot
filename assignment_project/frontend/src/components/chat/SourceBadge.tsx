'use client';

import { FileText } from 'lucide-react';
import { SourceDocument } from '@/store/chat-store';

interface SourceBadgeProps {
  sources?: SourceDocument[];
}

export default function SourceBadge({ sources }: SourceBadgeProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-primary" />
        Source Documents ({sources.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((src, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 text-secondary-foreground text-xs border border-border/60 hover:bg-secondary transition-colors"
          >
            <FileText className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium truncate max-w-[200px]">{src.filename}</span>
            {src.pageNumber && (
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                Page {src.pageNumber}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
