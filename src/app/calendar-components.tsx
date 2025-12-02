"use client";

import { useState, useEffect, useRef } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "./actions/appointments";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Filter,
  X,
  MapPin,
  User,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, subDays, isSameDay, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Pet = {
  id: string;
  name: string;
  client: { firstName: string; lastName: string; phone: string | null; email: string | null };
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

// Calendar configuration
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 21;
const HOUR_HEIGHT = 72; // Reduced for better density

type Service = {
  id: string;
  name: string;
  duration: number;
};

export function CalendarPageContent({
  appointments,
  pets,
  services,
}: {
  appointments: Appointment[];
  pets: Pet[];
  services: Service[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [quickAddTime, setQuickAddTime] = useState<{ date: Date; hour: number } | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get week dates for week view
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter appointments for a specific date with filters
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      const dateMatch = isSameDay(aptDate, date);
      const statusMatch = !statusFilter || apt.status === statusFilter;
      const serviceMatch = !serviceFilter || apt.service === serviceFilter;
      return dateMatch && statusMatch && serviceMatch;
    });
  };

  // Search all appointments across all dates
  const searchResults = searchTerm
    ? appointments
        .filter((apt) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            apt.pet.name.toLowerCase().includes(searchLower) ||
            apt.pet.client.firstName.toLowerCase().includes(searchLower) ||
            apt.pet.client.lastName.toLowerCase().includes(searchLower) ||
            apt.service?.toLowerCase().includes(searchLower)
          );
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const goToToday = () => setSelectedDate(new Date());
  const goToPrev = () => {
    if (viewMode === "day") {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(subWeeks(selectedDate, 1));
    }
  };
  const goToNext = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1));
    } else {
      setSelectedDate(addWeeks(selectedDate, 1));
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour++) {
    timeSlots.push(hour);
  }

  // Handle click on empty time slot
  const handleTimeSlotClick = (date: Date, hour: number) => {
    setQuickAddTime({ date, hour });
  };

  // Handle drag start
  const handleDragStart = (apt: Appointment) => {
    setDraggedAppointment(apt);
  };

  // Handle drop on time slot
  const handleDrop = async (date: Date, hour: number) => {
    if (!draggedAppointment) return;

    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);

    // Create form data with updated time
    const formData = new FormData();
    formData.set("petId", draggedAppointment.petId);
    formData.set("date", format(newDate, "yyyy-MM-dd"));
    formData.set("time", format(newDate, "HH:mm"));
    formData.set("duration", draggedAppointment.duration.toString());
    formData.set("service", draggedAppointment.service || "");
    formData.set("notes", draggedAppointment.notes || "");
    formData.set("status", draggedAppointment.status);

    try {
      await updateAppointment(draggedAppointment.id, formData);
      toast.success("Appointment rescheduled");
    } catch {
      toast.error("Failed to reschedule");
    }

    setDraggedAppointment(null);
  };

  const hasActiveFilters = statusFilter || serviceFilter;

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Calendar Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              {/* Date Navigation */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="h-9 px-4 text-sm font-medium border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  Today
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPrev}
                    className="h-9 w-9 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[280px] text-center">
                    <h1 className="text-lg font-semibold text-gray-900">
                      {viewMode === "day"
                        ? format(selectedDate, "EEEE, MMMM d, yyyy")
                        : `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}`}
                    </h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNext}
                    className="h-9 w-9 hover:bg-gray-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search appointments..."
                    className="pl-9 h-9 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filters Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                      {hasActiveFilters && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">STATUS</p>
                      <div className="space-y-1">
                        <button
                          onClick={() => setStatusFilter(statusFilter === "scheduled" ? null : "scheduled")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded ${
                            statusFilter === "scheduled" ? "bg-blue-50 text-blue-900" : "hover:bg-gray-100"
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                          Scheduled
                        </button>
                        <button
                          onClick={() => setStatusFilter(statusFilter === "completed" ? null : "completed")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded ${
                            statusFilter === "completed" ? "bg-green-50 text-green-900" : "hover:bg-gray-100"
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </button>
                        <button
                          onClick={() => setStatusFilter(statusFilter === "cancelled" ? null : "cancelled")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded ${
                            statusFilter === "cancelled" ? "bg-red-50 text-red-900" : "hover:bg-gray-100"
                          }`}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelled
                        </button>
                      </div>
                    </div>
                    {services.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2">
                          <p className="text-xs font-semibold text-gray-700 mb-2">SERVICES</p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {services.map((service) => (
                              <button
                                key={service.id}
                                onClick={() => setServiceFilter(serviceFilter === service.name ? null : service.name)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded ${
                                  serviceFilter === service.name ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                                }`}
                              >
                                <Scissors className="h-4 w-4" />
                                {service.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {hasActiveFilters && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setStatusFilter(null);
                            setServiceFilter(null);
                          }}
                          className="text-sm text-red-600 cursor-pointer"
                        >
                          Clear all filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode Toggle */}
                <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
                  <button
                    onClick={() => setViewMode("day")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewMode === "day"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewMode === "week"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Week
                  </button>
                </div>

                {/* New Appointment Button */}
                <AddAppointmentDialog pets={pets} services={services} selectedDate={selectedDate} />
              </div>
            </div>
          </div>
        </header>

        {/* Calendar Grid or Search Results */}
        <div className="flex-1 overflow-auto bg-white">
          {searchTerm ? (
            <SearchResultsView
              results={searchResults}
              pets={pets}
              searchTerm={searchTerm}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSearchTerm("");
              }}
              onSelectAppointment={setSelectedAppointment}
            />
          ) : viewMode === "day" ? (
            <DayView
              date={selectedDate}
              appointments={getAppointmentsForDate(selectedDate)}
              pets={pets}
              services={services}
              timeSlots={timeSlots}
              currentTime={currentTime}
              onTimeSlotClick={handleTimeSlotClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              draggedAppointment={draggedAppointment}
              onSelectAppointment={setSelectedAppointment}
            />
          ) : (
            <WeekView
              weekDates={weekDates}
              getAppointmentsForDate={getAppointmentsForDate}
              pets={pets}
              timeSlots={timeSlots}
              currentTime={currentTime}
              onTimeSlotClick={handleTimeSlotClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              draggedAppointment={draggedAppointment}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setViewMode("day");
              }}
              onSelectAppointment={setSelectedAppointment}
            />
          )}
        </div>

        {/* Quick Add Dialog */}
        {quickAddTime && (
          <QuickAddDialog
            services={services}
            pets={pets}
            date={quickAddTime.date}
            hour={quickAddTime.hour}
            onClose={() => setQuickAddTime(null)}
          />
        )}

        {/* Event Details Drawer */}
        {selectedAppointment && (
          <EventDetailsDrawer
            appointment={selectedAppointment}
            pets={pets}
            services={services}
            onClose={() => setSelectedAppointment(null)}
          />
        )}
      </main>
  );
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: "blue" | "green" | "red";
}) {
  const colorClasses = {
    blue: active ? "bg-blue-50 text-blue-700 border-blue-200" : "",
    green: active ? "bg-green-50 text-green-700 border-green-200" : "",
    red: active ? "bg-red-50 text-red-700 border-red-200" : "",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
        active
          ? `${colorClasses[color || "blue"]} font-medium`
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      <span className={active ? "" : "text-gray-400"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {active && <CheckCircle className="h-3.5 w-3.5" />}
    </button>
  );
}

function DayView({
  date,
  appointments,
  pets,
  services,
  timeSlots,
  currentTime,
  onTimeSlotClick,
  onDragStart,
  onDrop,
  draggedAppointment,
  onSelectAppointment,
}: {
  date: Date;
  appointments: Appointment[];
  pets: Pet[];
  services: Service[];
  timeSlots: number[];
  currentTime: Date;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onDragStart: (apt: Appointment) => void;
  onDrop: (date: Date, hour: number) => void;
  draggedAppointment: Appointment | null;
  onSelectAppointment: (apt: Appointment) => void;
}) {
  const isToday = isSameDay(date, currentTime);
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const showTimeIndicator =
    isToday &&
    currentHour >= CALENDAR_START_HOUR &&
    currentHour < CALENDAR_END_HOUR;

  const timeIndicatorTop =
    (currentHour - CALENDAR_START_HOUR) * HOUR_HEIGHT +
    (currentMinute / 60) * HOUR_HEIGHT;

  return (
    <div className="relative min-h-full">
      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((hour, index) => (
          <div
            key={hour}
            className={`flex border-b ${
              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
            } ${index === 0 ? "border-t border-gray-200" : "border-gray-200"}`}
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {/* Time label */}
            <div className="w-20 flex-shrink-0 px-4 pt-2 text-right">
              <span className="text-xs font-medium text-gray-500">
                {hour === 12
                  ? "12 PM"
                  : hour > 12
                  ? `${hour - 12} PM`
                  : hour === 0
                  ? "12 AM"
                  : `${hour} AM`}
              </span>
            </div>
            {/* Slot area - clickable */}
            <div
              className={`flex-1 border-l border-gray-200 cursor-pointer transition-colors relative ${
                draggedAppointment
                  ? "hover:bg-blue-50/50"
                  : "hover:bg-gray-100/50"
              }`}
              onClick={() => onTimeSlotClick(date, hour)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(date, hour)}
            >
              {/* 30-minute divider */}
              <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100" />
            </div>
          </div>
        ))}

        {/* Current time indicator */}
        {showTimeIndicator && (
          <div
            className="absolute left-16 right-0 flex items-center z-30 pointer-events-none"
            style={{ top: `${timeIndicatorTop}px` }}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
            <div className="flex-1 h-0.5 bg-red-500" />
          </div>
        )}

        {/* Appointments */}
        {appointments.map((apt) => (
          <AppointmentBlock
            key={apt.id}
            appointment={apt}
            pets={pets}
            services={services}
            onDragStart={onDragStart}
            onClick={onSelectAppointment}
          />
        ))}
      </div>
    </div>
  );
}

