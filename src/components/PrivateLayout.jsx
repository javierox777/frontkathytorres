import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const linkClass = ({ isActive }) =>
    "px-3 py-2 rounded-lg text-sm transition border " +
    (isActive
      ? "bg-white/10 text-white border-white/20"
      : "text-white/80 border-transparent hover:bg-white/5 hover:text-white");

  return (
    <div className="min-h-screen text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Fila principal */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            {/* Logo (desde /public) */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo_kyd.png"
                alt="K&D Consultores Psicolaborales"
                className="h-20 w-auto"
                loading="eager"
                decoding="async"
              />
              <span className="sr-only">KATY App</span>
            </Link>

            {/* Menú principal */}
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={linkClass}>Inicio</NavLink>
              {user?.role === "admin" ? (
                <>
                  <NavLink to="/reports" className={linkClass}>Informes</NavLink>
                  <NavLink to="/workorders" className={linkClass}>Órdenes (legacy)</NavLink>
                  <NavLink to="/admin" className={linkClass}>Admin</NavLink>
                </>
              ) : (
                <NavLink to="/client/reports" className={linkClass}>Mis informes</NavLink>
              )}
            </nav>

            {/* Usuario */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/80">
                {user?.name} · <span className="chip">{user?.role}</span>
              </div>
              <button onClick={logout} className="btn-primary w-auto px-3 py-2 rounded-xl">
                Salir
              </button>
            </div>
          </div>

          {/* Sub-nav contextual para Órdenes */}
          {user?.role === "admin" && pathname.startsWith("/workorders") && (
            <div className="pb-3">
              <div className="flex items-center gap-2">
                <NavLink to="/workorders" end className={linkClass}>Listado</NavLink>
                <NavLink to="/workorders/new" className={linkClass}>Crear orden</NavLink>
              </div>
            </div>
          )}

          {/* Sub-nav para portal cliente */}
          {user?.role === "client" && pathname.startsWith("/client/reports") && (
            <div className="pb-3">
              <div className="flex items-center gap-2">
                <NavLink to="/client/reports" end className={linkClass}>Listado</NavLink>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
