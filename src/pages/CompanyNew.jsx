import { useState } from "react";
import { api } from "../services/api.js";
import { useNavigate } from "react-router-dom";

export default function CompanyNew() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      rut: form.get("rut"),
      email: form.get("email"),
      phone: form.get("phone"),
      address: form.get("address"),
      country: form.get("country"),
      clientUser: {
        name: form.get("clientName"),
        email: form.get("clientEmail"),
        password: form.get("clientPassword"),
      }
    };

    try {
      await api.post("/companies", payload);
      setMsg("Empresa creada con éxito ✨");
      setTimeout(() => nav("/companies"), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error al crear empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Nueva empresa</h1>

      {err && <p className="text-red-300 text-sm">{err}</p>}
      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        <input name="name" placeholder="Nombre empresa" className="input col-span-2" />
        <input name="rut" placeholder="RUT / Tax ID" className="input" />
        <input name="country" placeholder="País" className="input" />
        <input name="email" placeholder="Email contacto" className="input" />
        <input name="phone" placeholder="Teléfono" className="input" />
        <input name="address" placeholder="Dirección" className="input col-span-2" />

        <div className="col-span-2 pt-4">
          <h2 className="font-semibold mb-2">Usuario cliente</h2>
          <input name="clientName" placeholder="Nombre usuario" className="input col-span-2" />
          <input name="clientEmail" type="email" placeholder="Email usuario" className="input col-span-2" />
          <input name="clientPassword" type="password" placeholder="Contraseña usuario" className="input col-span-2" />
        </div>

        <button className="btn-primary col-span-2" disabled={loading}>
          {loading ? "Creando..." : "Crear empresa"}
        </button>
      </form>
    </div>
  );
}
