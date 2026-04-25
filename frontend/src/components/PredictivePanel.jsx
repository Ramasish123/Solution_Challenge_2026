import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, TrendingUp } from "lucide-react";
import { fetchFacultyRisk } from "../lib/api";

const riskColors = {
  high: "border-rose-200 bg-rose-50",
  medium: "border-amber-200 bg-amber-50",
  low: "border-emerald-200 bg-emerald-50",
};
const riskBadge = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};
const riskBarColor = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export function PredictivePanel() {
  const [risks, setRisks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchFacultyRisk()
      .then((d) => { setRisks(d.risks || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6" id="predictive-panel">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-2xl bg-primary-100 p-3 text-primary-600"><ShieldAlert className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Predictive Intelligence</p>
          <h3 className="mt-1 text-xl font-bold text-slate-800">Faculty Absence Risk</h3>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {risks.map((r) => (
          <motion.div key={r.faculty_id} whileHover={{ scale: 1.02 }}
            className={`rounded-xl border p-4 transition ${riskColors[r.risk_level]}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-800 text-sm">{r.faculty_name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${riskBadge[r.risk_level]}`}>{r.risk_level}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{r.department}</p>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                <span>Risk Score</span>
                <span>{(r.predicted_risk_score * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${riskBarColor[r.risk_level]}`}
                  style={{ width: `${Math.min(r.predicted_risk_score * 100 * 5, 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
              <div><span className="text-slate-400 font-medium">Total Leaves</span><p className="text-slate-800 font-semibold">{r.total_leaves}</p></div>
              <div><span className="text-slate-400 font-medium">Recent</span><p className="text-slate-800 font-semibold">{r.recent_leaves}</p></div>
            </div>
            {r.risk_level === "high" && (
              <p className="text-[10px] text-rose-600 font-medium mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />High absence probability — avoid critical slots
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
