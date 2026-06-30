import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Layers, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
      toast.success('Welcome back!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - branding */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 p-12 lg:flex">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-6 text-white">
          <h1 className="text-4xl font-bold leading-tight">
            Resource allocation,<br />simplified.
          </h1>
          <p className="max-w-md text-lg text-blue-100">
            Manage employees, projects, and allocations across your organization with real-time visibility and smart insights.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-blue-200">Capacity tracking</p>
            </div>
            <div>
              <p className="text-3xl font-bold">Real-time</p>
              <p className="text-sm text-blue-200">Allocation board</p>
            </div>
            <div>
              <p className="text-3xl font-bold">Smart</p>
              <p className="text-sm text-blue-200">Shadow resource mgmt</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-blue-200">Internal tool — Authorized personnel only</p>
      </div>

      {/* Right side - form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Shadow</p>
              <p className="text-xs text-muted-foreground">Allotment Tracker</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
