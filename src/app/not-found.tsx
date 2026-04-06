import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Not Found</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-sm">
        We couldn&apos;t find that page. Try entering a San Francisco ZIP code to find your supervisor.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        Go to SFReps
      </Link>
    </div>
  );
}
