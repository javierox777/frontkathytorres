import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, attachToken } from "../services/api";
import { getMe, signWorkOrder } from "../services/api";

export default function WorkOrderDetail() {
  const { id } = useParams();
  const [wo, setWo] = useState(null);
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    attachToken(token);
    const [{ data: meData }, { data: woData }] = await Promise.all([getMe(), api.get(`/workorders/${id}`)]);
    setMe(meData);
    setWo(woData);
  }, [id]);

  useEffect(() => {
    fetchData().catch(() => setErr("Error cargando OT"));
  }, [fetchData]);

  const onSign = async () => {
    setBusy(true); setErr("");
    try {
      await signWorkOrder(id, {
        // si quieres, pide estos datos en un pequeño formulario
        firmaRut: wo?.evaluation?.firmaRut || "",
        firmaRsNro: wo?.evaluation?.firmaRsNro || "",
        codigoValidacion: wo?.evaluation?.codigoValidacion || "",
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      setErr("No se pudo firmar");
    } finally {
      setBusy(false);
    }
  };

  if (!wo) return <div>Cargando...</div>;

  return (
    <div className="space-y-4">
      {/* ... tus datos de la OT ... */}

      {me?.role === "admin" && (
        <button className="btn-primary" disabled={busy} onClick={onSign}>
          {busy ? "Firmando..." : "Firmar informe con mi firma"}
        </button>
      )}

      {/* Mostrar estado de firma */}
      {wo?.evaluation?.firmaUrl && (
        <div className="bg-white rounded-xl p-3 inline-block">
          <img
            src={(import.meta.env.VITE_API_URL?.replace('/api', '') + wo.evaluation.firmaUrl) || wo.evaluation.firmaUrl}
            alt="firma" style={{ height: 90, objectFit: "contain" }}
          />
          <div className="text-black text-sm mt-1">
            {wo.evaluation.firma} — {wo.evaluation.firmaRut || "RUT: —"}<br />
            {wo.evaluation.firmaFecha ? new Date(wo.evaluation.firmaFecha).toLocaleString() : ""}
          </div>
        </div>
      )}
      {err && <p className="text-red-300">{err}</p>}
    </div>
  );
}
