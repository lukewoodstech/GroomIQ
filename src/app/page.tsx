import { getAppointments, getPets } from "./actions/appointments";
import { getActiveServices } from "./actions/services";
import { CalendarPageContent } from "./calendar-components";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  try {
    const appointments = await getAppointments();
    const pets = await getPets();
    const services = await getActiveServices();

    return <CalendarPageContent appointments={appointments} pets={pets} services={services} />;
  } catch (error) {
    console.error('Error loading calendar page:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Error Loading Calendar</h1>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
        <p className="text-sm text-gray-500">
          Check the server logs for more details
        </p>
      </div>
    );
  }
}
