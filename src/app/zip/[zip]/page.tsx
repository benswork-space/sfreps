import { redirect, notFound } from "next/navigation";
import { lookupZip } from "@/lib/data";

interface PageProps {
  params: Promise<{ zip: string }>;
}

export default async function ZipPage({ params }: PageProps) {
  const { zip } = await params;
  const result = lookupZip(zip);

  if (!result) notFound();

  redirect(`/zip/${zip}/${result.supervisorId}`);
}
