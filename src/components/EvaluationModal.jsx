// src/components/EvaluationModal.jsx
import { useEffect, useMemo, useState } from "react";
import { api, getMe, signWorkOrder } from "../services/api.js";

// === Opciones de selects ===
const RESULT_OPTS = ["Aprobado", "Pendiente", "Reprobado"];
const PSICOTEC_OPTS = ["Preciso", "Alterado", "No aplica"];
const SENSOTEC_OPTS = ["Aprobado", "Reprobado", "No aplica"];
const TRANSV_OPTS = ["Alto", "Medio", "Bajo"];
const LENTES_OPTS = ["No", "Si", "No aplica"];
const LICENCIA_OPTS = ["B", "B/C", "B/D", "A/B/D", "A3/A5/B/D", "A3/B"];
const CATEGORIA_OPTS = ["Categoría Básica", "Categoría Profesional"];

// Para armar URL absoluta en la vista previa (si la firma viene relativa)
const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api$/, "");
const absUrl = (u) => (!u ? "" : (u.startsWith("http") ? u : baseUrl + u));

/**
 * Props:
 *  - open: boolean
 *  - wo: OT ( _id, code, patientName, patientRut, entryDate, customer )
 *  - type?: "rigorous" | "basic"  (este modal es el riguroso)
 *  - onClose: () => void
 *  - onSaved: () => void
 */
