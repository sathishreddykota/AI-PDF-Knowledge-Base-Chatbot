'use client';

import { useState } from 'react';
import { Search, FileText, RefreshCw, Trash2, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentItem, useDocuments } from '@/hooks/useDocuments';
import { formatDate, formatFileSize } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import { toast } from 'sonner';

interface DocumentTableProps {
  documents: DocumentItem[];
  isLoading: boolean;
}

export default function DocumentTable({ documents, isLoading }: DocumentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { deleteDocument, reprocessDocument, isDeleting, isReprocessing } = useDocuments(searchTerm);

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"? All embeddings will be removed from ChromaDB.`)) {
      try {
        await deleteDocument(id);
        toast.success(`Deleted document "${filename}"`);
      } catch {
        toast.error('Failed to delete document');
      }
    }
  };

  const handleReprocess = async (id: string, filename: string) => {
    try {
      toast.info(`Started reprocessing "${filename}"...`);
      await reprocessDocument(id);
      toast.success(`Reprocessed "${filename}" successfully!`);
    } catch {
      toast.error('Failed to reprocess document');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border/80"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-semibold">Document Name</TableHead>
              <TableHead className="text-xs font-semibold">Size</TableHead>
              <TableHead className="text-xs font-semibold">Upload Date</TableHead>
              <TableHead className="text-xs font-semibold">Chunks</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  Loading knowledge base documents...
                </TableCell>
              </TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No documents found in knowledge base
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc._id} className="hover:bg-accent/30 transition-colors">
                  <TableCell className="font-medium text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate max-w-[240px]" title={doc.filename}>
                        {doc.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(doc.uploadDate)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1 font-mono text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      {doc.totalChunks || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReprocess(doc._id, doc.filename)}
                        disabled={isReprocessing || doc.status === 'processing'}
                        title="Reprocess Document"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc._id, doc.filename)}
                        disabled={isDeleting}
                        title="Delete Document"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
