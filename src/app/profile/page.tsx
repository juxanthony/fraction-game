"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import {
  getActiveProfile,
  getAttempts,
  getMatches,
  getMissionProgress,
} from "@/lib/storage/local";
import type { AttemptRecord, MatchRecord, StudentProfile } from "@/lib/storage/models";
import { levelFromXp } from "@/lib/gamification/xp";
import { BADGES } from "@/lib/gamification/badges";
import { dailyMissions } from "@/lib/gamification/missions";
import { masteryForTopic, statsByTopic, overallAccuracy, TOPICS } from "@/lib/analytics/aggregate";
import { HBarChart, StatCard } from "@/components/dashboard/charts";
import ProfileGate from "@/components/profile/ProfileGate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function ProfileDashboard({ profile }: { profile: StudentProfile }) {
  const { t } = useI18n();
  const router = useRouter();
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    setAttempts(getAttempts(profile.id));
    setMatches(getMatches(profile.id));
  }, [profile.id]);

  const lvl = levelFromXp(profile.xp);
  const topicStats = statsByTopic(attempts);
  const missions = getMissionProgress(profile.id);
  const missionDefs = dailyMissions(missions.date);

  const masteryLabel: Record<string, string> = {
    beginner: t("mastery.beginner"),
    developing: t("mastery.developing"),
    proficient: t("mastery.proficient"),
    mastered: t("mastery.mastered"),
  };

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-4">
        <span className="text-6xl">{profile.avatar}</span>
        <div className="flex-1 min-w-[180px]">
          <h1 className="text-2xl font-extrabold text-slate-800">{t("profile.welcome", { name: profile.name })}</h1>
          <p className="font-bold text-slate-500">{profile.className}</p>
          <div className="mt-2">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>
                {t("profile.level")} {lvl.level}
              </span>
              <span>
                {profile.xp} {t("profile.xp")}
              </span>
            </div>
            <div className="h-4 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                style={{ width: `${(lvl.intoLevel / lvl.needed) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {t("profile.xpToNext", { xp: lvl.needed - lvl.intoLevel, level: lvl.level + 1 })}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="!min-h-0 !py-2 !text-sm">
          🏠 {t("game.backToMenu")}
        </Button>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="❓" label={t("profile.totalQuestions")} value={attempts.length} />
        <StatCard icon="🎯" label={t("profile.accuracy")} value={`${overallAccuracy(attempts)}%`} />
        <StatCard icon="🏆" label={t("profile.matchesWon")} value={`${profile.matchesWon}/${profile.matchesPlayed}`} />
        <StatCard icon="⏱" label={t("profile.timeSpent")} value={`${Math.round(profile.totalTimeMs / 60000)} ${t("common.minutes")}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-extrabold text-slate-800 text-lg mb-3">🎖 {t("profile.badges")}</h2>
          <div className="grid grid-cols-5 gap-2">
            {BADGES.map((b) => {
              const earned = profile.badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  title={`${t(b.nameKey)} — ${t(b.descKey)}`}
                  className={`rounded-2xl p-2 text-center border-2 ${
                    earned ? "bg-amber-50 border-amber-300" : "bg-slate-100 border-slate-200 grayscale opacity-50"
                  }`}
                >
                  <div className="text-3xl">{b.icon}</div>
                  <div className="text-[10px] font-bold text-slate-600 leading-tight mt-1">{t(b.nameKey)}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="font-extrabold text-slate-800 text-lg mb-3">📅 {t("mission.daily")}</h2>
          <div className="space-y-2">
            {missionDefs.map((m) => {
              const progress = Math.min(m.target, m.progress(missions));
              const done = missions.claimed.includes(m.id) || progress >= m.target;
              return (
                <div key={m.id} className={`rounded-2xl border-2 p-3 ${done ? "bg-green-50 border-green-300" : "bg-white border-slate-200"}`}>
                  <div className="flex justify-between font-bold text-slate-700 text-sm">
                    <span>
                      {done ? "✅" : "🎯"} {t(m.nameKey)}
                    </span>
                    <span className="text-amber-600">{t("mission.reward", { xp: m.xp })}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(progress / m.target) * 100}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 font-bold mt-1">
                    {progress}/{m.target}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-extrabold text-slate-800 text-lg mb-3">📈 {t("profile.masteryByTopic")}</h2>
        {topicStats.length === 0 ? (
          <p className="text-slate-500 font-bold">{t("profile.noData")}</p>
        ) : (
          <HBarChart
            data={TOPICS.filter((topic) => topicStats.some((s) => s.topic === topic)).map((topic) => {
              const s = topicStats.find((x) => x.topic === topic)!;
              const m = masteryForTopic(attempts, topic);
              return {
                label: t(`topic.${topic}`),
                value: s.accuracy,
                sub: m ? `${masteryLabel[m]} · ${s.attempts} ${t("common.questions")}` : undefined,
              };
            })}
          />
        )}
      </Card>

      <Card>
        <h2 className="font-extrabold text-slate-800 text-lg mb-3">🕒 {t("profile.recentMatches")}</h2>
        {matches.length === 0 ? (
          <p className="text-slate-500 font-bold">{t("profile.noData")}</p>
        ) : (
          <div className="space-y-2">
            {matches
              .slice(-8)
              .reverse()
              .map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-sm font-bold text-slate-700">
                  <span className="text-xl">{m.result === "win" ? "🏆" : m.result === "lose" ? "💪" : "🤝"}</span>
                  <span>{t(`menu.${m.mode}` as string) || m.mode}</span>
                  <span className="text-slate-400">
                    {m.correctCount}/{m.questionsAnswered}
                  </span>
                  <span className="text-amber-600 ml-auto">+{m.xpEarned} XP</span>
                  <span className="text-slate-400 hidden sm:inline">{new Date(m.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <ProfileGate>{(profile) => <ProfileDashboard profile={profile} />}</ProfileGate>
    </main>
  );
}
