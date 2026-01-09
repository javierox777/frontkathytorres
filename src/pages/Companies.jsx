import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { Link } from "react-router-dom";

export default function Companies() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/companies");
        setList(data);
      } catch (e) {
        console.error("Error al cargar empresas", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Empresas</h1>
      <ul className="space-y-2">
        {list.map((c) => (
          <li
            key={c._id}
            className="p-3 rounded-xl bg-white/5 flex items-center justify-between"
          >
           <div>
  <p className="font-semibold">{c.name}</p>
  <p className="text-sm text-white/70">{c.email}</p>
  {c.workers?.length > 0 && (
    <p className="text-sm text-emerald-300">
      Cliente: {c.workers[0].email}
    </p>
  )}
  <p className="text-xs text-white/50">
    Creada: {new Date(c.createdAt).toLocaleDateString()}
  </p>
</div>


            {/* 👉 Botón cambiar contraseña */}
            <Link
              to={`/companies/${c._id}/password`}
              className="text-sm px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Cambiar contraseña
            </Link>
          </li>
        ))}
      </ul>

      {list.length === 0 && (
        <p className="text-white/60">
          No hay empresas registradas.{" "}
          <Link to="/companies/new" className="underline">
            Crea la primera
          </Link>.
        </p>
      )}
    </div>
  );
}
