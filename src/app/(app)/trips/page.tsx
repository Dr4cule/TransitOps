import { requireAccess } from "@/lib/rbac";
import {
  dispatchableVehicles,
  dispatchableDrivers,
  listTrips,
} from "@/modules/trips/trip.repository";
import { CreateTripForm } from "@/components/trips/TripForm";
import { LiveBoard, type BoardTrip } from "@/components/trips/LiveBoard";
import { LifecycleStepper } from "@/components/trips/LifecycleStepper";

export default async function TripsPage() {
  const { access, session } = await requireAccess("trips", "view");
  const canManage = access === "crud"; // DRIVER

  const [vehicles, drivers, trips] = await Promise.all([
    canManage ? dispatchableVehicles(session.companyId) : Promise.resolve([]),
    canManage ? dispatchableDrivers(session.companyId) : Promise.resolve([]),
    listTrips(session.companyId),
  ]);

  const board: BoardTrip[] = trips.map((t) => ({
    id: t.id,
    code: "TR-" + t.id.slice(-5).toUpperCase(),
    source: t.source,
    destination: t.destination,
    vehicle: t.vehicle.name,
    driver: t.driver.name,
    status: t.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-fg">Trip Dispatcher</h1>
        <LifecycleStepper />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          {canManage ? (
            <CreateTripForm
              vehicles={vehicles.map((v) => ({
                id: v.id,
                name: v.name,
                maxLoadCapacityKg: Number(v.maxLoadCapacityKg),
              }))}
              drivers={drivers.map((d) => ({ id: d.id, name: d.name }))}
            />
          ) : (
            <div className="border-[3px] border-ink bg-panel-2 shadow-brutal rounded-[4px] p-5 text-fg-dim">
              You have read-only access to the trip board.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="label">Live Board</div>
          <LiveBoard trips={board} canManage={canManage} />
        </div>
      </div>

      <p className="label">
        On dispatch: vehicle &amp; driver → On Trip · On complete: odometer + fuel logged, both → Available.
      </p>
    </div>
  );
}
