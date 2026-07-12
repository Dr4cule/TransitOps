import Papa from "papaparse";
import { getSession } from "@/lib/session";
import { loadDataset, canExport, datasetDomain } from "@/lib/queries/export";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params;

  // Auth
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Valid dataset?
  if (!datasetDomain(dataset)) {
    return new Response("Unknown dataset", { status: 404 });
  }

  // RBAC — role must have at least view access to the governing domain.
  if (!canExport(session.role, dataset)) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await loadDataset(dataset);
  const csv = Papa.unparse(rows, { header: true });
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transitops-${dataset}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
