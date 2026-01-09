import { useState } from "react";
import { api } from "../services/api.js";
import { useNavigate, Link } from "react-router-dom";

export default function AdminUserNew() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name")?.toString().trim();
    const email = form.get("email")?.toString().trim();
    const password = form.get("password")?.toString();
    const role = form.get("role")?.toString() || "client";

    if (!name || !email || !password) {
      setErr("Completa todos los campos"); setLoading(false); return;
    }

    try {
      await api.post("/admin/users", { name, email, password, role });
      setMsg(`Usuario creado como ${role}.`);
      setTimeout(() => nav("/admin", { replace: true }), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">Crear usuario (admin)</h1>

      {err && <p className="text-red-300 text-sm">{err}</p>}
      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input name="name" type="text" className="input" placeholder="Nombre" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input name="email" type="email" className="input" placeholder="email@dominio.com" />
        </div>
        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input name="password" type="password" className="input" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm mb-1">Rol</label>
          <select name="role" className="input" defaultValue="client">
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button className="btn-primary" disabled={loading}>
            {loading ? "Creando..." : "Crear usuario"}
          </button>
          <Link to="/admin" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
