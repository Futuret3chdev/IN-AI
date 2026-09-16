import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listReports } from "@/lib/agent/store";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const reports = await listReports(user.id);
  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      sources: JSON.parse(r.sources_json || "[]"),
    })),
  });
}
