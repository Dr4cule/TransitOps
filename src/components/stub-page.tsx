import { BrutalCard } from "@/components/ui/brutal-card";

export function StubPage({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-fg">{title}</h1>
      <BrutalCard className="p-8">
        <div className="flex flex-col items-start gap-3">
          <span className="border-2 border-ink bg-brand rounded-[4px] px-3 py-1 text-sm font-bold text-ink shadow-brutal-sm">
            COMING SOON
          </span>
          <p className="max-w-lg text-fg-dim">{blurb}</p>
        </div>
      </BrutalCard>
    </div>
  );
}
