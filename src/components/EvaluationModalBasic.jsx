// src/components/EvaluationModalBasic.jsx
import { useEffect, useMemo, useState } from "react";
import { api, getMe, signWorkOrder } from "../services/api.js";

// Opciones
const APROBADO = ["Aprobado", "Reprobado", "No aplica"];
const AUDIO_OPTS = ["Aprobado", "Alterado"];
const NORMAL_APROB = ["Normal", "Aprobado", "No aplica"];
const SI_NO = ["Si", "No", "No aplica"];
const RESULTADO_FINAL = ["Aprobado", "Pendiente", "Rechazado"];
// Requerimiento cliente: licencias A1–D (mantener B como default)
const LICENCIA_OPTS = ["A1", "A2", "A3", "A4", "A5", "B", "C", "D"];
// Psicologia: evaluacion y competencias transversales (requerimiento cliente)
const PSY_NIVEL_OPTS = ["ALTO", "MEDIO", "BAJO", "NO APLICA"];
const DEFAULT_PSY_COMPETENCIAS = {
  razonamiento: "ALTO",
  identificar_riesgos: "ALTO",
  estabilidad_emocional: "ALTO",
  relaciones_laborales: "ALTO",
  autocontrol: "ALTO",
  tolerancia_adaptacion: "ALTO",
};


// para armar URL absoluta si la firma viene relativa (/uploads/xx.png)
const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api$/, "");
const absUrl = (u) => {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return baseUrl + u;
};

