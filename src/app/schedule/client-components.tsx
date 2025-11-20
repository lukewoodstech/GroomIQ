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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "../actions/appointments";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Pet = {
  id: string;
  name: string;
  client: { firstName: string; lastName: string };
};

type Appointment = {
  id: string;
  petId: string;
  date: Date;
  duration: number;
  service: string | null;
  notes: string | null;
  status: string;
  pet: Pet;
};

type Service = {
  id: string;
  name: string;
};

export function SchedulePageContent({
  appointments,
  pets,
  services,
}: {
  appointments: Appointment[];
  pets: Pet[];
  services: Service[];
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAppointments = appointments.filter((apt) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      apt.pet.name.toLowerCase().includes(searchLower) ||
      apt.pet.client.firstName.toLowerCase().includes(searchLower) ||
      apt.pet.client.lastName.toLowerCase().includes(searchLower) ||
      apt.service?.toLowerCase().includes(searchLower) ||
      apt.status.toLowerCase().includes(searchLower)
    );
  });

  // Group appointments by date
  const appointmentsByDate = filteredAppointments.reduce((acc, apt) => {
    const dateKey = format(new Date(apt.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, typeof filteredAppointments>);

  const sortedDates = Object.keys(appointmentsByDate).sort();

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search appointments..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <AddAppointmentDialog pets={pets} services={services} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold">Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Book and manage appointments
            </p>
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No appointments found matching your search."
                  : "No appointments yet. Book your first appointment to get started."}
              </p>
              {!searchTerm && <AddAppointmentDialog pets={pets} services={services} />}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const dateAppointments = appointmentsByDate[dateKey];
                const date = new Date(dateKey);

                return (
                  <div key={dateKey}>
                    <h2 className="text-xl font-semibold mb-3">
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </h2>
                    <div className="space-y-2">
                      {dateAppointments.map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} pets={pets} services={services} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function AppointmentCard({
  appointment,
  pets,
  services,
}: {
  appointment: Appointment;
  pets: Pet[];
  services: Service[];
}) {
  return (
    <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{appointment.pet.name}</h3>
          <p className="text-sm text-muted-foreground">
            {appointment.pet.client.firstName} {appointment.pet.client.lastName}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(appointment.date), "h:mm a")} •{" "}
            {appointment.duration} min
            {appointment.service && ` • ${appointment.service}`}
          </p>
          {appointment.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              {appointment.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              appointment.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : appointment.status === "cancelled"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            }`}
          >
            {appointment.status}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <StatusMenuItem appointment={appointment} status="scheduled" />
              <StatusMenuItem appointment={appointment} status="completed" />
              <StatusMenuItem appointment={appointment} status="cancelled" />
              <DropdownMenuSeparator />
              <EditAppointmentDialog appointment={appointment} pets={pets} services={services} />
              <DeleteAppointmentDialog appointment={appointment} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function StatusMenuItem({
  appointment,
  status,
}: {
  appointment: Appointment;
  status: string;
}) {
  async function handleStatusChange() {
    try {
      await updateAppointmentStatus(appointment.id, status);
      toast.success(`Appointment marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  const icons = {
    scheduled: <Clock className="h-4 w-4 mr-2" />,
    completed: <CheckCircle className="h-4 w-4 mr-2" />,
    cancelled: <XCircle className="h-4 w-4 mr-2" />,
  };

  if (appointment.status === status) {
    return null;
  }

  return (
    <DropdownMenuItem onClick={handleStatusChange}>
      {icons[status as keyof typeof icons]}
      Mark as {status}
    </DropdownMenuItem>
  );
}

function AddAppointmentDialog({ pets, services }: { pets: Pet[]; services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState("");

  const petOptions = pets.map((pet) => ({
    value: pet.id,
    label: pet.name,
    sublabel: `${pet.client.firstName} ${pet.client.lastName}`,
  }));

  async function handleSubmit(formData: FormData) {
    if (!selectedPetId) {
      toast.error("Please select a pet");
      return;
    }

    formData.set("petId", selectedPetId);

    try {
      await createAppointment(formData);
      setOpen(false);
      setSelectedPetId("");
      toast.success("Appointment booked successfully");
    } catch {
      toast.error("Failed to book appointment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedPetId("");
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Schedule an appointment for a pet.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pet *</Label>
            <SearchableSelect
              options={petOptions}
              value={selectedPetId}
              onValueChange={setSelectedPetId}
              placeholder="Search for a pet..."
              searchPlaceholder="Type pet name or owner..."
              emptyMessage="No pets found."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input id="time" name="time" type="time" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                defaultValue={60}
                min="15"
                step="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <select
                id="service"
                name="service"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Book Appointment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAppointmentDialog({
  appointment,
  pets,
  services,
}: {
  appointment: Appointment;
  pets: Pet[];
  services: Service[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(appointment.petId);

  const petOptions = pets.map((pet) => ({
    value: pet.id,
    label: pet.name,
    sublabel: `${pet.client.firstName} ${pet.client.lastName}`,
  }));

  async function handleSubmit(formData: FormData) {
    if (!selectedPetId) {
      toast.error("Please select a pet");
      return;
    }

    formData.set("petId", selectedPetId);

    try {
      await updateAppointment(appointment.id, formData);
      setOpen(false);
      toast.success("Appointment updated successfully");
    } catch {
      toast.error("Failed to update appointment");
    }
  }

  const appointmentDate = new Date(appointment.date);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedPetId(appointment.petId);
    }}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update the appointment details below.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pet *</Label>
            <SearchableSelect
              options={petOptions}
              value={selectedPetId}
              onValueChange={setSelectedPetId}
              placeholder="Search for a pet..."
              searchPlaceholder="Type pet name or owner..."
              emptyMessage="No pets found."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                name="date"
                type="date"
                defaultValue={format(appointmentDate, "yyyy-MM-dd")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Time *</Label>
              <Input
                id="edit-time"
                name="time"
                type="time"
                defaultValue={format(appointmentDate, "HH:mm")}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                name="duration"
                type="number"
                defaultValue={appointment.duration}
                min="15"
                step="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-service">Service</Label>
              <select
                id="edit-service"
                name="service"
                defaultValue={appointment.service || ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              name="status"
              defaultValue={appointment.status}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              name="notes"
              rows={3}
              defaultValue={appointment.notes || ""}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAppointmentDialog({ appointment }: { appointment: Appointment }) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteAppointment(appointment.id);
      setOpen(false);
      toast.success("Appointment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete appointment");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this appointment for{" "}
            {appointment.pet.name} on{" "}
            {format(new Date(appointment.date), "MMMM d, yyyy")}? This action
            cannot be undone.
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
