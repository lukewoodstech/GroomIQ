"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Settings, Building2, Clock, Scissors, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, User, LogOut, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { updateSettings } from "../actions/settings";
import { createService, updateService, deleteService, toggleServiceActive } from "../actions/services";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "next-auth/react";

type Settings = {
  id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  defaultDuration: number;
  openTime: string;
  closeTime: string;
  daysOpen: string;
};

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

const DAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

type User = {
  id: string;
  name: string | null;
  email: string;
};

export function SettingsPageContent({
  settings,
  services,
  user,
}: {
  settings: Settings;
  services: Service[];
  user: User;
}) {
  const [selectedDays, setSelectedDays] = useState<string[]>(
    settings.daysOpen.split(",").filter(Boolean)
  );

  async function handleSubmit(formData: FormData) {
    try {
      formData.set("daysOpen", selectedDays.join(","));
      await updateSettings(formData);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    }
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold">Settings</h2>
            <p className="text-muted-foreground mt-1">
              Configure your business preferences
            </p>
          </div>

          {/* User Profile */}
          <div className="rounded-lg border p-6 mb-6 bg-gradient-to-br from-background to-muted/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">User Profile</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base font-medium">{user.name || "Not set"}</p>
                </div>
                <UpdateProfileDialog user={user} />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Password</p>
                  <p className="text-base font-medium">••••••••</p>
                </div>
                <ChangePasswordDialog />
              </div>
            </div>
          </div>

          <form action={handleSubmit}>
            {/* Business Information */}
            <div className="rounded-lg border p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Business Information</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    defaultValue={settings.businessName}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    defaultValue={settings.businessEmail}
                    placeholder="contact@yourbusiness.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    type="tel"
                    defaultValue={settings.businessPhone}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="rounded-lg border p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Business Hours</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">Opening Time</Label>
                    <Input
                      id="openTime"
                      name="openTime"
                      type="time"
                      defaultValue={settings.openTime}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Closing Time</Label>
                    <Input
                      id="closeTime"
                      name="closeTime"
                      type="time"
                      defaultValue={settings.closeTime}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Days Open</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={selectedDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultDuration">
                    Default Appointment Duration (minutes)
                  </Label>
                  <Input
                    id="defaultDuration"
                    name="defaultDuration"
                    type="number"
                    min="15"
                    step="15"
                    defaultValue={settings.defaultDuration}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <SubmitButton size="lg">Save Settings</SubmitButton>
            </div>
          </form>

          {/* Services Management */}
          <div className="rounded-lg border p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Services</h3>
              </div>
              <AddServiceDialog />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage services available for appointments
            </p>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No services yet. Add your first service to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {services.map((service) => (
                  <ServiceRow key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ServiceRow({ service }: { service: Service }) {
  async function handleToggle() {
    try {
      await toggleServiceActive(service.id);
      toast.success(service.isActive ? "Service deactivated" : "Service activated");
    } catch {
      toast.error("Failed to update service");
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{service.name}</h4>
          {!service.isActive && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              Inactive
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
          <span>{service.duration} min</span>
          {service.price && <span>${service.price.toFixed(2)}</span>}
          {service.description && <span className="truncate max-w-xs">{service.description}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggle}
          title={service.isActive ? "Deactivate" : "Activate"}
        >
          {service.isActive ? (
            <ToggleRight className="h-4 w-4 text-green-600" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        <EditServiceDialog service={service} />
        <DeleteServiceDialog service={service} />
      </div>
    </div>
  );
}

function AddServiceDialog() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      formData.set("isActive", "true");
      formData.set("sortOrder", "0");
      await createService(formData);
      setOpen(false);
      toast.success("Service added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add service");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Create a new service for appointments
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min) *</Label>
              <Input id="duration" name="duration" type="number" min="15" step="15" defaultValue="60" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Add Service</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditServiceDialog({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      formData.set("isActive", service.isActive.toString());
      formData.set("sortOrder", service.sortOrder.toString());
      await updateService(service.id, formData);
      setOpen(false);
      toast.success("Service updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update service");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update service details
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Service Name *</Label>
            <Input id="edit-name" name="name" defaultValue={service.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (min) *</Label>
              <Input
                id="edit-duration"
                name="duration"
                type="number"
                min="15"
                step="15"
                defaultValue={service.duration}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={service.price || ""}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={service.description || ""}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Save Changes</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteServiceDialog({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteService(service.id);
      setOpen(false);
      toast.success("Service deleted successfully");
    } catch {
      toast.error("Failed to delete service");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{service.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UpdateProfileDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setOpen(false);
      toast.success("Profile updated successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>
            Update your personal information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <KeyRound className="h-3.5 w-3.5" />
          Change
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your account password
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
