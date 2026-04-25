import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const heatColor = (value) => {
  if (value >= 80) return "bg-rose-100 border-rose-200 text-rose-700";
  if (value >= 50) return "bg-amber-50 border-amber-200 text-amber-700";
  if (value >= 20) return "bg-primary-50 border-primary-200 text-primary-700";
  return "bg-slate-50 border-slate-200 text-slate-500";
};

export function AnalyticsPanel({ analytics }) {
  if (!analytics) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Faculty Workload</p>
            <h3 className="mt-2 text-xl font-bold text-slate-800">Load balance across teaching staff</h3>
          </div>
        </div>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.faculty_workload}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="faculty_name" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="assigned_hours" radius={[8, 8, 0, 0]}>
                {analytics.faculty_workload.map((entry) => (
                  <Cell
                    key={entry.faculty_name}
                    fill={entry.assigned_hours > entry.max_hours * 0.8 ? "#ef4444" : "#6366f1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Room Heatmap</p>
        <h3 className="mt-2 text-xl font-bold text-slate-800">Usage intensity by day and timeslot</h3>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {analytics.room_heatmap.map((cell) => (
            <div key={`${cell.day}-${cell.hour}`} className={`rounded-xl border p-4 ${heatColor(cell.utilization)}`}>
              <p className="text-xs font-medium uppercase tracking-wider">{cell.day}</p>
              <p className="mt-2 text-sm font-semibold">{cell.hour}</p>
              <p className="mt-3 text-2xl font-bold">{cell.utilization}%</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
