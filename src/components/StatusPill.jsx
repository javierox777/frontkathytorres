// StatusPill.jsx
export default function StatusPill({ value }) {
    const map = {
      draft: "bg-slate-500/20 text-slate-200 border border-slate-500/30",
      open: "bg-blue-500/20 text-blue-200 border border-blue-500/30",
      in_progress: "bg-amber-500/20 text-amber-200 border border-amber-500/30",
      on_hold: "bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30",
      completed: "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30",
      canceled: "bg-rose-500/20 text-rose-200 border border-rose-500/30",
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs ${map[value] || "bg-white/10 text-white"}`}>{value}</span>;
  }
  