export default function EvaluationModal({ open, wo, type = "rigorous", onClose, onSaved }) {
  // Cargar evaluación previa si existe
  const initial = useMemo(() => {
    const ev = wo?.evaluation?.type === "rigorous" ? wo.evaluation : {};
    const fechaIso =
      (ev?.fecha || wo?.entryDate)
        ? new Date(ev?.fecha || wo?.entryDate).toISOString().slice(0, 10)
        : "";

    return {
      // Encabezado / Identificación
      categoria: ev?.categoria || "Categoría Básica",
      ot: wo?.code || "",
      paciente: wo?.patientName || "",
      rutPaciente: wo?.patientRut || "",
      edad: ev?.edad || "",
      licencia: ev?.licencia || "",
      cargo: ev?.cargo || "",
      fecha: ev?.fecha ? new Date(ev.fecha).toISOString().slice(0, 10) : fechaIso,
      cliente: ev?.cliente || wo?.company || wo?.clientName || "",
      rutCliente: ev?.rutCliente || "",
      resultado: ev?.resultado || "Pendiente",

      // Psicotecnia
      p_bimanual: ev?.p_bimanual || "Preciso",
      p_estimulos: ev?.p_estimulos || "Preciso",
      p_monotonia: ev?.p_monotonia || "Preciso",
      p_visomotriz: ev?.p_visomotriz || "Preciso",
      p_atencion: ev?.p_atencion || "Preciso",
      p_anticipacion: ev?.p_anticipacion || "Preciso",

      // Sensotecnia
      s_binocular: ev?.s_binocular || "Aprobado",
      s_od: ev?.s_od || "Aprobado",
      s_oi: ev?.s_oi || "Aprobado",
      s_foria_h: ev?.s_foria_h || "Aprobado",
      s_foria_v: ev?.s_foria_v || "Aprobado",
      s_distancias: ev?.s_distancias || "Aprobado",
      s_colores: ev?.s_colores || "Aprobado",
      s_nocturna: ev?.s_nocturna || "Aprobado",
      s_encandilada: ev?.s_encandilada || "Aprobado",
      s_recuperacion_encand: ev?.s_recuperacion_encand || "Aprobado",
      s_perimetria_od: ev?.s_perimetria_od || "Aprobado",
      s_perimetria_oi: ev?.s_perimetria_oi || "Aprobado",
      s_audicion_od: ev?.s_audicion_od || "Aprobado",
      s_audicion_oi: ev?.s_audicion_oi || "Aprobado",

      // Sueño
      epworth: ev?.epworth || "SIN ALTERACIONES",

      // Transversales
      t_razonamiento: ev?.t_razonamiento || "ALTO",
      t_riesgos: ev?.t_riesgos || "ALTO",
      t_estabilidad: ev?.t_estabilidad || "MEDIO",
      t_relaciones: ev?.t_relaciones || "ALTO",
      t_autocontrol: ev?.t_autocontrol || "MEDIO",
      t_tolerancia: ev?.t_tolerancia || "ALTO",

      // Conclusión
      concl_resultado: ev?.concl_resultado || "Pendiente",
      concl_lentes_lejos: ev?.concl_lentes_lejos || "No",
      concl_observacion: ev?.concl_observacion || "",

      // Firma / validación (metadatos)
      firma: ev?.firma || "",
      firmaRut: ev?.firmaRut || "",
      firmaRsNro: ev?.firmaRsNro || "",
      codigoValidacion: ev?.codigoValidacion || "",
      firmaFecha: ev?.firmaFecha
        ? new Date(ev.firmaFecha).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    };
  }, [wo?._id]); // eslint-disable-line

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Perfil (para tomar la firma ya subida)
  const [me, setMe] = useState(null);
  const [useMySignature, setUseMySignature] = useState(true);

  // Cargar perfil al abrir
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

  if (!open || type !== "rigorous") return null;

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Detectar nombre de campo de firma del perfil (acepta varias variantes)
  const profileSignatureRel =
    me?.signatureUrl || me?.signature || me?.signaturePath || me?.firmaUrl || "";
  const profileSignatureAbs = absUrl(profileSignatureRel);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      // 1) Guardar evaluación
      await api.put(`/workorders/${wo._id}`, {
        type: "rigorous",
        evaluation: {
          type: "rigorous",

          // Identificación
          categoria: form.categoria,
          edad: form.edad || null,
          licencia: form.licencia,
          cargo: form.cargo,
          fecha: form.fecha || null,
          cliente: form.cliente,
          rutCliente: form.rutCliente,
          resultado: form.resultado,

          // Psicotecnia
          p_bimanual: form.p_bimanual,
          p_estimulos: form.p_estimulos,
          p_monotonia: form.p_monotonia,
          p_visomotriz: form.p_visomotriz,
          p_atencion: form.p_atencion,
          p_anticipacion: form.p_anticipacion,

          // Sensotecnia
          s_binocular: form.s_binocular,
          s_od: form.s_od,
          s_oi: form.s_oi,
          s_foria_h: form.s_foria_h,
          s_foria_v: form.s_foria_v,
          s_distancias: form.s_distancias,
          s_colores: form.s_colores,
          s_nocturna: form.s_nocturna,
          s_encandilada: form.s_encandilada,
          s_recuperacion_encand: form.s_recuperacion_encand,
          s_perimetria_od: form.s_perimetria_od,
          s_perimetria_oi: form.s_perimetria_oi,
          s_audicion_od: form.s_audicion_od,
          s_audicion_oi: form.s_audicion_oi,

          // Sueño
          epworth: form.epworth,

          // Transversales
          t_razonamiento: form.t_razonamiento,
          t_riesgos: form.t_riesgos,
          t_estabilidad: form.t_estabilidad,
          t_relaciones: form.t_relaciones,
          t_autocontrol: form.t_autocontrol,
          t_tolerancia: form.t_tolerancia,

          // Conclusión
          concl_resultado: form.concl_resultado,
          concl_lentes_lejos: form.concl_lentes_lejos,
          concl_observacion: form.concl_observacion,

          // Firma (metadatos que aparecen en PDF)
          firma: form.firma,
          firmaRut: form.firmaRut,
          firmaRsNro: form.firmaRsNro,
          codigoValidacion: form.codigoValidacion,
          firmaFecha: form.firmaFecha ? new Date(form.firmaFecha).toISOString() : null,
        },
      });

      // 2) Firmar la OT con la firma ya subida (opcional)
      if (useMySignature && profileSignatureRel) {
        await signWorkOrder(wo._id, {
          type: "rigorous",
          firma: form.firma || me?.name || "",        // nombre visible firmante
          firmaRut: form.firmaRut || me?.rut || "",  // rut firmante si lo tienes en perfil
          firmaFecha: form.firmaFecha
            ? new Date(form.firmaFecha).toISOString()
            : new Date().toISOString(),
          firmaUrl: profileSignatureRel,             // guardamos la ruta relativa
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
              Informe Psicosensotécnico <span className="text-indigo-300">RIGUROSO</span> — {wo?.code || "—"}
            </h2>
            <p className="text-white/60 text-sm">
              Paciente: {wo?.patientName || "—"} • RUT: {wo?.patientRut || "—"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {err && <p className="text-red-300 text-sm">{err}</p>}

          {/* IDENTIFICACIÓN */}
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-white/80 mb-1">Categoría</label>
              <select className="input" value={form.categoria} onChange={e=>update("categoria", e.target.value)}>
                {CATEGORIA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">OT</label>
              <input className="input" value={wo?.code || ""} disabled />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">Fecha</label>
              <input type="date" className="input" value={form.fecha || ""} onChange={e=>update("fecha", e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-white/80 mb-1">Paciente</label>
              <input className="input" value={wo?.patientName || ""} disabled />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">RUT Paciente</label>
              <input className="input" value={wo?.patientRut || ""} disabled />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">Edad</label>
              <input className="input" value={form.edad} onChange={e=>update("edad", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">Tipo Licencia</label>
              <select className="input" value={form.licencia} onChange={e=>update("licencia", e.target.value)}>
                <option value="">—</option>
                {LICENCIA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">Cargo</label>
              <input className="input" value={form.cargo} onChange={e=>update("cargo", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/80 mb-1">Cliente</label>
              <input className="input" value={form.cliente} onChange={e=>update("cliente", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">RUT Cliente</label>
              <input className="input" value={form.rutCliente} onChange={e=>update("rutCliente", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">Resultado (cabecera)</label>
              <select className="input" value={form.resultado} onChange={e=>update("resultado", e.target.value)}>
                {RESULT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* PSICOTÉCNICA */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación Psicotecnia</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                ["Coordinación bimanual", "p_bimanual"],
                ["Reacción a estímulos complejos", "p_estimulos"],
                ["Resistencia a la monotonía", "p_monotonia"],
                ["Coordinación visomotriz", "p_visomotriz"],
                ["Atención y concentración", "p_atencion"],
                ["Capacidad de anticipación", "p_anticipacion"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm text-white/80 mb-1">{label}</label>
                  <select className="input" value={form[key]} onChange={e=>update(key, e.target.value)}>
                    {PSICOTEC_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* SENSOTÉCNICA */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación Sensotecnia</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                ["Agudeza visual visión binocular", "s_binocular"],
                ["Agudeza visual ojo derecho", "s_od"],
                ["Agudeza visual ojo izquierdo", "s_oi"],
                ["Foria visual horizontal", "s_foria_h"],
                ["Foria visual vertical", "s_foria_v"],
                ["Apreciación de distancias", "s_distancias"],
                ["Discriminación de colores", "s_colores"],
                ["Visión nocturna", "s_nocturna"],
                ["Visión encandilada", "s_encandilada"],
                ["Recuperación del encandilamiento", "s_recuperacion_encand"],
                ["Perimetría ojo derecho", "s_perimetria_od"],
                ["Perimetría ojo izquierdo", "s_perimetria_oi"],
                ["Audición oído derecho", "s_audicion_od"],
                ["Audición oído izquierdo", "s_audicion_oi"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm text-white/80 mb-1">{label}</label>
                  <select className="input" value={form[key]} onChange={e=>update(key, e.target.value)}>
                    {SENSOTEC_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* CALIDAD DEL SUEÑO */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-white/80 mb-1">Encuesta de somnolencia Epworth</label>
              <select className="input" value={form.epworth} onChange={e=>update("epworth", e.target.value)}>
                <option>SIN ALTERACIONES</option>
                <option>Alterado</option>
                <option>No aplica</option>
              </select>
            </div>
          </div>

          {/* TRANSVERSALES */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Evaluación y Competencias Transversales</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                ["Razonamiento y comprensión", "t_razonamiento"],
                ["Capacidad de identificar riesgos", "t_riesgos"],
                ["Estabilidad emocional", "t_estabilidad"],
                ["Relaciones laborales", "t_relaciones"],
                ["Autocontrol", "t_autocontrol"],
                ["Tolerancia y adaptación", "t_tolerancia"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm text-white/80 mb-1">{label}</label>
                  <select className="input" value={form[key]} onChange={e=>update(key, e.target.value)}>
                    {TRANSV_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* CONCLUSIÓN */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Conclusión</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-white/80 mb-1">Resultado</label>
                <select className="input" value={form.concl_resultado} onChange={e=>update("concl_resultado", e.target.value)}>
                  {RESULT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">Uso de lentes (visión de lejos)</label>
                <select className="input" value={form.concl_lentes_lejos} onChange={e=>update("concl_lentes_lejos", e.target.value)}>
                  {LENTES_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">Observación</label>
              <textarea className="input h-28" value={form.concl_observacion} onChange={e=>update("concl_observacion", e.target.value)} />
            </div>
          </div>

          {/* FIRMA / VALIDACIÓN */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Firma y Validación</h3>

            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-white/80 mb-1">Profesional (nombre)</label>
                <input className="input" value={form.firma} onChange={e=>update("firma", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">RUT profesional</label>
                <input className="input" value={form.firmaRut} onChange={e=>update("firmaRut", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">RS N°</label>
                <input className="input" value={form.firmaRsNro} onChange={e=>update("firmaRsNro", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">Código de validación</label>
                <input className="input" value={form.codigoValidacion} onChange={e=>update("codigoValidacion", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">Fecha de firma</label>
                <input type="date" className="input" value={form.firmaFecha} onChange={e=>update("firmaFecha", e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  className="scale-110"
                  checked={useMySignature}
                  onChange={(e) => setUseMySignature(e.target.checked)}
                />
                Firmar con mi firma guardada del perfil
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-primary w-auto bg-white/10 hover:bg-white/20"
              onClick={onClose}
            >
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