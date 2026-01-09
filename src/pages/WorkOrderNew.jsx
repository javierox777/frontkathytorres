import { useState } from "react";
import { api } from "../services/api.js";
import { useNavigate } from "react-router-dom";

export default function WorkOrderNew() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const f = new FormData(e.currentTarget);
    const payload = {
      patientRut: f.get("patientRut")?.toString().trim(),
      patientName: f.get("patientName")?.toString().trim(),
      branch: f.get("branch")?.toString().trim(),
      entryDate: f.get("entryDate") || null,
      status: f.get("status") || "open", // opcional (el back valida enum)
      // Si eres admin y quieres crear para otro cliente:
      // customer: f.get("customerId") || undefined,
    };

    if (!payload.patientRut || !payload.patientName || !payload.branch) {
      setErr("Completa RUT del paciente, Nombre del paciente y Sucursal");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/workorders", payload);
      nav(`/workorders/${data._id}`, { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error creando orden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-4">Nueva Orden</h1>

      <form onSubmit={onSubmit} className="glass rounded-3xl p-6 space-y-4">
        {err && <p className="text-red-300 text-sm">{err}</p>}

        {/* Info: el código OT se genera automáticamente en el backend */}
        <p className="text-white/60 text-sm">
          El código <b>OT</b> se genera automáticamente al crear la orden.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/90 mb-1">Sucursal</label>
            <input name="branch" className="input" placeholder="Ej. Santiago Centro" />
          </div>
          <div>
            <label className="block text-sm text-white/90 mb-1">Fecha de ingreso</label>
            <input name="entryDate" type="date" className="input" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-white/90 mb-1">RUT del paciente</label>
            <input name="patientRut" className="input" placeholder="11.111.111-1" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/90 mb-1">Nombre del paciente</label>
            <input name="patientName" className="input" placeholder="Nombre Apellido" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/90 mb-1">Estado OT</label>
          <select name="status" className="input" defaultValue="open">
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="on_hold">on_hold</option>
            <option value="completed">completed</option>
            <option value="canceled">canceled</option>
          </select>
          <p className="text-white/50 text-xs mt-1">
            Si no eliges, quedará en <b>open</b>.
          </p>
        </div>

        <button className="btn-primary w-auto" disabled={loading}>
          {loading ? "Creando…" : "Crear orden"}
        </button>
      </form>
    </div>
  );
}