function SearchResultsView({
  results,
  pets,
  searchTerm,
  onSelectDate,
  onSelectAppointment,
}: {
  results: Appointment[];
  pets: Pet[];
  searchTerm: string;
  onSelectDate: (date: Date) => void;
  onSelectAppointment: (apt: Appointment) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">No appointments found</p>
        <p className="text-sm text-gray-500">
          No results for "{searchTerm}"
        </p>
      </div>
    );
  }

  // Group by date
  const groupedResults = results.reduce((acc, apt) => {
    const dateKey = format(new Date(apt.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Found <span className="font-semibold text-gray-900">{results.length}</span> appointment
          {results.length !== 1 ? "s" : ""} matching "{searchTerm}"
        </p>
      </div>
      <div className="space-y-8">
        {Object.entries(groupedResults).map(([dateKey, dayAppointments]) => (
          <div key={dateKey}>
            <button
              onClick={() => onSelectDate(new Date(dateKey))}
              className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 hover:text-gray-700 transition-colors"
            >
              {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
            </button>
            <div className="space-y-2">
              {dayAppointments.map((apt) => {
                const aptDate = new Date(apt.date);
                const endDate = new Date(aptDate.getTime() + apt.duration * 60000);

                return (
                  <button
                    key={apt.id}
                    onClick={() => onSelectAppointment(apt)}
                    className="w-full rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md hover:border-gray-300 transition-all text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {apt.pet.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{apt.pet.name}</h4>
                          <p className="text-sm text-gray-600">
                            {apt.pet.client.firstName} {apt.pet.client.lastName}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(aptDate, "h:mm a")} - {format(endDate, "h:mm a")}
                            </span>
                            {apt.service && (
                              <span className="flex items-center gap-1">
                                <Scissors className="h-3 w-3" />
                                {apt.service}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({
  weekDates,
  getAppointmentsForDate,
  pets,
  timeSlots,
  currentTime,
  onTimeSlotClick,
  onDragStart,
  onDrop,
  draggedAppointment,
  onSelectDate,
  onSelectAppointment,
}: {
  weekDates: Date[];
  getAppointmentsForDate: (date: Date) => Appointment[];
  pets: Pet[];
  timeSlots: number[];
  currentTime: Date;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onDragStart: (apt: Appointment) => void;
  onDrop: (date: Date, hour: number) => void;
  draggedAppointment: Appointment | null;
  onSelectDate: (date: Date) => void;
  onSelectAppointment: (apt: Appointment) => void;
}) {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  return (
    <div className="flex flex-col min-h-full">
      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="w-20 flex-shrink-0 border-r border-gray-200" />
        {weekDates.map((date) => {
          const isToday = isSameDay(date, currentTime);
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`flex-1 text-center py-4 border-l border-gray-200 transition-colors ${
                isToday ? "bg-blue-50/50" : "hover:bg-gray-50"
              }`}
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {format(date, "EEE")}
              </div>
              <div
                className={`text-xl font-semibold ${
                  isToday ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {format(date, "d")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="relative flex-1">
        {timeSlots.map((hour, index) => (
          <div
            key={hour}
            className={`flex border-b ${
              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
            } border-gray-200`}
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {/* Time label */}
            <div className="w-20 flex-shrink-0 px-4 pt-2 text-right border-r border-gray-200">
              <span className="text-xs font-medium text-gray-500">
                {hour === 12
                  ? "12 PM"
                  : hour > 12
                  ? `${hour - 12} PM`
                  : `${hour} AM`}
              </span>
            </div>
            {/* Day columns */}
            {weekDates.map((date) => (
              <div
                key={date.toISOString()}
                className={`flex-1 border-l border-gray-200 cursor-pointer transition-colors relative ${
                  draggedAppointment ? "hover:bg-blue-50/50" : "hover:bg-gray-100/50"
                }`}
                onClick={() => onTimeSlotClick(date, hour)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(date, hour)}
              >
                {/* 30-minute divider */}
                <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100" />
              </div>
            ))}
          </div>
        ))}

        {/* Current time indicator */}
        {weekDates.map((date) => {
          const isToday = isSameDay(date, currentTime);
          if (!isToday || currentHour < CALENDAR_START_HOUR || currentHour >= CALENDAR_END_HOUR) {
            return null;
          }
          const dayIndex = weekDates.findIndex((d) => isSameDay(d, date));
          const timeIndicatorTop =
            (currentHour - CALENDAR_START_HOUR) * HOUR_HEIGHT +
            (currentMinute / 60) * HOUR_HEIGHT;

          return (
            <div
              key={`indicator-${date.toISOString()}`}
              className="absolute flex items-center z-30 pointer-events-none"
              style={{
                top: `${timeIndicatorTop}px`,
                left: `calc(5rem + ${(dayIndex / 7) * 100}%)`,
                width: `calc((100% - 5rem) / 7)`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          );
        })}

        {/* Appointments for each day */}
        {weekDates.map((date, dayIndex) => {
          const dayAppointments = getAppointmentsForDate(date);
          return dayAppointments.map((apt) => (
            <WeekAppointmentBlock
              key={apt.id}
              appointment={apt}
              pets={pets}
              dayIndex={dayIndex}
              totalDays={7}
              onDragStart={onDragStart}
              onClick={onSelectAppointment}
            />
          ));
        })}
      </div>
    </div>
  );
}

function AppointmentBlock({
  appointment,
  pets,
  services,
  onDragStart,
  onClick,
}: {
  appointment: Appointment;
  pets: Pet[];
  services: Service[];
  onDragStart: (apt: Appointment) => void;
  onClick: (apt: Appointment) => void;
}) {
  const aptDate = new Date(appointment.date);
  const startHour = aptDate.getHours();
  const startMinute = aptDate.getMinutes();
  const durationHours = appointment.duration / 60;

  // Calculate position
  const top =
    (startHour - CALENDAR_START_HOUR) * HOUR_HEIGHT +
    (startMinute / 60) * HOUR_HEIGHT;
  const height = durationHours * HOUR_HEIGHT;

  // Calculate end time
  const endDate = new Date(aptDate.getTime() + appointment.duration * 60000);

  // Status-based styling with better contrast
  const statusStyles = {
    scheduled: {
      bg: "bg-blue-50",
      border: "border-l-blue-500",
      text: "text-blue-900",
      badge: "bg-blue-100 text-blue-700",
    },
    completed: {
      bg: "bg-green-50",
      border: "border-l-green-500",
      text: "text-green-900",
      badge: "bg-green-100 text-green-700",
    },
    cancelled: {
      bg: "bg-red-50",
      border: "border-l-red-500",
      text: "text-red-900",
      badge: "bg-red-100 text-red-700",
    },
  };

  const style = statusStyles[appointment.status as keyof typeof statusStyles] || statusStyles.scheduled;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(appointment)}
      onClick={() => onClick(appointment)}
      className={`absolute left-20 right-6 ${style.bg} ${style.border} border-l-4 border-r border-t border-b border-gray-200 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-lg transition-all z-10 group`}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 64)}px`,
      }}
    >
      <div className="flex gap-3 h-full">
        {/* Pet Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {appointment.pet.name.substring(0, 2).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm ${style.text} truncate`}>
                {appointment.pet.name}
              </h3>
              <p className="text-xs text-gray-600 truncate">
                {appointment.pet.client.firstName} {appointment.pet.client.lastName}
              </p>
            </div>
            <StatusBadge status={appointment.status} size="sm" />
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{format(aptDate, "h:mm a")}</span>
            <span className="text-gray-400">-</span>
            <span>{format(endDate, "h:mm a")}</span>
          </div>

          {appointment.service && height > 80 && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-700">
              <Scissors className="h-3 w-3" />
              <span className="truncate">{appointment.service}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeekAppointmentBlock({
  appointment,
  pets,
  dayIndex,
  totalDays,
  onDragStart,
  onClick,
}: {
  appointment: Appointment;
  pets: Pet[];
  dayIndex: number;
  totalDays: number;
  onDragStart: (apt: Appointment) => void;
  onClick: (apt: Appointment) => void;
}) {
  const aptDate = new Date(appointment.date);
  const startHour = aptDate.getHours();
  const startMinute = aptDate.getMinutes();
  const durationHours = appointment.duration / 60;

  // Calculate position
  const top =
    (startHour - CALENDAR_START_HOUR) * HOUR_HEIGHT +
    (startMinute / 60) * HOUR_HEIGHT;
  const height = durationHours * HOUR_HEIGHT;

  // Status-based styling
  const statusStyles = {
    scheduled: "bg-blue-500 text-white",
    completed: "bg-green-500 text-white",
    cancelled: "bg-red-500 text-white",
  };

  const style = statusStyles[appointment.status as keyof typeof statusStyles] || statusStyles.scheduled;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(appointment)}
      onClick={() => onClick(appointment)}
      className={`absolute ${style} rounded-md px-2 py-1.5 text-xs font-medium cursor-pointer hover:shadow-lg hover:z-20 transition-all z-10 overflow-hidden`}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 40)}px`,
        left: `calc(5rem + ${dayIndex} * (100% - 5rem) / ${totalDays} + 2px)`,
        width: `calc((100% - 5rem) / ${totalDays} - 4px)`,
      }}
    >
      <div className="font-semibold truncate leading-tight">{appointment.pet.name}</div>
      <div className="opacity-90 truncate leading-tight text-xs">
        {format(aptDate, "h:mm a")}
      </div>
    </div>
  );
}

function StatusBadge({ status, size = "default" }: { status: string; size?: "sm" | "default" }) {
  const statusConfig = {
    scheduled: {
      label: "Scheduled",
      icon: <Clock className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />,
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    completed: {
      label: "Completed",
      icon: <CheckCircle className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />,
      className: "bg-green-100 text-green-700 border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      icon: <XCircle className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />,
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses} rounded-full font-medium border ${config.className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

function EventDetailsDrawer({
  appointment,
  pets,
  services,
  onClose,
}: {
  appointment: Appointment;
  pets: Pet[];
  services: Service[];
  onClose: () => void;
}) {
  const aptDate = new Date(appointment.date);
  const endDate = new Date(aptDate.getTime() + appointment.duration * 60000);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {appointment.pet.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-semibold">{appointment.pet.name}</SheetTitle>
              <SheetDescription className="text-sm text-gray-600 mt-1">
                {appointment.pet.client.firstName} {appointment.pet.client.lastName}
              </SheetDescription>
            </div>
          </div>
          <div className="mt-4">
            <StatusBadge status={appointment.status} />
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Date & Time */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Date & Time
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {format(aptDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {format(aptDate, "h:mm a")} - {format(endDate, "h:mm a")}
                </span>
                <span className="text-gray-500">({appointment.duration} min)</span>
              </div>
            </div>
          </div>

          {/* Service */}
          {appointment.service && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Service
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <Scissors className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">{appointment.service}</span>
              </div>
            </div>
          )}

          {/* Client Contact */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Client Contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {appointment.pet.client.firstName} {appointment.pet.client.lastName}
                </span>
              </div>
              {appointment.pet.client.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${appointment.pet.client.phone}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {appointment.pet.client.phone}
                  </a>
                </div>
              )}
              {appointment.pet.client.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${appointment.pet.client.email}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline truncate"
                  >
                    {appointment.pet.client.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 space-y-2">
            <EditAppointmentDialog appointment={appointment} pets={pets} services={services} />
            <div className="flex gap-2">
              <QuickStatusButton appointment={appointment} status="scheduled" />
              <QuickStatusButton appointment={appointment} status="completed" />
              <QuickStatusButton appointment={appointment} status="cancelled" />
            </div>
            <DeleteAppointmentDialog appointment={appointment} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QuickStatusButton({ appointment, status }: { appointment: Appointment; status: string }) {
  if (appointment.status === status) return null;

  const statusConfig = {
    scheduled: { label: "Mark Scheduled", icon: Clock, color: "blue" },
    completed: { label: "Mark Completed", icon: CheckCircle, color: "green" },
    cancelled: { label: "Mark Cancelled", icon: XCircle, color: "red" },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const Icon = config.icon;

  async function handleStatusChange() {
    try {
      await updateAppointmentStatus(appointment.id, status);
      toast.success(`Appointment marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStatusChange}
      className="flex-1 h-9 text-xs border-gray-300"
    >
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {config.label.replace("Mark ", "")}
    </Button>
  );
}

function QuickAddDialog({
  pets,
  services,
  date,
  hour,
  onClose,
}: {
  pets: Pet[];
  services: Service[];
  date: Date;
  hour: number;
  onClose: () => void;
}) {
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
      onClose();
      toast.success("Appointment booked successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to book appointment";
      toast.error(message);
    }
  }

  const timeString = `${hour.toString().padStart(2, "0")}:00`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Book Appointment</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {format(date, "EEEE, MMMM d")} at {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pet *</Label>
            <SearchableSelect
              options={petOptions}
              value={selectedPetId}
              onValueChange={setSelectedPetId}
              placeholder="Search for a pet..."
              searchPlaceholder="Type pet name or owner..."
              emptyMessage="No pets found."
            />
          </div>
          <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />
          <input type="hidden" name="time" value={timeString} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-duration" className="text-sm font-medium">
                Duration (min)
              </Label>
              <Input
                id="quick-duration"
                name="duration"
                type="number"
                defaultValue={60}
                min="15"
                step="15"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-service" className="text-sm font-medium">
                Service
              </Label>
              <select
                id="quick-service"
                name="service"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <Label htmlFor="quick-notes" className="text-sm font-medium">
              Notes
            </Label>
            <textarea
              id="quick-notes"
              name="notes"
              rows={3}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9">
              Cancel
            </Button>
            <Button type="submit" className="h-9 bg-blue-600 hover:bg-blue-700">
              Book Appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddAppointmentDialog({
  pets,
  services,
  selectedDate,
}: {
  pets: Pet[];
  services: Service[];
  selectedDate: Date;
}) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to book appointment";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedPetId("");
    }}>
      <DialogTrigger asChild>
        <Button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Book New Appointment</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Schedule an appointment for a pet.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pet *</Label>
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
              <Label htmlFor="date" className="text-sm font-medium">
                Date *
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={format(selectedDate, "yyyy-MM-dd")}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">
                Time *
              </Label>
              <Input id="time" name="time" type="time" required className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Duration (min)
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                defaultValue={60}
                min="15"
                step="15"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service" className="text-sm font-medium">
                Service
              </Label>
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
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-9 bg-blue-600 hover:bg-blue-700">
              Book Appointment
            </Button>
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
        <Button variant="outline" className="w-full justify-start h-9 font-medium">
          <Pencil className="h-3.5 w-3.5 mr-2" />
          Edit Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit Appointment</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Update the appointment details below.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pet *</Label>
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
              <Label htmlFor="edit-date" className="text-sm font-medium">
                Date *
              </Label>
              <Input
                id="edit-date"
                name="date"
                type="date"
                defaultValue={format(appointmentDate, "yyyy-MM-dd")}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time" className="text-sm font-medium">
                Time *
              </Label>
              <Input
                id="edit-time"
                name="time"
                type="time"
                defaultValue={format(appointmentDate, "HH:mm")}
                required
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-duration" className="text-sm font-medium">
                Duration (min)
              </Label>
              <Input
                id="edit-duration"
                name="duration"
                type="number"
                defaultValue={appointment.duration}
                min="15"
                step="15"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-service" className="text-sm font-medium">
                Service
              </Label>
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
            <Label htmlFor="edit-status" className="text-sm font-medium">
              Status
            </Label>
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
            <Label htmlFor="edit-notes" className="text-sm font-medium">
              Notes
            </Label>
            <textarea
              id="edit-notes"
              name="notes"
              rows={3}
              defaultValue={appointment.notes || ""}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-9 bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAppointmentDialog({
  appointment,
}: {
  appointment: Appointment;
}) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteAppointment(appointment.id);
      setOpen(false);
      toast.success("Appointment deleted successfully");
    } catch {
      toast.error("Failed to delete appointment");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start h-9 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete Appointment
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">Delete Appointment</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600">
            Are you sure you want to delete this appointment for{" "}
            <span className="font-semibold text-gray-900">{appointment.pet.name}</span> on{" "}
            <span className="font-semibold text-gray-900">
              {format(new Date(appointment.date), "MMMM d, yyyy")}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="h-9 bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
