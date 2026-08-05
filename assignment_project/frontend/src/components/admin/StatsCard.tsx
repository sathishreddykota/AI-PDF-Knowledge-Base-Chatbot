'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  color?: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'text-primary bg-primary/10 border-primary/20',
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="bg-card border-border/80 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </span>
            <div className={`p-2.5 rounded-xl border ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
