"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { getUserById } from "@/app/actions/users";

export function PendingProfileBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const stored = localStorage.getItem("currentUser");
        if (!stored) return;

        const user = JSON.parse(stored);
        if (user?.role !== "teacher") return;

        // Busca o status atualizado direto do banco
        const result = await getUserById(user.id);
        if (!result.success || !result.data) return;

        if (result.data.status === "pending") {
          setVisible(true);
        } else {
          // Se foi aprovado, garante que o banner some
          setVisible(false);
        }
      } catch {}
    };

    check();

    // Verifica a cada 10s — assim que admin aprovar, banner some
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Aluno, admin ou qualquer outro → invisível, sem renderizar nada
  if (!visible) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        borderBottom: "2px solid #f5b000",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Ícone */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #f5b000 0%, #e6a000 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={16} color="#fff" />
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#92650a",
            marginRight: "6px",
          }}
        >
          Conta em análise.
        </span>
        <span style={{ fontSize: "16px", color: "#b07800", fontWeight: 500 }}>
          Seu perfil está sendo revisado pelo administrador. Você receberá
          acesso completo assim que for aprovado.
        </span>
      </div>
    </div>
  );
}
