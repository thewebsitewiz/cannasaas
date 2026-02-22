// (continuing from the StaffSettings function above - this is the complete staff section and root component)

  const ROLES = ['admin', 'manager', 'budtender', 'driver'];

  const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    admin:     { color: 'text-red-300',    bg: 'bg-red-900/20',    border: 'border-red-800/30' },
    manager:   { color: 'text-amber-300',  bg: 'bg-amber-900/20',  border: 'border-amber-800/30' },
    budtender: { color: 'text-emerald-300',bg: 'bg-emerald-900/20',border: 'border-emerald-800/30' },
    driver:    { color: 'text-cyan-300',   bg: 'bg-cyan-900/20',   border: 'border-cyan-800/30' },
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-400" /> Staff Accounts
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-0.5">
                Manage who has access to this dispensary's admin panel
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowInviteDialog(true)}
              className="gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">
              <Mail className="h-3.5 w-3.5" /> Invite Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="px-4 pb-4 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 bg-slate-800 rounded-lg" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {(staff ?? []).map((member: any) => {
                const roleConf = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.budtender;
                return (
                  <div key={member.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                      {member.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${roleConf.color} ${roleConf.bg} ${roleConf.border}`}>
                      {member.role}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${member.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="text-xs text-slate-500">{member.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <button onClick={() => setDeleteStaffId(member.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors ml-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Invite Dialog ── */}
      <InviteStaffDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['staff'] });
          toast({ title: 'Invitation sent' });
        }}
      />

      {/* ── Deactivate Confirm ── */}
      <AlertDialog open={!!deleteStaffId} onOpenChange={o => !o && setDeleteStaffId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate Staff Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              They will lose access to the admin portal immediately. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteStaffId) {
                  apiClient.put(`/users/${deleteStaffId}`, { isActive: false }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['staff'] });
                    setDeleteStaffId(null);
                    toast({ title: 'Staff member deactivated' });
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Invite Staff Dialog ──────────────────────────────────────────────────────

function InviteStaffDialog({
  open, onOpenChange, onSuccess,
}: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(inviteSchema),
  });

  const inviteMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/users', { ...values, sendInvite: true }),
    onSuccess: () => { reset(); onSuccess(); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(v => inviteMutation.mutate(v))}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={lc}>First Name *</Label>
                <Input {...register('firstName')} className={fc} />
              </div>
              <div className="space-y-1.5">
                <Label className={lc}>Last Name *</Label>
                <Input {...register('lastName')} className={fc} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={lc}>Email *</Label>
              <Input type="email" {...register('email')} className={fc} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className={lc}>Role *</Label>
              <select {...register('role')}
                className="w-full h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-white text-sm focus:border-amber-500/60 focus:outline-none">
                <option value="">Select role…</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="budtender">Budtender</option>
                <option value="driver">Driver</option>
              </select>
            </div>
            <div className="p-3 bg-blue-900/10 border border-blue-800/30 rounded-lg">
              <p className="text-xs text-blue-300">
                An invitation email will be sent to this address. They'll set their own password on first login.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  // Get active dispensary from store
  const { activeDispensaryId } = useOrganizationStore();
  const dispensaryId = activeDispensaryId ?? '';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-6 w-6 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-slate-400 text-sm">Configure your dispensary</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 gap-1 flex-wrap h-auto">
          {[
            { value: 'general',  label: 'General',        icon: Building2 },
            { value: 'branding', label: 'Branding',       icon: Palette },
            { value: 'delivery', label: 'Delivery Zones', icon: Truck },
            { value: 'tax',      label: 'Tax',            icon: Calculator },
            { value: 'staff',    label: 'Staff',          icon: Users },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-semibold text-slate-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings dispensaryId={dispensaryId} />
        </TabsContent>
        <TabsContent value="branding">
          <BrandingSettings dispensaryId={dispensaryId} />
        </TabsContent>
        <TabsContent value="delivery">
          <DeliveryZoneSettings dispensaryId={dispensaryId} />
        </TabsContent>
        <TabsContent value="tax">
          <TaxSettings dispensaryId={dispensaryId} />
        </TabsContent>
        <TabsContent value="staff">
          <StaffSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
