import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, LogOut, Mail, Search, Shield, ShieldCheck, UserRound, Bell, Plus, Download } from "lucide-react";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { ComparisonView } from "./components/ComparisonView";
import { DataManagementPanel } from "./components/DataManagementPanel";
import { EmergencyReschedulePanel } from "./components/EmergencyReschedulePanel";
import { ExplainableAIPanel } from "./components/ExplainableAIPanel";
import { GAProgressPanel } from "./components/GAProgressPanel";
import { LiveStatusPanel } from "./components/LiveStatusPanel";
import { LoginCard } from "./components/LoginCard";
import { OptimizationControlPanel } from "./components/OptimizationControlPanel";
import { PredictivePanel } from "./components/PredictivePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { Sidebar } from "./components/Sidebar";
import { SkeletonCard, SkeletonChart } from "./components/SkeletonLoader";
import { StatCard } from "./components/StatCard";
import { SuggestionsPanel } from "./components/SuggestionsPanel";
import { TimetableGrid } from "./components/TimetableGrid";
import { useDashboardData } from "./hooks/useDashboardData";

function formatMetricValue(value) {
  if (typeof value === "number" && !Number.isInteger(value)) {
    return value.toFixed(1);
  }
  return value;
}

const statAccents = [
  { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
  { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
  { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
  { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
];

export default function App() {
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  const {
    session, profile, analytics, timetables, stats, loading, error, notice,
    rememberedIdentifier, explanation, generationHistory, baselineMetrics,
    beforeTimetable, afterTimetable, disruption, changedCount, changedSlotIds,
    signIn, signUp, runGeneration, runReschedule, refresh, logout,
  } = useDashboardData();

  if (!session.token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page-gradient p-6 lg:p-10">
        <LoginCard onSignIn={signIn} onSignUp={signUp} loading={loading} error={error} rememberedIdentifier={rememberedIdentifier} />
      </main>
    );
  }

  const isAdmin = session.role === "admin";
  const selectedTimetable = timetables.find((item) => item.timetable_id === selectedTimetableId) || timetables[0];
  const formatTimestamp = (value) => (!value ? "Not available yet" : new Date(value).toLocaleString());

  const navigateTo = (id) => {
    setActiveSection(id);
  };

  return (
    <div className="flex min-h-screen bg-page-gradient">
      <Sidebar activeSection={activeSection} onNavigate={navigateTo} isAdmin={isAdmin} onLogout={logout} />

      <main className="flex-1 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-6">

          {/* ── Top Navigation / Search ──────────────── */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2 pb-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 w-full md:max-w-md shadow-sm">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input type="text" placeholder="Search tasks..." className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400" />
              <div className="hidden sm:flex items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">⌘K</div>
            </div>
            <div className="flex items-center gap-3 self-end md:self-auto">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                <Mail className="h-4 w-4" />
              </button>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1.5 pr-4 text-sm text-slate-600 shadow-sm ml-2">
                <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                  {session.fullName.charAt(0)}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[13px] font-semibold text-slate-800">{session.fullName}</span>
                  <span className="text-[10px] text-slate-400">@{session.username}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notifications ──────────────────────── */}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 text-sm">{error}</div>}
          {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 text-sm">{notice}</div>}

          {/* ── Dashboard Section ──────────────────── */}
          {activeSection === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
              {/* ── Header Title & Actions ──────────────── */}
              <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between py-2">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                  <p className="mt-1 text-[14px] text-slate-500">Plan, prioritize, and accomplish your scheduling tasks with ease.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => runGeneration()} disabled={loading} className="flex items-center gap-2 rounded-full bg-primary-800 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-70">
                    <Plus className="h-4 w-4" />
                    <span>Optimize System</span>
                  </button>
                  <button onClick={refresh} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-colors">
                    <span>Refresh Data</span>
                  </button>
                </div>
              </header>

              <LiveStatusPanel generationHistory={generationHistory} isRunning={loading} />

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr,1fr,1fr,1fr,1fr]">
                {profile && (
                  <div className="glass-panel p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account Snapshot</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-3"><UserRound className="h-4 w-4 text-primary-500" /><span>{profile.full_name}</span></div>
                      <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-emerald-500" /><span>{profile.email}</span></div>
                      <div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-amber-500" /><span>Last login: {formatTimestamp(profile.last_login_at)}</span></div>
                      {isAdmin && (
                        <div className="flex items-center gap-3"><Shield className="h-4 w-4 text-amber-500" /><span className="text-amber-600 font-semibold">Administrator Access</span></div>
                      )}
                    </div>
                  </div>
                )}
                {loading && !analytics ? (
                  <>
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                  </>
                ) : (analytics?.summary_cards || []).map((card, index) => {
                  const a = statAccents[index % statAccents.length];
                  return (
                    <StatCard key={card.label} title={card.label} value={formatMetricValue(card.value)}
                      subtitle={index % 2 === 0 ? "Increased" : "Monitored"}
                      accent={`${a.bg} ${a.text}`} dotColor={a.dot} isPrimary={index === 0} />
                  );
                })}
              </section>

              {isAdmin && (
                <OptimizationControlPanel loading={loading} onGenerate={runGeneration} onReschedule={runReschedule} />
              )}

              {isAdmin && (
                <EmergencyReschedulePanel timetables={timetables} onReschedule={runReschedule} loading={loading} />
              )}

              {stats && (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <StatCard title="Utilization %" value={stats.utilization_percent} subtitle="Rooms" accent="bg-emerald-50 text-emerald-600" dotColor="bg-emerald-500" isPrimary={true} />
                  <StatCard title="Conflict Count" value={stats.conflict_count} subtitle="Hard rules" accent="bg-rose-50 text-rose-600" dotColor="bg-rose-500" />
                  <StatCard title="Faculty Balance" value={stats.faculty_load_balance} subtitle="Soft score" accent="bg-emerald-50 text-emerald-600" dotColor="bg-emerald-500" />
                  <StatCard title="Mutation Rate" value={stats.mutation_rate} subtitle="Adaptive" accent="bg-amber-50 text-amber-600" dotColor="bg-amber-500" />
                  <StatCard title="Generations" value={stats.generations_executed} subtitle="Executed" accent="bg-slate-100 text-slate-600" dotColor="bg-slate-400" />
                </section>
              )}

              <ComparisonView beforeTimetable={beforeTimetable} afterTimetable={afterTimetable}
                disruption={disruption} changedCount={changedCount} changedSlotIds={changedSlotIds} />

              <section className="glass-panel p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top Solutions</p>
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {timetables.map((item) => (
                    <motion.button key={item.timetable_id} type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedTimetableId(item.timetable_id)}
                      className={`rounded-2xl border p-5 text-left transition-all ${selectedTimetable?.timetable_id === item.timetable_id ? "border-primary-300 bg-primary-50 shadow-md" : "border-slate-200 bg-white hover:border-primary-200 hover:shadow-md"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{item.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">Multi-department, shift-aware schedule candidate</p>
                        </div>
                        <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">{item.fitness_score}</span>
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Conflicts</p>
                          <p className="mt-2 text-xl font-bold text-slate-800">{item.conflict_count}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Utilization</p>
                          <p className="mt-2 text-xl font-bold text-slate-800">{item.utilization_percent}%</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Load Balance</p>
                          <p className="mt-2 text-xl font-bold text-slate-800">{item.faculty_load_balance}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ── Timetable Section ──────────────────── */}
          {activeSection === "timetable" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid gap-6 xl:grid-cols-[1.5fr,0.7fr]">
              <TimetableGrid timetable={selectedTimetable} onRefresh={refresh} />
              <SuggestionsPanel suggestions={selectedTimetable?.suggestions} />
            </motion.div>
          )}

          {/* ── Data Management Section ────────────── */}
          {activeSection === "data" && isAdmin && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <DataManagementPanel />
            </motion.div>
          )}

          {/* ── AI Insights Section ────────────────── */}
          {activeSection === "ai" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <ExplainableAIPanel explanation={explanation} baselineMetrics={baselineMetrics} />
            </motion.div>
          )}

          {/* ── Analytics Section ──────────────────── */}
          {activeSection === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <AnalyticsPanel analytics={analytics} />
            </motion.div>
          )}

          {/* ── Predictive Intelligence ────────────── */}
          {activeSection === "predictions" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <PredictivePanel />
            </motion.div>
          )}

          {/* ── GA Convergence ─────────────────────── */}
          {activeSection === "convergence" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <GAProgressPanel generationHistory={generationHistory} />
            </motion.div>
          )}

          {/* ── Settings (Admin Only) ─────────────── */}
          {activeSection === "settings" && isAdmin && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <SettingsPanel />
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
