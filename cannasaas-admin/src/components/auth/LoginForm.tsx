import * as z from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Fetch tenants on mount (no auth/tenant header needed)
  useEffect(() => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    axios
      .get(`${baseUrl}/tenants/public`)
      .then((res) => {
        setTenants(res.data);
        if (res.data.length > 0) {
          setSelectedTenantId(res.data[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch tenants:', err);
        toast({
          title: 'Error',
          description: 'Could not load organizations',
          variant: 'destructive',
        });
      });
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    if (!selectedTenantId) {
      toast({
        title: 'Error',
        description: 'Please select an organization',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save tenant ID BEFORE making the API call
      // so the axios interceptor picks it up
      localStorage.setItem('tenantId', selectedTenantId);

      const response = await api.post('/auth/login', data);

      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Select your organization and enter your credentials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tenant Selector */}
          <div className="space-y-2">
            <Label htmlFor="tenant">Organization</Label>
            <select
              id="tenant"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={isLoading || tenants.length === 0}
            >
              {tenants.length === 0 && <option value="">Loading...</option>}
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !selectedTenantId}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
