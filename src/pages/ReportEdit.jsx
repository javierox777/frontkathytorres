import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, getReport, updateReport, deleteReport } from "../services/api.js";

export default function ReportEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [type, setType] = useState("basic");
  const [status, setStatus] = useState("draft");
  const [patient, setPatient] = useState({ name: "", rut: "", edad: "", cargo: "" });
  const [evaluationText, setEvaluationText] = useState("{}");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/companies", { params: { limit: 500 } });
        const rows = data?.rows || data?.companies || data || [];
        setCompanies(Array.isArray(rows) ? rows : []);
      } catch {
        setCompanies([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      setMsg("");
      try {
        const { data } = await getReport(id);
        const r = data?.report;
        if (!r?._id) throw new Error("No se pudo cargar el informe");
        setCompanyId(r.company?._id || "");
        setType(r.type || "basic");
        setStatus(r.status || "draft");
        setPatient({
          name: r.patient?.name || "",
          rut: r.patient?.rut || "",
          edad: r.patient?.edad || "",
          cargo: r.patient?.cargo || "",
        });
        setEvaluationText(JSON.stringify(r.evaluation || {}, null, 2));
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Error cargando informe");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const evalJson = useMemo(() => {
    try {
      return JSON.parse(evaluationText || "{}");
    } catch {
      return null;
    }
  }, [evaluationText]);

  const setP = (k) => (e) => setPatient((p) => ({ ...p, [k]: e.target.value }));

  const onSave = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!companyId) {
      setErr("Debes seleccionar una empresa.");
      return;
    }
    if (!evalJson) {
      setErr("El JSON de evaluation no es válido. Corrígelo antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      await updateReport(id, {
        company: companyId,
        type,
        status,
        patient,
        evaluation: evalJson,
      });
      setMsg("Informe actualizado con éxito.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Error al actualizar informe");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Eliminar este informe? Esta acción lo oculta del sistema.")) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await deleteReport(id);
      nav("/reports");
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al eliminar informe");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar informe</h1>
        <div className="flex gap-2">
          <Link to="/reports" className="btn-primary w-auto px-3 py-2 bg-white/10 hover:bg-white/20">
            Volver
          </Link>
          <button onClick={onDelete} className="btn-primary w-auto px-3 py-2 bg-red-600 hover:bg-red-700" disabled={saving}>
            Eliminar
          </button>
        </div>
      </div>

      {err && <p className="text-red-300 text-sm">{err}</p>}
      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

      <form onSubmit={onSave} className="glass rounded-3xl p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-white/70">Empresa</label>
            <select className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
              <option value="">— Selecciona empresa —</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.rut ? `(${c.rut})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/70">Tipo</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="basic">Básico</option>
                <option value="rigorous">Riguroso</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white/70">Estado</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">draft</option>
                <option value="signed">signed</option>
                <option value="final">final</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Paciente (nombre)</label>
            <input className="input" value={patient.name} onChange={setP("name")} />
          </div>
          <div>
            <label className="text-sm text-white/70">RUT</label>
            <input className="input" value={patient.rut} onChange={setP("rut")} />
          </div>
          <div>
            <label className="text-sm text-white/70">Edad</label>
            <input className="input" value={patient.edad} onChange={setP("edad")} />
          </div>
          <div className="md:col-span-4">
            <label className="text-sm text-white/70">Cargo</label>
            <input className="input" value={patient.cargo} onChange={setP("cargo")} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">evaluation (JSON)</label>
            {!evalJson && <span className="text-xs text-red-200">JSON inválido</span>}
          </div>
          <textarea
            className="w-full min-h-[360px] rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/90 outline-none"
            value={evaluationText}
            onChange={(e) => setEvaluationText(e.target.value)}
            spellCheck={false}
          />
        </div>

        <button className="btn-primary w-auto" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
