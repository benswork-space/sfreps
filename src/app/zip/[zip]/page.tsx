import { redirect, notFound } from "next/navigation";
import { lookupZip, getZipLookup } from "@/lib/data";

interface PageProps {
  params: Promise<{ zip: string }>;
}

export function generateStaticParams() {
  const zipLookup = getZipLookup();
  const zips = new Set(zipLookup.map((e) => e.zip));
  return Array.from(zips).map((zip) => ({ zip }));
}

export default async function ZipPage({ params }: PageProps) {
  const { zip } = await params;
  const result = lookupZip(zip);

  if (!result) notFound();

  redirect(`/zip/${zip}/${result.supervisorId}`);
}
