import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Mail, Bell, Shield, Building2, Settings } from 'lucide-react';

export function SettingsManagement() {
  const { toast } = useToast();

  // M-Pesa settings
  const [mpesaSettings, setMpesaSettings] = useState({
    consumerKey: '',
    consumerSecret: '',
    shortCode: '',
    passKey: '',
    callbackUrl: '',
    enabled: false,
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'RentEase',
    enabled: false,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewApplication: true,
    emailOnPaymentReceived: true,
    emailOnMaintenanceRequest: true,
    emailOnLeaseExpiry: true,
    paymentReminderDays: 3,
    lateFeePercentage: 5,
    gracePeriodDays: 5,
  });

  const handleSaveMpesa = () => {
    toast({
      title: 'M-Pesa Settings Saved',
      description: 'M-Pesa configuration has been updated. Note: This is a placeholder for backend integration.',
    });
  };

  const handleSaveEmail = () => {
    toast({
      title: 'Email Settings Saved',
      description: 'Email configuration has been updated. Note: This is a placeholder for backend integration.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Notification Settings Saved',
      description: 'Notification preferences have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">Configure system-wide settings and integrations</p>
      </div>

      <Tabs defaultValue="mpesa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="mpesa" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">M-Pesa</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        {/* M-Pesa Tab */}
        <TabsContent value="mpesa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                M-Pesa Integration
              </CardTitle>
              <CardDescription>
                Configure Safaricom M-Pesa Daraja API for automated payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Enable M-Pesa Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow tenants to pay rent via M-Pesa
                  </p>
                </div>
                <Switch
                  checked={mpesaSettings.enabled}
                  onCheckedChange={(checked) => setMpesaSettings({ ...mpesaSettings, enabled: checked })}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="consumerKey">Consumer Key</Label>
                  <Input
                    id="consumerKey"
                    type="password"
                    value={mpesaSettings.consumerKey}
                    onChange={(e) => setMpesaSettings({ ...mpesaSettings, consumerKey: e.target.value })}
                    placeholder="Enter consumer key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumerSecret">Consumer Secret</Label>
                  <Input
                    id="consumerSecret"
                    type="password"
                    value={mpesaSettings.consumerSecret}
                    onChange={(e) => setMpesaSettings({ ...mpesaSettings, consumerSecret: e.target.value })}
                    placeholder="Enter consumer secret"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shortCode">Short Code (Paybill/Till)</Label>
                  <Input
                    id="shortCode"
                    value={mpesaSettings.shortCode}
                    onChange={(e) => setMpesaSettings({ ...mpesaSettings, shortCode: e.target.value })}
                    placeholder="e.g., 174379"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passKey">Pass Key</Label>
                  <Input
                    id="passKey"
                    type="password"
                    value={mpesaSettings.passKey}
                    onChange={(e) => setMpesaSettings({ ...mpesaSettings, passKey: e.target.value })}
                    placeholder="Enter pass key"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="callbackUrl">Callback URL</Label>
                <Input
                  id="callbackUrl"
                  value={mpesaSettings.callbackUrl}
                  onChange={(e) => setMpesaSettings({ ...mpesaSettings, callbackUrl: e.target.value })}
                  placeholder="https://your-api.com/mpesa/callback"
                />
                <p className="text-xs text-muted-foreground">
                  URL where M-Pesa will send payment confirmations
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveMpesa}>Save M-Pesa Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for sending system emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send automated emails for system events
                  </p>
                </div>
                <Switch
                  checked={emailSettings.enabled}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enabled: checked })}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                    placeholder="App password"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                    placeholder="noreply@rentease.co.ke"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                    placeholder="RentEase"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveEmail}>Save Email Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure when and how notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Email Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'emailOnNewApplication', label: 'New Application', desc: 'When a tenant submits a rental application' },
                    { key: 'emailOnPaymentReceived', label: 'Payment Received', desc: 'When a rent payment is confirmed' },
                    { key: 'emailOnMaintenanceRequest', label: 'Maintenance Request', desc: 'When a new maintenance request is submitted' },
                    { key: 'emailOnLeaseExpiry', label: 'Lease Expiry Warning', desc: 'When a lease is about to expire' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Payment Settings</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">Payment Reminder (days before)</Label>
                    <Input
                      id="reminderDays"
                      type="number"
                      min={1}
                      value={notificationSettings.paymentReminderDays}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          paymentReminderDays: parseInt(e.target.value) || 3,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                    <Input
                      id="gracePeriod"
                      type="number"
                      min={0}
                      value={notificationSettings.gracePeriodDays}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          gracePeriodDays: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lateFee">Late Fee (%)</Label>
                    <Input
                      id="lateFee"
                      type="number"
                      min={0}
                      max={100}
                      value={notificationSettings.lateFeePercentage}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          lateFeePercentage: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>System details and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">RentEase</p>
                      <p className="text-sm text-muted-foreground">Property Management System</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="text-lg font-medium">1.0.0</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">System Status</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Database', status: 'Connected', color: 'bg-success' },
                    { label: 'API', status: 'Mock Mode', color: 'bg-warning' },
                    { label: 'M-Pesa', status: 'Not Configured', color: 'bg-muted' },
                    { label: 'Email', status: 'Not Configured', color: 'bg-muted' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg border p-3">
                      <div className={`h-2 w-2 rounded-full ${item.color}`} />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
                <p className="text-sm font-medium text-warning">Development Mode</p>
                <p className="text-sm text-muted-foreground">
                  This system is running with mock data. Connect to your backend API for production use.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
