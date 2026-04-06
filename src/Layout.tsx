import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-900">
      <Outlet />
    </div>
  );
}
