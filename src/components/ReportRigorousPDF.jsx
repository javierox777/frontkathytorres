// src/components/ReportRigorousPDF.jsx
import { generateWorkOrderPdf } from "../services/api";

const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api$/, "");

export default function ReportRigorousPDF({ wo }) {
  if (!wo) return null;

  const handleExport = async () => {
    try {
      const res = await generateWorkOrderPdf(wo._id, "rigorous");
      const url = res?.data?.url;
      if (!url) {
        alert("No se recibió URL del PDF. Revisa la consola del backend.");
        return;
      }
      window.open(baseUrl + url, "_blank");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Error al generar PDF");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="btn-primary w-auto px-3 py-2"
      title="Exportar a PDF"
    >
      Exportar PDF
    </button>
  );
}
