"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { getAttempts, getMatches, getProfiles } from "@/lib/storage/local";
import type { AttemptRecord, MatchRecord, StudentProfile } from "@/lib/storage/models";
import {
  commonErrors,
  dailyTrend,
  masteryForTopic,
  overallAccuracy,
  statsByTopic,
  weakTopics,
  TOPICS,
} from "@/lib/analytics/aggregate";
import {
  attemptsCsvRows,
  classSummaryCsvRows,
  downloadCsv,
  researchCsvRows,
} from "@/lib/analytics/export";
import { BADGES } from "@/lib/gamification/badges";
import { levelFromXp } from "@/lib/gamification/xp";
import { isFirebaseEnabled } from "@/lib/firebase/config";
import { fetchClassData, type ClassData } from "@/lib/firebase/teacher";
import { HBarChart, LineChart, StatCard } from "@/components/dashboard/charts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

type Tab = "overview" | "students" | "skills" | "questions" | "export";

export default function TeacherDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [localProfiles, setLocalProfiles] = useState<StudentProfile[]>([]);
  const [localAttempts, setLocalAttempts] = useState<Map<string, AttemptRecord[]>>(new Map());
  const [localMatches, setLocalMatches] = useState<Map<string, MatchRecord[]>>(new Map());
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  /* Cloud class monitoring: pupils linked via class code (see docs/TEACHER_GUIDE.md) */
  const [cloud, setCloud] = useState<ClassData | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(false);

  useEffect(() => {
    const ps = getProfiles();
    setLocalProfiles(ps);
    setLocalAttempts(new Map(ps.map((p) => [p.id, getAttempts(p.id)])));
    setLocalMatches(new Map(ps.map((p) => [p.id, getMatches(p.id)])));
  }, []);

  const loadClass = async () => {
    if (!codeInput.trim()) return;
    setCloudLoading(true);
    setCloudError(false);
    const data = await fetchClassData(codeInput);
    setCloudLoading(false);
    if (data && data.profiles.length > 0) {
      setCloud(data);
      setSelectedStudent(null);
    } else {
      setCloudError(true);
    }
  };

  // The whole dashboard renders from these three — local device data by
  // default, or the linked class from the cloud once a code is loaded.
  const profiles = cloud?.profiles ?? localProfiles;
  const attemptsByProfile = cloud?.attemptsByProfile ?? localAttempts;
  const matchesByProfile = cloud?.matchesByProfile ?? localMatches;

  const allAttempts = useMemo(
    () => [...attemptsByProfile.values()].flat().sort((a, b) => a.timestamp - b.timestamp),
    [attemptsByProfile]
  );

  const masteryLabel: Record<string, string> = {
    beginner: t("mastery.beginner"),
    developing: t("mastery.developing"),
    proficient: t("mastery.proficient"),
    mastered: t("mastery.mastered"),
  };

  const TABS: { id: Tab; icon: string; labelKey: string }[] = [
    { id: "overview", icon: "🏠", labelKey: "teacher.overview" },
    { id: "students", icon: "🧒", labelKey: "teacher.students" },
    { id: "skills", icon: "🧠", labelKey: "teacher.skills" },
    { id: "questions", icon: "❓", labelKey: "teacher.questionsTab" },
    { id: "export", icon: "📤", labelKey: "teacher.export" },
  ];

  const printReport = () => window.print();

  const connectPanel = (
    <Card className="!py-4 no-print">
      {isFirebaseEnabled() ? (
        <div className="space-y-2">
          <h2 className="font-extrabold text-slate-800">☁️ {t("teacher.linkTitle")}</h2>
          <p className="text-sm text-slate-600 font-semibold">{t("teacher.linkDesc")}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadClass();
            }}
            className="flex flex-wrap gap-2 items-center"
          >
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder={t("teacher.classCode")}
              maxLength={20}
              className="rounded-2xl border-2 border-slate-300 px-4 py-2 font-bold uppercase tracking-widest focus:border-blue-500 outline-none"
              aria-label={t("teacher.classCode")}
            />
            <Button type="submit" disabled={cloudLoading} className="!min-h-0 !py-2 !text-sm">
              {cloudLoading ? t("common.loading") : `🔄 ${t("teacher.load")}`}
            </Button>
            {cloud && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCloud(null);
                  setSelectedStudent(null);
                }}
                className="!min-h-0 !py-2 !text-sm"
              >
                💻 {t("teacher.showLocal")}
              </Button>
            )}
          </form>
          {cloud && (
            <p className="text-sm font-bold text-green-700">
              ✅ {t("teacher.cloudActive", { code: cloud.classCode, n: cloud.profiles.length })}
            </p>
          )}
          {cloudError && <p className="text-sm font-bold text-rose-600">{t("teacher.cloudEmpty")}</p>}
        </div>
      ) : (
        <p className="text-sm text-slate-600 font-semibold">🔌 {t("teacher.cloudOff")}</p>
      )}
    </Card>
  );

  if (profiles.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <Header onBack={() => router.push("/")} />
        {connectPanel}
        <Card className="text-center py-12">
          <div className="text-5xl mb-3">🧑‍🏫</div>
          <p className="font-bold text-slate-600">{t("teacher.noStudents")}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <Header onBack={() => router.push("/")} />

      {connectPanel}

      <nav className="flex gap-1 flex-wrap no-print" role="tablist">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => {
              setTab(tb.id);
              setSelectedStudent(null);
            }}
            className={`rounded-full px-4 py-2 font-bold text-sm border-2 ${
              tab === tb.id
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-white/80 text-slate-600 border-slate-200 hover:bg-white"
            }`}
          >
            {tb.icon} {t(tb.labelKey)}
          </button>
        ))}
      </nav>

      {/* ============ OVERVIEW ============ */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon="🧒" label={t("teacher.totalStudents")} value={profiles.length} />
            <StatCard icon="❓" label={t("teacher.totalQuestions")} value={allAttempts.length} />
            <StatCard icon="🎯" label={t("teacher.classAccuracy")} value={`${overallAccuracy(allAttempts)}%`} />
            <StatCard
              icon="⏱"
              label={t("teacher.totalTime")}
              value={`${Math.round(profiles.reduce((s, p) => s + p.totalTimeMs, 0) / 60000)} ${t("common.minutes")}`}
            />
          </div>

          <Card>
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">⚠️ {t("teacher.weakSkills")}</h2>
            {weakTopics(allAttempts).length === 0 ? (
              <p className="font-bold text-green-600">✅ {t("teacher.noWeakSkills")}</p>
            ) : (
              <HBarChart
                data={weakTopics(allAttempts).map((s) => ({
                  label: t(`topic.${s.topic}`),
                  value: s.accuracy,
                  sub: `${s.attempts} ${t("teacher.attempts")}`,
                }))}
              />
            )}
          </Card>

          <Card>
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">📈 {t("teacher.growthTrend")}</h2>
            <LineChart points={dailyTrend(allAttempts).map((d) => ({ x: d.date, y: d.accuracy }))} />
          </Card>

          <Card>
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">🎖 {t("teacher.achievements")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {BADGES.map((b) => (
                <div key={b.id} className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <div className="text-2xl">{b.icon}</div>
                  <div className="text-xs font-bold text-slate-600">{t(b.nameKey)}</div>
                  <div className="text-xl font-extrabold text-slate-800">
                    {profiles.filter((p) => p.badges.includes(b.id)).length}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============ STUDENTS ============ */}
      {tab === "students" && !selectedStudent && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 font-bold border-b-2 border-slate-100">
                  <th className="py-2 pr-3">{t("teacher.student")}</th>
                  <th className="py-2 pr-3">{t("profile.class")}</th>
                  <th className="py-2 pr-3">{t("profile.level")}</th>
                  <th className="py-2 pr-3">{t("profile.totalQuestions")}</th>
                  <th className="py-2 pr-3">{t("profile.accuracy")}</th>
                  <th className="py-2 pr-3">{t("teacher.lastActive")}</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const attempts = attemptsByProfile.get(p.id) ?? [];
                  return (
                    <tr key={p.id} className="border-b border-slate-50 font-bold text-slate-700">
                      <td className="py-2 pr-3">
                        {p.avatar} {p.name}
                      </td>
                      <td className="py-2 pr-3">{p.className}</td>
                      <td className="py-2 pr-3">Lv.{levelFromXp(p.xp).level}</td>
                      <td className="py-2 pr-3">{attempts.length}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            overallAccuracy(attempts) >= 75
                              ? "bg-green-100 text-green-700"
                              : overallAccuracy(attempts) >= 50
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {overallAccuracy(attempts)}%
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-slate-400">{new Date(p.lastActiveAt).toLocaleDateString()}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setSelectedStudent(p)}
                          className="rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 text-xs font-bold"
                        >
                          {t("teacher.viewDetails")} →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "students" && selectedStudent && (
        <StudentDetail
          profile={selectedStudent}
          attempts={attemptsByProfile.get(selectedStudent.id) ?? []}
          matches={matchesByProfile.get(selectedStudent.id) ?? []}
          masteryLabel={masteryLabel}
          onBack={() => setSelectedStudent(null)}
          onPrint={printReport}
        />
      )}

      {/* ============ SKILLS ============ */}
      {tab === "skills" && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">🎯 {t("teacher.accuracyByTopic")}</h2>
            <HBarChart
              data={statsByTopic(allAttempts).map((s) => ({
                label: t(`topic.${s.topic}`),
                value: s.accuracy,
                sub: `${s.attempts} ${t("teacher.attempts")}`,
              }))}
            />
          </Card>
          <Card>
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">⏱ {t("teacher.avgTimeByTopic")}</h2>
            <HBarChart
              data={statsByTopic(allAttempts).map((s) => ({
                label: t(`topic.${s.topic}`),
                value: Math.round(s.avgTimeMs / 100) / 10,
              }))}
              unit="s"
              max={30}
              colorFor={() => "#3b82f6"}
            />
          </Card>
          <Card>
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">🧩 {t("teacher.commonErrors")}</h2>
            {commonErrors(allAttempts).length === 0 ? (
              <p className="font-bold text-slate-500">—</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 font-bold border-b-2 border-slate-100">
                    <th className="py-2">{t("teacher.errorPattern")}</th>
                    <th className="py-2 text-right">{t("teacher.count")}</th>
                    <th className="py-2 text-right">{t("teacher.share")}</th>
                  </tr>
                </thead>
                <tbody>
                  {commonErrors(allAttempts).map((e) => (
                    <tr key={e.errorTag} className="border-b border-slate-50 font-bold text-slate-700">
                      <td className="py-2">{t(`err.${e.errorTag}`)}</td>
                      <td className="py-2 text-right">{e.count}</td>
                      <td className="py-2 text-right">{e.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card>
            <h2 className="font-extrabold text-slate-800 text-lg mb-3">🏅 {t("teacher.masteryLevels")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 font-bold border-b-2 border-slate-100">
                    <th className="py-2 pr-2">{t("teacher.student")}</th>
                    {TOPICS.map((topic) => (
                      <th key={topic} className="py-2 px-1 text-center text-[10px] leading-tight">
                        {t(`topic.${topic}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 font-bold text-slate-700">
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {p.avatar} {p.name}
                      </td>
                      {TOPICS.map((topic) => {
                        const m = masteryForTopic(attemptsByProfile.get(p.id) ?? [], topic);
                        const colors: Record<string, string> = {
                          beginner: "bg-rose-100 text-rose-700",
                          developing: "bg-amber-100 text-amber-700",
                          proficient: "bg-sky-100 text-sky-700",
                          mastered: "bg-green-100 text-green-700",
                        };
                        return (
                          <td key={topic} className="py-2 px-1 text-center">
                            {m ? (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] ${colors[m]}`}>{masteryLabel[m]}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============ QUESTIONS ============ */}
      {tab === "questions" && (
        <Card>
          <h2 className="font-extrabold text-slate-800 text-lg mb-3">❓ {t("teacher.questionsTab")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 font-bold border-b-2 border-slate-100">
                <th className="py-2">{t("teacher.questionType")}</th>
                <th className="py-2 text-right">{t("teacher.attempts")}</th>
                <th className="py-2 text-right">{t("teacher.correctRate")}</th>
                <th className="py-2 text-right">{t("game.avgTime")}</th>
                <th className="py-2 text-right">{t("teacher.hintRate")}</th>
              </tr>
            </thead>
            <tbody>
              {statsByTopic(allAttempts).map((s) => (
                <tr key={s.topic} className="border-b border-slate-50 font-bold text-slate-700">
                  <td className="py-2">{t(`topic.${s.topic}`)}</td>
                  <td className="py-2 text-right">{s.attempts}</td>
                  <td className="py-2 text-right">{s.accuracy}%</td>
                  <td className="py-2 text-right">{(s.avgTimeMs / 1000).toFixed(1)}s</td>
                  <td className="py-2 text-right">{s.hintRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ============ EXPORT ============ */}
      {tab === "export" && (
        <Card className="space-y-4">
          <h2 className="font-extrabold text-slate-800 text-lg">📤 {t("teacher.export")}</h2>
          <p className="text-sm font-bold text-slate-500">{t("teacher.exportExcelNote")}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              variant="primary"
              onClick={() =>
                downloadCsv("class-summary.csv", classSummaryCsvRows(profiles, attemptsByProfile, matchesByProfile))
              }
            >
              📊 {t("teacher.exportCsvStudents")}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                downloadCsv("attempts.csv", attemptsCsvRows(allAttempts, new Map(profiles.map((p) => [p.id, p]))))
              }
            >
              📝 {t("teacher.exportCsvAttempts")}
            </Button>
            <Button variant="secondary" onClick={() => downloadCsv("research-dataset.csv", researchCsvRows(allAttempts, profiles))}>
              🔬 {t("teacher.exportResearch")}
            </Button>
            <Button variant="ghost" onClick={printReport}>
              🖨 {t("teacher.printReport")} ({t("teacher.classReport")})
            </Button>
          </div>
        </Card>
      )}

      {/* ============ PRINTABLE CLASS REPORT ============ */}
      <section className="hidden print:block print-block space-y-4">
        <h1 className="text-2xl font-extrabold">
          {t("app.title")} — {t("teacher.classReport")}
        </h1>
        <p className="text-sm text-slate-500">
          {t("teacher.generated")}: {new Date().toLocaleString()}
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b-2 border-slate-300">
              <th className="py-1">{t("teacher.student")}</th>
              <th className="py-1">{t("profile.class")}</th>
              <th className="py-1">{t("profile.totalQuestions")}</th>
              <th className="py-1">{t("profile.accuracy")}</th>
              <th className="py-1">{t("profile.matchesWon")}</th>
              <th className="py-1">{t("profile.xp")}</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const attempts = attemptsByProfile.get(p.id) ?? [];
              return (
                <tr key={p.id} className="border-b border-slate-200">
                  <td className="py-1">{p.name}</td>
                  <td className="py-1">{p.className}</td>
                  <td className="py-1">{attempts.length}</td>
                  <td className="py-1">{overallAccuracy(attempts)}%</td>
                  <td className="py-1">{p.matchesWon}</td>
                  <td className="py-1">{p.xp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 no-print">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="!min-h-0 !py-2 !text-sm">
          ← {t("game.backToMenu")}
        </Button>
        <h1 className="text-2xl font-extrabold text-slate-800">🧑‍🏫 {t("teacher.title")}</h1>
      </div>
      <LanguageSwitcher />
    </header>
  );
}

function StudentDetail({
  profile,
  attempts,
  matches,
  masteryLabel,
  onBack,
  onPrint,
}: {
  profile: StudentProfile;
  attempts: AttemptRecord[];
  matches: MatchRecord[];
  masteryLabel: Record<string, string>;
  onBack: () => void;
  onPrint: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 no-print">
        <Button variant="ghost" onClick={onBack} className="!min-h-0 !py-2 !text-sm">
          ← {t("teacher.backToList")}
        </Button>
        <Button variant="ghost" onClick={onPrint} className="!min-h-0 !py-2 !text-sm">
          🖨 {t("teacher.printReport")} ({t("teacher.individualReport")})
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{profile.avatar}</span>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">{profile.name}</h2>
            <p className="font-bold text-slate-500">
              {profile.className} · Lv.{levelFromXp(profile.xp).level} · {profile.xp} XP
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="❓" label={t("profile.totalQuestions")} value={attempts.length} />
          <StatCard icon="🎯" label={t("profile.accuracy")} value={`${overallAccuracy(attempts)}%`} />
          <StatCard icon="🏆" label={t("profile.matchesWon")} value={`${profile.matchesWon}/${matches.length}`} />
          <StatCard icon="⏱" label={t("profile.timeSpent")} value={`${Math.round(profile.totalTimeMs / 60000)} ${t("common.minutes")}`} />
        </div>

        <div>
          <h3 className="font-extrabold text-slate-800 mb-2">{t("teacher.accuracyByTopic")}</h3>
          <HBarChart
            data={statsByTopic(attempts).map((s) => {
              const m = masteryForTopic(attempts, s.topic);
              return {
                label: t(`topic.${s.topic}`),
                value: s.accuracy,
                sub: m ? `${masteryLabel[m]} · ${s.attempts} ${t("teacher.attempts")}` : undefined,
              };
            })}
          />
        </div>

        <div>
          <h3 className="font-extrabold text-slate-800 mb-2">{t("teacher.commonErrors")}</h3>
          {commonErrors(attempts).length === 0 ? (
            <p className="font-bold text-slate-500">—</p>
          ) : (
            <ul className="space-y-1 text-sm font-bold text-slate-700">
              {commonErrors(attempts).map((e) => (
                <li key={e.errorTag}>
                  • {t(`err.${e.errorTag}`)} — {e.count}× ({e.share}%)
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-extrabold text-slate-800 mb-2">{t("teacher.growthTrend")}</h3>
          <LineChart points={dailyTrend(attempts).map((d) => ({ x: d.date, y: d.accuracy }))} />
        </div>
      </Card>
    </div>
  );
}
