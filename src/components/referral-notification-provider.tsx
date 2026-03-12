"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Gift, Sparkles, UserPlus, X } from "lucide-react";
import { getMockUser } from "@/lib/data";
import { getUserNotifications } from "@/app/actions/users";
import { User } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;
const TOAST_DURATION_MS = 20000; // 20 segundos visível

interface ReferralToast {
  id: string;
  message: string;
}

function ReferralToastItem({
  toast,
  onClose,
}: {
  toast: ReferralToast;
  onClose: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), 400);
  }, [toast.id, onClose]);

  useEffect(() => {
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION_MS) * 100);
      setProgress(remaining);
      if (remaining > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleClose, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <>
      <style>{`
        @keyframes rn-slideIn {
          from { opacity: 0; transform: translateX(110%) scale(0.88); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes rn-slideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(110%) scale(0.88); }
        }
        @keyframes rn-pulse {
          0%,100% { box-shadow: 0 4px 14px rgba(255,193,7,0.45); }
          50%      { box-shadow: 0 4px 24px rgba(255,152,0,0.75); }
        }
        @keyframes rn-shimmer {
          0%   { transform: translateX(-100%) rotate(20deg); }
          100% { transform: translateX(600%) rotate(20deg); }
        }
        .rn-close:hover { color: #374151 !important; background: #F3F4F6 !important; }
      `}</style>

      <div
        style={{
          animation: exiting
            ? "rn-slideOut 0.4s cubic-bezier(0.4,0,1,1) forwards"
            : "rn-slideIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
          background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
          borderRadius: "20px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(255,193,7,0.18)",
          border: "1px solid rgba(255,193,7,0.25)",
          overflow: "hidden",
          position: "relative",
          width: "340px",
          maxWidth: "calc(100vw - 48px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "5px",
            background: "linear-gradient(180deg, #FFC107 0%, #FF9800 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius: "20px",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-20%",
              width: "40px",
              height: "200%",
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)",
              animation: "rn-shimmer 3s ease-in-out 0.6s 1",
            }}
          />
        </div>

        <div style={{ padding: "18px 16px 14px 22px" }}>
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #FFC107 0%, #FF9800 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                animation: "rn-pulse 2s ease-in-out infinite",
              }}
            >
              <Gift size={22} color="#fff" />
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: "2px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  marginBottom: "5px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "#B45309",
                  }}
                >
                  Nova Indicação!
                </span>
                <Sparkles size={12} color="#FFC107" />
              </div>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#374151",
                  lineHeight: 1.55,
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {toast.message}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  marginTop: "8px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "rgba(5,150,105,0.08)",
                  border: "1px solid rgba(5,150,105,0.18)",
                }}
              >
                <UserPlus size={11} color="#059669" />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#059669",
                    fontWeight: 700,
                  }}
                >
                  Código utilizado com sucesso
                </span>
              </div>
            </div>

            <button
              className="rn-close"
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                flexShrink: 0,
                marginTop: "2px",
                transition: "color 0.15s, background 0.15s",
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ height: "3px", background: "#F3F4F6" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FFC107, #FF9800)",
              transition: "width 0.1s linear",
              borderRadius: "0 2px 2px 0",
            }}
          />
        </div>
      </div>
    </>
  );
}

export function ReferralNotificationProvider() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ReferralToast[]>([]);
  const shownIdsRef = useRef<Set<string>>(
    new Set(JSON.parse(localStorage.getItem("rn-shown-ids") ?? "[]")),
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    setCurrentUser(stored ? JSON.parse(stored) : getMockUser("student"));
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const check = async () => {
      const response = await getUserNotifications(currentUser.id);
      if (!response.success || !response.data) return;

      const newReferrals = (response.data as any[]).filter(
        (n) => n.type === "REFERRAL" && !shownIdsRef.current.has(n.id),
      );

      if (newReferrals.length === 0) return;

      const incoming: ReferralToast[] = newReferrals.map((n) => {
        shownIdsRef.current.add(n.id);
        return { id: n.id, message: n.message };
      });

      localStorage.setItem(
        "rn-shown-ids",
        JSON.stringify(Array.from(shownIdsRef.current)),
      );

      setToasts((prev) => [...prev, ...incoming]);
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ReferralToastItem toast={t} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}
