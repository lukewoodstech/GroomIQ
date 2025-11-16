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
import { getAppointments, getPets, createAppointment } from "../actions/appointments";
import { Plus, Search, Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function SchedulePage() {
  const appointments = await getAppointments();
  const pets = await getPets();

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    const dateKey = format(new Date(apt.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, typeof appointments>);

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
              />
            </div>
          </div>
          <AddAppointmentDialog pets={pets} />
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
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No appointments yet. Book your first appointment to get started.
              </p>
              <AddAppointmentDialog pets={pets} />
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
                        <div
                          key={apt.id}
                          className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {apt.pet.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {apt.pet.client.firstName}{" "}
                                {apt.pet.client.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(apt.date), "h:mm a")} •{" "}
                                {apt.duration} min
                                {apt.service && ` • ${apt.service}`}
                              </p>
                              {apt.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {apt.notes}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                apt.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : apt.status === "cancelled"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                        </div>
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

function AddAppointmentDialog({
  pets,
}: {
  pets: Array<{
    id: string;
    name: string;
    client: { firstName: string; lastName: string };
  }>;
}) {
  return (
    <Dialog>
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
        <form action={createAppointment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="petId">Pet *</Label>
            <select
              id="petId"
              name="petId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a pet</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.client.firstName} {pet.client.lastName})
                </option>
              ))}
            </select>
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
                <option value="Full Groom">Full Groom</option>
                <option value="Bath">Bath</option>
                <option value="Nail Trim">Nail Trim</option>
                <option value="Haircut">Haircut</option>
                <option value="Other">Other</option>
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
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogTrigger>
            <Button type="submit">Book Appointment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

