import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, listReports, signReport } from "../services/api.js";
import ReportPDFButton from "../components/ReportPDFButton.jsx";

export default function ReportsList() {
  const [sp, setSp] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const page = Number(sp.get("page") || 1);
  const type = sp.get("type") || "";
  const company = sp.get("company") || "";

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== "page") next.delete("page");
    setSp(next, { replace: true });
  };

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

  const fetchList = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await listReports({
        page,
        limit: 10,
        type: type || undefined,
        company: company || undefined,
      });

      setData({
        items: data.items || [],
        total: Number(data.total || 0),
        page: Number(data.page || 1),
        pages: Number(data.pages || 1),
      });
    } catch (e) {
      console.error("reports list error", e);
      setErr(e?.response?.data?.message || "Error al cargar informes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line
  }, [page, type, company]);

  const reports = useMemo(() => data.items || [], [data.items]);
  const toggleExpand = (id) => setExpandedId((curr) => (curr === id ? null : id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Informes</h1>
        <div className="flex gap-2">
          <Link to="/reports/new/rigorous" className="btn-primary w-auto">
            🟪 Nuevo Riguroso
          </Link>
          <Link to="/reports/new/basic" className="btn-primary w-auto bg-indigo-600 hover:bg-indigo-700">
            🟦 Nuevo Básico
          </Link>
        </div>
      </div>

      <div className="glass rounded-3xl p-4 grid md:grid-cols-3 gap-3">
        <select className="input" value={company} onChange={(e) => setParam("company", e.target.value)}>
          <option value="">Todos los clientes</option>
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} {c.rut ? `(${c.rut})` : ""}
            </option>
          ))}
        </select>
        <select className="input" value={type} onChange={(e) => setParam("type", e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="rigorous">Rigurosa</option>
          <option value="basic">Básica</option>
        </select>
        <div className="text-sm text-white/70 flex items-center">Total: {data.total}</div>
      </div>

      {err && <p className="text-red-300 text-sm">{err}</p>}

      <div className="glass rounded-3xl overflow-auto">
        <table className="w-full text-left text-white/90 min-w-[980px]">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Actualizado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6" colSpan={7}>
                  Cargando…
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td className="px-4 py-6" colSpan={7}>
                  No hay informes para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              reports.flatMap((r) => {
                const isOpen = expandedId === r._id;
                return [
                  (
                    <tr key={r._id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold">{r.reportNumber ?? "—"}</td>
                      <td className="px-4 py-3">{r.company?.name || "—"}</td>
                      <td className="px-4 py-3">{r.patient?.name || "—"}</td>
                      <td className="px-4 py-3">{r.type === "rigorous" ? "Rigurosa" : "Básica"}</td>
                      <td className="px-4 py-3">
                        {r.status}
                        {r.signature?.signed ? " (firmado)" : ""}
                      </td>
                      <td className="px-4 py-3">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn-primary w-auto px-3 py-2 bg-white/10 hover:bg-white/20"
                            onClick={() => toggleExpand(r._id)}
                          >
                            {isOpen ? "Ocultar" : "Ver"}
                          </button>
                          <ReportPDFButton reportId={r._id} disabled={!r._id} />
                        </div>
                      </td>
                    </tr>
                  ),
                  isOpen && (
                    <tr key={`${r._id}-details`} className="border-b border-white/10">
                      <td colSpan={7} className="px-4 py-4 bg-white/5">
                        <Details reportId={r._id} onChange={fetchList} />
                      </td>
                    </tr>
                  ),
                ];
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="btn-primary w-auto disabled:opacity-50"
          onClick={() => setParam("page", String(Math.max(1, page - 1)))}
          disabled={page <= 1 || loading}
        >
          Anterior
        </button>
        <span className="text-white/70 text-sm">
          Página {data.page} de {data.pages}
        </span>
        <button
          className="btn-primary w-auto disabled:opacity-50"
          onClick={() => setParam("page", String(Math.min(data.pages, page + 1)))}
          disabled={page >= data.pages || loading}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function Details({ reportId, onChange }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/reports/${reportId}`);
        setReport(data.report);
      } catch (e) {
        console.error(e);
        setReport(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId]);

  const doSign = async () => {
    try {
      setMsg("");
      await signReport(reportId, {});
      setMsg("✅ Informe firmado (se usó la firma del usuario si existe).");
      await onChange?.();
    } catch (e) {
      setMsg(e?.response?.data?.message || "❌ No se pudo firmar.");
    }
  };

  if (loading) return <div className="text-sm text-white/70">Cargando detalle…</div>;
  if (!report) return <div className="text-sm text-red-200">No se pudo cargar el detalle.</div>;

  return (
    <div className="text-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-white/80">
          <b>N°:</b> {report.reportNumber} · <b>Cliente:</b> {report.company?.name} · <b>Paciente:</b> {report.patient?.name}
        </div>
        <button className="btn-primary w-auto" onClick={doSign} disabled={report.signature?.signed}>
          {report.signature?.signed ? "Ya firmado" : "Firmar"}
        </button>
      </div>
      {msg && <div className="text-white/80">{msg}</div>}
      <div className="grid md:grid-cols-2 gap-3 text-white/80">
        <div className="glass p-3 rounded-2xl">
          <div className="font-semibold">Paciente</div>
          <div>Nombre: {report.patient?.name || "—"}</div>
          <div>RUT: {report.patient?.rut || "—"}</div>
          <div>Edad: {report.patient?.edad || "—"}</div>
          <div>Cargo: {report.patient?.cargo || "—"}</div>
        </div>
        <div className="glass p-3 rounded-2xl">
          <div className="font-semibold">Firma</div>
          <div>Firmado: {report.signature?.signed ? "Sí" : "No"}</div>
          <div>Código: {report.signature?.code || "—"}</div>
          <div>Fecha: {report.signature?.date ? new Date(report.signature.date).toLocaleString() : "—"}</div>
        </div>
      </div>
      <div className="glass p-3 rounded-2xl text-white/80">
        <div className="font-semibold mb-2">Datos del formulario (evaluation)</div>
        <pre className="whitespace-pre-wrap break-words text-xs bg-black/30 p-2 rounded-xl">
{JSON.stringify(report.evaluation || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
