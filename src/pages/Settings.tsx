import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useSeo } from '@/hooks/useSeo';
import { Moon, Sun, Monitor, Bell, Shield, User, Coins, Globe, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  useSeo({ title: 'Settings' });
  const { theme, setTheme } = useTheme();
  const { user, profile, isGuest, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [xpNotif, setXpNotif] = useState(true);
  const [coinNotif, setCoinNotif] = useState(true);
  const [locationState, setLocationState] = useState(profile?.location_state || '');
  const [savingLocation, setSavingLocation] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveLocation = async () => {
    if (!user) return;
    setSavingLocation(true);
    await updateProfile({ location_state: locationState });
    setSavingLocation(false);
    toast({ title: 'Location updated!' });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: 'Failed to update password', description: error.message, variant: 'destructive' });
    } else {
      setNewPassword('');
      setChangingPassword(false);
      toast({ title: 'Password updated!' });
    }
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'high-contrast' ? Monitor : Sun;

  return (
    <AppLayout>
      <div className="py-4 space-y-4">
        <h1 className="text-xl font-black">Settings</h1>

        {/* Appearance */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ThemeIcon className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Appearance</h2>
            </div>
            <Select value={theme} onValueChange={v => setTheme(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">☀️ Light</SelectItem>
                <SelectItem value="dark">🌙 Dark</SelectItem>
                <SelectItem value="high-contrast">⚡ High Contrast</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Language</h2>
            </div>
            <Select defaultValue="en">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇳🇬 English</SelectItem>
                <SelectItem value="ha">🏛️ Hausa</SelectItem>
                <SelectItem value="yo">🌍 Yoruba</SelectItem>
                <SelectItem value="ig">🌿 Igbo</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Notifications</h2>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="xp-notif" className="text-sm">XP Alerts</Label>
              <Switch id="xp-notif" checked={xpNotif} onCheckedChange={setXpNotif} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="coin-notif" className="text-sm">Coin Alerts</Label>
              <Switch id="coin-notif" checked={coinNotif} onCheckedChange={setCoinNotif} />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        {!isGuest && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-sm">Account</h2>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Location / State</Label>
                <div className="flex gap-2">
                  <Input placeholder="e.g. Lagos, Kano" value={locationState}
                    onChange={e => setLocationState(e.target.value)} className="flex-1" />
                  <Button size="sm" onClick={handleSaveLocation} disabled={savingLocation}>
                    {savingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                <p className="text-sm text-foreground font-medium">{user?.email}</p>
              </div>

              <Separator />

              {changingPassword ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">New Password (min 8 chars)</Label>
                  <div className="flex gap-2">
                    <Input type="password" placeholder="New password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={handleChangePassword} disabled={savingPassword}>
                      {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                  <button className="text-xs text-muted-foreground" onClick={() => setChangingPassword(false)}>Cancel</button>
                </div>
              ) : (
                <button className="flex items-center gap-1.5 text-sm text-primary font-medium"
                  onClick={() => setChangingPassword(true)}>
                  <Lock className="h-3.5 w-3.5" /> Change Password
                </button>
              )}

              <Separator />
              <button className="text-sm text-destructive font-medium"
                onClick={() => { signOut(); navigate('/'); }}>
                Sign Out
              </button>
            </CardContent>
          </Card>
        )}

        {/* Gamification info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-accent" />
              <h2 className="font-bold text-sm">How Coins Work</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Earn XP and Jara Coins by reading, sharing, and engaging with content.
              Coins are globally finite — there are only 1,000,000 total.
              Compete with other Nigerians to earn before the pool runs out!
            </p>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-bold text-sm text-muted-foreground">Legal</h2>
            </div>
            <a href="https://jaradaily.com/privacy" target="_blank" rel="noopener noreferrer"
              className="block text-sm text-primary font-medium">Privacy Policy</a>
            <a href="https://jaradaily.com/terms" target="_blank" rel="noopener noreferrer"
              className="block text-sm text-primary font-medium">Terms of Service</a>
            <p className="text-[10px] text-muted-foreground">Jara Daily v1.0 · Made in Nigeria 🇳🇬</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
