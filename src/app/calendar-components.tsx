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

// Calendar hours from 7 AM to 9 PM
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 21;
const HOUR_HEIGHT = 80; // pixels per hour

export function CalendarPageContent({
  appointments,
  pets,
}: {
  appointments: Appointment[];
  pets: Pet[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [quickAddTime, setQuickAddTime] = useState<{ date: Date; hour: number } | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);

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

  // Filter appointments based on view mode
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      const matchesDate = isSameDay(aptDate, date);

      if (!searchTerm) return matchesDate;

      const searchLower = searchTerm.toLowerCase();
      return (
        matchesDate &&
        (apt.pet.name.toLowerCase().includes(searchLower) ||
          apt.pet.client.firstName.toLowerCase().includes(searchLower) ||
          apt.pet.client.lastName.toLowerCase().includes(searchLower) ||
          apt.service?.toLowerCase().includes(searchLower))
      );
    });
  };

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

  // Calculate current time indicator position
  const now = currentTime;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 w-full bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Right side - Date/Time display */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {format(currentTime, "MMM d, h:mm a")}
          </div>
        </div>
      </header>

      {/* Calendar Controls */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="font-medium"
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[200px] text-center">
              {viewMode === "day"
                ? format(selectedDate, "MMM d, EEE, yyyy")
                : `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}`}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters and Add Button */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Scissors className="h-4 w-4" />
              Grooming
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setViewMode("day")}
            >
              <CalendarIcon className="h-4 w-4" />
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setViewMode("week")}
            >
              <CalendarIcon className="h-4 w-4" />
              Week
            </Button>
            <AddAppointmentDialog pets={pets} selectedDate={selectedDate} />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewMode === "day" ? (
          <DayView
            date={selectedDate}
            appointments={getAppointmentsForDate(selectedDate)}
            pets={pets}
            timeSlots={timeSlots}
            currentTime={currentTime}
            onTimeSlotClick={handleTimeSlotClick}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            draggedAppointment={draggedAppointment}
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
          />
        )}
      </div>

      {/* Quick Add Dialog */}
      {quickAddTime && (
        <QuickAddDialog
          pets={pets}
          date={quickAddTime.date}
          hour={quickAddTime.hour}
          onClose={() => setQuickAddTime(null)}
        />
      )}
    </main>
  );
}

