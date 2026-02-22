import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  tokenStore,
  type User,
  type LoginRequest,
} from "@cannasaas/api-client";
import { useNavigate } from "react-router-dom";

interface AuthContextValue {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: user, isLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Listen for session-expired events from the Axios interceptor
  useEffect(() => {
    const handler = () => {
      navigate("/login", { replace: true });
    };
    window.addEventListener("cannasaas:session-expired", handler);
    return () =>
      window.removeEventListener("cannasaas:session-expired", handler);
  }, [navigate]);

  const login = useCallback(
    async (creds: LoginRequest) => {
      await loginMutation.mutateAsync(creds);
    },
    [loginMutation],
  );

  const logout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    });
  }, [logoutMutation, navigate]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
