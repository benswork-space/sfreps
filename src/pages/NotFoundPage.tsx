import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <h1 className="text-4xl font-bold text-zinc-900 mb-2">Not Found</h1>
      <p className="text-zinc-500 mb-6 text-center max-w-sm">
        We couldn&apos;t find that page. Try entering a San Francisco ZIP code to find your supervisor.
      </p>
      <Link to="/" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
        Go to SFReps
      </Link>
    </div>
  );
}
