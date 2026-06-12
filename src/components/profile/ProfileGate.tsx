"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  createProfile,
  getActiveProfile,
  getProfiles,
  setActiveProfile,
} from "@/lib/storage/local";
import type { StudentProfile } from "@/lib/storage/models";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const AVATARS = ["🦁", "🐼", "🦊", "🐯", "🐰", "🐲", "🐨", "🦄"];

/**
 * Ensures an active student profile exists before gameplay. Supports several
 * profiles on one device (shared classroom tablets) with quick switching.
 */
export default function ProfileGate({
  children,
}: {
  children: (profile: StudentProfile) => React.ReactNode;
}) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  useEffect(() => {
    setProfile(getActiveProfile());
    setProfiles(getProfiles());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <div className="text-center py-20 font-bold text-slate-500">{t("common.loading")}</div>;
  }

  if (profile) return <>{children(profile)}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfile(createProfile(name, className, avatar));
  };

  return (
    <Card className="max-w-md mx-auto space-y-5">
      <h2 className="text-2xl font-extrabold text-slate-800 text-center">👋 {t("profile.create")}</h2>

      {profiles.length > 0 && (
        <div className="space-y-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProfile(p.id);
                setProfile(p);
              }}
              className="w-full flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white hover:bg-blue-50 p-3 font-bold text-slate-700"
            >
              <span className="text-2xl">{p.avatar}</span>
              <span>{p.name}</span>
              <span className="text-sm text-slate-400 ml-auto">{p.className}</span>
            </button>
          ))}
          <div className="text-center text-sm text-slate-400 font-bold">— {t("profile.create")} —</div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="font-bold text-slate-700">{t("profile.name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("profile.namePlaceholder")}
            required
            maxLength={30}
            className="mt-1 w-full rounded-2xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-blue-500 outline-none"
          />
        </label>
        <label className="block">
          <span className="font-bold text-slate-700">{t("profile.class")}</span>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder={t("profile.classPlaceholder")}
            maxLength={20}
            className="mt-1 w-full rounded-2xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-blue-500 outline-none"
          />
        </label>
        <div className="flex gap-2 flex-wrap justify-center" role="radiogroup" aria-label="avatar">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              role="radio"
              aria-checked={avatar === a}
              onClick={() => setAvatar(a)}
              className={`text-3xl rounded-2xl p-2 border-2 ${
                avatar === a ? "border-blue-500 bg-blue-50 scale-110" : "border-transparent"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <Button type="submit" className="w-full">
          🚀 {t("common.continue")}
        </Button>
      </form>
    </Card>
  );
}
