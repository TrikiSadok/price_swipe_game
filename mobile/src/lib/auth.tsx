// Who is signed in, shared with every screen. status: loading -> signedOut | ready
import { createContext, useCallback, useContext, useEffect, useMemo, useState,
         type ReactNode } from "react";
import { api, loadToken, post, saveToken, setUnauthorizedHandler } from "./api";

type AuthState = {
  status: "loading" | "signedOut" | "ready";
  username: string | null;
  signIn: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [username, setUsername] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    await saveToken(null);
    setUsername(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    void (async () => {
      try {
        if (!(await loadToken())) throw new Error("no token");
        const me = await api<{ username: string }>("/me");
        setUsername(me.username);
        setStatus("ready");
      } catch {
        setStatus("signedOut");
      }
    })();
  }, [signOut]);

  const signIn = useCallback(async (name: string) => {
    const res = await post<{ token: string; username: string }>("/auth/login", { username: name });
    await saveToken(res.token);
    setUsername(res.username);
    setStatus("ready");
  }, []);

  const value = useMemo(() => ({ status, username, signIn, signOut }),
    [status, username, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
