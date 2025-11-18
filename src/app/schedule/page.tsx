import { getAppointments, getPets } from "../actions/appointments";
import { SchedulePageContent } from "./client-components";

export default async function SchedulePage() {
  const appointments = await getAppointments();
  const pets = await getPets();

  return <SchedulePageContent appointments={appointments} pets={pets} />;
}
