import { useState } from "react";
import { api } from "../services/api.js";
import { useParams, useNavigate } from "react-router-dom";

export default function CompanyPasswordEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);

    try {
      await api.patch(`/companies/${id}/client/password`, { password });
      setMsg("Contraseña actualizada ✨");
      setTimeout(() => nav("/companies"), 1000);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Cambiar contraseña del cliente</h1>

      {err && <p className="text-red-300 text-sm">{err}</p>}
      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          className="input w-full"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
