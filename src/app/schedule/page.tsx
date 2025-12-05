import { getAppointments, getPets } from "../actions/appointments";
import { getActiveServices } from "../actions/services";
import { SchedulePageContent } from "./client-components";
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SchedulePage() {
  noStore();

  const appointments = await getAppointments();
  const pets = await getPets();
  const services = await getActiveServices();

  return <SchedulePageContent appointments={appointments} pets={pets} services={services} />;
}
