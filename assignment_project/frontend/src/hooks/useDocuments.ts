'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DocumentItem {
  _id: string;
  filename: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadDate: string;
  totalChunks: number;
  createdAt: string;
}

export function useDocuments(search?: string) {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents', search],
    queryFn: async () => {
      const res = await api.get('/documents', {
        params: search ? { search } : {},
      });
      return (res.data?.data || []) as DocumentItem[];
    },
    refetchInterval: (query) => {
      // Auto refetch every 3s if any document is processing
      const hasProcessing = query.state.data?.some((doc) => doc.status === 'processing');
      return hasProcessing ? 3000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/documents/upload', formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/documents/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/documents/${id}/reprocess`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    refetch: documentsQuery.refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    reprocessDocument: reprocessMutation.mutateAsync,
    isReprocessing: reprocessMutation.isPending,
  };
}
