import { generateReportPdf } from "../services/api.js";

export default function ReportPDFButton({ reportId, disabled }) {
  const handleExport = async () => {
    try {
      const { data } = await generateReportPdf(reportId);
      const url = data?.url;
      if (url) {
        const base = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
        const full = url.startsWith("http") ? url : base + (url.startsWith("/") ? url : `/${url}`);
        window.open(full, "_blank");
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "No se pudo generar el PDF.");
    }
  };

  return (
    <button
      className="btn-primary w-auto px-3 py-2 bg-emerald-600 hover:bg-emerald-700"
      onClick={handleExport}
      disabled={disabled}
      title="Generar y abrir PDF"
    >
      PDF
    </button>
  );
}
