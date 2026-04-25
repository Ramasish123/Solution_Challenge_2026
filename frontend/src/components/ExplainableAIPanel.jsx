import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Shield, Zap, BarChart3 } from "lucide-react";

function MetricCard({ label, value, suffix, icon: Icon, positive }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-800">{value}{suffix}</span>
        {positive !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${positive ? "text-emerald-600" : "text-rose-500"}`}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "Improved" : "Degraded"}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function ExplainableAIPanel({ explanation, baselineMetrics }) {
  if (!explanation) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6" id="explainable-ai-panel">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-2xl bg-primary-100 p-3 text-primary-600">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Explainable AI</p>
          <h3 className="mt-1 text-xl font-bold text-slate-800">Why This Timetable?</h3>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <MetricCard label="Clash Reduction" value={explanation.conflict_reduction_percent} suffix="%" icon={Shield}
          positive={explanation.conflict_reduction_percent > 0} />
        <MetricCard label="Utilization Change" value={(explanation.utilization_improvement > 0 ? "+" : "") + explanation.utilization_improvement}
          suffix="%" icon={BarChart3} positive={explanation.utilization_improvement >= 0} />
        <MetricCard label="Workload Balance" value={explanation.workload_balance_score} suffix="/100" icon={Zap}
          positive={explanation.workload_balance_score >= 70} />
        <MetricCard label="Constraint Satisfaction" value={explanation.constraint_satisfaction_rate} suffix="%" icon={Shield}
          positive={explanation.constraint_satisfaction_rate >= 95} />
      </div>

      {baselineMetrics && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">vs Random Baseline</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Baseline Conflicts</p>
              <p className="text-slate-800 font-semibold mt-1">{baselineMetrics.conflict_count}</p>
            </div>
            <div>
              <p className="text-slate-500">Baseline Utilization</p>
              <p className="text-slate-800 font-semibold mt-1">{baselineMetrics.utilization_percent}%</p>
            </div>
            <div>
              <p className="text-slate-500">Baseline Fitness</p>
              <p className="text-slate-800 font-semibold mt-1">{baselineMetrics.fitness}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
