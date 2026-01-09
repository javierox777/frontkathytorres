import { useEffect, useState } from "react";
import { attachToken } from "../services/api";
import { getMe, uploadMySignature } from "../services/api";

export default function Admin() {
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    attachToken(token);
    getMe().then(({ data }) => setMe(data)).catch(() => { });
  }, []);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setMsg("");
    try {
      const { data } = await uploadMySignature(f);
      setMe(data.user);
      setMsg("Firma actualizada ✅");
    } catch (err) {
      console.error(err);
      setMsg("Error al subir firma");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-2">Panel Admin</h2>
        <p className="text-white/80">Solo usuarios con rol <b>admin</b>.</p>
      </div>

      <div className="glass rounded-3xl p-6 space-y-3">
        <h3 className="font-semibold">Mi firma digital</h3>
        <p className="text-white/70 text-sm">Imagen PNG/JPG/WEBP (máx. 2MB).</p>

        {me?.signatureUrl ? (
          <div className="bg-white rounded-xl p-3">
            <img
              src={me.signatureUrl.startsWith("http") ? me.signatureUrl : (import.meta.env.VITE_API_URL || "").replace(/\/api$/, "") + me.signatureUrl}
              alt="firma"
              style={{ height: 120, objectFit: "contain" }}
            />
          </div>
        ) : (
          <p className="text-white/60 text-sm">Aún no has subido tu firma.</p>
        )}

        <label className="btn-primary w-fit cursor-pointer">
          {busy ? "Subiendo..." : "Subir / Cambiar firma"}
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
        {msg && <p className="text-sm text-white/80">{msg}</p>}
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-semibold mb-1">Usuarios</h3>
        <p className="text-white/70 text-sm">Aquí podrías listar/gestionar usuarios.</p>
      </div>
    </div>
  );
}
