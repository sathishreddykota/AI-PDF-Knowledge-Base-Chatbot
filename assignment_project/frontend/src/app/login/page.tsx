'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Bot, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginSchema, LoginSchemaType } from '@/lib/validations';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@admin.com',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', data);
      if (res.data?.success && res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        setAuth(user, accessToken, refreshToken);
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card/80 backdrop-blur-xl border-border/80 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Bot className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold">Admin Portal Login</CardTitle>
            <CardDescription className="text-xs">
              Access the PDF Knowledge Base Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="admin@admin.com"
                    className="pl-9 text-xs rounded-xl bg-background/50 border-border/80"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 text-xs rounded-xl bg-background/50 border-border/80"
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-400 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium text-center">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl text-xs font-semibold h-10 gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Login to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/60 text-center">
              <p className="text-[11px] text-muted-foreground">
                Default Credentials: <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">admin@admin.com</code> / <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">Admin@123</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
