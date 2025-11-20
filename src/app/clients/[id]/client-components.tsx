"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Phone,
  Mail,
  PawPrint,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Appointment = {
  id: string;
  date: Date;
  duration: number;
  service: string | null;
  notes: string | null;
  status: string;
};

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: number | null;
  notes: string | null;
  appointments: Appointment[];
};

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  pets: Pet[];
};

export function ClientDetailContent({ client }: { client: Client }) {
  // Collect all appointments across all pets
  const allAppointments = client.pets.flatMap((pet) =>
    pet.appointments.map((apt) => ({
      ...apt,
      petName: pet.name,
    }))
  );

  // Sort by date descending
  allAppointments.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = allAppointments.filter(
    (apt) => new Date(apt.date) >= now && apt.status === "scheduled"
  );
  const pastAppointments = allAppointments.filter(
    (apt) => new Date(apt.date) < now || apt.status !== "scheduled"
  );

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Client since {format(new Date(client.createdAt), "MMMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {client.phone && (
              <a href={`tel:${client.phone}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          {/* Contact Info */}
          <div className="rounded-lg border p-4 mb-6">
            <h2 className="font-semibold mb-3">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>{client.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{client.email || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Pets */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                Pets ({client.pets.length})
              </h2>
            </div>
            {client.pets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pets registered</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {client.pets.map((pet) => (
                  <div key={pet.id} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pet.species}
                      {pet.breed && ` • ${pet.breed}`}
                      {pet.age && ` • ${pet.age} years old`}
                    </p>
                    {pet.notes && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {pet.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {pet.appointments.length} appointment
                      {pet.appointments.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  Upcoming Appointments ({upcomingAppointments.length})
                </h2>
              </div>
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-lg border p-4 bg-emerald-50 border-emerald-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{apt.petName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.date), "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.date), "h:mm a")} •{" "}
                          {apt.duration} min
                          {apt.service && ` • ${apt.service}`}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Appointments */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                Appointment History ({pastAppointments.length})
              </h2>
            </div>
            {pastAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No appointment history
              </p>
            ) : (
              <div className="space-y-3">
                {pastAppointments.slice(0, 10).map((apt) => (
                  <div key={apt.id} className="rounded-lg border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{apt.petName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.date), "MMMM d, yyyy")} at{" "}
                          {format(new Date(apt.date), "h:mm a")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.duration} min
                          {apt.service && ` • ${apt.service}`}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          apt.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : apt.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
                {pastAppointments.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing 10 of {pastAppointments.length} appointments
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
