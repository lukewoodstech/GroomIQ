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
import { Settings, Building2, Clock, Scissors, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { updateSettings } from "../actions/settings";
import { createService, updateService, deleteService, toggleServiceActive } from "../actions/services";
import { SubmitButton } from "@/components/ui/submit-button";

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

export function SettingsPageContent({
  settings,
  services,
}: {
  settings: Settings;
  services: Service[];
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
