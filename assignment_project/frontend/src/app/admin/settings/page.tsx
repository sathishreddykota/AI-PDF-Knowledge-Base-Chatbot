'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { Shield, Server, Cpu, Database } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings & Architecture</h1>
        <p className="text-xs text-muted-foreground mt-1">
          System configuration and architecture overview.
        </p>
      </div>

      {/* Account Card */}
      <Card className="bg-card border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Administrator Account
          </CardTitle>
          <CardDescription className="text-xs">Logged in admin user details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Admin Email</span>
            <span className="font-medium">{user?.email || 'admin@admin.com'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium text-emerald-400">Super Admin</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Authentication Method</span>
            <span className="font-medium">JWT (Access + Refresh Token)</span>
          </div>
        </CardContent>
      </Card>

      {/* System Architecture Overview */}
      <Card className="bg-card border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Microservices Stack & Integration
          </CardTitle>
          <CardDescription className="text-xs">System components and communication setup</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-2">
            <div className="font-semibold text-primary flex items-center gap-2">
              <Server className="w-4 h-4" />
              Node.js Backend
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              NestJS + TypeScript API server handling JWT authentication, document uploads, and MongoDB persistence.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-2">
            <div className="font-semibold text-primary flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Python AI Microservice
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              FastAPI service with LangChain, LangGraph workflow, ChromaDB vector store, and Gemini 2.5 Flash LLM.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-2">
            <div className="font-semibold text-primary flex items-center gap-2">
              <Database className="w-4 h-4" />
              Redis Pub/Sub
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Decoupled Pub/Sub communication channel (`ai_request` & `ai_response`) between Node.js and Python.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
