import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordRules = [
    { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
    { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
    { label: 'Number', test: (v: string) => /\d/.test(v) },
    { label: 'Special character', test: (v: string) => /[!@#$%^&*]/.test(v) },
  ];

  const isStrongPassword = (value: string) => passwordRules.every((r) => r.test(value));

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email. Check your inbox.');
      setStep('verify');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      await client.post('/auth/verify-reset-otp', { email, otp });
      toast.success('OTP verified! Set your new password.');
      setStep('reset');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords must match');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      toast.error('Password does not meet all requirements');
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Reset Password</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {step === 'request' ? 'Enter your email address to receive a reset OTP'
            : step === 'verify' ? `Enter the 6-digit OTP sent to ${email}`
            : 'Set your new password'}
          </CardDescription>
        </CardHeader>
        {step === 'request' ? (
          <form onSubmit={handleRequest}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Submit'}
              </Button>
              <div className="text-xs text-center">
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : step === 'verify' ? (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <button type="button" onClick={() => setStep('request')} className="text-xs text-primary hover:underline cursor-pointer">
                Back
              </button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-reset">OTP Code</Label>
                <Input
                  id="otp-reset"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <ul className="space-y-1 mt-1">
                    {passwordRules.map((rule) => (
                      <li key={rule.label} className={`text-xs flex items-center gap-1 ${rule.test(newPassword) ? 'text-green-500' : 'text-muted-foreground'}`}>
                        <span>{rule.test(newPassword) ? '✓' : '○'}</span> {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
              <div className="text-xs text-center">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-primary hover:underline font-medium bg-none border-none cursor-pointer"
                >
                  Back
                </button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};
