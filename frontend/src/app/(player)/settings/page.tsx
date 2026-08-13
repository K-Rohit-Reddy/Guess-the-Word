'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { settingsAPI } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [username, setUsername] = useState(user?.username || '');

  const debouncedUsername = useDebounce(username, 500);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setDisplayName(user?.display_name || '');
    setUsername(user?.username || '');
  }, [user]);

  useEffect(() => {
    if (debouncedUsername && debouncedUsername !== user?.username) {
      checkUsername(debouncedUsername);
    } else {
      setIsUsernameAvailable(null);
    }
  }, [debouncedUsername, user?.username]);

  const checkUsername = async (un: string) => {
    setIsCheckingUsername(true);
    try {
      const res = await settingsAPI.checkUsername(un);
      setIsUsernameAvailable(res.available);
    } catch (error) {
      setIsUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const cancelProfileEdit = () => {
    setDisplayName(user?.display_name || '');
    setUsername(user?.username || '');
    setIsUsernameAvailable(null);
    setIsEditingProfile(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName || displayName.trim().length === 0) {
      toast.error('Display name cannot be empty');
      return;
    }

    if (username.length < 5) {
      toast.error('Username must be at least 5 characters');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      toast.error('Username must contain only letters and numbers');
      return;
    }

    if (username === username.toLowerCase() || username === username.toUpperCase()) {
      toast.error('Username must contain both upper and lowercase letters');
      return;
    }

    if (isUsernameAvailable === false && username !== user?.username) {
      toast.error('Username is taken');
      return;
    }

    setIsSavingProfile(true);
    try {
      await settingsAPI.updateProfile({
        display_name: displayName,
        username
      });
      await refreshUser();
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const cancelPasswordEdit = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 5) {
      toast.error('Password must be at least 5 characters');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (!/[$%*&@]/.test(newPassword)) {
      toast.error('Password must contain at least one special character ($, %, *, &, @)');
      return;
    }

    setIsSavingPassword(true);
    try {
      await settingsAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Password updated successfully');
      cancelPasswordEdit();
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const greenButton =
    'bg-gradient-to-r from-[#6aaa64] to-[#4e9048] hover:opacity-90 text-white';

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-[var(--font-heading)] font-bold bg-gradient-to-r from-[#6aaa64] to-[#4e9048] bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and security.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-muted bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your display name and username.</CardDescription>
              {!isEditingProfile && (
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {!isEditingProfile ? (
                <dl className="space-y-4">
                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display Name</dt>
                    <dd className="text-sm text-foreground">{displayName || '—'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Username</dt>
                    <dd className="text-sm text-foreground">{username || '—'}</dd>
                  </div>
                </dl>
              ) : (
                <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name"
                      required
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        required
                        className="pr-24"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {!isCheckingUsername && isUsernameAvailable === true && (
                          <Badge variant="outline" className="text-[#5c9656] border-[#6aaa64]/40 bg-[#6aaa64]/10 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Available
                          </Badge>
                        )}
                        {!isCheckingUsername && isUsernameAvailable === false && (
                          <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 gap-1">
                            <XCircle className="w-3 h-3" /> Taken
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
            {isEditingProfile && (
              <CardFooter className="justify-end gap-2">
                <Button type="button" variant="ghost" onClick={cancelProfileEdit}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="profile-form"
                  disabled={isSavingProfile || isUsernameAvailable === false}
                  className={greenButton}
                >
                  {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="border-muted bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
              {!isEditingPassword && (
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingPassword(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {!isEditingPassword ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</p>
                  <p className="text-lg tracking-[0.25em] text-foreground">••••••••</p>
                </div>
              ) : (
                <form id="password-form" onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 5 characters and contain letters, numbers, and special characters.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </form>
              )}
            </CardContent>
            {isEditingPassword && (
              <CardFooter className="justify-end gap-2">
                <Button type="button" variant="ghost" onClick={cancelPasswordEdit}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="password-form"
                  disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className={greenButton}
                >
                  {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
