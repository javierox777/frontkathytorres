// src/pages/ReportNewRigorous.jsx
import { useEffect, useState } from "react";
import { api, createReport, signReport, getMe } from "../services/api.js";
import { useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const toAbs = (u) => {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  const rel = u.startsWith("/") ? u : `/${u}`;
  return API_BASE + rel;
};

const TEST_OPTS = ["Aprobado", "Reprobado"];
const AUDIO_OPTS = ["Aprobado", "Alterado"];
const OPT_OPTS = ["Aprobado", "Alterado", "Límite normal"];
const RESULT_OPTS = ["Aprobado", "Reprobado", "Pendiente"];

export default function ReportNewRigorous() {
  const nav = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [firmarAlGuardar, setFirmarAlGuardar] = useState(true);
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

  const profileSignatureRel =
    me?.signatureUrl || me?.signature || me?.signaturePath || me?.firmaUrl || "";
  const profileSignatureAbs = toAbs(profileSignatureRel);

  const [form, setForm] = useState(() => ({
    nombre: "",
    rut: "",
    edad: "",
    cargo: "",
    licencia: "B",
    fecha: new Date().toISOString().slice(0, 10),
    vigenciaLicencia: "",
    vigenciaEvaluacion: "",

    // Psicomotriz ampliada
    test_palanca_lahy: "",
    test_punteado_lahy: "",
    test_reactimetria: "",
    test_atencion_monot: "",
    test_vel_anticip: "",
    test_doble_laberinto: "",
    test_reacciones_mult: "",

    // Optometría
    opt_agudeza_binocular: "",
    opt_agudeza_od: "",
    opt_agudeza_oi: "",
    opt_colores: "",
    opt_profundidad: "",
    opt_foria_h: "",
    opt_foria_v: "",
    opt_vision_nocturna: "",
    opt_reaccion_enc: "",
    opt_recuperacion_enc: "",
    opt_perimetria_od: "",
    opt_perimetria_oi: "",

    // Audiometría
    audio_ambos: "",
    audio_oi: "",
    audio_od: "",

    // Sueño
    epworth: "",

    // Conclusión
    resultado: "",
    lentesVisionLejana: "",
    observacion: "",
  }));

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    try {
      if (!companyId) {
        alert("Debes seleccionar un cliente (empresa).");
        return;
      }

      const payload = {
        type: "rigorous",
        companyId,
        patient: {
          name: form.nombre,
          rut: form.rut,
          edad: form.edad,
          cargo: form.cargo,
        },
        evaluation: {
          // se guarda tal cual el formulario
          ...form,
          fechaEvaluacion: form.fecha,
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

      alert(`Informe riguroso creado (N° ${report.reportNumber})${firmarAlGuardar ? " y firmado" : ""}.`);
      nav("/reports");
    } catch (err) {
      console.error("❌ Error al crear/firmar:", err);
      alert(err?.response?.data?.message || err?.message || "Error al crear el informe.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-xl bg-slate-900 p-6 text-gray-100 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">Informe Psicosensotécnico RIGUROSO</h2>

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

        {profileSignatureAbs && (
          <img
            src={profileSignatureAbs}
            alt="firma"
            className="mt-2 max-h-20 rounded-md border border-slate-700 bg-white p-2"
          />
        )}
      </div>

      <Section title="Identificación">
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

      <Section title="Pruebas psicomotrices">
        <Row>
          <Select label="Palanca Lahy" value={form.test_palanca_lahy} onChange={set("test_palanca_lahy")} options={TEST_OPTS} />
          <Select label="Punteado Lahy" value={form.test_punteado_lahy} onChange={set("test_punteado_lahy")} options={TEST_OPTS} />
          <Select label="Reactimetría" value={form.test_reactimetria} onChange={set("test_reactimetria")} options={TEST_OPTS} />
        </Row>
        <Row>
          <Select label="Atención monot." value={form.test_atencion_monot} onChange={set("test_atencion_monot")} options={TEST_OPTS} />
          <Select label="Vel. anticip." value={form.test_vel_anticip} onChange={set("test_vel_anticip")} options={TEST_OPTS} />
          <Select label="Doble laberinto" value={form.test_doble_laberinto} onChange={set("test_doble_laberinto")} options={TEST_OPTS} />
        </Row>
        <Row>
          <Select label="Reacciones múltiples" value={form.test_reacciones_mult} onChange={set("test_reacciones_mult")} options={TEST_OPTS} />
        </Row>
      </Section>

      <Section title="Optometría">
        <Row>
          <Select label="Agudeza binocular" value={form.opt_agudeza_binocular} onChange={set("opt_agudeza_binocular")} options={OPT_OPTS} />
          <Select label="Agudeza OD" value={form.opt_agudeza_od} onChange={set("opt_agudeza_od")} options={OPT_OPTS} />
          <Select label="Agudeza OI" value={form.opt_agudeza_oi} onChange={set("opt_agudeza_oi")} options={OPT_OPTS} />
        </Row>
        <Row>
          <Select label="Colores" value={form.opt_colores} onChange={set("opt_colores")} options={OPT_OPTS} />
          <Select label="Profundidad" value={form.opt_profundidad} onChange={set("opt_profundidad")} options={OPT_OPTS} />
          <Select label="Foria H" value={form.opt_foria_h} onChange={set("opt_foria_h")} options={OPT_OPTS} />
        </Row>
        <Row>
          <Select label="Foria V" value={form.opt_foria_v} onChange={set("opt_foria_v")} options={OPT_OPTS} />
          <Select label="Visión nocturna" value={form.opt_vision_nocturna} onChange={set("opt_vision_nocturna")} options={OPT_OPTS} />
          <Select label="Reacción enc." value={form.opt_reaccion_enc} onChange={set("opt_reaccion_enc")} options={OPT_OPTS} />
        </Row>
        <Row>
          <Select label="Recuperación enc." value={form.opt_recuperacion_enc} onChange={set("opt_recuperacion_enc")} options={OPT_OPTS} />
          <Select label="Perimetría OD" value={form.opt_perimetria_od} onChange={set("opt_perimetria_od")} options={OPT_OPTS} />
          <Select label="Perimetría OI" value={form.opt_perimetria_oi} onChange={set("opt_perimetria_oi")} options={OPT_OPTS} />
        </Row>
      </Section>

      <Section title="Audiometría">
        <Row>
          <Select label="Ambos" value={form.audio_ambos} onChange={set("audio_ambos")} options={AUDIO_OPTS} />
          <Select label="OI" value={form.audio_oi} onChange={set("audio_oi")} options={AUDIO_OPTS} />
          <Select label="OD" value={form.audio_od} onChange={set("audio_od")} options={AUDIO_OPTS} />
        </Row>
      </Section>

      <Section title="Conclusión">
        <Row>
          <Select label="Resultado" value={form.resultado} onChange={set("resultado")} options={RESULT_OPTS} />
          <Field label="Lentes visión lejana" value={form.lentesVisionLejana} onChange={set("lentesVisionLejana")} span={2} />
        </Row>
        <Row>
          <Field label="Observación" value={form.observacion} onChange={set("observacion")} span={3} />
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
