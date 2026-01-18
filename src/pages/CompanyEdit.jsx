import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getCompany, updateCompany, deleteCompany } from "../services/api.js";

export default function CompanyEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    rut: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    active: true,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await getCompany(id);
        setForm({
          name: data?.name || "",
          rut: data?.rut || "",
          email: data?.email || "",
          phone: data?.phone || "",
          address: data?.address || "",
          country: data?.country || "",
          active: data?.active !== false,
        });
      } catch (e) {
        setErr(e?.response?.data?.message || "No se pudo cargar la empresa");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (k) => (e) => {
    const v = k === "active" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await updateCompany(id, {
        name: form.name,
        rut: form.rut,
        email: form.email,
        phone: form.phone,
        address: form.address,
        country: form.country,
        active: form.active,
      });
      setMsg("Empresa actualizada con éxito.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error al actualizar empresa");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Eliminar esta empresa? Esta acción la oculta del sistema.")) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await deleteCompany(id);
      nav("/companies");
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al eliminar empresa");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar empresa</h1>
        <div className="flex gap-2">
          <Link to={`/companies/${id}/password`} className="btn-primary w-auto px-3 py-2 bg-blue-600 hover:bg-blue-700">
            Contraseña cliente
          </Link>
          <button onClick={onDelete} className="btn-primary w-auto px-3 py-2 bg-red-600 hover:bg-red-700" disabled={saving}>
            Eliminar
          </button>
        </div>
      </div>

      {err && <p className="text-red-300 text-sm">{err}</p>}
      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

      <form onSubmit={onSave} className="grid grid-cols-2 gap-4">
        <input name="name" value={form.name} onChange={set("name")} placeholder="Nombre empresa" className="input col-span-2" required />
        <input name="rut" value={form.rut} onChange={set("rut")} placeholder="RUT / Tax ID" className="input" required />
        <input name="country" value={form.country} onChange={set("country")} placeholder="País" className="input" required />
        <input name="email" value={form.email} onChange={set("email")} placeholder="Email contacto" className="input" required />
        <input name="phone" value={form.phone} onChange={set("phone")} placeholder="Teléfono" className="input" required />
        <input name="address" value={form.address} onChange={set("address")} placeholder="Dirección" className="input col-span-2" required />

        <label className="col-span-2 flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={form.active} onChange={set("active")} />
          Activa
        </label>

        <button className="btn-primary col-span-2" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
