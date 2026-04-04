import { NextResponse } from "next/server";
import { resolveZip } from "@/lib/zipLookup";
import { getSupervisor } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ zip: string }> }
) {
  const { zip } = await params;

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Invalid ZIP code. Must be 5 digits." }, { status: 400 });
  }

  const result = await resolveZip(zip);
  if (!result) {
    return NextResponse.json(
      { error: "ZIP code not found. Please enter a San Francisco ZIP code (94xxx)." },
      { status: 404 }
    );
  }

  const supervisor = getSupervisor(result.supervisorId);

  return NextResponse.json({
    ...result,
    supervisorName: supervisor?.name ?? "Your Supervisor",
    photoUrl: supervisor?.photo_url ?? null,
  });
}
