import { motion } from "framer-motion";
import { BarChart3, Brain, Calendar, Database, Home, LineChart, Lock, Settings, ShieldAlert, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, adminOnly: false },
  { id: "data", label: "Data Management", icon: Database, adminOnly: true },
  { id: "timetable", label: "Timetable", icon: Calendar, adminOnly: false },
  { id: "ai", label: "AI Insights", icon: Brain, adminOnly: false },
  { id: "analytics", label: "Analytics", icon: BarChart3, adminOnly: false },
  { id: "predictions", label: "Predictions", icon: ShieldAlert, adminOnly: false },
  { id: "convergence", label: "GA Progress", icon: LineChart, adminOnly: false },
  { id: "settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function Sidebar({ activeSection, onNavigate, isAdmin, onLogout }) {
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <motion.nav initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex flex-col w-[260px] shrink-0 sticky top-4 h-[calc(100vh-32px)] ml-4 bg-white rounded-3xl border border-slate-100 p-5 gap-1 shadow-sm">

      {/* ── Brand ──────────────────────────── */}
      <div className="px-3 py-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-800 flex items-center justify-center">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-800 tracking-tight">Academy</span>
            {isAdmin && (
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Admin</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────── */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider mb-2 mt-2 uppercase">Menu</p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 rounded-[14px] px-4 py-3 text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-primary-800 text-white shadow-md shadow-primary-800/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}>
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
              {item.adminOnly && !isActive && (
                <Lock className="h-3.5 w-3.5 ml-auto text-slate-300 shrink-0" />
              )}
            </button>
          );
        })}

        <div className="pt-2 mt-2 border-t border-slate-100/50">
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-[14px] px-4 py-3 text-[13px] font-semibold transition-all duration-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="h-5 w-5 shrink-0 text-rose-400" />
            <span className="truncate">Logout</span>
          </button>
        </div>
      </div>

      {/* ── Theme Toggle ───────────────────── */}
      <div className="border-t border-slate-100 pt-3 mt-2">
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Footer ─────────────────────────── */}
      <div className="mt-4">
        <div className={`relative overflow-hidden rounded-2xl p-5 ${isAdmin ? "bg-amber-900" : "bg-[#114b32]"}`}>
          {/* Subtle decoration */}
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/20 blur-2xl"></div>
          
          <div className="relative z-10 flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{isAdmin ? "A" : "S"}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-tight">
                {isAdmin ? "Admin Mode" : "Smart System"}
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">
                {isAdmin ? "Full privileges" : "AI capabilities active"}
              </p>
            </div>
          </div>
          
          <button className={`w-full relative z-10 mt-2 rounded-xl py-2.5 text-[11px] font-bold text-white transition-colors ${isAdmin ? "bg-amber-600 hover:bg-amber-500" : "bg-primary-600 hover:bg-primary-500"}`}>
            View Details
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
