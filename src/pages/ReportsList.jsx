import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api, listReports, deleteReport } from "../services/api.js";
import ReportPDFButton from "../components/ReportPDFButton.jsx";

export default function ReportsList() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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

  const goEdit = (r) => {
    if (!r?._id) return;
    nav(`/reports/${r._id}/edit`);
  };

  const doDelete = async (id) => {
    if (!id) return;
    if (!confirm("¿Eliminar este informe? Esta acción lo oculta del sistema.")) return;
    try {
      await deleteReport(id);
      await fetchList();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo eliminar el informe");
    }
  };

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
              reports.map((r) => (
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
                            onClick={() => goEdit(r)}
                          >
                            Ver
                          </button>
                          <ReportPDFButton reportId={r._id} disabled={!r._id} />
                          <button
                            className="btn-primary w-auto px-3 py-2 bg-red-600 hover:bg-red-700"
                            onClick={() => doDelete(r._id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
              ))
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
