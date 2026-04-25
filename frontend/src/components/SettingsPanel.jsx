import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Bell, Palette, Clock, Shield, Save, RotateCcw } from "lucide-react";

const defaultPreferences = {
  institutionName: "Smart Academy",
  academicYear: "2025-2026",
  defaultShift: "morning",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periodsPerDay: 6,
  periodDuration: 60,
  breakAfterPeriod: 3,
  breakDuration: 15,
  populationSize: 60,
  generations: 120,
  mutationRate: 0.12,
  eliteCount: 5,
  solutionCount: 5,
  enableNotifications: true,
  autoSaveInterval: 5,
  theme: "light",
};

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SettingsPanel() {
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem("smart-classroom-preferences");
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  });
  const [saved, setSaved] = useState(false);

  const set = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const toggleDay = (day) => {
    setPrefs((p) => ({
      ...p,
      workingDays: p.workingDays.includes(day)
        ? p.workingDays.filter((d) => d !== day)
        : [...p.workingDays, day],
    }));
  };

  const handleSave = () => {
    localStorage.setItem("smart-classroom-preferences", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setPrefs(defaultPreferences);
    localStorage.removeItem("smart-classroom-preferences");
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition text-sm";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6" id="settings-panel">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-100 p-3 text-primary-600">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Administrator</p>
            <h3 className="mt-1 text-xl font-bold text-slate-800">Preferences & Settings</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition">
            <RotateCcw className="h-4 w-4" />Reset
          </button>
          <button onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-bold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-600/20">
            <Save className="h-4 w-4" />{saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 mb-6">
          Preferences saved successfully.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Institution Settings ───────────────── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary-500" />
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Institution</h4>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-600">Institution Name</span>
              <input className={inputClass} value={prefs.institutionName} onChange={(e) => set("institutionName", e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-600">Academic Year</span>
              <input className={inputClass} value={prefs.academicYear} onChange={(e) => set("academicYear", e.target.value)} placeholder="2025-2026" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-600">Default Shift</span>
              <select className={inputClass} value={prefs.defaultShift} onChange={(e) => set("defaultShift", e.target.value)}>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
              </select>
            </label>
          </div>
        </div>

        {/* ── Schedule Settings ──────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Schedule</h4>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-600">Working Days</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {allDays.map((day) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      prefs.workingDays.includes(day)
                        ? "bg-primary-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Periods/Day</span>
                <input type="number" min="1" max="12" className={inputClass} value={prefs.periodsPerDay} onChange={(e) => set("periodsPerDay", parseInt(e.target.value) || 6)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Period Duration (min)</span>
                <input type="number" min="30" max="120" className={inputClass} value={prefs.periodDuration} onChange={(e) => set("periodDuration", parseInt(e.target.value) || 60)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Break After Period</span>
                <input type="number" min="1" max="12" className={inputClass} value={prefs.breakAfterPeriod} onChange={(e) => set("breakAfterPeriod", parseInt(e.target.value) || 3)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Break Duration (min)</span>
                <input type="number" min="5" max="60" className={inputClass} value={prefs.breakDuration} onChange={(e) => set("breakDuration", parseInt(e.target.value) || 15)} />
              </label>
            </div>
          </div>
        </div>

        {/* ── GA Optimization Parameters ─────────── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="h-4 w-4 text-accent-500" />
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Optimization Engine</h4>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Population Size</span>
                <input type="number" min="10" max="500" className={inputClass} value={prefs.populationSize} onChange={(e) => set("populationSize", parseInt(e.target.value) || 60)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Generations</span>
                <input type="number" min="10" max="1000" className={inputClass} value={prefs.generations} onChange={(e) => set("generations", parseInt(e.target.value) || 120)} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Mutation Rate</span>
                <input type="number" step="0.01" min="0" max="1" className={inputClass} value={prefs.mutationRate} onChange={(e) => set("mutationRate", parseFloat(e.target.value) || 0.12)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Elite Count</span>
                <input type="number" min="1" max="20" className={inputClass} value={prefs.eliteCount} onChange={(e) => set("eliteCount", parseInt(e.target.value) || 5)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-600">Solutions</span>
                <input type="number" min="1" max="20" className={inputClass} value={prefs.solutionCount} onChange={(e) => set("solutionCount", parseInt(e.target.value) || 5)} />
              </label>
            </div>
          </div>
        </div>

        {/* ── Notification & UI Settings ──────────── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-4 w-4 text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Notifications & UI</h4>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Enable Notifications</span>
              <button type="button" onClick={() => set("enableNotifications", !prefs.enableNotifications)}
                className={`relative h-6 w-11 rounded-full transition-colors ${prefs.enableNotifications ? "bg-emerald-500" : "bg-slate-300"}`}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${prefs.enableNotifications ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-600">Auto-Save Interval (minutes)</span>
              <input type="number" min="1" max="30" className={inputClass} value={prefs.autoSaveInterval} onChange={(e) => set("autoSaveInterval", parseInt(e.target.value) || 5)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-600">Theme</span>
              <select className={inputClass} value={prefs.theme} onChange={(e) => set("theme", e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark (coming soon)</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
