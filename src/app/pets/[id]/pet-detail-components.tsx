"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  PawPrint,
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

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
};

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: number | null;
  notes: string | null;
  client: Client;
  appointments: Appointment[];
  createdAt: Date;
};

export function PetDetailContent({ pet }: { pet: Pet }) {
  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = pet.appointments.filter(
    (apt) => new Date(apt.date) >= now && apt.status === "scheduled"
  );
  const pastAppointments = pet.appointments.filter(
    (apt) => new Date(apt.date) < now || apt.status !== "scheduled"
  );

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/pets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{pet.name}</h1>
              <p className="text-sm text-muted-foreground">
                {pet.species}
                {pet.breed && ` • ${pet.breed}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          {/* Pet Info */}
          <div className="rounded-lg border p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <PawPrint className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Pet Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Species</p>
                <p className="capitalize">{pet.species}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Breed</p>
                <p>{pet.breed || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Age</p>
                <p>{pet.age ? `${pet.age} years` : "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Appointments</p>
                <p>{pet.appointments.length}</p>
              </div>
            </div>
            {pet.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{pet.notes}</p>
              </div>
            )}
          </div>

          {/* Owner Info */}
          <div className="rounded-lg border p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Owner</h2>
            </div>
            <Link
              href={`/clients/${pet.client.id}`}
              className="block hover:bg-muted/50 -m-2 p-2 rounded-md transition-colors"
            >
              <p className="font-medium">
                {pet.client.firstName} {pet.client.lastName}
              </p>
              <div className="text-sm text-muted-foreground mt-1">
                {pet.client.phone && <p>{pet.client.phone}</p>}
                {pet.client.email && <p>{pet.client.email}</p>}
              </div>
            </Link>
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
                        <p className="font-semibold">
                          {format(new Date(apt.date), "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.date), "h:mm a")} •{" "}
                          {apt.duration} min
                          {apt.service && ` • ${apt.service}`}
                        </p>
                        {apt.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {apt.notes}
                          </p>
                        )}
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
                        <p className="font-semibold">
                          {format(new Date(apt.date), "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.date), "h:mm a")} •{" "}
                          {apt.duration} min
                          {apt.service && ` • ${apt.service}`}
                        </p>
                        {apt.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {apt.notes}
                          </p>
                        )}
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
