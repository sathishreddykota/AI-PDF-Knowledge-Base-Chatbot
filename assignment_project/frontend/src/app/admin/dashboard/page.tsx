'use client';

import { useState } from 'react';
import { FileText, MessageSquare, HelpCircle, UploadCloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/admin/StatsCard';
import RecentDocuments from '@/components/admin/RecentDocuments';
import UploadModal from '@/components/admin/UploadModal';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { data: stats, isLoading, refetch } = useDashboard();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Analytics Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Overview of knowledge base documents, chat sessions, and system metrics.
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-32 rounded-2xl bg-card" />
            <Skeleton className="h-32 rounded-2xl bg-card" />
            <Skeleton className="h-32 rounded-2xl bg-card" />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Uploaded PDFs"
              value={stats?.totalPdfs ?? 0}
              description="Active knowledge base files"
              icon={FileText}
              color="text-blue-400 bg-blue-500/10 border-blue-500/20"
              delay={0.1}
            />
            <StatsCard
              title="Total Chat Sessions"
              value={stats?.totalSessions ?? 0}
              description="Unique user chat sessions"
              icon={MessageSquare}
              color="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              delay={0.2}
            />
            <StatsCard
              title="Total Questions Asked"
              value={stats?.totalQuestions ?? 0}
              description="RAG questions answered"
              icon={HelpCircle}
              color="text-purple-400 bg-purple-500/10 border-purple-500/20"
              delay={0.3}
            />
          </>
        )}
      </div>

      {/* Recent Uploaded Documents */}
      <div>
        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl bg-card" />
        ) : (
          <RecentDocuments documents={stats?.recentDocuments || []} />
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
