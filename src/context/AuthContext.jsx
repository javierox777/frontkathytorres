import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { attachToken } from "../services/api.js";
import { jwtDecode } from "jwt-decode";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  // ...
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      attachToken(token);              // 👈 asegura header Authorization
      try {
        const payload = jwtDecode(token);
        setUser((prev) => prev || { _id: payload._id, role: payload.role, email: payload.email, name: payload.name });
      } catch (e) {
        console.error(e);
        // ignore invalid token
      }
    } else {
      localStorage.removeItem("token");
      attachToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const isAuthenticated = useMemo(() => {
    if (!token) return false;
    try {
      const { exp } = jwtDecode(token);
      return !exp || exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }, [token]);

  const logout = () => {
    setToken("");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ token, setToken, user, setUser, isAuthenticated, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthCtx);
