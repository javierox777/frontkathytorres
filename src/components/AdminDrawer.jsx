import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function AdminDrawer() {
  const [open, setOpen] = useState(true);

  const itemCls = (isActive) =>
    `px-3 py-2 rounded-xl ${isActive ? "bg-white/20" : "hover:bg-white/10"}`;

  return (
    <aside
      className={`transition-all duration-300 ${
        open ? "w-64" : "w-16"
      } bg-black/30 backdrop-blur-sm rounded-3xl p-3 h-full sticky top-6`}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full mb-3 px-3 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/20"
        title={open ? "Contraer" : "Expandir"}
      >
        {open ? "← Ocultar" : "→"}
      </button>

      <nav className="flex flex-col gap-2">
        {/* Empresas */}
        <div className="text-xs uppercase tracking-wide text-white/50 px-2 mt-1">
          {open ? "Empresas" : "🏢"}
        </div>

        <NavLink to="/companies/new" className={({ isActive }) => itemCls(isActive)}>
          {open ? "➕ Crear empresa" : "➕"}
        </NavLink>

        <NavLink to="/companies" className={({ isActive }) => itemCls(isActive)}>
          {open ? "📄 Ver empresas" : "📄"}
        </NavLink>

        {/* Separador */}
        <div className="h-px my-3 bg-white/10" />

        {/* Informe Psicosensotécnico */}
        <div className="text-xs uppercase tracking-wide text-white/50 px-2">
          {open ? "Informe Psicosensotécnico" : "🧠"}
        </div>

        <NavLink to="/reports" className={({ isActive }) => itemCls(isActive)}>
          {open ? "📚 Listar informes" : "📚"}
        </NavLink>

        <NavLink
          to="/reports/new/rigorous"
          className={({ isActive }) => itemCls(isActive)}
        >
          {open ? "🟪 Nuevo riguroso" : "🟪"}
        </NavLink>

        <NavLink
          to="/reports/new/basic"
          className={({ isActive }) => itemCls(isActive)}
        >
          {open ? "🟦 Nuevo básico" : "🟦"}
        </NavLink>
      </nav>
    </aside>
  );
}
