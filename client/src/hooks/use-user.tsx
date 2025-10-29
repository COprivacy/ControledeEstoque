
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  nome: string;
  plano: string;
  is_admin: string;
  data_expiracao_trial?: string;
  data_expiracao_plano?: string;
  tipo?: string;
  conta_id?: string;
  cargo?: string;
  permissoes?: any;
  status?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const queryClient = useQueryClient();

  // Query para buscar dados atualizados do usuário
  const { data: updatedUser } = useQuery({
    queryKey: ["/api/users", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch("/api/users");
      if (!response.ok) return null;
      const users = await response.json();
      return users.find((u: User) => u.id === user.id) || null;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Recarrega a cada 30 segundos
    refetchOnWindowFocus: true,
  });

  // Atualizar o user quando os dados mudarem
  useEffect(() => {
    if (updatedUser && user?.id === updatedUser.id) {
      // Manter alguns campos do user atual que não vêm da API
      const mergedUser = {
        ...updatedUser,
        tipo: user.tipo,
        conta_id: user.conta_id,
        cargo: user.cargo,
        permissoes: user.permissoes,
      };

      // Só atualizar se houver mudanças
      if (JSON.stringify(user) !== JSON.stringify(mergedUser)) {
        setUserState(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
      }
    }
  }, [updatedUser, user]);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    await queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
  };

  const logout = () => {
    setUser(null);
    queryClient.clear();
    window.location.href = "/login";
  };

  const isAdmin = user?.is_admin === "true";

  return (
    <UserContext.Provider value={{ user, setUser, logout, isAdmin, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}
