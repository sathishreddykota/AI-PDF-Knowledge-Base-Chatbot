'use client';

import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Completed
        </Badge>
      );
    case 'processing':
    case 'uploading':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1 text-[11px] font-medium">
          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
          Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 gap-1 text-[11px] font-medium">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 text-[11px]">
          <Clock className="w-3 h-3" />
          {status}
        </Badge>
      );
  }
}
