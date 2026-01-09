import { Outlet, Link, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isSignin = pathname.includes("signin");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative">
      {/* Blobs decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative glass w-full max-w-md rounded-3xl p-8">
        {/* Encabezado */}
        <div className="mb-6 text-center">
          {/* Logo en lugar del ícono ⚡ */}
          <div className="mx-auto mb-3 inline-flex items-center justify-center">
            <img
              src="/logo_kyd.png"
              alt="K&D Consultores Psicolaborales"
              className="h-20 w-auto"
              loading="eager"
              decoding="async"
            />
          </div>
          <h1
            className="text-3xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: "Poppins, Inter" }}
          >
           
          </h1>
        
        </div>

        {/* Aquí van los formularios */}
        <Outlet />

        {/* Switch signin/signup */}
        <div className="mt-6 text-center">
          {isSignin ? (
            <p className="text-white/70">
              ¿No tienes cuenta?{" "}
              <Link className="text-indigo-400 hover:underline" to="/signup">
                Regístrate
              </Link>
            </p>
          ) : (
            <p className="text-white/70">
              ¿Ya tienes cuenta?{" "}
              <Link className="text-indigo-400 hover:underline" to="/signin">
                Inicia sesión
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
