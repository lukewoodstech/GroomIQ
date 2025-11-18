"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Building2, Clock, Scissors } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("GroomIQ");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [defaultDuration, setDefaultDuration] = useState("60");

  function handleSaveBusinessInfo(e: React.FormEvent) {
    e.preventDefault();
    // In a real app, this would save to the database
    toast.success("Business information saved");
  }

  function handleSaveAppointmentSettings(e: React.FormEvent) {
    e.preventDefault();
    // In a real app, this would save to the database
    toast.success("Appointment settings saved");
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

          {/* Business Information */}
          <div className="rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Business Information</h3>
            </div>
            <form onSubmit={handleSaveBusinessInfo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="contact@yourbusiness.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Phone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>

          {/* Appointment Settings */}
          <div className="rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Appointment Settings</h3>
            </div>
            <form onSubmit={handleSaveAppointmentSettings} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultDuration">
                  Default Appointment Duration (minutes)
                </Label>
                <Input
                  id="defaultDuration"
                  type="number"
                  min="15"
                  step="15"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>

          {/* Services */}
          <div className="rounded-lg border p-6">
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
        </div>
      </div>
    </main>
  );
}
