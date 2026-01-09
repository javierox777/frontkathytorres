import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import ReportPDFButton from "../components/ReportPDFButton.jsx";

export default function ClientReportDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/reports/${id}`);
        setReport(data.report);
      } catch (e) {
        console.error(e);
        setReport(null);
        setErr(e?.response?.data?.message || "No se pudo cargar el informe");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="text-white/80">Cargando…</div>;
  }

  if (err) {
    return (
      <div className="space-y-4">
        <p className="text-red-300 text-sm">{err}</p>
        <Link to="/client/reports" className="btn-primary w-auto">
          Volver
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <p className="text-white/70">Informe no disponible.</p>
        <Link to="/client/reports" className="btn-primary w-auto">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/client/reports" className="btn-primary w-auto bg-white/10 hover:bg-white/20">
          ← Volver
        </Link>
        <ReportPDFButton reportId={report._id} />
      </div>

      <div className="glass rounded-3xl p-6">
        <h1 className="text-2xl font-bold text-white">
          Informe N° {report.reportNumber ?? "—"} · {report.type === "rigorous" ? "Riguroso" : "Básico"}
        </h1>
        <p className="text-white/70 mt-1">
          Cliente: <b>{report.company?.name || "—"}</b>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6 text-white/80 space-y-1">
          <div className="text-white font-semibold mb-2">Paciente</div>
          <div>Nombre: {report.patient?.name || "—"}</div>
          <div>RUT: {report.patient?.rut || "—"}</div>
          <div>Edad: {report.patient?.edad || "—"}</div>
          <div>Cargo: {report.patient?.cargo || "—"}</div>
        </div>

        <div className="glass rounded-3xl p-6 text-white/80 space-y-1">
          <div className="text-white font-semibold mb-2">Estado y firma</div>
          <div>Estado: {report.status || "—"}</div>
          <div>Firmado: {report.signature?.signed ? "Sí" : "No"}</div>
          <div>Código: {report.signature?.code || "—"}</div>
          <div>
            Fecha: {report.signature?.date ? new Date(report.signature.date).toLocaleString() : "—"}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Datos del formulario</h2>
          <span className="text-xs text-white/60">Se muestran exactamente los datos guardados</span>
        </div>
        <pre className="mt-3 whitespace-pre-wrap break-words text-xs bg-black/30 p-4 rounded-2xl text-white/80">
{JSON.stringify(report.evaluation || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
