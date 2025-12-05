import { getAppointments, getPets } from "./actions/appointments";
import { getActiveServices } from "./actions/services";
import { CalendarPageContent } from "./calendar-components";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const appointments = await getAppointments();
  const pets = await getPets();
  const services = await getActiveServices();

  return <CalendarPageContent appointments={appointments} pets={pets} services={services} />;
}
