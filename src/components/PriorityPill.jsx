
  // PriorityPill.jsx
  export default function PriorityPill({ value }) {
    const map = {
      low: "bg-slate-500/20 text-slate-200 border border-slate-500/30",
      medium: "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30",
      high: "bg-orange-500/20 text-orange-200 border border-orange-500/30",
      urgent: "bg-red-500/20 text-red-200 border border-red-500/30",
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs ${map[value] || "bg-white/10 text-white"}`}>{value}</span>;
  }
  