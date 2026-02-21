import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useSeo } from '@/hooks/useSeo';
import { Sparkles, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  useSeo({ title: 'Sign In' });
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle email confirmation redirect
  useEffect(() => {
    if (searchParams.get('confirmed') === '1') {
      toast({ title: '✅ Email confirmed! You can now log in.' });
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const validateForm = () => {
    if (!email.includes('@')) { toast({ title: 'Enter a valid email', variant: 'destructive' }); return false; }
    if (password.length < 6) { toast({ title: 'Password must be at least 6 characters', variant: 'destructive' }); return false; }
    if (isSignUp && username.trim().length < 3) { toast({ title: 'Username must be at least 3 characters', variant: 'destructive' }); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, username.trim());
      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: '🎉 Check your email!', description: 'Click the confirmation link to start earning rewards.' });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message.includes('Invalid') ? 'Wrong email or password.' : error.message;
        toast({ title: 'Login failed', description: msg, variant: 'destructive' });
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-3">
            <span className="text-4xl font-black text-primary">Jara</span>
            <span className="text-4xl font-black text-foreground">Daily</span>
          </div>
          <p className="text-sm text-muted-foreground">Nigeria's #1 content platform — earn XP & Coins</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Tab switcher */}
            <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
              <button onClick={() => setIsSignUp(false)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${!isSignUp ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                Log In
              </button>
              <button onClick={() => setIsSignUp(true)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${isSignUp ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Username (min 3 chars)" value={username}
                    onChange={e => setUsername(e.target.value)} className="pl-9" autoComplete="username" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)} className="pl-9" autoComplete="email" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={password}
                  onChange={e => setPassword(e.target.value)} className="pl-9 pr-9"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Please wait...</>
                  : isSignUp ? 'Create Account' : 'Log In'
                }
              </Button>
            </form>

            {/* Reward callout */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">Earn while you read!</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Members earn XP & Jara Coins from every post. Compete on the national leaderboard!
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-5">
          <button onClick={() => navigate('/')} className="text-primary font-semibold hover:underline">
            Continue as guest →
          </button>
        </p>
      </div>
    </div>
  );
}
