'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, MessageSquare, Bot } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Knowledge Base', href: '/admin/documents', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border/80 bg-card/60 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div className="p-4 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm leading-none">Admin Portal</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">PDF RAG System</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Link to Public Chat */}
        <div className="pt-4 border-t border-border/60">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground px-3 mb-2">
            Public View
          </div>
          <Link href="/">
            <span className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Public AI Chatbot
            </span>
          </Link>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border/80">
        <div className="flex items-center justify-between px-2 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user?.email || 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full text-xs gap-2 rounded-xl h-9 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
