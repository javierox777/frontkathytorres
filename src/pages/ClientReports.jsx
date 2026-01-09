import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listReports } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReportPDFButton from "../components/ReportPDFButton.jsx";

export default function ClientReports() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const page = Number(sp.get("page") || 1);
  const type = sp.get("type") || "";

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== "page") next.delete("page");
    setSp(next, { replace: true });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await listReports({ page, limit: 12, type: type || undefined });
        setData({
          items: data.items || [],
          total: Number(data.total || 0),
          page: Number(data.page || 1),
          pages: Number(data.pages || 1),
        });
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.message || "Error al cargar informes");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, type]);

  const reports = useMemo(() => data.items || [], [data.items]);
  const companyName = user?.company?.name || reports?.[0]?.company?.name || "Mi empresa";

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Portal de Informes</h1>
            <p className="text-white/70 mt-1">
              Empresa: <b>{companyName}</b>
            </p>
          </div>

          <div className="flex gap-2">
            <select className="input" value={type} onChange={(e) => setParam("type", e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="basic">Básico</option>
              <option value="rigorous">Riguroso</option>
            </select>
          </div>
        </div>
      </div>

      {err && <p className="text-red-300 text-sm">{err}</p>}

      <div className="glass rounded-3xl overflow-auto">
        <table className="w-full text-left text-white/90 min-w-[920px]">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3">N°</th>
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
                <td className="px-4 py-6" colSpan={6}>
                  Cargando…
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td className="px-4 py-6" colSpan={6}>
                  No hay informes disponibles.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r._id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-semibold">{r.reportNumber ?? "—"}</td>
                  <td className="px-4 py-3">{r.patient?.name || "—"}</td>
                  <td className="px-4 py-3">{r.type === "rigorous" ? "Riguroso" : "Básico"}</td>
                  <td className="px-4 py-3">
                    {r.status}
                    {r.signature?.signed ? " (firmado)" : ""}
                  </td>
                  <td className="px-4 py-3">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/client/reports/${r._id}`}
                        className="btn-primary w-auto px-3 py-2 bg-white/10 hover:bg-white/20"
                      >
                        Ver detalle
                      </Link>
                      <ReportPDFButton reportId={r._id} />
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
          Página {data.page} de {data.pages} · Total {data.total}
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
