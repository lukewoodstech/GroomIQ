"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Building2, Clock, Scissors } from "lucide-react";
import { toast } from "sonner";
import { updateSettings } from "../actions/settings";

type Settings = {
  id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  defaultDuration: number;
};

export function SettingsPageContent({ settings }: { settings: Settings }) {
  async function handleSubmit(formData: FormData) {
    try {
      await updateSettings(formData);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
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
        <div className="p-6 max-w-2xl">
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

            {/* Appointment Settings */}
            <div className="rounded-lg border p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Appointment Settings</h3>
              </div>
              <div className="space-y-4">
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

            {/* Services */}
            <div className="rounded-lg border p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Services</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Default services available for appointments
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Full Groom</span>
                  <span className="text-muted-foreground">Default</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Bath</span>
                  <span className="text-muted-foreground">Default</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Nail Trim</span>
                  <span className="text-muted-foreground">Default</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Haircut</span>
                  <span className="text-muted-foreground">Default</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Other</span>
                  <span className="text-muted-foreground">Default</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Custom service management coming soon
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Save All Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
