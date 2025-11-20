import { getAppointments, getPets } from "../actions/appointments";
import { getActiveServices } from "../actions/services";
import { SchedulePageContent } from "./client-components";

export default async function SchedulePage() {
  const appointments = await getAppointments();
  const pets = await getPets();
  const services = await getActiveServices();

  return <SchedulePageContent appointments={appointments} pets={pets} services={services} />;
}
