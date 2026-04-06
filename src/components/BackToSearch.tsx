import { useNavigate } from "react-router-dom";

export default function BackToSearch() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
    >
      <span>&larr;</span>
      <span>New search</span>
    </button>
  );
}
