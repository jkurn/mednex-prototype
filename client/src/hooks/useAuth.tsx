import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "analis" | "kepala" | "manajer" | "admin";

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PROFILES: Record<UserRole, { name: string; username: string }> = {
  analis: { name: "Dewi Analis", username: "dewi@mednex.id" },
  kepala: { name: "Pak Rahman", username: "rahman@mednex.id" },
  manajer: { name: "Ibu Kartini", username: "kartini@mednex.id" },
  admin: { name: "Admin System", username: "admin@mednex.id" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("strator_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Auto-login as Analis for prototype
      const defaultUser: User = {
        id: "demo-analis-1",
        username: "dewi@mednex.id",
        name: "Dewi Analis",
        role: "analis",
      };
      setUser(defaultUser);
      localStorage.setItem("strator_user", JSON.stringify(defaultUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const defaultUser: User = {
      id: "demo-analis-1",
      username: email,
      name: "Dewi Analis",
      role: "analis",
    };
    setUser(defaultUser);
    localStorage.setItem("strator_user", JSON.stringify(defaultUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("strator_user");
  };

  const switchRole = (role: UserRole) => {
    const profile = ROLE_PROFILES[role];
    const newUser: User = {
      id: `demo-${role}-1`,
      username: profile.username,
      name: profile.name,
      role,
    };
    setUser(newUser);
    localStorage.setItem("strator_user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
