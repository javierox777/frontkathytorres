// src/pages/ReportNewBasic.jsx
import { useEffect, useMemo, useState } from "react";
import { api, createReport, signReport, getMe } from "../services/api.js";
import { useNavigate } from "react-router-dom";

// Base URL para construir la ruta absoluta de la firma en la vista previa
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const toAbs = (u) => {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  const rel = u.startsWith("/") ? u : `/${u}`;
  return API_BASE + rel;
};

/* =================== OPCIONES =================== */
const TEST_OPTS = ["Aprobado", "Alterado", "Límite normal"];
const AUDIO_OPTS = ["Aprobado", "Alterado"];
const RESULT_OPTS = ["Aprobado", "Reprobado", "Pendiente"];
const EPWORTH_OPTS = [
  "Sin Alteraciones",
  "Somnolencia Leve",
  "Somnolencia Moderada",
  "Somnolencia Grave",
];

export default function ReportNewBasic() {
  const nav = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [firmarAlGuardar, setFirmarAlGuardar] = useState(true);

  // Perfil (para tomar la firma ya subida y mostrar vista previa)
  const [me, setMe] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMe();
        setMe(data || null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  // Empresas
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/companies", { params: { limit: 500 } });
        const rows = data?.rows || data?.companies || data || [];
        setCompanies(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("Error cargando empresas:", e);
        setCompanies([]);
      }
    })();
  }, []);

  // Firma del perfil (tolerante a varios nombres de campo)
  const profileSignatureRel =
    me?.signatureUrl || me?.signature || me?.signaturePath || me?.firmaUrl || "";
  const profileSignatureAbs = toAbs(profileSignatureRel);

  const [form, setForm] = useState(() => ({
    // Identificación
    nombre: "",
    rut: "",
    edad: "",
    cargo: "",
    licencia: "B",
    fecha: new Date().toISOString().slice(0, 10),
    vigenciaLicencia: "",
    vigenciaEvaluacion: "",

    // Psicométrica básico
    psi_palancas: "",
    psi_punteado: "",
    psi_reactimetria: "",

    // Audiometría
    audio_ambos: "",
    s_audicion_oi: "",
    s_audicion_od: "",

    // Sueño
    epworth: "",

    // Conclusión
    concl_resultado: "",
    concl_lentes_lejos: "",
    concl_observacion: "",
  }));

  const resumen = useMemo(() => {
    const aprobado = (v) => (v || "").toLowerCase() === "aprobado";
    const pruebasAprobadas = [form.psi_palancas, form.psi_punteado, form.psi_reactimetria].filter(aprobado);
    return {
      aprobadas: pruebasAprobadas.length,
      audioOk: [form.s_audicion_od, form.s_audicion_oi, form.audio_ambos].every(aprobado),
    };
  }, [form]);

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleCreate = async () => {
    try {
      if (!companyId) {
        alert("Debes seleccionar un cliente (empresa).");
        return;
      }

      const payload = {
        type: "basic",
        companyId,
        patient: {
          name: form.nombre,
          rut: form.rut,
          edad: form.edad,
          cargo: form.cargo,
        },
        evaluation: {
          // Guarda todos los campos reales del formulario
          nombre: form.nombre,
          rut: form.rut,
          edad: form.edad,
          cargo: form.cargo,
          licencia: form.licencia,
          fechaEvaluacion: form.fecha,
          vigenciaLicencia: form.vigenciaLicencia,
          vigenciaEvaluacion: form.vigenciaEvaluacion,
          psi_palancas: form.psi_palancas,
          psi_punteado: form.psi_punteado,
          psi_reactimetria: form.psi_reactimetria,
          audio_ambos: form.audio_ambos,
          s_audicion_oi: form.s_audicion_oi,
          s_audicion_od: form.s_audicion_od,
          epworth: form.epworth,
          concl_resultado: form.concl_resultado,
          concl_lentes_lejos: form.concl_lentes_lejos,
          concl_observacion: form.concl_observacion,
        },
      };

      const created = await createReport(payload);
      const report = created?.report;
      if (!report?._id) throw new Error("No se pudo crear el reporte");

      if (firmarAlGuardar) {
        let mySignature = profileSignatureRel;
        let myName = me?.name || "";
        let myRut = me?.rut || "";

        if (!mySignature || !myName) {
          try {
            const { data: freshMe } = await getMe();
            mySignature =
              freshMe?.signatureUrl || freshMe?.signature || freshMe?.signaturePath || freshMe?.firmaUrl || mySignature || "";
            myName = freshMe?.name || myName || "";
            myRut = freshMe?.rut || myRut || "";
          } catch (e) {
            console.error("Error fetching me for signature", e);
          }
        }

        if (mySignature && !mySignature.startsWith("http") && !mySignature.startsWith("/")) {
          mySignature = `/${mySignature}`;
        }

        await signReport(report._id, {
          name: myName,
          rut: myRut,
          cargo: "",
          imageUrl: mySignature,
        });
      }

      alert(`Informe básico creado (N° ${report.reportNumber})${firmarAlGuardar ? " y firmado" : ""}.`);
      nav("/reports");
    } catch (err) {
      console.error("❌ Error al crear/firmar:", err);
      alert(err?.response?.data?.message || err?.message || "Error al crear el informe.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-slate-900 p-6 text-gray-100 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">
        Informe Psicosensotécnico BÁSICO
      </h2>

      {/* Cliente */}
      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-950/40 p-4">
        <div className="mb-2 text-sm font-medium text-slate-200">Cliente (Empresa) *</div>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none"
        >
          <option value="">— Selecciona empresa —</option>
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} {c.rut ? `(${c.rut})` : ""}
            </option>
          ))}
        </select>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={firmarAlGuardar} onChange={(e) => setFirmarAlGuardar(e.target.checked)} />
          Firmar automáticamente con mi firma cargada
        </label>

        <div className="mt-3 text-xs text-slate-300">
          Firma de perfil: {profileSignatureRel ? "Detectada" : "No encontrada"}
        </div>
        {profileSignatureAbs && (
          <img
            src={profileSignatureAbs}
            alt="firma"
            className="mt-2 max-h-20 rounded-md border border-slate-700 bg-white p-2"
          />
        )}
      </div>

      {/* IDENTIFICACIÓN */}
      <Section title="Datos de identificación">
        <Row>
          <Field label="Nombre" value={form.nombre} onChange={set("nombre")} span={2} />
          <Field label="RUT" value={form.rut} onChange={set("rut")} />
        </Row>
        <Row>
          <Field label="Edad" value={form.edad} onChange={set("edad")} />
          <Field label="Cargo" value={form.cargo} onChange={set("cargo")} span={2} />
        </Row>
        <Row>
          <Select label="Licencia" value={form.licencia} onChange={set("licencia")} options={["B", "A2", "A3", "A4", "A5"]} />
          <Field label="Fecha" type="date" value={form.fecha} onChange={set("fecha")} />
          <Field label="Vigencia Licencia" value={form.vigenciaLicencia} onChange={set("vigenciaLicencia")} />
        </Row>
        <Row>
          <Field label="Vigencia Evaluación" value={form.vigenciaEvaluacion} onChange={set("vigenciaEvaluacion")} span={2} />
        </Row>
      </Section>

      {/* PSICOMÉTRICA */}
      <Section title="Pruebas psicométricas (básico)">
        <Row>
          <Select label="Palancas" value={form.psi_palancas} onChange={set("psi_palancas")} options={TEST_OPTS} />
          <Select label="Punteado" value={form.psi_punteado} onChange={set("psi_punteado")} options={TEST_OPTS} />
          <Select label="Reactimetría" value={form.psi_reactimetria} onChange={set("psi_reactimetria")} options={TEST_OPTS} />
        </Row>
        <div className="mt-2 text-xs text-slate-300">Chequeo rápido: {resumen.aprobadas}/3 pruebas aprobadas</div>
      </Section>

      {/* AUDIOMETRÍA */}
      <Section title="Audiometría">
        <Row>
          <Select label="Ambos" value={form.audio_ambos} onChange={set("audio_ambos")} options={AUDIO_OPTS} />
          <Select label="Oído Izq." value={form.s_audicion_oi} onChange={set("s_audicion_oi")} options={AUDIO_OPTS} />
          <Select label="Oído Der." value={form.s_audicion_od} onChange={set("s_audicion_od")} options={AUDIO_OPTS} />
        </Row>
        <div className="mt-2 text-xs text-slate-300">Chequeo rápido: {resumen.audioOk ? "OK" : "Revisar"}</div>
      </Section>

      {/* SUEÑO */}
      <Section title="Sueño (Epworth)">
        <Row>
          <Select label="Epworth" value={form.epworth} onChange={set("epworth")} options={EPWORTH_OPTS} span={2} />
        </Row>
      </Section>

      {/* CONCLUSIÓN */}
      <Section title="Conclusión">
        <Row>
          <Select label="Resultado" value={form.concl_resultado} onChange={set("concl_resultado")} options={RESULT_OPTS} />
          <Field label="Lentes visión lejana" value={form.concl_lentes_lejos} onChange={set("concl_lentes_lejos")} span={2} />
        </Row>
        <Row>
          <Field label="Observación" value={form.concl_observacion} onChange={set("concl_observacion")} span={3} />
        </Row>
      </Section>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={handleCreate}
          className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Guardar Informe
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6 rounded-lg border border-slate-700 bg-slate-950/40 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-100">{title}</div>
      {children}
    </section>
  );
}

function Row({ children }) {
  return <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">{children}</div>;
}

function Field({ label, value, onChange, type = "text", span = 1 }) {
  return (
    <label className={`block md:col-span-${span}`}>
      <div className="mb-1 text-xs text-slate-300">{label}</div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, span = 1 }) {
  return (
    <label className={`block md:col-span-${span}`}>
      <div className="mb-1 text-xs text-slate-300">{label}</div>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none"
      >
        <option value="">— Seleccionar —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