export default function EvaluationModalBasic({ open, wo, onClose, onSaved }) {
  // 1) Cargar evaluación previa (si existe)
  const initial = useMemo(() => {
    const ev = wo?.evaluation?.type === "basic" ? wo.evaluation : {};
    const fechaIso =
      (ev?.fechaEvaluacion || wo?.entryDate)
        ? new Date(ev?.fechaEvaluacion || wo?.entryDate).toISOString().slice(0,10)
        : "";

    return {
      // Identificación
      nombre: wo?.patientName || "",
      rut: wo?.patientRut || "",
      edad: ev?.edad || "",
      cargo: ev?.cargo || "",
      empresa: wo?.customer?.name || ev?.empresa || "",
      licencia: ev?.licencia || "B",
      vigenciaLicencia: ev?.vigenciaLicencia || "",
      fechaEvaluacion: fechaIso,
      vigenciaEvaluacion: ev?.vigenciaEvaluacion || "",

      // Psicométrica
      psi_palancas: ev?.psi_palancas || "Aprobado",
      psi_punteado: ev?.psi_punteado || "Aprobado",
      psi_reactimetria: ev?.psi_reactimetria || "Aprobado",
      psi_observaciones:
        ev?.psi_observaciones ||
        "Las evaluaciones psicométricas se presentan dentro de los parámetros normales de funcionamiento.",

      // Optométrica
      opt_av_lejos: ev?.opt_av_lejos || "Aprobado",
      opt_colores: ev?.opt_colores || "Aprobado",
      opt_profundidad: ev?.opt_profundidad || "Aprobado",
      opt_foria: ev?.opt_foria || "Aprobado",
      opt_nocturna: ev?.opt_nocturna || "Aprobado",
      opt_encandilamiento: ev?.opt_encandilamiento || "Aprobado",
      opt_recup_encand: ev?.opt_recup_encand || "Aprobado (1,56 segs)",
      opt_perimetria: ev?.opt_perimetria || "Normal",
      opt_lentes: ev?.opt_lentes || "Si",
      opt_observaciones: ev?.opt_observaciones || "Cumple con DS 170.-",

      // Audiométrica
      aud_ambos: ev?.aud_ambos || "Aprobado",
      aud_izquierdo: ev?.aud_izquierdo || "Aprobado",
      aud_derecho: ev?.aud_derecho || "Aprobado",
      aud_observaciones: ev?.aud_observaciones || "Cumple con DS 170.-",
      // Psicologica: Evaluacion y competencias transversales
      psy_competencias: ev?.psy_competencias || DEFAULT_PSY_COMPETENCIAS,
      psy_observaciones:
        ev?.psy_observaciones ||
        "La evaluacion psicologica se presenta dentro de los limites normales de funcionamiento. No existen indicadores de trastorno psicologico asociado.",

      // Sueño
      sleep_epworth: ev?.sleep_epworth || "Normal",
      sleep_observaciones: ev?.sleep_observaciones || "No presenta alteraciones del sueño.",

      // Conclusión
      concl_resultado: ev?.concl_resultado || "Aprobado",
      concl_texto:
        ev?.concl_texto ||
        "Las evaluaciones psicosensométricas, psicológicas y de sueño se presentan dentro de parámetros normales de funcionamiento. Por lo tanto, desde el punto de vista psicosensomotriz no presenta contraindicaciones para conducir vehículo liviano. Este informe representa idoneidad sólo para el desempeño de las tareas de conducción y tiene validez de cuatro años.",

      // Datos de texto de la firma que salen impresos
      firma_nombre: ev?.firma_nombre || "KATHERINE TORRES CARRAZANA",
      firma_cargo: ev?.firma_cargo || "PSICÓLOGA LIC. EN PSICOLOGÍA",
      firma_registro: ev?.firma_registro || "REG. SNS N°347878",

      // Metadatos de firma electrónica
      firmaRut: ev?.firmaRut || "",
      firmaFecha: ev?.firmaFecha ? new Date(ev.firmaFecha).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    };
  }, [wo?._id]); // eslint-disable-line

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // 2) Traer la firma del usuario actual (ya subida)
  const [me, setMe] = useState(null);
  const [useMySignature, setUseMySignature] = useState(true); // usar mi firma guardada
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await getMe();
        setMe(data || null);
      } catch {
        setMe(null);
      }
    })();
  }, [open]);

  useEffect(() => {
    setForm(initial);
    setErr("");
    setSaving(false);
  }, [initial, open]);

  if (!open) return null;

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // extrae una URL de firma válida desde el perfil (cubre varios nombres posibles)
  const profileSignatureRel =
    me?.signatureUrl || me?.signature || me?.signaturePath || me?.firmaUrl || "";
  const profileSignatureAbs = absUrl(profileSignatureRel);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      // 1) Guardar evaluación básica
      await api.put(`/workorders/${wo._id}`, {
        evaluation: { type: "basic", ...form },
      });

      // 2) Firmar OT con la firma YA SUBIDA (si el usuario activó el switch)
      if (useMySignature && profileSignatureAbs) {
        await signWorkOrder(wo._id, {
          type: "basic",
          firma: form.firma_nombre || "",
          firmaRut: form.firmaRut || "",
          firmaFecha: form.firmaFecha ? new Date(form.firmaFecha).toISOString() : new Date().toISOString(),
          firmaUrl: profileSignatureRel, // guardamos relativa, el PDF la mostrará como baseUrl+rel
        });
      }

      onSaved?.();
      onClose?.();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass w-full max-w-5xl rounded-3xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Informe Psicosensotécnico <span className="text-indigo-300">BÁSICO</span> — {wo?.code || "—"}
            </h2>
            <p className="text-white/60 text-sm">
              Paciente: {wo?.patientName || "—"} • RUT: {wo?.patientRut || "—"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {err && <p className="text-red-300 text-sm">{err}</p>}

          {/* IDENTIFICACIÓN */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Datos de identificación</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <Input label="Nombre" value={form.nombre} onChange={(v)=>update("nombre", v)} className="md:col-span-2" />
              <Input label="Rut" value={form.rut} onChange={(v)=>update("rut", v)} />
              <Input label="Edad" value={form.edad} onChange={(v)=>update("edad", v)} />
              <Input label="Cargo" value={form.cargo} onChange={(v)=>update("cargo", v)} />
              <Input label="Empresa" value={form.empresa} onChange={(v)=>update("empresa", v)} className="md:col-span-2" />
              <Select label="Licencia de conducir" value={form.licencia} onChange={(v)=>update("licencia", v)} options={LICENCIA_OPTS} />
              <Input type="date" label="Vigencia licencia" value={form.vigenciaLicencia} onChange={(v)=>update("vigenciaLicencia", v)} />
              <Input type="date" label="Fecha de evaluación" value={form.fechaEvaluacion} onChange={(v)=>update("fechaEvaluacion", v)} />
              <Input type="date" label="Vigencia evaluación" value={form.vigenciaEvaluacion} onChange={(v)=>update("vigenciaEvaluacion", v)} />
            </div>
          </section>

          {/* EVALUACIÓN PSICOMÉTRICA */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación psicométrica</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <Select label="Test de Palancas" value={form.psi_palancas} onChange={(v)=>update("psi_palancas", v)} options={APROBADO} />
              <Select label="Test de Punteado" value={form.psi_punteado} onChange={(v)=>update("psi_punteado", v)} options={APROBADO} />
              <Select label="Test de Reactimetría" value={form.psi_reactimetria} onChange={(v)=>update("psi_reactimetria", v)} options={APROBADO} />
            </div>
            <Textarea label="Observaciones" value={form.psi_observaciones} onChange={(v)=>update("psi_observaciones", v)} />
          </section>

          {/* EVALUACIÓN OPTOMÉTRICA */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación optométrica</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <Select label="Agudeza visual (lejos)" value={form.opt_av_lejos} onChange={(v)=>update("opt_av_lejos", v)} options={APROBADO} />
              <Select label="Discriminación de colores" value={form.opt_colores} onChange={(v)=>update("opt_colores", v)} options={APROBADO} />
              <Select label="Visión de profundidad" value={form.opt_profundidad} onChange={(v)=>update("opt_profundidad", v)} options={APROBADO} />
              <Select label="Foria visual" value={form.opt_foria} onChange={(v)=>update("opt_foria", v)} options={APROBADO} />
              <Select label="Visión nocturna" value={form.opt_nocturna} onChange={(v)=>update("opt_nocturna", v)} options={APROBADO} />
              <Select label="Reacción al encandilamiento" value={form.opt_encandilamiento} onChange={(v)=>update("opt_encandilamiento", v)} options={APROBADO} />
              <Input  label="Recuperación al encandilamiento" value={form.opt_recup_encand} onChange={(v)=>update("opt_recup_encand", v)} placeholder="Ej: Aprobado (1,56 segs)" />
              <Select label="Perimetría 55°-75°-85°" value={form.opt_perimetria} onChange={(v)=>update("opt_perimetria", v)} options={NORMAL_APROB} />
              <Select label="Uso de lentes ópticos" value={form.opt_lentes} onChange={(v)=>update("opt_lentes", v)} options={SI_NO} />
            </div>
            <Textarea label="Observaciones" value={form.opt_observaciones} onChange={(v)=>update("opt_observaciones", v)} />
          </section>

          {/* EVALUACIÓN AUDIOMÉTRICA */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación audiométrica</h3>
            <p className="text-xs text-white/60">
              Frecuencias: 500 / 1000 / 2000 Hz · Umbral 40 dB (ambos, izquierdo, derecho)
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <Select label="Ambos oídos" value={form.aud_ambos} onChange={(v)=>update("aud_ambos", v)} options={AUDIO_OPTS} />
              <Select label="Oído izquierdo" value={form.aud_izquierdo} onChange={(v)=>update("aud_izquierdo", v)} options={AUDIO_OPTS} />
              <Select label="Oído derecho" value={form.aud_derecho} onChange={(v)=>update("aud_derecho", v)} options={AUDIO_OPTS} />
            </div>
            <Textarea label="Observaciones" value={form.aud_observaciones} onChange={(v)=>update("aud_observaciones", v)} />
          </section>

          {/* EVALUACIÓN PSICOLÓGICA */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación psicológica</h3>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs font-semibold text-white/80 mb-2">
                EVALUACIÓN Y COMPETENCIAS TRANSVERSALES
              </div>

              <div className="grid gap-2">
                {[
                  ["Razonamiento y comprensión", "razonamiento"],
                  ["Capacidad de identificar riesgos", "identificar_riesgos"],
                  ["Estabilidad emocional", "estabilidad_emocional"],
                  ["Relaciones laborales", "relaciones_laborales"],
                  ["Autocontrol", "autocontrol"],
                  ["Tolerancia y adaptación", "tolerancia_adaptacion"],
                ].map(([label, key]) => (
                  <div key={key} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-9 text-sm text-white/80">{label}:</div>
                    <div className="col-span-3">
                      <Select
                        label=""
                        value={(form.psy_competencias || {})[key] || "ALTO"}
                        onChange={(v) =>
                          setForm((prev) => ({
                            ...prev,
                            psy_competencias: { ...(prev.psy_competencias || {}), [key]: v },
                          }))
                        }
                        options={PSY_NIVEL_OPTS}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Textarea label="Observaciones" value={form.psy_observaciones} onChange={(v)=>update("psy_observaciones", v)} />
          </section>


          {/* EVALUACIÓN DE SUEÑO */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación de sueño</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <Select label="Somnolencia (Epworth)" value={form.sleep_epworth} onChange={(v)=>update("sleep_epworth", v)} options={["Normal","Alterado","No aplica"]} />
            </div>
            <Textarea label="Observaciones" value={form.sleep_observaciones} onChange={(v)=>update("sleep_observaciones", v)} />
          </section>

          {/* CONCLUSIÓN */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Conclusión</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <Select label="Resultado" value={form.concl_resultado} onChange={(v)=>update("concl_resultado", v)} options={RESULTADO_FINAL} />
            </div>
            <Textarea label="Texto de conclusión" value={form.concl_texto} onChange={(v)=>update("concl_texto", v)} />
          </section>

          {/* FIRMA: usar firma guardada */}
          <section className="space-y-3">
            <h3 className="font-semibold text-white">Firma</h3>

            <div className="grid md:grid-cols-4 gap-3">
              <Input label="Profesional (nombre)" value={form.firma_nombre} onChange={(v)=>update("firma_nombre", v)} />
              <Input label="RUT profesional" value={form.firmaRut} onChange={(v)=>update("firmaRut", v)} />
              <Input label="Cargo" value={form.firma_cargo} onChange={(v)=>update("firma_cargo", v)} />
              <Input label="Registro SNS" value={form.firma_registro} onChange={(v)=>update("firma_registro", v)} />
              <Input type="date" label="Fecha de firma" value={form.firmaFecha} onChange={(v)=>update("firmaFecha", v)} />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  className="scale-110"
                  checked={useMySignature}
                  onChange={(e) => setUseMySignature(e.target.checked)}
                />
                Usar mi firma guardada del perfil
              </label>
              {useMySignature && profileSignatureAbs && (
                <img
                  src={profileSignatureAbs}
                  alt="firma guardada"
                  className="h-16 object-contain bg-white/90 rounded border border-white/20 px-2 py-1"
                />
              )}
              {useMySignature && !profileSignatureAbs && (
                <span className="text-amber-300 text-sm">
                  No se encontró una firma en tu perfil.
                </span>
              )}
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-primary w-auto bg-white/10 hover:bg-white/20" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary w-auto" disabled={saving}>
              {saving ? "Guardando…" : "Guardar (y firmar si está activado)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Helpers UI ===== */
function Input({ label, value, onChange, className = "", ...p }) {
  return (
    <div className={className}>
      <label className="block text-sm text-white/80 mb-1">{label}</label>
      <input className="input" value={value ?? ""} onChange={(e)=>onChange(e.target.value)} {...p} />
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm text-white/80 mb-1">{label}</label>
      <select className="input" value={value} onChange={(e)=>onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Textarea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-white/80 mb-1">{label}</label>
      <textarea className="input h-28" value={value ?? ""} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}