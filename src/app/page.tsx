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
  { href: "/play/practice", icon: "📘", titleKey: "menu.practice", descKey: "menu.practice.desc", color: "from-sky-400 to-blue-500" },
  { href: "/play/challenge", icon: "⚡", titleKey: "menu.challenge", descKey: "menu.challenge.desc", color: "from-amber-400 to-orange-500" },
  { href: "/play/tournament", icon: "🏆", titleKey: "menu.tournament", descKey: "menu.tournament.desc", color: "from-violet-400 to-purple-500" },
  { href: "/play/multiplayer", icon: "🤜🤛", titleKey: "menu.multiplayer", descKey: "menu.multiplayer.desc", color: "from-rose-400 to-pink-500" },
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
        <div className="text-5xl sm:text-6xl">🚩</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-900 drop-shadow-sm">{t("app.title")}</h1>
        <p className="text-lg font-bold text-slate-600">{t("app.tagline")}</p>
        <p className="text-sm font-bold text-slate-500">{t("app.year")}</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4">
        {MODES.map((m, i) => (
          <motion.div
            key={m.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
          >
            <Link
              href={m.href}
              className={`block rounded-3xl bg-gradient-to-br ${m.color} text-white p-5 shadow-lg border-4 border-white/60 hover:scale-[1.02] active:scale-[0.99] transition-transform`}
            >
              <div className="text-4xl mb-1">{m.icon}</div>
              <div className="text-2xl font-extrabold">{t(m.titleKey)}</div>
              <div className="text-sm font-semibold text-white/90 mt-1">{t(m.descKey)}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/profile"
          className="rounded-3xl bg-white/90 border-2 border-white shadow p-4 flex items-center gap-3 font-extrabold text-slate-700 hover:bg-white"
        >
          <span className="text-3xl">📊</span> {t("menu.profile")}
        </Link>
        <Link
          href="/teacher"
          className="rounded-3xl bg-white/90 border-2 border-white shadow p-4 flex items-center gap-3 font-extrabold text-slate-700 hover:bg-white"
        >
          <span className="text-3xl">🧑‍🏫</span> {t("menu.teacher")}
        </Link>
      </div>
    </main>
  );
}
