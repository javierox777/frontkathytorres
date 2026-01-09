// src/pages/WorkOrders.jsx
import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api.js";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import StatusPill from "../components/StatusPill.jsx";

import EvaluationModalBasic from "../components/EvaluationModalBasic.jsx";
import EvaluationModal from "../components/EvaluationModal.jsx"; // rigurosa

export default function WorkOrders() {
  const [data, setData] = useState({ rows: [], total: 0, page: 1, pages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(sp.get("page") || 1);
  const q = sp.get("q") || "";
  const status = sp.get("status") || "";
  const rut = sp.get("rut") || "";
  const branch = sp.get("branch") || "";

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    next.delete("page");
    setSp(next, { replace: true });
  };

  const normalizeListResponse = (resp) => {
    // Soporta { items, total, page, limit } y legado { rows, total, page, limit }
    const rows = resp?.items ?? resp?.rows ?? [];
    const total = Number(resp?.total ?? rows.length ?? 0);
    const limit = Number(resp?.limit ?? 10);
    const curr = Number(resp?.page ?? 1);
    const pages = Math.max(1, Math.ceil(total / (limit || 10)));
    return { rows, total, page: curr, pages, limit };
  };

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: resp } = await api.get("/workorders", {
        params: { page, q, status, rut, branch, sort: "-createdAt", limit: 10 },
      });
      setData(normalizeListResponse(resp));
    } catch (e) {
      console.error("WorkOrders list error:", e);
      setError(e?.response?.data?.message || "No se pudo cargar la lista de órdenes.");
      setData((d) => ({ ...d, rows: d.rows || [], total: d.total || 0, pages: d.pages || 1 }));
    } finally {
      setLoading(false);
    }
  }, [page, q, status, rut, branch]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Estado de modales
  const [selected, setSelected] = useState(null);
  const [openBasic, setOpenBasic] = useState(false);
  const [openRigorous, setOpenRigorous] = useState(false);

  const openBasicFor = (row) => {
    setSelected(row);
    setOpenBasic(true);
    setTimeout(() => {
      const modalMounted = document.querySelector("[data-modal='basic']");
      if (!modalMounted) navigate(`/reports/new/basic?wo=${row?._id}`);
    }, 120);
  };

  const openRigorousFor = (row) => {
    setSelected(row);
    setOpenRigorous(true);
    setTimeout(() => {
      const modalMounted = document.querySelector("[data-modal='rigorous']");
      if (!modalMounted) navigate(`/reports/new/rigorous?wo=${row?._id}`);
    }, 120);
  };

  const closeBasic = () => { setOpenBasic(false); setSelected(null); };
  const closeRigorous = () => { setOpenRigorous(false); setSelected(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Órdenes de Trabajo</h1>
        <Link className="btn-primary w-auto" to="/workorders/new">Nueva orden</Link>
      </div>

      {error && (
        <div className="glass rounded-2xl p-3 border border-red-400/40 text-red-200">{error}</div>
      )}

      {/* Filtros */}
      <div className="glass rounded-3xl p-4 grid md:grid-cols-4 gap-3">
        <input className="input" placeholder="Buscar (OT, título, descripción, paciente…)" defaultValue={q} onChange={(e) => setParam("q", e.target.value)} />
        <input className="input" placeholder="RUT del paciente" defaultValue={rut} onChange={(e) => setParam("rut", e.target.value)} />
        <input className="input" placeholder="Sucursal" defaultValue={branch} onChange={(e) => setParam("branch", e.target.value)} />
        <select className="input" defaultValue={status} onChange={(e) => setParam("status", e.target.value)}>
          <option value="">Todos los estados</option>
          <option>draft</option><option>open</option><option>in_progress</option>
          <option>on_hold</option><option>completed</option><option>canceled</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="glass rounded-3xl overflow-auto">
        <table className="w-full text-left text-white/90 min-w-[980px]">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3">OT</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">RUT del paciente</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Nombre del paciente</th>
              <th className="px-4 py-3">Fecha de ingreso</th>
              <th className="px-4 py-3">Estado OT</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={8}>Cargando…</td></tr>
            ) : (data.rows?.length ?? 0) === 0 ? (
              <tr><td className="px-4 py-6" colSpan={8}>{error ? "—" : "Sin resultados"}</td></tr>
            ) : (
              data.rows.map((r) => (
                <tr key={r._id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-semibold">{r.code}</td>
                  <td className="px-4 py-3">{r.customer?.name || "—"}</td>
                  <td className="px-4 py-3">{r.patientRut || "—"}</td>
                  <td className="px-4 py-3">{r.branch || "—"}</td>
                  <td className="px-4 py-3">{r.patientName || "—"}</td>
                  <td className="px-4 py-3">{r.entryDate ? new Date(r.entryDate).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3"><StatusPill value={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link to={`/workorders/${r._id}`} className="btn-primary w-auto px-3 py-2">Ver</Link>
                      <button className="btn-primary w-auto px-3 py-2 bg-white/10 hover:bg-white/20" onClick={() => openBasicFor(r)}>Básico</button>
                      <button className="btn-primary w-auto px-3 py-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => openRigorousFor(r)}>Rigurosa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end gap-2">
        <button className="btn-primary w-auto disabled:opacity-50"
          onClick={() => setParam("page", String(Math.max(1, page - 1)))}
          disabled={page <= 1 || loading}>
          Anterior
        </button>
        <span className="text-white/70 text-sm">Página {data.page} de {data.pages}</span>
        <button className="btn-primary w-auto disabled:opacity-50"
          onClick={() => setParam("page", String(Math.min(data.pages, page + 1)))}
          disabled={page >= data.pages || loading}>
          Siguiente
        </button>
      </div>

      {/* Modal Básico */}
      {openBasic && selected && (
        <div data-modal="basic">
          <EvaluationModalBasic open={openBasic} wo={selected} onClose={closeBasic} onSaved={fetchList} />
        </div>
      )}

      {/* Modal Rigurosa */}
      {openRigorous && selected && (
        <div data-modal="rigorous">
          <EvaluationModal open={openRigorous} wo={selected} onClose={closeRigorous} onSaved={fetchList} />
        </div>
      )}
    </div>
  );
}
