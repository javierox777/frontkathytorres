import { useState, useEffect } from "react";
import { api, attachToken } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Signin() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { setToken, setUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => attachToken(null), []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email")?.toString().trim();
    const password = form.get("password")?.toString();

    if (!email || !password) {
      setErr("Completa todos los campos");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/signin", { email, password });
      setToken(data.token);
      attachToken(data.token);

      // Obtener perfil completo (incluye company si es cliente)
      try {
        const me = await api.get("/auth/me");
        setUser(me.data);
      } catch {
        setUser(data.user);
      }

      const role = data?.user?.role || "client";
      nav(role === "admin" ? "/reports" : "/client/reports", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {err && <p className="text-red-300 text-sm">{err}</p>}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-1">Email</label>
        <input name="email" type="email" placeholder="tu@email.com" className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/90 mb-1">Contraseña</label>
        <input name="password" type="password" placeholder="••••••••" className="input" />
      </div>
      <button className="btn-primary" disabled={loading}>
        {loading ? "Entrando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
