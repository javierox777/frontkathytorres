import { useState } from "react";
import { api } from "../services/api.js";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
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
      await api.post("/auth/signup", { name, email, password, role });
      setMsg("Cuenta creada ✨ Ahora inicia sesión…");
      setTimeout(() => nav("/signin", { replace: true }), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {err && <p className="text-red-300 text-sm">{err}</p>}
      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

      <div>
        <label className="block text-sm font-medium text-white/90 mb-1">Nombre</label>
        <input name="name" type="text" placeholder="Tu nombre" className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-1">Email</label>
        <input name="email" type="email" placeholder="tu@email.com" className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-1">Contraseña</label>
        <input name="password" type="password" placeholder="••••••••" className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-1">Rol</label>
        <select name="role" className="input">
          <option value="client">Client</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-white/50 mt-1">
          *El primer usuario se crea como <b>admin</b> automáticamente.
        </p>
      </div>

      <button className="btn-primary" disabled={loading}>
        {loading ? "Creando..." : "Crear cuenta"}
      </button>

      <div className="text-center">
        <Link to="/signin" className="text-white/70 hover:underline">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </div>
    </form>
  );
}
