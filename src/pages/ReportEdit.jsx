import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getReport, deleteReport } from "../services/api.js";
import ReportNewBasic from "./ReportNewBasic.jsx";
import ReportNewRigorous from "./ReportNewRigorous.jsx";

export default function ReportEdit() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reportType, setReportType] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await getReport(id);
        const r = data?.report;
        if (!r?._id) throw new Error("No se pudo cargar el informe");
        setReportType(r.type || "basic");
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Error cargando informe");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onDelete = async () => {
    if (!confirm("¿Eliminar este informe? Esta acción lo oculta del sistema.")) return;
    try {
      await deleteReport(id);
      window.location.href = "/reports";
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo eliminar el informe");
    }
  };

  if (loading) return <p>Cargando…</p>;

  if (err) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Editar informe</h1>
          <Link to="/reports" className="btn-primary w-auto px-3 py-2 bg-white/10 hover:bg-white/20">
            Volver
          </Link>
        </div>
        <p className="text-red-300 text-sm">{err}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-5xl flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Editar informe</h1>
        <div className="flex gap-2">
          <Link to="/reports" className="btn-primary w-auto px-3 py-2 bg-white/10 hover:bg-white/20">
            Volver
          </Link>
          <button onClick={onDelete} className="btn-primary w-auto px-3 py-2 bg-red-600 hover:bg-red-700">
            Eliminar
          </button>
        </div>
      </div>

      {reportType === "rigorous" ? (
        <ReportNewRigorous mode="edit" reportId={id} />
      ) : (
        <ReportNewBasic mode="edit" reportId={id} />
      )}
    </div>
  );
}
