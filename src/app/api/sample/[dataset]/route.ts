import { getSession } from "@/lib/session";
import { sampleCsv, type ImportDataset } from "@/lib/queries/import";

const VALID = new Set(["vehicles", "drivers", "fuel", "expenses"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params;
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!VALID.has(dataset)) return new Response("Unknown dataset", { status: 404 });

  const csv = sampleCsv(dataset as ImportDataset);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transitops-${dataset}-sample.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
