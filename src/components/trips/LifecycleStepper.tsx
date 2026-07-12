const STEPS = ["Draft", "Dispatched", "Completed"] as const;

/** Trip lifecycle stepper — Draft → Dispatched → Completed (Cancelled branches off). */
export function LifecycleStepper() {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 border-[3px] border-ink bg-panel-3 rounded-[4px]" />
            <span className="label !text-[10px]">{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className="h-1 w-8 bg-ink -mt-4" />}
        </div>
      ))}
      <div className="ml-3 flex flex-col items-center gap-1">
        <div className="h-6 w-6 border-[3px] border-ink bg-st-red/40 rounded-[4px]" />
        <span className="label !text-[10px]">Cancelled</span>
      </div>
    </div>
  );
}
