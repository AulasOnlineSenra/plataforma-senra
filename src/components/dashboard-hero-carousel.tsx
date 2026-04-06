"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import {
  Cake,
  BookOpen,
  CalendarCheck,
  Bell,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────── */

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
};

type LessonItem = {
  id: string;
  subject: string;
  status: string;
  date: string | Date;
  student?: { name: string } | null;
  teacher?: { name: string } | null;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
};

type TypewriterSlide = {
  icon: React.ElementType;
  label: string;
  text: string;
  href?: string;
};

/* ── Helpers ───────────────────────────────────────── */

function isBirthdayToday(birthDate: string | Date | null | undefined): boolean {
  if (!birthDate) return false;
  const bd = new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return false;
  const now = new Date();
  return bd.getUTCDate() === now.getUTCDate() && bd.getUTCMonth() === now.getUTCMonth();
}

/* ── Custom Hook: useTypewriter ────────────────────── */

function useTypewriter(slides: TypewriterSlide[], pauseDuration = 3000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "fading">("typing");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeIndex = slides.length > 0 ? currentIndex % slides.length : 0;
  const currentSlide = slides[safeIndex] ?? null;
  const currentText = currentSlide?.text ?? "";

  useEffect(() => {
    if (slides.length === 0) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (phase === "typing") {
      if (charCount < currentText.length) {
        timeoutRef.current = setTimeout(() => {
          setCharCount((c) => c + 1);
        }, 40);
      } else {
        timeoutRef.current = setTimeout(() => setPhase("fading"), pauseDuration);
      }
    } else if (phase === "pausing") {
      timeoutRef.current = setTimeout(() => setPhase("fading"), pauseDuration);
    } else if (phase === "fading") {
      timeoutRef.current = setTimeout(() => {
        setCharCount(0);
        setCurrentIndex((i) => (i + 1) % slides.length);
        setPhase("typing");
      }, 600);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, charCount, currentText, slides.length, currentIndex, pauseDuration]);

  // Reset when slides change (data refresh)
  useEffect(() => {
    setCurrentIndex(0);
    setCharCount(0);
    setPhase("typing");
  }, [slides.length]);

  const displayedText = currentText.slice(0, charCount);
  const totalSlides = slides.length;
  const opacity = phase === "fading" ? 0 : 1;

  return { currentSlide, displayedText, opacity, currentIndex: safeIndex, totalSlides };
}

/* ── Blinking Cursor ───────────────────────────────── */

function Cursor() {
  return (
    <span
      className="inline-block w-[2px] h-5 bg-[#FFC107] ml-0.5 align-middle"
      style={{ animation: "blink 0.8s step-end infinite" }}
    />
  );
}

/* ── Main Component ────────────────────────────────── */

export function DashboardHeroCarousel({
  userName,
  birthDate,
  lessons,
  blogPosts,
  notifications,
  userRole,
}: {
  userName: string;
  birthDate?: string | Date | null;
  lessons: LessonItem[];
  blogPosts: BlogPost[];
  notifications: NotificationItem[];
  userRole: string;
}) {
  const { theme, setTheme } = useTheme();
  const now = useMemo(() => new Date(), []);
  const [isHovered, setIsHovered] = useState(false);
  const isTeacher = userRole === "teacher";
  const isAdmin = userRole === "admin";
  const isDark = theme === "dark";

  const slides: TypewriterSlide[] = useMemo(() => {
    const result: TypewriterSlide[] = [];

    // 1. Boas-vindas
    result.push({
      icon: Sparkles,
      label: "BOAS-VINDAS",
      text: `Bem-vindo(a), ${userName}! Seu painel em tempo real está conectado ao banco de dados.`,
    });

    // 2. Aniversário (condicional)
    if (isBirthdayToday(birthDate)) {
      result.push({
        icon: Cake,
        label: "ANIVERSÁRIO",
        text: `Feliz aniversário, ${userName}! Que esse novo ciclo seja cheio de conquistas, evolução e muitos resultados. Conte com a gente rumo a resultados cada vez maiores!`,
      });
    }

    // 3. Posts do blog (até 4)
    const publishedPosts = blogPosts.filter((p) => p.excerpt).slice(0, 4);
    for (const post of publishedPosts) {
      result.push({
        icon: BookOpen,
        label: "NOVO POST",
        text: `${post.title} — ${post.excerpt}`,
        href: `/blog/${post.id}`,
      });
    }

    // 4. Próximas aulas (até 3)
    const upcomingLessons = lessons
      .filter(
        (l) =>
          ["PENDING", "CONFIRMED"].includes(l.status) &&
          new Date(l.date) >= now,
      )
      .slice(0, 3);

    for (const lesson of upcomingLessons) {
      const personName = isAdmin
        ? lesson.student?.name || "Aluno"
        : isTeacher
          ? lesson.student?.name || "Aluno"
          : lesson.teacher?.name || "Professor";
      const roleLabel = isAdmin || isTeacher ? "Aluno" : "Professor";
      const lessonDate = new Date(lesson.date);
      const endDate = lesson.end ? new Date(lesson.end) : new Date(lessonDate.getTime() + 90 * 60 * 1000);
      const dayName = format(lessonDate, "EEEE", { locale: ptBR });
      const dateStr = `${dayName} ${format(lessonDate, "dd/MM/yyyy 'às' HH:mm")} - ${format(endDate, "HH:mm")}`;

      result.push({
        icon: CalendarCheck,
        label: "PRÓXIMA AULA",
        text: `${lesson.subject} — ${roleLabel}: ${personName} — ${dateStr}`,
        href: "/dashboard/minhas-aulas",
      });
    }

    // 5. Notificações não lidas (até 3)
    const unreadNotifications = notifications
      .filter((n) => !n.read)
      .slice(0, 3);

    for (const notification of unreadNotifications) {
      result.push({
        icon: Bell,
        label: "NOTIFICAÇÃO",
        text: `${notification.title} — ${notification.message}`,
        href: "/dashboard/notifications",
      });
    }

    return result;
  }, [userName, birthDate, blogPosts, lessons, notifications, isTeacher, isAdmin, now]);

  const { currentSlide, displayedText, opacity, currentIndex, totalSlides } =
    useTypewriter(slides, isHovered ? 6000 : 3000);

  if (!currentSlide) {
    return null;
  }

  const Icon = currentSlide.icon;

  return (
    <>
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      <div 
        className="relative pr-10 sm:pr-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm px-6 py-5">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="shrink-0">
              <Icon className="h-7 w-7 text-[#FFC107]" />
            </div>

            {/* Text content */}
            {currentSlide.href ? (
              <a
                href={currentSlide.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 transition-opacity duration-[600ms] ease-out cursor-pointer group"
                style={{ opacity }}
              >
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                  {currentSlide.label}
                </p>
                <p className="text-base font-semibold text-slate-900 leading-none break-words max-w-[70%] group-hover:text-[#f5b000] transition-colors">
                  {displayedText}
                  <Cursor />
                </p>
              </a>
            ) : (
              <div
                className="flex-1 min-w-0 transition-opacity duration-[600ms] ease-out"
                style={{ opacity }}
              >
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                  {currentSlide.label}
                </p>
                <p className="text-base font-semibold text-slate-900 leading-none break-words max-w-[70%]">
                  {displayedText}
                  <Cursor />
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Theme toggle - desktop only, outside container */}
        <div className="absolute top-[8px] right-0 hidden sm:flex flex-col items-center gap-3">
          <Sun className="h-3.5 w-3.5 text-slate-500" />
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Alternar tema"
            className="rotate-90"
          />
          <Moon className="h-3.5 w-3.5 text-slate-500" />
        </div>
      </div>
    </>
  );
}