function DayView({
  date,
  appointments,
  pets,
  timeSlots,
  currentTime,
  onTimeSlotClick,
  onDragStart,
  onDrop,
  draggedAppointment,
}: {
  date: Date;
  appointments: Appointment[];
  pets: Pet[];
  timeSlots: number[];
  currentTime: Date;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onDragStart: (apt: Appointment) => void;
  onDrop: (date: Date, hour: number) => void;
  draggedAppointment: Appointment | null;
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
        {timeSlots.map((hour) => (
          <div
            key={hour}
            className="flex border-b border-gray-200"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {/* Time label */}
            <div className="w-20 flex-shrink-0 pr-3 pt-0 text-right text-xs text-muted-foreground -mt-2">
              {hour === 12
                ? "12 PM"
                : hour > 12
                ? `${hour - 12} PM`
                : `${hour} AM`}
            </div>
            {/* Slot area - clickable */}
            <div
              className={`flex-1 border-l border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
                draggedAppointment ? "hover:bg-blue-50" : ""
              }`}
              onClick={() => onTimeSlotClick(date, hour)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(date, hour)}
            />
          </div>
        ))}

        {/* Current time indicator */}
        {showTimeIndicator && (
          <div
            className="absolute left-16 right-0 flex items-center z-20 pointer-events-none"
            style={{ top: `${timeIndicatorTop}px` }}
          >
            <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {format(currentTime, "h:mm")}
            </div>
            <div className="flex-1 h-0.5 bg-red-500" />
          </div>
        )}

        {/* Appointments */}
        {appointments.map((apt) => (
          <AppointmentBlock
            key={apt.id}
            appointment={apt}
            pets={pets}
            onDragStart={onDragStart}
          />
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
}) {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  return (
    <div className="flex flex-col min-h-full">
      {/* Day headers */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        <div className="w-20 flex-shrink-0" />
        {weekDates.map((date) => {
          const isToday = isSameDay(date, currentTime);
          return (
            <div
              key={date.toISOString()}
              className={`flex-1 text-center py-3 border-l cursor-pointer hover:bg-gray-50 ${
                isToday ? "bg-blue-50" : ""
              }`}
              onClick={() => onSelectDate(date)}
            >
              <div className="text-xs text-muted-foreground">
                {format(date, "EEE")}
              </div>
              <div className={`text-lg font-semibold ${isToday ? "text-blue-600" : ""}`}>
                {format(date, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="relative flex-1">
        {timeSlots.map((hour) => (
          <div
            key={hour}
            className="flex border-b border-gray-200"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {/* Time label */}
            <div className="w-20 flex-shrink-0 pr-3 pt-0 text-right text-xs text-muted-foreground -mt-2">
              {hour === 12
                ? "12 PM"
                : hour > 12
                ? `${hour - 12} PM`
                : `${hour} AM`}
            </div>
            {/* Day columns */}
            {weekDates.map((date) => (
              <div
                key={date.toISOString()}
                className={`flex-1 border-l border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
                  draggedAppointment ? "hover:bg-blue-50" : ""
                }`}
                onClick={() => onTimeSlotClick(date, hour)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(date, hour)}
              />
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
              className="absolute h-0.5 bg-red-500 z-20 pointer-events-none"
              style={{
                top: `${timeIndicatorTop}px`,
                left: `calc(5rem + ${(dayIndex / 7) * 100}% * (7/7))`,
                width: `calc(100% / 7)`,
                marginLeft: `calc(${dayIndex} * (100% - 5rem) / 7)`,
              }}
            />
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
  onDragStart,
}: {
  appointment: Appointment;
  pets: Pet[];
  onDragStart: (apt: Appointment) => void;
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

  // Color based on status
  const bgColor =
    appointment.status === "completed"
      ? "bg-gray-100 border-gray-300"
      : appointment.status === "cancelled"
      ? "bg-red-50 border-red-200"
      : "bg-emerald-50 border-emerald-200";

  const borderColor =
    appointment.status === "cancelled"
      ? "#ef4444"
      : appointment.status === "completed"
      ? "#9ca3af"
      : "#10b981";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(appointment)}
      className={`absolute left-20 right-4 rounded-lg border-l-4 ${bgColor} p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow z-10`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: "60px",
        borderLeftColor: borderColor,
      }}
    >
      <div className="flex justify-between items-start h-full">
        <div className="overflow-hidden flex-1">
          <h3 className="font-semibold text-sm truncate">{appointment.pet.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {appointment.pet.client.firstName} {appointment.pet.client.lastName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(aptDate, "h:mm a")} - {format(endDate, "h:mm a")}
          </p>
          {appointment.service && (
            <p className="text-xs font-medium mt-1">{appointment.service}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Quick Actions */}
          {appointment.pet.client.phone && (
            <a
              href={`tel:${appointment.pet.client.phone}`}
              className="p-1 hover:bg-black/5 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3 text-muted-foreground" />
            </a>
          )}
          {appointment.pet.client.email && (
            <a
              href={`mailto:${appointment.pet.client.email}`}
              className="p-1 hover:bg-black/5 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3 text-muted-foreground" />
            </a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <StatusMenuItem appointment={appointment} status="scheduled" />
              <StatusMenuItem appointment={appointment} status="completed" />
              <StatusMenuItem appointment={appointment} status="cancelled" />
              <DropdownMenuSeparator />
              <EditAppointmentDialog appointment={appointment} pets={pets} />
              <DeleteAppointmentDialog appointment={appointment} />
            </DropdownMenuContent>
          </DropdownMenu>
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
}: {
  appointment: Appointment;
  pets: Pet[];
  dayIndex: number;
  totalDays: number;
  onDragStart: (apt: Appointment) => void;
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

  // Color based on status
  const bgColor =
    appointment.status === "completed"
      ? "bg-gray-100"
      : appointment.status === "cancelled"
      ? "bg-red-50"
      : "bg-emerald-100";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(appointment)}
      className={`absolute ${bgColor} rounded p-1 text-xs cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow z-10 overflow-hidden`}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 20)}px`,
        left: `calc(5rem + ${dayIndex} * (100% - 5rem) / ${totalDays} + 2px)`,
        width: `calc((100% - 5rem) / ${totalDays} - 4px)`,
      }}
    >
      <div className="font-medium truncate">{appointment.pet.name}</div>
      {height > 30 && (
        <div className="text-muted-foreground truncate">
          {format(aptDate, "h:mm a")}
        </div>
      )}
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
    } catch {
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

function QuickAddDialog({
  pets,
  date,
  hour,
  onClose,
}: {
  pets: Pet[];
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
    } catch {
      toast.error("Failed to book appointment");
    }
  }

  const timeString = `${hour.toString().padStart(2, "0")}:00`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            {format(date, "EEEE, MMMM d")} at {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
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
          <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />
          <input type="hidden" name="time" value={timeString} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-duration">Duration (minutes)</Label>
              <Input
                id="quick-duration"
                name="duration"
                type="number"
                defaultValue={60}
                min="15"
                step="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-service">Service</Label>
              <select
                id="quick-service"
                name="service"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <Label htmlFor="quick-notes">Notes</Label>
            <textarea
              id="quick-notes"
              name="notes"
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Book</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddAppointmentDialog({
  pets,
  selectedDate,
}: {
  pets: Pet[];
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
        <Button className="bg-red-500 hover:bg-red-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          Add
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
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={format(selectedDate, "yyyy-MM-dd")}
                required
              />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
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
}: {
  appointment: Appointment;
  pets: Pet[];
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
                <option value="Full Groom">Full Groom</option>
                <option value="Bath">Bath</option>
                <option value="Nail Trim">Nail Trim</option>
                <option value="Haircut">Haircut</option>
                <option value="Other">Other</option>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
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
