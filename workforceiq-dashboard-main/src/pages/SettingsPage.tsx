import { Settings, User as UserIcon, Bell, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { User as AuthUser } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> Profile
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm">Name</Label>
            <Input defaultValue={user?.name} className="mt-1.5 bg-background border-border" />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Email</Label>
            <Input defaultValue={user?.email} className="mt-1.5 bg-background border-border" />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Role</Label>
            <Input defaultValue={user?.role} disabled className="mt-1.5 bg-background border-border opacity-60" />
          </div>
          <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success('Profile updated')}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notifications
        </h3>
        <div className="space-y-4">
          {['Email notifications', 'Attrition alerts', 'Weekly digest', 'New candidate alerts'].map(label => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Security
        </h3>
        <Button variant="outline" className="border-border" onClick={() => toast.info('Password reset email sent')}>
          Change Password
        </Button>
      </div>
    </div>
  );
}
