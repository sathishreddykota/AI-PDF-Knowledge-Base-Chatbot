'use client';

import { FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentItem } from '@/hooks/useDocuments';
import { formatDate, formatFileSize } from '@/lib/utils';
import StatusBadge from './StatusBadge';

interface RecentDocumentsProps {
  documents: DocumentItem[];
}

export default function RecentDocuments({ documents }: RecentDocumentsProps) {
  return (
    <Card className="bg-card border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Recent Uploaded Documents
        </CardTitle>
        <Link
          href="/admin/documents"
          className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-border/40 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[200px]" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(doc.size)} • {formatDate(doc.uploadDate)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
