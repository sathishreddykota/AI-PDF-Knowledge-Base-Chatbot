'use client';

import { useState } from 'react';
import { UploadCloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentTable from '@/components/admin/DocumentTable';
import UploadModal from '@/components/admin/UploadModal';
import { useDocuments } from '@/hooks/useDocuments';

export default function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { documents, isLoading, refetch } = useDocuments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base Documents</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload, search, view status, reprocess, or delete PDF documents used for AI RAG.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl text-xs h-9 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="rounded-xl text-xs h-9 gap-1.5 shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload PDF
          </Button>
        </div>
      </div>

      {/* Document Table Component */}
      <DocumentTable documents={documents} isLoading={isLoading} />

      {/* Upload Modal Component */}
      <UploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
