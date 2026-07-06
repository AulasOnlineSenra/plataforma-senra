"use client";

import { useEffect, useState } from "react";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string | null;
  avatarUrl?: string | null;
  credits?: number | null;
  tags?: string | null;
  referralCode?: string | null;
  subject?: string | null;
  phone?: string | null;
  cpf?: string | null;
  state?: string | null;
  birthDate?: string | Date | null;
  cep?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
};

type UseUserResult = {
  user: SessionUser | null;
  isLoading: boolean;
  refresh: () => void;
};

export function useUser(): UseUserResult {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchUser();
    return () => { cancelled = true; };
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);

  return { user, isLoading, refresh };
}
