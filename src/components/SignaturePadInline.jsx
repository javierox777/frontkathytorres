// src/components/SignaturePadInline.jsx
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

/**
 * SignaturePadInline
 * - Mouse/touch
 * - Deshacer, Limpiar
 * - API via ref: isEmpty(), undo(), clear(), getImage()
 *
 * Props:
 *  - width, height
 *  - penWidth, penColor, bgColor
 *  - className
 *  - innerRef (opcional): recibe la API en el padre
 */
export default function SignaturePadInline({
  width = 560,
  height = 160,
  penWidth = 2,
  penColor = "#111",
  bgColor = "#fff",
  className = "",
  innerRef,
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [paths, setPaths] = useState([]);
  const [current, setCurrent] = useState([]);
  const [drawing, setDrawing] = useState(false);

  const dpi = window.devicePixelRatio || 1;

  const paint = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;

    const all = [...paths];
    if (current.length) all.push(current);

    for (const p of all) {
      if (!p.length) continue;
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.stroke();
    }
  }, [bgColor, width, height, penColor, penWidth, paths, current]);

  const setup = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = Math.floor(width * dpi);
    c.height = Math.floor(height * dpi);
    c.style.width = width + "px";
    c.style.height = height + "px";
    const ctx = c.getContext("2d");
    ctx.scale(dpi, dpi);
    ctxRef.current = ctx;
    paint();
  }, [width, height, dpi, paint]);

  const getXY = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0];
    const clientX = t ? t.clientX : e.clientX;
    const clientY = t ? t.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onDown = (e) => {
    e.preventDefault();
    setDrawing(true);
    const { x, y } = getXY(e);
    setCurrent([{ x, y }]);
  };
  const onMove = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    setCurrent((p) => [...p, { x, y }]);
  };
  const onUp = (e) => {
    e.preventDefault();
    if (!drawing) return;
    setDrawing(false);
    setPaths((p) => [...p, current]);
    setCurrent([]);
  };

  useEffect(() => {
    setup();
  }, [setup]);

  useEffect(() => {
    paint();
  }, [paint]);

  const api = useMemo(() => ({
    clear() {
      setPaths([]);
      setCurrent([]);
      paint();
    },
    undo() {
      setPaths((p) => {
        const n = [...p];
        n.pop();
        return n;
      });
    },
    isEmpty() {
      return paths.length === 0;
    },
    async getImage(type = "image/png", quality = 0.95) {
      const dataUrl = canvasRef.current.toDataURL(type, quality);
      const blob = await (await fetch(dataUrl)).blob();
      return { blob, dataUrl };
    },
  }), [paths, paint]);

  useEffect(() => {
    if (innerRef) innerRef.current = api;
    return () => {
      if (innerRef) innerRef.current = null;
    };
  }, [innerRef, api]);

  return (
    <div className={className}>
      <div className="bg-white rounded-xl p-2">
        <canvas
          ref={canvasRef}
          style={{ width, height, borderRadius: 12, touchAction: "none", cursor: "crosshair" }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button type="button" className="btn-primary w-auto px-3 py-2 bg-white/10 hover:bg-white/20" onClick={() => api.undo()}>
          Deshacer
        </button>
        <button type="button" className="btn-primary w-auto px-3 py-2 bg-red-600 hover:bg-red-700" onClick={() => api.clear()}>
          Limpiar
        </button>
      </div>
    </div>
  );
}
