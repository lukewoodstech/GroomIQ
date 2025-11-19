import { getAppointments, getPets } from "./actions/appointments";
import { CalendarPageContent } from "./calendar-components";

export default async function Home() {
  const appointments = await getAppointments();
  const pets = await getPets();

  return <CalendarPageContent appointments={appointments} pets={pets} />;
}
