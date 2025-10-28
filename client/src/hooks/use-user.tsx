import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  nome: string;
  plano?: string;
  is_admin?: string;
  tipo?: "usuario" | "funcionario";
  conta_id?: string;
  cargo?: string;
  data_expiracao_trial?: string | null;
  data_expiracao_plano?: string | null;
  permissoes?: string[];
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  return { user };
}
