'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { AxiosError } from 'axios';
import { UploadCloud, FileText, AlertCircle, Loader2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
}

export default function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, isUploading } = useDocuments();

  const validateFile = (selectedFile: File): boolean => {
    setError(null);
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Please select a valid PDF file (.pdf)');
      return false;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit');
      return false;
    }
    return true;
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      await uploadDocument(file);
      toast.success(`PDF "${file.name}" uploaded successfully! Processing started.`);
      setFile(null);
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const msg = error.response?.data?.error?.message || 'Failed to upload PDF';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Upload Knowledge Base PDF</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload a PDF document to expand the AI&apos;s knowledge base. Max size 10MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border/80 hover:border-primary/50 hover:bg-accent/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium">
              Click to select or drag & drop PDF here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports standard text PDFs up to 10MB
            </p>
          </div>

          {/* Selected File Details */}
          {file && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-accent/40 border border-border/80 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="truncate">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setFile(null); }}
                className="text-xs h-7 px-2"
              >
                Change
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading & Vectorizing...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Upload PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
