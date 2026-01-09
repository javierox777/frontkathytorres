import { useAuth } from "../context/AuthContext.jsx";
import AdminDrawer from "../components/AdminDrawer.jsx";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className={`grid gap-6 ${isAdmin ? "md:grid-cols-[auto,1fr]" : "md:grid-cols-3"}`}>
      {/* Drawer sólo si es admin */}
      {isAdmin && (
        <div className="md:sticky md:top-6 self-start">
          <AdminDrawer />
        </div>
      )}

      {/* Contenido del dashboard */}
      <div className={`grid gap-6 ${isAdmin ? "md:grid-cols-2" : "md:col-span-3 grid-cols-1 md:grid-cols-3"}`}>
        <div className="glass rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-2">Bienvenida</h2>
          <p className="text-white/80">
            Hola <b>{user?.name}</b>, rol <b>{user?.role}</b>.
          </p>
        </div>

        <div className="glass rounded-3xl p-6">
          <h3 className="font-semibold mb-1">Tu email</h3>
          <p className="text-white/80 break-all">{user?.email}</p>
        </div>

        <div className="glass rounded-3xl p-6">
          <h3 className="font-semibold mb-1">Acciones</h3>
          <ul className="list-disc list-inside text-white/80 text-sm">
            {isAdmin ? (
              <>
                <li>Administrar clientes</li>
                <li>Crear y firmar informes</li>
                <li>Exportar PDF con firma y logo</li>
              </>
            ) : (
              <>
                <li>Ver historial de informes de tu empresa</li>
                <li>Exportar PDF de informes</li>
              </>
            )}
          </ul>

          {!isAdmin && (
            <div className="mt-4">
              <Link to="/client/reports" className="btn-primary w-auto">
                Ver mis informes
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
