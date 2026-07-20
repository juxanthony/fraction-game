"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { getActiveProfile } from "@/lib/storage/local";
import { levelFromXp } from "@/lib/gamification/xp";
import type { StudentProfile } from "@/lib/storage/models";

const MODES = [
  { href: "/play/practice", icon: "📘", titleKey: "menu.practice", descKey: "menu.practice.desc", color: "from-sky-400 via-cyan-400 to-blue-500", glow: "#38bdf8" },
  { href: "/play/challenge", icon: "⚡", titleKey: "menu.challenge", descKey: "menu.challenge.desc", color: "from-amber-400 via-orange-400 to-orange-500", glow: "#fb923c" },
  { href: "/play/tournament", icon: "🏆", titleKey: "menu.tournament", descKey: "menu.tournament.desc", color: "from-violet-400 via-purple-400 to-fuchsia-500", glow: "#c084fc" },
  { href: "/play/multiplayer", icon: "🤜🤛", titleKey: "menu.multiplayer", descKey: "menu.multiplayer.desc", color: "from-rose-400 via-pink-400 to-pink-500", glow: "#f472b6" },
];

const QUICK_LINKS = [
  { href: "/notes", icon: "📖", key: "menu.notes", ring: "hover:border-emerald-300", bg: "from-emerald-50 to-teal-50" },
  { href: "/profile", icon: "📊", key: "menu.profile", ring: "hover:border-sky-300", bg: "from-sky-50 to-indigo-50" },
  { href: "/teacher", icon: "🧑‍🏫", key: "menu.teacher", ring: "hover:border-amber-300", bg: "from-amber-50 to-orange-50" },
];

export default function HomePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    setProfile(getActiveProfile());
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <LanguageSwitcher />
        {profile && (
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full bg-white/90 border-2 border-slate-200 px-4 py-2 font-bold text-slate-700 shadow hover:bg-white"
          >
            <span className="text-xl">{profile.avatar}</span>
            <span>{profile.name}</span>
            <span className="text-amber-600 text-sm">Lv.{levelFromXp(profile.xp).level}</span>
          </Link>
        )}
      </header>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 py-4"
      >
        <div className="text-6xl sm:text-7xl inline-block animate-bob drop-shadow-lg">🚩</div>
        <h1 className="text-4xl sm:text-6xl font-extrabold rainbow-text drop-shadow-sm leading-tight">
          {t("app.title")}
        </h1>
        <p className="text-lg sm:text-xl font-extrabold text-slate-700">{t("app.tagline")}</p>
        <span className="inline-block rounded-full bg-white/70 border-2 border-white px-4 py-1 text-sm font-extrabold text-blue-700 shadow-sm">
          {t("app.year")}
        </span>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4">
        {MODES.map((m, i) => (
          <motion.div
            key={m.href}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.08 * i, type: "spring", stiffness: 180, damping: 16 }}
            whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? -1.2 : 1.2, y: -4 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              href={m.href}
              className={`group relative block overflow-hidden rounded-3xl bg-gradient-to-br ${m.color} text-white p-5 border-4 border-white/70`}
              style={{ boxShadow: `0 12px 30px -8px ${m.glow}` }}
            >
              {/* sheen sweep on hover */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(75deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
                  animation: "shine 0.9s ease-out",
                }}
              />
              <div className="text-5xl mb-1 drop-shadow-md transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                {m.icon}
              </div>
              <div className="text-2xl font-extrabold drop-shadow">{t(m.titleKey)}</div>
              <div className="text-sm font-semibold text-white/95 mt-1">{t(m.descKey)}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold bg-white/25 rounded-full px-3 py-1 group-hover:bg-white/40 transition-colors">
                {t("menu.play")} <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {QUICK_LINKS.map((q, i) => (
          <motion.div
            key={q.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={q.href}
              className={`rounded-3xl bg-gradient-to-br ${q.bg} border-2 border-white ${q.ring} shadow-md p-4 flex items-center gap-3 font-extrabold text-slate-700 h-full`}
            >
              <span className="text-3xl">{q.icon}</span> {t(q.key)}
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
