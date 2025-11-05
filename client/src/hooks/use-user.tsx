import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  nome: string;
  plano: string;
  is_admin: string;
  data_expiracao_plano?: string;
  status?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAdmin = user?.is_admin === "true" || user?.is_admin === true;

  const refreshUser = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  // Verificar bloqueio periodicamente (a cada 5 minutos)
  useEffect(() => {
    if (!user) return;

    const checkBlocked = async () => {
      try {
        const response = await fetch("/api/user/check-blocked", {
          headers: {
            "x-user-id": user.id,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isBlocked && user.status !== "bloqueado") {
            // Atualizar status do usuário para bloqueado
            const updatedUser = { ...user, status: "bloqueado" };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar bloqueio:", error);
      }
    };

    // Verificar imediatamente
    checkBlocked();

    // Verificar a cada 5 minutos
    const interval = setInterval(checkBlocked, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    const updatedUser = { ...user, ...userData } as User;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return { user, login, logout, updateUser };
}